import {
  Product,
  Category,
  Order,
  InventoryLog,
  Banner,
  StoreSettings,
  OrderStatus,
  Address,
} from './types';
import { DEFAULT_STORE_SETTINGS } from './constants';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_BANNERS,
} from './catalogData';

type SyncEventType =
  | 'products_updated'
  | 'categories_updated'
  | 'orders_updated'
  | 'order_placed'
  | 'inventory_updated'
  | 'banners_updated'
  | 'settings_updated';

interface SyncMessage {
  type: SyncEventType;
  timestamp: number;
  payload?: any;
}


const memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStorage[key] ?? null;
    }
  }
  return memoryStorage[key] ?? null;
}

function safeSetItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(key, value);
      memoryStorage[key] = value;
      return;
    } catch {}
  }
  memoryStorage[key] = value;
}

function safeRemoveItem(key: string): void {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(key);
      delete memoryStorage[key];
      return;
    } catch {}
  }
  delete memoryStorage[key];
}

class UnifiedDataStore {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: SyncMessage) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('dailyfresh_ecommerce_sync');
        this.channel.onmessage = (event) => {
          if (event.data) {
            this.notifyListeners(event.data);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel initialization error:', e);
      }

      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('dailyfresh_')) {
          this.notifyListeners({
            type: 'products_updated',
            timestamp: Date.now(),
          });
        }
      });
    }

    // Ensure initial seeding in localStorage if not present
    this.ensureSeeded();
  }

  private ensureSeeded() {
    if (typeof window === 'undefined') return;

    if (!safeGetItem('dailyfresh_products')) {
      safeSetItem('dailyfresh_products', JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!safeGetItem('dailyfresh_categories')) {
      safeSetItem('dailyfresh_categories', JSON.stringify(INITIAL_CATEGORIES));
    }
    if (!safeGetItem('dailyfresh_banners')) {
      safeSetItem('dailyfresh_banners', JSON.stringify(INITIAL_BANNERS));
    }
    if (!safeGetItem('dailyfresh_settings')) {
      safeSetItem('dailyfresh_settings', JSON.stringify(DEFAULT_STORE_SETTINGS));
    }
    if (!safeGetItem('dailyfresh_orders')) {
      // Seed initial demo order
      const initialOrders: Order[] = [
        {
          id: 'ord-1001',
          orderNumber: 'DFW-902144',
          userId: 'user-customer-2',
          customerName: 'Amit Verma',
          customerPhone: '+919834567890',
          customerEmail: 'amit.verma@example.com',
          items: [
            {
              productId: 'prod-anc-headphones',
              variantId: 'var-anc-black',
              title: 'SonicPro Pulse Hybrid ANC Wireless Headphones',
              variantName: 'Midnight Matte Black',
              sku: 'SP-ANC-BLK',
              image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700',
              quantity: 2,
              unitPrice: 2499,
              basePrice: 2499,
              mrp: 6999,
              lineTotal: 4998,
              savings: 9000,
              appliedTierLabel: 'Retail Unit Price',
            },
          ],
          shippingAddress: {
            id: 'addr-1',
            userId: 'user-customer-2',
            fullName: 'Amit Verma',
            phone: '+919834567890',
            line1: 'B-402, Prestige Tower, MG Road',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560001',
            addressType: 'work',
            isDefault: true,
          },
          subtotal: 4998,
          totalMrp: 13998,
          totalSavings: 9000,
          deliveryCharge: 0,
          taxAmount: 0,
          discountAmount: 0,
          finalTotal: 4998,
          paymentMethod: 'upi',
          paymentStatus: 'successful',
          paymentId: 'UPI-TXN-8849201',
          orderStatus: 'Confirmed',
          statusHistory: [
            { status: 'Placed', timestamp: new Date(Date.now() - 3600000).toISOString(), note: 'Order placed via UPI' },
            { status: 'Confirmed', timestamp: new Date(Date.now() - 1800000).toISOString(), note: 'Payment verified' },
          ],
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ];
      safeSetItem('dailyfresh_orders', JSON.stringify(initialOrders));
    }
    if (!safeGetItem('dailyfresh_inventory_logs')) {
      const initialLogs: InventoryLog[] = [
        {
          id: 'log-1',
          productId: 'prod-anc-headphones',
          variantId: 'var-anc-black',
          productName: 'SonicPro Pulse Hybrid ANC Wireless Headphones',
          variantName: 'Midnight Matte Black',
          previousStock: 45,
          change: -2,
          newStock: 43,
          reason: 'order_sale',
          referenceId: 'DFW-902144',
          createdBy: 'Customer Checkout',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      safeSetItem('dailyfresh_inventory_logs', JSON.stringify(initialLogs));
    }
  }

  public broadcast(type: SyncEventType, payload?: any) {
    const msg: SyncMessage = { type, timestamp: Date.now(), payload };
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (e) {
        console.warn('BroadcastChannel send error:', e);
      }
    }
    this.notifyListeners(msg);
  }

  public subscribe(listener: (event: SyncMessage) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(msg: SyncMessage) {
    this.listeners.forEach((fn) => {
      try {
        fn(msg);
      } catch (err) {
        console.error('Error in sync listener', err);
      }
    });
  }

  // ------------------- SAFE HTTP FETCH WRAPPER -------------------
  private async safeApiFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options?.headers as Record<string, string>) || {}),
      };
      const adminToken = safeGetItem('dailyfresh_admin_token');
      if (adminToken && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      const res = await fetch(url, { ...options, headers });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        return json as T;
      }
    } catch {
      // Backend unavailable or returned HTML error
    }
    return null;
  }

  // ------------------- PRODUCTS -------------------
  public async getProducts(): Promise<Product[]> {
    const apiRes = await this.safeApiFetch<{ success: boolean; data: Product[] }>('/api/products');
    if (apiRes && apiRes.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
      safeSetItem('dailyfresh_products', JSON.stringify(apiRes.data));
      return apiRes.data;
    }

    try {
      const raw = safeGetItem('dailyfresh_products');
      if (raw) return JSON.parse(raw);
    } catch {}

    return INITIAL_PRODUCTS;
  }

  public async getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
    const products = await this.getProducts();
    const found = products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    return found || null;
  }

  public async saveProduct(productData: Partial<Product>): Promise<{ success: boolean; data: Product; error?: string }> {
    // Try backend first
    const isEdit = !!productData.id;
    const url = isEdit ? `/api/products/${productData.id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';

    const apiRes = await this.safeApiFetch<{ success: boolean; data: Product; error?: string }>(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });

    if (apiRes && apiRes.success && apiRes.data) {
      const products = await this.getProducts();
      const idx = products.findIndex((p) => p.id === apiRes.data.id);
      if (idx !== -1) {
        products[idx] = apiRes.data;
      } else {
        products.unshift(apiRes.data);
      }
      safeSetItem('dailyfresh_products', JSON.stringify(products));
      this.broadcast('products_updated', apiRes.data);
      return apiRes;
    }

    // Client-side fallback
    const products = await this.getProducts();
    let saved: Product;

    if (isEdit) {
      const idx = products.findIndex((p) => p.id === productData.id);
      if (idx === -1) {
        return { success: false, data: null as any, error: 'Product not found' };
      }
      saved = {
        ...products[idx],
        ...productData,
        updatedAt: new Date().toISOString(),
      } as Product;
      products[idx] = saved;
    } else {
      const newId = `prod-${Date.now()}`;
      const slug = productData.slug || (productData.title || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      saved = {
        id: newId,
        slug,
        title: productData.title || 'New Product',
        description: productData.description || '',
        categoryId: productData.categoryId || 'cat-groceries',
        subcategoryId: productData.subcategoryId || '',
        brand: productData.brand || 'DailyMart',
        images: productData.images && productData.images.length > 0 ? productData.images : ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=700'],
        variants: productData.variants && productData.variants.length > 0 ? productData.variants : [
          {
            id: `var-${Date.now()}`,
            name: 'Standard Pack',
            sku: `SKU-${Date.now().toString().slice(-6)}`,
            weightOrSize: '1 unit',
            mrp: 199,
            basePrice: 149,
            stock: 50,
            lowStockThreshold: 10,
            pricingTiers: [{ id: 't1', minQty: 1, maxQty: null, unitPrice: 149, label: 'Standard Price' }],
          },
        ],
        isWholesaleEnabled: productData.isWholesaleEnabled ?? true,
        isFeatured: productData.isFeatured ?? true,
        rating: 4.8,
        reviewCount: 1,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...productData,
      } as Product;
      products.unshift(saved);
    }

    safeSetItem('dailyfresh_products', JSON.stringify(products));
    this.broadcast('products_updated', saved);
    return { success: true, data: saved };
  }

  public async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    await this.safeApiFetch(`/api/products/${id}`, { method: 'DELETE' });

    const products = await this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    safeSetItem('dailyfresh_products', JSON.stringify(filtered));
    this.broadcast('products_updated', { id });
    return { success: true };
  }

  // ------------------- CATEGORIES -------------------
  public async getCategories(): Promise<Category[]> {
    const apiRes = await this.safeApiFetch<{ success: boolean; data: Category[] }>('/api/categories');
    if (apiRes && apiRes.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
      safeSetItem('dailyfresh_categories', JSON.stringify(apiRes.data));
      return apiRes.data;
    }

    try {
      const raw = safeGetItem('dailyfresh_categories');
      if (raw) return JSON.parse(raw);
    } catch {}

    return INITIAL_CATEGORIES;
  }

  public async saveCategory(categoryData: Partial<Category>): Promise<{ success: boolean; data: Category; error?: string }> {
    if (!categoryData.name || !categoryData.name.trim()) {
      return { success: false, data: null as any, error: 'Category name is required' };
    }

    const categories = await this.getCategories();
    // Prevent accidental duplicate categories
    const duplicate = categories.find(
      (c) =>
        c.name.trim().toLowerCase() === categoryData.name!.trim().toLowerCase() &&
        c.id !== categoryData.id
    );
    if (duplicate) {
      return {
        success: false,
        data: null as any,
        error: `A category named "${duplicate.name}" already exists.`,
      };
    }

    const isEdit = !!categoryData.id;
    const url = isEdit ? `/api/categories/${categoryData.id}` : '/api/categories';
    const method = isEdit ? 'PUT' : 'POST';

    const apiRes = await this.safeApiFetch<{ success: boolean; data: Category; error?: string }>(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });

    if (apiRes && apiRes.success && apiRes.data) {
      const idx = categories.findIndex((c) => c.id === apiRes.data.id);
      if (idx !== -1) {
        categories[idx] = apiRes.data;
      } else {
        categories.push(apiRes.data);
      }
      safeSetItem('dailyfresh_categories', JSON.stringify(categories));
      this.broadcast('categories_updated', apiRes.data);
      return apiRes;
    }

    // Client-side fallback
    let saved: Category;

    if (isEdit) {
      const idx = categories.findIndex((c) => c.id === categoryData.id);
      if (idx === -1) {
        return { success: false, data: null as any, error: 'Category not found' };
      }
      saved = {
        ...categories[idx],
        ...categoryData,
        name: categoryData.name.trim(),
      } as Category;
      categories[idx] = saved;
    } else {
      const newId = `cat-${Date.now()}`;
      const slug = categoryData.slug || categoryData.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      saved = {
        id: newId,
        name: categoryData.name.trim(),
        slug,
        image: categoryData.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
        sortOrder: categoryData.sortOrder || categories.length + 1,
        isVisible: true,
        subcategories: categoryData.subcategories || [],
        ...categoryData,
      };
      categories.push(saved);
    }

    safeSetItem('dailyfresh_categories', JSON.stringify(categories));
    this.broadcast('categories_updated', saved);
    return { success: true, data: saved };
  }

  public async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    const products = await this.getProducts();
    const hasAssignedProducts = products.some((p) => p.categoryId === id && p.status === 'active');
    if (hasAssignedProducts) {
      return {
        success: false,
        error: 'Cannot delete category: active products are still assigned to this category. Reassign or archive those products first.',
      };
    }

    await this.safeApiFetch(`/api/categories/${id}`, { method: 'DELETE' });

    const categories = await this.getCategories();
    const filtered = categories.filter((c) => c.id !== id);
    safeSetItem('dailyfresh_categories', JSON.stringify(filtered));
    this.broadcast('categories_updated', { id });
    return { success: true };
  }

  // ------------------- INVENTORY & STOCK -------------------
  public async getInventoryLogs(): Promise<InventoryLog[]> {
    const apiRes = await this.safeApiFetch<{ success: boolean; data: InventoryLog[] }>('/api/inventory/logs');
    if (apiRes && apiRes.success && Array.isArray(apiRes.data)) {
      safeSetItem('dailyfresh_inventory_logs', JSON.stringify(apiRes.data));
      return apiRes.data;
    }

    try {
      const raw = safeGetItem('dailyfresh_inventory_logs');
      if (raw) return JSON.parse(raw);
    } catch {}

    return [];
  }

  public async adjustStock(
    productId: string,
    variantId: string,
    newStock: number,
    reason: any = 'manual_adjustment',
    createdBy: string = 'Admin Staff'
  ): Promise<{ success: boolean; error?: string }> {
    const payload = { productId, variantId, newStock, reason };
    await this.safeApiFetch('/api/inventory/adjust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const products = await this.getProducts();
    const product = products.find((p) => p.id === productId);
    if (!product) return { success: false, error: 'Product not found' };

    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) return { success: false, error: 'Variant not found' };

    const prevStock = variant.stock;
    const change = newStock - prevStock;
    variant.stock = Math.max(0, newStock);

    safeSetItem('dailyfresh_products', JSON.stringify(products));

    // Append log
    const logs = await this.getInventoryLogs();
    const newLog: InventoryLog = {
      id: `log-${Date.now()}`,
      productId,
      variantId,
      productName: product.title,
      variantName: variant.name,
      previousStock: prevStock,
      change,
      newStock: Math.max(0, newStock),
      reason,
      createdBy,
      createdAt: new Date().toISOString(),
    };
    logs.unshift(newLog);
    safeSetItem('dailyfresh_inventory_logs', JSON.stringify(logs.slice(0, 100)));

    this.broadcast('inventory_updated', { productId, variantId, newStock });
    this.broadcast('products_updated', product);
    return { success: true };
  }

  public async updateStock(
    productId: string,
    variantId: string,
    newStock: number,
    reason: any = 'manual_adjustment',
    createdBy: string = 'Admin Staff'
  ): Promise<{ success: boolean; error?: string }> {
    return this.adjustStock(productId, variantId, newStock, reason, createdBy);
  }

  public async bulkRestock(amount: number = 100): Promise<{ success: boolean; count: number }> {
    await this.safeApiFetch('/api/inventory/bulk-restock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    });

    const products = await this.getProducts();
    let count = 0;
    const logs = await this.getInventoryLogs();

    for (const prod of products) {
      for (const v of prod.variants) {
        if (v.stock <= v.lowStockThreshold) {
          const prev = v.stock;
          v.stock += amount;
          count++;
          logs.unshift({
            id: `log-${Date.now()}-${count}`,
            productId: prod.id,
            variantId: v.id,
            productName: prod.title,
            variantName: v.name,
            previousStock: prev,
            change: amount,
            newStock: v.stock,
            reason: 'restock',
            createdBy: 'Admin Bulk Restock',
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    safeSetItem('dailyfresh_products', JSON.stringify(products));
    safeSetItem('dailyfresh_inventory_logs', JSON.stringify(logs.slice(0, 100)));
    this.broadcast('inventory_updated', { bulkAmount: amount });
    this.broadcast('products_updated');
    return { success: true, count };
  }

  // ------------------- ORDERS -------------------
  public async getOrders(): Promise<Order[]> {
    const apiRes = await this.safeApiFetch<{ success: boolean; data: Order[] }>('/api/orders');
    if (apiRes && apiRes.success && Array.isArray(apiRes.data) && apiRes.data.length > 0) {
      safeSetItem('dailyfresh_orders', JSON.stringify(apiRes.data));
      return apiRes.data;
    }

    try {
      const raw = safeGetItem('dailyfresh_orders');
      if (raw) return JSON.parse(raw);
    } catch {}

    return [];
  }

  public async getOrderById(orderIdOrNumber: string): Promise<Order | null> {
    const orders = await this.getOrders();
    const found = orders.find((o) => o.id === orderIdOrNumber || o.orderNumber === orderIdOrNumber);
    return found || null;
  }

  public async placeOrder(payload: {
    userId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    items: { productId: string; variantId: string; quantity: number }[];
    shippingAddress: Address;
    paymentMethod: 'online' | 'cod' | 'upi' | 'card' | 'netbanking' | string;
    fulfilmentMethod?: 'delivery' | 'takeaway';
    paymentDetails?: any;
  }): Promise<{ success: boolean; data: { order: Order; paymentUrl?: string }; error?: string }> {
    // 1. Validate stock availability before processing order
    const products = await this.getProducts();
    for (const itemReq of payload.items) {
      const prod = products.find((p) => p.id === itemReq.productId);
      if (!prod) {
        return { success: false, data: null as any, error: `Product not found: ${itemReq.productId}` };
      }
      const variant = prod.variants.find((v) => v.id === itemReq.variantId) || prod.variants[0];
      if (!variant) {
        return { success: false, data: null as any, error: `Product variant not found: ${itemReq.variantId}` };
      }
      if (variant.stock < itemReq.quantity) {
        return {
          success: false,
          data: null as any,
          error: `Insufficient stock for "${prod.title}" (${variant.name}). Only ${variant.stock} available in inventory.`,
        };
      }
    }

    // Try backend first
    const apiRes = await this.safeApiFetch<{
      success: boolean;
      data: { order: Order; paymentUrl?: string };
      error?: string;
    }>('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (apiRes && apiRes.success && apiRes.data && apiRes.data.order) {
      // Sync to local orders
      const orders = await this.getOrders();
      orders.unshift(apiRes.data.order);
      safeSetItem('dailyfresh_orders', JSON.stringify(orders));
      this.broadcast('order_placed', apiRes.data.order);
      this.broadcast('orders_updated');
      this.broadcast('inventory_updated');
      this.broadcast('products_updated');
      return apiRes;
    }

    // Client-side fallback: Build order accurately and decrement stock
    const orderItems: any[] = [];
    let subtotal = 0;
    let totalMrp = 0;
    const inventoryLogs = await this.getInventoryLogs();

    for (const itemReq of payload.items) {
      const prod = products.find((p) => p.id === itemReq.productId)!;
      const variant = prod.variants.find((v) => v.id === itemReq.variantId) || prod.variants[0];

      // Decrement stock
      const prevStock = variant.stock;
      variant.stock = Math.max(0, variant.stock - itemReq.quantity);

      inventoryLogs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: prod.id,
        variantId: variant.id,
        productName: prod.title,
        variantName: variant.name,
        previousStock: prevStock,
        change: -itemReq.quantity,
        newStock: variant.stock,
        reason: 'order_sale',
        createdBy: 'Customer Checkout',
        createdAt: new Date().toISOString(),
      });

      // Price calculation
      let unitPrice = variant.basePrice;
      let appliedTierLabel = 'Retail Price';

      if (prod.isWholesaleEnabled && variant.pricingTiers && variant.pricingTiers.length > 0) {
        for (const tier of variant.pricingTiers) {
          if (itemReq.quantity >= tier.minQty && (tier.maxQty === null || tier.maxQty === undefined || itemReq.quantity <= tier.maxQty)) {
            unitPrice = tier.unitPrice;
            appliedTierLabel = tier.label || `Wholesale Slab (${tier.minQty}+)`;
          }
        }
      }

      const lineTotal = unitPrice * itemReq.quantity;
      const lineMrp = (variant.mrp || variant.basePrice) * itemReq.quantity;
      subtotal += lineTotal;
      totalMrp += lineMrp;

      orderItems.push({
        productId: prod.id,
        variantId: variant.id,
        title: prod.title,
        variantName: variant.name,
        sku: variant.sku,
        image: prod.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700',
        quantity: itemReq.quantity,
        unitPrice,
        basePrice: variant.basePrice,
        mrp: variant.mrp || variant.basePrice,
        lineTotal,
        savings: Math.max(0, lineMrp - lineTotal),
        appliedTierLabel,
      });
    }

    // Save updated products with decremented stock
    safeSetItem('dailyfresh_products', JSON.stringify(products));
    safeSetItem('dailyfresh_inventory_logs', JSON.stringify(inventoryLogs.slice(0, 100)));

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `DFW-${randomSuffix}`;
    const orderId = `ord-${Date.now()}`;
    const isTakeaway = payload.fulfilmentMethod === 'takeaway';
    const deliveryCharge = isTakeaway ? 0 : (subtotal >= 499 ? 0 : 40);
    const finalTotal = subtotal + deliveryCharge;
    const totalSavings = Math.max(0, totalMrp - subtotal);

    const isCod = payload.paymentMethod === 'cod';
    const initialStatus: OrderStatus = isCod ? 'Placed' : 'Confirmed';

    const order: Order = {
      id: orderId,
      orderNumber,
      userId: payload.userId,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      customerEmail: payload.customerEmail,
      items: orderItems,
      shippingAddress: payload.shippingAddress,
      subtotal,
      totalMrp,
      totalSavings,
      deliveryCharge,
      taxAmount: 0,
      discountAmount: 0,
      finalTotal,
      paymentMethod: payload.paymentMethod as any,
      paymentStatus: isCod ? 'pending' : 'successful',
      paymentId: isCod ? undefined : `PAY-${payload.paymentMethod.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      fulfilmentMethod: payload.fulfilmentMethod || 'delivery',
      orderStatus: initialStatus,
      statusHistory: [
        {
          status: 'Placed',
          timestamp: new Date().toISOString(),
          note: `Order placed via ${payload.paymentMethod.toUpperCase()} (${isTakeaway ? 'Takeaway' : 'Home Delivery'})`,
        },
        ...(isCod
          ? []
          : [
              {
                status: 'Confirmed' as OrderStatus,
                timestamp: new Date().toISOString(),
                note: `Payment verified instantly via ${payload.paymentMethod.toUpperCase()}`,
              },
            ]),
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const orders = await this.getOrders();
    orders.unshift(order);
    safeSetItem('dailyfresh_orders', JSON.stringify(orders));

    // Broadcast across windows so Admin Portal gets updated immediately
    this.broadcast('order_placed', order);
    this.broadcast('orders_updated');
    this.broadcast('inventory_updated');
    this.broadcast('products_updated');

    return {
      success: true,
      data: {
        order,
        paymentUrl: undefined,
      },
    };
  }

  public async updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    note?: string,
    updatedBy: string = 'Operations Admin'
  ): Promise<{ success: boolean; data: Order | null }> {
    await this.safeApiFetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, note }),
    });

    const orders = await this.getOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return { success: false, data: null };

    // Stock restoration if order is cancelled
    if (nextStatus === 'Cancelled' && order.orderStatus !== 'Cancelled') {
      const products = await this.getProducts();
      const logs = await this.getInventoryLogs();
      for (const item of order.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const variant = prod.variants.find((v) => v.id === item.variantId);
          if (variant) {
            const prevStock = variant.stock;
            variant.stock += item.quantity;
            logs.unshift({
              id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              productId: prod.id,
              variantId: variant.id,
              productName: prod.title,
              variantName: variant.name,
              previousStock: prevStock,
              change: item.quantity,
              newStock: variant.stock,
              reason: 'return_restock',
              referenceId: order.orderNumber,
              createdBy: updatedBy,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
      safeSetItem('dailyfresh_products', JSON.stringify(products));
      safeSetItem('dailyfresh_inventory_logs', JSON.stringify(logs.slice(0, 100)));
      this.broadcast('inventory_updated');
      this.broadcast('products_updated');
    }

    order.orderStatus = nextStatus;
    order.updatedAt = new Date().toISOString();
    order.statusHistory.push({
      status: nextStatus,
      timestamp: new Date().toISOString(),
      note: note || `Order advanced to ${nextStatus}`,
      updatedBy,
    });

    safeSetItem('dailyfresh_orders', JSON.stringify(orders));
    this.broadcast('orders_updated', order);
    return { success: true, data: order };
  }

  // ------------------- BANNERS -------------------
  public async getBanners(): Promise<Banner[]> {
    const apiRes = await this.safeApiFetch<{ success: boolean; data: Banner[] }>('/api/banners');
    if (apiRes && apiRes.success && Array.isArray(apiRes.data)) {
      safeSetItem('dailyfresh_banners', JSON.stringify(apiRes.data));
      return apiRes.data;
    }

    try {
      const raw = safeGetItem('dailyfresh_banners');
      if (raw) return JSON.parse(raw);
    } catch {}

    return INITIAL_BANNERS;
  }

  public async saveBanner(bannerData: Partial<Banner>): Promise<{ success: boolean; data: Banner }> {
    const isEdit = !!bannerData.id;
    const url = isEdit ? `/api/banners/${bannerData.id}` : '/api/admin/banners';
    const method = isEdit ? 'PUT' : 'POST';

    await this.safeApiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bannerData),
    });

    const banners = await this.getBanners();
    let saved: Banner;

    if (isEdit) {
      const idx = banners.findIndex((b) => b.id === bannerData.id);
      saved = { ...banners[idx], ...bannerData } as Banner;
      if (idx !== -1) banners[idx] = saved;
    } else {
      saved = {
        id: `ban-${Date.now()}`,
        title: bannerData.title || 'Special Promotion',
        imageUrl: bannerData.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200',
        sortOrder: banners.length + 1,
        isActive: true,
        ...bannerData,
      } as Banner;
      banners.push(saved);
    }

    safeSetItem('dailyfresh_banners', JSON.stringify(banners));
    this.broadcast('banners_updated', saved);
    return { success: true, data: saved };
  }

  public async deleteBanner(id: string): Promise<{ success: boolean }> {
    await this.safeApiFetch(`/api/banners/${id}`, { method: 'DELETE' });
    const banners = await this.getBanners();
    const filtered = banners.filter((b) => b.id !== id);
    safeSetItem('dailyfresh_banners', JSON.stringify(filtered));
    this.broadcast('banners_updated', { id });
    return { success: true };
  }

  // ------------------- SETTINGS -------------------
  public async getSettings(): Promise<StoreSettings> {
    const apiRes = await this.safeApiFetch<{ success: boolean; data: StoreSettings }>('/api/settings');
    if (apiRes && apiRes.success && apiRes.data) {
      safeSetItem('dailyfresh_settings', JSON.stringify(apiRes.data));
      return apiRes.data;
    }

    try {
      const raw = safeGetItem('dailyfresh_settings');
      if (raw) return JSON.parse(raw);
    } catch {}

    return DEFAULT_STORE_SETTINGS;
  }

  public async updateSettings(settingsData: Partial<StoreSettings>): Promise<{ success: boolean; data: StoreSettings }> {
    await this.safeApiFetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsData),
    });

    const current = await this.getSettings();
    const updated = { ...current, ...settingsData };
    safeSetItem('dailyfresh_settings', JSON.stringify(updated));
    this.broadcast('settings_updated', updated);
    return { success: true, data: updated };
  }

  // ------------------- BUSINESS METRICS -------------------
  public async getMetrics(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    aov: number;
    wholesaleOrders: number;
    lowStockCount: number;
    pendingOrders: number;
  }> {
    const apiRes = await this.safeApiFetch<{ success: boolean; data: any }>('/api/admin/metrics');
    if (apiRes && apiRes.success && apiRes.data && apiRes.data.totalOrders !== undefined) {
      return apiRes.data;
    }

    const orders = await this.getOrders();
    const products = await this.getProducts();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const wholesaleOrders = orders.filter((o) =>
      o.items.some((i) => (i.appliedTierLabel && i.appliedTierLabel.includes('Wholesale')) || i.quantity >= 3)
    ).length;
    const pendingOrders = orders.filter(
      (o) => o.orderStatus === 'Placed' || o.orderStatus === 'Confirmed' || o.orderStatus === 'Processing'
    ).length;
    const lowStockCount = products
      .flatMap((p) => p.variants)
      .filter((v) => v.stock <= (v.lowStockThreshold || 10)).length;

    return {
      totalRevenue,
      totalOrders,
      aov,
      wholesaleOrders,
      lowStockCount,
      pendingOrders,
    };
  }

  // ------------------- DEMO DATA RESET -------------------
  public resetDemoData() {
    if (typeof window === 'undefined') return;
    safeSetItem('dailyfresh_products', JSON.stringify(INITIAL_PRODUCTS));
    safeSetItem('dailyfresh_categories', JSON.stringify(INITIAL_CATEGORIES));
    safeSetItem('dailyfresh_banners', JSON.stringify(INITIAL_BANNERS));
    safeSetItem('dailyfresh_settings', JSON.stringify(DEFAULT_STORE_SETTINGS));
    safeRemoveItem('dailyfresh_orders');
    this.ensureSeeded();
    this.broadcast('products_updated');
    this.broadcast('categories_updated');
    this.broadcast('orders_updated');
    this.broadcast('inventory_updated');
  }
}

export const dataStore = new UnifiedDataStore();
