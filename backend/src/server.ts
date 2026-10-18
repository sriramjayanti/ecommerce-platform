import express from 'express';
import cors from 'cors';
import { db } from './services/db';
import { validatePriceTiers } from '@ecommerce/shared';
import { OrderService } from './services/orderService';
import { PhonePeService } from './services/phonepeService';
import { InventoryService } from './services/inventoryService';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ----------------- ROOT & HEALTH CHECK -----------------
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>DailyFresh & Wholesale Mart — Backend API</title>
        <style>
          body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; }
          .card { background: #1e293b; border-radius: 16px; padding: 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border: 1px solid #334155; }
          h1 { color: #10b981; margin-top: 0; font-size: 22px; }
          .badge { display: inline-block; background: #065f46; color: #6ee7b7; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px; margin-bottom: 16px; }
          .btn { display: inline-block; padding: 10px 18px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 13px; margin-right: 10px; margin-top: 8px; }
          .btn-primary { background: #10b981; color: #022c22; }
          .btn-secondary { background: #334155; color: #f8fafc; }
          ul { list-style: none; padding-left: 0; font-size: 13px; line-height: 1.8; color: #94a3b8; }
          code { color: #38bdf8; background: #0f172a; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="card">
          <span class="badge">● Backend API Online</span>
          <h1>DailyFresh & Wholesale Mart API Server</h1>
          <p style="font-size: 14px; color: #cbd5e1;">The backend services, PhonePe gateway integration, and wholesale pricing engine are actively running on <code>http://localhost:3001</code>.</p>
          
          <div style="margin-top: 20px; margin-bottom: 24px;">
            <a href="http://localhost:5173" target="_blank" class="btn btn-primary">Open Customer Web (Port 5173)</a>
            <a href="http://localhost:5174" target="_blank" class="btn btn-secondary">Open Admin Dashboard (Port 5174)</a>
          </div>

          <h3 style="font-size: 14px; color: #f1f5f9; border-top: 1px solid #334155; padding-top: 16px;">Core API Endpoints:</h3>
          <ul>
            <li><code>GET /api/products</code> — Product catalog with wholesale pricing tiers</li>
            <li><code>GET /api/categories</code> — Category taxonomy & subcategories</li>
            <li><code>GET /api/settings</code> — Store config & dynamic feature toggles</li>
            <li><code>POST /api/orders</code> — Server-calculated order placement</li>
            <li><code>GET /api/admin/metrics</code> — Business analytics & revenue metrics</li>
            <li><code>POST /api/admin/seed</code> — Reset & dump rich demo data</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

app.get('/api', (req, res) => {
  res.json({
    status: 'online',
    service: 'DailyFresh E-Commerce API',
    version: '1.0.0',
    productsCount: db.products.length,
    categoriesCount: db.categories.length,
    ordersCount: db.orders.length,
    timestamp: new Date().toISOString(),
  });
});

// ----------------- DEMO DATA SEED & RESET -----------------
app.post(['/api/admin/seed', '/api/seed', '/api/seed-demo-data'], (req, res) => {
  db.resetDemoData();
  res.json({
    success: true,
    message: 'Comprehensive demo data successfully dumped and reset!',
    data: {
      categoriesCount: db.categories.length,
      productsCount: db.products.length,
      ordersCount: db.orders.length,
      reviewsCount: db.reviews.length,
      bannersCount: db.banners.length,
      inventoryLogsCount: db.inventoryLogs.length,
    },
  });
});

// ----------------- ADMIN AUTH -----------------
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find matching user or fallback to standard demo accounts
  const user = db.users.find((u) => u.email?.toLowerCase() === email?.toLowerCase());
  
  if (user && (user.role === 'super_admin' || user.role === 'order_manager' || user.role === 'inventory_manager')) {
    user.lastLoginAt = new Date().toISOString();
    return res.json({
      success: true,
      data: {
        user,
        token: `mock_jwt_token_${user.id}_${Date.now()}`,
      },
    });
  }

  // Allow admin login for demo purposes
  if (email === 'admin@dailyfreshmart.com' || email === 'admin' || password === 'admin123') {
    const adminUser = db.users[0];
    adminUser.lastLoginAt = new Date().toISOString();
    return res.json({
      success: true,
      data: {
        user: adminUser,
        token: `mock_jwt_token_admin_${Date.now()}`,
      },
    });
  }

  res.status(401).json({ success: false, error: 'Invalid admin credentials' });
});

// ----------------- STORE SETTINGS & FEATURE FLAGS -----------------
app.get('/api/settings', (req, res) => {
  res.json({ success: true, data: db.settings });
});

app.put('/api/settings', (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  res.json({ success: true, data: db.settings });
});

// ----------------- CATEGORIES -----------------
app.get('/api/categories', (req, res) => {
  const visible = db.categories.filter((c) => c.isVisible);
  res.json({ success: true, data: visible });
});

app.get('/api/admin/categories', (req, res) => {
  res.json({ success: true, data: db.categories });
});

app.post('/api/categories', (req, res) => {
  const newCat = {
    id: `cat-${Date.now()}`,
    slug: req.body.slug || req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    sortOrder: req.body.sortOrder || db.categories.length + 1,
    isVisible: true,
    subcategories: req.body.subcategories || [],
    ...req.body,
  };
  db.categories.push(newCat);
  res.json({ success: true, data: newCat });
});

app.put('/api/categories/:id', (req, res) => {
  const idx = db.categories.findIndex((c) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Category not found' });
  db.categories[idx] = { ...db.categories[idx], ...req.body };
  res.json({ success: true, data: db.categories[idx] });
});

app.delete('/api/categories/:id', (req, res) => {
  const hasProducts = db.products.some((p) => p.categoryId === req.params.id && p.status === 'active');
  if (hasProducts) {
    return res.status(400).json({
      success: false,
      error: 'Cannot delete category that still has active products assigned. Reassign products first.',
    });
  }
  db.categories = db.categories.filter((c) => c.id !== req.params.id);
  res.json({ success: true, message: 'Category removed' });
});

// ----------------- PRODUCTS & CATALOG -----------------
app.get('/api/products', (req, res) => {
  const { category, search, sort, wholesaleOnly, featured } = req.query;

  let list = db.products.filter((p) => p.status === 'active');

  if (category && category !== 'all') {
    list = list.filter((p) => p.categoryId === category || p.subcategoryId === category);
  }

  if (wholesaleOnly === 'true') {
    list = list.filter((p) => p.isWholesaleEnabled);
  }

  if (featured === 'true') {
    list = list.filter((p) => p.isFeatured);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.variants.some((v) => v.sku?.toLowerCase().includes(q))
    );
  }

  if (sort === 'price-low') {
    list.sort((a, b) => (a.variants[0]?.basePrice || 0) - (b.variants[0]?.basePrice || 0));
  } else if (sort === 'price-high') {
    list.sort((a, b) => (b.variants[0]?.basePrice || 0) - (a.variants[0]?.basePrice || 0));
  } else if (sort === 'rating') {
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (sort === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ success: true, data: list });
});

app.get('/api/admin/products', (req, res) => {
  res.json({ success: true, data: db.products });
});

app.get('/api/products/:idOrSlug', (req, res) => {
  const item = db.products.find(
    (p) => p.id === req.params.idOrSlug || p.slug === req.params.idOrSlug
  );
  if (!item) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: item });
});

app.post('/api/products', (req, res) => {
  try {
    const productData = req.body;

    // Validate tier pricing for each variant
    for (const variant of productData.variants || []) {
      const val = validatePriceTiers(variant.pricingTiers || []);
      if (!val.isValid) {
        return res.status(400).json({ success: false, error: val.error });
      }
    }

    const newProduct = {
      id: `prod-${Date.now()}`,
      slug: productData.slug || productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      rating: 5.0,
      reviewCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...productData,
    };

    db.products.unshift(newProduct);
    res.json({ success: true, data: newProduct });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  const idx = db.products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Product not found' });

  // Validate tier pricing on update
  for (const variant of req.body.variants || []) {
    const val = validatePriceTiers(variant.pricingTiers || []);
    if (!val.isValid) {
      return res.status(400).json({ success: false, error: val.error });
    }
  }

  db.products[idx] = {
    ...db.products[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  res.json({ success: true, data: db.products[idx] });
});

app.delete('/api/products/:id', (req, res) => {
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

  // Safe deletion: archive product
  product.status = 'archived';
  product.updatedAt = new Date().toISOString();
  res.json({ success: true, message: 'Product archived successfully', data: product });
});

// ----------------- CART CALCULATION (Authoritative) -----------------
app.post('/api/cart/calculate', (req, res) => {
  try {
    const { items } = req.body;
    const calc = OrderService.calculateAuthoritativeOrder(items || []);
    res.json({ success: true, data: calc });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------- ORDERS -----------------
app.post('/api/orders', async (req, res) => {
  try {
    const result = await OrderService.createOrder(req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/orders', (req, res) => {
  const { userId } = req.query;
  if (userId && typeof userId === 'string') {
    const userOrders = db.orders.filter((o) => o.userId === userId);
    return res.json({ success: true, data: userOrders });
  }
  res.json({ success: true, data: db.orders });
});

app.get('/api/orders/:id', (req, res) => {
  const order = db.orders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
  res.json({ success: true, data: order, whatsappSupportUrl: OrderService.getWhatsAppSupportUrl(order) });
});

app.patch('/api/orders/:id/status', (req, res) => {
  try {
    const { status, note } = req.body;
    const updated = OrderService.updateFulfillmentStatus(req.params.id, status, note, 'admin');
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ----------------- PHONEPE PAYMENTS & WEBHOOKS -----------------
app.post('/api/payments/verify', async (req, res) => {
  try {
    const { merchantTransactionId, status, phonepeTxnId } = req.body;
    const order = await OrderService.finalizePaymentAndOrder(
      merchantTransactionId,
      status || 'successful',
      phonepeTxnId
    );
    res.json({ success: true, data: order });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  try {
    const { response } = req.body;
    // Decode base64 payload
    const decoded = JSON.parse(Buffer.from(response, 'base64').toString('utf8'));
    const { merchantTransactionId, transactionId, responseCode } = decoded.data;

    const status = responseCode === 'SUCCESS' ? 'successful' : 'failed';
    const order = await OrderService.finalizePaymentAndOrder(
      merchantTransactionId,
      status,
      transactionId
    );

    res.json({ success: true, message: 'Webhook processed', orderNumber: order.orderNumber });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- INVENTORY & AUDIT LOGS -----------------
app.get('/api/inventory/logs', (req, res) => {
  res.json({ success: true, data: db.inventoryLogs });
});

app.post('/api/inventory/adjust', (req, res) => {
  try {
    const { productId, variantId, newStock, delta, reason } = req.body;
    let result;
    if (newStock !== undefined && newStock !== null) {
      result = InventoryService.setStock(productId, variantId, Number(newStock), reason || 'manual_adjustment', 'admin');
    } else {
      result = InventoryService.adjustStock(productId, variantId, Number(delta || 0), reason || 'restock', 'admin');
    }
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/inventory/bulk-restock', (req, res) => {
  try {
    const { unitsToAdd = 50 } = req.body;
    let updatedCount = 0;

    for (const p of db.products) {
      for (const v of p.variants) {
        if (v.stock <= v.lowStockThreshold) {
          InventoryService.adjustStock(p.id, v.id, Number(unitsToAdd), 'restock', 'admin_bulk');
          updatedCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Bulk restocked ${updatedCount} low-stock variants by +${unitsToAdd} units each.`,
      updatedCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ----------------- BANNERS -----------------
app.get('/api/banners', (req, res) => {
  const active = db.banners.filter((b) => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  res.json({ success: true, data: active });
});

app.get('/api/admin/banners', (req, res) => {
  res.json({ success: true, data: db.banners });
});

app.post('/api/banners', (req, res) => {
  const banner = {
    id: `banner-${Date.now()}`,
    sortOrder: req.body.sortOrder || db.banners.length + 1,
    isActive: req.body.isActive !== undefined ? req.body.isActive : true,
    ...req.body,
  };
  db.banners.push(banner);
  res.json({ success: true, data: banner });
});

app.put('/api/banners/:id', (req, res) => {
  const idx = db.banners.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Banner not found' });
  db.banners[idx] = { ...db.banners[idx], ...req.body };
  res.json({ success: true, data: db.banners[idx] });
});

app.delete('/api/banners/:id', (req, res) => {
  db.banners = db.banners.filter((b) => b.id !== req.params.id);
  res.json({ success: true, message: 'Banner removed successfully' });
});

// ----------------- REVIEWS & MODERATION -----------------
app.get('/api/reviews', (req, res) => {
  const { productId, status } = req.query;
  let list = db.reviews;
  if (productId) list = list.filter((r) => r.productId === productId);
  if (status && status !== 'all') list = list.filter((r) => r.status === status);
  res.json({ success: true, data: list });
});

app.post('/api/reviews', (req, res) => {
  const review = {
    id: `rev-${Date.now()}`,
    status: 'approved', // auto-approve or pending moderation
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  db.reviews.unshift(review);
  res.json({ success: true, data: review });
});

app.patch('/api/reviews/:id/moderate', (req, res) => {
  const rev = db.reviews.find((r) => r.id === req.params.id);
  if (!rev) return res.status(404).json({ success: false, error: 'Review not found' });
  rev.status = req.body.status;
  res.json({ success: true, data: rev });
});

app.delete('/api/reviews/:id', (req, res) => {
  db.reviews = db.reviews.filter((r) => r.id !== req.params.id);
  res.json({ success: true, message: 'Review deleted successfully' });
});

// ----------------- ADMIN DASHBOARD METRICS -----------------
app.get('/api/admin/metrics', (req, res) => {
  const totalRevenue = db.orders
    .filter((o) => o.paymentStatus === 'successful' || (o.paymentMethod === 'cod' && o.orderStatus === 'Delivered'))
    .reduce((sum, o) => sum + o.finalTotal, 0);

  const totalOrders = db.orders.length;
  const aov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Wholesale metrics: count orders that bought wholesale tiers
  const wholesaleOrders = db.orders.filter((o) =>
    o.items.some((i) => i.appliedTierLabel && i.appliedTierLabel.toLowerCase().includes('wholesale'))
  ).length;

  let lowStockCount = 0;
  for (const p of db.products) {
    for (const v of p.variants) {
      if (v.stock <= v.lowStockThreshold) {
        lowStockCount++;
      }
    }
  }

  res.json({
    success: true,
    data: {
      totalRevenue,
      totalOrders,
      aov,
      wholesaleOrders,
      lowStockCount,
      pendingOrders: db.orders.filter((o) => o.orderStatus === 'Placed' || o.orderStatus === 'Confirmed' || o.orderStatus === 'Packed' || o.orderStatus === 'Processing').length,
    },
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
