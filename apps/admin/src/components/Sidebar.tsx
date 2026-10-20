import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAdminNav } from '../context/AdminNavContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  Boxes,
  ShoppingBag,
  Sliders,
  MessageSquare,
  Image,
  Store,
  ExternalLink,
  ShieldAlert,
  X,
  LogOut,
  Database,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Overview Metrics', icon: LayoutDashboard },
  { path: '/products', label: 'Products & Wholesale Tiers', icon: Package },
  { path: '/categories', label: 'Categories', icon: Layers },
  { path: '/inventory', label: 'Inventory & Stock Logs', icon: Boxes },
  { path: '/orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
  { path: '/features', label: 'Feature Flags & Settings', icon: Sliders },
  { path: '/reviews', label: 'Review Moderation', icon: MessageSquare },
  { path: '/banners', label: 'Promotional Banners', icon: Image },
];

const getStorefrontUrl = () => {
  if (typeof window !== 'undefined' && (window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com'))) {
    return 'https://dailyfresh-wholesale-mart.web.app';
  }
  return 'http://localhost:5173';
};

export const Sidebar: React.FC = () => {
  const { isMobileDrawerOpen, closeMobileDrawer } = useAdminNav();
  const { adminUser, logout, resetDemoData, isSeeding } = useAdminAuth();

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

  const navContent = (isMobile = false) => (
    <>
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 py-3 mb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/20">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight block">DailyFresh Mart</span>
              <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                Admin Ops Center
              </span>
            </div>
          </div>

          {isMobile && (
            <button
              type="button"
              onClick={closeMobileDrawer}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => {
                  if (isMobile) closeMobileDrawer();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Content */}
      <div className="pt-4 border-t border-slate-200 space-y-2.5 mt-auto">
        {/* Quick Demo Reset in mobile drawer */}
        {isMobile && (
          <button
            type="button"
            onClick={async () => {
              await resetDemoData();
              closeMobileDrawer();
              window.location.reload();
            }}
            disabled={isSeeding}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-300 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
          >
            <Database className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : 'text-emerald-600'}`} />
            <span>{isSeeding ? 'Resetting Demo...' : 'Dump Demo Data'}</span>
          </button>
        )}

        {/* Storefront Link */}
        <a
          href={getStorefrontUrl()}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <span className="flex items-center gap-2">
            <Store className="h-3.5 w-3.5 text-emerald-600" />
            <span>Open Customer Store</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </a>

        {/* User Info & Logout on Mobile */}
        {isMobile && adminUser && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="overflow-hidden pr-2">
              <span className="text-xs font-bold text-slate-900 block truncate">
                {adminUser.displayName || adminUser.email}
              </span>
              <span
                className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-black uppercase border ${getRoleBadge(
                  adminUser.role
                )}`}
              >
                {adminUser.role.replace('_', ' ')}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="px-2 py-1 text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-emerald-600" />
          <span>Super Admin Mode</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Sidebar (always visible on >= lg) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between p-4 flex-shrink-0 min-h-screen sticky top-0 h-screen overflow-y-auto">
        {navContent(false)}
      </aside>

      {/* 2. Mobile Drawer & Backdrop (toggled via isMobileDrawerOpen) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${
          isMobileDrawerOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
        }`}
      >
        {/* Backdrop overlay */}
        <div
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ${
            isMobileDrawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMobileDrawer}
          aria-hidden="true"
        />

        {/* Slide-over Drawer Panel */}
        <div
          className={`fixed inset-y-0 left-0 w-72 sm:w-80 bg-white shadow-2xl flex flex-col justify-between p-4 overflow-y-auto z-10 transition-transform duration-300 ease-out transform ${
            isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {navContent(true)}
        </div>
      </div>
    </>
  );
};
