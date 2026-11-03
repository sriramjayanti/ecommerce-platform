import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Category, Product, dataStore } from '@ecommerce/shared';
import {
  LayoutGrid,
  Search,
  ArrowLeft,
  ChevronRight,
  Package,
  Zap,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        dataStore.getCategories(),
        dataStore.getProducts(),
      ]);
      setCategories(cats);
      setProducts(prods);
      setLoading(false);
    };

    loadData();

    const unsub = dataStore.subscribe(() => {
      loadData();
    });

    return () => unsub();
  }, []);

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchName = cat.name.toLowerCase().includes(q);
    const matchSubs = cat.subcategories?.some(
      (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
    return matchName || matchSubs;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-10 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs transition"
              title="Back to Home"
            >
              <ArrowLeft className="h-5 w-5 text-emerald-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-400 text-slate-950">
                  <LayoutGrid className="h-3.5 w-3.5" />
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  All Store Categories
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Explore all available departments, farm-fresh staples, and wholesale slabs
              </p>
            </div>
          </div>

          {/* Quick Search inside Categories */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter categories or subcategories..."
              className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 font-bold shadow-2xs"
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 rounded-3xl bg-white border border-slate-200 animate-pulse p-5" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
            <LayoutGrid className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No categories match "{searchQuery}"</h3>
            <p className="text-xs text-slate-500 mt-1">Try searching for Atta, Rice, Vegetables, or Mobiles.</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950"
            >
              Clear Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCategories.map((cat) => {
              const catProducts = products.filter((p) => p.categoryId === cat.id);
              const productCount = catProducts.length;

              return (
                <div
                  key={cat.id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:border-amber-400 hover:shadow-xl transition-all duration-300"
                >
                  <div>
                    {/* Category Top Image & Name */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="h-18 w-18 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 group-hover:border-amber-400 shadow-2xs transition">
                        <img
                          src={cat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                          alt={cat.name}
                          className="h-full w-full object-cover group-hover:scale-110 transition duration-500"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {productCount} Products Available
                        </span>
                        <Link
                          to={`/category/${cat.slug || cat.id}`}
                          className="block text-base sm:text-lg font-black text-slate-900 group-hover:text-amber-600 transition truncate mt-1"
                        >
                          {cat.name}
                        </Link>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                          Explore top deals, bulk wholesale rates, and fast doorstep delivery
                        </p>
                      </div>
                    </div>

                    {/* Subcategories Pills */}
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <div className="space-y-1.5 pt-3 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Popular Subcategories:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.subcategories.map((sub) => (
                            <Link
                              key={sub.id}
                              to={`/category/${cat.slug || cat.id}?sub=${encodeURIComponent(sub.slug || sub.name)}`}
                              className="rounded-lg bg-slate-100 hover:bg-amber-100 hover:text-amber-900 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition"
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Browse Category CTA */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>Farm & Mandi Slabs</span>
                    </span>

                    <Link
                      to={`/category/${cat.slug || cat.id}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-2xs transition group-hover:translate-x-1"
                    >
                      <span>Explore</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Wholesale Kirana Bulk Strip */}
        <div className="mt-10 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-950 to-emerald-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-md">
              <Zap className="h-7 w-7 fill-slate-950" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                Buying in Bulk for a Kirana Store or Catering?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Save up to 40% with automated wholesale slab rates on 5+, 10+, and 25+ carton purchases.
              </p>
            </div>
          </div>

          <Link
            to="/?wholesale=true"
            className="flex-shrink-0 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black px-6 py-3 text-xs shadow-lg shadow-amber-400/20 transition active:scale-95"
          >
            <span>View Wholesale Slabs</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
