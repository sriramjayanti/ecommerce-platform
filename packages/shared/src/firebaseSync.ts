import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import {
  Category,
  Product,
  Order,
  InventoryLog,
  StoreSettings,
  Banner,
  Review,
} from './types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_BANNERS,
} from './catalogData';
import { DEFAULT_STORE_SETTINGS } from './constants';
import { calculateCartTotals, resolveUnitPrice, validatePriceTiers } from './pricing';

export const firebaseConfig = {
  projectId: 'dailyfresh-wholesale-mart',
  appId: '1:519957366977:web:4f055056b78c6d830f6c40',
  storageBucket: 'dailyfresh-wholesale-mart.firebasestorage.app',
  apiKey: 'AIzaSyCVaoX7wj6r1kubGQiEEBzlAG_FJEa7r8U',
  authDomain: 'dailyfresh-wholesale-mart.firebaseapp.com',
  messagingSenderId: '519957366977',
  projectNumber: '519957366977',
};

const SAMPLE_ORDERS: Order[] = [
  {
    id: 'ord-1001',
    orderNumber: 'DFM-2026-9021',
    userId: 'user-customer-1',
    customerName: 'Amit Verma',
    customerPhone: '+919834567890',
    customerEmail: 'amit.verma@example.com',
    items: [
      {
        productId: 'prod-fortune-oil',
        variantId: 'var-fortune-1l',
        title: 'Fortune Sunlite Refined Sunflower Oil Pouch (1 L)',
        variantName: '1 L Pouch',
        sku: 'OIL-FS-1L',
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500',
        quantity: 5,
        unitPrice: 130,
        basePrice: 145,
        mrp: 175,
        lineTotal: 650,
        savings: 225,
        appliedTierLabel: 'Wholesale (5+ units)',
      },
    ],
    deliveryAddress: {
      addressLine: 'Flat 402, Green Glen Layout, Bellandur',
      city: 'Bengaluru',
      pincode: '560103',
    },
    subtotal: 650,
    deliveryCharge: 0,
    finalTotal: 650,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    orderStatus: 'Confirmed',
    fulfillmentMethod: 'home_delivery',
    stockDeducted: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

// Flag to ensure initial data is seeded once if Firestore collections are empty
let isInitialized = false;

export async function ensureFirestoreSeeded(): Promise<void> {
  if (isInitialized) return;
  try {
    const catSnap = await getDocs(collection(firestore, 'categories'));
    if (catSnap.empty) {
      console.log('Seeding initial Firestore categories...');
      const batch = writeBatch(firestore);
      for (const cat of INITIAL_CATEGORIES) {
        batch.set(doc(firestore, 'categories', cat.id), cat);
      }
      for (const prod of INITIAL_PRODUCTS) {
        batch.set(doc(firestore, 'products', prod.id), prod);
      }
      for (const ord of SAMPLE_ORDERS) {
        batch.set(doc(firestore, 'orders', ord.id), ord);
      }
      for (const ban of INITIAL_BANNERS) {
        batch.set(doc(firestore, 'banners', ban.id), ban);
      }
      batch.set(doc(firestore, 'settings', 'default'), DEFAULT_STORE_SETTINGS);
      await batch.commit();
      console.log('Firestore initialized with catalog, categories, orders, and banners.');
    }
    isInitialized = true;
  } catch (err) {
    console.warn('Could not auto-seed Firestore (may be offline or restricted):', err);
  }
}

// ================= CATEGORIES =================
export async function fsGetCategories(): Promise<Category[]> {
  await ensureFirestoreSeeded();
  try {
    const snap = await getDocs(collection(firestore, 'categories'));
    if (snap.empty) return INITIAL_CATEGORIES;
    const cats: Category[] = [];
    snap.forEach((d) => cats.push(d.data() as Category));
    return cats.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  } catch (err) {
    console.error('fsGetCategories error:', err);
    return INITIAL_CATEGORIES;
  }
}

export async function fsCreateCategory(categoryData: Partial<Category>): Promise<{ success: boolean; data?: Category; error?: string }> {
  await ensureFirestoreSeeded();
  const trimmedName = (categoryData.name || '').trim();
  if (!trimmedName) {
    return { success: false, error: 'Category name is required' };
  }

  const existing = await fsGetCategories();
  const isDuplicate = existing.some(
    (c) => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  if (isDuplicate) {
    return { success: false, error: `A category named "${trimmedName}" already exists.` };
  }

  const newCategory: Category = {
    id: `cat-${Date.now()}`,
    name: trimmedName,
    slug: categoryData.slug || trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    imageUrl: categoryData.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200',
    description: categoryData.description || '',
    sortOrder: categoryData.sortOrder || existing.length + 1,
    isActive: categoryData.isActive !== false,
  };

  await setDoc(doc(firestore, 'categories', newCategory.id), newCategory);
  return { success: true, data: newCategory };
}

export async function fsUpdateCategory(id: string, updates: Partial<Category>): Promise<{ success: boolean; data?: Category; error?: string }> {
  await ensureFirestoreSeeded();
  if (updates.name) {
    const trimmed = updates.name.trim();
    const existing = await fsGetCategories();
    const isDup = existing.some((c) => c.id !== id && c.name.trim().toLowerCase() === trimmed.toLowerCase());
    if (isDup) {
      return { success: false, error: `A category named "${trimmed}" already exists.` };
    }
  }

  const ref = doc(firestore, 'categories', id);
  await updateDoc(ref, updates as any);
  const snap = await getDoc(ref);
  return { success: true, data: snap.data() as Category };
}

export async function fsDeleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
  await ensureFirestoreSeeded();
  const products = await fsGetProducts(true);
  const assigned = products.filter((p) => p.categoryId === id && p.status !== 'archived');
  if (assigned.length > 0) {
    return {
      success: false,
      error: `Cannot delete category because ${assigned.length} active products belong to it. Reassign products first.`,
    };
  }

  await deleteDoc(doc(firestore, 'categories', id));
  return { success: true };
}

// ================= PRODUCTS =================
export async function fsGetProducts(includeAll = false): Promise<Product[]> {
  await ensureFirestoreSeeded();
  try {
    const snap = await getDocs(collection(firestore, 'products'));
    if (snap.empty) {
      return includeAll ? INITIAL_PRODUCTS : INITIAL_PRODUCTS.filter((p) => p.status === 'active');
    }
    const products: Product[] = [];
    snap.forEach((d) => {
      const p = d.data() as Product;
      if (includeAll || p.status === 'active') {
        products.push(p);
      }
    });
    return products;
  } catch (err) {
    console.error('fsGetProducts error:', err);
    return includeAll ? INITIAL_PRODUCTS : INITIAL_PRODUCTS.filter((p) => p.status === 'active');
  }
}

export async function fsCreateProduct(productData: any): Promise<{ success: boolean; data?: Product; error?: string }> {
  await ensureFirestoreSeeded();
  const trimmedTitle = (productData.title || '').trim();
  if (!trimmedTitle) {
    return { success: false, error: 'Product title is required' };
  }
  if (!productData.categoryId) {
    return { success: false, error: 'Please select a product category' };
  }

  const variants = Array.isArray(productData.variants) && productData.variants.length > 0
    ? productData.variants
    : [
        {
          id: `var-${Date.now()}`,
          name: 'Standard Pack',
          sku: `SKU-${Date.now().toString().slice(-4)}`,
          weightOrSize: '1 unit',
          mrp: Number(productData.mrp) || Number(productData.price) || 100,
          basePrice: Number(productData.price) || 100,
          stock: Number(productData.stock) || 50,
          lowStockThreshold: 5,
          pricingTiers: [],
          isDefault: true,
        },
      ];

  for (const variant of variants) {
    if (!variant.name || !variant.name.trim()) {
      return { success: false, error: 'Variant name is required' };
    }
    if (Number(variant.basePrice) <= 0) {
      return { success: false, error: `Variant "${variant.name}" must have price > 0` };
    }
    if (Number(variant.stock) < 0) {
      return { success: false, error: `Variant "${variant.name}" cannot have negative stock` };
    }
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    title: trimmedTitle,
    slug: productData.slug || trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: productData.description || '',
    categoryId: productData.categoryId,
    brand: productData.brand || 'DailyFresh',
    images: productData.images || ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'],
    rating: 5.0,
    reviewCount: 0,
    status: productData.status || 'active',
    isWholesaleEnabled: productData.isWholesaleEnabled !== false,
    variants,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(firestore, 'products', newProduct.id), newProduct);
  return { success: true, data: newProduct };
}

export async function fsUpdateProduct(id: string, updates: any): Promise<{ success: boolean; data?: Product; error?: string }> {
  await ensureFirestoreSeeded();
  const ref = doc(firestore, 'products', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, error: 'Product not found' };

  const current = snap.data() as Product;
  const merged = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(ref, merged);
  return { success: true, data: merged };
}

// ================= ORDERS =================
export async function fsGetOrders(userId?: string): Promise<Order[]> {
  await ensureFirestoreSeeded();
  try {
    const snap = await getDocs(collection(firestore, 'orders'));
    if (snap.empty) return SAMPLE_ORDERS;
    const orders: Order[] = [];
    snap.forEach((d) => {
      const o = d.data() as Order;
      if (!userId || o.userId === userId || o.customerPhone === userId) {
        orders.push(o);
      }
    });
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('fsGetOrders error:', err);
    return SAMPLE_ORDERS;
  }
}

export async function fsCreateOrder(orderInput: any): Promise<{ success: boolean; data?: { order: Order }; error?: string }> {
  await ensureFirestoreSeeded();
  if (!orderInput.customerName || !orderInput.customerPhone) {
    return { success: false, error: 'Customer name and phone number are required.' };
  }
  if (!orderInput.items || orderInput.items.length === 0) {
    return { success: false, error: 'Cannot place an order with an empty cart.' };
  }

  // Stock check and deduction
  const products = await fsGetProducts(true);
  for (const item of orderInput.items) {
    const prod = products.find((p) => p.id === item.productId);
    const variant = prod?.variants.find((v) => v.id === item.variantId);
    if (!variant) {
      return { success: false, error: `Variant "${item.variantName || item.title}" not found.` };
    }
    if (variant.stock < item.quantity) {
      return {
        success: false,
        error: `Insufficient stock for "${prod?.title} (${variant.name})". Only ${variant.stock} units available.`,
      };
    }
  }

  // Deduct stock in Firestore
  const batch = writeBatch(firestore);
  for (const item of orderInput.items) {
    const prod = products.find((p) => p.id === item.productId)!;
    const updatedVariants = prod.variants.map((v) => {
      if (v.id === item.variantId) {
        return { ...v, stock: Math.max(0, v.stock - item.quantity) };
      }
      return v;
    });
    batch.update(doc(firestore, 'products', prod.id), { variants: updatedVariants });
  }

  const isTakeaway = orderInput.fulfillmentMethod === 'takeaway';
  const effectiveDelivery = isTakeaway ? 0 : (orderInput.deliveryCharge ?? 40);
  const subtotal = orderInput.subtotal || orderInput.items.reduce((s: number, i: any) => s + (i.lineTotal || (i.unitPrice * i.quantity)), 0);
  const finalTotal = subtotal + effectiveDelivery;

  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber,
    userId: orderInput.userId || 'guest_user',
    customerName: orderInput.customerName,
    customerPhone: orderInput.customerPhone,
    customerEmail: orderInput.customerEmail || '',
    fulfillmentMethod: orderInput.fulfillmentMethod || 'home_delivery',
    deliveryAddress: orderInput.deliveryAddress || {
      addressLine: isTakeaway ? 'Store Pickup Counter' : 'Home Address',
      city: 'Bengaluru',
      pincode: '560034',
    },
    items: orderInput.items.map((i: any) => ({
      productId: i.productId,
      variantId: i.variantId,
      title: i.title || i.productTitle,
      variantName: i.variantName,
      sku: i.sku || 'SKU',
      image: i.image || '',
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      basePrice: i.basePrice || i.unitPrice,
      mrp: i.mrp || i.unitPrice,
      lineTotal: i.lineTotal || (i.unitPrice * i.quantity),
      savings: i.savings || 0,
      appliedTierLabel: i.appliedTierLabel,
    })),
    subtotal,
    deliveryCharge: effectiveDelivery,
    taxAmount: 0,
    finalTotal,
    paymentMethod: orderInput.paymentMethod || 'cod',
    paymentStatus: orderInput.paymentMethod === 'cod' ? 'pending' : (orderInput.paymentStatus || 'pending'),
    orderStatus: 'Placed',
    stockDeducted: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  batch.set(doc(firestore, 'orders', newOrder.id), newOrder);
  await batch.commit();

  return { success: true, data: { order: newOrder } };
}

export async function fsUpdateOrderStatus(orderId: string, status: string, note?: string): Promise<{ success: boolean; data?: Order; error?: string }> {
  await ensureFirestoreSeeded();
  const ref = doc(firestore, 'orders', orderId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, error: 'Order not found' };

  const current = snap.data() as Order;
  const isNowCancelled = status === 'Cancelled';
  const shouldRestoreStock = isNowCancelled && current.stockDeducted && current.orderStatus !== 'Cancelled';

  if (shouldRestoreStock) {
    const products = await fsGetProducts(true);
    const batch = writeBatch(firestore);
    for (const item of current.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        const updatedVariants = prod.variants.map((v) => {
          if (v.id === item.variantId) {
            return { ...v, stock: v.stock + item.quantity };
          }
          return v;
        });
        batch.update(doc(firestore, 'products', prod.id), { variants: updatedVariants });
      }
    }
    batch.update(ref, {
      orderStatus: status,
      stockDeducted: false,
      updatedAt: new Date().toISOString(),
    });
    await batch.commit();
  } else {
    await updateDoc(ref, {
      orderStatus: status,
      updatedAt: new Date().toISOString(),
    });
  }

  const updatedSnap = await getDoc(ref);
  return { success: true, data: updatedSnap.data() as Order };
}

// ================= INVENTORY =================
export async function fsAdjustStock(productId: string, variantId: string, newStock?: number, delta?: number): Promise<{ success: boolean; error?: string }> {
  await ensureFirestoreSeeded();
  const ref = doc(firestore, 'products', productId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { success: false, error: 'Product not found' };

  const prod = snap.data() as Product;
  const updatedVariants = prod.variants.map((v) => {
    if (v.id === variantId) {
      const nextStock = newStock !== undefined ? Math.max(0, newStock) : Math.max(0, v.stock + (delta || 0));
      return { ...v, stock: nextStock };
    }
    return v;
  });

  await updateDoc(ref, { variants: updatedVariants, updatedAt: new Date().toISOString() });
  return { success: true };
}

// ================= SETTINGS =================
export async function fsGetSettings(): Promise<StoreSettings> {
  await ensureFirestoreSeeded();
  try {
    const snap = await getDoc(doc(firestore, 'settings', 'default'));
    if (snap.exists()) return snap.data() as StoreSettings;
    return DEFAULT_STORE_SETTINGS;
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export async function fsUpdateSettings(settings: Partial<StoreSettings>): Promise<{ success: boolean; data?: StoreSettings }> {
  await ensureFirestoreSeeded();
  const ref = doc(firestore, 'settings', 'default');
  await setDoc(ref, settings, { merge: true });
  const snap = await getDoc(ref);
  return { success: true, data: snap.data() as StoreSettings };
}

// ================= BANNERS =================
export async function fsGetBanners(): Promise<Banner[]> {
  await ensureFirestoreSeeded();
  try {
    const snap = await getDocs(collection(firestore, 'banners'));
    if (snap.empty) return INITIAL_BANNERS;
    const banners: Banner[] = [];
    snap.forEach((d) => banners.push(d.data() as Banner));
    return banners.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  } catch {
    return INITIAL_BANNERS;
  }
}

export async function fsSaveBanner(bannerData: any, id?: string): Promise<{ success: boolean; data?: Banner }> {
  await ensureFirestoreSeeded();
  const bannerId = id || `ban-${Date.now()}`;
  const banner: Banner = {
    id: bannerId,
    title: bannerData.title,
    subtitle: bannerData.subtitle || '',
    imageUrl: bannerData.imageUrl,
    linkUrl: bannerData.linkUrl || '/',
    sortOrder: Number(bannerData.sortOrder) || 1,
    isActive: bannerData.isActive !== false,
  };
  await setDoc(doc(firestore, 'banners', bannerId), banner);
  return { success: true, data: banner };
}

export async function fsDeleteBanner(id: string): Promise<{ success: boolean }> {
  await ensureFirestoreSeeded();
  await deleteDoc(doc(firestore, 'banners', id));
  return { success: true };
}
