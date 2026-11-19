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
  ChevronDown,
  ChevronUp,
  Printer,
  X,
  Search,
  FileText,
  CreditCard,
  Ban,
  ArrowLeft,
  Package,
  Store,
  Check,
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

  // Expand/collapse items for specific orders in table
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean>(false);

  // Packed checklist state in Order Details modal
  const [packedItems, setPackedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (selectedOrder) {
      const isAlreadyPacked = ['Packed', 'Dispatched', 'Out for Delivery', 'Delivered'].includes(selectedOrder.orderStatus);
      const initial: Record<string, boolean> = {};
      selectedOrder.items?.forEach((_, idx) => {
        initial[`${selectedOrder.id}-${idx}`] = isAlreadyPacked;
      });
      setPackedItems(initial);
    }
  }, [selectedOrder]);

  const toggleItemPacked = (itemKey: string) => {
    setPackedItems((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  const markAllItemsPacked = (packed: boolean) => {
    if (!selectedOrder) return;
    const updated: Record<string, boolean> = {};
    selectedOrder.items?.forEach((_, idx) => {
      updated[`${selectedOrder.id}-${idx}`] = packed;
    });
    setPackedItems(updated);
  };

  const toggleAllExpanded = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    const updated: Record<string, boolean> = {};
    orders.forEach((o) => {
      updated[o.id] = next;
    });
    setExpandedOrders(updated);
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrders((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

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

          <button
            type="button"
            onClick={toggleAllExpanded}
            className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition inline-flex items-center gap-1.5 shadow-2xs"
            title="Expand or collapse items list for all orders"
          >
            <Package className="h-3.5 w-3.5 text-emerald-600" />
            <span>{allExpanded ? 'Collapse All Items' : 'Expand All Items'}</span>
          </button>
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
                <th className="pb-3 min-w-[280px]">Ordered Products (To Pack)</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">Loading orders...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
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

                      {/* Ordered Products (To Pack) */}
                      <td className="py-3.5 min-w-[280px] max-w-[340px]">
                        {ord.items && ord.items.length > 0 ? (
                          <div className="space-y-1.5">
                            {/* Packing Summary Badge */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                                <Package className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                                <span>
                                  {ord.items.length} {ord.items.length === 1 ? 'item' : 'items'} •{' '}
                                  {ord.items.reduce((sum, it) => sum + (it.quantity || 1), 0)} units to pack
                                </span>
                              </span>
                              {ord.items.some((i) => i.appliedTierLabel && i.appliedTierLabel.includes('Wholesale')) && (
                                <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-black text-purple-700 border border-purple-200">
                                  Wholesale
                                </span>
                              )}
                            </div>

                            {/* Items List (Show first 2 or all if expanded) */}
                            <div className="space-y-1">
                              {(expandedOrders[ord.id] ? ord.items : ord.items.slice(0, 2)).map((it, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-slate-100/70 transition"
                                >
                                  {it.image ? (
                                    <img
                                      src={it.image}
                                      alt={it.title}
                                      className="h-8 w-8 rounded-lg object-cover bg-white border border-slate-200 flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                                      <Package className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-1.5 py-0.2 text-[10px] font-black text-white shadow-2xs flex-shrink-0">
                                        {it.quantity}x
                                      </span>
                                      <span className="font-extrabold text-slate-900 text-xs truncate" title={it.title}>
                                        {it.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium truncate">
                                      <span>{it.variantName || 'Standard'}</span>
                                      {it.sku && <span>• SKU: {it.sku}</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Expand / Collapse Button if > 2 items */}
                            {ord.items.length > 2 && (
                              <button
                                type="button"
                                onClick={() => toggleOrderExpand(ord.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline pt-0.5 cursor-pointer"
                              >
                                {expandedOrders[ord.id] ? (
                                  <>
                                    <ChevronUp className="h-3 w-3" />
                                    <span>Show less items</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3" />
                                    <span>+{ord.items.length - 2} more items to pack (view all)</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No items recorded</span>
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

            {/* Warehouse Packing & Item Verification Checklist */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-emerald-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-emerald-300" />
                  <div>
                    <h4 className="font-black text-sm">Packing & Fulfillment Checklist</h4>
                    <p className="text-[11px] text-emerald-200">
                      Verify and pack each ordered item into the parcel before dispatch.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-800 border border-emerald-700 px-2.5 py-1 rounded-xl text-xs font-black">
                    {selectedOrder.items?.reduce((sum, it) => sum + (it.quantity || 1), 0)} Units Total
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const allChecked = selectedOrder.items.every((_, idx) => packedItems[`${selectedOrder.id}-${idx}`]);
                      markAllItemsPacked(!allChecked);
                    }}
                    className="rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1 text-xs font-bold transition text-white cursor-pointer"
                  >
                    {selectedOrder.items.every((_, idx) => packedItems[`${selectedOrder.id}-${idx}`])
                      ? 'Uncheck All'
                      : '✓ Check All as Packed'}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {(() => {
                const total = selectedOrder.items?.length || 0;
                const packedCount = selectedOrder.items?.filter((_, idx) => packedItems[`${selectedOrder.id}-${idx}`]).length || 0;
                const isAllPacked = total > 0 && packedCount === total;
                const percent = total > 0 ? Math.round((packedCount / total) * 100) : 0;

                return (
                  <div>
                    <div className="bg-emerald-50 px-4 py-2 border-b border-emerald-100 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-900">
                        Packing Progress: {packedCount} of {total} items ready ({percent}%)
                      </span>
                      {isAllPacked && (
                        <span className="font-black text-emerald-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-emerald-300 text-[11px]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Ready for Shipment
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-slate-100 h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })()}

              <div className="divide-y divide-slate-100 bg-white">
                {selectedOrder.items.map((item, idx) => {
                  const itemKey = `${selectedOrder.id}-${idx}`;
                  const isPacked = !!packedItems[itemKey];

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleItemPacked(itemKey)}
                      className={`p-3.5 flex items-center justify-between transition cursor-pointer select-none ${
                        isPacked ? 'bg-emerald-50/40 hover:bg-emerald-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Interactive Checkbox */}
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition ${
                            isPacked
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 bg-white text-transparent hover:border-emerald-500'
                          }`}
                        >
                          <Check className="h-4 w-4 stroke-[3]" />
                        </div>

                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="h-11 w-11 rounded-xl object-cover bg-slate-50 border border-slate-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                            <Package className="h-5 w-5" />
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-black text-xs px-2 py-0.5 rounded-md ${
                                isPacked
                                  ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                                  : 'bg-amber-100 text-amber-950 border border-amber-300'
                              }`}
                            >
                              QTY: {item.quantity}
                            </span>
                            <span
                              className={`font-extrabold text-sm ${
                                isPacked ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-2">
                            <span className="font-semibold text-slate-700">{item.variantName}</span>
                            {item.sku && (
                              <span>
                                • SKU: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">{item.sku}</code>
                              </span>
                            )}
                            <span>• ₹{item.unitPrice} each</span>
                          </div>
                          {item.appliedTierLabel && (
                            <span className="inline-block mt-1 text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded font-bold">
                              Applied: {item.appliedTierLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-slate-900 text-sm block">₹{item.lineTotal}</span>
                        <span
                          className={`text-[10px] font-bold inline-block mt-0.5 ${
                            isPacked ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {isPacked ? 'Packed ✓' : 'Click to check'}
                        </span>
                      </div>
                    </div>
                  );
                })}
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

            {/* Takeaway Items to Hand Over to Customer */}
            <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-950 text-xs flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-amber-700" />
                  <span>Products to Pack & Hand Over:</span>
                </span>
                <span className="text-[10px] font-black text-amber-900 bg-amber-200/90 px-2 py-0.5 rounded border border-amber-300">
                  {(verifyingOrder.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0)} Units Total
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {(verifyingOrder.items || []).map((it, i) => (
                  <div key={i} className="flex items-center justify-between bg-white/95 p-2 rounded-xl border border-amber-200 text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      {it.image ? (
                        <img src={it.image} alt="" className="h-8 w-8 rounded-lg object-cover border border-slate-200 flex-shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 flex-shrink-0">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <span className="font-extrabold text-slate-900 block">{it.title}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{it.variantName}</span>
                      </div>
                    </div>
                    <span className="font-black text-xs text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                      {it.quantity}x
                    </span>
                  </div>
                ))}
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
