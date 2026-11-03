import React from 'react';
import { getStorefrontUrl } from '@ecommerce/shared';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  LogOut,
  ExternalLink,
  Store,
} from 'lucide-react';

export const AdminHeader: React.FC = () => {
  const { adminUser, logout } = useAdminAuth();

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
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur-md shadow-2xs">
      {/* Left: Quick System Status */}
      <div className="flex items-center gap-3">
        <div className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/80 animate-pulse" />
        <span className="text-xs font-black uppercase tracking-wider text-slate-500">
          Operations & Wholesale Platform
        </span>
      </div>

      {/* Right: Actions, Role Badge, User Profile & Logout */}
      <div className="flex items-center gap-3">
        {/* Storefront Link */}
        <a
          href={getStorefrontUrl()}
          target="_blank"
          rel="noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs"
        >
          <Store className="h-3.5 w-3.5 text-emerald-600" />
          <span>Customer Storefront</span>
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
  );
};
