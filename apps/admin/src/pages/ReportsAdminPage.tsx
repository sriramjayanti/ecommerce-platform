import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  dataStore,
  Order,
  Product,
  Category,
  DEFAULT_LOW_STOCK_THRESHOLD,
} from '@ecommerce/shared';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Layers,
  CheckCircle2,
  Clock,
  Filter,
  ArrowUpDown,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
} from 'lucide-react';

type ReportPeriodType = 'daily' | 'weekly' | 'monthly' | 'custom';

export const ReportsAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [periodType, setPeriodType] = useState<ReportPeriodType>('daily');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [oList, pList, cList] = await Promise.all([
      dataStore.getOrders(),
      dataStore.getProducts(),
      dataStore.getCategories(),
    ]);
    setOrders(oList);
    setProducts(pList);
    setCategories(cList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = dataStore.subscribe((event) => {
      if (event.type === 'orders_updated' || event.type === 'order_placed') {
        loadData();
      }
    });
    return () => unsub();
  }, []);

  // Filter orders according to period and status
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      const orderDateStr = orderDate.toISOString().split('T')[0];

      // Period matching
      if (periodType === 'daily') {
        if (selectedDate && orderDateStr !== selectedDate) return false;
      } else if (periodType === 'custom') {
        if (startDate && orderDateStr < startDate) return false;
        if (endDate && orderDateStr > endDate) return false;
      } else if (periodType === 'weekly') {
        // Last 12 weeks
        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
        if (orderDate < twelveWeeksAgo) return false;
      } else if (periodType === 'monthly') {
        // Last 12 months
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        if (orderDate < twelveMonthsAgo) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && o.orderStatus !== statusFilter) return false;

      // Payment filter
      if (paymentFilter !== 'all') {
        if (paymentFilter === 'online' && o.paymentMethod === 'cod') return false;
        if (paymentFilter === 'cod' && o.paymentMethod !== 'cod') return false;
      }

      return true;
    });
  }, [orders, periodType, selectedDate, startDate, endDate, statusFilter, paymentFilter]);

  // Aggregated KPIs
  const kpis = useMemo(() => {
    let grossRevenue = 0;
    let netRevenue = 0;
    let totalTax = 0;
    let totalDelivery = 0;
    let totalSavings = 0;
    let totalItems = 0;
    let deliveredCount = 0;
    let cancelledCount = 0;

    filteredOrders.forEach((o) => {
      grossRevenue += o.finalTotal || 0;
      if (o.orderStatus === 'Delivered') {
        netRevenue += o.finalTotal || 0;
        deliveredCount++;
      }
      if (o.orderStatus === 'Cancelled') {
        cancelledCount++;
      }
      totalTax += o.taxAmount || 0;
      totalDelivery += o.deliveryCharge || 0;
      totalSavings += o.totalSavings || 0;
      (o.items || []).forEach((i) => {
        totalItems += i.quantity || 1;
      });
    });

    const avgOrderValue = filteredOrders.length > 0 ? Math.round(grossRevenue / filteredOrders.length) : 0;

    return {
      grossRevenue,
      netRevenue,
      totalTax,
      totalDelivery,
      totalSavings,
      totalItems,
      deliveredCount,
      cancelledCount,
      orderCount: filteredOrders.length,
      avgOrderValue,
    };
  }, [filteredOrders]);

  // Low stock items count (stock <= 15)
  const lowStockProductsCount = useMemo(() => {
    let count = 0;
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        if (v.stock > 0 && v.stock <= Math.max(v.lowStockThreshold || 0, DEFAULT_LOW_STOCK_THRESHOLD)) {
          count++;
        }
      });
    });
    return count;
  }, [products]);

  // Product sales performance ranking
  const productSalesMap = useMemo(() => {
    const map = new Map<string, { title: string; category: string; unitsSold: number; totalRevenue: number; stock: number }>();

    filteredOrders.forEach((o) => {
      (o.items || []).forEach((i) => {
        const existing = map.get(i.productId) || {
          title: i.title,
          category: 'Groceries',
          unitsSold: 0,
          totalRevenue: 0,
          stock: 0,
        };
        existing.unitsSold += i.quantity || 1;
        existing.totalRevenue += i.lineTotal || (i.unitPrice * (i.quantity || 1));
        map.set(i.productId, existing);
      });
    });

    // Populate current stock
    products.forEach((p) => {
      const existing = map.get(p.id);
      if (existing) {
        existing.stock = p.variants.reduce((sum, v) => sum + v.stock, 0);
        const cat = categories.find((c) => c.id === p.categoryId);
        if (cat) existing.category = cat.name;
      }
    });

    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [filteredOrders, products, categories]);

  // Period-wise breakdown (Daily, Weekly, Monthly)
  const periodBreakdown = useMemo(() => {
    const buckets = new Map<string, { label: string; orders: number; revenue: number; items: number; delivered: number }>();

    filteredOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      let key = '';
      let label = '';

      if (periodType === 'daily' || periodType === 'custom') {
        key = d.toISOString().split('T')[0];
        label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      } else if (periodType === 'weekly') {
        // Week grouping
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const weekNum = Math.ceil((((d.getTime() - startOfYear.getTime()) / 86400000) + startOfYear.getDay() + 1) / 7);
        key = `${d.getFullYear()}-W${weekNum < 10 ? '0' + weekNum : weekNum}`;
        label = `Week ${weekNum}, ${d.getFullYear()}`;
      } else if (periodType === 'monthly') {
        key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      }

      const existing = buckets.get(key) || { label, orders: 0, revenue: 0, items: 0, delivered: 0 };
      existing.orders += 1;
      existing.revenue += o.finalTotal || 0;
      if (o.orderStatus === 'Delivered') existing.delivered += 1;
      (o.items || []).forEach((i) => {
        existing.items += i.quantity || 1;
      });
      buckets.set(key, existing);
    });

    return Array.from(buckets.entries())
      .map(([key, val]) => ({ key, ...val }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [filteredOrders, periodType]);

  // Helper to trigger file download
  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setExportSuccessMsg(`Successfully generated & exported: ${filename}`);
    setTimeout(() => setExportSuccessMsg(null), 4000);
  };

  // 1. Export Date-Wise Orders CSV
  const handleExportOrdersCsv = () => {
    const headers = [
      'Order ID',
      'Order Date',
      'Customer Name',
      'Customer Phone',
      'Delivery Address',
      'City',
      'Pincode',
      'Items Summary',
      'Total Items Count',
      'Subtotal (₹)',
      'Delivery Charge (₹)',
      'Tax Amount (₹)',
      'Total Savings (₹)',
      'Final Total (₹)',
      'Payment Method',
      'Payment Status',
      'Order Status',
    ];

    const rows = filteredOrders.map((o) => {
      const itemsSummary = (o.items || [])
        .map((i) => `${i.title} (${i.variantName}) x${i.quantity}`)
        .join('; ');

      const totalItems = (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0);

      const addr = o.shippingAddress;
      const addrStr = addr ? `${addr.line1}, ${addr.city}`.replace(/"/g, '""') : 'N/A';
      const city = addr?.city || 'N/A';
      const pincode = addr?.pincode || 'N/A';

      return [
        `"${o.orderNumber || o.id}"`,
        `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
        `"${(o.customerName || '').replace(/"/g, '""')}"`,
        `"${o.customerPhone || ''}"`,
        `"${addrStr}"`,
        `"${city}"`,
        `"${pincode}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        totalItems,
        o.subtotal || 0,
        o.deliveryCharge || 0,
        o.taxAmount || 0,
        o.totalSavings || 0,
        o.finalTotal || 0,
        `"${o.paymentMethod || 'Online'}"`,
        `"${o.paymentStatus || 'successful'}"`,
        `"${o.orderStatus}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCsv(csvContent, `dailyfresh_orders_report_${periodType}_${timestamp}.csv`);
  };

  // 2. Export Product Sales Performance CSV
  const handleExportProductSalesCsv = () => {
    const headers = [
      'Product ID',
      'Product Name',
      'Category',
      'Total Units Sold',
      'Total Revenue (₹)',
      'Current In Stock',
      'Stock Warning Status',
    ];

    const rows = productSalesMap.map((p) => {
      const stockStatus = p.stock <= 0 ? 'OUT OF STOCK' : p.stock <= 15 ? 'LOW STOCK WARNING (<=15)' : 'HEALTHY';
      return [
        `"${p.id}"`,
        `"${p.title.replace(/"/g, '""')}"`,
        `"${p.category.replace(/"/g, '""')}"`,
        p.unitsSold,
        p.totalRevenue,
        p.stock,
        `"${stockStatus}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCsv(csvContent, `dailyfresh_product_sales_performance_${timestamp}.csv`);
  };

  // 3. Export Period Summary CSV (Daily / Weekly / Monthly aggregated)
  const handleExportPeriodSummaryCsv = () => {
    const headers = [
      'Period Group',
      'Total Orders',
      'Total Revenue (₹)',
      'Total Units Sold',
      'Delivered Orders',
      'Average Order Value (₹)',
    ];

    const rows = periodBreakdown.map((b) => {
      const aov = b.orders > 0 ? Math.round(b.revenue / b.orders) : 0;
      return [
        `"${b.label}"`,
        b.orders,
        b.revenue,
        b.items,
        b.delivered,
        aov,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCsv(csvContent, `dailyfresh_${periodType}_summary_report_${timestamp}.csv`);
  };

  // 4. Export Low Stock Report CSV (All products with stock <= 15)
  const handleExportLowStockCsv = () => {
    const headers = [
      'Product Name',
      'Variant Name',
      'SKU',
      'Current Stock Units',
      'Low Stock Threshold',
      'Stock Status',
      'Urgency Level',
    ];

    const rows: string[] = [];
    products.forEach((p) => {
      (p.variants || []).forEach((v) => {
        const threshold = Math.max(v.lowStockThreshold || 0, DEFAULT_LOW_STOCK_THRESHOLD);
        if (v.stock <= threshold) {
          const isOut = v.stock <= 0;
          const status = isOut ? 'OUT OF STOCK' : `CRITICAL LOW STOCK (${v.stock} units left)`;
          const urgency = isOut ? 'CRITICAL - REORDER IMMEDIATELY' : v.stock <= 5 ? 'VERY HIGH' : 'HIGH';

          rows.push([
            `"${p.title.replace(/"/g, '""')}"`,
            `"${v.name.replace(/"/g, '""')}"`,
            `"${v.sku || 'N/A'}"`,
            v.stock,
            threshold,
            `"${status}"`,
            `"${urgency}"`,
          ].join(','));
        }
      });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const timestamp = new Date().toISOString().split('T')[0];
    downloadCsv(csvContent, `dailyfresh_low_stock_warning_report_${timestamp}.csv`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>← Back to Dashboard Overview</span>
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            <span>Reports & Data Export Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Export every date, weekly, monthly and date-wise performance reports. Monitor sales, revenue, low stock & orders.
          </p>
        </div>

        {/* Global Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <Printer className="h-3.5 w-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            type="button"
            onClick={handleExportOrdersCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition"
          >
            <Download className="h-4 w-4" />
            <span>Export Orders (CSV)</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {exportSuccessMsg && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* Filter & Granularity Control Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Period Tabs: Every Date / Weekly / Monthly / Custom Date-wise */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-slate-700 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              Period:
            </span>
            <button
              type="button"
              onClick={() => setPeriodType('daily')}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                periodType === 'daily'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Every Date (Daily)
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('weekly')}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                periodType === 'weekly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Weekly Rollup
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('monthly')}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                periodType === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Monthly Summary
            </button>
            <button
              type="button"
              onClick={() => setPeriodType('custom')}
              className={`rounded-xl px-4 py-2 text-xs font-extrabold transition ${
                periodType === 'custom'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Date-wise Range
            </button>
          </div>

          {/* Quick Filter Selectors */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Order Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="Delivered">Delivered</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Packed">Packed</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500">Payment:</span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="all">All Payments</option>
                <option value="online">Online / UPI / PhonePe</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>

            <button
              type="button"
              onClick={loadData}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-slate-50 transition"
              title="Refresh Data"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Date Inputs depending on Period */}
        {periodType === 'daily' && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-600">Select Exact Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
            />
            <span className="text-xs text-slate-400">
              Showing orders and transactions on {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        )}

        {periodType === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-slate-600">From Date:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
            />
            <span className="text-xs font-bold text-slate-600">To Date:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      {/* KPI Highlights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Sales</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">₹{kpis.grossRevenue.toLocaleString('en-IN')}</span>
            <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
              Net Delivered: ₹{kpis.netRevenue.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Volume</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{kpis.orderCount} Orders</span>
            <p className="text-[11px] text-blue-700 font-bold mt-0.5">
              {kpis.deliveredCount} Delivered • {kpis.cancelledCount} Cancelled
            </p>
          </div>
        </div>

        {/* Items Sold & AOV */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Units Sold & AOV</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{kpis.totalItems} Units</span>
            <p className="text-[11px] text-amber-800 font-bold mt-0.5">
              Avg Order Value: ₹{kpis.avgOrderValue}
            </p>
          </div>
        </div>

        {/* Low Stock Warning Alert */}
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-rose-800 uppercase tracking-wider">Stock Warning (≤15)</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-700">{lowStockProductsCount} Products</span>
            <p className="text-[11px] text-rose-800 font-medium mt-0.5">
              Threshold starts at 15 or less units
            </p>
          </div>
        </div>
      </div>

      {/* CSV Export Quick Action Bar */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-black uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
            One-Click CSV Export Options
          </h3>
          <p className="text-[11px] text-slate-600 mt-0.5">
            Download formatted spreadsheets compatible with Excel, Google Sheets, Tally & accounting tools.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportOrdersCsv}
            className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
          >
            Export All Filtered Orders CSV
          </button>
          <button
            type="button"
            onClick={handleExportPeriodSummaryCsv}
            className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
          >
            Export {periodType.toUpperCase()} Aggregation CSV
          </button>
          <button
            type="button"
            onClick={handleExportProductSalesCsv}
            className="rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
          >
            Export Product Sales CSV
          </button>
          <button
            type="button"
            onClick={handleExportLowStockCsv}
            className="rounded-xl border border-rose-300 bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-800 hover:bg-rose-200 transition shadow-2xs"
          >
            Export Low Stock Warning CSV (≤15)
          </button>
        </div>
      </div>

      {/* Period Grouping Summary Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">
              {periodType === 'daily'
                ? 'Daily Breakdown'
                : periodType === 'weekly'
                ? 'Weekly Rollup Summary'
                : periodType === 'monthly'
                ? 'Monthly Revenue & Order Totals'
                : 'Date-wise Range Breakdown'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Aggregated transactions and units sold for each time period
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportPeriodSummaryCsv}
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Table</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Period / Date</th>
                <th className="py-3 px-4 text-center">Total Orders</th>
                <th className="py-3 px-4 text-center">Delivered</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Gross Sales (₹)</th>
                <th className="py-3 px-4 text-right">Avg Order Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {periodBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No orders recorded for this period. Try switching dates or filters.
                  </td>
                </tr>
              ) : (
                periodBreakdown.map((b) => {
                  const aov = b.orders > 0 ? Math.round(b.revenue / b.orders) : 0;
                  return (
                    <tr key={b.key} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{b.label}</td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{b.orders}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          {b.delivered}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">{b.items}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        ₹{b.revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-600">
                        ₹{aov.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Top Products Sales Performance & Orders Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Filtered Orders List */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Detailed Orders Log ({filteredOrders.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Individual transactions matching active date and status filters
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportOrdersCsv}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[460px]">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Items</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => {
                    const totalQty = (o.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
                    return (
                      <tr key={o.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-slate-900 block font-mono">
                            {o.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(o.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 block">{o.customerName}</span>
                          <span className="text-[10px] text-slate-400 block">{o.customerPhone}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-700 block">{totalQty} units</span>
                          <span className="text-[10px] text-slate-400 line-clamp-1 max-w-[140px]">
                            {(o.items || []).map((i) => i.title).join(', ')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          ₹{o.finalTotal}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              o.orderStatus === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.orderStatus === 'Cancelled'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {o.orderStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                            {o.paymentMethod || 'Online'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (1 span): Product Sales Performance */}
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Top Selling Products</h2>
              <p className="text-xs text-slate-400 mt-0.5">By sales volume in period</p>
            </div>
            <button
              type="button"
              onClick={handleExportProductSalesCsv}
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>
          </div>

          <div className="p-4 divide-y divide-slate-100 overflow-y-auto max-h-[460px] space-y-3">
            {productSalesMap.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No product sales yet</p>
            ) : (
              productSalesMap.slice(0, 10).map((p, idx) => (
                <div key={p.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-600 flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-xs truncate max-w-[140px]">
                        {p.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 block truncate">{p.category}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-xs text-emerald-700 block">
                      ₹{p.totalRevenue.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold block">
                      {p.unitsSold} sold • {p.stock} in stock
                    </span>
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
