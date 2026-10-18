import React, { useState, useEffect } from 'react';
import { Product, InventoryLog } from '@ecommerce/shared';
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
} from 'lucide-react';

export const InventoryAdminPage: React.FC = () => {
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

  const fetchInventory = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/products').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/inventory/logs').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
    ])
      .then(([pRes, lRes]) => {
        if (pRes.success) setProducts(pRes.data);
        if (lRes.success) setLogs(lRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
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

  const currentVariant = selectedProduct?.variants.find((v) => v.id === selectedVariantId);
  const currentStock = currentVariant?.stock ?? 0;
  
  const finalNewStockPreview =
    adjustMode === 'set_exact'
      ? Math.max(0, enteredNumber)
      : Math.max(0, currentStock + Math.max(0, enteredNumber));

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedVariantId) return;

    try {
      let payload;
      if (adjustMode === 'set_exact') {
        payload = {
          productId: selectedProduct.id,
          variantId: selectedVariantId,
          newStock: Math.max(0, enteredNumber),
          reason,
        };
      } else {
        payload = {
          productId: selectedProduct.id,
          variantId: selectedVariantId,
          delta: Math.max(0, enteredNumber),
          reason: reason === 'manual_adjustment' ? 'restock' : reason,
        };
      }

      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update stock');
      }

      setAdjustModalOpen(false);
      fetchInventory();
    } catch (err: any) {
      setAdjustError(err.message);
    }
  };

  const handleBulkRestock = async () => {
    setBulkRestocking(true);
    setBulkSuccessMsg(null);
    try {
      const res = await fetch('/api/inventory/bulk-restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitsToAdd: 50 }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkSuccessMsg(data.message);
        fetchInventory();
        setTimeout(() => setBulkSuccessMsg(null), 4000);
      }
    } catch {}
    setBulkRestocking(false);
  };

  const allVariants = products.flatMap((prod) =>
    prod.variants.map((v) => ({
      product: prod,
      variant: v,
      isLow: v.stock <= v.lowStockThreshold && v.stock > 0,
      isOut: v.stock <= 0,
    }))
  );

  const lowStockTotalCount = allVariants.filter((item) => item.isLow || item.isOut).length;

  const filteredVariants = allVariants.filter(({ product, variant, isLow, isOut }) => {
    if (stockFilter === 'low' && !isLow) return false;
    if (stockFilter === 'out' && !isOut) return false;
    if (stockFilter === 'healthy' && (isLow || isOut)) return false;

    if (search) {
      const q = search.toLowerCase();
      const matchP = product.title.toLowerCase().includes(q);
      const matchV = variant.name.toLowerCase().includes(q);
      const matchS = variant.sku.toLowerCase().includes(q);
      if (!matchP && !matchV && !matchS) return false;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Inventory & Stock Manager</h1>
          <p className="text-xs text-slate-400">
            Real-time variant stock tracking, direct level updates, and sales deduction history across {allVariants.length} variants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lowStockTotalCount > 0 && (
            <button
              onClick={handleBulkRestock}
              disabled={bulkRestocking}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 text-xs font-black shadow-md transition"
            >
              <Zap className="h-3.5 w-3.5 fill-slate-950" />
              <span>{bulkRestocking ? 'Restocking...' : `Restock Low Items (+50)`}</span>
            </button>
          )}

          <div className="flex gap-1.5 rounded-2xl bg-slate-950 border border-slate-800 p-1">
            <button
              onClick={() => setActiveTab('variants')}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'variants'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Variant Stock Levels ({allVariants.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === 'logs'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Audit Logs ({logs.length})</span>
            </button>
          </div>
        </div>
      </div>

      {bulkSuccessMsg && (
        <div className="rounded-2xl border border-emerald-800 bg-emerald-950 p-4 text-xs font-bold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>{bulkSuccessMsg}</span>
        </div>
      )}

      {activeTab === 'variants' ? (
        <div className="space-y-4">
          {/* Filter / Search bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Search variant name or SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setStockFilter('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
                  stockFilter === 'all'
                    ? 'border-emerald-700 bg-emerald-950 text-emerald-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                All ({allVariants.length})
              </button>
              <button
                onClick={() => setStockFilter('low')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
                  stockFilter === 'low'
                    ? 'border-amber-700 bg-amber-950 text-amber-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                Low Stock ({allVariants.filter((v) => v.isLow).length})
              </button>
              <button
                onClick={() => setStockFilter('out')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
                  stockFilter === 'out'
                    ? 'border-rose-700 bg-rose-950 text-rose-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                Out of Stock ({allVariants.filter((v) => v.isOut).length})
              </button>
              <button
                onClick={() => setStockFilter('healthy')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition ${
                  stockFilter === 'healthy'
                    ? 'border-emerald-700 bg-emerald-950 text-emerald-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                Healthy ({allVariants.filter((v) => !v.isLow && !v.isOut).length})
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold">
                    <th className="pb-3">Product Name</th>
                    <th className="pb-3">Variant / SKU</th>
                    <th className="pb-3">Current Stock</th>
                    <th className="pb-3">Low Threshold</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Quick Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredVariants.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No variants matching selected stock filter.
                      </td>
                    </tr>
                  ) : (
                    filteredVariants.map(({ product: prod, variant: v, isLow, isOut }) => (
                      <tr key={`${prod.id}-${v.id}`} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 font-bold text-white flex items-center gap-2.5">
                          <img
                            src={prod.images[0] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}
                            alt=""
                            className="h-8 w-8 rounded-lg object-cover bg-slate-900"
                          />
                          <span>{prod.title}</span>
                        </td>
                        <td className="py-3.5 text-slate-300">
                          {v.name} <span className="text-[10px] text-slate-500 font-mono">({v.sku})</span>
                        </td>
                        <td className="py-3.5 font-black text-sm text-white">{v.stock} units</td>
                        <td className="py-3.5 text-slate-400">{v.lowStockThreshold} units</td>
                        <td className="py-3.5">
                          {isOut ? (
                            <span className="rounded bg-rose-950 border border-rose-800 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                              OUT OF STOCK
                            </span>
                          ) : isLow ? (
                            <span className="rounded bg-amber-950 border border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-400 flex items-center gap-1 w-max">
                              <AlertTriangle className="h-3 w-3" />
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-950 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                              HEALTHY
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => openAdjustmentModal(prod, v.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-1.5 text-xs font-bold text-emerald-400 hover:bg-slate-800 hover:text-white transition"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Update Stock</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Logs Table */
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Product & Variant</th>
                  <th className="pb-3">Change</th>
                  <th className="pb-3">New Stock</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3">Reference / Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No inventory logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 text-slate-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className="font-bold text-white">{log.productName}</span>
                        <span className="block text-[11px] text-slate-500">{log.variantName}</span>
                      </td>
                      <td className="py-3 font-mono font-bold">
                        <span className={log.change > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {log.change > 0 ? `+${log.change}` : log.change} units
                        </span>
                      </td>
                      <td className="py-3 text-white font-bold">{log.newStock}</td>
                      <td className="py-3">
                        <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 uppercase">
                          {log.reason.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-slate-400">
                        {log.referenceId && <span className="font-mono text-emerald-400">{log.referenceId} • </span>}
                        <span>{log.createdBy}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModalOpen && selectedProduct && currentVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Update Product Stock</h3>
              <button onClick={() => setAdjustModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {adjustError && (
              <div className="rounded-xl border border-rose-800 bg-rose-950 p-3 text-xs font-bold text-rose-300">
                {adjustError}
              </div>
            )}

            {/* Target Product Summary */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 space-y-1 text-xs">
              <span className="text-slate-400 block font-medium">Product & Variant:</span>
              <p className="font-bold text-white text-sm">{selectedProduct.title}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 mt-2">
                <span className="text-slate-400">{currentVariant.name} (SKU: {currentVariant.sku})</span>
                <span className="font-bold text-emerald-400 text-xs">Current Stock: {currentStock} units</span>
              </div>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              {/* Option Selector */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode('set_exact');
                    setEnteredNumber(currentStock);
                  }}
                  className={`py-2 rounded-xl font-bold transition text-xs ${
                    adjustMode === 'set_exact'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Set Exact Stock
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjustMode('add_units');
                    setEnteredNumber(50);
                  }}
                  className={`py-2 rounded-xl font-bold transition text-xs ${
                    adjustMode === 'add_units'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Add Units (+ Restock)
                </button>
              </div>

              {/* Number Input Field */}
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  {adjustMode === 'set_exact' ? 'Enter New Total Stock Count *' : 'Enter Number of Units to Add *'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={enteredNumber}
                  onChange={(e) => setEnteredNumber(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="e.g. 150"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-base text-white outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              {/* Preview Result */}
              <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">New Stock Total after update:</span>
                <span className="text-emerald-400 font-black text-sm">{finalNewStockPreview} units</span>
              </div>

              {/* Audit Reason */}
              <div>
                <label className="block font-bold text-slate-300 mb-1">Reason for Stock Update *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white outline-none focus:border-emerald-500"
                >
                  <option value="restock">Distributor Shipment / Wholesale Restock</option>
                  <option value="manual_adjustment">Physical Floor Count Update</option>
                  <option value="return_restock">Customer Order Return</option>
                  <option value="audit_correction">Audit Correction</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="rounded-xl bg-slate-900 px-4 py-2 font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-emerald-500 transition"
                >
                  Save Stock Level
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
