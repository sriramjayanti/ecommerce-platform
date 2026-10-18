import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import {
  TrendingUp,
  ShoppingBag,
  Zap,
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Database,
  RefreshCw,
  Truck,
  Package,
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

  const fetchDashboardData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/metrics').then((r) => r.json()).catch(() => ({ success: false, data: {} })),
      fetch('/api/orders').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
      fetch('/api/products').then((r) => r.json()).catch(() => ({ success: false, data: [] })),
    ])
      .then(([mRes, oRes, pRes]) => {
        if (mRes.success) setMetrics(mRes.data);
        if (oRes.success) setRecentOrders(oRes.data.slice(0, 6));
        if (pRes.success) setProducts(pRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const lowStockVariants = products.flatMap((p) =>
    p.variants
      .filter((v: any) => v.stock <= v.lowStockThreshold)
      .map((v: any) => ({ product: p, variant: v }))
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Operations & Business Dashboard</h1>
          <p className="text-xs text-slate-400">
            Real-time metrics, wholesale conversions, low-stock inventory alerts, and order fulfillment.
          </p>
        </div>

        <button
          onClick={async () => {
            await resetDemoData();
            fetchDashboardData();
          }}
          disabled={isSeeding}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold text-emerald-400 hover:text-white hover:bg-slate-800 transition self-start sm:self-auto"
        >
          <Database className={`h-4 w-4 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? 'Dumping...' : 'Dump / Reset Demo Data'}</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Gross Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">₹{metrics.totalRevenue}</div>
          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>Verified PhonePe & COD Sales</span>
          </p>
        </div>

        {/* Total Orders */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-950 text-blue-400 border border-blue-800/60">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{metrics.totalOrders}</div>
          <p className="text-[11px] text-slate-400">
            Average Order Value: <span className="font-bold text-white">₹{metrics.aov}</span>
          </p>
        </div>

        {/* Wholesale Orders */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Wholesale Tier Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60">
              <Zap className="h-4 w-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">{metrics.wholesaleOrders}</div>
          <p className="text-[11px] text-amber-300/80 font-medium">Bulk quantity discount triggered</p>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Low Stock Alerts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-950 text-rose-400 border border-rose-800/60">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className={`text-2xl font-black ${metrics.lowStockCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {metrics.lowStockCount}
          </div>
          <p className="text-[11px] text-slate-400">
            {metrics.lowStockCount > 0 ? `${metrics.lowStockCount} items need restock` : 'All inventory healthy'}
          </p>
        </div>
      </div>

      {/* Two Columns: Recent Orders + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Section (2 Cols) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Recent Customer Orders</h3>
              <p className="text-xs text-slate-400">Latest orders placed via Web and Mobile apps</p>
            </div>
            <Link
              to="/orders"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3">Order Number</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No orders placed yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 font-bold text-white font-mono">#{ord.orderNumber}</td>
                      <td className="py-3">
                        <span className="font-semibold text-slate-200 block">{ord.customerName}</span>
                        <span className="text-[10px] text-slate-500">{ord.customerPhone}</span>
                      </td>
                      <td className="py-3 font-black text-white">₹{ord.finalTotal}</td>
                      <td className="py-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                            ord.orderStatus === 'Delivered'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          to="/orders"
                          className="text-xs font-bold text-emerald-400 hover:underline"
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
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <h3 className="text-base font-bold text-white">Stock Warnings</h3>
            </div>
            <Link
              to="/inventory"
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              Inventory
            </Link>
          </div>

          <div className="space-y-2.5">
            {lowStockVariants.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">All product variants are well stocked!</p>
            ) : (
              lowStockVariants.slice(0, 5).map(({ product: p, variant: v }, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl bg-slate-900/70 border border-slate-800 p-3 text-xs"
                >
                  <div className="space-y-0.5 pr-2">
                    <span className="font-bold text-white line-clamp-1">{p.title}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {v.name} • SKU: {v.sku}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-black text-xs block ${
                        v.stock === 0 ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {v.stock === 0 ? 'Out of Stock' : `${v.stock} left`}
                    </span>
                    <span className="text-[10px] text-slate-500">Min: {v.lowStockThreshold}</span>
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
