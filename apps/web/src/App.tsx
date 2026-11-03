import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { MegaHeader } from './components/MegaHeader';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CategoryPage } from './pages/CategoryPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { PaymentSimulatorPage } from './pages/PaymentSimulatorPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { AccountPage } from './pages/AccountPage';
import { CustomerLoginPage } from './pages/CustomerLoginPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { BottomNav } from './components/BottomNav';
import { getAdminUrl } from '@ecommerce/shared';

const AdminRedirect: React.FC = () => {
  React.useEffect(() => {
    window.location.href = getAdminUrl();
  }, []);
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
      <p className="text-sm font-bold text-slate-700">Opening Admin Operations Console...</p>
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900 pb-16 md:pb-0">
            <MegaHeader />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/product/:idOrSlug" element={<ProductDetailPage />} />
                <Route path="/category/:categorySlug" element={<CategoryPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/payment/simulator" element={<PaymentSimulatorPage />} />
                <Route path="/order/:orderId" element={<OrderTrackingPage />} />
                <Route path="/order/track" element={<OrderTrackingPage />} />
                <Route path="/track" element={<OrderTrackingPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/wishlist" element={<AccountPage defaultTab="wishlist" />} />
                <Route path="/login" element={<CustomerLoginPage />} />
                <Route path="/admin" element={<AdminRedirect />} />
                <Route path="/admin/*" element={<AdminRedirect />} />
              </Routes>
            </main>
            <Footer />
            <CartDrawer />
            <BottomNav />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
