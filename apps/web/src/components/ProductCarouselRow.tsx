import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@ecommerce/shared';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

interface ProductCarouselRowProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  products: Product[];
  badge?: string;
}

export const ProductCarouselRow: React.FC<ProductCarouselRowProps> = ({
  title,
  subtitle,
  viewAllLink,
  products,
  badge,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs">
        
        {/* Row Header */}
        <div className="flex items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                {title}
              </h3>
              {badge && (
                <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2">
            {/* Scroll Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => handleScroll('left')}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-200 transition shadow-2xs"
                title="Scroll Left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleScroll('right')}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-200 transition shadow-2xs"
                title="Scroll Right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* View All Button */}
            {viewAllLink && (
              <Link
                to={viewAllLink}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-bold transition shadow-xs"
              >
                <span>View All</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Scrolling Grid */}
        <div
          ref={scrollRef}
          className="flex items-stretch gap-4 overflow-x-auto scrollbar-none pb-2 scroll-smooth"
        >
          {products.map((prod) => (
            <div key={prod.id} className="w-48 sm:w-60 flex-shrink-0 flex">
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
