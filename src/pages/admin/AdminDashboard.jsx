import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Bell,
  Tag,
  Image,
  Star,
  ChevronRight,
  RefreshCw,
  Layers
} from 'lucide-react';
import api from '../../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    lowStockProducts: 0,
    pendingReviews: 0,
    todayOrders: 0,
    todayRevenue: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, ordersRes, lowStockRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/orders?limit=5'),
        api.get('/admin/lowstock?threshold=10')
      ]);
      
      setStats(statsRes.data.data);
      setRecentOrders(ordersRes.data.data || []);
      setLowStockProducts(lowStockRes.data.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Confirmed: 'bg-blue-100 text-blue-800',
      Packed: 'bg-indigo-100 text-indigo-800',
      Shipped: 'bg-purple-100 text-purple-800',
      Delivered: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 md:p-6 pb-24 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Welcome back, Admin!
            </p>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* NEW ORDERS ALERT - Prominent on mobile */}
        {stats.pendingOrders > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Link to="/admin/orders?status=Pending">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Bell className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">
                        {stats.pendingOrders} New Order{stats.pendingOrders !== 1 ? 's' : ''}!
                      </p>
                      <p className="text-orange-100 text-sm">
                        Tap to view & process
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Quick Stats - Mobile optimized 2x2 grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Link to="/admin/orders">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalOrders}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Orders</p>
            </motion.div>
          </Link>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              ₹{stats.totalRevenue?.toLocaleString('en-IN') || 0}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Revenue</p>
          </motion.div>

          <Link to="/admin/products">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Package className="w-4 h-4 text-orange-600" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalProducts}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Products</p>
            </motion.div>
          </Link>

          <Link to="/admin/users">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-3 md:p-4 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalUsers}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Users</p>
            </motion.div>
          </Link>
        </div>

        {/* Order Status Summary - Mobile horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 mb-4 -mx-3 px-3 md:mx-0 md:px-0 scrollbar-hide">
          <Link to="/admin/orders?status=Pending" className="flex-shrink-0">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-3 min-w-[120px]">
              <Clock className="w-5 h-5 text-yellow-600 mb-1" />
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pendingOrders}</p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">Pending</p>
            </div>
          </Link>
          <Link to="/admin/orders?status=Confirmed" className="flex-shrink-0">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 min-w-[120px]">
              <CheckCircle className="w-5 h-5 text-blue-600 mb-1" />
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.confirmedOrders || 0}</p>
              <p className="text-xs text-blue-600 dark:text-blue-500">Confirmed</p>
            </div>
          </Link>
          <Link to="/admin/orders?status=Delivered" className="flex-shrink-0">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 min-w-[120px]">
              <CheckCircle className="w-5 h-5 text-green-600 mb-1" />
              <p className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.deliveredOrders}</p>
              <p className="text-xs text-green-600 dark:text-green-500">Delivered</p>
            </div>
          </Link>
          <Link to="/admin/orders?status=Cancelled" className="flex-shrink-0">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 min-w-[120px]">
              <AlertCircle className="w-5 h-5 text-red-600 mb-1" />
              <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.cancelledOrders || 0}</p>
              <p className="text-xs text-red-600 dark:text-red-500">Cancelled</p>
            </div>
          </Link>
        </div>

        {/* Quick Actions Grid - Mobile optimized */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {[
              { icon: Package, label: 'Products', path: '/admin/products', color: 'text-blue-600 bg-blue-50' },
              { icon: ShoppingCart, label: 'Orders', path: '/admin/orders', color: 'text-orange-600 bg-orange-50' },
              { icon: Layers, label: 'Categories', path: '/admin/categories', color: 'text-green-600 bg-green-50' },
              { icon: Tag, label: 'Combos', path: '/admin/combos', color: 'text-purple-600 bg-purple-50' },
              { icon: Users, label: 'Users', path: '/admin/users', color: 'text-indigo-600 bg-indigo-50' },
              { icon: Tag, label: 'Coupons', path: '/admin/coupons', color: 'text-pink-600 bg-pink-50' },
              { icon: Star, label: 'Reviews', path: '/admin/reviews', color: 'text-yellow-600 bg-yellow-50', badge: stats.pendingReviews },
              { icon: Image, label: 'Banners', path: '/admin/banners', color: 'text-cyan-600 bg-cyan-50' },
            ].map((item, index) => (
              <Link key={item.path} to={item.path}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all relative"
                >
                  <div className={`w-10 h-10 rounded-lg ${item.color} dark:bg-opacity-20 flex items-center justify-center`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                    {item.label}
                  </span>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-bold text-red-800 dark:text-red-300">
                Low Stock Alert ({lowStockProducts.length})
              </h3>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product._id} className="flex-shrink-0 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm min-w-[140px]">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate mb-1">
                    {product.name}
                  </p>
                  <p className="text-xs text-red-600 font-medium">
                    Only {product.stock} left
                  </p>
                </div>
              ))}
            </div>
            <Link to="/admin/products" className="text-xs text-red-700 dark:text-red-400 font-medium">
              View all →
            </Link>
          </motion.div>
        )}

        {/* Recent Orders - Mobile Card View */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-3 md:p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
              Recent Orders
            </h2>
            <Link to="/admin/orders" className="text-xs text-blue-600 font-medium">
              View all →
            </Link>
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentOrders.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                No orders yet
              </div>
            ) : (
              recentOrders.map((order) => (
                <Link key={order._id} to="/admin/orders" className="block">
                  <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-medium text-gray-900 dark:text-white">
                        #{order._id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {order.userId?.name || 'Guest'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        ₹{order.totalAmount}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
