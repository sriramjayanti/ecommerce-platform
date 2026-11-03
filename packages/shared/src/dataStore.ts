import {
  Product,
  Category,
  Order,
  InventoryLog,
  Banner,
  StoreSettings,
  OrderStatus,
  Address,
  UserProfile,
} from './types';
import { DEFAULT_STORE_SETTINGS } from './constants';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_BANNERS,
} from './catalogData';
import { firestore } from './firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

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

/**
 * Recursively strips undefined keys and nested undefined values
 * so Firestore setDoc never throws: "Unsupported field value: undefined"
 */
function cleanForFirestore<T>(data: T): T {
  if (data === undefined) return null as any;
  if (data === null || typeof data !== 'object') return data;
  if (data instanceof Date) return data;
  if (Array.isArray(data)) {
    return data.map((item) => cleanForFirestore(item)) as any;
  }
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = cleanForFirestore(value);
    }
  }
  return clean as T;
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

    // Attach Firestore real-time listeners for categories, products & orders
    if (typeof window !== 'undefined' && firestore) {
      try {
        // Real-time Orders Listener
        const ordersCol = collection(firestore, 'orders');
        onSnapshot(ordersCol, (snapshot) => {
          if (!snapshot.empty) {
            const remoteOrders: Order[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as Order;
              if (data && (data.id || (data as any).orderNumber)) {
                remoteOrders.push(data);
              }
            });
            if (remoteOrders.length > 0) {
              remoteOrders.sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              safeSetItem('dailyfresh_orders', JSON.stringify(remoteOrders));
              this.notifyListeners({
                type: 'orders_updated',
                timestamp: Date.now(),
              });
            }
          }
        }, (err) => {
          console.warn('Firestore orders onSnapshot listener error:', err);
        });

        // Real-time Categories Listener (Instantly syncs Admin -> Customer across domains)
        const categoriesCol = collection(firestore, 'categories');
        onSnapshot(categoriesCol, (snapshot) => {
          const remoteCats: Category[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Category;
            if (data && data.id) {
              remoteCats.push(data);
            }
          });
          remoteCats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          safeSetItem('dailyfresh_categories', JSON.stringify(remoteCats));
          this.notifyListeners({
            type: 'categories_updated',
            timestamp: Date.now(),
          });
        }, (err) => {
          console.warn('Firestore categories onSnapshot error:', err);
        });

        // Real-time Products Listener (Instantly syncs Admin -> Customer across domains)
        const productsCol = collection(firestore, 'products');
        onSnapshot(productsCol, (snapshot) => {
          const remoteProds: Product[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Product;
            if (data && data.id) {
              remoteProds.push(data);
            }
          });
          safeSetItem('dailyfresh_products', JSON.stringify(remoteProds));
          this.notifyListeners({
            type: 'products_updated',
            timestamp: Date.now(),
          });
        }, (err) => {
          console.warn('Firestore products onSnapshot error:', err);
        });

        // Real-time Banners Listener (Instantly syncs Admin -> Customer across domains)
        const bannersCol = collection(firestore, 'banners');
        onSnapshot(bannersCol, (snapshot) => {
          const remoteBans: Banner[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Banner;
            if (data && data.id) {
              remoteBans.push(data);
            }
          });
          remoteBans.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          if (remoteBans.length > 0) {
            safeSetItem('dailyfresh_banners', JSON.stringify(remoteBans));
            this.notifyListeners({
              type: 'banners_updated',
              timestamp: Date.now(),
            });
          }
        }, (err) => {
          console.warn('Firestore banners onSnapshot error:', err);
        });
      } catch (err) {
        console.warn('Could not initialize Firestore onSnapshot listeners:', err);
      }
    }
  }

  private async ensureSeeded() {
    if (typeof window === 'undefined') return;

    // Total clean wipe of client-side cache so user tests all pages from zero/clean slate
    if (!safeGetItem('dailyfresh_clean_slate_v10')) {
      safeSetItem('dailyfresh_products', JSON.stringify([]));
      safeSetItem('dailyfresh_categories', JSON.stringify([]));
      safeSetItem('dailyfresh_orders', JSON.stringify([]));
      safeSetItem('dailyfresh_inventory_logs', JSON.stringify([]));
      safeSetItem('dailyfresh_clean_slate_v10', 'true');
    }

    if (!safeGetItem('dailyfresh_products')) {
      safeSetItem('dailyfresh_products', JSON.stringify([]));
    }
    if (!safeGetItem('dailyfresh_categories')) {
      safeSetItem('dailyfresh_categories', JSON.stringify([]));
    }
    if (!safeGetItem('dailyfresh_banners')) {
      safeSetItem('dailyfresh_banners', JSON.stringify(INITIAL_BANNERS));
    }
    if (!safeGetItem('dailyfresh_settings')) {
      safeSetItem('dailyfresh_settings', JSON.stringify(DEFAULT_STORE_SETTINGS));
    }
    if (!safeGetItem('dailyfresh_orders')) {
      safeSetItem('dailyfresh_orders', JSON.stringify([]));
    }
    if (!safeGetItem('dailyfresh_inventory_logs')) {
      safeSetItem('dailyfresh_inventory_logs', JSON.stringify([]));
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...((options?.headers as Record<string, string>) || {}),
      };
      const adminToken = safeGetItem('dailyfresh_admin_token');
      if (adminToken && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${adminToken}`;
      }
      const res = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        return json as T;
      }
    } catch {
      // Backend unavailable or timed out
    }
    return null;
  }

  // ------------------- PRODUCTS -------------------
  public async getProducts(): Promise<Product[]> {
    let localProducts: Product[] = [];
    try {
      const raw = safeGetItem('dailyfresh_products');
      if (raw) localProducts = JSON.parse(raw);
    } catch {}

    if (typeof window !== 'undefined' && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'products'));
        const remoteProds: Product[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Product;
          if (data && data.id) {
            remoteProds.push(data);
          }
        });
        if (remoteProds.length > 0 || localProducts.length === 0) {
          safeSetItem('dailyfresh_products', JSON.stringify(remoteProds));
          return remoteProds;
        }
      } catch (err) {
        console.warn('Firestore getProducts error:', err);
      }
    }

    const apiRes = await this.safeApiFetch<{ success: boolean; data: Product[] }>('/api/products');
    if (apiRes && apiRes.success && Array.isArray(apiRes.data)) {
      safeSetItem('dailyfresh_products', JSON.stringify(apiRes.data));
      return apiRes.data;
    }

    return localProducts;
  }

  public async getProductByIdOrSlug(idOrSlug: string): Promise<Product | null> {
    const products = await this.getProducts();
    const found = products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    return found || null;
  }

  public async saveProduct(productData: Partial<Product>): Promise<{ success: boolean; data: Product; error?: string }> {
    const products = await this.getProducts();
    let saved: Product;

    if (productData.id) {
      const idx = products.findIndex((p) => p.id === productData.id);
      if (idx !== -1) {
        saved = {
          ...products[idx],
          ...productData,
          updatedAt: new Date().toISOString(),
        } as Product;
        products[idx] = saved;
      } else {
        saved = productData as Product;
        products.unshift(saved);
      }
    } else {
      const id = `prod-${Date.now()}`;
      const slug =
        productData.slug ||
        (productData.title || 'product')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      saved = {
        id,
        slug,
        title: productData.title || 'Untitled Product',
        description: productData.description || '',
        categoryId: productData.categoryId || '',
        subcategoryId: productData.subcategoryId || '',
        brand: productData.brand || 'DailyFresh',
        badge: productData.badge || null,
        deliveryTag: productData.deliveryTag || '⚡ FREE Delivery by Tomorrow 8 PM',
        images: productData.images && productData.images.length > 0 ? productData.images : ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=700'],
        isWholesaleEnabled: productData.isWholesaleEnabled !== undefined ? productData.isWholesaleEnabled : true,
        status: productData.status || 'active',
        isFeatured: productData.isFeatured || false,
        variants: productData.variants || [],
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      products.unshift(saved);
    }

    safeSetItem('dailyfresh_products', JSON.stringify(products));
    this.broadcast('products_updated', saved);

    if (typeof window !== 'undefined' && firestore) {
      const cleanDoc = cleanForFirestore(saved);
      setDoc(doc(firestore, 'products', saved.id), cleanDoc).catch((err) => {
        console.warn('Firestore setDoc product error:', err);
      });
    }

    const isEdit = !!productData.id;
    const url = isEdit ? `/api/products/${productData.id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';
    this.safeApiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch(() => {});

    return { success: true, data: saved };
  }

  public async deleteProduct(id: string): Promise<{ success: boolean; error?: string }> {
    const products = await this.getProducts();
    const filtered = products.filter((p) => p.id !== id);
    safeSetItem('dailyfresh_products', JSON.stringify(filtered));
    this.broadcast('products_updated', { id });

    if (typeof window !== 'undefined' && firestore) {
      deleteDoc(doc(firestore, 'products', id)).catch((err) => {
        console.warn('Firestore deleteDoc product error:', err);
      });
    }

    this.safeApiFetch(`/api/products/${id}`, { method: 'DELETE' }).catch(() => {});
    return { success: true };
  }

  // ------------------- CATEGORIES -------------------
  public async getCategories(): Promise<Category[]> {
    let localCats: Category[] = [];
    try {
      const raw = safeGetItem('dailyfresh_categories');
      if (raw) localCats = JSON.parse(raw);
    } catch {}

    if (typeof window !== 'undefined' && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'categories'));
        const remoteCats: Category[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Category;
          if (data && data.id) {
            remoteCats.push(data);
          }
        });
        remoteCats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        if (remoteCats.length > 0 || localCats.length === 0) {
          safeSetItem('dailyfresh_categories', JSON.stringify(remoteCats));
          return remoteCats;
        }
      } catch (err) {
        console.warn('Firestore getCategories error:', err);
      }
    }

    const apiRes = await this.safeApiFetch<{ success: boolean; data: Category[] }>('/api/categories');
    if (apiRes && apiRes.success && Array.isArray(apiRes.data)) {
      safeSetItem('dailyfresh_categories', JSON.stringify(apiRes.data));
      return apiRes.data;
    }

    return localCats;
  }

  public async saveCategory(categoryData: Partial<Category>): Promise<{ success: boolean; data: Category; error?: string }> {
    if (!categoryData.name || !categoryData.name.trim()) {
      return { success: false, data: null as any, error: 'Category name is required' };
    }

    const categories = await this.getCategories();
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

    const id = categoryData.id || `cat-${Date.now()}`;
    const slug =
      categoryData.slug ||
      categoryData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const saved: Category = {
      id,
      name: categoryData.name.trim(),
      slug,
      image: categoryData.image || '',
      icon: categoryData.icon || 'Layers',
      sortOrder: categoryData.sortOrder !== undefined ? categoryData.sortOrder : categories.length + 1,
      isVisible: categoryData.isVisible !== undefined ? categoryData.isVisible : true,
      subcategories: categoryData.subcategories || [],
    };

    const idx = categories.findIndex((c) => c.id === id);
    if (idx !== -1) {
      categories[idx] = saved;
    } else {
      categories.push(saved);
    }
    categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    safeSetItem('dailyfresh_categories', JSON.stringify(categories));
    this.broadcast('categories_updated', saved);

    if (typeof window !== 'undefined' && firestore) {
      const cleanDoc = cleanForFirestore(saved);
      setDoc(doc(firestore, 'categories', saved.id), cleanDoc).catch((err) => {
        console.warn('Firestore setDoc category error:', err);
      });
    }

    const isEdit = !!categoryData.id;
    const url = isEdit ? `/api/categories/${categoryData.id}` : '/api/categories';
    const method = isEdit ? 'PUT' : 'POST';
    this.safeApiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch(() => {});

    return { success: true, data: saved };
  }

  public async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    const products = await this.getProducts();
    const hasAssignedProducts = products.some((p) => p.categoryId === id && p.status === 'active');
    if (hasAssignedProducts) {
      return {
        success: false,
        error: 'Cannot delete category: active products are still assigned to this category. Reassign or delete those products first.',
      };
    }

    const categories = await this.getCategories();
    const filtered = categories.filter((c) => c.id !== id);
    safeSetItem('dailyfresh_categories', JSON.stringify(filtered));
    this.broadcast('categories_updated', { id });

    if (typeof window !== 'undefined' && firestore) {
      deleteDoc(doc(firestore, 'categories', id)).catch((err) => {
        console.warn('Firestore deleteDoc category error:', err);
      });
    }

    this.safeApiFetch(`/api/categories/${id}`, { method: 'DELETE' }).catch(() => {});
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
    // 1. Fetch remote orders from Firestore (Authoritative multi-origin sync)
    if (typeof window !== 'undefined' && firestore) {
      try {
        const ordersCol = collection(firestore, 'orders');
        const snap = await getDocs(ordersCol);
        if (!snap.empty) {
          const firestoreOrders: Order[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data() as Order;
            if (data && (data.id || (data as any).orderNumber)) {
              firestoreOrders.push(data);
            }
          });

          // Merge with any local offline orders
          let localOrders: Order[] = [];
          try {
            const raw = safeGetItem('dailyfresh_orders');
            if (raw) localOrders = JSON.parse(raw);
          } catch {}

          const orderMap = new Map<string, Order>();
          firestoreOrders.forEach((o) => orderMap.set(o.id, o));
          localOrders.forEach((o) => {
            if (!orderMap.has(o.id)) {
              orderMap.set(o.id, o);
              // Backfill local order to Firestore
              setDoc(doc(firestore, 'orders', o.id), o).catch(() => {});
            }
          });

          const merged = Array.from(orderMap.values()).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          safeSetItem('dailyfresh_orders', JSON.stringify(merged));
          return merged;
        }
      } catch (err) {
        console.warn('Firestore getOrders sync error:', err);
      }
    }

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

    // Save order directly to Cloud Firestore so Admin Portal receives it in real time
    if (typeof window !== 'undefined' && firestore) {
      try {
        await setDoc(doc(firestore, 'orders', order.id), cleanForFirestore(order));
        // Also register/update customer in users collection
        if (payload.userId) {
          await setDoc(
            doc(firestore, 'users', payload.userId),
            {
              id: payload.userId,
              displayName: payload.customerName,
              phone: payload.customerPhone,
              email: payload.customerEmail || null,
              lastOrderAt: order.createdAt,
              lastOrderId: order.orderNumber,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (firestoreErr) {
        console.warn('Firestore write order error (saved locally):', firestoreErr);
      }
    }

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

    // Update in Firestore in real time
    if (typeof window !== 'undefined' && firestore) {
      try {
        await setDoc(
          doc(firestore, 'orders', orderId),
          {
            orderStatus: nextStatus,
            updatedAt: order.updatedAt,
            statusHistory: order.statusHistory,
          },
          { merge: true }
        );
      } catch (err) {
        console.warn('Firestore updateOrderStatus error:', err);
      }
    }

    this.broadcast('orders_updated', order);
    return { success: true, data: order };
  }

  // ------------------- USERS & CUSTOMER SYNC -------------------
  public async syncUser(user: Partial<UserProfile>): Promise<void> {
    if (!user || !user.id) return;
    if (typeof window !== 'undefined' && firestore) {
      try {
        await setDoc(doc(firestore, 'users', user.id), {
          ...user,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore syncUser error:', err);
      }
    }
  }

  public async getSyncedUsers(): Promise<any[]> {
    if (typeof window !== 'undefined' && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'users'));
        const users: any[] = [];
        snap.forEach((docSnap) => {
          users.push(docSnap.data());
        });
        return users;
      } catch {}
    }
    return [];
  }

  // ------------------- BANNERS -------------------
  public async getBanners(): Promise<Banner[]> {
    let localBanners: Banner[] = [];
    try {
      const raw = safeGetItem('dailyfresh_banners');
      if (raw) localBanners = JSON.parse(raw);
    } catch {}

    if (typeof window !== 'undefined' && firestore) {
      try {
        const snap = await getDocs(collection(firestore, 'banners'));
        const remoteBans: Banner[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data() as Banner;
          if (data && data.id) {
            remoteBans.push(data);
          }
        });
        remoteBans.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        if (remoteBans.length > 0 || localBanners.length === 0) {
          safeSetItem('dailyfresh_banners', JSON.stringify(remoteBans));
          return remoteBans;
        }
      } catch (err) {
        console.warn('Firestore getBanners error:', err);
      }
    }

    const apiRes = await this.safeApiFetch<{ success: boolean; data: Banner[] }>('/api/banners');
    if (apiRes && apiRes.success && Array.isArray(apiRes.data)) {
      safeSetItem('dailyfresh_banners', JSON.stringify(apiRes.data));
      return apiRes.data;
    }

    return localBanners.length > 0 ? localBanners : INITIAL_BANNERS;
  }

  public async saveBanner(bannerData: Partial<Banner>): Promise<{ success: boolean; data: Banner }> {
    const isEdit = !!bannerData.id;
    const banners = await this.getBanners();
    let saved: Banner;

    if (isEdit) {
      const idx = banners.findIndex((b) => b.id === bannerData.id);
      saved = {
        title: 'Special Promotion',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200',
        linkUrl: '/',
        sortOrder: 1,
        isActive: true,
        ...(idx !== -1 ? banners[idx] : {}),
        ...bannerData,
      } as Banner;
      if (idx !== -1) {
        banners[idx] = saved;
      } else {
        banners.push(saved);
      }
    } else {
      saved = {
        id: `ban-${Date.now()}`,
        title: bannerData.title || 'Special Promotion',
        subtitle: bannerData.subtitle || '',
        imageUrl: bannerData.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200',
        linkUrl: bannerData.linkUrl || '/',
        sortOrder: bannerData.sortOrder !== undefined ? bannerData.sortOrder : banners.length + 1,
        isActive: bannerData.isActive !== undefined ? bannerData.isActive : true,
      };
      banners.push(saved);
    }

    banners.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    safeSetItem('dailyfresh_banners', JSON.stringify(banners));
    this.broadcast('banners_updated', saved);

    if (typeof window !== 'undefined' && firestore) {
      const cleanDoc = cleanForFirestore(saved);
      setDoc(doc(firestore, 'banners', saved.id), cleanDoc).catch((err) => {
        console.warn('Firestore setDoc banner error:', err);
      });
    }

    const url = isEdit ? `/api/banners/${bannerData.id}` : '/api/admin/banners';
    const method = isEdit ? 'PUT' : 'POST';
    this.safeApiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch(() => {});

    return { success: true, data: saved };
  }

  public async deleteBanner(id: string): Promise<{ success: boolean }> {
    const banners = await this.getBanners();
    const filtered = banners.filter((b) => b.id !== id);
    safeSetItem('dailyfresh_banners', JSON.stringify(filtered));
    this.broadcast('banners_updated', { id });

    if (typeof window !== 'undefined' && firestore) {
      deleteDoc(doc(firestore, 'banners', id)).catch((err) => {
        console.warn('Firestore deleteDoc banner error:', err);
      });
    }

    this.safeApiFetch(`/api/banners/${id}`, { method: 'DELETE' }).catch(() => {});
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
    const orders = await this.getOrders();
    const products = await this.getProducts();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);
    const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const wholesaleOrders = orders.filter((o) =>
      o.items && o.items.some((i) => (i.appliedTierLabel && i.appliedTierLabel.includes('Wholesale')) || i.quantity >= 3)
    ).length;
    const pendingOrders = orders.filter(
      (o) => o.orderStatus === 'Placed' || o.orderStatus === 'Confirmed' || o.orderStatus === 'Processing'
    ).length;
    const lowStockCount = products.length === 0 ? 0 : products
      .flatMap((p) => p.variants || [])
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
    safeSetItem('dailyfresh_products', JSON.stringify([]));
    safeSetItem('dailyfresh_categories', JSON.stringify([]));
    safeSetItem('dailyfresh_banners', JSON.stringify(INITIAL_BANNERS));
    safeSetItem('dailyfresh_settings', JSON.stringify(DEFAULT_STORE_SETTINGS));
    safeSetItem('dailyfresh_orders', JSON.stringify([]));
    safeSetItem('dailyfresh_inventory_logs', JSON.stringify([]));
    this.broadcast('products_updated');
    this.broadcast('categories_updated');
    this.broadcast('orders_updated');
    this.broadcast('inventory_updated');
  }
}

export const dataStore = new UnifiedDataStore();
