import { PriceTier, ProductVariant, CartItem, CartTotals, StoreSettings } from './types';

/**
 * Validates that price tiers do not overlap and have valid numbers.
 */
export function validatePriceTiers(tiers: PriceTier[]): { isValid: boolean; error?: string } {
  if (!tiers || tiers.length === 0) {
    return { isValid: true };
  }

  // Sort by minQty ascending
  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    if (current.minQty < 1) {
      return { isValid: false, error: `Tier minQty must be >= 1 (found ${current.minQty})` };
    }
    if (current.unitPrice <= 0) {
      return { isValid: false, error: `Tier unitPrice must be > 0 (found ${current.unitPrice})` };
    }

    if (current.maxQty !== null && current.maxQty !== undefined) {
      if (current.maxQty < current.minQty) {
        return {
          isValid: false,
          error: `Tier maxQty (${current.maxQty}) cannot be less than minQty (${current.minQty})`,
        };
      }
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      if (prev.maxQty === null || prev.maxQty === undefined) {
        return {
          isValid: false,
          error: `Tier starting at ${prev.minQty} is unbounded, cannot have subsequent tiers`,
        };
      }
      if (current.minQty <= prev.maxQty) {
        return {
          isValid: false,
          error: `Overlapping tiers: Tier ${prev.minQty}-${prev.maxQty} overlaps with Tier starting at ${current.minQty}`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Calculates the exact unit price for a given variant and quantity.
 * If wholesale pricing is enabled for the store & product, matches against non-overlapping slabs.
 */
export function resolveUnitPrice(
  variant: ProductVariant,
  quantity: number,
  isWholesaleEnabled: boolean = true
): { unitPrice: number; appliedTier?: PriceTier } {
  if (quantity <= 0) {
    return { unitPrice: variant.basePrice };
  }

  if (!isWholesaleEnabled || !variant.pricingTiers || variant.pricingTiers.length === 0) {
    return { unitPrice: variant.basePrice };
  }

  // Find matching tier
  for (const tier of variant.pricingTiers) {
    const minMatch = quantity >= tier.minQty;
    const maxMatch = tier.maxQty === null || tier.maxQty === undefined || quantity <= tier.maxQty;
    if (minMatch && maxMatch) {
      return { unitPrice: tier.unitPrice, appliedTier: tier };
    }
  }

  return { unitPrice: variant.basePrice };
}

/**
 * Computes nudge text to inform user how many more units are needed for the next lower tier price.
 */
export function getNextTierNudge(
  variant: ProductVariant,
  currentQty: number,
  isWholesaleEnabled: boolean = true
): { unitsNeeded: number; nextUnitPrice: number; nextMinQty: number; savingsPerUnit: number } | null {
  if (!isWholesaleEnabled || !variant.pricingTiers || variant.pricingTiers.length === 0) {
    return null;
  }

  const { unitPrice: currentPrice } = resolveUnitPrice(variant, currentQty, isWholesaleEnabled);

  // Sort tiers by minQty ascending
  const sortedTiers = [...variant.pricingTiers].sort((a, b) => a.minQty - b.minQty);

  // Find next tier with minQty > currentQty and unitPrice < currentPrice
  const nextTier = sortedTiers.find(
    (tier) => tier.minQty > currentQty && tier.unitPrice < currentPrice
  );

  if (!nextTier) {
    return null;
  }

  return {
    unitsNeeded: nextTier.minQty - currentQty,
    nextUnitPrice: nextTier.unitPrice,
    nextMinQty: nextTier.minQty,
    savingsPerUnit: currentPrice - nextTier.unitPrice,
  };
}

/**
 * Computes authoritative cart totals given an array of cart items and store settings.
 */
export function calculateCartTotals(
  items: CartItem[],
  settings: Pick<StoreSettings, 'deliveryCharge' | 'freeDeliveryThreshold' | 'taxPercentage'>
): CartTotals {
  let subtotal = 0;
  let totalMrp = 0;
  let itemCount = 0;

  for (const item of items) {
    subtotal += item.unitPrice * item.quantity;
    totalMrp += item.mrp * item.quantity;
    itemCount += item.quantity;
  }

  const totalSavings = Math.max(0, totalMrp - subtotal);
  const deliveryCharge =
    subtotal >= settings.freeDeliveryThreshold || subtotal === 0 ? 0 : settings.deliveryCharge;
  
  // Tax calculation (if inclusive or exclusive - standard practice: display tax component)
  const taxAmount = Math.round((subtotal * (settings.taxPercentage || 0)) / 100);
  const finalTotal = subtotal + deliveryCharge;

  return {
    subtotal,
    totalMrp,
    totalSavings,
    deliveryCharge,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
    taxAmount,
    finalTotal,
    itemCount,
  };
}
