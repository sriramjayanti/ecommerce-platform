import React, { useState } from 'react';
import { getStorefrontUrl } from '@ecommerce/shared';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  Store,
  Lock,
  Mail,
  Phone,
  ExternalLink,
  ShieldCheck,
  Zap,
  Eye,
  EyeOff,
} from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = email.trim();
    if (!cleanId) {
      setError('Please enter your admin mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your admin password.');
      return;
    }

    // Official Login Credentials Check
    const isPrimaryAdmin = cleanId === '7799225566' && password === 'id@varshitha123';
    const isLegacyAdmin = cleanId.toLowerCase() === 'admin@dailyfreshmart.com' && (password === 'id@varshitha123' || password === 'admin123');
    const isOpsManager = cleanId.toLowerCase().includes('ops') && (password === 'id@varshitha123' || password === 'admin123');
    const isInvManager = cleanId.toLowerCase().includes('inv') && (password === 'id@varshitha123' || password === 'admin123');

    if (!isPrimaryAdmin && !isLegacyAdmin && !isOpsManager && !isInvManager && password !== 'id@varshitha123' && password !== 'admin123') {
      setError('Invalid login credentials. Please verify your mobile number and password.');
      return;
    }

    let role: any = 'super_admin';
    let name = 'Super Admin';

    if (isPrimaryAdmin) {
      role = 'super_admin';
      name = 'Super Admin (7799225566)';
    } else if (isOpsManager) {
      role = 'order_manager';
      name = 'Operations Manager';
    } else if (isInvManager) {
      role = 'inventory_manager';
      name = 'Inventory Supervisor';
    }

    await login(cleanId, role, name);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center px-3 sm:px-6 py-6 sm:py-12 relative overflow-x-hidden font-sans text-slate-900">
      {/* Background Soft Glows */}
      <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm sm:max-w-md relative z-10 space-y-5 sm:space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-600/30">
            <Store className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            VS Wholesale <span className="text-emerald-700 font-black">Admin Portal</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
            Wholesale Pricing Engine • Central Inventory • Real-time Order Fulfillment
          </p>
        </div>

        {/* Credentials Form Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xl shadow-slate-200/50 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Operations Console Login</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              v1.0 Ready
            </span>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Admin Mobile Number</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 7799225566"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 sm:py-3 pl-9 pr-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white font-medium text-xs sm:text-sm transition shadow-2xs"
                />
                <Phone className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Password or Master PIN</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 sm:py-3 pl-9 pr-10 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white text-xs sm:text-sm transition shadow-2xs font-medium"
                />
                <Lock className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 sm:top-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-500" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 py-3 sm:py-3.5 text-xs sm:text-sm font-black text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-700 active:scale-98 transition"
            >
              Sign In to Operations Console
            </button>
          </form>
        </div>

        {/* Utilities: Open Store */}
        <div className="flex items-center justify-center text-xs">
          <a
            href={getStorefrontUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-emerald-700 font-bold transition p-2"
          >
            <Store className="h-4 w-4 text-emerald-600" />
            <span>Open Customer Storefront</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </a>
        </div>
      </div>
    </div>
  );
};
