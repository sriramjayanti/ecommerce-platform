import React from 'react';
import { NavLink } from 'react-router-dom';
import { getStorefrontUrl } from '@ecommerce/shared';
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
  FileSpreadsheet,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Overview Metrics', icon: LayoutDashboard },
  { path: '/reports', label: 'Reports & Export', icon: FileSpreadsheet },
  { path: '/products', label: 'Products & Wholesale Tiers', icon: Package },
  { path: '/categories', label: 'Categories', icon: Layers },
  { path: '/inventory', label: 'Inventory & Stock Logs', icon: Boxes },
  { path: '/orders', label: 'Orders & Fulfillment', icon: ShoppingBag },
  { path: '/features', label: 'Feature Flags & Settings', icon: Sliders },
  { path: '/reviews', label: 'Review Moderation', icon: MessageSquare },
  { path: '/banners', label: 'Promotional Banners', icon: Image },
];

interface SidebarProps {
  onItemClick?: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ onItemClick, onClose, isMobile }) => {
  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col justify-between p-4 flex-shrink-0 ${
        isMobile
          ? 'w-full h-full min-h-screen overflow-y-auto'
          : 'hidden lg:flex w-64 min-h-screen sticky top-0'
      }`}
    >
      <div>
        {/* Brand & Mobile Close Button */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-black shadow-md shadow-emerald-600/20">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 tracking-tight">VS Wholesale</span>
              <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                Admin Ops Center
              </span>
            </div>
          </div>

          {isMobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
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
                onClick={onItemClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
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

      {/* Footer Storefront Link */}
      <div className="pt-4 border-t border-slate-100 space-y-2 mt-auto">
        <a
          href={getStorefrontUrl()}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs"
        >
          <span className="flex items-center gap-2">
            <Store className="h-3.5 w-3.5 text-emerald-600" />
            <span>Open Customer Store</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
        </a>

        <div className="px-2 py-1 text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
          <ShieldAlert className="h-3.5 w-3.5 text-emerald-600" />
          <span>Super Admin Mode</span>
        </div>
      </div>
    </aside>
  );
};
