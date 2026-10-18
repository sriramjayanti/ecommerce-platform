import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
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
  ShieldCheck,
  Package,
  Layers,
  Clock,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const MegaHeader: React.FC = () => {
  const { totals, wishlistIds, setDrawerOpen, settings } = useCart();
  const { user, login, logout, addresses, defaultAddress } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [isLocationModalOpen, setLocationModalOpen] = useState(false);
  const [isMegaMenuOpen, setMegaMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [pincode, setPincode] = useState('560034');
  const [pincodeCity, setPincodeCity] = useState('Bengaluru');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');

  const navigate = useNavigate();
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (searchCategory !== 'all') params.set('category', searchCategory);
    navigate(`/?${params.toString()}`);
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
      {/* 1. TOP UTILITY STRIP (Flipkart / Amazon Style Dark Header) */}
      <div className="bg-slate-950 text-slate-200 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between">
          
          {/* Left: Location / Pincode Delivery Selector */}
          <button
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
            <span>Mega Marketplace Sale Live • Flat 10% Instant Bank Discount on HDFC & SBI Cards</span>
          </div>

          {/* Right Links */}
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <Link to="/order/AMZ-2026-9021" className="hover:text-amber-300 transition hidden sm:inline">
              Track Order
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

      {/* 2. MAIN BRAND & EXPANDED SEARCH BAR (Amazon / Flipkart Hybrid) */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
            
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
                <Store className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="leading-tight">
                <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1">
                  DailyMart <span className="text-amber-400 font-extrabold">Prime</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider flex items-center gap-0.5">
                  <Zap className="h-3 w-3 fill-emerald-400" />
                  Wholesale & Supermart
                </span>
              </div>
            </Link>

            {/* Expansive Search Bar with Category Select */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:flex items-center rounded-2xl bg-white shadow-md border-2 border-transparent focus-within:border-amber-400 transition overflow-hidden">
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
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Mobiles, Wireless Earbuds, Basmati Rice, Desi Ghee, Shirts..."
                className="flex-1 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none font-medium"
              />

              {/* Submit Search Button (Amazon Gold Amber Style) */}
              <button
                type="submit"
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 px-5 py-2.5 font-black text-xs flex items-center justify-center transition"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            {/* Right Quick Hub: Orders, Account, Cart */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Returns & Orders */}
              <Link
                to="/account"
                className="hidden lg:flex flex-col text-left px-2 py-1 rounded-xl text-slate-200 hover:bg-slate-800 transition leading-tight"
              >
                <span className="text-[10px] text-slate-400">Returns</span>
                <span className="text-xs font-black text-white">& Orders</span>
              </Link>

              {/* Account Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setAccountDropdownOpen(true)}
                onMouseLeave={() => setAccountDropdownOpen(false)}
              >
                {user ? (
                  <Link
                    to="/account"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white hover:bg-slate-800 transition"
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
                    onClick={() => setLoginModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition text-xs font-bold"
                  >
                    <User className="h-4 w-4 text-amber-400" />
                    <span className="hidden sm:inline">Sign In</span>
                  </button>
                )}
              </div>

              {/* Wishlist */}
              <Link
                to="/account"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistIds.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white">
                    {wishlistIds.length}
                  </span>
                )}
              </Link>

              {/* Cart Button (Flipkart / Amazon Yellow Amber High-Contrast) */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-black text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition"
              >
                <div className="relative">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                  {totals.itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-amber-400 shadow-xs">
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
                placeholder="Search Mobiles, Rice, Ghee, Electronics..."
                className="flex-1 px-3 py-2 text-xs text-slate-900 outline-none"
              />
              <button type="submit" className="bg-amber-400 text-slate-950 px-3.5 py-2 font-bold text-xs">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        {/* 3. SECONDARY MEGA CATEGORIES BAR (Amazon / Flipkart Style Navigation Strip) */}
        <div className="bg-slate-950 border-t border-slate-800 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 py-2 text-xs font-bold text-slate-300 whitespace-nowrap">
            
            {/* All Categories Drawer Trigger */}
            <button
              onClick={() => setMegaMenuOpen(true)}
              className="flex items-center gap-1.5 text-white hover:text-amber-400 transition"
            >
              <Menu className="h-4 w-4 text-amber-400" />
              <span>All Departments</span>
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

      {/* 4. PINCODE / LOCATION SELECTOR MODAL */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-4 text-slate-900 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-amber-500" />
                <h3 className="font-extrabold text-sm">Choose Your Delivery Location</h3>
              </div>
              <button onClick={() => setLocationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
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

      {/* 5. MEGA MENU DRAWER (Amazon Style "All Departments" Side Navigation) */}
      {isMegaMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-80 max-w-[85vw] bg-white text-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              {/* User Greeting Header */}
              <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Hello,</span>
                    <span className="font-extrabold text-sm">{user ? user.displayName : 'Sign in to DailyMart'}</span>
                  </div>
                </div>
                <button onClick={() => setMegaMenuOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Department List */}
              <div className="p-4 space-y-4 text-xs font-semibold">
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Trending Departments
                  </h4>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug || cat.id}`}
                        onClick={() => setMegaMenuOpen(false)}
                        className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-100 transition text-slate-800 font-bold"
                      >
                        <span>{cat.name}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    Special Programs
                  </h4>
                  <div className="space-y-1">
                    <Link
                      to="/?wholesale=true"
                      onClick={() => setMegaMenuOpen(false)}
                      className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-slate-100 text-emerald-700 font-bold"
                    >
                      <Zap className="h-4 w-4" />
                      <span>Wholesale Quantity Slabs</span>
                    </Link>
                    <a
                      href="http://localhost:5174"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-slate-100 text-amber-600 font-bold"
                    >
                      <Store className="h-4 w-4" />
                      <span>Admin Operations Center</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Sign out / In */}
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setMegaMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-200 py-2.5 text-xs font-bold text-slate-800 hover:bg-rose-100 hover:text-rose-700 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMegaMenuOpen(false);
                    setLoginModalOpen(true);
                  }}
                  className="w-full rounded-xl bg-amber-400 py-2.5 text-xs font-black text-slate-950 shadow-sm"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>

          {/* Backdrop */}
          <div className="flex-1 bg-slate-950/60 backdrop-blur-xs" onClick={() => setMegaMenuOpen(false)} />
        </div>
      )}

      {/* 6. SIGN IN / LOGIN MODAL */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-slate-900 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <LogIn className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-sm">Sign in to DailyMart Prime</h3>
              </div>
              <button onClick={() => setLoginModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Demo Customer Buttons */}
            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                1-Click Demo Customer Login
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('+919812345678', 'Rahul Sharma')}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-left hover:border-amber-400 text-xs font-bold text-slate-800 transition flex justify-between items-center"
                >
                  <span>Rahul Sharma</span>
                  <span className="text-[10px] text-slate-400 font-normal">Bengaluru</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('+919834567890', 'Amit Verma')}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-left hover:border-amber-400 text-xs font-bold text-slate-800 transition flex justify-between items-center"
                >
                  <span>Amit Verma</span>
                  <span className="text-[10px] text-amber-600 font-bold">Wholesale Buyer</span>
                </button>
              </div>
            </div>

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
                  placeholder="Rahul Sharma"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-amber-500"
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
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-amber-400 hover:bg-amber-500 py-2.5 text-xs font-black text-slate-950 shadow-sm transition"
              >
                Continue to Shopping
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
