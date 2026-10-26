import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, InventoryLog, dataStore } from '@ecommerce/shared';
import {
  Boxes,
  History,
  AlertTriangle,
  CheckCircle2,
  X,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  Zap,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

export const InventoryAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [activeTab, setActiveTab] = useState<'variants' | 'logs'>('variants');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [bulkRestocking, setBulkRestocking] = useState(false);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  
  // Stock adjustment mode: 'set_exact' or 'add_units'
  const [adjustMode, setAdjustMode] = useState<'set_exact' | 'add_units'>('set_exact');
  const [enteredNumber, setEnteredNumber] = useState<number>(100);
  const [reason, setReason] = useState<any>('manual_adjustment');
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    const [pList, lList] = await Promise.all([
      dataStore.getProducts(),
      dataStore.getInventoryLogs(),
    ]);
    setProducts(pList);
    setLogs(lList);
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();

    const unsub = dataStore.subscribe((event) => {
      if (
        event.type === 'inventory_updated' ||
        event.type === 'products_updated' ||
        event.type === 'order_placed'
      ) {
        fetchInventory();
      }
    });

    return () => unsub();
  }, []);

  const openAdjustmentModal = (prod: Product, varId: string) => {
    setSelectedProduct(prod);
    setSelectedVariantId(varId);
    const variant = prod.variants.find((v) => v.id === varId);
    const currentStock = variant?.stock ?? 0;
    
    setAdjustMode('set_exact');
    setEnteredNumber(currentStock);
    setReason('manual_adjustment');
    setAdjustError(null);
    setAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedVariantId) return;

    const variant = selectedProduct.variants.find((v) => v.id === selectedVariantId);
    if (!variant) return;

    let targetStock = enteredNumber;
    if (adjustMode === 'add_units') {
      targetStock = variant.stock + enteredNumber;
    }

    if (targetStock < 0) {
      setAdjustError('Stock quantity cannot be negative. Minimum allowed value is 0.');
      return;
    }

    try {
      const res = await dataStore.updateStock(
        selectedProduct.id,
        selectedVariantId,
        targetStock,
        reason,
        'Inventory Manager'
      );

      if (!res.success) {
        throw new Error('Failed to update stock');
      }

      setBulkSuccessMsg(`Stock for "${selectedProduct.title}" updated to ${targetStock} units.`);
      setTimeout(() => setBulkSuccessMsg(null), 3000);
      setAdjustModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      setAdjustError(err.message || 'Error updating stock');
    }
  };

  const handleBulkRestock = async () => {
    if (!confirm('Add +100 units to all low stock and out-of-stock items?')) return;
    setBulkRestocking(true);
    try {
      const res = await dataStore.bulkRestock(100);
      setBulkSuccessMsg(`Successfully replenished ${res.count} variants with +100 units!`);
      setTimeout(() => setBulkSuccessMsg(null), 4000);
      fetchInventory();
    } finally {
      setBulkRestocking(false);
    }
  };

  // Flatten variants with parent product info
  const allVariants = products.flatMap((p) =>
    p.variants.map((v) => ({
      ...v,
      productId: p.id,
      productTitle: p.title,
      productBrand: p.brand,
      productImage: p.images[0] || '',
      parentProduct: p,
    }))
  );

  const filteredVariants = allVariants.filter((v) => {
    const q = search.toLowerCase();
    const matchSearch =
      v.productTitle.toLowerCase().includes(q) ||
      v.name.toLowerCase().includes(q) ||
      (v.sku && v.sku.toLowerCase().includes(q));

    if (!matchSearch) return false;

    const threshold = Math.max(v.lowStockThreshold || 0, 15);
    if (stockFilter === 'out') return v.stock <= 0;
    if (stockFilter === 'low') return v.stock > 0 && v.stock <= threshold;
    if (stockFilter === 'healthy') return v.stock > threshold;
    return true;
  });

  const lowStockCount = allVariants.filter((v) => v.stock > 0 && v.stock <= Math.max(v.lowStockThreshold || 0, 15)).length;
  const outOfStockCount = allVariants.filter((v) => v.stock <= 0).length;

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
        <span className="text-xs text-slate-500 font-semibold">{allVariants.length} Active SKUs Tracked</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Inventory & Central Stock Management</h1>
          <p className="text-xs text-slate-500">
            Real-time multi-department inventory control, low-stock threshold triggers, and audited ledger.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBulkRestock}
          disabled={bulkRestocking}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${bulkRestocking ? 'animate-spin' : ''}`} />
          <span>{bulkRestocking ? 'Replenishing...' : '1-Click Restock All (+100 Units)'}</span>
        </button>
      </div>

      {bulkSuccessMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{bulkSuccessMsg}</span>
        </div>
      )}

      {/* Stock Health Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <span className="text-xs text-slate-500 font-bold block">Total Tracked SKUs</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{allVariants.length}</span>
          <span className="text-[11px] text-slate-400">Across {products.length} catalog items</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
          <span className="text-xs text-amber-800 font-bold block flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Low Stock SKUs
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{lowStockCount}</span>
          <span className="text-[11px] text-amber-700">Units below safety threshold</span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs">
          <span className="text-xs text-rose-800 font-bold block flex items-center gap-1.5">
            <X className="h-3.5 w-3.5 text-rose-600" />
            Out of Stock SKUs
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">{outOfStockCount}</span>
          <span className="text-[11px] text-rose-700">Immediate replenishment needed</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
          <span className="text-xs text-emerald-800 font-bold block flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Healthy Stock SKUs
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {allVariants.length - lowStockCount - outOfStockCount}
          </span>
          <span className="text-[11px] text-emerald-700">Ready for high-volume wholesale</span>
        </div>
      </div>

      {/* Main Tabs & Table */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('variants')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeTab === 'variants'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              SKU Stock Ledger ({filteredVariants.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Audit History ({logs.length})</span>
            </button>
          </div>

          {activeTab === 'variants' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search title, variant, SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 w-48 sm:w-60"
                />
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              </div>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="all">All Levels</option>
                <option value="low">Low Stock Only</option>
                <option value="out">Out of Stock Only</option>
                <option value="healthy">Healthy Stock</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Variants Stock Table */}
        {activeTab === 'variants' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-3">Product & Variant</th>
                  <th className="pb-3">SKU</th>
                  <th className="pb-3">Base Price</th>
                  <th className="pb-3">Current Stock</th>
                  <th className="pb-3">Threshold</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">Loading inventory...</td>
                  </tr>
                ) : filteredVariants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">No SKUs matching criteria.</td>
                  </tr>
                ) : (
                  filteredVariants.map((v) => {
                    const isOut = v.stock <= 0;
                    const isLow = v.stock > 0 && v.stock <= Math.max(v.lowStockThreshold || 0, 15);

                    return (
                      <tr key={`${v.productId}-${v.id}`} className="hover:bg-slate-50/80 transition">
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={v.productImage}
                              alt=""
                              className="h-10 w-10 rounded-lg object-cover bg-slate-50 border border-slate-200 flex-shrink-0"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{v.productTitle}</span>
                              <span className="text-[11px] text-slate-500">{v.name} ({v.weightOrSize})</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-500">{v.sku || 'N/A'}</td>
                        <td className="py-3 font-bold text-slate-900">₹{v.basePrice}</td>
                        <td className="py-3">
                          <span className="text-sm font-black text-slate-900">{v.stock} units</span>
                        </td>
                        <td className="py-3 text-slate-500">{v.lowStockThreshold} units</td>
                        <td className="py-3">
                          {isOut ? (
                            <span className="rounded px-2 py-0.5 text-[10px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="rounded px-2 py-0.5 text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                              Low Stock ({v.stock} Left)
                            </span>
                          ) : (
                            <span className="rounded px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Available
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => openAdjustmentModal(v.parentProduct, v.id)}
                            className="rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Audit Logs Table */}
        {activeTab === 'logs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Product / SKU</th>
                  <th className="pb-3">Delta</th>
                  <th className="pb-3">Previous → New</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3">Initiated By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">No logs found.</td>
                  </tr>
                ) : (
                  logs.slice(0, 50).map((log) => {
                    const isPositive = log.change > 0;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-3">
                          <span className="font-bold text-slate-900 block">{log.productName}</span>
                          <span className="text-[11px] text-slate-500">{log.variantName}</span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-0.5 font-black text-xs ${
                              isPositive ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {isPositive ? `+${log.change}` : log.change}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600 font-medium">
                          {log.previousStock} → <span className="font-bold text-slate-900">{log.newStock}</span>
                        </td>
                        <td className="py-3">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase border border-slate-200">
                            {log.reason.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500">{log.createdBy || 'System'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {adjustModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-xs text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Stock Inventory Correction</h3>
                <span className="text-[11px] text-slate-500">{selectedProduct.title}</span>
              </div>
              <button onClick={() => setAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {adjustError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleSaveAdjustment} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustMode('set_exact')}
                  className={`rounded-xl py-2 font-bold text-center border transition ${
                    adjustMode === 'set_exact'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  Set Exact Units
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustMode('add_units')}
                  className={`rounded-xl py-2 font-bold text-center border transition ${
                    adjustMode === 'add_units'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  Add Restock Units (+)
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {adjustMode === 'set_exact' ? 'New Total Stock Balance' : 'Units to Replenish (+)'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={enteredNumber}
                  onChange={(e) => setEnteredNumber(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-black text-slate-900 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Audit Log</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 font-medium text-slate-700 text-xs outline-none focus:border-emerald-500"
                >
                  <option value="restock">Warehouse Replenishment Shipment</option>
                  <option value="manual_adjustment">Physical Count Reconciliation</option>
                  <option value="damaged">Damaged or Expired Stock Removal</option>
                  <option value="order_cancellation">Customer Order Return / Restock</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                >
                  Confirm Stock Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
