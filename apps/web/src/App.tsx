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
import { BottomNav } from './components/BottomNav';

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
              </Routes>
            </main>
            <Footer />
            <CartDrawer />
            <BottomNav
              onOpenCategories={() => {
                const menuBtn = document.querySelector('button[title*="Navigation Menu"]') as HTMLButtonElement;
                if (menuBtn) {
                  menuBtn.click();
                } else {
                  window.location.href = '/?tab=categories';
                }
              }}
            />
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
