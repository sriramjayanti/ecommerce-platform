import { InventoryLog, ProductVariant } from '@ecommerce/shared';
import { db } from './db';

export class InventoryService {
  /**
   * Atomically verifies and deducts stock for an array of items.
   * If any item has insufficient stock, throws an error and rejects entire operation.
   */
  public static async deductStockForOrder(
    items: { productId: string; variantId: string; quantity: number }[],
    orderNumber: string,
    performedBy: string = 'system_order_deduction'
  ): Promise<void> {
    // Phase 1: Verify all items have sufficient stock
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found during stock verification`);
      }
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new Error(`Variant ${item.variantId} not found on product ${product.title}`);
      }

      if (variant.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.title} (${variant.name})". Requested: ${item.quantity}, Available: ${variant.stock}`
        );
      }
    }

    // Phase 2: Deduct stock and record audit log
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId)!;
      const variant = product.variants.find((v) => v.id === item.variantId)!;

      const previousStock = variant.stock;
      variant.stock -= item.quantity;
      product.updatedAt = new Date().toISOString();

      const log: InventoryLog = {
        id: `inv-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        variantId: variant.id,
        productName: product.title,
        variantName: variant.name,
        previousStock,
        change: -item.quantity,
        newStock: variant.stock,
        reason: 'order_sale',
        referenceId: orderNumber,
        createdBy: performedBy,
        createdAt: new Date().toISOString(),
      };

      db.inventoryLogs.unshift(log);
    }
    db.saveToDisk();
  }

  /**
   * Restores stock for cancelled order items safely
   */
  public static async restoreStockForOrder(
    items: { productId: string; variantId: string; quantity: number }[],
    orderNumber: string,
    reason: 'return_restock' | 'audit_correction' = 'return_restock',
    performedBy: string = 'system_order_cancellation'
  ): Promise<void> {
    for (const item of items) {
      const product = db.products.find((p) => p.id === item.productId);
      if (!product) continue;
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) continue;

      const previousStock = variant.stock;
      variant.stock += item.quantity;
      product.updatedAt = new Date().toISOString();

      const log: InventoryLog = {
        id: `inv-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        variantId: variant.id,
        productName: product.title,
        variantName: variant.name,
        previousStock,
        change: item.quantity,
        newStock: variant.stock,
        reason,
        referenceId: orderNumber,
        createdBy: performedBy,
        createdAt: new Date().toISOString(),
      };

      db.inventoryLogs.unshift(log);
    }
    db.saveToDisk();
  }

  /**
   * Manual stock adjustment by admin with audit reason
   */
  public static adjustStock(
    productId: string,
    variantId: string,
    delta: number,
    reason: 'manual_adjustment' | 'restock' | 'return_restock' | 'audit_correction',
    performedBy: string = 'admin'
  ): { variant: ProductVariant; log: InventoryLog } {
    const product = db.products.find((p) => p.id === productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    const previousStock = variant.stock;
    const newStock = previousStock + delta;
    if (newStock < 0) {
      throw new Error(`Stock cannot be reduced below 0 (Current: ${previousStock}, Requested delta: ${delta})`);
    }

    variant.stock = newStock;
    product.updatedAt = new Date().toISOString();

    const log: InventoryLog = {
      id: `inv-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      variantId: variant.id,
      productName: product.title,
      variantName: variant.name,
      previousStock,
      change: delta,
      newStock,
      reason,
      createdBy: performedBy,
      createdAt: new Date().toISOString(),
    };

    db.inventoryLogs.unshift(log);
    db.saveToDisk();

    return { variant, log };
  }

  /**
   * Set exact stock level directly with audit log
   */
  public static setStock(
    productId: string,
    variantId: string,
    newStock: number,
    reason: 'manual_adjustment' | 'restock' | 'return_restock' | 'audit_correction',
    performedBy: string = 'admin'
  ): { variant: ProductVariant; log: InventoryLog } {
    const product = db.products.find((p) => p.id === productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    if (newStock < 0) {
      throw new Error(`Stock cannot be less than 0 (Requested: ${newStock})`);
    }

    const previousStock = variant.stock;
    const delta = newStock - previousStock;
    variant.stock = newStock;
    product.updatedAt = new Date().toISOString();

    const log: InventoryLog = {
      id: `inv-log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      variantId: variant.id,
      productName: product.title,
      variantName: variant.name,
      previousStock,
      change: delta,
      newStock: variant.stock,
      reason,
      createdBy: performedBy,
      createdAt: new Date().toISOString(),
    };

    db.inventoryLogs.unshift(log);
    db.saveToDisk();

    return { variant, log };
  }
}
