import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, Category, Banner, INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_BANNERS } from '@ecommerce/shared';
import { CategoryPillsBar } from '../components/CategoryPillsBar';
import { HeroDealsCarousel } from '../components/HeroDealsCarousel';
import { BankOffersBar } from '../components/BankOffersBar';
import { LightningDealsSection } from '../components/LightningDealsSection';
import { ProductCarouselRow } from '../components/ProductCarouselRow';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import {
  Sparkles,
  Zap,
  ArrowRight,
  Package,
  SlidersHorizontal,
  Layers,
  Filter,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || 'all';
  const wholesaleParam = searchParams.get('wholesale') === 'true';
  const badgeParam = searchParams.get('badge') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [wholesaleOnly, setWholesaleOnly] = useState<boolean>(wholesaleParam);
  const [sortBy, setSortBy] = useState('popular');

  const { settings } = useCart();

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/categories').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/banners').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
    ])
      .then(([prodRes, catRes, banRes]) => {
        if (prodRes.success && prodRes.data?.length) setProducts(prodRes.data);
        if (catRes.success && catRes.data?.length) setCategories(catRes.data);
        if (banRes.success && banRes.data?.length) setBanners(banRes.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
    if (wholesaleParam) setWholesaleOnly(true);
  }, [categoryParam, wholesaleParam]);

  // Department subsets for rich carousels
  const electronicsProducts = products.filter(
    (p) => p.categoryId === 'cat-electronics' || p.categoryId === 'cat-mobiles'
  );
  const fashionProducts = products.filter((p) => p.categoryId === 'cat-fashion');
  const supermartProducts = products.filter(
    (p) => p.categoryId === 'cat-staples' || p.categoryId === 'cat-oils' || p.categoryId === 'cat-snacks'
  );
  const under499Products = products.filter(
    (p) => (p.variants[0]?.basePrice || 0) <= 500
  );

  // Active filters
  const filteredCatalog = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory && p.subcategoryId !== selectedCategory) {
      return false;
    }
    if (wholesaleOnly && !p.isWholesaleEnabled) {
      return false;
    }
    if (badgeParam && p.badge !== badgeParam) {
      return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchBrand = p.brand?.toLowerCase().includes(q);
      const matchSku = p.variants.some((v) => v.sku.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchBrand && !matchSku) return false;
    }
    return true;
  });

  const sortedCatalog = [...filteredCatalog].sort((a, b) => {
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

  const isSearchActive = !!search || selectedCategory !== 'all' || wholesaleOnly || !!badgeParam;

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20 font-sans">
      
      {/* 1. Category Circular Story Bar */}
      <CategoryPillsBar categories={categories} />

      {/* 2. Hero Deals Multi-Slide Carousel */}
      {!isSearchActive && <HeroDealsCarousel banners={banners} />}

      {/* 3. Bank Offers & EMI Ticker Strip */}
      <BankOffersBar />

      {/* 4. Lightning Flash Deals Section with Timer */}
      {!isSearchActive && <LightningDealsSection products={products} />}

      {/* 5. Electronics & Mobiles Row */}
      {!isSearchActive && electronicsProducts.length > 0 && (
        <ProductCarouselRow
          title="Best of Mobiles & Wireless Tech"
          subtitle="Extra ₹3,000 Instant Bank Discount + 1-Year Brand Replacement"
          viewAllLink="/category/electronics-audio"
          badge="Top Rated"
          products={electronicsProducts}
        />
      )}

      {/* 6. Daily Supermart & Wholesale Slabs Row */}
      {!isSearchActive && supermartProducts.length > 0 && (
        <ProductCarouselRow
          title="Daily Supermart & Bulk Wholesale Slabs"
          subtitle="Automatic quantity tiered pricing on daily staples & pure ghee"
          viewAllLink="/category/grocery-supermart"
          badge="Save up to 30%"
          products={supermartProducts}
        />
      )}

      {/* 7. Fashion & Apparel Row */}
      {!isSearchActive && fashionProducts.length > 0 && (
        <ProductCarouselRow
          title="Trending Fashion & Designer Wear"
          subtitle="Min. 50% - 70% Off with 7-day hassle free exchanges"
          viewAllLink="/category/fashion-footwear"
          products={fashionProducts}
        />
      )}

      {/* 8. Main Catalog Filter & Browse Section */}
      <section className="max-w-7xl mx-auto px-4 pt-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
          
          {/* Controls Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {search ? `Search Results for "${search}"` : 'Explore Full Marketplace Catalog'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {sortedCatalog.length} products available for immediate delivery
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-amber-500 shadow-2xs"
              >
                <option value="all">All Departments ({products.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setWholesaleOnly(!wholesaleOnly)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition border ${
                  wholesaleOnly
                    ? 'border-emerald-600 bg-emerald-600 text-white font-black'
                    : 'border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400'
                }`}
              >
                <Zap className={`h-3.5 w-3.5 ${wholesaleOnly ? 'fill-white' : 'text-amber-500'}`} />
                <span>Wholesale Only</span>
              </button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-amber-500 shadow-2xs"
              >
                <option value="popular">Popularity</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : sortedCatalog.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Package className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No products matching your search</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Try clearing filters or search for Mobiles, Earbuds, Basmati Rice, Desi Ghee or Shirts.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setWholesaleOnly(false);
                }}
                className="mt-4 rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sortedCatalog.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
