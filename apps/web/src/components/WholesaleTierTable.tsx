import React from 'react';
import { PriceTier, ProductVariant } from '@ecommerce/shared';
import { CheckCircle2, Zap } from 'lucide-react';

interface WholesaleTierTableProps {
  variant: ProductVariant;
  currentQuantity: number;
}

export const WholesaleTierTable: React.FC<WholesaleTierTableProps> = ({ variant, currentQuantity }) => {
  if (!variant.pricingTiers || variant.pricingTiers.length === 0) {
    return null;
  }

  const sortedTiers = [...variant.pricingTiers].sort((a, b) => a.minQty - b.minQty);

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
          <Zap className="h-4 w-4 fill-current" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm md:text-base">
            Wholesale Quantity Slabs (Buy More, Pay Less)
          </h4>
          <p className="text-xs text-amber-900/80">Unit price automatically discounts as your order quantity increases</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm">
          <thead>
            <tr className="border-b border-amber-200/60 text-slate-600 font-semibold">
              <th className="pb-2">Quantity Slab</th>
              <th className="pb-2">Unit Price</th>
              <th className="pb-2">Discount vs MRP</th>
              <th className="pb-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-200/40">
            {sortedTiers.map((tier) => {
              const isMatch =
                currentQuantity >= tier.minQty &&
                (tier.maxQty === null || tier.maxQty === undefined || currentQuantity <= tier.maxQty);
              const discountVsMrp = Math.round(((variant.mrp - tier.unitPrice) / variant.mrp) * 100);

              return (
                <tr
                  key={tier.id}
                  className={`transition-colors ${
                    isMatch
                      ? 'bg-amber-100/90 font-bold text-emerald-950'
                      : 'hover:bg-amber-50 text-slate-700'
                  }`}
                >
                  <td className="py-2.5">
                    {tier.label || (tier.maxQty ? `${tier.minQty} – ${tier.maxQty} units` : `${tier.minQty}+ units`)}
                  </td>
                  <td className="py-2.5">
                    <span className="text-emerald-700 font-extrabold text-sm md:text-base">
                      ₹{tier.unitPrice}
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal"> / unit</span>
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      Save {discountVsMrp}%
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {isMatch ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs bg-white px-2 py-1 rounded-md shadow-xs border border-emerald-200">
                        <CheckCircle2 className="h-3.5 w-3.5 fill-emerald-600 text-white" />
                        Applied
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        {currentQuantity < tier.minQty ? `Add ${tier.minQty - currentQuantity} more` : 'Passed'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
