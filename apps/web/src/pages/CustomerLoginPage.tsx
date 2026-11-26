import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  LogIn,
  Store,
  Zap,
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Phone,
  User,
  ShoppingBag,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

export const CustomerLoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const { totals, setDrawerOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">You are already signed in!</h2>
          <p className="text-xs text-slate-500">
            Welcome back, <span className="font-bold text-slate-800">{user.displayName || user.phone}</span>.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => navigate('/')}
              className="w-full rounded-xl bg-amber-400 py-3 text-xs font-black text-slate-950 hover:bg-amber-500 shadow-sm transition"
            >
              Continue to Shopping
            </button>
            <button
              onClick={() => navigate('/account')}
              className="w-full rounded-xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Go to My Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanPhone = loginPhone.trim().replace(/^(\+91|91|0)/, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setLoginError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setLoading(true);
    login(cleanPhone, loginName.trim() || 'Valued Customer');
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-2 sm:p-4 lg:p-8 pb-20 md:pb-8">
      <div className="w-full max-w-md lg:max-w-5xl rounded-3xl overflow-hidden bg-white shadow-2xl border border-slate-200 grid grid-cols-1 lg:grid-cols-12 min-h-0 lg:min-h-[560px]">
        
        {/* Left Side: Rich Grocery Supermarket Showcase Image (Compact on mobile) */}
        <div className="lg:col-span-6 relative bg-slate-950 p-4 sm:p-6 lg:p-10 flex flex-col justify-between overflow-hidden text-white min-h-[130px] sm:min-h-[170px] lg:min-h-full">
          {/* Fresh Grocery Background Imagery */}
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80"
            alt="Fresh grocery store shelves with vegetables and grains"
            className="absolute inset-0 h-full w-full object-cover opacity-35 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40 z-10" />

          {/* Top Brand Tag */}
          <div className="relative z-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 group-hover:scale-105 transition">
                <Store className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-black tracking-tight text-white block leading-tight">
                  VS <span className="text-amber-400">Wholesale</span>
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 tracking-wider">
                  Wholesale & Supermart
                </span>
              </div>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[10px] sm:text-[11px] font-bold text-white backdrop-blur-xs transition"
            >
              <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>Back to Store</span>
            </Link>
          </div>

          {/* Center Message: Fresh Grocery Promise (Expanded on Desktop, Compact on Mobile) */}
          <div className="relative z-20 my-2 lg:my-6 space-y-2 lg:space-y-4">
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-black text-amber-300">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span>Direct From Farm & Wholesale Mandi</span>
            </div>

            <h1 className="text-lg sm:text-2xl lg:text-3xl font-black leading-tight tracking-tight text-white">
              Fresh Groceries & Wholesale Slabs at Mandi Rates.
            </h1>

            <p className="hidden lg:block text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Order farm-fresh vegetables, premium chakki atta, basmati rice, pulses, and FMCG cartons with direct bulk savings.
            </p>

            {/* Grocery Value Highlights (Visible on desktop/tablet) */}
            <div className="hidden lg:grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl bg-white/10 backdrop-blur-xs p-3 border border-white/10">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Zap className="h-4 w-4" />
                  <span>Wholesale Slabs</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Save up to 40% when buying in 5+, 10+, or 25+ quantities.
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 backdrop-blur-xs p-3 border border-white/10">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Quality Guaranteed</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  100% genuine farm produce & pantry staples.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge (Hidden on mobile to save space) */}
          <div className="hidden lg:flex relative z-20 items-center gap-2 text-xs text-slate-400 border-t border-white/10 pt-3">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Trusted by over 50,000+ local families and food retailers</span>
          </div>
        </div>

        {/* Right Side: Customer Sign In / Register Form */}
        <div className="lg:col-span-6 p-4 sm:p-8 lg:p-10 flex flex-col justify-between space-y-4 sm:space-y-6">
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 block">
                Welcome to VS Wholesale
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Customer Sign In
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sign in with your mobile number to view past orders, track live shipments, and access wholesale deals.
              </p>
            </div>

            {/* Manual Form */}
            {loginError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                {loginError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-xs text-slate-900 outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    autoComplete="off"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="Enter your mobile number"
                    className="w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-xs text-slate-900 outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  We'll send order updates and invoice copies to this mobile number.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password or Security PIN (Optional)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-11 py-3 text-xs text-slate-900 outline-none focus:border-amber-500 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-slate-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/25 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span>{loading ? 'Signing In...' : 'Continue to Shopping'}</span>
              </button>
            </form>

            {/* Cart Status */}
            {totals.itemCount > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block leading-tight">
                      {totals.itemCount} Item(s) in Cart (₹{totals.finalTotal.toLocaleString('en-IN')})
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Ready for checkout
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(true)}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold transition shadow-2xs"
                >
                  Open Cart
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Need help with an order?</span>
            <a
              href="https://wa.me/917799448865"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-emerald-700 hover:underline"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
