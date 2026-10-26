import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { dataStore } from '@ecommerce/shared';
import {
  TrendingUp,
  ShoppingBag,
  Zap,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  Database,
  Truck,
  Package,
  Layers,
} from 'lucide-react';

export const DashboardOverviewPage: React.FC = () => {
  const { resetDemoData, isSeeding } = useAdminAuth();
  const [metrics, setMetrics] = useState<any>({
    totalRevenue: 0,
    totalOrders: 0,
    aov: 0,
    wholesaleOrders: 0,
    lowStockCount: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      const [m, ords, prods] = await Promise.all([
        dataStore.getMetrics(),
        dataStore.getOrders(),
        dataStore.getProducts(),
      ]);

      setMetrics(m);
      setRecentOrders(ords.slice(0, 6));
      setProducts(prods);
    } catch (e) {
      console.error('Failed to load dashboard metrics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const unsubscribe = dataStore.subscribe(() => {
      loadDashboardData();
    });
    return unsubscribe;
  }, []);

  const lowStockVariants = products.flatMap((p) =>
    (p.variants || [])
      .filter((v: any) => v.stock <= Math.max(v.lowStockThreshold || 0, 15))
      .map((v: any) => ({ product: p, variant: v }))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Operations & Business Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time metrics, wholesale conversions, inventory alerts, and synchronized customer orders.
          </p>
        </div>

        <button
          onClick={async () => {
            await resetDemoData();
            loadDashboardData();
          }}
          disabled={isSeeding}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 transition shadow-2xs self-start sm:self-auto"
        >
          <Database className={`h-4 w-4 ${isSeeding ? 'animate-spin' : 'text-emerald-600'}`} />
          <span>{isSeeding ? 'Dumping...' : 'Dump / Reset Demo Data'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Gross Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">₹{metrics.totalRevenue?.toLocaleString('en-IN') || 0}</div>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>Verified PhonePe & COD Sales</span>
          </p>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Orders</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.totalOrders || 0}</div>
          <p className="text-[11px] text-slate-500">
            Average Order Value: <span className="font-bold text-slate-800">₹{metrics.aov || 0}</span>
          </p>
        </div>

        {/* Wholesale Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Wholesale Orders</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Zap className="h-4 w-4 fill-amber-500" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{metrics.wholesaleOrders || 0}</div>
          <p className="text-[11px] text-amber-700 font-medium">Bulk quantity slabs triggered</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Low Stock Alerts</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${metrics.lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {metrics.lowStockCount || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            {metrics.lowStockCount > 0 ? `${metrics.lowStockCount} items need replenishment` : 'All inventory healthy'}
          </p>
        </div>
      </div>

      {/* Two Columns: Recent Orders + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Section (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Recent Customer Orders</h3>
              <p className="text-xs text-slate-500">Synced directly with customer checkout & database</p>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition shadow-2xs"
            >
              <span>Manage All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 font-bold text-slate-900 font-mono">#{ord.orderNumber}</td>
                      <td className="py-3">
                        <span className="font-semibold text-slate-900 block">{ord.customerName}</span>
                        <span className="text-[10px] text-slate-500">{ord.customerPhone}</span>
                      </td>
                      <td className="py-3 font-black text-slate-900">₹{ord.finalTotal}</td>
                      <td className="py-3">
                        <span
                          className={`rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase border ${
                            ord.orderStatus === 'Delivered'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : ord.orderStatus === 'Cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to="/orders"
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Attention List (1 Col) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <h3 className="text-base font-extrabold text-slate-900">Stock Warnings</h3>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Inventory
            </Link>
          </div>

          <div className="space-y-2.5">
            {lowStockVariants.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">All product variants are well stocked!</p>
            ) : (
              lowStockVariants.slice(0, 5).map(({ product: p, variant: v }, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-xs"
                >
                  <div className="space-y-0.5 pr-2">
                    <span className="font-bold text-slate-900 line-clamp-1">{p.title}</span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {v.name} • SKU: {v.sku}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-black text-xs block ${
                        v.stock === 0 ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    >
                      {v.stock === 0 ? 'Out of Stock' : `${v.stock} left`}
                    </span>
                    <span className="text-[10px] text-slate-400">Min: {Math.max(v.lowStockThreshold || 0, 15)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
