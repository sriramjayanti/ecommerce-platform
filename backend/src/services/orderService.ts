import {
  Order,
  OrderItemSnapshot,
  OrderStatus,
  PaymentStatus,
  Address,
  resolveUnitPrice,
  calculateCartTotals,
} from '@ecommerce/shared';
import { db } from './db';
import { InventoryService } from './inventoryService';
import { PhonePeService } from './phonepeService';

export interface CreateOrderInput {
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: { productId: string; variantId: string; quantity: number }[];
  shippingAddress: Address;
  paymentMethod: 'online' | 'cod';
}

export class OrderService {
  /**
   * Authoritative server-side price calculation and order snapshot generator
   */
  public static calculateAuthoritativeOrder(
    itemsInput: { productId: string; variantId: string; quantity: number }[]
  ): {
    itemSnapshots: OrderItemSnapshot[];
    subtotal: number;
    totalMrp: number;
    totalSavings: number;
    deliveryCharge: number;
    taxAmount: number;
    finalTotal: number;
  } {
    const isWholesaleEnabled = db.settings.featureFlags.wholesalePricing;
    const itemSnapshots: OrderItemSnapshot[] = [];
    let subtotal = 0;
    let totalMrp = 0;

    for (const item of itemsInput) {
      if (item.quantity <= 0) {
        throw new Error(`Quantity must be >= 1`);
      }

      const product = db.products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found`);
      }

      if (variant.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${product.title} (${variant.name}). Only ${variant.stock} available.`
        );
      }

      const { unitPrice, appliedTier } = resolveUnitPrice(
        variant,
        item.quantity,
        isWholesaleEnabled && product.isWholesaleEnabled
      );

      const lineTotal = unitPrice * item.quantity;
      const mrpTotal = variant.mrp * item.quantity;
      const savings = Math.max(0, mrpTotal - lineTotal);

      subtotal += lineTotal;
      totalMrp += mrpTotal;

      itemSnapshots.push({
        productId: product.id,
        variantId: variant.id,
        title: product.title,
        variantName: variant.name,
        sku: variant.sku,
        image: variant.images?.[0] || product.images?.[0] || '',
        quantity: item.quantity,
        unitPrice,
        basePrice: variant.basePrice,
        mrp: variant.mrp,
        lineTotal,
        savings,
        appliedTierLabel: appliedTier?.label,
      });
    }

    const totalSavings = Math.max(0, totalMrp - subtotal);
    const deliveryCharge =
      subtotal >= db.settings.freeDeliveryThreshold || subtotal === 0 ? 0 : db.settings.deliveryCharge;
    const taxAmount = Math.round((subtotal * (db.settings.taxPercentage || 0)) / 100);
    const finalTotal = subtotal + deliveryCharge;

    return {
      itemSnapshots,
      subtotal,
      totalMrp,
      totalSavings,
      deliveryCharge,
      taxAmount,
      finalTotal,
    };
  }

  /**
   * Creates an order with pending payment and initiates PhonePe transaction if online
   */
  public static async createOrder(input: CreateOrderInput): Promise<{
    order: Order;
    paymentUrl?: string;
    paymentRecord?: any;
  }> {
    const calc = this.calculateAuthoritativeOrder(input.items);

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const order: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      userId: input.userId || 'guest',
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      items: calc.itemSnapshots,
      shippingAddress: input.shippingAddress,
      subtotal: calc.subtotal,
      totalMrp: calc.totalMrp,
      totalSavings: calc.totalSavings,
      deliveryCharge: calc.deliveryCharge,
      taxAmount: calc.taxAmount,
      discountAmount: 0,
      finalTotal: calc.finalTotal,
      paymentMethod: input.paymentMethod,
      paymentStatus: input.paymentMethod === 'cod' ? 'pending' : 'initiated',
      orderStatus: 'Placed',
      statusHistory: [
        {
          status: 'Placed',
          timestamp: new Date().toISOString(),
          note: 'Order placed by customer',
          updatedBy: input.customerName,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.orders.unshift(order);

    if (input.paymentMethod === 'online') {
      const { paymentRecord, redirectUrl } = await PhonePeService.initiatePayment(
        order.id,
        order.finalTotal,
        order.customerPhone,
        order.userId
      );
      order.paymentId = paymentRecord.id;
      return { order, paymentUrl: redirectUrl, paymentRecord };
    } else {
      // COD: Deduct stock immediately
      await InventoryService.deductStockForOrder(
        input.items,
        order.orderNumber,
        'cod_order_placement'
      );
      return { order };
    }
  }

  /**
   * Finalizes order upon verified PhonePe payment confirmation
   */
  public static async finalizePaymentAndOrder(
    merchantTransactionId: string,
    verifiedStatus: 'successful' | 'failed' | 'cancelled',
    phonepeTxnId?: string
  ): Promise<Order> {
    const payment = PhonePeService.updatePaymentResult(
      merchantTransactionId,
      verifiedStatus,
      phonepeTxnId
    );

    const order = db.orders.find((o) => o.id === payment.orderId);
    if (!order) {
      throw new Error(`Order with ID ${payment.orderId} not found for payment ${merchantTransactionId}`);
    }

    order.paymentStatus = verifiedStatus;
    order.updatedAt = new Date().toISOString();

    if (verifiedStatus === 'successful') {
      order.orderStatus = 'Confirmed';
      order.statusHistory.push({
        status: 'Confirmed',
        timestamp: new Date().toISOString(),
        note: `Payment verified via PhonePe (Ref: ${phonepeTxnId || merchantTransactionId})`,
        updatedBy: 'system_phonepe_webhook',
      });

      // Deduct stock safely inside transaction
      await InventoryService.deductStockForOrder(
        order.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        order.orderNumber,
        'phonepe_verified_payment'
      );
    } else {
      order.orderStatus = 'Cancelled';
      order.statusHistory.push({
        status: 'Cancelled',
        timestamp: new Date().toISOString(),
        note: `Payment ${verifiedStatus} by user or gateway`,
        updatedBy: 'system_phonepe_webhook',
      });
    }

    return order;
  }

  /**
   * Updates fulfillment status (Admin action)
   */
  public static updateFulfillmentStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    updatedBy: string = 'admin'
  ): Order {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    order.orderStatus = newStatus;
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${newStatus}`,
      updatedBy,
    });
    order.updatedAt = new Date().toISOString();

    return order;
  }

  /**
   * Generates WhatsApp direct support message link
   */
  public static getWhatsAppSupportUrl(order: Order): string {
    const text = `Hello *${db.settings.storeName}*, I need assistance with my Order *#${order.orderNumber}* (Total: ₹${order.finalTotal}). Current status is *${order.orderStatus}*.`;
    const cleanPhone = db.settings.whatsappNumber.replace(/\D/g, '');
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }
}
