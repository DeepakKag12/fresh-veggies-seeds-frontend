import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Link, useNavigationType } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './animations.css';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import Footer from './components/storefront/StorefrontFooter';
import BottomNav from './components/BottomNav';
import ChatWidget from './components/chat/ChatWidget';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import Storefront from './pages/Storefront';
import NotFound from './pages/NotFound';

import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
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
import AdminDeleteHistory from './pages/admin/AdminDeleteHistory';
import AdminSettings from './pages/admin/AdminSettings';
import AdminCommunication from './pages/admin/AdminCommunication';
import AdminLayout from './components/admin/AdminLayout';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/admin/AdminRoute';

/** Redirects /shop to the storefront, preserving any query string. */
const ShopRedirect = () => {
  const { search } = useLocation();
  return <Navigate to={{ pathname: '/', search }} replace />;
};

// Scroll to top on route change only when explicitly navigating forward (PUSH)
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    // When popping back through history, let the browser restore scroll position
    if (navType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, navType]);

  return null;
}

function App() {
  const location = useLocation();
  const { user } = useAuth();
  const { hideCartPopup } = useCart();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/forgot-password' || location.pathname === '/mobile-login' || location.pathname.startsWith('/reset-password/') || location.pathname.startsWith('/verify-email/');
  const isAdmin = user?.role === 'admin';
  const isAdminPage = location.pathname.startsWith('/admin');

  // Hide cart popup whenever the user navigates to a new page
  useEffect(() => {
    hideCartPopup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <CartDrawer />
      <WishlistDrawer />
      <ScrollToTop />
      {/* Admin Mode Top Pill when viewing customer storefront */}
      {!isAuthPage && !isAdminPage && isAdmin && (
        <div className="bg-[#0A4C36] text-white text-xs py-1.5 px-4 flex items-center justify-between border-b border-emerald-700/60 sticky top-0 z-50 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold">Administrator Mode</span>
            <span className="hidden sm:inline text-emerald-200">· You are inspecting the live storefront</span>
          </div>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1 font-bold text-amber-300 hover:text-white transition-colors text-xs"
          >
            <span>Open Admin Console</span>
            <span>→</span>
          </Link>
        </div>
      )}
      {!isAuthPage && !isAdminPage && <Navbar />}
      {isAdminPage ? (
        <AdminLayout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Storefront />} />
            {/* Legacy path. Carry the query string across so filtered links like
                /shop?category=… keep working instead of landing unfiltered. */}
            <Route path="/shop" element={<ShopRedirect />} />
            <Route path="/product/:id" element={<ProductDetail />} />
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
            <Route path="/order/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
            <Route path="/order-success/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

            {/* Admin Routes & Convenience Aliases */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/inventory" element={<Navigate to="/admin/products" replace />} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
            <Route path="/admin/combos" element={<AdminRoute><AdminCombos /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/orders/:id" element={<AdminRoute><OrderDetail /></AdminRoute>} />
            <Route path="/admin/order/:id" element={<AdminRoute><OrderDetail /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/customers" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
            <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
            <Route path="/admin/banners" element={<AdminRoute><AdminBanners /></AdminRoute>} />
            <Route path="/admin/communication" element={<AdminRoute><AdminCommunication /></AdminRoute>} />
            <Route path="/admin/messages" element={<Navigate to="/admin/communication" replace />} />
            <Route path="/admin/chat" element={<Navigate to="/admin/communication" replace />} />
            <Route path="/admin/recycle-bin" element={<AdminRoute><AdminDeleteHistory initialTab="history" /></AdminRoute>} />
            <Route path="/admin/audit-logs" element={<AdminRoute><AdminDeleteHistory initialTab="audit" /></AdminRoute>} />
            <Route path="/admin/delete-history" element={<AdminRoute><AdminDeleteHistory initialTab="history" /></AdminRoute>} />
            <Route path="/admin/history" element={<Navigate to="/admin/recycle-bin" replace />} />
            <Route path="/admin/trash" element={<Navigate to="/admin/recycle-bin" replace />} />
            <Route path="/admin/danger-zone" element={<AdminRoute><AdminDangerZone /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/profile" element={<Navigate to="/admin/settings" replace />} />
            <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Catch-all — must stay last. */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AdminLayout>
      ) : (
        <main className={`flex-grow overflow-x-hidden ${isAuthPage ? 'pb-0 min-h-screen w-full' : 'pb-20 md:pb-0'}`}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Storefront />} />
            {/* Legacy path. Carry the query string across so filtered links like
                /shop?category=… keep working instead of landing unfiltered. */}
            <Route path="/shop" element={<ShopRedirect />} />
            <Route path="/product/:id" element={<ProductDetail />} />
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
            <Route path="/order/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
            <Route path="/order-success/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

            {/* Admin Routes & Convenience Aliases */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin/login" element={<Navigate to="/login" replace />} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
            <Route path="/admin/inventory" element={<Navigate to="/admin/products" replace />} />
            <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />
            <Route path="/admin/combos" element={<AdminRoute><AdminCombos /></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
            <Route path="/admin/orders/:id" element={<AdminRoute><OrderDetail /></AdminRoute>} />
            <Route path="/admin/order/:id" element={<AdminRoute><OrderDetail /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/customers" element={<Navigate to="/admin/users" replace />} />
            <Route path="/admin/coupons" element={<AdminRoute><AdminCoupons /></AdminRoute>} />
            <Route path="/admin/reviews" element={<AdminRoute><AdminReviews /></AdminRoute>} />
            <Route path="/admin/banners" element={<AdminRoute><AdminBanners /></AdminRoute>} />
            <Route path="/admin/communication" element={<AdminRoute><AdminCommunication /></AdminRoute>} />
            <Route path="/admin/messages" element={<Navigate to="/admin/communication" replace />} />
            <Route path="/admin/chat" element={<Navigate to="/admin/communication" replace />} />
            <Route path="/admin/delete-history" element={<AdminRoute><AdminDeleteHistory /></AdminRoute>} />
            <Route path="/admin/audit-logs" element={<Navigate to="/admin/delete-history" replace />} />
            <Route path="/admin/history" element={<Navigate to="/admin/delete-history" replace />} />
            <Route path="/admin/danger-zone" element={<AdminRoute><AdminDangerZone /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
            <Route path="/admin/profile" element={<Navigate to="/admin/settings" replace />} />
            <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Catch-all — must stay last. */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      )}
      {/* Storefront Footer: isolated from admin screens and checkout */}
      {!isAuthPage && !isAdminPage && location.pathname !== '/checkout' && <Footer />}
      {/* Customer Mobile Navigation */}
      {!isAuthPage && !isAdminPage && location.pathname !== '/checkout' && <BottomNav />}
      {/* Native In-App customer support live chat widget */}
      {!isAuthPage && !isAdminPage && location.pathname !== '/checkout' && <ChatWidget />}
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
