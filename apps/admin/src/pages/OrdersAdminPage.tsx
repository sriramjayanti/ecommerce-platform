import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, ALL_ORDER_STATUSES, ORDER_STATUS_STEPS, safeApiFetch } from '@ecommerce/shared';
import { BackButton } from '../components/BackButton';
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
} from 'lucide-react';

export const OrdersAdminPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    safeApiFetch<Order[]>('/api/orders')
      .then((d) => {
        if (d.success && d.data) setOrders(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const res = await safeApiFetch<Order>(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, note: `Admin advanced status to ${nextStatus}` }),
      });
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

  const getOrderAddress = (ord: Order) => {
    if (ord.shippingAddress) {
      return {
        fullName: ord.shippingAddress.fullName || ord.customerName,
        line1: ord.shippingAddress.line1,
        line2: ord.shippingAddress.line2 || '',
        city: ord.shippingAddress.city,
        state: ord.shippingAddress.state,
        pincode: ord.shippingAddress.pincode,
        phone: ord.shippingAddress.phone || ord.customerPhone,
      };
    }
    const da = ord.deliveryAddress;
    return {
      fullName: ord.customerName,
      line1: da?.addressLine || (ord.fulfillmentMethod === 'takeaway' ? 'DailyMart Store Pickup Counter' : 'Home Address'),
      line2: '',
      city: da?.city || 'Bengaluru',
      state: 'Karnataka',
      pincode: da?.pincode || '560034',
      phone: ord.customerPhone,
    };
  };

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    const idx = ORDER_STATUS_STEPS.indexOf(current as any);
    if (idx >= 0 && idx < ORDER_STATUS_STEPS.length - 1) {
      return ORDER_STATUS_STEPS[idx + 1] as OrderStatus;
    }
    return null;
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <div>
        <BackButton fallback="/" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders & Fulfillment Pipeline</h1>
          <p className="text-xs text-slate-500">
            Control order progression across {orders.length} orders, generate GST tax invoices, and trigger WhatsApp notifications.
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
            {ALL_ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s} ({orders.filter((o) => o.orderStatus === s).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Grid/Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold">
                <th className="pb-3">Order # & ID</th>
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
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading orders...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No orders matching selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((ord) => {
                  const nextStatus = getNextStatus(ord.orderStatus);

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5">
                        <span className="font-bold text-slate-900 font-mono block">#{ord.orderNumber}</span>
                        <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[110px]" title={ord.id}>
                          {ord.id}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">
                        {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5">
                        <span className="font-bold text-slate-900 block">{ord.customerName}</span>
                        <span className="text-[11px] text-slate-500">{ord.customerPhone}</span>
                      </td>
                      <td className="py-3.5">
                        <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {ord.fulfillmentMethod === 'takeaway' ? '🏪 Takeaway' : '🚚 Home Delivery'}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span className="font-black text-slate-900 text-sm">₹{ord.finalTotal}</span>
                        {ord.totalSavings > 0 && (
                          <span className="block text-[10px] font-bold text-emerald-700">
                            Saved ₹{ord.totalSavings}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase border ${
                            ord.paymentStatus === 'successful'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : ord.paymentStatus === 'failed'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : 'bg-amber-100 text-amber-800 border-amber-300'
                          }`}
                        >
                          {ord.paymentMethod.toUpperCase()} • {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-black uppercase border ${
                            ord.orderStatus === 'Delivered'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : ord.orderStatus === 'Cancelled'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : ord.orderStatus === 'Out for Delivery'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        {nextStatus && ord.orderStatus !== 'Cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(ord.id, nextStatus)}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                          >
                            Mark {nextStatus}
                          </button>
                        )}
                        <button
                          onClick={() => setInvoiceOrder(ord)}
                          className="rounded-xl bg-slate-100 border border-slate-200 p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                          title="Print GST Invoice"
                        >
                          <Printer className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedOrder(ord)}
                          className="rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-200"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-8 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Order Details: #{selectedOrder.orderNumber}
                </h3>
                <span className="text-[11px] text-slate-500">
                  ID: <span className="font-mono text-slate-700">{selectedOrder.id}</span> • Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Status Progression Controls */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="text-slate-700 font-bold block">Update Fulfillment Status:</span>
              <div className="flex flex-wrap items-center gap-2">
                {ALL_ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdateStatus(selectedOrder.id, s as any)}
                    className={`rounded-xl px-3 py-1.5 font-bold transition text-xs border ${
                      selectedOrder.orderStatus === s
                        ? s === 'Cancelled'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : s === 'Cancelled'
                        ? 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {selectedOrder.orderStatus === 'Cancelled' && (
                <p className="text-[11px] text-rose-700 font-bold pt-1">
                  ✓ Order cancelled and product inventory has been safely restored to stock.
                </p>
              )}
            </div>

            {/* Items Snapshot */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-xs">Immutable Item Snapshots ({selectedOrder.items.length})</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={it.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover bg-white border border-slate-200 flex-shrink-0"
                      />
                      <div>
                        <span className="font-bold text-slate-900">{it.title}</span>
                        <span className="block text-[11px] text-slate-500">
                          {it.variantName} (SKU: {it.sku}) • Qty: {it.quantity}
                        </span>
                        {it.appliedTierLabel && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                            <Zap className="h-3 w-3 fill-amber-500 text-amber-600" />
                            {it.appliedTierLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm">₹{it.lineTotal}</span>
                      <span className="block text-[11px] text-slate-500">₹{it.unitPrice}/unit</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery address & customer */}
            {(() => {
              const addr = getOrderAddress(selectedOrder);
              return (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1">
                  <h4 className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Customer & Fulfillment Details</span>
                    </span>
                    <span className="rounded-md bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {selectedOrder.fulfillmentMethod === 'takeaway' ? 'Store Pickup / Takeaway' : 'Home Delivery'}
                    </span>
                  </h4>
                  <p className="text-slate-800 font-medium">
                    {addr.fullName} • Phone: {selectedOrder.customerPhone}
                  </p>
                  <p className="text-slate-600">
                    {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="text-[11px] text-slate-600 pt-1">
                    Payment: <span className="font-bold uppercase">{selectedOrder.paymentMethod}</span> ({selectedOrder.paymentStatus})
                    {selectedOrder.paymentId && ` • Ref: ${selectedOrder.paymentId}`}
                  </p>
                </div>
              );
            })()}

            {/* Bill Summary */}
            <div className="border-t border-slate-200 pt-3 space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900">₹{selectedOrder.subtotal}</span>
              </div>
              {selectedOrder.totalSavings > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Wholesale & Tier Savings:</span>
                  <span>- ₹{selectedOrder.totalSavings}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge:</span>
                <span>{selectedOrder.deliveryCharge === 0 ? 'FREE' : `₹${selectedOrder.deliveryCharge}`}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-200">
                <span>Final Order Amount:</span>
                <span className="text-emerald-700 text-base">₹{selectedOrder.finalTotal}</span>
              </div>
            </div>

            {/* Actions: WhatsApp & Invoice */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => setInvoiceOrder(selectedOrder)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200"
              >
                <Printer className="h-4 w-4 text-slate-600" />
                <span>Print GST Tax Invoice</span>
              </button>

              <a
                href={`https://wa.me/${selectedOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Hello ${selectedOrder.customerName}, your order #${selectedOrder.orderNumber} is now ${selectedOrder.orderStatus}. Total: ₹${selectedOrder.finalTotal}. Thank you for shopping with DailyFresh Mart!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-500 shadow-md"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>WhatsApp Customer</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Printable GST Tax Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-2xl space-y-6 my-8 print:p-0 print:border-none print:shadow-none">
            {/* Invoice Top Actions */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <span className="text-sm font-black text-slate-900">Tax Invoice Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setInvoiceOrder(null)}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Document */}
            <div className="space-y-6 text-xs text-slate-800">
              <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                <div>
                  <h2 className="text-xl font-black text-emerald-800">DailyFresh & Wholesale Mart</h2>
                  <p className="text-slate-500 text-[11px] leading-tight">
                    GSTIN: 29AAAAA0000A1Z5 • FSSAI Lic: 11223344556677<br />
                    Outer Ring Road, Bengaluru, Karnataka - 560034<br />
                    Helpline: +91 98765 43210
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-base text-slate-900">TAX INVOICE</span>
                  <p className="text-slate-600 font-mono">#{invoiceOrder.orderNumber}</p>
                  <p className="text-slate-500 text-[10px]">
                    Date: {new Date(invoiceOrder.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Bill to */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {(() => {
                  const addr = getOrderAddress(invoiceOrder);
                  return (
                    <div>
                      <span className="font-bold text-slate-900 block text-[11px] uppercase">Billed To:</span>
                      <p className="font-black text-slate-900">{invoiceOrder.customerName}</p>
                      <p className="text-slate-600 leading-snug">
                        {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-slate-600 font-medium">Phone: {invoiceOrder.customerPhone}</p>
                    </div>
                  );
                })()}
                <div className="text-right">
                  <span className="font-bold text-slate-900 block text-[11px] uppercase">Payment Info:</span>
                  <p className="font-bold text-slate-800 uppercase">{invoiceOrder.paymentMethod} Payment</p>
                  <p className="text-slate-600 font-mono text-[10px]">Status: {invoiceOrder.paymentStatus}</p>
                  {invoiceOrder.paymentId && <p className="text-slate-600 font-mono text-[10px]">Txn: {invoiceOrder.paymentId}</p>}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-900 font-bold text-[11px]">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {invoiceOrder.items.map((it, idx) => (
                    <tr key={idx} className="text-[11px]">
                      <td className="py-2.5">
                        <span className="font-bold text-slate-900">{it.title}</span>
                        <span className="block text-slate-500 text-[10px]">{it.variantName} (SKU: {it.sku})</span>
                      </td>
                      <td className="py-2.5 text-center font-bold">{it.quantity}</td>
                      <td className="py-2.5 text-right font-mono">₹{it.unitPrice}</td>
                      <td className="py-2.5 text-right font-black font-mono">₹{it.lineTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t-2 border-slate-900 pt-3 space-y-1 text-right">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{invoiceOrder.subtotal}</span>
                </div>
                {invoiceOrder.totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Wholesale & Bulk Savings:</span>
                    <span className="font-mono">- ₹{invoiceOrder.totalSavings}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charge:</span>
                  <span className="font-mono">{invoiceOrder.deliveryCharge === 0 ? 'FREE' : `₹${invoiceOrder.deliveryCharge}`}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-base pt-2 border-t border-slate-200">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-800 font-mono">₹{invoiceOrder.finalTotal}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 text-center text-[10px] text-slate-500">
                <p>Thank you for your business! For queries, contact support@dailyfreshmart.com or WhatsApp helpline.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
