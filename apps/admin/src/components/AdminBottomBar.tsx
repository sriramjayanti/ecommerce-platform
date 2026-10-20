import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminNav } from '../context/AdminNavContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Boxes,
  Menu,
} from 'lucide-react';

export const AdminBottomBar: React.FC = () => {
  const { openMobileDrawer, isMobileDrawerOpen } = useAdminNav();
  const location = useLocation();

  // Pages considered under the "More" drawer menu
  const isOtherActive = [
    '/categories',
    '/features',
    '/reviews',
    '/banners',
  ].some((path) => location.pathname.startsWith(path));

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: '/orders',
      label: 'Orders',
      icon: ShoppingBag,
      end: false,
    },
    {
      to: '/products',
      label: 'Products',
      icon: Package,
      end: false,
    },
    {
      to: '/inventory',
      label: 'Stock',
      icon: Boxes,
      end: false,
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden"
    >
      <div className="grid grid-cols-5 items-center gap-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition duration-150 active:scale-95 ${
                  isActive
                    ? 'text-emerald-600 bg-emerald-50/80 font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-emerald-600 stroke-[2.25]' : 'text-slate-500 stroke-[1.75]'}`} />
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* More / Menu Drawer Toggle */}
        <button
          type="button"
          onClick={openMobileDrawer}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition duration-150 active:scale-95 ${
            isMobileDrawerOpen || isOtherActive
              ? 'text-emerald-600 bg-emerald-50/80 font-bold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
          }`}
          aria-label="Open More Admin Options"
        >
          <div className="relative">
            <Menu className={`h-5 w-5 ${isMobileDrawerOpen || isOtherActive ? 'text-emerald-600 stroke-[2.25]' : 'text-slate-500 stroke-[1.75]'}`} />
            {isOtherActive && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-emerald-500" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight leading-none truncate">
            More
          </span>
        </button>
      </div>
    </nav>
  );
};
