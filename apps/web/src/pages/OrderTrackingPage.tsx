import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Order,
  dataStore,
  mapToSimpleTrackingStep,
  SIMPLE_TRACKING_STEPS,
  SimpleTrackingStep,
} from '@ecommerce/shared';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  Phone,
  Printer,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ExternalLink,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  Search,
  Check,
  AlertCircle,
  Home,
  Store,
} from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();

  const [searchOrderNumber, setSearchOrderNumber] = useState(orderId || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  const fetchOrder = async (queryId?: string) => {
    setLoading(true);
    setSearchError(null);
    const targetId = (queryId || orderId || '').trim();

    if (!targetId) {
      // Default to the latest placed order if no ID specified
      const allOrders = await dataStore.getOrders();
      if (allOrders.length > 0) {
        setOrder(allOrders[0]);
        setSearchOrderNumber(allOrders[0].orderNumber || allOrders[0].id);
      } else {
        setOrder(null);
      }
      setLoading(false);
      return;
    }

    const found = await dataStore.getOrderById(targetId);
    if (found) {
      setOrder(found);
      setSearchOrderNumber(found.orderNumber || found.id);
    } else {
      setOrder(null);
      setSearchError(`No order found matching "${targetId}". Please check your order ID.`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrder(orderId);

    const unsub = dataStore.subscribe((event) => {
      if (event.type === 'orders_updated' || event.type === 'order_placed') {
        fetchOrder(orderId || searchOrderNumber);
      }
    });

    return () => unsub();
  }, [orderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchOrderNumber.trim()) {
      navigate(`/order/${encodeURIComponent(searchOrderNumber.trim())}`);
      fetchOrder(searchOrderNumber.trim());
    }
  };

  const simpleTracking = order ? mapToSimpleTrackingStep(order.orderStatus) : null;
  const isCancelled = simpleTracking?.step === 'Cancelled';

  // Find when status was updated by Admin
  const latestAdminUpdate = order?.statusHistory && order.statusHistory.length > 0
    ? order.statusHistory[order.statusHistory.length - 1]
    : null;

  return (
    <div className="min-h-screen bg-[#eaeded]/50 py-6 sm:py-10">
      <div className="mx-auto max-w-5xl px-3 sm:px-4 space-y-6">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 border border-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            <span>← Back to Shopping</span>
          </button>
          <Link
            to="/account?tab=orders"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline"
          >
            View All My Orders
          </Link>
        </div>

        {/* Simple Order Tracking Search Bar */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
                Live Delivery Tracker
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Track Your Grocery Order
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Status is verified and updated live by store admin.
              </p>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2 pt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchOrderNumber}
                  onChange={(e) => setSearchOrderNumber(e.target.value)}
                  placeholder="Enter Order ID (e.g. AMZ-2026-9021)"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50/70 pl-10 pr-4 py-3 text-xs sm:text-sm text-slate-900 outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                className="rounded-2xl bg-amber-400 hover:bg-amber-500 px-5 sm:px-6 py-3 text-xs font-black text-slate-950 shadow-md shadow-amber-400/20 active:scale-95 transition"
              >
                Track
              </button>
            </form>

            {searchError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{searchError}</span>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto" />
            <div className="h-20 bg-slate-100 rounded-2xl w-full" />
          </div>
        ) : !order ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <Package className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Order Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please enter a valid order number or check your order confirmation details.
            </p>
            <Link
              to="/account?tab=orders"
              className="mt-2 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
            >
              Check My Orders
            </Link>
          </div>
        ) : (
          <>
            {/* Top Order Card with Admin Verification Badge */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      Order Details
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      #{order.orderNumber}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {order.customerName}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Status Verified by Admin Only Pill */}
                <div className="flex flex-col sm:items-end gap-1.5 self-start sm:self-auto">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-extrabold text-emerald-800 shadow-2xs">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Status Updated by Admin Only</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {latestAdminUpdate
                      ? `Last updated: ${new Date(latestAdminUpdate.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                      : 'Live synced with Store Operations'}
                  </span>
                </div>
              </div>

              {/* Cancelled Banner if applicable */}
              {isCancelled ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
                  <h3 className="text-base font-black text-rose-800">Order Cancelled</h3>
                  <p className="text-xs text-rose-600">
                    This order was cancelled by store admin. If paid online, your refund will be processed within 2-4 business days.
                  </p>
                </div>
              ) : (
                /* SIMPLE 3-STAGE TRACKING TIMELINE */
                <div className="space-y-8 py-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Current Status
                      </span>
                      <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                        {simpleTracking?.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">
                      {simpleTracking?.description}
                    </p>
                  </div>

                  {/* Visual 3-Stage Progress Bar */}
                  <div className="relative">
                    {/* Connecting Bar */}
                    <div className="absolute top-6 left-12 right-12 h-1.5 bg-slate-200 rounded-full -z-0">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${(Math.max(0, simpleTracking?.stepIndex ?? 0) / 2) * 100}%`,
                        }}
                      />
                    </div>

                    {/* The 3 Simple Milestones: Order Confirmed -> Dispatched -> Delivered */}
                    <div className="grid grid-cols-3 gap-2 relative z-10 text-center">
                      
                      {/* 1. Order Confirmed */}
                      <div className="flex flex-col items-center space-y-2">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black transition-all ${
                            (simpleTracking?.stepIndex ?? 0) >= 0
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100'
                              : 'bg-white text-slate-400 border-2 border-slate-300'
                          }`}
                        >
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900">
                            1. Order Confirmed
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Verified by store admin
                          </span>
                        </div>
                      </div>

                      {/* 2. Dispatched */}
                      <div className="flex flex-col items-center space-y-2">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black transition-all ${
                            (simpleTracking?.stepIndex ?? 0) >= 1
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100'
                              : 'bg-white text-slate-400 border-2 border-slate-300'
                          }`}
                        >
                          <Truck className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className={`text-xs sm:text-sm font-black ${(simpleTracking?.stepIndex ?? 0) >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
                            2. Dispatched
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Out for doorstep delivery
                          </span>
                        </div>
                      </div>

                      {/* 3. Delivered */}
                      <div className="flex flex-col items-center space-y-2">
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-black transition-all ${
                            (simpleTracking?.stepIndex ?? 0) >= 2
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100'
                              : 'bg-white text-slate-400 border-2 border-slate-300'
                          }`}
                        >
                          <Home className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className={`text-xs sm:text-sm font-black ${(simpleTracking?.stepIndex ?? 0) >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
                            3. Delivered
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            Delivered to your home
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Status Managed & Updated Exclusively by Store Admin */}
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    <span className="text-xs font-black uppercase text-emerald-950 tracking-wide">
                      Admin Verification & Update History
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                    Status Updated by Store Admin Only
                  </span>
                </div>

                {latestAdminUpdate?.note && (
                  <div className="rounded-xl bg-white border border-emerald-200/80 p-3 text-xs text-slate-800 flex items-start gap-2 shadow-2xs">
                    <Store className="h-4 w-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-slate-900 block">Latest Admin Note:</span>
                      <p className="text-slate-600 mt-0.5">{latestAdminUpdate.note}</p>
                    </div>
                  </div>
                )}

                {/* Audit Trail List */}
                <div className="space-y-1.5 pt-1 text-xs">
                  {(order.statusHistory || []).map((h, i) => (
                    <div key={i} className="flex items-center justify-between py-1 text-slate-600 border-b border-emerald-100/40 last:border-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="font-bold text-slate-900">{h.status}</span>
                        {h.note && <span className="text-slate-500 text-[11px] hidden sm:inline">• {h.note}</span>}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/60 px-1.5 py-0.5 rounded mr-2">
                          {h.updatedBy || 'Store Admin'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Split Grid: Items Snapshot & Delivery Address Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Items (8 cols) */}
              <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Items in This Order ({order.items?.length || 0})
                  </h3>
                  <span className="text-xs font-bold text-slate-500">
                    Total Qty: {order.items?.reduce((s, i) => s + (i.quantity || 1), 0)} units
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {(order.items || []).map((item, idx) => (
                    <div key={idx} className="flex gap-4 py-3.5 text-xs">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120'}
                        alt=""
                        className="h-16 w-16 rounded-xl object-cover bg-slate-50 border border-slate-200 flex-shrink-0"
                      />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                          <span className="text-slate-500 text-[11px] block mt-0.5">
                            {item.variantName} • SKU: {item.sku}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50">
                          <span className="text-slate-600 font-medium">
                            {item.quantity} × ₹{item.unitPrice}
                          </span>
                          <span className="font-black text-slate-900 text-sm">₹{item.lineTotal}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* WhatsApp Support Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Questions about your delivery?
                  </span>
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold shadow-xs transition"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span>WhatsApp Live Support</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Shipping & Payment Summary (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                
                {/* Shipping Address */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>Delivery Address</span>
                  </h3>
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{order.shippingAddress.fullName}</p>
                    <p>{order.shippingAddress.line1}</p>
                    {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} - <span className="font-bold">{order.shippingAddress.pincode}</span></p>
                    <p className="pt-2 font-medium text-slate-800">Phone: {order.shippingAddress.phone}</p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Payment & Bill Summary
                  </h3>
                  <div className="rounded-xl bg-slate-50 p-2.5 text-xs flex justify-between items-center">
                    <span className="text-slate-500">Payment:</span>
                    <span className="font-extrabold uppercase text-slate-900">
                      {order.paymentMethod || 'Online'} • {order.paymentStatus}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-900">₹{order.subtotal}</span>
                    </div>
                    {order.totalSavings > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Savings</span>
                        <span>- ₹{order.totalSavings}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span>{order.deliveryCharge === 0 ? <span className="font-bold text-emerald-700">FREE</span> : `₹${order.deliveryCharge}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span>₹{order.taxAmount}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black text-slate-900">
                      <span>Final Total</span>
                      <span className="text-emerald-700">₹{order.finalTotal}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
