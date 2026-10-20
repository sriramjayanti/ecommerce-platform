import React, { useState, useEffect } from 'react';
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
  Database,
  ShieldCheck,
} from 'lucide-react';
import { safeApiFetch } from '@ecommerce/shared';

export const Header: React.FC = () => {
  const { totals, wishlistIds, setDrawerOpen, settings } = useCart();
  const { user, login, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchCategories = () => {
    safeApiFetch<any[]>('/api/categories')
      .then((d) => {
        if (d.success && d.data) setCategories(d.data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPhone.trim()) {
      login(loginPhone, loginName || 'Valued Customer');
      setLoginModalOpen(false);
      setLoginPhone('');
      setLoginName('');
    }
  };

  const handleQuickDemoLogin = (phone: string, name: string) => {
    login(phone, name);
    setLoginModalOpen(false);
  };

  const handleSeedDemoData = async () => {
    setIsSeeding(true);
    setSeedNotice(null);
    try {
      const data = await safeApiFetch<{ success: boolean }>('/api/admin/seed', { method: 'POST' });
      if (data.success) {
        setSeedNotice('24+ Products, 10 Categories & 12 Orders reloaded!');
        fetchCategories();
        setTimeout(() => {
          setSeedNotice(null);
          window.location.reload();
        }, 1200);
      }
    } catch {}
    setIsSeeding(false);
  };

  return (
    <>
      {/* Top Banner Notice */}
      <div className="bg-emerald-950 text-emerald-100 text-xs py-1.5 px-4 border-b border-emerald-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
            <span className="font-medium truncate">{settings.deliveryAreaNotice}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold">
            {settings.featureFlags.whatsapp && (
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hidden md:flex items-center gap-1 hover:text-white transition"
              >
                <Phone className="h-3 w-3 text-emerald-400" />
                <span>Helpline: {settings.whatsappNumber}</span>
              </a>
            )}

            {/* Quick Demo Reset Trigger */}
            <button
              onClick={handleSeedDemoData}
              disabled={isSeeding}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-900/80 hover:bg-emerald-800 px-2 py-0.5 text-[11px] font-bold text-emerald-300 transition"
              title="Reload comprehensive demo products, categories, orders and wholesale slabs"
            >
              <Database className={`h-3 w-3 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Dumping...' : 'Dump Demo Data'}</span>
            </button>

            {/* Admin Panel Direct Link */}
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded bg-amber-500 hover:bg-amber-400 px-2.5 py-0.5 text-[11px] font-black text-slate-950 transition shadow-xs"
            >
              <Store className="h-3 w-3" />
              <span>Admin Login</span>
            </a>
          </div>
        </div>
      </div>

      {seedNotice && (
        <div className="bg-emerald-600 text-white text-xs font-bold py-1.5 px-4 text-center">
          ✓ {seedNotice}
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition">
                <Store className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-1">
                  DailyFresh <span className="text-emerald-700 font-black">& Wholesale</span>
                </span>
                <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                  <Zap className="h-3 w-3 fill-amber-500 text-amber-600" />
                  Wholesale Tier Slabs Active
                </p>
              </div>
            </Link>

            {/* Global Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xl hidden md:block">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search basmati rice, atta, desi ghee, almonds, spices, munchies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-11 pr-24 text-sm font-medium text-slate-900 placeholder-slate-400 shadow-inner outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-3 focus:ring-emerald-500/15"
                />
                <Search className="absolute left-4 top-3 h-4 w-4 text-slate-400" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Right Action Icons */}
            <div className="flex items-center gap-2 sm:gap-4">
              
              {/* Wishlist */}
              {settings.featureFlags.wishlist && (
                <Link
                  to="/account"
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 transition"
                  title="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                  {wishlistIds.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                      {wishlistIds.length}
                    </span>
                  )}
                </Link>
              )}

              {/* User Account / Login */}
              {user ? (
                <Link
                  to="/account"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 px-3 text-xs font-bold text-slate-800 hover:bg-slate-50 transition"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.displayName}</span>
                </Link>
              ) : (
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-100 py-2 px-3 sm:px-4 text-xs font-bold text-slate-800 hover:bg-slate-200 transition"
                >
                  <LogIn className="h-4 w-4 text-emerald-700" />
                  <span>Login</span>
                </button>
              )}

              {/* Cart Button */}
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 py-2 sm:py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/25 hover:from-emerald-700 hover:to-emerald-800 active:scale-95 transition"
              >
                <div className="relative">
                  <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
                  {totals.itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-950 shadow-xs">
                      {totals.itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline">₹{totals.finalTotal}</span>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="pb-3 md:hidden">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search groceries & snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-20 text-xs font-medium text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <button
                type="submit"
                className="absolute right-1 top-1 rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Category Sub-Navigation Bar */}
        <div className="border-t border-slate-100 bg-slate-50/80 overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-6 py-2 text-xs font-semibold text-slate-700 whitespace-nowrap">
            <Link to="/" className="text-emerald-700 font-bold hover:underline">
              All Categories ({categories.length})
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug || cat.id}`}
                className="hover:text-emerald-600 transition"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <LogIn className="h-4 w-4" />
                </div>
                <h3 className="font-extrabold text-slate-900">Sign In / Register</h3>
              </div>
              <button
                onClick={() => setLoginModalOpen(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Demo Customer Buttons */}
            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                1-Click Demo Customer Login
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('+919812345678', 'Rahul Sharma')}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-left hover:border-emerald-500 text-xs font-bold text-slate-800 transition flex justify-between items-center"
                >
                  <span>Rahul Sharma</span>
                  <span className="text-[10px] text-slate-400 font-normal">Bangalore</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('+919834567890', 'Amit Verma (Catering)')}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-left hover:border-amber-500 text-xs font-bold text-slate-800 transition flex justify-between items-center"
                >
                  <span>Amit Verma</span>
                  <span className="text-[10px] text-amber-600 font-bold">Wholesale Buyer</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  placeholder="Rahul Sharma"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
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
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
