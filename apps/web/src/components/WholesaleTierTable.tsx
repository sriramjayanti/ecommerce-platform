import React from 'react';
import { PriceTier, ProductVariant } from '@ecommerce/shared';
import { CheckCircle2, Zap, Tag, ArrowRight } from 'lucide-react';

interface WholesaleTierTableProps {
  variant: ProductVariant;
  currentQuantity: number;
  onSelectQuantity?: (qty: number) => void;
}

export const WholesaleTierTable: React.FC<WholesaleTierTableProps> = ({
  variant,
  currentQuantity,
  onSelectQuantity,
}) => {
  if (!variant.pricingTiers || variant.pricingTiers.length === 0) {
    return null;
  }

  const sortedTiers = [...variant.pricingTiers].sort((a, b) => a.minQty - b.minQty);
  const mrp = variant.mrp || variant.basePrice;

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 p-4 sm:p-5 shadow-xs space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-200/70 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black shadow-xs">
            <Zap className="h-4 w-4 fill-slate-950" />
          </div>
          <div>
            <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
              Wholesale Quantity Slabs & Special Offers
            </h4>
            <p className="text-[11px] text-amber-900 font-medium">
              Buy this quantity, get each unit at discounted wholesale rates!
            </p>
          </div>
        </div>
        <span className="rounded-full bg-amber-100 border border-amber-300 text-amber-900 px-2.5 py-0.5 text-[10px] font-black uppercase">
          {sortedTiers.length} Offers Active
        </span>
      </div>

      {/* Offers Slabs Cards (Mobile friendly & interactive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {sortedTiers.map((tier, idx) => {
          const isMatch =
            currentQuantity >= tier.minQty &&
            (tier.maxQty === null || tier.maxQty === undefined || currentQuantity <= tier.maxQty);
          const perUnitSavings = Math.max(0, mrp - tier.unitPrice);
          const discountVsMrp = mrp > 0 ? Math.round(((mrp - tier.unitPrice) / mrp) * 100) : 0;
          const slabLabel = tier.maxQty ? `${tier.minQty} – ${tier.maxQty} units` : `${tier.minQty}+ units`;

          return (
            <div
              key={tier.id || idx}
              onClick={() => onSelectQuantity && onSelectQuantity(tier.minQty)}
              className={`rounded-xl border p-3 cursor-pointer transition-all duration-200 space-y-1.5 ${
                isMatch
                  ? 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500/20 shadow-sm'
                  : 'border-amber-200/90 bg-white hover:border-amber-400 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Tag className="h-3 w-3 text-amber-600" />
                  <span>Buy {slabLabel}</span>
                </span>
                {isMatch ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    <span>Applied Now</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Click to select {tier.minQty}
                  </span>
                )}
              </div>

              {/* Offer message */}
              <div className="flex items-baseline justify-between pt-0.5">
                <div>
                  <span className="text-base font-black text-slate-950 font-sans">
                    ₹{tier.unitPrice}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold"> / unit</span>
                </div>
                {perUnitSavings > 0 && (
                  <span className="text-[11px] font-extrabold text-emerald-700">
                    Save ₹{perUnitSavings}/unit ({discountVsMrp}% OFF)
                  </span>
                )}
              </div>

              <p className="text-[10px] text-slate-600 font-medium leading-snug">
                Buy {slabLabel} and you get each at <strong className="text-slate-900">₹{tier.unitPrice}</strong> instead of ₹{variant.basePrice}!
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
