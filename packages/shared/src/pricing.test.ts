import test from 'node:test';
import assert from 'node:assert';
import { resolveUnitPrice, validatePriceTiers, getNextTierNudge, calculateCartTotals } from './pricing';
import { ProductVariant, PriceTier } from './types';

test('validatePriceTiers rejects overlapping tiers', () => {
  const overlappingTiers: PriceTier[] = [
    { id: '1', minQty: 1, maxQty: 5, unitPrice: 100 },
    { id: '2', minQty: 5, maxQty: 10, unitPrice: 90 }, // overlaps at 5
  ];
  const result = validatePriceTiers(overlappingTiers);
  assert.strictEqual(result.isValid, false);
});

test('validatePriceTiers accepts valid non-overlapping tiers', () => {
  const validTiers: PriceTier[] = [
    { id: '1', minQty: 1, maxQty: 4, unitPrice: 110, label: 'Retail' },
    { id: '2', minQty: 5, maxQty: 9, unitPrice: 105, label: 'Pack' },
    { id: '3', minQty: 10, maxQty: 24, unitPrice: 98, label: 'Wholesale' },
    { id: '4', minQty: 25, maxQty: null, unitPrice: 92, label: 'Bulk Wholesale' },
  ];
  const result = validatePriceTiers(validTiers);
  assert.strictEqual(result.isValid, true);
});

test('resolveUnitPrice resolves correct tier based on boundary quantities', () => {
  const variant: ProductVariant = {
    id: 'v1',
    name: '1 kg',
    sku: 'RICE-1KG',
    weightOrSize: '1kg',
    mrp: 130,
    basePrice: 110,
    stock: 100,
    lowStockThreshold: 10,
    pricingTiers: [
      { id: '1', minQty: 1, maxQty: 4, unitPrice: 110 },
      { id: '2', minQty: 5, maxQty: 9, unitPrice: 105 },
      { id: '3', minQty: 10, maxQty: 24, unitPrice: 98 },
      { id: '4', minQty: 25, maxQty: null, unitPrice: 92 },
    ],
  };

  // 1 unit -> 110
  assert.strictEqual(resolveUnitPrice(variant, 1).unitPrice, 110);
  // 4 units -> 110
  assert.strictEqual(resolveUnitPrice(variant, 4).unitPrice, 110);
  // 5 units -> 105
  assert.strictEqual(resolveUnitPrice(variant, 5).unitPrice, 105);
  // 9 units -> 105
  assert.strictEqual(resolveUnitPrice(variant, 9).unitPrice, 105);
  // 10 units -> 98
  assert.strictEqual(resolveUnitPrice(variant, 10).unitPrice, 98);
  // 24 units -> 98
  assert.strictEqual(resolveUnitPrice(variant, 24).unitPrice, 98);
  // 25 units -> 92
  assert.strictEqual(resolveUnitPrice(variant, 25).unitPrice, 92);
  // 100 units -> 92
  assert.strictEqual(resolveUnitPrice(variant, 100).unitPrice, 92);
});

test('getNextTierNudge returns correct units needed and savings', () => {
  const variant: ProductVariant = {
    id: 'v1',
    name: '1 kg',
    sku: 'RICE-1KG',
    weightOrSize: '1kg',
    mrp: 130,
    basePrice: 110,
    stock: 100,
    lowStockThreshold: 10,
    pricingTiers: [
      { id: '1', minQty: 1, maxQty: 4, unitPrice: 110 },
      { id: '2', minQty: 5, maxQty: 9, unitPrice: 105 },
      { id: '3', minQty: 10, maxQty: 24, unitPrice: 98 },
    ],
  };

  // Qty 3 -> needs 2 more for 5 @ 105 (saving 5/unit)
  const nudge1 = getNextTierNudge(variant, 3);
  assert.ok(nudge1);
  assert.strictEqual(nudge1?.unitsNeeded, 2);
  assert.strictEqual(nudge1?.nextUnitPrice, 105);

  // Qty 8 -> needs 2 more for 10 @ 98 (saving 7/unit)
  const nudge2 = getNextTierNudge(variant, 8);
  assert.ok(nudge2);
  assert.strictEqual(nudge2?.unitsNeeded, 2);
  assert.strictEqual(nudge2?.nextUnitPrice, 98);
});
