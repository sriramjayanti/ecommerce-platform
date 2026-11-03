import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Order, Product, dataStore, mapToSimpleTrackingStep } from '@ecommerce/shared';
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  LogOut,
  ChevronRight,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Edit2,
  Check,
  Save,
  RotateCcw,
  Zap,
} from 'lucide-react';

interface AccountPageProps {
  defaultTab?: 'profile' | 'orders' | 'addresses' | 'wishlist';
}

export const AccountPage: React.FC<AccountPageProps> = ({ defaultTab }) => {
  const { user, logout, addresses, deleteAddress, setDefaultAddress, updateUserProfile } = useAuth();
  const { wishlistIds, items, addItem, toggleWishlist, setDrawerOpen } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get('tab') as any) || defaultTab || (user ? 'profile' : 'orders');
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'addresses' | 'wishlist'>(
    ['profile', 'orders', 'addresses', 'wishlist'].includes(tabParam) ? tabParam : 'profile'
  );

  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit profile form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const qTab = searchParams.get('tab') as any;
    if (qTab && ['profile', 'orders', 'addresses', 'wishlist'].includes(qTab)) {
      setActiveTab(qTab);
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [searchParams, defaultTab]);

  useEffect(() => {
    if (user) {
      setEditName(user.displayName || '');
      setEditPhone(user.phone || '');
      setEditEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    const loadAccountData = async () => {
      setLoading(true);
      const [allOrders, allProds] = await Promise.all([
        dataStore.getOrders(),
        dataStore.getProducts(),
      ]);

      // If logged in, filter orders for this user if matching; else show all customer orders
      let filteredOrders = allOrders;
      if (user && user.id) {
        const matching = allOrders.filter(
          (o) =>
            o.userId === user.id ||
            (user.phone && o.customerPhone === user.phone) ||
            (user.email && o.customerEmail === user.email)
        );
        if (matching.length > 0) {
          filteredOrders = matching;
        }
      }

      setUserOrders(filteredOrders);
      setWishlistProducts(allProds.filter((p) => wishlistIds.includes(p.id)));
      setLoading(false);
    };

    loadAccountData();

    const unsub = dataStore.subscribe((event) => {
      if (event.type === 'orders_updated' || event.type === 'order_placed') {
        loadAccountData();
      }
    });

    return () => unsub();
  }, [user, wishlistIds]);

  const switchTab = (tab: 'profile' | 'orders' | 'addresses' | 'wishlist') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    await updateUserProfile({
      displayName: editName.trim(),
      phone: editPhone.trim() || undefined,
      email: editEmail.trim() || undefined,
    });
    setIsEditingProfile(false);
    setProfileSuccessMsg('Profile updated and synced successfully!');
    setTimeout(() => setProfileSuccessMsg(null), 3000);
  };

  const totalSpent = userOrders.reduce((sum, o) => sum + (o.finalTotal || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-10 pb-24 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Top Back Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 border border-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            <span>← Back to Shopping</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">Customer Account Portal</span>
        </div>

        {/* Profile Banner */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 text-2xl font-black shadow-md shadow-amber-400/20">
              {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                  {user?.displayName || 'Valued Shopper'}
                </h1>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 border border-emerald-300 uppercase">
                  {user?.role && user.role !== 'customer' ? 'Store Staff' : 'Verified Customer'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {user?.email || user?.phone || 'Guest Shopper • Sign in to save orders & delivery addresses permanently'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!user ? (
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 px-4 py-2 text-xs font-black text-slate-950 shadow-xs transition"
              >
                <User className="h-4 w-4" />
                <span>Customer Sign In</span>
              </button>
            ) : (
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 sm:gap-3 border-b border-slate-200 pb-4 mb-8 overflow-x-auto scrollbar-none">
          <button
            onClick={() => switchTab('profile')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Customer Profile</span>
          </button>

          <button
            onClick={() => switchTab('orders')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Orders & Live Tracking ({userOrders.length})</span>
          </button>

          <button
            onClick={() => switchTab('wishlist')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition whitespace-nowrap ${
              activeTab === 'wishlist'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
            <span>Wishlist ({wishlistIds.length})</span>
          </button>

          <button
            onClick={() => switchTab('addresses')}
            className={`flex items-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black transition whitespace-nowrap ${
              activeTab === 'addresses'
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span>Saved Delivery Addresses ({addresses.length})</span>
          </button>
        </div>

        {/* ----------------- TAB 1: CUSTOMER PROFILE ----------------- */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Orders
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {userOrders.length}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold">
                  ₹{totalSpent.toLocaleString('en-IN')} Spent
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Saved Addresses
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {addresses.length}
                </span>
                <span className="text-[11px] text-slate-500">
                  {addresses[0]?.city || 'Bengaluru'}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Wishlist Items
                </span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">
                  {wishlistIds.length}
                </span>
                <span className="text-[11px] text-rose-500 font-bold">
                  Bookmarked Products
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Customer Status
                </span>
                <span className="text-2xl font-black text-amber-500 mt-1 block">
                  Prime
                </span>
                <span className="text-[11px] text-slate-500">
                  Mandi Slabs Active
                </span>
              </div>
            </div>

            {/* Success message */}
            {profileSuccessMsg && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* Personal Details & Edit Form */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Personal Details</h2>
                  <p className="text-xs text-slate-500">Your registered contact information and delivery profile</p>
                </div>

                {user && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>{isEditingProfile ? 'Cancel' : 'Edit Profile'}</span>
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-amber-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number</label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-amber-400 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-amber-400 font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black px-6 py-2.5 text-xs shadow-md shadow-amber-400/20 transition"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Full Name
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 block">
                      {user?.displayName || 'Not Set'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Mobile Phone
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 block font-mono">
                      {user?.phone || 'Not Set'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Email Address
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 block">
                      {user?.email || 'Not Set'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Previous Orders Summary Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Recent Orders Summary</h2>
                  <p className="text-xs text-slate-500">Your recent purchases and delivery progress</p>
                </div>

                <button
                  type="button"
                  onClick={() => switchTab('orders')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
                >
                  <span>View All Orders & Live Tracking</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {userOrders.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <ShoppingBag className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p>No previous orders recorded yet.</p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-3 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders.slice(0, 3).map((ord) => {
                    const tracking = mapToSimpleTrackingStep(ord.orderStatus);
                    return (
                      <div
                        key={ord.id}
                        className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900 font-mono">
                              #{ord.orderNumber}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase border ${
                                tracking.step === 'Delivered'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : tracking.step === 'Dispatched'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {tracking.label}
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-1">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            • {ord.items.length} item(s) • ₹{ord.finalTotal}
                          </p>
                        </div>

                        <Link
                          to={`/order/${ord.orderNumber || ord.id}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold transition self-start sm:self-auto"
                        >
                          <span>Track Order</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: STRICTLY ORDERS & TRACKING ----------------- */}
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
                      Authoritative Live Delivery Tracker
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                      <ShieldCheck className="h-3 w-3 text-emerald-700" />
                      Live Firestore Synced
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    3-Stage Tracking: 1. Confirmed / Placed → 2. Dispatched / Out for Delivery → 3. Delivered
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
                <Link to="/" className="mt-4 inline-block rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950">
                  Start Shopping Now
                </Link>
              </div>
            ) : (
              userOrders.map((order) => {
                const tracking = mapToSimpleTrackingStep(order.orderStatus);
                return (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-xs space-y-4"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-base text-slate-900 font-mono">
                            #{order.orderNumber}
                          </span>
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
                          <span className="text-[10px] text-slate-400 font-bold">
                            • {order.fulfilmentMethod === 'takeaway' ? 'Store Pickup' : 'Home Delivery'}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to={`/order/${order.orderNumber || order.id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 px-4 py-2 text-xs font-black shadow-xs transition"
                        >
                          <span>Track Live Delivery</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* 3-Stage Visual Progress Bar */}
                    {tracking.step !== 'Cancelled' && (
                      <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                          <span className={tracking.stepIndex >= 0 ? 'text-emerald-700 font-extrabold' : ''}>
                            ✓ 1. Placed
                          </span>
                          <span className={tracking.stepIndex >= 1 ? 'text-blue-700 font-extrabold' : ''}>
                            🚚 2. Dispatched
                          </span>
                          <span className={tracking.stepIndex >= 2 ? 'text-emerald-700 font-extrabold' : ''}>
                            🏠 3. Delivered
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`h-2 flex-1 rounded-full transition-all ${
                              tracking.stepIndex >= 0 ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                          <span
                            className={`h-2 flex-1 rounded-full transition-all ${
                              tracking.stepIndex >= 1 ? 'bg-blue-500' : 'bg-slate-200'
                            }`}
                          />
                          <span
                            className={`h-2 flex-1 rounded-full transition-all ${
                              tracking.stepIndex >= 2 ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                          />
                        </div>
                      </div>
                    )}

                    {/* Order Items Breakdown */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Ordered Items ({order.items.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {order.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-2.5"
                          >
                            <img
                              src={it.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                              alt={it.title}
                              className="h-12 w-12 object-cover rounded-xl border border-slate-200 flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-extrabold text-slate-900 truncate block">
                                {it.title}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                Qty: {it.quantity} × ₹{it.unitPrice}
                              </span>
                            </div>
                            <span className="font-black text-slate-900 text-xs">
                              ₹{it.lineTotal}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Footer with Total & Shipping details */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                      <div className="text-slate-500">
                        <span className="font-bold text-slate-700">Delivery Address: </span>
                        <span>
                          {order.shippingAddress?.fullName}, {order.shippingAddress?.line1},{' '}
                          {order.shippingAddress?.city} - {order.shippingAddress?.pincode}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 mr-2">
                          ({order.paymentMethod.toUpperCase()} • {order.paymentStatus})
                        </span>
                        <span className="text-base font-black text-slate-950 font-sans">
                          Total: ₹{order.finalTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ----------------- TAB 3: STRICTLY WISHLIST ITEMS ----------------- */}
        {activeTab === 'wishlist' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-slate-900">My Wishlist</h2>
                <p className="text-xs text-slate-500">Bookmarked products saved to buy later</p>
              </div>

              {wishlistProducts.length > 0 && (
                <span className="rounded-full bg-rose-50 text-rose-700 font-bold px-3 py-1 text-xs border border-rose-200">
                  {wishlistProducts.length} Items
                </span>
              )}
            </div>

            {wishlistProducts.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
                <Heart className="h-12 w-12 text-rose-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Your wishlist is empty</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Save your favorite grocery, snack, and wholesale essentials while browsing!
                </p>
                <Link
                  to="/"
                  className="mt-4 inline-block rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950"
                >
                  Explore Store Catalog
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {wishlistProducts.map((p) => {
                  const defaultVariant = p.variants[0];
                  const price = defaultVariant?.basePrice || 0;
                  const mrp = defaultVariant?.mrp || price;
                  const isOutOfStock = (defaultVariant?.stock ?? 0) <= 0;

                  return (
                    <div
                      key={p.id}
                      className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-amber-400 hover:shadow-md transition"
                    >
                      <div className="relative mb-2">
                        {/* Remove Wishlist button */}
                        <button
                          type="button"
                          onClick={() => toggleWishlist(p.id)}
                          className="absolute top-0 right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 text-rose-500 hover:bg-rose-50 transition shadow-xs"
                          title="Remove from Wishlist"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <Link to={`/product/${p.slug || p.id}`} className="block aspect-square w-full rounded-2xl overflow-hidden bg-slate-50">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400'}
                            alt={p.title}
                            className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </Link>
                      </div>

                      <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                            {p.brand || 'DailyMart'}
                          </span>
                          <Link
                            to={`/product/${p.slug || p.id}`}
                            className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 hover:text-amber-600 transition"
                          >
                            {p.title}
                          </Link>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-sm font-black text-slate-950 font-sans">
                              ₹{price.toLocaleString('en-IN')}
                            </span>
                            {mrp > price && (
                              <span className="text-[11px] text-slate-400 line-through">
                                ₹{mrp.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => {
                              if (defaultVariant && !isOutOfStock) {
                                addItem(p, defaultVariant, 1);
                                setDrawerOpen(true);
                              }
                            }}
                            className={`w-full mt-2.5 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black shadow-xs transition ${
                              isOutOfStock
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950'
                            }`}
                          >
                            <ShoppingBag className="h-3.5 w-3.5" />
                            <span>{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------- TAB 4: SAVED ADDRESSES ----------------- */}
        {activeTab === 'addresses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-black text-slate-900">Saved Delivery Addresses</h2>
                <p className="text-xs text-slate-500">Manage doorstep delivery locations for checkout</p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 px-3.5 py-1.5 text-xs font-black text-slate-950 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add in Checkout</span>
              </button>
            </div>

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
                      {addr.city}, {addr.state} - <span className="font-bold text-slate-800">{addr.pincode}</span>
                    </p>
                    <p className="text-slate-500 font-medium">Phone: <span className="font-bold text-slate-800">{addr.phone}</span></p>
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
                      title="Delete Address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
