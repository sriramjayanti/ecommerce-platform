import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus, ORDER_STATUS_STEPS, dataStore } from '@ecommerce/shared';
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

  const fetchOrders = async () => {
    setLoading(true);
    const list = await dataStore.getOrders();
    setOrders(list);
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
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const res = await dataStore.updateOrderStatus(orderId, nextStatus, `Admin marked as ${nextStatus}`);
      if (res.success && res.data) {
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(res.data);
        }
        fetchOrders();
      }
    } catch {}
  };

  const filtered = orders.filter((o) => {
    if (filterStatus !== 'all' && o.orderStatus !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.includes(q);
      if (!matchNum && !matchName && !matchPhone) return false;
    }
    return true;
  });

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const idx = ORDER_STATUS_STEPS.indexOf(current as any);
    if (idx >= 0 && idx < ORDER_STATUS_STEPS.length - 1) {
      return ORDER_STATUS_STEPS[idx + 1] as OrderStatus;
    }
    return null;
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Confirmed':
      case 'Packed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Out for Delivery':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
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
                  const nextStatus = getNextStatus(ord.orderStatus);

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
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {ord.fulfilmentMethod === 'takeaway' ? 'Takeaway' : 'Delivery'}
                        </span>
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
                        {nextStatus && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, nextStatus)}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                          >
                            Mark {nextStatus}
                          </button>
                        )}
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

            {/* Status Progression Controls */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="text-slate-700 font-bold block">Current Fulfillment Status:</span>
              <div className="flex flex-wrap items-center gap-2">
                {EXTENDED_STATUS_STEPS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(selectedOrder.id, s as any)}
                    className={`rounded-xl px-3 py-1.5 font-bold transition text-xs border ${
                      selectedOrder.orderStatus === s
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

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

      {/* GST Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-8 text-xs text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-lg font-black text-emerald-700">TAX INVOICE</h2>
                <span className="text-[11px] text-slate-500">DailyFresh & Wholesale Mart Pvt. Ltd.</span>
              </div>
              <button onClick={() => setInvoiceOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-slate-600">
              <div>
                <span className="font-bold text-slate-900 block">Invoice Details</span>
                <p>Invoice #: INV-{invoiceOrder.orderNumber}</p>
                <p>Order Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}</p>
                <p>Payment: {invoiceOrder.paymentMethod.toUpperCase()} ({invoiceOrder.paymentStatus})</p>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Billed To</span>
                <p className="font-bold">{invoiceOrder.customerName}</p>
                <p>{invoiceOrder.customerPhone}</p>
                {invoiceOrder.shippingAddress && (
                  <p>{invoiceOrder.shippingAddress.line1}, {invoiceOrder.shippingAddress.city}</p>
                )}
              </div>
            </div>

            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Item</th>
                  <th className="p-2.5">Qty</th>
                  <th className="p-2.5">Price</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceOrder.items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-medium">{it.title}</td>
                    <td className="p-2.5">{it.quantity}</td>
                    <td className="p-2.5">₹{it.unitPrice}</td>
                    <td className="p-2.5 text-right font-bold">₹{it.lineTotal}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right space-y-1 font-medium text-slate-600">
              <p>Subtotal: <span className="font-bold text-slate-900">₹{invoiceOrder.subtotal}</span></p>
              <p>Delivery: <span className="font-bold text-slate-900">₹{invoiceOrder.deliveryCharge}</span></p>
              <p className="text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                Total Amount: <span className="text-emerald-700">₹{invoiceOrder.finalTotal}</span>
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white shadow-xs hover:bg-emerald-700 transition"
              >
                Print / Save PDF
              </button>
              <button
                onClick={() => setInvoiceOrder(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
