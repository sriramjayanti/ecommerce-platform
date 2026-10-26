import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  Store,
  ShieldCheck,
  Zap,
  Lock,
  Mail,
  ArrowRight,
  Database,
  ExternalLink,
  UserCheck,
} from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const { login, resetDemoData, isSeeding } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    let role: any = 'super_admin';
    let name = 'Super Admin';

    if (email.includes('ops')) {
      role = 'order_manager';
      name = 'Operations Manager';
    } else if (email.includes('inv')) {
      role = 'inventory_manager';
      name = 'Inventory Supervisor';
    }

    await login(email, role, name);
  };

  const handleQuickLogin = async (demoEmail: string, role: any, displayName: string) => {
    setEmail(demoEmail);
    setPassword('admin123');
    await login(demoEmail, role, displayName);
  };

  const handleSeedDemo = async () => {
    setSeedSuccessMsg(null);
    const success = await resetDemoData();
    if (success) {
      setSeedSuccessMsg('24+ Products, 10 Categories, 12 Orders & Wholesale Slabs loaded successfully!');
      setTimeout(() => setSeedSuccessMsg(null), 5000);
    }
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

        {seedSuccessMsg && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <span>{seedSuccessMsg}</span>
          </div>
        )}

        {/* 1-Click Quick Demo Login Shortcuts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-600" />
              1-Click Demo Login Roles
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Select any role below</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@dailyfreshmart.com', 'super_admin', 'Super Admin')}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-emerald-500 hover:bg-emerald-50/50 transition shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block group-hover:text-emerald-800">
                    Super Admin
                  </span>
                  <span className="text-[10px] text-slate-500">Full Catalog, Category, Stock & Orders Sync</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('ops@dailyfreshmart.com', 'order_manager', 'Operations Manager')}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-blue-500 hover:bg-blue-50/50 transition shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                  <UserCheck className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block group-hover:text-blue-800">
                    Operations Manager
                  </span>
                  <span className="text-[10px] text-slate-500">Order Progression & Customer WhatsApp</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition" />
            </button>

            <button
              type="button"
              onClick={() => handleQuickLogin('inventory@dailyfreshmart.com', 'inventory_manager', 'Inventory Supervisor')}
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-left hover:border-amber-500 hover:bg-amber-50/50 transition shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Zap className="h-4 w-4 fill-amber-500 text-amber-600" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 text-xs block group-hover:text-amber-800">
                    Inventory Supervisor
                  </span>
                  <span className="text-[10px] text-slate-500">Central Stock Counts & Restock Audit</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition" />
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Or Sign in with Email / PIN
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
                  placeholder="admin@dailyfreshmart.com"
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
                  placeholder="•••••••• (default: admin123)"
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

        {/* Utilities: Dump Demo Data & Open Store */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-slate-700 hover:text-emerald-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Database className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : 'text-emerald-600'}`} />
            <span>{isSeeding ? 'Dumping Demo Data...' : 'Dump / Reset Demo Data'}</span>
          </button>

          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition font-medium"
          >
            <span>Open Storefront (5173)</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
