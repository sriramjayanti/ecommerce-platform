/**
 * Resilient API Client with Cloud Firestore Fallback
 * Ensures that responses are verified for JSON content-type and valid HTTP status.
 * If deployed on static Firebase Hosting (where /api/* rewrites to index.html)
 * or if the backend API is unreachable, it automatically routes operations
 * directly to Google Cloud Firestore, keeping Customer and Admin in 100% real-time sync.
 */
import {
  fsGetCategories,
  fsCreateCategory,
  fsUpdateCategory,
  fsDeleteCategory,
  fsGetProducts,
  fsCreateProduct,
  fsUpdateProduct,
  fsGetOrders,
  fsCreateOrder,
  fsUpdateOrderStatus,
  fsAdjustStock,
  fsGetSettings,
  fsUpdateSettings,
  fsGetBanners,
  fsSaveBanner,
  fsDeleteBanner,
  ensureFirestoreSeeded,
} from './firebaseSync';

export async function safeApiFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string; message?: string; [key: string]: any }> {
  const urlStr = typeof input === 'string' ? input : input.toString();
  const method = (init?.method || 'GET').toUpperCase();

  let bodyData: any = null;
  if (init?.body && typeof init.body === 'string') {
    try {
      bodyData = JSON.parse(init.body);
    } catch {
      bodyData = init.body;
    }
  }

  try {
    const response = await fetch(input, init);
    const contentType = response.headers.get('content-type') || '';

    // If the server responded with JSON, process normally
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok && !data.error) {
        data.error = `HTTP Error ${response.status}: ${response.statusText}`;
        data.success = false;
      }
      return data;
    }

    // If the server responded with HTML (e.g. Firebase Hosting rewrite to index.html),
    // delegate seamlessly to Cloud Firestore to fulfill the operation
    console.info(`[safeApiFetch] Endpoint ${method} ${urlStr} returned HTML. Delegating to Cloud Firestore...`);
    return await handleFirestoreFallback<T>(urlStr, method, bodyData);
  } catch (err: any) {
    // If network connection failed or server is down, delegate to Cloud Firestore
    console.warn(`[safeApiFetch] Network request to ${urlStr} failed. Delegating to Cloud Firestore...`, err.message);
    return await handleFirestoreFallback<T>(urlStr, method, bodyData);
  }
}

