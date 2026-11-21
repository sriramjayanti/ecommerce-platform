import React, { useState } from 'react';
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
  X,
  Tag,
  CheckCircle2,
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem, toggleWishlist, isInWishlist } = useCart();
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [addedOfferTierId, setAddedOfferTierId] = useState<string | null>(null);

  const defaultVariant = product.variants[0];
  const isWishlisted = isInWishlist(product.id);

  const price = defaultVariant?.basePrice || 0;
  const mrp = defaultVariant?.mrp || price;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const tiers = defaultVariant?.pricingTiers || [];
  const hasWholesaleTiers = product.isWholesaleEnabled && tiers.length > 0;
  const stock = defaultVariant?.stock ?? 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock < 15;

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

  const handleApplyTier = (tier: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (defaultVariant && !isOutOfStock) {
      addItem(product, defaultVariant, tier.minQty);
      setAddedOfferTierId(tier.id);
      setTimeout(() => {
        setAddedOfferTierId(null);
        setShowOffersModal(false);
      }, 1200);
    }
  };

  return (
    <>
      <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-2xs hover:border-amber-400 hover:shadow-xl transition-all duration-300">
        
        {/* Top Badges & Wishlist Heart */}
        <div className="relative mb-3">
          {/* Top Badges */}
          <div className="absolute top-0 left-0 z-10 flex flex-col gap-1">
            {product.badge ? (
              <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider shadow-xs truncate max-w-[110px]">
                {product.badge}
              </span>
            ) : discount > 15 ? (
              <span className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                {discount}% OFF
              </span>
            ) : null}

            {hasWholesaleTiers && (
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
                {product.brand || 'VS Wholesale'}
              </span>
              <span className="flex items-center gap-0.5 font-extrabold text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                <ShieldCheck className="h-3 w-3" />
                Assured
              </span>
            </div>

            {/* Title */}
            <Link
              to={`/product/${product.slug || product.id}`}
              className="block text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2 break-words hover:text-amber-600 transition"
            >
              {product.title}
            </Link>

            {/* Star Ratings */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <div className="flex items-center gap-0.5 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-black text-white">
                <span>{product.rating || 4.8}</span>
                <Star className="h-2.5 w-2.5 fill-white" />
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                ({product.reviewCount || 128})
              </span>
            </div>
          </div>

          {/* Pricing Block */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <div className="flex items-baseline gap-x-2 gap-y-0.5 flex-wrap">
              <span className="text-base sm:text-lg font-black text-slate-950 font-sans whitespace-nowrap">
                ₹{price.toLocaleString('en-IN')}
              </span>
              {mrp > price && (
                <span className="text-xs text-slate-400 line-through whitespace-nowrap">
                  ₹{mrp.toLocaleString('en-IN')}
                </span>
              )}
              {discount > 0 && (
                <span className="text-[11px] sm:text-xs font-black text-emerald-600 whitespace-nowrap">
                  {discount}% off
                </span>
              )}
            </div>

            {/* "Show Offers" Wholesale Slab Button */}
            {hasWholesaleTiers && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowOffersModal(true);
                }}
                className="w-full mt-1 flex items-center justify-between gap-1 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-300/80 px-2.5 py-1.5 text-[11px] font-black text-amber-950 shadow-2xs active:scale-98 transition group/btn"
              >
                <span className="flex items-center gap-1.5">
                  <Tag className="h-3 w-3 text-amber-600 fill-amber-500" />
                  <span>Show Offers ({tiers.length} Slabs)</span>
                </span>
                <span className="text-[10px] text-amber-700 font-extrabold group-hover/btn:underline">
                  View →
                </span>
              </button>
            )}

            {/* Stock Availability Badge */}
            <div className="pt-0.5">
              {isOutOfStock ? (
                <span className="inline-block rounded-md bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-extrabold uppercase truncate max-w-full">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="inline-block rounded-md bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-extrabold truncate max-w-full">
                  Only {stock} left in stock!
                </span>
              ) : (
                <span className="inline-block rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-extrabold truncate max-w-full">
                  In Stock
                </span>
              )}
            </div>

            {/* Add to Cart CTA Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black shadow-xs transition ${
                isOutOfStock
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>{isOutOfStock ? 'Currently Unavailable' : 'Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Wholesale Tier "Show Offers" Modal */}
      {showOffersModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setShowOffersModal(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black shadow-xs">
                  <Zap className="h-5 w-5 fill-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    Wholesale Tier Offers
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Buy in quantity to unlock instant mandi savings!
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowOffersModal(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Product Summary in Modal */}
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-200">
              <img
                src={product.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500'}
                alt=""
                className="h-12 w-12 rounded-xl object-cover bg-white border border-slate-200"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-slate-900 text-xs truncate">{product.title}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                  <span className="text-slate-500">Regular: ₹{price}</span>
                  {mrp > price && <span className="line-through text-slate-400">MRP: ₹{mrp}</span>}
                </div>
              </div>
            </div>

            {/* Available Tier Offers List */}
            <div className="space-y-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block">
                Available Volume Discounts:
              </span>

              {tiers.map((tier, idx) => {
                const slabLabel = tier.maxQty ? `${tier.minQty} – ${tier.maxQty} units` : `${tier.minQty}+ units`;
                const perUnitSavings = Math.max(0, mrp - tier.unitPrice);
                const discountVsMrp = mrp > 0 ? Math.round(((mrp - tier.unitPrice) / mrp) * 100) : 0;
                const isAdded = addedOfferTierId === tier.id;

                return (
                  <div
                    key={tier.id || idx}
                    className="rounded-2xl border-2 border-amber-300/80 bg-gradient-to-r from-amber-50/70 to-orange-50/50 p-3.5 space-y-2.5 transition hover:border-amber-500 hover:shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {/* Friendly Offer Message */}
                        <div className="flex items-center gap-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-black text-slate-950">
                            Buy {slabLabel}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-emerald-800 mt-1">
                          You get each at only <span className="text-sm font-black text-slate-950 font-sans">₹{tier.unitPrice}</span>
                          {perUnitSavings > 0 && (
                            <span className="ml-1 text-[11px] font-extrabold text-emerald-600">
                              (Save ₹{perUnitSavings}/unit • {discountVsMrp}% OFF!)
                            </span>
                          )}
                        </p>
                      </div>

                      <span className="rounded-xl bg-amber-400/90 text-slate-950 px-2 py-0.5 text-[10px] font-black whitespace-nowrap shadow-2xs">
                        ₹{tier.unitPrice}/unit
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleApplyTier(tier, e)}
                      disabled={isOutOfStock}
                      className={`w-full rounded-xl py-2 px-3 text-xs font-black transition flex items-center justify-center gap-1.5 ${
                        isAdded
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs active:scale-98'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Added {tier.minQty} Units to Cart!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>Buy {tier.minQty} Units @ ₹{tier.unitPrice}/ea (Total ₹{tier.minQty * tier.unitPrice})</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowOffersModal(false)}
                className="w-full rounded-xl border border-slate-300 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Close Offers
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
