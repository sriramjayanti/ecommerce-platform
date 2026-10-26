import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { dataStore, Product } from '@ecommerce/shared';
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  MapPin,
  Phone,
  Store,
  Menu,
  X,
  Sparkles,
  LogIn,
  LogOut,
  Zap,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Package,
  Layers,
  Clock,
  ArrowRight,
  HelpCircle,
  Tag,
  CheckCircle2,
  Truck,
} from 'lucide-react';

const POPULAR_SEARCHES = [
  'Basmati Rice',
  'Chakki Atta',
  'Amul Butter',
  'Desi Ghee',
  'Fortune Oil',
  'Dry Fruits',
  'Toor Dal',
  'Maggi Noodles',
];

export const MegaHeader: React.FC = () => {
  const { totals, wishlistIds, setDrawerOpen, settings } = useCart();
  const { user, login, logout, addresses, defaultAddress } = useAuth();
  const navigate = useNavigate();

  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Modals & Drawers
  const [isMegaMenuOpen, setMegaMenuOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isLocationModalOpen, setLocationModalOpen] = useState(false);
  const [isAccountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [isDrawerCategoriesExpanded, setIsDrawerCategoriesExpanded] = useState(true);

  // Pincode & Login
  const [pincode, setPincode] = useState('560034');
  const [pincodeCity, setPincodeCity] = useState('Bengaluru');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load categories
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      })
      .catch(async () => {
        const cats = await dataStore.getCategories();
        setCategories(cats);
      });

    // Load products for live search
    dataStore.getProducts().then((prods) => {
      setAllProducts(prods);
    });

    const unsub = dataStore.subscribe((event) => {
      if (event.type === 'products_updated') {
        dataStore.getProducts().then((prods) => setAllProducts(prods));
      }
      if (event.type === 'categories_updated') {
        dataStore.getCategories().then((cats) => setCategories(cats));
      }
    });

    return () => unsub();
  }, []);

  // Close live search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered live search results
  const liveSearchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allProducts
      .filter((p) => {
        const matchesCategory =
          searchCategory === 'all' || p.categoryId === searchCategory;
        const matchesQuery =
          p.title.toLowerCase().includes(q) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q));
        return matchesCategory && matchesQuery;
      })
      .slice(0, 6);
  }, [allProducts, searchQuery, searchCategory]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchFocused(false);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (searchCategory !== 'all') params.set('category', searchCategory);
    navigate(`/?${params.toString()}`);
  };

  const handleSelectPopularSearch = (term: string) => {
    setSearchQuery(term);
    setIsSearchFocused(false);
    navigate(`/?search=${encodeURIComponent(term)}`);
  };

  const handlePincodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length >= 6) {
      if (pincode.startsWith('560')) setPincodeCity('Bengaluru');
      else if (pincode.startsWith('400')) setPincodeCity('Mumbai');
      else if (pincode.startsWith('110')) setPincodeCity('Delhi');
      else setPincodeCity('India');
      setLocationModalOpen(false);
    }
  };

  const handleQuickLogin = (phone: string, name: string) => {
    login(phone, name);
    setLoginModalOpen(false);
  };

  return (
    <>
      {/* 1. TOP UTILITY STRIP */}
      <div className="bg-slate-950 text-slate-200 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          
          {/* Left: Location / Pincode Delivery Selector */}
          <button
            type="button"
            onClick={() => setLocationModalOpen(true)}
            className="flex items-center gap-1.5 hover:text-amber-400 transition text-left group"
          >
            <MapPin className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 group-hover:scale-110 transition" />
            <span className="text-[11px] text-slate-400 hidden sm:inline">Deliver to</span>
            <span className="font-bold text-white text-[11px] underline decoration-dotted underline-offset-2">
              {defaultAddress ? `${defaultAddress.city} ${defaultAddress.pincode}` : `${pincodeCity} ${pincode}`}
            </span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {/* Center Announcement */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-amber-300 font-semibold">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Farm Fresh Groceries & Wholesale Savings • Same-Day 2-Hour Doorstep Delivery</span>
          </div>

          {/* Right Links */}
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <Link
              to="/order/track"
              className="hover:text-amber-300 text-amber-200 transition inline-flex items-center gap-1.5"
            >
              <Truck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Track Order</span>
            </Link>
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 font-extrabold transition shadow-xs"
            >
              <Store className="h-3 w-3" />
              <span>Admin Console</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER BAR WITH HAMBURGER ON LEFT */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4 lg:gap-6">
            
            {/* Left Wing: Hamburger Menu Button + Brand Logo */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Prominent Hamburger Menu Button */}
              <button
                type="button"
                onClick={() => setMegaMenuOpen(true)}
                className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-slate-800 border border-slate-700 text-amber-400 hover:bg-amber-400 hover:text-slate-950 transition shadow-xs group"
                title="Open Category & Navigation Menu"
                aria-label="Open Category & Navigation Menu"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6 transition-transform group-hover:scale-110" />
              </button>

              {/* Brand Logo */}
              <Link to="/" className="flex items-center gap-2 flex-shrink-0 group">
                <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
                  <Store className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="leading-tight">
                  <span className="text-base sm:text-xl font-black tracking-tight text-white flex items-center gap-1">
                    DailyMart <span className="text-amber-400 font-extrabold">Prime</span>
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 tracking-wider flex items-center gap-0.5">
                    <Zap className="h-2.5 w-2.5 fill-emerald-400" />
                    Wholesale & Groceries
                  </span>
                </div>
              </Link>
            </div>

            {/* Easy Live Search Bar (Desktop & Tablet) */}
            <div ref={searchContainerRef} className="relative flex-1 max-w-2xl hidden md:block">
              <form
                onSubmit={handleSearch}
                className="flex items-center rounded-2xl bg-white shadow-md border-2 border-transparent focus-within:border-amber-400 transition overflow-hidden"
              >
                {/* Category Dropdown */}
                <div className="bg-slate-100 border-r border-slate-200 px-3 py-2.5 flex items-center">
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer pr-1"
                  >
                    <option value="all">All Departments</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input text */}
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  placeholder="Search fresh vegetables, basmati rice, atta, ghee, snacks..."
                  className="flex-1 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none font-medium"
                />

                {/* Clear button */}
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchFocused(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 mr-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Submit Search Button */}
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 py-2.5 font-black text-xs flex items-center justify-center transition"
                  title="Search Products"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>

              {/* Instant Search Suggestions Dropdown */}
              {isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-white text-slate-900 shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                  {searchQuery.trim().length === 0 ? (
                    /* Trending / Popular Searches */
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-black uppercase text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          Popular Grocery Searches
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SEARCHES.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => handleSelectPopularSearch(term)}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 transition flex items-center gap-1.5"
                          >
                            <Search className="h-3 w-3 text-slate-400" />
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : liveSearchResults.length > 0 ? (
                    /* Live Matching Products List */
                    <div>
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                        <span>Matching Grocery Items ({liveSearchResults.length})</span>
                        <span className="text-amber-600">Press Enter for full results</span>
                      </div>
                      <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                        {liveSearchResults.map((prod) => {
                          const defaultVar = prod.variants[0];
                          const price = defaultVar?.basePrice || 0;
                          const mrp = defaultVar?.mrp || price;
                          const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

                          return (
                            <Link
                              key={prod.id}
                              to={`/product/${prod.slug || prod.id}`}
                              onClick={() => setIsSearchFocused(false)}
                              className="flex items-center gap-3 p-3 hover:bg-amber-50/60 transition group"
                            >
                              <img
                                src={prod.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                                alt=""
                                className="h-12 w-12 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-600 truncate">
                                  {prod.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-slate-400">
                                    {defaultVar?.weightOrSize || 'Pack'}
                                  </span>
                                  {prod.isWholesaleEnabled && (
                                    <span className="rounded bg-amber-100 text-amber-900 font-extrabold text-[9px] px-1.5 py-0.2">
                                      Wholesale
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-xs font-black text-slate-900 block">
                                  ₹{price}
                                </span>
                                {discount > 0 && (
                                  <span className="text-[10px] font-bold text-emerald-600 block">
                                    {discount}% OFF
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* No results found */
                    <div className="p-6 text-center text-xs text-slate-500">
                      <p className="font-bold text-slate-700">No products matching "{searchQuery}"</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try searching for rice, atta, oil, tea, biscuits or dry fruits.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Quick Hub: Orders, Account, Wishlist, Cart */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              
              {/* Returns & Orders */}
              <Link
                to="/account?tab=orders"
                className="hidden lg:flex flex-col text-left px-2.5 py-1 rounded-xl text-slate-200 hover:bg-slate-800 transition leading-tight"
              >
                <span className="text-[10px] text-slate-400">Returns</span>
                <span className="text-xs font-black text-white">& Orders</span>
              </Link>

              {/* Simple Track Order Live */}
              <Link
                to="/order/track"
                className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-400 transition text-xs font-bold shadow-2xs"
                title="Live Order Tracking (Updated by Admin Only)"
              >
                <Truck className="h-4 w-4 text-emerald-400" />
                <span>Track Order</span>
              </Link>

              {/* Wishlist Icon Button */}
              <Link
                to="/account?tab=wishlist"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>

              {/* User Account Button */}
              <div className="relative">
                {user ? (
                  <Link
                    to="/account"
                    className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white hover:bg-slate-800 transition"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-black text-xs">
                      {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                    </div>
                    <div className="hidden sm:block text-left leading-tight">
                      <span className="text-[10px] text-slate-400 block">Hello,</span>
                      <span className="text-xs font-black truncate max-w-[90px] block">{user.displayName}</span>
                    </div>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setLoginModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition text-xs font-bold"
                  >
                    <User className="h-4 w-4 text-amber-400" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                )}
              </div>

              {/* Cart Button */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition"
              >
                <div className="relative">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                  {totals.itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-amber-400 shadow-xs">
                      {totals.itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline font-black">₹{totals.finalTotal}</span>
              </button>
            </div>
          </div>

          {/* Mobile Search Input */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearch} className="flex items-center rounded-xl bg-white overflow-hidden shadow-sm">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vegetables, atta, rice, ghee..."
                className="flex-1 px-3 py-2 text-xs text-slate-900 outline-none"
              />
              <button type="submit" className="bg-amber-400 text-slate-950 px-3.5 py-2 font-bold text-xs">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* 3. SECONDARY CATEGORIES STRIP */}
        <div className="bg-slate-950 border-t border-slate-800 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 py-2 text-xs font-bold text-slate-300 whitespace-nowrap">
            
            {/* All Categories Trigger */}
            <button
              type="button"
              onClick={() => {
                setMegaMenuOpen(true);
                setIsDrawerCategoriesExpanded(true);
              }}
              className="flex items-center gap-1.5 text-white hover:text-amber-400 transition"
            >
              <Menu className="h-4 w-4 text-amber-400" />
              <span>All Categories</span>
            </button>

            {/* Flash Deals Link */}
            <Link to="/?badge=Deal+of+the+Day" className="flex items-center gap-1 text-amber-400 hover:underline">
              <Zap className="h-3.5 w-3.5 fill-amber-400" />
              <span>Lightning Deals</span>
            </Link>

            {/* Department Shortcuts */}
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug || cat.id}`}
                className="hover:text-white transition"
              >
                {cat.name}
              </Link>
            ))}

            <Link to="/?wholesale=true" className="text-emerald-400 hover:underline flex items-center gap-1">
              <span>Wholesale Bulk Store</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 4. HAMBURGER MENU DRAWER (ON LEFT OF PAGE) */}
      {isMegaMenuOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div className="w-84 max-w-[85vw] bg-white text-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              {/* Drawer Header with User Profile / Login */}
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-400/20">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                      {user ? 'Welcome Back,' : 'Hello, Guest'}
                    </span>
                    <span className="font-extrabold text-sm block truncate max-w-[170px]">
                      {user ? user.displayName || user.phone : 'Sign in to DailyMart'}
                    </span>
                    {user && (
                      <Link
                        to="/account"
                        onClick={() => setMegaMenuOpen(false)}
                        className="text-[11px] text-amber-400 font-bold hover:underline"
                      >
                        View Profile & Addresses →
                      </Link>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMegaMenuOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Navigation List */}
              <div className="p-4 space-y-4 text-xs font-semibold">
                
                {/* CATEGORIES SECTION (Interactive dropdown / accordion per request) */}
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerCategoriesExpanded(!isDrawerCategoriesExpanded)}
                    className="w-full flex items-center justify-between font-black text-xs text-emerald-900 uppercase tracking-wider"
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-emerald-700" />
                      <span>Shop by Category ({categories.length})</span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-emerald-700 transition-transform ${
                        isDrawerCategoriesExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Expandable Category List */}
                  {isDrawerCategoriesExpanded && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 space-y-1.5 animate-in fade-in">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/category/${cat.slug || cat.id}`}
                          onClick={() => setMegaMenuOpen(false)}
                          className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-100 hover:border-emerald-300 hover:shadow-xs transition text-slate-800 font-bold"
                        >
                          <div className="flex items-center gap-2.5">
                            {cat.image ? (
                              <img
                                src={cat.image}
                                alt=""
                                className="h-7 w-7 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <Package className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <span className="text-xs">{cat.name}</span>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Primary Customer Links */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                    Customer Account & Hub
                  </h4>
                  <div className="space-y-1">
                    <Link
                      to="/"
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold"
                    >
                      <span className="flex items-center gap-2.5">
                        <Store className="h-4 w-4 text-slate-600" />
                        <span>Home Page</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/account?tab=orders"
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold"
                    >
                      <span className="flex items-center gap-2.5">
                        <Package className="h-4 w-4 text-slate-600" />
                        <span>My Orders & Invoices</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/order/track"
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold"
                    >
                      <span className="flex items-center gap-2.5">
                        <Truck className="h-4 w-4 text-emerald-600" />
                        <span>Track Order Live</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/account?tab=wishlist"
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold"
                    >
                      <span className="flex items-center gap-2.5">
                        <Heart className="h-4 w-4 text-rose-500" />
                        <span>My Wishlist</span>
                      </span>
                      {wishlistIds.length > 0 && (
                        <span className="rounded-full bg-rose-500 text-white font-black text-[10px] px-2 py-0.5">
                          {wishlistIds.length} items
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/account?tab=addresses"
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold"
                    >
                      <span className="flex items-center gap-2.5">
                        <MapPin className="h-4 w-4 text-slate-600" />
                        <span>Saved Delivery Addresses</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </Link>

                    <Link
                      to="/?wholesale=true"
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-emerald-50 text-emerald-800 font-extrabold transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <Zap className="h-4 w-4 text-emerald-600" />
                        <span>Wholesale Bulk Pricing Store</span>
                      </span>
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                        Wholesale
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Support & Admin Console */}
                <div className="border-t border-slate-200 pt-3">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 px-1">
                    Help & Support
                  </h4>
                  <div className="space-y-1">
                    <a
                      href="https://wa.me/919876543210"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-100 text-emerald-700 font-bold transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4" />
                        <span>WhatsApp Customer Care</span>
                      </span>
                      <span className="text-[10px] text-slate-400">+91 98765 43210</span>
                    </a>

                    <a
                      href="http://localhost:5174"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-100 text-amber-700 font-bold transition"
                    >
                      <span className="flex items-center gap-2.5">
                        <Store className="h-4 w-4" />
                        <span>Admin Operations Center</span>
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Bar: Profile / Sign Out or Sign In */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              {user ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMegaMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 py-3 text-xs font-black text-rose-700 hover:bg-rose-100 transition shadow-2xs"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out ({user.displayName || 'Customer'})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMegaMenuOpen(false);
                    setLoginModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-400 hover:bg-amber-500 py-3 text-xs font-black text-slate-950 shadow-md transition"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </div>

          {/* Backdrop to close */}
          <div
            className="flex-1 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMegaMenuOpen(false)}
          />
        </div>
      )}

      {/* 5. PINCODE / LOCATION SELECTOR MODAL */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-slate-900 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-500" />
                <h3 className="font-extrabold text-sm">Choose Your Delivery Location</h3>
              </div>
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter your 6-digit postal code to see real-time product availability and same-day delivery slots.
            </p>

            <form onSubmit={handlePincodeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Enter Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 560034, 400001, 110001"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-mono font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPincode('560001');
                    setPincodeCity('Bengaluru');
                    setLocationModalOpen(false);
                  }}
                  className="flex-1 rounded-xl bg-slate-100 p-2 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                >
                  Bengaluru
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPincode('400001');
                    setPincodeCity('Mumbai');
                    setLocationModalOpen(false);
                  }}
                  className="flex-1 rounded-xl bg-slate-100 p-2 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                >
                  Mumbai
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPincode('110001');
                    setPincodeCity('Delhi');
                    setLocationModalOpen(false);
                  }}
                  className="flex-1 rounded-xl bg-slate-100 p-2 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
                >
                  Delhi
                </button>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-400 hover:bg-amber-500 py-2.5 text-xs font-black text-slate-950 shadow-sm transition"
              >
                Apply Delivery Location
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 6. GROCERY-THEMED SIGN IN / LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white overflow-hidden shadow-2xl text-slate-900 space-y-4 animate-in zoom-in-95 border border-slate-200">
            
            {/* Rich Grocery Image Header */}
            <div className="relative bg-slate-950 min-h-[140px] flex items-end p-5 text-white overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
                alt="Fresh grocery store produce"
                className="absolute inset-0 h-full w-full object-cover opacity-45 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent z-10" />

              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                className="absolute top-3 right-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/60 text-white hover:bg-slate-900"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative z-20 space-y-1">
                <span className="inline-flex items-center gap-1 rounded bg-amber-400 text-slate-950 px-2 py-0.5 text-[10px] font-black uppercase">
                  <Zap className="h-3 w-3 fill-slate-950" />
                  Wholesale Groceries
                </span>
                <h3 className="font-black text-lg text-white">Sign In to DailyMart Prime</h3>
                <p className="text-[11px] text-slate-300 font-medium">
                  Farm-fresh produce & wholesale price slabs delivered to your doorstep.
                </p>
              </div>
            </div>

            <div className="p-5 pt-0 space-y-4">
              {/* Quick Demo Customer Buttons */}
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  ⚡ 1-Click Demo Customer Access
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('+919812345678', 'Rahul Sharma')}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-left hover:border-amber-400 text-xs font-bold text-slate-800 transition"
                  >
                    <span className="font-extrabold text-slate-900 block truncate">Rahul Sharma</span>
                    <span className="text-[10px] text-slate-400 font-normal">Retail Consumer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('+919834567890', 'Amit Verma')}
                    className="rounded-xl border border-slate-200 bg-white p-2 text-left hover:border-amber-400 text-xs font-bold text-slate-800 transition"
                  >
                    <span className="font-extrabold text-slate-900 block truncate">Amit Verma</span>
                    <span className="text-[10px] text-emerald-700 font-bold">Wholesale Buyer</span>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (loginPhone.trim()) {
                    login(loginPhone, loginName || 'Valued Customer');
                    setLoginModalOpen(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number or Email *</label>
                  <input
                    type="text"
                    required
                    placeholder="9876543210 or email@domain.com"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-amber-500 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 py-3 text-xs font-black text-slate-950 shadow-md shadow-amber-400/20 transition flex items-center justify-center gap-2"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Continue to Shopping</span>
                </button>
              </form>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  onClick={() => setLoginModalOpen(false)}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  Open Full Grocery Login Page →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
