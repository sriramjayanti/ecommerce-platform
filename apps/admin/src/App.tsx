import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { Sidebar } from './components/Sidebar';
import { AdminHeader } from './components/AdminHeader';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { DashboardOverviewPage } from './pages/DashboardOverviewPage';
import { ProductsAdminPage } from './pages/ProductsAdminPage';
import { CategoriesAdminPage } from './pages/CategoriesAdminPage';
import { InventoryAdminPage } from './pages/InventoryAdminPage';
import { OrdersAdminPage } from './pages/OrdersAdminPage';
import { FeatureTogglesPage } from './pages/FeatureTogglesPage';
import { ReviewsModerationPage } from './pages/ReviewsModerationPage';
import { BannersAdminPage } from './pages/BannersAdminPage';
import { ReportsAdminPage } from './pages/ReportsAdminPage';
import { getStorefrontUrl } from '@ecommerce/shared';

const StoreRedirect: React.FC = () => {
  React.useEffect(() => {
    window.location.href = getStorefrontUrl();
  }, []);
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      <p className="text-sm font-bold text-slate-700">Opening Customer Storefront...</p>
    </div>
  );
};

function AdminLayout() {
  const { adminUser } = useAdminAuth();

  if (!adminUser) {
    return <AdminLoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 w-full">
          <Routes>
            <Route path="/" element={<DashboardOverviewPage />} />
            <Route path="/reports" element={<ReportsAdminPage />} />
            <Route path="/products" element={<ProductsAdminPage />} />
            <Route path="/categories" element={<CategoriesAdminPage />} />
            <Route path="/inventory" element={<InventoryAdminPage />} />
            <Route path="/orders" element={<OrdersAdminPage />} />
            <Route path="/features" element={<FeatureTogglesPage />} />
            <Route path="/reviews" element={<ReviewsModerationPage />} />
            <Route path="/banners" element={<BannersAdminPage />} />
            <Route path="/store" element={<StoreRedirect />} />
            <Route path="/shop" element={<StoreRedirect />} />
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/store" element={<StoreRedirect />} />
          <Route path="/shop" element={<StoreRedirect />} />
          <Route path="/*" element={<AdminLayout />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
