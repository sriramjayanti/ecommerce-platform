import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Heart,
  ShoppingBag,
} from 'lucide-react';

export const CustomerLoginPage: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginPhone, setLoginPhone] = useState('');
  const [loginName, setLoginName] = useState('');
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

  const handleQuickLogin = (phone: string, name: string) => {
    login(phone, name);
    navigate('/');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone.trim()) return;
    setLoading(true);
    login(loginPhone.trim(), loginName.trim() || 'Valued Customer');
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden bg-white shadow-2xl border border-slate-200 grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* Left Side: Rich Grocery Supermarket Showcase Image */}
        <div className="lg:col-span-6 relative bg-slate-950 p-8 sm:p-12 flex flex-col justify-between overflow-hidden text-white min-h-[320px] lg:min-h-full">
          {/* Fresh Grocery Background Imagery */}
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80"
            alt="Fresh grocery store shelves with vegetables and grains"
            className="absolute inset-0 h-full w-full object-cover opacity-35 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40 z-10" />

          {/* Top Brand Tag */}
          <div className="relative z-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/25 group-hover:scale-105 transition">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white block leading-tight">
                  DailyMart <span className="text-amber-400">Prime</span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider">
                  Wholesale & Supermart
                </span>
              </div>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1 rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-xs transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Store</span>
            </Link>
          </div>

          {/* Center Message: Fresh Grocery Promise */}
          <div className="relative z-20 space-y-4 my-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 border border-amber-400/30 px-3 py-1 text-xs font-black text-amber-300">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Direct From Farm & Wholesale Mandi</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight text-white">
              Fresh Groceries & Wholesale Slabs at Mandi Rates.
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Order farm-fresh vegetables, premium chakki atta, basmati rice, pulses, and FMCG cartons with doorstep delivery in 2 hours.
            </p>

            {/* Grocery Value Highlights */}
            <div className="grid grid-cols-2 gap-3 pt-3">
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
                  <Truck className="h-4 w-4" />
                  <span>2-Hour Delivery</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Free neighborhood delivery on orders above ₹499.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-20 flex items-center gap-2 text-xs text-slate-400 border-t border-white/10 pt-4">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Trusted by over 50,000+ local families and food retailers</span>
          </div>
        </div>

        {/* Right Side: Customer Sign In / Register Form */}
        <div className="lg:col-span-6 p-6 sm:p-10 md:p-12 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-700 block">
                Welcome to DailyMart
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Customer Sign In
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Sign in with your mobile number to view past orders, track live shipments, and access wholesale deals.
              </p>
            </div>

            {/* 1-Click Quick Demo Customer Buttons */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-2.5">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                ⚡ 1-Click Demo Customer Access
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('+919812345678', 'Rahul Sharma')}
                  className="rounded-xl border border-slate-200 bg-white p-2.5 text-left hover:border-amber-400 hover:shadow-xs text-xs font-bold text-slate-800 transition flex flex-col justify-between"
                >
                  <span className="font-extrabold text-slate-900">Rahul Sharma</span>
                  <span className="text-[10px] text-slate-400 font-normal">Retail Consumer • Bengaluru</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('+919834567890', 'Amit Verma')}
                  className="rounded-xl border border-slate-200 bg-white p-2.5 text-left hover:border-amber-400 hover:shadow-xs text-xs font-bold text-slate-800 transition flex flex-col justify-between"
                >
                  <span className="font-extrabold text-slate-900">Amit Verma</span>
                  <span className="text-[10px] text-emerald-700 font-bold">Wholesale Kirana Buyer</span>
                </button>
              </div>
            </div>

            {/* Manual Form */}
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
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-xs text-slate-900 outline-none focus:border-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number or Email Address *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210 or email@domain.com"
                    className="w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-xs text-slate-900 outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  We'll send order updates and invoice copies to this contact.
                </p>
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
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Need help with an order?</span>
            <a
              href="https://wa.me/919876543210"
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
