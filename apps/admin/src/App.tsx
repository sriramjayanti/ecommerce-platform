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

function AdminLayout() {
  const { adminUser } = useAdminAuth();

  if (!adminUser) {
    return <AdminLoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-100 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-900">
        <AdminHeader />
        <main className="flex-1 p-2 sm:p-4">
          <Routes>
            <Route path="/" element={<DashboardOverviewPage />} />
            <Route path="/products" element={<ProductsAdminPage />} />
            <Route path="/categories" element={<CategoriesAdminPage />} />
            <Route path="/inventory" element={<InventoryAdminPage />} />
            <Route path="/orders" element={<OrdersAdminPage />} />
            <Route path="/features" element={<FeatureTogglesPage />} />
            <Route path="/reviews" element={<ReviewsModerationPage />} />
            <Route path="/banners" element={<BannersAdminPage />} />
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
        <AdminLayout />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
