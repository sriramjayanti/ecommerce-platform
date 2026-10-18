import React from 'react';
import { CreditCard, ShieldCheck, Zap, RefreshCw, Truck } from 'lucide-react';

export const BankOffersBar: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white py-2.5 px-4 border-y border-blue-800/60 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs">
        
        {/* HDFC / SBI Bank Card Offer */}
        <div className="flex items-center gap-2 font-bold">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400 text-slate-950">
            <CreditCard className="h-3.5 w-3.5" />
          </div>
          <span>
            <span className="text-amber-300">Bank Offer:</span> Flat 10% Instant Discount on HDFC & SBI Cards
          </span>
        </div>

        {/* No Cost EMI */}
        <div className="hidden sm:flex items-center gap-2 text-slate-300 font-medium">
          <Zap className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          <span>No Cost EMI up to 12 Months Available</span>
        </div>

        {/* Prime Fast Delivery */}
        <div className="hidden md:flex items-center gap-2 text-emerald-300 font-bold">
          <Truck className="h-3.5 w-3.5 text-emerald-400" />
          <span>⚡ FREE Same-Day & Next-Day Delivery with DailyMart Prime</span>
        </div>

        {/* 7-Day Replacement Guarantee */}
        <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-semibold">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>100% Genuine Products • Easy Returns</span>
        </div>
      </div>
    </div>
  );
};
