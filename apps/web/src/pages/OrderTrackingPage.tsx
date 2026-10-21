import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Order, ORDER_STATUS_STEPS, OrderStatus } from '@ecommerce/shared';
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  Phone,
  Printer,
  ChevronRight,
  ShieldCheck,
  Zap,
  ShoppingBag,
  ExternalLink,
  HelpCircle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { safeApiFetch } from '@ecommerce/shared';
import { BackButton } from '../components/BackButton';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    safeApiFetch<Order>(`/api/orders/${orderId}`)
      .then((d) => {
        if (d.success && d.data) {
          setOrder(d.data);
          setWhatsappUrl((d as any).whatsappSupportUrl || '');
        }
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 animate-pulse space-y-4">
        <div className="h-24 bg-slate-200 rounded-2xl w-full" />
        <div className="h-64 bg-slate-200 rounded-2xl w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <div className="mb-4 flex justify-center">
          <BackButton label="Back to Shopping" fallbackPath="/" />
        </div>
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-slate-400">
          <Package className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Order #{orderId} Not Found</h2>
        <p className="mt-2 text-sm text-slate-500">We couldn't locate this order in our system.</p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition"
        >
          <span>Back to Marketplace</span>
        </Link>
      </div>
    );
  }

  const currentStepIndex = ORDER_STATUS_STEPS.indexOf(order.orderStatus as any);

  return (
    <div className="min-h-screen bg-[#eaeded]/50 py-8">
      <div className="mx-auto max-w-6xl px-4 space-y-6">
        
        {/* Navigation & Back Button */}
        <div className="flex items-center justify-between">
          <BackButton label="Back to Orders" fallbackPath="/account" />
          <span className="text-xs text-slate-500 font-medium">Tracking Status ID: #{order.orderNumber}</span>
        </div>

        {/* Top Success Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase">
                  Order {order.orderStatus}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600">
                  {order.fulfillmentMethod === 'takeaway' ? 'Store Pickup (Ready in 30 mins)' : 'Doorstep Delivery by Tomorrow'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Order #{order.orderNumber}
              </h1>
              <p className="text-xs text-slate-500">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Download Invoice</span>
            </button>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 transition"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>WhatsApp Live Support</span>
              </a>
            )}
          </div>
        </div>

        {/* Amazon/Flipkart Shipment Progression Timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xs">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Shipment Progression Timeline</h2>
              <p className="text-xs text-slate-500">Real-time status updates from warehouse to doorstep</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
              <Truck className="h-4 w-4" />
              <span>Express Delivery Partner: Assured Express</span>
            </div>
          </div>

          {/* Stepper Grid */}
          <div className="relative">
            {/* Horizontal connecting line on desktop */}
            <div className="hidden sm:block absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0">
              <div
                className="h-full bg-emerald-500 transition-all duration-700"
                style={{
                  width: `${(Math.max(0, currentStepIndex) / (ORDER_STATUS_STEPS.length - 1)) * 100}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative z-10">
              {ORDER_STATUS_STEPS.map((step, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div key={step} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-black transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-md'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-slate-400 border-2 border-slate-200'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                    </div>

                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-emerald-800 font-extrabold'
                            : isPassed
                            ? 'text-slate-900'
                            : 'text-slate-400'
                        }`}
                      >
                        {step}
                      </h4>
                      {isCurrent && (
                        <span className="inline-block text-[10px] font-bold text-emerald-600 animate-pulse">
                          ● Current Stage
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2-Column Split: Items Snapshot + Shipping/Payment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Ordered Items (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Items in This Package ({order.items.length})
              </h3>

              <div className="divide-y divide-slate-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4 py-4 text-xs">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200'}
                      alt=""
                      className="h-20 w-20 rounded-xl object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                        <p className="text-slate-500 font-medium mt-0.5">
                          {item.variantName} • SKU: {item.sku}
                        </p>
                        {item.appliedTierLabel && (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 mt-1.5">
                            <Zap className="h-3 w-3 fill-amber-600 text-amber-600" />
                            {item.appliedTierLabel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                        <span className="text-slate-600">
                          Qty: <span className="font-bold text-slate-900">{item.quantity}</span> × ₹{item.unitPrice}
                        </span>
                        <span className="text-base font-black text-slate-900">₹{item.lineTotal}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Need Help Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Need help with this order?</h4>
                  <p className="text-[11px] text-slate-500">Track shipment, request cancellation, or chat with support.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs"
                >
                  Return Items
                </Link>
                <Link
                  to="/"
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs"
                >
                  Shop More
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Address & Payment Breakdown (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Delivery Address Card */}
            {(() => {
              const addr = order.shippingAddress || {
                fullName: order.customerName,
                line1: order.deliveryAddress?.addressLine || (order.fulfillmentMethod === 'takeaway' ? 'DailyMart Store Pickup Counter' : 'Home Address'),
                line2: '',
                landmark: '',
                city: order.deliveryAddress?.city || 'Bengaluru',
                state: 'Karnataka',
                pincode: order.deliveryAddress?.pincode || '560034',
                phone: order.customerPhone,
              };
              return (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>{order.fulfillmentMethod === 'takeaway' ? 'Store Pickup Counter' : 'Delivery Address'}</span>
                  </h3>
                  <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                    <p className="font-bold text-slate-900 text-sm">{addr.fullName}</p>
                    <p>{addr.line1}</p>
                    {addr.line2 && <p>{addr.line2}</p>}
                    {addr.landmark && <p>Near {addr.landmark}</p>}
                    <p>{addr.city}, {addr.state} - <span className="font-bold text-slate-800">{addr.pincode}</span></p>
                    <p className="pt-2 font-medium text-slate-700">Phone: <span className="font-bold text-slate-900">{addr.phone}</span></p>
                  </div>
                </div>
              );
            })()}

            {/* Payment & Price Summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Payment & Bill Details
              </h3>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Method:</span>
                  <span className="font-bold uppercase text-slate-900">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span
                    className={`font-black uppercase ${
                      order.paymentStatus === 'successful'
                        ? 'text-emerald-700'
                        : order.paymentStatus === 'pending'
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span>Items Subtotal</span>
                  <span className="font-bold text-slate-900">₹{order.subtotal}</span>
                </div>
                {(order.totalSavings ?? 0) > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Wholesale & Offer Savings</span>
                    <span>- ₹{order.totalSavings}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Charges</span>
                  <span>{order.deliveryCharge === 0 ? <span className="font-bold text-emerald-700">FREE</span> : `₹${order.deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Taxes & GST (Included in MRP)</span>
                  <span>₹{order.taxAmount ?? Math.round((order.subtotal * 0.05))}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-blue-700">₹{order.finalTotal}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  to="/"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>Explore More Deals</span>
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
