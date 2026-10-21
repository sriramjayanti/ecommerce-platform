import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Product, Category, INITIAL_PRODUCTS, INITIAL_CATEGORIES, safeApiFetch } from '@ecommerce/shared';
import { ProductCard } from '../components/ProductCard';
import { BackButton } from '../components/BackButton';
import {
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Package,
  Zap,
  Star,
  Check,
} from 'lucide-react';

export const CategoryPage: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug: string }>();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const initialCat = INITIAL_CATEGORIES.find(
    (c) => c.slug === categorySlug || c.id === categorySlug
  ) || null;
  const [currentCategory, setCurrentCategory] = useState<Category | null>(initialCat);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [wholesaleOnly, setWholesaleOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [priceMax, setPriceMax] = useState<number>(100000);
  const [sortBy, setSortBy] = useState<string>('popular');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const found = INITIAL_CATEGORIES.find(
      (c) => c.slug === categorySlug || c.id === categorySlug
    );
    if (found) setCurrentCategory(found);

    Promise.all([
      safeApiFetch<Product[]>('/api/products').catch(() => ({ success: false, data: [] as Product[] })),
      safeApiFetch<Category[]>('/api/categories').catch(() => ({ success: false, data: [] as Category[] })),
    ])
      .then(([pRes, cRes]) => {
        if (pRes.success && pRes.data?.length) setProducts(pRes.data);
        if (cRes.success && cRes.data?.length) {
          setCategories(cRes.data);
          const f = cRes.data.find(
            (c: Category) => c.slug === categorySlug || c.id === categorySlug
          );
          if (f) setCurrentCategory(f);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categorySlug]);

  const filteredProducts = products.filter((p) => {
    const activeCat = categories.find(
      (c) => c.slug === categorySlug || c.id === categorySlug || c.slug?.toLowerCase() === categorySlug?.toLowerCase()
    ) || currentCategory;

    const isCategoryMatch =
      p.categoryId === categorySlug ||
      p.subcategoryId === categorySlug ||
      (activeCat && (
        p.categoryId === activeCat.id ||
        p.categoryId === activeCat.slug ||
        p.categoryId?.toLowerCase() === activeCat.id?.toLowerCase() ||
        p.categoryId?.toLowerCase() === activeCat.slug?.toLowerCase() ||
        p.categoryId?.toLowerCase() === activeCat.name?.toLowerCase()
      ));

    if (!isCategoryMatch) return false;
    if (selectedSubcategory !== 'all' && p.subcategoryId !== selectedSubcategory) return false;
    if (wholesaleOnly && !p.isWholesaleEnabled) return false;
    if (minRating > 0 && (p.rating || 0) < minRating) return false;
    const basePrice = p.variants[0]?.basePrice || 0;
    if (basePrice > priceMax) return false;
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') {
      return (a.variants[0]?.basePrice || 0) - (b.variants[0]?.basePrice || 0);
    }
    if (sortBy === 'price-high') {
      return (b.variants[0]?.basePrice || 0) - (a.variants[0]?.basePrice || 0);
    }
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-6 font-sans">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <BackButton fallback="/" label="Back to Departments" />
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Link to="/" className="hover:text-amber-600">Home</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-slate-900 font-bold">
              {currentCategory?.name || categorySlug}
            </span>
          </nav>
        </div>

        {/* Category Hero Banner */}
        {currentCategory && (
          <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 sm:p-8 text-white min-h-[160px] flex items-end border border-slate-800 shadow-md">
            <img
              src={currentCategory.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200'}
              alt={currentCategory.name}
              className="absolute inset-0 h-full w-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
            <div className="relative z-10 space-y-1">
              <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase">
                Department Store
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{currentCategory.name}</h1>
              <p className="text-xs text-slate-300">
                Explore hand-curated products with fast delivery & wholesale discount slabs
              </p>
            </div>
          </div>
        )}

        {/* Subcategories Pills */}
        {currentCategory?.subcategories && currentCategory.subcategories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setSelectedSubcategory('all')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex-shrink-0 ${
                selectedSubcategory === 'all'
                  ? 'bg-slate-950 text-amber-400 shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              All {currentCategory.name}
            </button>
            {currentCategory.subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setSelectedSubcategory(sub.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex-shrink-0 ${
                  selectedSubcategory === sub.id
                    ? 'bg-slate-950 text-amber-400 shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Main 2-Column Layout: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Amazon-Style Left Filter Sidebar */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-6 text-xs text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-1.5 font-black text-sm text-slate-900">
                <Filter className="h-4 w-4 text-amber-500" />
                <span>Filters</span>
              </div>
              <button
                onClick={() => {
                  setSelectedSubcategory('all');
                  setWholesaleOnly(false);
                  setMinRating(0);
                  setPriceMax(50000);
                }}
                className="text-[11px] font-bold text-amber-600 hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Wholesale Filter */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                Wholesale Program
              </span>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wholesaleOnly}
                  onChange={(e) => setWholesaleOnly(e.target.checked)}
                  className="h-4 w-4 rounded text-amber-500"
                />
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Zap className="h-3 w-3 fill-amber-500 text-amber-600" />
                  Wholesale Slabs Active
                </span>
              </label>
            </div>

            {/* Price Filter Slider */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex justify-between font-bold text-[11px]">
                <span className="uppercase tracking-wider text-slate-900">Max Price</span>
                <span className="text-amber-600">₹{priceMax.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="range"
                min={100}
                max={50000}
                step={100}
                value={priceMax}
                onChange={(e) => setPriceMax(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Customer Rating Filter */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <span className="font-bold text-slate-900 block text-[11px] uppercase tracking-wider">
                Customer Rating
              </span>
              <div className="space-y-1">
                {[4, 3, 2].map((stars) => (
                  <button
                    key={stars}
                    onClick={() => setMinRating(minRating === stars ? 0 : stars)}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg text-left transition ${
                      minRating === stars ? 'bg-amber-50 font-bold text-slate-950' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      {stars}★ & above
                    </span>
                    {minRating === stars && <Check className="h-3.5 w-3.5 text-amber-600" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Products Grid */}
          <div className="lg:col-span-3 space-y-4">
            
            {/* Top Toolbar */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-2xs text-xs">
              <span className="text-slate-600 font-bold">
                Showing {sortedProducts.length} items
              </span>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-amber-500"
                >
                  <option value="popular">Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                </select>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-72 animate-pulse rounded-2xl bg-slate-200" />
                ))}
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-base font-bold text-slate-800">No products matching filters</h3>
                <p className="text-xs text-slate-500 mt-1">Try resetting price or rating filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {sortedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
