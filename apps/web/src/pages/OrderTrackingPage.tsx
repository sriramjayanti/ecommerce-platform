import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Order,
  dataStore,
  mapToSimpleTrackingStep,
  SIMPLE_TRACKING_STEPS,
  SimpleTrackingStep,
} from '@ecommerce/shared';
import { PrintableTaxInvoice } from '../components/PrintableTaxInvoice';
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
  Check,
  AlertCircle,
  Home,
  Store,
} from 'lucide-react';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orderId || '');
  const [loading, setLoading] = useState(true);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    const all = await dataStore.getOrders();
    setOrders(all);

    if (all.length > 0) {
      if (orderId) {
        const found = all.find((o) => o.id === orderId || o.orderNumber === orderId);
        setSelectedOrderId(found ? found.id : all[0].id);
      } else if (!selectedOrderId) {
        setSelectedOrderId(all[0].id);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const unsub = dataStore.subscribe((event) => {
      if (event.type === 'orders_updated' || event.type === 'order_placed') {
        fetchOrders();
      }
    });

    return () => unsub();
  }, [orderId]);

  const activeOrder = orders.find((o) => o.id === selectedOrderId || o.orderNumber === selectedOrderId) || orders[0] || null;

  const simpleTracking = activeOrder ? mapToSimpleTrackingStep(activeOrder.orderStatus) : null;
  const isCancelled = simpleTracking?.step === 'Cancelled';

  // Find when status was updated by Admin
  const latestAdminUpdate = activeOrder?.statusHistory && activeOrder.statusHistory.length > 0
    ? activeOrder.statusHistory[activeOrder.statusHistory.length - 1]
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

        {/* Live Tracking Header (Clean - No order ID input) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">
              Live Delivery Tracker
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Order Status & Live Progress
            </h1>
            <p className="text-xs text-slate-500">
              Live status updates verified directly by store operations admin.
            </p>
          </div>

          {/* Multiple Orders Selector Chips if customer placed more than one order */}
          {orders.length > 1 && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Your Orders:</span>
              {orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelectedOrderId(o.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                    activeOrder?.id === o.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  #{o.orderNumber} • ₹{o.finalTotal} ({o.orderStatus})
                </button>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3 mx-auto" />
            <div className="h-20 bg-slate-100 rounded-2xl w-full" />
          </div>
        ) : !activeOrder ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <Package className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Active Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't placed any orders yet. Add farm fresh groceries and essentials to your cart to begin!
            </p>
            <Link
              to="/"
              className="mt-2 inline-block rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950 hover:bg-amber-500 shadow-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Top Order Card with Admin Verification Badge & Print Invoice CTA */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                      Order Details
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      #{activeOrder.orderNumber}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {activeOrder.customerName}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Placed on {new Date(activeOrder.createdAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Status Verified by Admin Only Pill + Print Tax Invoice Button */}
                <div className="flex flex-col sm:items-end gap-2 self-start sm:self-auto">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInvoiceOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-black shadow-xs transition cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5 text-amber-400" />
                      <span>Print Tax Invoice</span>
                    </button>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-extrabold text-emerald-800 shadow-2xs">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Updated by Admin</span>
                    </div>
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
                      {[
                        { step: 'Order Confirmed', label: 'Order Confirmed', desc: 'Verified by Admin' },
                        { step: 'Dispatched', label: 'Dispatched', desc: 'Out for delivery' },
                        { step: 'Delivered', label: 'Delivered', desc: 'Delivered to doorstep' },
                      ].map((milestone, idx) => {
                        const currentIdx = simpleTracking?.stepIndex ?? 0;
                        const isReached = currentIdx >= idx;
                        const isCurrentActive = currentIdx === idx;

                        return (
                          <div key={milestone.step} className="flex flex-col items-center">
                            <div
                              className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                                isCurrentActive
                                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 shadow-md scale-110'
                                  : isReached
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-400 border-2 border-slate-200'
                              }`}
                            >
                              {milestone.step === 'Order Confirmed' && <Package className="h-5 w-5" />}
                              {milestone.step === 'Dispatched' && <Truck className="h-5 w-5" />}
                              {milestone.step === 'Delivered' && <CheckCircle2 className="h-5 w-5" />}
                            </div>

                            <span
                              className={`text-xs font-black mt-2 tracking-tight ${
                                isReached ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {milestone.label}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
                              {milestone.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom 2-Column Grid: Order Items & Delivery/Payment Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Ordered Items (8 cols) */}
              <div className="lg:col-span-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-emerald-600" />
                    <span>Items in this Order ({activeOrder.items.length})</span>
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">SKU Verified</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {activeOrder.items.map((item, idx) => (
                    <div key={idx} className="py-3 flex gap-3 sm:gap-4 items-center">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                        alt={item.title}
                        className="h-16 w-16 rounded-xl object-cover bg-slate-50 border border-slate-200 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
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
                    <p className="font-bold text-slate-900 text-sm">{activeOrder.shippingAddress?.fullName || activeOrder.customerName}</p>
                    <p>{activeOrder.shippingAddress?.line1}</p>
                    {activeOrder.shippingAddress?.line2 && <p>{activeOrder.shippingAddress.line2}</p>}
                    <p>{activeOrder.shippingAddress?.city}, {activeOrder.shippingAddress?.state} - <span className="font-bold">{activeOrder.shippingAddress?.pincode}</span></p>
                    <p className="pt-2 font-medium text-slate-800">Phone: {activeOrder.shippingAddress?.phone || activeOrder.customerPhone}</p>
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
                      {activeOrder.paymentMethod || 'Online'} • {activeOrder.paymentStatus}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-bold text-slate-900">₹{activeOrder.subtotal}</span>
                    </div>
                    {activeOrder.totalSavings > 0 && (
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Savings</span>
                        <span>- ₹{activeOrder.totalSavings}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span>{activeOrder.deliveryCharge === 0 ? <span className="font-bold text-emerald-700">FREE</span> : `₹${activeOrder.deliveryCharge}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span>₹{activeOrder.taxAmount}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black text-slate-900">
                      <span>Final Total</span>
                      <span className="text-emerald-700">₹{activeOrder.finalTotal}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Official GST Tax Invoice Modal */}
            {isInvoiceOpen && (
              <PrintableTaxInvoice order={activeOrder} onClose={() => setIsInvoiceOpen(false)} />
            )}
          </>
        )}

      </div>
    </div>
  );
};
