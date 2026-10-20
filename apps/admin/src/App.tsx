import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { AdminNavProvider } from './context/AdminNavContext';
import { Sidebar } from './components/Sidebar';
import { AdminHeader } from './components/AdminHeader';
import { AdminBottomBar } from './components/AdminBottomBar';
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
    <div className="flex min-h-screen bg-[#eaeded]/60 text-slate-900 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#eaeded]/60 relative">
        <AdminHeader />
        <main className="flex-1 p-2 sm:p-4 pb-24 lg:pb-8">
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
        {/* Mobile Bottom Navigation Bar */}
        <AdminBottomBar />
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AdminNavProvider>
          <AdminLayout />
        </AdminNavProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
