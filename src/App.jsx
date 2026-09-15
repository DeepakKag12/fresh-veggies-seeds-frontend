import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './animations.css';
import NavbarNew from './components/NavbarNew';
import CartDrawer from './components/CartDrawer';
import Footer from './components/storefront/StorefrontFooter';
import BottomNav from './components/BottomNav';
import AdminBottomNav from './components/AdminBottomNav';
import WhatsAppButton from './components/WhatsAppButton';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import Storefront from './pages/Storefront';
import NotFound from './pages/NotFound';

import ProductDetailNew from './pages/ProductDetailNew';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import MobileLogin from './pages/MobileLogin';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import Settings from './pages/Settings';
import About from './pages/About';
import Contact from './pages/Contact';
import ComboOffers from './pages/ComboOffers';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCombos from './pages/admin/AdminCombos';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminReviews from './pages/admin/AdminReviews';
import AdminBanners from './pages/admin/AdminBanners';
import AdminDangerZone from './pages/admin/AdminDangerZone';
import AdminSettings from './pages/admin/AdminSettings';
import AdminHeader from './components/admin/AdminHeader';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

/** Redirects /shop to the storefront, preserving any query string. */
const ShopRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/', search }} replace />;
};

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const location = useLocation();
  const { user } = useAuth();
  const { hideCartPopup } = useCart();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname === '/mobile-login' || location.pathname.startsWith('/reset-password/') || location.pathname.startsWith('/verify-email/');
  const isAdmin = user?.role === 'admin';

  // Hide cart popup whenever the user navigates to a new page
  useEffect(() => {
    hideCartPopup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <CartDrawer />
      <ScrollToTop />
      {!isAuthPage && <NavbarNew />}
      {!isAuthPage && isAdmin && location.pathname.startsWith('/admin') && <AdminHeader />}
      <main className="flex-grow overflow-x-hidden pb-20 md:pb-0">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Storefront />} />
          {/* Legacy path. Carry the query string across so filtered links like
              /shop?category=… keep working instead of landing unfiltered. */}
          <Route path="/shop" element={<ShopRedirect />} />
          <Route path="/product/:id" element={<ProductDetailNew />} />
          <Route path="/combos" element={<ComboOffers />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:resetToken" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/mobile-login" element={<MobileLogin />} />
          <Route path="/about" element={<About />} />




          <Route path="/contact" element={<Contact />} />

          {/* Checkout (Guest OTP or Authenticated) */}
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<PrivateRoute><MyOrders /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
          <Route path="/admin/combos" element={<AdminRoute><AdminCombos /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
          <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
          <Route path="/admin/banners" element={<AdminRoute><AdminBanners /></AdminRoute>} />
          <Route path="/admin/danger-zone" element={<AdminRoute><AdminDangerZone /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

          {/* Catch-all — must stay last. */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {/* One footer across the storefront, hidden on /checkout for a distraction-free checkout experience */}
      {location.pathname !== '/checkout' && <Footer />}
      {/* Admin always sees AdminBottomNav, regular users see BottomNav (hidden on checkout for clean mobile focus) */}
      {!isAuthPage && isAdmin && <AdminBottomNav />}
      {!isAuthPage && !isAdmin && location.pathname !== '/checkout' && <BottomNav />}
      {!isAuthPage && !isAdmin && location.pathname !== '/checkout' && <WhatsAppButton />}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </div>
  );
}

export default App;
