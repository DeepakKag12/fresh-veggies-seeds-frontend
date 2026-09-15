import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Layers,
  Tag,
  Users,
  Ticket,
  Image,
  Star,
  Settings,
  ChevronDown,
  ExternalLink,
  Boxes
} from 'lucide-react';
import api from '../../utils/api';
import AdminNotificationBell from '../AdminNotificationBell';

const AdminHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [productsOpen, setProductsOpen] = useState(false);
  const [marketingOpen, setMarketingOpen] = useState(false);
  const productsRef = useRef(null);
  const marketingRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch {
      // silently fail if network glitch
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutside = (e) => {
      if (productsRef.current && !productsRef.current.contains(e.target)) {
        setProductsOpen(false);
      }
      if (marketingRef.current && !marketingRef.current.contains(e.target)) {
        setMarketingOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const isActive = (path) => {
    if (path === '/admin/dashboard') return location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(path);
  };

  const isProductsActive = ['/admin/products', '/admin/categories', '/admin/combos'].some((p) =>
    location.pathname.startsWith(p)
  );

  const isMarketingActive = ['/admin/coupons', '/admin/banners'].some((p) =>
    location.pathname.startsWith(p)
  );

  const pendingActionCount = (stats?.pendingOrders || 0) + (stats?.cancellationRequests || 0);

  return (
    <div className="hidden md:block bg-white dark:bg-gray-800 border-b border-fv-border shadow-xs sticky top-[65px] z-40">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between h-12">
        {/* Left Navigation Links */}
        <div className="flex items-center gap-1 lg:gap-2">
          {/* 1. Dashboard */}
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive('/admin/dashboard')
                ? 'bg-fv-primary text-white shadow-xs'
                : 'text-gray-700 dark:text-gray-300 hover:bg-fv-cream dark:hover:bg-gray-700'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </Link>

          {/* 2. Orders with Live Badge */}
          <Link
            to="/admin/orders"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive('/admin/orders')
                ? 'bg-fv-primary text-white shadow-xs'
                : 'text-gray-700 dark:text-gray-300 hover:bg-fv-cream dark:hover:bg-gray-700'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Orders
            {pendingActionCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white leading-none animate-pulse">
                {pendingActionCount}
              </span>
            )}
          </Link>

          {/* 3. Products Group Dropdown */}
          <div className="relative" ref={productsRef}>
            <button
              type="button"
              onClick={() => setProductsOpen(!productsOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isProductsActive
                  ? 'bg-fv-primary/10 text-fv-primary dark:text-green-400 font-bold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-fv-cream dark:hover:bg-gray-700'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Products
              <ChevronDown className={`w-3 h-3 transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
            </button>

            {productsOpen && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-fv-border p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  type="button"
                  onClick={() => { navigate('/admin/products'); setProductsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-fv-cream dark:hover:bg-gray-700 rounded-lg text-left"
                >
                  <Package className="w-3.5 h-3.5 text-fv-primary" />
                  All Products
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/admin/categories'); setProductsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-fv-cream dark:hover:bg-gray-700 rounded-lg text-left"
                >
                  <Layers className="w-3.5 h-3.5 text-fv-primary" />
                  Categories
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/admin/combos'); setProductsOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-fv-cream dark:hover:bg-gray-700 rounded-lg text-left"
                >
                  <Tag className="w-3.5 h-3.5 text-fv-primary" />
                  Combos & Deals
                </button>
                <div className="border-t border-fv-border my-1" />
                <button
                  type="button"
                  onClick={() => { navigate('/admin/products?lowstock=true'); setProductsOpen(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className="w-3.5 h-3.5 text-amber-600" />
                    Low Stock Alerts
                  </div>
                  {(stats?.lowStockProducts || 0) > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-200 text-amber-900">
                      {stats.lowStockProducts}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 4. Customers */}
          <Link
            to="/admin/users"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive('/admin/users')
                ? 'bg-fv-primary text-white shadow-xs'
                : 'text-gray-700 dark:text-gray-300 hover:bg-fv-cream dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Customers
          </Link>

          {/* 5. Marketing Group Dropdown */}
          <div className="relative" ref={marketingRef}>
            <button
              type="button"
              onClick={() => setMarketingOpen(!marketingOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isMarketingActive
                  ? 'bg-fv-primary/10 text-fv-primary dark:text-green-400 font-bold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-fv-cream dark:hover:bg-gray-700'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              Marketing
              <ChevronDown className={`w-3 h-3 transition-transform ${marketingOpen ? 'rotate-180' : ''}`} />
            </button>

            {marketingOpen && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-fv-border p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <button
                  type="button"
                  onClick={() => { navigate('/admin/coupons'); setMarketingOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-fv-cream dark:hover:bg-gray-700 rounded-lg text-left"
                >
                  <Ticket className="w-3.5 h-3.5 text-fv-primary" />
                  Coupons
                </button>
                <button
                  type="button"
                  onClick={() => { navigate('/admin/banners'); setMarketingOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-fv-cream dark:hover:bg-gray-700 rounded-lg text-left"
                >
                  <Image className="w-3.5 h-3.5 text-fv-primary" />
                  Promo Banners
                </button>
              </div>
            )}
          </div>

          {/* 6. Reviews */}
          <Link
            to="/admin/reviews"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive('/admin/reviews')
                ? 'bg-fv-primary text-white shadow-xs'
                : 'text-gray-700 dark:text-gray-300 hover:bg-fv-cream dark:hover:bg-gray-700'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            Reviews
            {(stats?.pendingReviews || 0) > 0 && (
              <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500 text-white leading-none">
                {stats.pendingReviews}
              </span>
            )}
          </Link>

          {/* 7. Store Settings */}
          <Link
            to="/admin/settings"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isActive('/admin/settings')
                ? 'bg-fv-primary text-white shadow-xs'
                : 'text-gray-700 dark:text-gray-300 hover:bg-fv-cream dark:hover:bg-gray-700'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Settings
          </Link>
        </div>

        {/* Right Section: Notification Bell + View Live Store */}
        <div className="flex items-center gap-3">
          <AdminNotificationBell />

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-fv-muted hover:text-fv-primary hover:bg-fv-cream dark:hover:bg-gray-700 transition-colors"
          >
            <span>View Store</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
