import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import './animations.css';
import NavbarNew from './components/NavbarNew';
import PageTransitionLoader from './components/PageTransitionLoader';
import Footer from './components/Footer';
import BottomNav from './components/BottomNav';
import AdminBottomNav from './components/AdminBottomNav';
import WhatsAppButton from './components/WhatsAppButton';
import { useAuth } from './context/AuthContext';
import HomePage from './features/landing/pages/HomePage';
import Shop from './pages/Shop';
import ProductDetailNew from './pages/ProductDetailNew';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';
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
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

// ScrollToTop component to handle page scroll on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to top with instant behavior for consistent experience
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function App() {
  const location = useLocation();
  const { user } = useAuth();
  const isAdminPage = location.pathname.startsWith('/admin');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PageTransitionLoader />
      <ScrollToTop />
      {!isAuthPage && <NavbarNew />}
      <main className="flex-grow pt-16 pb-20 md:pb-0">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetailNew />} />
          <Route path="/combos" element={<ComboOffers />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Private Routes */}
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
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
        </Routes>
      </main>
      {!isAuthPage && !isAdminPage && <Footer />}
      {/* Show AdminBottomNav for admin on admin pages, regular BottomNav for others */}
      {!isAuthPage && isAdmin && isAdminPage && <AdminBottomNav />}
      {!isAuthPage && !isAdmin && !isAdminPage && <BottomNav />}
      {!isAuthPage && !isAdmin && <WhatsAppButton />}
    </div>
  );
}

export default App;