async function handleFirestoreFallback<T>(
  url: string,
  method: string,
  body: any
): Promise<{ success: boolean; data?: T; error?: string; message?: string; [key: string]: any }> {
  try {
    const parsed = new URL(url, 'http://localhost');
    const pathname = parsed.pathname;

    // --- CATEGORIES ---
    if (pathname === '/api/categories') {
      if (method === 'GET') {
        const cats = await fsGetCategories();
        return { success: true, data: cats as any };
      }
      if (method === 'POST') {
        return (await fsCreateCategory(body)) as any;
      }
    }

    if (pathname.startsWith('/api/categories/')) {
      const id = pathname.replace('/api/categories/', '');
      if (method === 'PUT') {
        return (await fsUpdateCategory(id, body)) as any;
      }
      if (method === 'DELETE') {
        return (await fsDeleteCategory(id)) as any;
      }
    }

    // --- PRODUCTS ---
    if (pathname === '/api/products' || pathname === '/api/admin/products') {
      if (method === 'GET') {
        const isAll = pathname.includes('/admin/');
        const prods = await fsGetProducts(isAll);
        return { success: true, data: prods as any };
      }
      if (method === 'POST') {
        return (await fsCreateProduct(body)) as any;
      }
    }

    if (pathname.startsWith('/api/products/')) {
      const sub = pathname.replace('/api/products/', '');
      if (sub.endsWith('/status') && method === 'PATCH') {
        const id = sub.replace('/status', '');
        return (await fsUpdateProduct(id, { status: body?.status })) as any;
      }
      if (method === 'PUT') {
        return (await fsUpdateProduct(sub, body)) as any;
      }
      if (method === 'DELETE') {
        return (await fsUpdateProduct(sub, { status: 'archived' })) as any;
      }
    }

    // --- ORDERS ---
    if (pathname === '/api/orders') {
      if (method === 'GET') {
        const userId = parsed.searchParams.get('userId') || undefined;
        const orders = await fsGetOrders(userId);
        return { success: true, data: orders as any };
      }
      if (method === 'POST') {
        return (await fsCreateOrder(body)) as any;
      }
    }

    if (pathname.startsWith('/api/orders/')) {
      const sub = pathname.replace('/api/orders/', '');
      if (sub.endsWith('/status') && method === 'PATCH') {
        const id = sub.replace('/status', '');
        return (await fsUpdateOrderStatus(id, body?.status, body?.note)) as any;
      }
    }

    // --- INVENTORY ---
    if (pathname === '/api/inventory/adjust' && method === 'POST') {
      return (await fsAdjustStock(body.productId, body.variantId, body.newStock, body.delta)) as any;
    }

    if (pathname === '/api/inventory/logs' && method === 'GET') {
      return { success: true, data: [] as any };
    }

    if (pathname === '/api/inventory/bulk-restock' && method === 'POST') {
      const prods = await fsGetProducts(true);
      for (const p of prods) {
        for (const v of p.variants) {
          if (v.stock <= v.lowStockThreshold) {
            await fsAdjustStock(p.id, v.id, undefined, 50);
          }
        }
      }
      return { success: true, message: 'Restocked low inventory items (+50)' };
    }

    // --- SETTINGS ---
    if (pathname === '/api/settings') {
      if (method === 'GET') {
        const st = await fsGetSettings();
        return { success: true, data: st as any };
      }
      if (method === 'PUT') {
        return (await fsUpdateSettings(body)) as any;
      }
    }

    // --- BANNERS ---
    if (pathname === '/api/banners' || pathname === '/api/admin/banners') {
      if (method === 'GET') {
        const bans = await fsGetBanners();
        return { success: true, data: bans as any };
      }
      if (method === 'POST') {
        return (await fsSaveBanner(body)) as any;
      }
    }

    if (pathname.startsWith('/api/banners/')) {
      const id = pathname.replace('/api/banners/', '');
      if (method === 'PUT') {
        return (await fsSaveBanner(body, id)) as any;
      }
      if (method === 'DELETE') {
        return (await fsDeleteBanner(id)) as any;
      }
    }

    // --- ADMIN METRICS ---
    if (pathname === '/api/admin/metrics' && method === 'GET') {
      const orders = await fsGetOrders();
      const prods = await fsGetProducts(true);
      const totalRevenue = orders
        .filter((o) => o.paymentStatus === 'successful' || (o.paymentMethod === 'cod' && o.orderStatus === 'Delivered'))
        .reduce((sum, o) => sum + o.finalTotal, 0);
      const totalOrders = orders.length;
      const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      const wholesaleOrders = orders.filter((o) =>
        o.items.some((i) => i.appliedTierLabel && i.appliedTierLabel.toLowerCase().includes('wholesale'))
      ).length;

      let lowStockCount = 0;
      for (const p of prods) {
        for (const v of p.variants) {
          if (v.stock <= v.lowStockThreshold) lowStockCount++;
        }
      }

      return {
        success: true,
        data: {
          totalRevenue,
          totalOrders,
          aov,
          wholesaleOrders,
          lowStockCount,
          pendingOrders: orders.filter((o) => o.orderStatus === 'Placed' || o.orderStatus === 'Confirmed' || o.orderStatus === 'Processing').length,
        } as any,
      };
    }

    // --- ADMIN SEED ---
    if (pathname === '/api/admin/seed' && method === 'POST') {
      await ensureFirestoreSeeded();
      return { success: true, message: 'Demo data loaded successfully' };
    }

    // Unhandled route
    return {
      success: false,
      error: `API route not found: ${method} ${pathname}`,
    };
  } catch (fsErr: any) {
    console.error('[safeApiFetch] Firestore fallback error:', fsErr);
    return {
      success: false,
      error: fsErr.message || 'Operation failed in database.',
    };
  }
}
