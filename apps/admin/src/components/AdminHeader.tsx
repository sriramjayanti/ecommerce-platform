import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  ShieldCheck,
  LogOut,
  Database,
  ExternalLink,
  Store,
  CheckCircle2,
  User,
} from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const { adminUser, logout, resetDemoData, isSeeding } = useAdminAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSeed = async () => {
    const success = await resetDemoData();
    if (success) {
      setToastMessage('Demo data refreshed! 24+ Products, 10 Categories & 12 Orders loaded.');
      setTimeout(() => {
        setToastMessage(null);
        window.location.reload();
      }, 1200);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'order_manager':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'inventory_manager':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur-md shadow-2xs">
        {/* Left: Quick System Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/80 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-slate-500">
            Operations & Wholesale Platform
          </span>
        </div>

        {/* Right: Actions, Role Badge, Demo Reset, User Profile & Logout */}
        <div className="flex items-center gap-3">
          
          {/* Quick Demo Data Dump Button */}
          <button
            type="button"
            onClick={handleSeed}
            disabled={isSeeding}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
            title="Reset Catalog, Orders, Slabs and Reviews with rich demo data"
          >
            <Database className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : 'text-emerald-600'}`} />
            <span>{isSeeding ? 'Dumping...' : 'Dump Demo Data'}</span>
          </button>

          {/* Storefront Link */}
          <a
            href="http://localhost:5173"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs"
          >
            <Store className="h-3.5 w-3.5 text-emerald-600" />
            <span>Customer Store (5173)</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>

          {/* Logged in User Profile & Role Badge */}
          {adminUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight">
                  {adminUser.displayName || adminUser.email}
                </span>
                <span
                  className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-black uppercase border ${getRoleBadge(
                    adminUser.role
                  )}`}
                >
                  {adminUser.role.replace('_', ' ')}
                </span>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition shadow-2xs"
                title="Sign out of admin"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
