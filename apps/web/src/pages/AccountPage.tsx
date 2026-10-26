import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Order, Product, dataStore, mapToSimpleTrackingStep } from '@ecommerce/shared';
import { ProductCard } from '../components/ProductCard';
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  LogOut,
  ChevronRight,
  Phone,
  Clock,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowLeft,
  Truck,
  ShieldCheck,
} from 'lucide-react';

interface AccountPageProps {
  defaultTab?: 'orders' | 'addresses' | 'wishlist';
}

export const AccountPage: React.FC<AccountPageProps> = ({ defaultTab }) => {
  const { user, logout, addresses, deleteAddress, setDefaultAddress } = useAuth();
  const { wishlistIds, items } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || defaultTab || 'orders';
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist'>(initialTab);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as any;
    if (tabParam && ['orders', 'addresses', 'wishlist'].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [searchParams, defaultTab]);

  useEffect(() => {
    const loadAccountData = async () => {
      const [allOrders, allProds] = await Promise.all([
        dataStore.getOrders(),
        dataStore.getProducts(),
      ]);
      setUserOrders(allOrders);
      setWishlistProducts(allProds.filter((p) => wishlistIds.includes(p.id)));
    };

    loadAccountData();

    const unsub = dataStore.subscribe(() => {
      loadAccountData();
    });

    return () => unsub();
  }, [wishlistIds]);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Simple Back Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 border border-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            <span>← Back to Shopping</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">Customer Dashboard</span>
        </div>

        {/* Profile Banner */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 text-xl font-black shadow-xs">
              {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {user?.displayName || 'Guest Shopper'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {user?.email || user?.phone || 'Not logged in • Login to sync your profile across devices'}
              </p>
            </div>
          </div>

          {user && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 border-b border-slate-200 pb-4 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
              activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>My Orders ({userOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
              activeTab === 'addresses'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Saved Addresses ({addresses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
              activeTab === 'wishlist'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className="h-4 w-4" />
            <span>Wishlist ({wishlistIds.length})</span>
          </button>
        </div>

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Live Tracking Banner */}
            <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black uppercase text-emerald-950 tracking-wider">
                      Live Delivery Tracker
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      <ShieldCheck className="h-3 w-3 text-emerald-700" />
                      Updated by Admin Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Simple 3-stage delivery: 1. Order Confirmed → 2. Dispatched → 3. Delivered
                  </p>
                </div>
              </div>

              <Link
                to="/order/track"
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold shadow-xs transition self-start sm:self-auto"
              >
                <span>Track By Order ID</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {userOrders.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No orders placed yet</h3>
                <p className="text-xs text-slate-500 mt-1">Discover fresh staples and munchies at wholesale rates!</p>
                <Link to="/" className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white">
                  Shop Now
                </Link>
              </div>
            ) : (
              userOrders.map((order) => {
                const tracking = mapToSimpleTrackingStep(order.orderStatus);
                return (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 text-xs flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 font-mono">#{order.orderNumber}</span>
                        
                        {/* Simple Status Badge updated by Admin */}
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase border ${
                            tracking.step === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : tracking.step === 'Dispatched'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : tracking.step === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {tracking.label}
                        </span>

                        <span className="text-[10px] text-slate-400 font-medium">
                          • Updated by Admin
                        </span>
                      </div>

                      {/* Mini 3-stage progress bar */}
                      {tracking.step !== 'Cancelled' && (
                        <div className="flex items-center gap-1.5 max-w-xs pt-1">
                          <span className={`h-1.5 flex-1 rounded-full ${tracking.stepIndex >= 0 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                          <span className={`h-1.5 flex-1 rounded-full ${tracking.stepIndex >= 1 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                          <span className={`h-1.5 flex-1 rounded-full ${tracking.stepIndex >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        </div>
                      )}

                      <p className="text-slate-500 text-[11px]">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} • {order.items.length} items
                      </p>

                      <p className="font-black text-slate-900 text-sm">
                        Total: ₹{order.finalTotal}{' '}
                        <span className="text-[11px] font-normal text-slate-500">
                          ({order.paymentMethod.toUpperCase()} • {order.paymentStatus})
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link
                        to={`/order/${order.orderNumber || order.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black shadow-xs transition"
                      >
                        <span>Track Order</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Addresses */}
        {activeTab === 'addresses' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{addr.fullName}</span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                      {addr.addressType}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {addr.line1}, {addr.line2 && `${addr.line2}, `}
                    {addr.landmark && `Near ${addr.landmark}, `}
                    {addr.city}, {addr.state} - <span className="font-bold">{addr.pincode}</span>
                  </p>
                  <p className="text-slate-500 font-medium">Phone: {addr.phone}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {addr.isDefault ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Default Address
                    </span>
                  ) : (
                    <button
                      onClick={() => setDefaultAddress(addr.id)}
                      className="text-[11px] font-bold text-slate-600 hover:text-emerald-700"
                    >
                      Set as Default
                    </button>
                  )}
                  <button
                    onClick={() => deleteAddress(addr.id)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Wishlist */}
        {activeTab === 'wishlist' && (
          <div>
            {wishlistProducts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                <Heart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Your wishlist is empty</h3>
                <p className="text-xs text-slate-500 mt-1">Save favorite grocery and snack items to purchase later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {wishlistProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
