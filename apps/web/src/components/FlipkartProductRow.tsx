import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@ecommerce/shared';
import { useCart } from '../context/CartContext';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  ShoppingBag,
  Zap,
  Heart,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface FlipkartProductRowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  products: Product[];
  onProductClick?: () => void;
}

export const FlipkartProductRow: React.FC<FlipkartProductRowProps> = ({
  title,
  subtitle,
  badge = 'Trending',
  products,
  onProductClick,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { addItem, toggleWishlist, isInWishlist } = useCart();

  if (!products || products.length === 0) return null;

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs relative">
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              {title}
            </h3>
            {badge && (
              <span className="rounded-md bg-amber-500/20 text-amber-800 border border-amber-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Circular Arrow Navigation Controls (Flipkart Style) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-90 transition disabled:opacity-30"
            title="Scroll Previous"
            aria-label="Scroll Previous"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 hover:bg-slate-800 text-white shadow-md active:scale-90 transition disabled:opacity-30"
            title="Scroll Next"
            aria-label="Scroll Next"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Row */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3.5 sm:gap-4 overflow-x-auto scrollbar-none pb-2 scroll-smooth"
      >
        {products.map((item, index) => {
          const defaultVariant = item.variants?.[0];
          const price = defaultVariant?.basePrice || 0;
          const mrp = defaultVariant?.mrp || price;
          const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
          const isWishlisted = isInWishlist(item.id);
          const bankDiscountPrice = Math.round(price * 0.9);

          // Card badges
          const tagLabel = item.badge || (index % 2 === 0 ? 'Trending' : 'Bestseller');

          return (
            <div
              key={item.id}
              className="w-48 sm:w-56 md:w-60 flex-shrink-0 flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3 sm:p-3.5 hover:border-amber-400 hover:shadow-xl transition-all duration-300 relative group"
            >
              <div>
                {/* Top Row: Trending Badge & Heart */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-2xs ${
                      tagLabel === 'Trending'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {tagLabel}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWishlist(item.id);
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 shadow-2xs transition hover:scale-110 ${
                      isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-rose-500'
                    }`}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Product Image */}
                <Link
                  to={`/product/${item.slug || item.id}`}
                  onClick={() => {
                    if (onProductClick) onProductClick();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="block h-36 sm:h-44 w-full rounded-xl overflow-hidden bg-slate-50 p-2 flex items-center justify-center my-1"
                >
                  <img
                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                    alt={item.title}
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                </Link>

                {/* Rating Badge (Flipkart Style) */}
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="flex items-center gap-0.5 rounded-md bg-emerald-700 px-1.5 py-0.5 text-[10px] font-black text-white">
                    <span>{item.rating || 4.5}</span>
                    <Star className="h-2.5 w-2.5 fill-white" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({item.reviewCount || 98})
                  </span>
                </div>

                {/* Product Title */}
                <Link
                  to={`/product/${item.slug || item.id}`}
                  onClick={() => {
                    if (onProductClick) onProductClick();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="font-bold text-xs text-slate-900 line-clamp-2 mt-1 hover:text-amber-600 transition leading-snug"
                  title={item.title}
                >
                  {item.title}
                </Link>

                {/* Pricing & Discount */}
                <div className="mt-1.5">
                  {discount > 0 && (
                    <span className="text-emerald-700 font-extrabold text-[11px] block">
                      {discount}% OFF
                    </span>
                  )}
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm sm:text-base font-black text-slate-950 font-sans">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    {mrp > price && (
                      <span className="text-[11px] text-slate-400 line-through">
                        ₹{mrp.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  {/* Bank Offer or Wholesale Note */}
                  <p className="text-[10px] text-blue-700 font-semibold truncate mt-0.5">
                    {item.isWholesaleEnabled ? (
                      <span className="text-amber-700 font-bold flex items-center gap-0.5">
                        <Zap className="h-2.5 w-2.5 fill-amber-500" />
                        Wholesale Slabs Active
                      </span>
                    ) : (
                      `₹${bankDiscountPrice.toLocaleString('en-IN')} with Bank offer`
                    )}
                  </p>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (defaultVariant) {
                    addItem(item, defaultVariant, 1);
                  }
                }}
                className="w-full mt-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
