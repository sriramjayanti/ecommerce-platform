import {
  Order,
  OrderItemSnapshot,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
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
  paymentMethod: PaymentMethod;
  fulfillmentMethod?: 'home_delivery' | 'takeaway';
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
    if (!input.customerName || !input.customerPhone) {
      throw new Error('Customer name and phone number are required.');
    }

    if (!input.items || input.items.length === 0) {
      throw new Error('Cannot place an order with an empty cart.');
    }

    const calc = this.calculateAuthoritativeOrder(input.items);

    const isTakeaway = input.fulfillmentMethod === 'takeaway';
    const effectiveDeliveryCharge = isTakeaway ? 0 : calc.deliveryCharge;
    const effectiveFinalTotal = calc.subtotal + effectiveDeliveryCharge;

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    const isCod = input.paymentMethod === 'cod';

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
      deliveryCharge: effectiveDeliveryCharge,
      taxAmount: calc.taxAmount,
      discountAmount: 0,
      finalTotal: effectiveFinalTotal,
      paymentMethod: input.paymentMethod,
      paymentStatus: isCod ? 'pending' : 'initiated',
      fulfillmentMethod: input.fulfillmentMethod || 'home_delivery',
      stockDeducted: false,
      orderStatus: 'Placed',
      statusHistory: [
        {
          status: 'Placed',
          timestamp: new Date().toISOString(),
          note: isTakeaway ? 'Order placed by customer (Takeaway / Store Pickup)' : 'Order placed by customer (Home Delivery)',
          updatedBy: input.customerName,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isCod) {
      // COD: Deduct stock immediately
      await InventoryService.deductStockForOrder(
        input.items,
        order.orderNumber,
        'cod_order_placement'
      );
      order.stockDeducted = true;
      db.orders.unshift(order);
      db.saveToDisk();
      return { order };
    } else {
      // Online payment method (UPI, Card, Netbanking, etc.)
      const { paymentRecord, redirectUrl } = await PhonePeService.initiatePayment(
        order.id,
        order.finalTotal,
        order.customerPhone,
        order.userId
      );
      order.paymentId = paymentRecord.id;
      db.orders.unshift(order);
      db.saveToDisk();
      return { order, paymentUrl: redirectUrl, paymentRecord };
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
        note: `Payment verified via Gateway (Ref: ${phonepeTxnId || merchantTransactionId})`,
        updatedBy: 'system_payment_webhook',
      });

      // Deduct stock safely inside transaction if not already deducted
      if (!order.stockDeducted) {
        await InventoryService.deductStockForOrder(
          order.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
          order.orderNumber,
          'online_verified_payment'
        );
        order.stockDeducted = true;
      }
    } else {
      order.orderStatus = 'Cancelled';
      order.statusHistory.push({
        status: 'Cancelled',
        timestamp: new Date().toISOString(),
        note: `Payment ${verifiedStatus} by user or gateway`,
        updatedBy: 'system_payment_webhook',
      });
    }

    db.saveToDisk();
    return order;
  }

  /**
   * Updates fulfillment status (Admin action)
   */
  public static async updateFulfillmentStatus(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    updatedBy: string = 'admin'
  ): Promise<Order> {
    const order = db.orders.find((o) => o.id === orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = newStatus;
    order.statusHistory.push({
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${newStatus}`,
      updatedBy,
    });
    order.updatedAt = new Date().toISOString();

    // If order is cancelled, safely restore stock if it was previously deducted
    if (newStatus === 'Cancelled' && previousStatus !== 'Cancelled' && order.stockDeducted) {
      await InventoryService.restoreStockForOrder(
        order.items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        order.orderNumber,
        'return_restock',
        `admin_status_update_${updatedBy}`
      );
      order.stockDeducted = false;
    }

    db.saveToDisk();
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
