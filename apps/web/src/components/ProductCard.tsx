import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@ecommerce/shared';
import { useCart } from '../context/CartContext';
import {
  Star,
  ShoppingBag,
  Heart,
  Zap,
  Check,
  Truck,
  ShieldCheck,
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, toggleWishlist, isInWishlist } = useCart();
  const defaultVariant = product.variants[0];
  const isWishlisted = isInWishlist(product.id);

  const price = defaultVariant?.basePrice || 0;
  const mrp = defaultVariant?.mrp || price;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const hasWholesaleTiers = product.isWholesaleEnabled && (defaultVariant?.pricingTiers?.length || 0) > 1;
  const isOutOfStock = !defaultVariant || defaultVariant.stock <= 0;
  const isLowStock = !isOutOfStock && defaultVariant.stock <= (defaultVariant.lowStockThreshold || 5);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (defaultVariant && !isOutOfStock) {
      addItem(product, defaultVariant, 1);
    }
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-2xs hover:border-amber-400 hover:shadow-xl transition-all duration-300">
      
      {/* Top Badges & Wishlist Heart */}
      <div className="relative mb-3">
        {/* Top Badges */}
        <div className="absolute top-0 left-0 z-10 flex flex-col gap-1">
          {isOutOfStock ? (
            <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider shadow-xs">
              Out of Stock
            </span>
          ) : product.badge ? (
            <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider shadow-xs">
              {product.badge}
            </span>
          ) : discount > 15 ? (
            <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
              {discount}% OFF
            </span>
          ) : null}

          {!isOutOfStock && hasWholesaleTiers && (
            <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-black text-slate-950 flex items-center gap-0.5 shadow-xs">
              <Zap className="h-2.5 w-2.5 fill-slate-950" />
              Wholesale Slabs
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-0 right-0 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 shadow-xs transition hover:scale-110 ${
            isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-rose-500'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-rose-500' : ''}`} />
        </button>

        {/* Product Image */}
        <Link
          to={`/product/${product.slug || product.id}`}
          className="block aspect-square w-full overflow-hidden rounded-xl bg-slate-50 relative group-hover:scale-105 transition-transform duration-500"
        >
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'}
            alt={product.title}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col justify-between space-y-2">
        <div>
          {/* Brand & Assured Tag */}
          <div className="flex items-center justify-between gap-1 text-[11px] mb-1">
            <span className="font-bold text-slate-400 uppercase tracking-wider truncate">
              {product.brand || 'DailyMart'}
            </span>
            <span className="flex items-center gap-0.5 font-extrabold text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
              <ShieldCheck className="h-3 w-3" />
              Assured
            </span>
          </div>

          {/* Title */}
          <Link
            to={`/product/${product.slug || product.id}`}
            className="block text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-amber-600 transition"
          >
            {product.title}
          </Link>

          {/* Star Ratings */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex items-center gap-0.5 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-black text-white">
              <span>{product.rating || 4.8}</span>
              <Star className="h-2.5 w-2.5 fill-white" />
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              ({product.reviewCount || 128})
            </span>
          </div>
        </div>

        {/* Pricing Block (Amazon & Flipkart Bold Style) */}
        <div className="pt-2 border-t border-slate-100 space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-black text-slate-950 font-sans">
              ₹{price.toLocaleString('en-IN')}
            </span>
            {mrp > price && (
              <span className="text-xs text-slate-400 line-through">
                ₹{mrp.toLocaleString('en-IN')}
              </span>
            )}
            {discount > 0 && (
              <span className="text-xs font-black text-emerald-600">
                {discount}% off
              </span>
            )}
          </div>

          {/* Stock or Prime Fast Delivery Tag */}
          {isOutOfStock ? (
            <p className="text-[10px] sm:text-[11px] font-bold text-rose-600">
              Currently Unavailable
            </p>
          ) : isLowStock ? (
            <p className="text-[10px] sm:text-[11px] font-bold text-amber-700">
              Only {defaultVariant?.stock} left in stock!
            </p>
          ) : (
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Truck className="h-3 w-3 text-emerald-600" />
              <span>{product.deliveryTag || 'FREE Delivery by Tomorrow'}</span>
            </p>
          )}

          {/* Add to Cart CTA Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition ${
              isOutOfStock
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950 shadow-xs'
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
