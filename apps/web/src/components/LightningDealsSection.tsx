import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@ecommerce/shared';
import { ProductCard } from './ProductCard';
import { Zap, Clock, ArrowRight, Flame } from 'lucide-react';

interface LightningDealsProps {
  products: Product[];
}

export const LightningDealsSection: React.FC<LightningDealsProps> = ({ products }) => {
  // Live ticking countdown timer
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 38,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 8, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dealProducts = products.filter((p) => p.badge === 'Deal of the Day' || (p.discountPercent && p.discountPercent > 30)).slice(0, 4);

  if (dealProducts.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-rose-500/10 p-5 sm:p-7 shadow-xs">
        
        {/* Deal Header with Live Timer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Flame className="h-6 w-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Lightning Deals & Flash Sale
                </h3>
                <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                  Limited Time
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Steep discounts on top tech, fashion & essentials. Grab before stock ends!
              </p>
            </div>
          </div>

          {/* Live Timer Badges */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-rose-600" /> Ends In:
            </span>
            <div className="flex items-center gap-1 font-mono font-black text-xs text-white">
              <span className="rounded-lg bg-slate-950 px-2 py-1 shadow-xs">
                {String(timeLeft.hours).padStart(2, '0')}h
              </span>
              <span className="text-slate-900 font-bold">:</span>
              <span className="rounded-lg bg-slate-950 px-2 py-1 shadow-xs">
                {String(timeLeft.minutes).padStart(2, '0')}m
              </span>
              <span className="text-slate-900 font-bold">:</span>
              <span className="rounded-lg bg-rose-600 px-2 py-1 shadow-xs">
                {String(timeLeft.seconds).padStart(2, '0')}s
              </span>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {dealProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </div>
    </section>
  );
};
