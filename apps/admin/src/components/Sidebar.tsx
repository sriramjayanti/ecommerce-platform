import React from 'react';
import { NavLink } from 'react-router-dom';
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

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between p-4 flex-shrink-0 min-h-screen">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-4 mb-4 border-b border-slate-800/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black shadow-lg shadow-emerald-600/30">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tracking-tight">DailyFresh Mart</span>
            <span className="block text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Admin Ops Center
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
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
      <div className="pt-4 border-t border-slate-800/80 space-y-2">
        <a
          href="http://localhost:5173"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-xl bg-slate-900/90 border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition"
        >
          <span className="flex items-center gap-2">
            <Store className="h-3.5 w-3.5 text-emerald-400" />
            <span>Open Customer Store</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
        </a>

        <div className="px-2 py-1 text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-emerald-500" />
          <span>Super Admin Mode</span>
        </div>
      </div>
    </aside>
  );
};
