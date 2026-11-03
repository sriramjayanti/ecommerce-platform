import React, { useState } from 'react';
import { getStorefrontUrl } from '@ecommerce/shared';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  Store,
  Lock,
  Mail,
  ExternalLink,
} from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    let role: any = 'super_admin';
    let name = 'Admin User';

    if (email.includes('ops')) {
      role = 'order_manager';
      name = 'Operations Manager';
    } else if (email.includes('inv')) {
      role = 'inventory_manager';
      name = 'Inventory Supervisor';
    } else if (email.includes('admin')) {
      role = 'super_admin';
      name = 'Super Admin';
    }

    await login(email, role, name);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans text-slate-900">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-600/30">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            DailyFresh <span className="text-emerald-700 font-black">Admin Ops Portal</span>
          </h1>
          <p className="text-xs text-slate-500">
            Wholesale Pricing Engine • Central Inventory • Real-time Order Fulfillment
          </p>
        </div>

        {/* Credentials Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Sign in to Operations Console
          </h3>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Admin Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white font-medium transition"
                />
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Password or Master PIN</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                />
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
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
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition font-medium"
          >
            <span>Open Customer Storefront</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
