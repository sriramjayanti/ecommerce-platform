import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, ORDER_STATUS_STEPS, dataStore } from '@ecommerce/shared';
import { PrintableTaxInvoice } from '../components/PrintableTaxInvoice';
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Phone,
  Truck,
  MapPin,
  Zap,
  Filter,
  ChevronRight,
  Printer,
  X,
  Search,
  FileText,
  CreditCard,
  Ban,
  ArrowLeft,
  Package,
  Store,
} from 'lucide-react';

const EXTENDED_STATUS_STEPS: OrderStatus[] = [
  'Placed',
  'Confirmed',
  'Processing',
  'Packed',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
];

export const OrdersAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNoteInput, setAdminNoteInput] = useState<string>('');

  // 4-Digit Takeaway PIN verification states
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const list = await dataStore.getOrders();
    setOrders(list);
    setLoading(false);
  };

  const handleOpenPinModal = (order: Order) => {
    setVerifyingOrder(order);
    setEnteredPin('');
    setPinError(null);
    setPinSuccess(null);
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingOrder) return;
    setPinError(null);
    setPinSuccess(null);

    const res = await dataStore.verifyPickupCode(verifyingOrder.id, enteredPin, 'Store Admin');
    if (!res.success) {
      setPinError(res.error || 'Invalid 4-digit code.');
      return;
    }

    setPinSuccess('Code verified successfully! Order marked as Delivered & Approved.');
    if (selectedOrder?.id === verifyingOrder.id && res.data) {
      setSelectedOrder(res.data);
    }
    fetchOrders();
    setTimeout(() => {
      setVerifyingOrder(null);
      setPinSuccess(null);
    }, 1800);
  };

  useEffect(() => {
    fetchOrders();

    const unsub = dataStore.subscribe((event) => {
      if (event.type === 'orders_updated' || event.type === 'order_placed') {
        fetchOrders();
      }
    });

    return () => unsub();
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus, customNote?: string) => {
    try {
      const note = customNote || adminNoteInput || `Status updated to ${nextStatus} by Store Admin`;
      const res = await dataStore.updateOrderStatus(orderId, nextStatus, note, 'Store Admin');
      if (res.success && res.data) {
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(res.data);
        }
        setAdminNoteInput('');
        fetchOrders();
      }
    } catch {}
  };

  const filtered = orders.filter((o) => {
    if (filterStatus === 'takeaway') {
      if (o.fulfilmentMethod !== 'takeaway') return false;
    } else if (filterStatus !== 'all' && o.orderStatus !== filterStatus) {
      return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.includes(q);
      const matchPin = o.pickupCode ? o.pickupCode.includes(q) : false;
      if (!matchNum && !matchName && !matchPhone && !matchPin) return false;
    }
    return true;
  });

  const getNextSimpleAction = (current: OrderStatus): { nextStatus: OrderStatus; label: string } | null => {
    const s = (current || '').toLowerCase();
    if (s.includes('cancel') || s.includes('deliver')) return null;
    if (s.includes('dispatch') || s.includes('pack') || s.includes('out for delivery')) {
      return { nextStatus: 'Delivered', label: 'Mark Delivered' };
    }
    return { nextStatus: 'Dispatched', label: 'Mark Dispatched' };
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Dispatched':
      case 'Out for Delivery':
      case 'Packed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Confirmed':
      case 'Placed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 border border-slate-200 transition"
        >
          <ArrowLeft className="h-4 w-4 text-emerald-600" />
          <span>← Back to Dashboard</span>
        </button>
        <span className="text-xs text-slate-500 font-semibold">{orders.length} Total Orders</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders & Fulfillment Pipeline</h1>
          <p className="text-xs text-slate-500">
            Control order progression across {orders.length} customer orders, review fulfillment details, and print GST invoices.
          </p>
        </div>

        {/* Filter and Search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search order #, customer, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white py-2 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 w-56 sm:w-64"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses ({orders.length})</option>
            <option value="takeaway">🏬 Takeaway Pickups ({orders.filter((o) => o.fulfilmentMethod === 'takeaway').length})</option>
            {EXTENDED_STATUS_STEPS.map((s) => (
              <option key={s} value={s}>
                {s} ({orders.filter((o) => o.orderStatus === s).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold">
                <th className="pb-3">Order Number</th>
                <th className="pb-3">Date & Time</th>
                <th className="pb-3">Customer</th>
                <th className="pb-3">Fulfilment</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Loading orders...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No orders matching selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => {
                  const nextAction = getNextSimpleAction(ord.orderStatus);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 font-bold text-slate-900 font-mono">#{ord.orderNumber}</td>
                      <td className="py-3.5 text-slate-500">
                        {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                        <span className="text-[11px] text-slate-500">{ord.customerPhone}</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold ${
                          ord.fulfilmentMethod === 'takeaway'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          <Store className="h-3 w-3" />
                          {ord.fulfilmentMethod === 'takeaway' ? 'Takeaway' : 'Delivery'}
                        </span>
                        {ord.fulfilmentMethod === 'takeaway' && ord.pickupCode && (
                          <div className="mt-1">
                            <span className="font-mono font-black text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300 text-[11px] inline-flex items-center gap-1">
                              PIN: {ord.pickupCode}
                            </span>
                            {ord.pickupVerifiedAt ? (
                              <span className="block text-[9px] font-extrabold text-emerald-700 mt-0.5">
                                ✓ Verified at store
                              </span>
                            ) : (
                              <span className="block text-[9px] font-medium text-amber-700 mt-0.5">
                                Pending pickup
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className="font-black text-slate-900 text-sm">₹{ord.finalTotal}</span>
                        {ord.totalSavings > 0 && (
                          <span className="block text-[10px] font-bold text-emerald-600">
                            Saved ₹{ord.totalSavings}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase border ${
                            ord.paymentStatus === 'successful'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {(ord.paymentMethod || 'COD').toUpperCase()} • {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`rounded px-2.5 py-0.5 text-[10px] font-black uppercase border ${getStatusBadge(
                            ord.orderStatus
                          )}`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {ord.fulfilmentMethod === 'takeaway' && ord.orderStatus !== 'Delivered' && ord.orderStatus !== 'Cancelled' ? (
                          <button
                            onClick={() => handleOpenPinModal(ord)}
                            className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-[11px] font-black text-slate-950 shadow-xs active:scale-95 transition inline-flex items-center gap-1"
                            title="Cross check customer 4-digit code and approve"
                          >
                            <span>🔑</span>
                            <span>Verify PIN</span>
                          </button>
                        ) : nextAction ? (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, nextAction.nextStatus)}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                          >
                            {nextAction.label}
                          </button>
                        ) : ord.orderStatus === 'Delivered' ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                            Delivered ✓
                          </span>
                        ) : null}
                        <button
                          onClick={() => setInvoiceOrder(ord)}
                          className="rounded-xl bg-slate-100 border border-slate-200 p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
                          title="Print GST Invoice"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-8 text-xs max-h-[90vh] overflow-y-auto text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Order Details: #{selectedOrder.orderNumber}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()} • ID: {selectedOrder.id}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status Progression Controls - Simple Customer Tracking Pipeline */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-900 font-extrabold text-xs block">
                    Customer Tracking Pipeline (Updated by Admin Only):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Click a stage below to instantly update the customer's live tracking status.
                  </span>
                </div>
                <span className="text-xs font-black uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Current: {selectedOrder.orderStatus}
                </span>
              </div>

              {/* 3 Simple Stages */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'Confirmed')}
                  className={`rounded-xl p-2.5 font-bold transition text-xs border text-left flex flex-col justify-between ${
                    selectedOrder.orderStatus === 'Confirmed'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-500'
                  }`}
                >
                  <span className="font-extrabold">1. Order Confirmed</span>
                  <span className={`text-[10px] ${selectedOrder.orderStatus === 'Confirmed' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    Verified by Admin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'Dispatched')}
                  className={`rounded-xl p-2.5 font-bold transition text-xs border text-left flex flex-col justify-between ${
                    selectedOrder.orderStatus === 'Dispatched'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-500'
                  }`}
                >
                  <span className="font-extrabold">2. Dispatched</span>
                  <span className={`text-[10px] ${selectedOrder.orderStatus === 'Dispatched' ? 'text-blue-100' : 'text-slate-400'}`}>
                    Packed & Out for Delivery
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'Delivered')}
                  className={`rounded-xl p-2.5 font-bold transition text-xs border text-left flex flex-col justify-between ${
                    selectedOrder.orderStatus === 'Delivered'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-600'
                  }`}
                >
                  <span className="font-extrabold">3. Delivered</span>
                  <span className={`text-[10px] ${selectedOrder.orderStatus === 'Delivered' ? 'text-emerald-100' : 'text-slate-400'}`}>
                    Completed Delivery
                  </span>
                </button>
              </div>

              {/* Optional Admin Note Input */}
              <div className="pt-2 border-t border-slate-200/60 space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Admin Note for Customer Live Tracking (Optional):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    placeholder="e.g. Dispatched via Rider Manoj (Bike KA-01-AB-1234), OTP: 5821"
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                  {adminNoteInput && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(selectedOrder.id, selectedOrder.orderStatus, adminNoteInput)}
                      className="rounded-xl bg-slate-900 text-white px-3 py-1.5 text-xs font-bold hover:bg-slate-800"
                    >
                      Save Note
                    </button>
                  )}
                </div>
              </div>

              {/* Other Actions: Cancel */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-[11px] text-slate-400">Additional Actions:</span>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'Cancelled')}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-700 hover:bg-rose-100 transition"
                >
                  Cancel Order
                </button>
              </div>
            </div>

            {/* Takeaway 4-Digit PIN Card */}
            {selectedOrder.fulfilmentMethod === 'takeaway' && selectedOrder.pickupCode && (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-900 text-xs flex items-center gap-1.5">
                    <Store className="h-4 w-4 text-amber-600" />
                    <span>In-Store Takeaway Confirmation Code</span>
                  </span>
                  <span className="font-mono text-base font-black text-slate-950 bg-amber-400 px-3 py-1 rounded-xl shadow-xs">
                    PIN: {selectedOrder.pickupCode}
                  </span>
                </div>
                {selectedOrder.pickupVerifiedAt ? (
                  <div className="rounded-xl bg-emerald-100 p-2.5 text-xs text-emerald-900 font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Verified by {selectedOrder.pickupVerifiedBy || 'Store Admin'} on {new Date(selectedOrder.pickupVerifiedAt).toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <span className="text-xs text-amber-900 font-medium">Customer must provide this 4-digit code at the store counter.</span>
                    <button
                      type="button"
                      onClick={() => handleOpenPinModal(selectedOrder)}
                      className="rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-black text-slate-950 shadow-xs active:scale-95 transition"
                    >
                      🔑 Verify Customer PIN Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Customer & Delivery Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <span className="font-bold text-slate-900 block mb-1">Customer Contact</span>
                <p className="font-bold text-slate-900">{selectedOrder.customerName}</p>
                <p className="text-slate-500">{selectedOrder.customerPhone}</p>
                <p className="text-slate-500">{selectedOrder.customerEmail || 'No email provided'}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                <span className="font-bold text-slate-900 block mb-1">
                  Fulfilment Method: <span className="text-emerald-700 font-black">{selectedOrder.fulfilmentMethod === 'takeaway' ? 'Takeaway (Self-Pickup)' : 'Home Delivery'}</span>
                </span>
                {selectedOrder.shippingAddress && (
                  <p className="text-slate-600 leading-relaxed">
                    {selectedOrder.shippingAddress.line1}, {selectedOrder.shippingAddress.city},{' '}
                    {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                  </p>
                )}
              </div>
            </div>

            {/* Items Snapshot */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 border-b border-slate-200">
                Ordered Items ({selectedOrder.items.length})
              </div>
              <div className="divide-y divide-slate-100">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt="" className="h-10 w-10 rounded-lg object-cover bg-slate-50 border border-slate-200" />
                      )}
                      <div>
                        <span className="font-bold text-slate-900 block">{item.title}</span>
                        <span className="text-slate-500 text-[11px]">
                          {item.variantName} • Qty: {item.quantity} × ₹{item.unitPrice}
                        </span>
                        {item.appliedTierLabel && (
                          <span className="block text-[10px] text-emerald-700 font-bold">
                            Applied: {item.appliedTierLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-slate-900">₹{item.lineTotal}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-bold text-slate-900">₹{selectedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charge</span>
                <span className="font-bold text-slate-900">
                  {selectedOrder.deliveryCharge === 0 ? 'FREE' : `₹${selectedOrder.deliveryCharge}`}
                </span>
              </div>
              {selectedOrder.totalSavings > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Total Wholesale Savings</span>
                  <span>-₹{selectedOrder.totalSavings}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                <span>Final Order Total</span>
                <span className="text-emerald-700 text-base">₹{selectedOrder.finalTotal}</span>
              </div>
            </div>

            {/* Status History */}
            <div className="space-y-2">
              <span className="font-bold text-slate-900 block">Status Timeline</span>
              <div className="space-y-2 border-l-2 border-emerald-500 pl-3">
                {selectedOrder.statusHistory?.map((h, i) => (
                  <div key={i} className="text-[11px]">
                    <span className="font-bold text-slate-900">{h.status}</span>
                    <span className="text-slate-400 ml-2">{new Date(h.timestamp).toLocaleString()}</span>
                    {h.note && <p className="text-slate-500">{h.note}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GST Tax Invoice Modal */}
      {invoiceOrder && (
        <PrintableTaxInvoice order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />
      )}

      {/* Takeaway 4-Digit Code Cross-Check & Verification Modal */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-slate-950 font-black shadow-xs">
                  <Store className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Verify Takeaway Pickup PIN
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono font-bold">
                    #{verifyingOrder.orderNumber}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifyingOrder(null)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Customer Summary */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-bold text-slate-900">{verifyingOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-bold text-slate-900">{verifyingOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Amount:</span>
                <span className="font-black text-emerald-700">₹{verifyingOrder.finalTotal}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                <span className="text-amber-800 font-bold">Registered 4-Digit PIN:</span>
                <span className="font-mono font-black text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded text-sm">
                  {verifyingOrder.pickupCode}
                </span>
              </div>
            </div>

            {pinError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                {pinError}
              </div>
            )}

            {pinSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>{pinSuccess}</span>
              </div>
            )}

            {/* Verification Form */}
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter 4-Digit Code provided by Customer:
                </label>
                <input
                  type="text"
                  maxLength={4}
                  autoFocus
                  required
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 7429"
                  className="w-full text-center tracking-widest font-mono text-2xl font-black rounded-2xl border-2 border-slate-300 bg-slate-50 py-3 text-slate-900 outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>

              {/* Quick Fill Button */}
              {verifyingOrder.pickupCode && (
                <button
                  type="button"
                  onClick={() => setEnteredPin(verifyingOrder.pickupCode || '')}
                  className="w-full text-center text-[11px] font-bold text-amber-800 hover:text-amber-950 underline"
                >
                  Quick Match: Use Registered Code ({verifyingOrder.pickupCode})
                </button>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyingOrder(null)}
                  className="w-1/3 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enteredPin.length !== 4}
                  className="w-2/3 rounded-xl bg-amber-400 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 py-2.5 text-xs font-black text-slate-950 shadow-sm active:scale-98 transition flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Verify Code & Approve Handover</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
