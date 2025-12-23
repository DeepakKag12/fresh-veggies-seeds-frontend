import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`,
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-600',
      link: '/admin/orders',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      change: '+8.2%',
      isPositive: true,
      icon: ShoppingCart,
      color: 'from-blue-500 to-cyan-600',
      link: '/admin/orders',
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      change: '+3',
      isPositive: true,
      icon: Package,
      color: 'from-orange-500 to-amber-600',
      link: '/admin/products',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: '+15',
      isPositive: true,
      icon: Users,
      color: 'from-purple-500 to-pink-600',
      link: '/admin/users',
    },
  ];

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your store today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={stat.link}>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.isPositive ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {stat.change}
                    </div>
                  </div>
                  <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                    {stat.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Order Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Orders
              </h3>
            </div>
            <p className="text-3xl font-bold text-yellow-600 mb-2">
              {stats.pendingOrders}
            </p>
            <Link to="/admin/orders?status=Pending" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all pending →
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delivered Orders
              </h3>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-2">
              {stats.deliveredOrders}
            </p>
            <Link to="/admin/orders?status=Delivered" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all delivered →
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Completion Rate
              </h3>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {stats.totalOrders > 0 ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Of all orders completed
            </p>
          </motion.div>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-xl mb-8"
          >
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2">
                  ⚠️ Low Stock Alert!
                </h3>
                <p className="text-red-700 dark:text-red-400 mb-3">
                  {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's are' : ' is'} running low on stock
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {lowStockProducts.slice(0, 6).map((product) => (
                    <div key={product._id} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {product.categoryId?.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-red-600">
                          Only {product.stock} left
                        </span>
                        <Link 
                          to="/admin/products"
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Restock →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
                {lowStockProducts.length > 6 && (
                  <Link 
                    to="/admin/products?filter=lowstock"
                    className="inline-block mt-4 text-sm text-red-700 dark:text-red-400 hover:text-red-800 font-medium"
                  >
                    View all {lowStockProducts.length} products →
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Orders
              </h2>
              <Link
                to="/admin/orders"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all →
              </Link>
            </div>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          #{order._id.slice(-8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {order.userId?.name || 'Guest'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          ₹{order.totalAmount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/admin/orders`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No orders yet
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="space-y-1 mb-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Customer:</span> {order.userId?.name || 'Guest'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      <span className="font-medium">Total:</span> ₹{order.totalAmount}
                    </p>
                  </div>
                  <Link
                    to={`/admin/orders`}
                    className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-3 md:gap-4"
        >
          <Link
            to="/admin/products"
            className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2"
          >
            <Package className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white text-center">
              Products
            </span>
          </Link>
          <Link
            to="/admin/orders"
            className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2"
          >
            <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
            <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white text-center">
              Orders
            </span>
          </Link>
          <Link
            to="/admin/coupons"
            className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2"
          >
            <Package className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white text-center">
              Coupons
            </span>
          </Link>
          <Link
            to="/admin/reviews"
            className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
            <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white text-center">
              Reviews
              {stats.pendingReviews > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {stats.pendingReviews}
                </span>
              )}
            </span>
          </Link>
          <Link
            to="/admin/banners"
            className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2"
          >
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white text-center">
              Banners
            </span>
          </Link>
          <Link
            to="/admin/categories"
            className="bg-white dark:bg-gray-800 rounded-lg p-3 md:p-4 shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2"
          >
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white text-center">
              Categories
            </span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
