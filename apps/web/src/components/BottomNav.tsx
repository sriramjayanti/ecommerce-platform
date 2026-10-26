import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  LayoutGrid,
  Search,
  Package,
  Heart,
  User,
  ShoppingBag,
} from 'lucide-react';

interface BottomNavProps {
  onOpenCategories: () => void;
  onOpenSearch?: () => void;
  onOpenLogin?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  onOpenCategories,
  onOpenSearch,
  onOpenLogin,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { wishlistIds, totals, setDrawerOpen } = useCart();
  const { user } = useAuth();

  const isHome = location.pathname === '/';
  const isOrders = location.pathname === '/account' && location.search.includes('tab=orders');
  const isWishlist = location.pathname.includes('/wishlist') || (location.pathname === '/account' && location.search.includes('tab=wishlist'));
  const isAccount = location.pathname === '/account' && !isOrders && !isWishlist;

  const handleProfileClick = () => {
    if (user) {
      navigate('/account');
    } else if (onOpenLogin) {
      onOpenLogin();
    } else {
      navigate('/login');
    }
  };

  return (
    <nav
      aria-label="Mobile and Quick Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {/* 1. Home */}
        <Link
          to="/"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            isHome ? 'text-amber-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-bold'
          }`}
        >
          <Home className={`h-5 w-5 ${isHome ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </Link>

        {/* 2. Categories Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenCategories}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-500 hover:text-amber-600 transition font-bold"
        >
          <LayoutGrid className="h-5 w-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">Categories</span>
        </button>

        {/* 3. Orders */}
        <Link
          to="/account?tab=orders"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            isOrders ? 'text-amber-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-bold'
          }`}
        >
          <Package className={`h-5 w-5 ${isOrders ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Orders</span>
        </Link>

        {/* 4. Wishlist */}
        <Link
          to="/account?tab=wishlist"
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            isWishlist ? 'text-rose-600 font-extrabold' : 'text-slate-500 hover:text-rose-600 font-bold'
          }`}
        >
          <div className="relative">
            <Heart className={`h-5 w-5 ${isWishlist ? 'fill-rose-500 stroke-rose-500 stroke-[2.5px]' : ''}`} />
            {wishlistIds.length > 0 && (
              <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs">
                {wishlistIds.length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">Wishlist</span>
        </Link>

        {/* 5. Profile */}
        <button
          type="button"
          onClick={handleProfileClick}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
            isAccount ? 'text-amber-600 font-extrabold' : 'text-slate-500 hover:text-slate-900 font-bold'
          }`}
        >
          <User className={`h-5 w-5 ${isAccount ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">
            {user ? 'Profile' : 'Sign In'}
          </span>
        </button>

        {/* 6. Quick Floating Cart Mini Indicator */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="relative flex items-center justify-center h-10 w-10 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 shadow-md shadow-amber-400/30 active:scale-95 transition"
          title="Open Cart"
        >
          <ShoppingBag className="h-5 w-5" />
          {totals.itemCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-slate-950 text-[9px] font-black text-amber-400 shadow-xs">
              {totals.itemCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
