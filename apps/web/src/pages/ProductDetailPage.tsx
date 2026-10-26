import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, ProductVariant, Review, INITIAL_PRODUCTS, dataStore } from '@ecommerce/shared';
import { useCart } from '../context/CartContext';
import { WholesaleTierTable } from '../components/WholesaleTierTable';
import {
  Star,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  CreditCard,
  MapPin,
  Heart,
  Share2,
  ChevronRight,
  Sparkles,
  Info,
  Package,
  Plus,
  ArrowLeft,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { addItem, toggleWishlist, isInWishlist } = useCart();

  const fallbackProduct = INITIAL_PRODUCTS.find(
    (p) => p.id === idOrSlug || p.slug === idOrSlug
  ) || null;

  const [product, setProduct] = useState<Product | null>(fallbackProduct);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    fallbackProduct?.variants.find((v) => v.isDefault) || fallbackProduct?.variants[0] || null
  );
  const [selectedImage, setSelectedImage] = useState<string>(fallbackProduct?.images[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(!fallbackProduct);
  const [pincode, setPincode] = useState<string>('560034');
  const [pincodeMessage, setPincodeMessage] = useState<string>('FREE Delivery by Tomorrow 8 PM to Bengaluru 560034');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [frequentlyBought, setFrequentlyBought] = useState<Product[]>(
    INITIAL_PRODUCTS.filter((p) => p.id !== fallbackProduct?.id).slice(0, 2)
  );
  const [bundleChecked, setBundleChecked] = useState<boolean>(true);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  useEffect(() => {
    if (!idOrSlug) return;
    const foundLocal = INITIAL_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
    if (foundLocal) {
      setProduct(foundLocal);
      setSelectedVariant(foundLocal.variants.find((v) => v.isDefault) || foundLocal.variants[0]);
      setSelectedImage(foundLocal.images[0] || '');
      setFrequentlyBought(INITIAL_PRODUCTS.filter((p) => p.id !== foundLocal.id).slice(0, 2));
      setLoading(false);
    }

    const loadProductData = async () => {
      if (!idOrSlug) return;
      const found = await dataStore.getProductByIdOrSlug(idOrSlug);
      if (found) {
        setProduct(found);
        setSelectedVariant((prev) => {
          if (prev) {
            const matching = found.variants.find((v) => v.id === prev.id);
            if (matching) return matching;
          }
          return found.variants.find((v) => v.isDefault) || found.variants[0];
        });
        if (!selectedImage) {
          setSelectedImage(found.images[0] || '');
        }
      }
      setLoading(false);
    };

    loadProductData();

    // Subscribe to real-time inventory and product updates
    const unsubscribe = dataStore.subscribe((event) => {
      if (event.type === 'inventory_updated' || event.type === 'products_updated') {
        loadProductData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [idOrSlug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded-xl w-3/4" />
            <div className="h-4 bg-slate-200 rounded-xl w-1/2" />
            <div className="h-16 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Package className="h-12 w-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The item you are searching for might be out of stock.</p>
        <Link to="/" className="mt-4 inline-block rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const price = selectedVariant.basePrice;
  const mrp = selectedVariant.mrp || price;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleBuyNow = () => {
    addItem(product, selectedVariant, quantity);
    navigate('/checkout');
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setPincodeMessage(`✓ In Stock: FREE Express Delivery by Tomorrow 8 PM to ${pincode}`);
    } else {
      setPincodeMessage('Please enter a valid 6-digit postal code.');
    }
  };

  const bundleItem = frequentlyBought[0];
  const bundleTotal = price + (bundleItem?.variants[0]?.basePrice || 0);
  const bundleDiscounted = Math.round(bundleTotal * 0.9);

  return (
    <div className="min-h-screen bg-slate-50 py-6 font-sans">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        
        {/* Simple Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 border border-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            <span>← Back to Products</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">SKU: {selectedVariant?.sku}</span>
        </div>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-amber-600">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/category/${product.categoryId}`} className="hover:text-amber-600">
            {product.categoryId.replace('cat-', '').replace('-', ' ').toUpperCase()}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{product.title}</span>
        </nav>

        {/* 3-COLUMN AMAZON / FLIPKART PRODUCT SHOWCASE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMN 1: Image Gallery (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col-reverse sm:flex-row gap-4 sticky top-24">
            
            {/* Thumbnails Rail */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[460px] scrollbar-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-2xl border-2 p-1 bg-white overflow-hidden transition ${
                    selectedImage === img ? 'border-amber-500 shadow-md scale-105' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover rounded-xl" />
                </button>
              ))}
            </div>

            {/* Main Active Image Box */}
            <div className="flex-1 relative aspect-square rounded-3xl bg-white border border-slate-200 p-4 shadow-xs overflow-hidden flex items-center justify-center group">
              {product.badge && (
                <span className="absolute top-4 left-4 z-10 rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                  {product.badge}
                </span>
              )}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 shadow-xs transition hover:scale-110 ${
                  isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-rose-500'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              </button>

              <img
                src={selectedImage || product.images[0]}
                alt={product.title}
                className="h-full w-full object-cover rounded-2xl group-hover:scale-105 transition duration-500"
              />
            </div>
          </div>

          {/* COLUMN 2: Center Details, Bank Offers & Specs (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div>
              {/* Brand & Verified Assured Pill */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black uppercase text-amber-600 tracking-wider">
                  Brand: {product.brand || 'DailyMart'}
                </span>
                <span className="flex items-center gap-1 font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Flipkart Assured / Prime
                </span>
              </div>

              {/* Title */}
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {product.title}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 rounded-md bg-emerald-700 px-2 py-0.5 text-xs font-black text-white">
                  <span>{product.rating || 4.8}</span>
                  <Star className="h-3 w-3 fill-white" />
                </div>
                <span className="text-xs text-slate-500 font-bold">
                  {product.reviewCount || 142} Verified Ratings & {reviews.length} Reviews
                </span>
              </div>
            </div>

            {/* Price Snapshot */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-baseline gap-2.5">
                {discount > 0 && (
                  <span className="text-xl font-black text-emerald-600">
                    -{discount}%
                  </span>
                )}
                <span className="text-3xl font-black text-slate-950 font-sans">
                  ₹{price.toLocaleString('en-IN')}
                </span>
              </div>
              {mrp > price && (
                <p className="text-xs text-slate-500">
                  M.R.P.: <span className="line-through">₹{mrp.toLocaleString('en-IN')}</span> (Inclusive of all taxes)
                </p>
              )}
            </div>

            {/* Bank Offers Card */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-black text-blue-900">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>Available Bank Offers:</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 text-[11px] list-disc pl-4">
                <li>Flat 10% Instant Discount on HDFC & SBI Bank Credit Cards</li>
                <li>Flat ₹500 Cashback on PhonePe UPI Transactions above ₹1,999</li>
                <li>No Cost EMI available on major credit cards</li>
              </ul>
            </div>

            {/* Variant Selector */}
            {product.variants.length > 1 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  Select Size / Variant: <span className="text-amber-600">{selectedVariant.name}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition text-left ${
                        selectedVariant.id === v.id
                          ? 'border-amber-500 bg-amber-50 text-slate-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="block text-[11px] font-black text-slate-950">₹{v.basePrice}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wholesale Tier Pricing Table */}
            {product.isWholesaleEnabled && selectedVariant.pricingTiers && selectedVariant.pricingTiers.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                  <Zap className="h-4 w-4 fill-amber-500 text-amber-600" />
                  <span>Wholesale Quantity Discount Slabs:</span>
                </div>
                <WholesaleTierTable variant={selectedVariant} currentQuantity={quantity} />
              </div>
            )}

            {/* Highlights */}
            {product.highlights && product.highlights.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900">Product Highlights:</h4>
                <ul className="space-y-1 text-slate-600 list-disc pl-4 text-[11px] leading-relaxed">
                  {product.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Specifications */}
            {product.specs && (
              <div className="space-y-2 text-xs border-t border-slate-200 pt-4">
                <h4 className="font-bold text-slate-900">Technical Specifications:</h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-2 p-2 text-[11px]">
                      <span className="text-slate-500 font-medium">{key}</span>
                      <span className="font-bold text-slate-900">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 3: Right Sticky Buy Box (3 Cols) */}
          <div className="lg:col-span-3 sticky top-24">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-md space-y-4 text-xs text-slate-800">
              
              {/* Buy Box Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-950 font-sans">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  {mrp > price && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  <span>FREE Same-Day Delivery available</span>
                </p>
              </div>

              {/* Delivery Pincode Checker */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <span className="font-bold text-slate-700 text-[11px] block">Delivery Location:</span>
                <form onSubmit={handlePincodeCheck} className="flex gap-1.5">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    className="flex-1 rounded-xl border border-slate-300 p-2 text-xs font-mono font-bold outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 text-xs font-bold transition"
                  >
                    Check
                  </button>
                </form>
                {pincodeMessage && (
                  <p className="text-[10px] font-semibold text-emerald-700 pt-0.5">
                    {pincodeMessage}
                  </p>
                )}
              </div>

              {/* In Stock & Quantity */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                {selectedVariant.stock <= 0 ? (
                  <span className="inline-block rounded-md bg-rose-100 text-rose-800 px-2.5 py-1 text-[11px] font-black uppercase">
                    Currently Out of Stock
                  </span>
                ) : selectedVariant.stock <= Math.max(selectedVariant.lowStockThreshold || 0, 15) ? (
                  <span className="inline-block rounded-md bg-amber-100 text-amber-800 px-2.5 py-1 text-[11px] font-black">
                    Only {selectedVariant.stock} left in stock - order soon!
                  </span>
                ) : (
                  <span className="inline-block rounded-md bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-black uppercase">
                    In Stock ({selectedVariant.stock} available)
                  </span>
                )}

                {selectedVariant.stock > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity:</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 10, 15, 25, 50].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'unit' : 'units'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* CTAs: Add to Cart (Yellow) & Buy Now (Orange) */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={selectedVariant.stock <= 0}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black shadow-md transition ${
                    selectedVariant.stock <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>{selectedVariant.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={selectedVariant.stock <= 0}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black shadow-md transition ${
                    selectedVariant.stock <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed hidden'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white'
                  }`}
                >
                  <Zap className="h-4 w-4 fill-white" />
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Trust & Guarantee */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Secure 256-Bit Encrypted Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>7-Day Replacement / Return Guarantee</span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Ships from DailyMart Prime Warehouse • Sold by Verified Seller
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FREQUENTLY BOUGHT TOGETHER BUNDLE */}
        {bundleItem && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Frequently Bought Together</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <img src={selectedImage || product.images[0]} alt="" className="h-20 w-20 rounded-2xl object-cover border border-slate-200" />
                <Plus className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <img src={bundleItem.images[0]} alt="" className="h-20 w-20 rounded-2xl object-cover border border-slate-200" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 line-clamp-1">{product.title} (₹{price})</p>
                  <p className="text-slate-500 line-clamp-1">+ {bundleItem.title} (₹{bundleItem.variants[0]?.basePrice})</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-slate-400 line-through block">₹{bundleTotal}</span>
                  <span className="text-lg font-black text-emerald-700 font-sans">₹{bundleDiscounted}</span>
                  <span className="text-[10px] text-emerald-600 font-bold block">Save 10% on Combo</span>
                </div>
                <button
                  onClick={() => {
                    addItem(product, selectedVariant, 1);
                    addItem(bundleItem, bundleItem.variants[0], 1);
                    navigate('/checkout');
                  }}
                  className="rounded-2xl bg-amber-400 hover:bg-amber-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-sm"
                >
                  Buy Both Items
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CUSTOMER REVIEWS & RATINGS SECTION */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">Verified Customer Reviews</h3>
              <p className="text-xs text-slate-500">Real feedback from verified buyers across India</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-sm font-black text-white">
                <span>{product.rating || 4.8}</span>
                <Star className="h-4 w-4 fill-white" />
              </div>
              <span className="text-xs font-bold text-slate-700">Overall Rating ({product.reviewCount || 128})</span>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4 divide-y divide-slate-100">
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No reviews written for this product yet.</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="pt-4 first:pt-0 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{r.userName}</span>
                    <span className="flex items-center gap-0.5 font-bold text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      <Check className="h-3 w-3" />
                      Verified Buyer
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <span className="font-bold text-slate-800">{r.title}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{r.comment}</p>
                  <span className="text-[10px] text-slate-400">Reviewed on {new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Added to cart toast */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-600 bg-slate-950 text-white p-4 shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>Added {quantity} unit(s) of {selectedVariant.name} to your Cart!</span>
        </div>
      )}
    </div>
  );
};
