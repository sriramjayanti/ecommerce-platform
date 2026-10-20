import React, { useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useAdminNav } from '../context/AdminNavContext';
import {
  LogOut,
  Database,
  ExternalLink,
  Store,
  CheckCircle2,
  Menu,
} from 'lucide-react';

const getStorefrontUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com'))) {
    return 'https://dailyfresh-wholesale-mart.web.app';
  }
  return 'http://localhost:5173';
};

export const AdminHeader: React.FC = () => {
  const { adminUser, logout, resetDemoData, isSeeding } = useAdminAuth();
  const { toggleMobileDrawer } = useAdminNav();
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
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'order_manager':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'inventory_manager':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-6 py-2.5 sm:py-3.5 backdrop-blur-md shadow-2xs">
        {/* Left: Mobile Hamburger & System Status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={toggleMobileDrawer}
            className="flex lg:hidden h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition active:scale-95"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile Brand Title */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold shadow-xs">
              <Store className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <span className="text-xs font-black text-slate-900 block">DailyFresh</span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">Admin Ops</span>
            </div>
          </div>

          {/* Desktop Status Indicator */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/80 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Operations & Wholesale Platform
            </span>
          </div>
        </div>

        {/* Right: Actions, Role Badge, Demo Reset, User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Demo Data Dump Button */}
          <button
            type="button"
            onClick={handleSeed}
            disabled={isSeeding}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
            title="Reset Catalog, Orders, Slabs and Reviews with rich demo data"
          >
            <Database className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : 'text-emerald-600'}`} />
            <span className="hidden sm:inline">{isSeeding ? 'Dumping...' : 'Dump Demo Data'}</span>
            <span className="sm:hidden">{isSeeding ? '...' : 'Demo'}</span>
          </button>

          {/* Storefront Link (desktop/tablet) */}
          <a
            href={getStorefrontUrl()}
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-xs"
          >
            <Store className="h-3.5 w-3.5 text-emerald-600" />
            <span>Customer Store</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>

          {/* Logged in User Profile & Role Badge */}
          {adminUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-900 block leading-tight truncate max-w-[140px]">
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
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition"
                title="Sign out of admin"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 shadow-xl text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
