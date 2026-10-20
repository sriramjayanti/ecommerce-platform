process.env.NODE_ENV = 'test';

import assert from 'node:assert';
import http from 'node:http';
import { app } from './server';
import { db } from './services/db';

async function runVerification() {
  console.log('🚀 Starting End-to-End System Verification...');

  // Start server on an ephemeral port
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`📡 Test server running on ${baseUrl}`);

  const request = async (path: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...(options.headers as any),
    };
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }
    return { status: res.status, contentType, text, json };
  };

  try {
    // 1. Verify JSON 404 handler (Prevents "Unexpected token '<'")
    console.log('\n--- 1. Testing JSON Error Responses (No HTML) ---');
    const notFoundRes = await request('/api/non-existent-route-xyz');
    assert.strictEqual(notFoundRes.status, 404, 'Should return 404');
    assert.ok(notFoundRes.contentType.includes('application/json'), '404 must be JSON');
    assert.strictEqual(notFoundRes.json?.success, false);
    assert.ok(!notFoundRes.text.includes('<!DOCTYPE'), 'Must not return HTML');
    console.log('✔ Non-existent API route returns valid JSON 404 instead of HTML');

    // 2. Admin Category Creation & Validation
    console.log('\n--- 2. Testing Admin Category Management ---');
    const catName = `Organic Fruits & Greens ${Date.now()}`;
    const createCatRes = await request('/api/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: catName,
        slug: `organic-greens-${Date.now()}`,
        imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200',
        sortOrder: 5,
        isActive: true,
      }),
    });
    assert.ok(createCatRes.status === 200 || createCatRes.status === 201, 'Should return 200 or 201');
    assert.strictEqual(createCatRes.json?.success, true);
    const createdCatId = createCatRes.json.data.id;
    assert.ok(createdCatId, 'Category ID should exist');
    console.log(`✔ Category created: ${catName} (ID: ${createdCatId})`);

    // Duplicate Category prevention
    const duplicateCatRes = await request('/api/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: catName.toLowerCase(), // case-insensitive check
        slug: 'some-other-slug',
      }),
    });
    assert.strictEqual(duplicateCatRes.status, 400);
    assert.strictEqual(duplicateCatRes.json?.success, false);
    assert.ok(duplicateCatRes.json.error.includes('already exists'));
    console.log('✔ Duplicate category name correctly rejected with 400 JSON');

    // 3. Admin Product Creation & Validation
    console.log('\n--- 3. Testing Admin Product Creation & Validation ---');
    const testSku = `TEST-E2E-${Date.now()}`;
    const initialStock = 25;
    const createProdRes = await request('/api/products', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Fresh Alphonso Mangoes Ratnagiri',
        description: 'Naturally ripened carbide-free premium mangoes direct from Konkan orchards.',
        categoryId: createdCatId,
        brand: 'DailyFresh Direct',
        images: ['https://images.unsplash.com/photo-1553279768-865429fa0078?w=500'],
        tags: ['mango', 'fruit', 'organic'],
        status: 'active',
        isWholesaleEnabled: true,
        variants: [
          {
            name: '1 Dozen Box (12 pcs)',
            sku: testSku,
            basePrice: 850,
            mrp: 1200,
            stock: initialStock,
            lowStockThreshold: 5,
            pricingTiers: [
              { minQty: 1, maxQty: 2, pricePerUnit: 850 },
              { minQty: 3, maxQty: 999, pricePerUnit: 750 },
            ],
          },
        ],
      }),
    });
    assert.ok(createProdRes.status === 200 || createProdRes.status === 201, 'Product creation should return 200 or 201');
    assert.strictEqual(createProdRes.json?.success, true);
    const createdProduct = createProdRes.json.data;
    const variantId = createdProduct.variants[0].id;
    console.log(`✔ Product created: ${createdProduct.title} (Stock: ${createdProduct.variants[0].stock})`);

    // Verify deletion of category with products is blocked
    const delCatRes = await request(`/api/categories/${createdCatId}`, { method: 'DELETE' });
    assert.strictEqual(delCatRes.status, 400);
    assert.ok(delCatRes.json.error.includes('products'));
    console.log('✔ Prevented deletion of category while products are assigned');

    // 4. Product Status Toggle
    console.log('\n--- 4. Testing Product Status Toggle ---');
    const patchStatusRes = await request(`/api/products/${createdProduct.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'draft' }),
    });
    assert.strictEqual(patchStatusRes.status, 200);
    assert.strictEqual(patchStatusRes.json?.data?.status, 'draft');

    // Draft product should not be visible in public customer catalog
    const pubProdsRes = await request('/api/products');
    const inPubCatalog = pubProdsRes.json.data.some((p: any) => p.id === createdProduct.id);
    assert.strictEqual(inPubCatalog, false, 'Draft product must NOT appear in customer catalog');

    // But should be visible in admin catalog
    const adminProdsRes = await request('/api/admin/products');
    const inAdminCatalog = adminProdsRes.json.data.some((p: any) => p.id === createdProduct.id);
    assert.strictEqual(inAdminCatalog, true, 'Draft product MUST appear in admin catalog');
    console.log('✔ Product draft/active visibility works correctly between customer and admin');

    // Activate product for ordering
    await request(`/api/products/${createdProduct.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' }),
    });

    // 5. Shared Inventory & Order Placement
    console.log('\n--- 5. Testing Shared Inventory & Order Placement ---');
    // Attempt order exceeding available stock (25 + 10 = 35 > 25)
    const excessOrderRes = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Aarav Sharma',
        customerPhone: '9876543210',
        customerEmail: 'aarav@example.com',
        fulfillmentMethod: 'home_delivery',
        deliveryAddress: {
          addressLine: 'Flat 402, Green Glen Layout, Bellandur',
          city: 'Bengaluru',
          pincode: '560103',
        },
        paymentMethod: 'cod',
        items: [
          {
            productId: createdProduct.id,
            variantId: variantId,
            productTitle: createdProduct.title,
            variantName: createdProduct.variants[0].name,
            sku: testSku,
            quantity: 35, // exceeds 25
            unitPrice: 750,
            lineTotal: 35 * 750,
          },
        ],
        subtotal: 35 * 750,
        deliveryCharge: 0,
        finalTotal: 35 * 750,
      }),
    });
    assert.strictEqual(excessOrderRes.status, 400);
    assert.strictEqual(excessOrderRes.json.success, false);
    assert.ok(excessOrderRes.json.error.includes('Insufficient stock'));
    console.log('✔ Order exceeding stock safely rejected with clear message');

    // Valid Takeaway + COD Order (qty: 3, stock should go from 25 -> 22)
    const orderQty = 3;
    const validOrderRes = await request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Aarav Sharma',
        customerPhone: '9876543210',
        customerEmail: 'aarav@example.com',
        fulfillmentMethod: 'takeaway',
        deliveryAddress: {
          addressLine: 'Store Pickup Counter - Indiranagar Mart',
          city: 'Bengaluru',
          pincode: '560038',
        },
        paymentMethod: 'cod',
        items: [
          {
            productId: createdProduct.id,
            variantId: variantId,
            productTitle: createdProduct.title,
            variantName: createdProduct.variants[0].name,
            sku: testSku,
            quantity: orderQty,
            unitPrice: 750,
            lineTotal: orderQty * 750,
          },
        ],
        subtotal: orderQty * 750,
        deliveryCharge: 0,
        finalTotal: orderQty * 750,
      }),
    });
    assert.ok(validOrderRes.status === 200 || validOrderRes.status === 201, 'Order creation should return 200 or 201');
    const placedOrder = validOrderRes.json.data.order || validOrderRes.json.data;
    assert.ok(placedOrder.id, 'Order ID must exist');
    assert.strictEqual(placedOrder.fulfillmentMethod, 'takeaway');
    assert.strictEqual(placedOrder.paymentMethod, 'cod');
    assert.strictEqual(placedOrder.paymentStatus.toLowerCase(), 'pending');
    console.log(`✔ Order placed successfully: ID #${placedOrder.orderNumber} (${placedOrder.id})`);

    // Verify stock deduction in database
    const postOrderProd = db.products.find((p) => p.id === createdProduct.id);
    const postOrderVariant = postOrderProd?.variants.find((v) => v.id === variantId);
    assert.strictEqual(postOrderVariant?.stock, initialStock - orderQty);
    console.log(`✔ Inventory safely reduced from ${initialStock} to ${postOrderVariant?.stock} units`);

    // 6. Connect Customer Orders to Admin Panel
    console.log('\n--- 6. Testing Admin Orders Connection & Status Update ---');
    const adminOrdersRes = await request('/api/orders');
    assert.strictEqual(adminOrdersRes.status, 200);
    const foundInAdmin = adminOrdersRes.json.data.find((o: any) => o.id === placedOrder.id);
    assert.ok(foundInAdmin, 'New order must be visible to Admin');
    assert.strictEqual(foundInAdmin.customerName, 'Aarav Sharma');
    assert.strictEqual(foundInAdmin.fulfillmentMethod, 'takeaway');
    assert.strictEqual(foundInAdmin.paymentMethod, 'cod');
    console.log('✔ Order immediately visible in Admin order list with full details');

    // Update order status to 'Cancelled' and verify inventory restoration
    console.log('\n--- 7. Testing Order Cancellation & Stock Restoration ---');
    const cancelRes = await request(`/api/orders/${placedOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Cancelled' }),
    });
    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.json.data.orderStatus, 'Cancelled');

    // Stock should be restored back to 25
    const restoredProd = db.products.find((p) => p.id === createdProduct.id);
    const restoredVariant = restoredProd?.variants.find((v) => v.id === variantId);
    assert.strictEqual(restoredVariant?.stock, initialStock);
    console.log(`✔ Inventory safely restored upon order cancellation (back to ${restoredVariant?.stock} units)`);

    // Re-cancelling should NOT double-restore stock
    await request(`/api/orders/${placedOrder.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'Cancelled' }),
    });
    const doubleCancelProd = db.products.find((p) => p.id === createdProduct.id);
    const doubleCancelVariant = doubleCancelProd?.variants.find((v) => v.id === variantId);
    assert.strictEqual(doubleCancelVariant?.stock, initialStock, 'Stock must not be restored twice');
    console.log('✔ Idempotent order cancellation verified (no duplicate inventory restoration)');

    console.log('\n🎉 ALL 7 TEST SUITES PASSED FLAWLESSLY! 🎉\n');
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
  }
}

runVerification().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
