import React, { useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!adminUser) {
    return <AdminLoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Persistent Sidebar (Hidden on mobile) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Slide-over Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative z-50 w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col">
            <Sidebar
              isMobile
              onClose={() => setMobileMenuOpen(false)}
              onItemClick={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area (100% full width on mobile, dashboard visible first at top) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-slate-50 w-full">
        <AdminHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-3 sm:p-6 w-full max-w-7xl mx-auto">
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
        <AdminLayout />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
