import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Layers,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Smartphone,
  Truck,
  ArrowUp,
  ArrowDown,
  Calendar,
  BarChart2,
  ListOrdered,
  Boxes,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import api from '../../utils/api';

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n) => (n || 0).toLocaleString('en-IN');
const pct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// last 24 calendar months for the month picker
const buildMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return options;
};
const MONTH_OPTIONS = buildMonthOptions();



// ── Main component ─────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    onlineRevenue: 0,
    codRevenue: 0,
    refundedAmount: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    packedOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    cancellationRequests: 0,
    failedPayments: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    pendingReviews: 0,
    todayOrders: 0,
    todayUsers: 0,
    todayRevenue: 0,
    todayOnlineRevenue: 0,
    todayCODRevenue: 0,
    monthRevenue: 0,
    monthOnlineRevenue: 0,
    monthCODRevenue: 0,
    lastMonthRevenue: 0,
    urgentOrders: [],
  });
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [period, setPeriod] = useState('30days');
  const [specificMonth, setSpecificMonth] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [productSort, setProductSort] = useState('revenue'); // 'revenue' | 'units'
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const handleQuickStatusChange = async (orderId, newStatus) => {
    setActionLoadingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      toast.success(`Order status updated to ${newStatus}!`);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickConfirm = async (orderId) => {
    setActionLoadingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: 'Confirmed' });
      toast.success('Order confirmed!');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm order');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickApproveCancel = async (orderId) => {
    setActionLoadingId(orderId);
    try {
      await api.put(`/orders/${orderId}/approve-cancel`);
      toast.success('Cancellation approved! Refund initiated.');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve cancellation');
    } finally {
      setActionLoadingId(null);
    }
  };

  const TABS = [
    { id: 'home',      label: 'Home',      icon: CheckCircle },
    { id: 'orders',    label: 'Orders',    icon: ListOrdered },
    { id: 'revenue',   label: 'Revenue',   icon: DollarSign },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, ordersRes, lowStockRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/orders?limit=10'),
        api.get('/admin/lowstock?threshold=10'),
      ]);
      setStats(statsRes.data.data);
      setRecentOrders(ordersRes.data.data || []);
      setLowStockProducts(lowStockRes.data.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async (p, sm) => {
    setAnalyticsLoading(true);
    try {
      let url = `/admin/analytics?period=${p}`;
      if (p === 'specificmonth' && sm) url += `&year=${sm.year}&month=${sm.month}`;
      const res = await api.get(url);
      setAnalytics(res.data.data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchAnalytics('30days', null);
    const interval = setInterval(fetchDashboardData, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchDashboardData();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchDashboardData, fetchAnalytics]);

  const handlePeriodChange = (p) => {
    if (p === 'specificmonth') {
      setShowMonthPicker(true);
      return;
    }
    setShowMonthPicker(false);
    setSpecificMonth(null);
    setPeriod(p);
    fetchAnalytics(p, null);
  };

  const handleMonthSelect = (opt) => {
    const sm = { year: opt.year, month: opt.month };
    setSpecificMonth(sm);
    setPeriod('specificmonth');
    setShowMonthPicker(false);
    fetchAnalytics('specificmonth', sm);
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Confirmed: 'bg-blue-100 text-blue-800',
      Packed: 'bg-indigo-100 text-indigo-800',
      Shipped: 'bg-purple-100 text-purple-800',
      Delivered: 'bg-fv-cream text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-fv-surface text-fv-heading';
  };

  const getPaymentModeLabel = (mode) =>
    mode === 'Online' ? (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold bg-blue-100 text-blue-700 rounded-full">
        <Smartphone className="w-2.5 h-2.5" />Online
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold bg-orange-100 text-orange-700 rounded-full">
        <Truck className="w-2.5 h-2.5" />COD
      </span>
    );

  const monthGrowth = stats.lastMonthRevenue > 0
    ? Math.round(((stats.monthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)
    : null;

  const monthly12 = analytics?.monthlyRevenue || [];
  const paymentSplit = analytics?.paymentSplit || [];
  const splitOnline = paymentSplit.find((s) => s._id === 'Online')?.revenue || 0;
  const splitCOD = paymentSplit.find((s) => s._id === 'COD')?.revenue || 0;
  const splitTotal = splitOnline + splitCOD;

  const PERIOD_BUTTONS = [
    { id: '7days', label: '7 Days' },
    { id: '30days', label: '30 Days' },
    { id: '90days', label: '90 Days' },
    { id: 'thismonth', label: 'This Month' },
    { id: 'lastmonth', label: 'Last Month' },
    { id: 'yearly', label: 'This Year' },
    { id: 'specificmonth', label: '📅 Pick Month' },
  ];

  const splitOnlineOrders = paymentSplit.find((s) => s._id === 'Online')?.orders || 0;
  const splitCODOrders = paymentSplit.find((s) => s._id === 'COD')?.orders || 0;
  const splitOnlineAvg = paymentSplit.find((s) => s._id === 'Online')?.avgOrderValue || 0;
  const splitCODAvg = paymentSplit.find((s) => s._id === 'COD')?.avgOrderValue || 0;

  const sortedProducts = analytics?.topProducts
    ? [...analytics.topProducts].sort((a, b) =>
        productSort === 'units' ? b.totalSold - a.totalSold : b.revenue - a.revenue
      )
    : [];
  const totalProductRevenue = sortedProducts.reduce((s, p) => s + (p.revenue || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-fv-page ">
        <div className="sticky top-0 z-30 bg-white  border-b border-fv-border  px-4 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-5 bg-gray-200  rounded w-44 animate-pulse" />
              <div className="h-3 bg-fv-surface dark:bg-gray-600 rounded w-64 animate-pulse" />
            </div>
            <div className="h-9 w-24 bg-gray-200  rounded-lg animate-pulse" />
          </div>
          <div className="max-w-7xl mx-auto mt-2 flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 w-24 bg-fv-surface  rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4">
          <div className="h-32 bg-white  rounded-[12px] animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white  rounded-[12px] border border-fv-border  animate-pulse" />
            ))}
          </div>
          <div className="h-28 bg-white  rounded-[12px] animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fv-page  pb-24 md:pb-6">

      {/* ── STICKY HEADER + TABS ── */}
      <div className="sticky top-0 z-30 bg-white  border-b border-fv-border  shadow-sm">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base md:text-lg font-bold text-fv-heading ">Admin Dashboard</h1>
            <p className="text-[11px] text-fv-muted dark:text-fv-muted">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              &nbsp;·&nbsp;Auto-refreshes every 30s
            </p>
          </div>
          <button
            onClick={() => { fetchDashboardData(); fetchAnalytics(period, specificMonth); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-fv-surface  hover:bg-gray-200 dark:hover:bg-gray-600 text-fv-ink  rounded-lg text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="max-w-7xl mx-auto px-3 md:px-6 pb-0 flex gap-0 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => (tab.id === 'orders' ? navigate('/admin/orders') : setActiveTab(tab.id))}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-gray-900 dark:border-white text-fv-heading '
                    : 'border-transparent text-fv-muted  hover:text-fv-ink dark:hover:text-gray-300 hover:border-fv-border dark:hover:border-gray-600'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'orders' && (stats.pendingOrders + stats.cancellationRequests) > 0 && (
                  <span className="ml-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {stats.pendingOrders + stats.cancellationRequests}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 md:p-6">

        {/* ══════════════════════════════════════════════════════
            HOME TAB — Orders Requiring Action Command Center + 8 Clickable KPIs
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'home' && (<>

          {/* 🚨 ORDERS REQUIRING ACTION COMMAND CENTER */}
          <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-200 dark:border-red-900/40 rounded-2xl p-4 md:p-5 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  Orders Requiring Action
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-600 text-white shadow-sm">
                    {(stats.pendingOrders || 0) + (stats.cancellationRequests || 0)} URGENT
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                <span>Fast resolution reduces customer support queries</span>
              </div>
            </div>

            {/* Action pill counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              <Link
                to="/admin/orders?status=Pending"
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  stats.pendingOrders > 0
                    ? 'bg-amber-500/10 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-500/20 shadow-xs'
                    : 'bg-white/60 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold">New Pending</span>
                </div>
                <span className="text-sm font-bold">{stats.pendingOrders || 0}</span>
              </Link>

              <Link
                to="/admin/orders?status=CancellationRequested"
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  stats.cancellationRequests > 0
                    ? 'bg-red-500/10 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200 hover:bg-red-500/20 shadow-xs'
                    : 'bg-white/60 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-xs font-semibold">Cancellation</span>
                </div>
                <span className="text-sm font-bold">{stats.cancellationRequests || 0}</span>
              </Link>

              <Link
                to="/admin/orders?paymentStatus=Failed"
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  stats.failedPayments > 0
                    ? 'bg-rose-500/10 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 hover:bg-rose-500/20'
                    : 'bg-white/60 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-semibold">Failed Pay</span>
                </div>
                <span className="text-sm font-bold">{stats.failedPayments || 0}</span>
              </Link>

              <Link
                to="/admin/products?lowstock=true"
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  (stats.lowStockProducts || 0) + (stats.outOfStockProducts || 0) > 0
                    ? 'bg-orange-500/10 border-orange-300 dark:border-orange-800 text-orange-900 dark:text-orange-200 hover:bg-orange-500/20'
                    : 'bg-white/60 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-semibold">Low/Out Stock</span>
                </div>
                <span className="text-sm font-bold">{(stats.lowStockProducts || 0) + (stats.outOfStockProducts || 0)}</span>
              </Link>
            </div>

            {/* List of Urgent Orders with 1-click Quick Action */}
            {stats.urgentOrders && stats.urgentOrders.length > 0 ? (
              <div className="space-y-2 mt-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 px-1">
                  High Priority Orders
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {stats.urgentOrders.slice(0, 6).map((order) => {
                    const isCancel = order.orderStatus === 'CancellationRequested';
                    return (
                      <div
                        key={order._id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-3 shadow-xs hover:border-gray-300 transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-gray-900 dark:text-white truncate">
                              #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                isCancel
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                              }`}
                            >
                              {isCancel ? 'Cancel Req' : 'Pending'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            <span>{order.customerName || order.user?.name || 'Customer'}</span>
                            <span>•</span>
                            <span className="font-semibold text-gray-700 dark:text-gray-300">₹{order.totalAmount}</span>
                            <span>•</span>
                            <span>{order.paymentMode}</span>
                          </div>
                        </div>

                        {/* 1-Click Action Button */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isCancel ? (
                            <button
                              disabled={actionLoadingId === order._id}
                              onClick={() => handleQuickApproveCancel(order._id)}
                              className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1"
                            >
                              {actionLoadingId === order._id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  Approve Cancel
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              disabled={actionLoadingId === order._id}
                              onClick={() => handleQuickConfirm(order._id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1"
                            >
                              {actionLoadingId === order._id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Confirm
                                </>
                              )}
                            </button>
                          )}
                          <Link
                            to={`/admin/orders`}
                            state={{ focusOrderId: order._id }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            title="View order"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-2 text-right">
                  <Link
                    to="/admin/orders?status=action_required"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                  >
                    View all actionable orders <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-xs font-medium">All caught up! No urgent orders pending administrative action right now.</span>
              </div>
            )}
          </div>

          {/* ── 8 CLICKABLE KPI CONTROL CARDS ── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Store Operations Pulse
              </h2>
              <span className="text-xs text-gray-500 dark:text-gray-400">Click any card to inspect</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Today's Orders",
                  value: stats.todayOrders || 0,
                  icon: ShoppingCart,
                  link: '/admin/orders?period=today',
                  bg: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10',
                  iconColor: 'text-blue-600 dark:text-blue-400',
                  iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                },
                {
                  label: "Today's Revenue",
                  value: `₹${fmt(stats.todayRevenue)}`,
                  icon: TrendingUp,
                  link: null,
                  bg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10',
                  iconColor: 'text-emerald-600 dark:text-emerald-400',
                  iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
                },
                {
                  label: 'Pending Orders',
                  value: stats.pendingOrders || 0,
                  icon: Clock,
                  link: '/admin/orders?status=Pending',
                  badge: stats.pendingOrders > 0,
                  bg: 'hover:bg-amber-50/50 dark:hover:bg-amber-900/10',
                  iconColor: 'text-amber-600 dark:text-amber-400',
                  iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                },
                {
                  label: 'Cancellation Requests',
                  value: stats.cancellationRequests || 0,
                  icon: AlertTriangle,
                  link: '/admin/orders?status=CancellationRequested',
                  badge: stats.cancellationRequests > 0,
                  bg: 'hover:bg-red-50/50 dark:hover:bg-red-900/10',
                  iconColor: 'text-red-600 dark:text-red-400',
                  iconBg: 'bg-red-100 dark:bg-red-900/30',
                },
                {
                  label: 'Low Stock Products',
                  value: stats.lowStockProducts || 0,
                  icon: Boxes,
                  link: '/admin/products?lowstock=true',
                  bg: 'hover:bg-orange-50/50 dark:hover:bg-orange-900/10',
                  iconColor: 'text-orange-600 dark:text-orange-400',
                  iconBg: 'bg-orange-100 dark:bg-orange-900/30',
                },
                {
                  label: 'Out of Stock',
                  value: stats.outOfStockProducts || 0,
                  icon: Package,
                  link: '/admin/products?outofstock=true',
                  bg: 'hover:bg-rose-50/50 dark:hover:bg-rose-900/10',
                  iconColor: 'text-rose-600 dark:text-rose-400',
                  iconBg: 'bg-rose-100 dark:bg-rose-900/30',
                },
                {
                  label: 'Failed Payments',
                  value: stats.failedPayments || 0,
                  icon: CreditCard,
                  link: '/admin/orders?paymentStatus=Failed',
                  bg: 'hover:bg-purple-50/50 dark:hover:bg-purple-900/10',
                  iconColor: 'text-purple-600 dark:text-purple-400',
                  iconBg: 'bg-purple-100 dark:bg-purple-900/30',
                },
                {
                  label: 'New Customers Today',
                  value: stats.todayUsers || 0,
                  icon: Users,
                  link: '/admin/users',
                  bg: 'hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10',
                  iconColor: 'text-indigo-600 dark:text-indigo-400',
                  iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
                },
              ].map((kpi, i) => {
                const content = (
                  <div className={`p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-xs transition-all flex flex-col justify-between h-full ${kpi.bg}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg ${kpi.iconBg} flex items-center justify-center`}>
                        <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
                      </div>
                      {kpi.badge && (
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{kpi.label}</p>
                    </div>
                  </div>
                );

                return kpi.link ? (
                  <Link key={i} to={kpi.link} className="block group">
                    {content}
                  </Link>
                ) : (
                  <div key={i}>{content}</div>
                );
              })}
            </div>
          </div>

          {/* ── TODAY'S REVENUE SNAPSHOT ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-200 dark:border-gray-800 p-4 md:p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Today's Revenue Breakdown</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                Real-time
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3.5">
                <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">Paid Revenue Today</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">₹{fmt(stats.todayRevenue)}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">Delivered & verified</p>
              </div>
              <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl p-3.5">
                <p className="text-xs font-medium text-blue-800 dark:text-blue-300">Online Payments</p>
                <p className="text-xl font-bold text-blue-700 dark:text-blue-400 mt-1">₹{fmt(stats.todayOnlineRevenue)}</p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">Razorpay / UPI</p>
              </div>
              <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl p-3.5">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Cash on Delivery</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400 mt-1">₹{fmt(stats.todayCODRevenue)}</p>
                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Collected upon delivery</p>
              </div>
              <div className="bg-purple-50/70 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 rounded-xl p-3.5">
                <p className="text-xs font-medium text-purple-800 dark:text-purple-300">Total Month Revenue</p>
                <p className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-1">₹{fmt(stats.monthRevenue)}</p>
                <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">Current billing cycle</p>
              </div>
            </div>
          </div>
        </>)}

        {/* ══════════════════════════════════════════════════════
            ORDERS TAB — Status pipeline + Low stock + Recent
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'orders' && (<>

          {/* Order Status Pipeline */}
          <div className="bg-white  rounded-[12px] shadow-sm border border-fv-border  p-4 mb-4">
            <h2 className="text-sm font-semibold text-fv-ink  mb-3">Order Status</h2>
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {[
                { status: 'Pending',   count: stats.pendingOrders,   icon: Clock,         border: 'border-amber-200 dark:border-amber-800',  bg: 'bg-fv-cream',   text: 'text-amber-700 dark:text-amber-400',   iconColor: 'text-amber-500' },
                { status: 'Confirmed', count: stats.confirmedOrders, icon: CheckCircle,   border: 'border-blue-200 dark:border-blue-800',    bg: 'bg-fv-cream',     text: 'text-blue-700 dark:text-blue-400',     iconColor: 'text-blue-500' },
                { status: 'Shipped',   count: stats.shippedOrders,   icon: Truck,         border: 'border-purple-200 dark:border-purple-800', bg: 'bg-fv-cream', text: 'text-purple-700 dark:text-purple-400', iconColor: 'text-purple-500' },
                { status: 'Delivered', count: stats.deliveredOrders, icon: CheckCircle,   border: 'border-green-200 dark:border-green-800',  bg: 'bg-fv-cream',   text: 'text-fv-primary-dark dark:text-green-400',   iconColor: 'text-green-500' },
                { status: 'Cancelled', count: stats.cancelledOrders, icon: AlertCircle,   border: 'border-red-200 dark:border-red-800',      bg: 'bg-fv-cream',       text: 'text-red-700 dark:text-red-400',       iconColor: 'text-red-500' },
              ].map(({ status, count, icon: Icon, border, bg, text, iconColor }) => (
                <Link key={status} to={`/admin/orders?status=${status}`} className="flex-shrink-0">
                  <div className={`${bg} border ${border} rounded-[12px] p-3.5 min-w-[108px] hover: transition-all`}>
                    <Icon className={`w-5 h-5 ${iconColor} mb-2`} />
                    <p className={`text-2xl font-bold ${text}`}>{count || 0}</p>
                    <p className="text-xs text-fv-muted  mt-0.5">{status}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-[12px] p-4 mb-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Low Stock Alert</h3>
                  <span className="text-xs bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 font-semibold px-2 py-0.5 rounded-full">{lowStockProducts.length}</span>
                </div>
                <Link to="/admin/products" className="text-xs text-red-700 dark:text-red-400 font-semibold hover:underline">View all →</Link>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {lowStockProducts.slice(0, 6).map((product) => (
                  <div key={product._id} className="flex-shrink-0 bg-white  border border-red-100 dark:border-red-900/30 rounded-lg px-3 py-2 shadow-sm min-w-[140px]">
                    <p className="text-xs font-semibold text-fv-heading  truncate mb-1">{product.name}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">⚠ Only {product.stock} left</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white  rounded-[12px] shadow-sm border border-fv-border  overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-fv-border ">
              <div>
                <h2 className="text-sm font-bold text-fv-heading ">Recent Orders</h2>
                <p className="text-[11px] text-fv-muted dark:text-fv-muted">{recentOrders.length} latest</p>
              </div>
              <Link
                to="/admin/orders"
                className="rounded-[50px] bg-fv-cream px-3 py-1.5 text-xs font-semibold text-fv-primary transition-colors hover:bg-fv-border/40"
              >
                View all →
              </Link>
            </div>
            <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-2 bg-fv-page /50 text-[11px] font-semibold text-fv-muted uppercase tracking-wide border-b border-fv-border ">
              <span className="col-span-2">Order ID</span>
              <span className="col-span-3">Customer</span>
              <span className="col-span-2">Date</span>
              <span className="col-span-2">Amount</span>
              <span className="col-span-2">Status</span>
              <span className="col-span-1">Pay</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {recentOrders.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center px-4">
                  <ShoppingCart className="w-8 h-8 text-gray-300 dark:text-fv-muted mb-2" />
                  <p className="text-sm font-medium text-fv-muted dark:text-fv-muted">No orders yet</p>
                  <p className="text-xs text-gray-300 dark:text-fv-muted mt-1">Orders will appear here once customers place them</p>
                </div>
              ) : (
                (showAllOrders ? recentOrders : recentOrders.slice(0, 5)).map((order) => (
                  <Link key={order._id} to="/admin/orders" className="block">
                    {/* Mobile card */}
                    <div className="md:hidden p-3 hover:bg-fv-page /30 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-semibold text-fv-heading ">
                          #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {order.paymentMode && getPaymentModeLabel(order.paymentMode)}
                          <select
                            value={order.orderStatus}
                            disabled={actionLoadingId === order._id}
                            onChange={(e) => {
                              e.preventDefault();
                              handleQuickStatusChange(order._id, e.target.value);
                            }}
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border cursor-pointer focus:outline-none ${getStatusColor(order.orderStatus)}`}
                            title="Quick change status"
                          >
                            {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                            {order.orderStatus === 'CancellationRequested' && (
                              <option value="CancellationRequested" disabled>CancellationRequested</option>
                            )}
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-fv-ink ">{order.userId?.name || 'Guest'}</p>
                          <p className="text-xs text-fv-muted">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-fv-heading ">₹{fmt(order.totalAmount)}</p>
                          <p className={`text-[10px] font-medium ${
                            order.paymentStatus === 'Paid'     ? 'text-fv-primary'
                            : order.paymentStatus === 'Refunded' ? 'text-amber-500'
                            : order.paymentStatus === 'Failed'   ? 'text-red-500'
                            : 'text-fv-muted'
                          }`}>{order.paymentStatus || 'Pending'}</p>
                        </div>
                      </div>
                    </div>
                    {/* Desktop row */}
                    <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-3 hover:bg-fv-page /30 transition-colors items-center text-xs">
                      <span className="col-span-2 font-mono font-semibold text-fv-heading ">
                        #{order._id.slice(-6).toUpperCase()}
                      </span>
                      <span className="col-span-3 font-medium text-fv-ink  truncate">{order.userId?.name || 'Guest'}</span>
                      <span className="col-span-2 text-fv-muted ">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="col-span-2 font-bold text-fv-heading ">₹{fmt(order.totalAmount)}</span>
                      <div className="col-span-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={order.orderStatus}
                          disabled={actionLoadingId === order._id}
                          onChange={(e) => {
                            e.preventDefault();
                            handleQuickStatusChange(order._id, e.target.value);
                          }}
                          className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border cursor-pointer focus:outline-none ${getStatusColor(order.orderStatus)}`}
                          title="Quick change status"
                        >
                          {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                          {order.orderStatus === 'CancellationRequested' && (
                            <option value="CancellationRequested" disabled>CancellationRequested</option>
                          )}
                        </select>
                      </div>
                      <span className="col-span-1">{getPaymentModeLabel(order.paymentMode)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {recentOrders.length > 5 && (
              <div className="px-4 py-3 border-t border-fv-border  flex items-center justify-between">
                <button
                  onClick={() => setShowAllOrders(v => !v)}
                  className="text-xs font-medium text-fv-muted  hover:text-fv-heading dark:hover:text-white transition-colors"
                >
                  {showAllOrders ? '↑ Show fewer' : `↓ Show ${recentOrders.length - 5} more`}
                </button>
                <Link to="/admin/orders" className="text-xs font-semibold text-fv-primary hover:underline">
                  View all {stats.totalOrders} orders →
                </Link>
              </div>
            )}
          </motion.div>

        </>)}

        {/* ══════════════════════════════════════════════════════
            REVENUE TAB — All-time cards + Month split + Breakdown
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'revenue' && (<>

          {/* All-time revenue cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.0 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-[12px] p-4 shadow text-white"
            >
              <div className="flex items-start justify-between mb-3">
                <TrendingUp className="w-5 h-5 text-green-100" />
                <span className="text-[10px] font-semibold bg-white/20 rounded-full px-2 py-0.5">All-time</span>
              </div>
              <p className="text-xl font-bold">₹{fmt(stats.totalRevenue)}</p>
              <p className="text-xs text-green-100 mt-1">Total Paid Revenue</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[12px] p-4 shadow text-white"
            >
              <div className="flex items-start justify-between mb-3">
                <Smartphone className="w-5 h-5 text-blue-100" />
                <span className="text-[10px] font-semibold bg-white/20 rounded-full px-2 py-0.5">{pct(stats.onlineRevenue, stats.onlineRevenue + stats.codRevenue)}%</span>
              </div>
              <p className="text-xl font-bold">₹{fmt(stats.onlineRevenue)}</p>
              <p className="text-xs text-blue-100 mt-1">Online (Razorpay)</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-[12px] p-4 shadow text-white"
            >
              <div className="flex items-start justify-between mb-3">
                <Truck className="w-5 h-5 text-amber-100" />
                <span className="text-[10px] font-semibold bg-white/20 rounded-full px-2 py-0.5">{pct(stats.codRevenue, stats.onlineRevenue + stats.codRevenue)}%</span>
              </div>
              <p className="text-xl font-bold">₹{fmt(stats.codRevenue)}</p>
              <p className="text-xs text-amber-100 mt-1">Cash on Delivery</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
              className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-[12px] p-4 shadow text-white"
            >
              <div className="flex items-start justify-between mb-3">
                <Calendar className="w-5 h-5 text-purple-100" />
                {monthGrowth !== null && (
                  <span className="text-[10px] font-semibold flex items-center gap-0.5 bg-white/20 rounded-full px-2 py-0.5">
                    {monthGrowth >= 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                    {Math.abs(monthGrowth)}%
                  </span>
                )}
              </div>
              <p className="text-xl font-bold">₹{fmt(stats.monthRevenue)}</p>
              <p className="text-xs text-purple-100 mt-1">This Month</p>
            </motion.div>
          </div>

          {/* This Month split */}
          <div className="bg-white  rounded-[12px] shadow-sm border border-fv-border  p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-fv-ink ">This Month — Payment Split</h2>
              {monthGrowth !== null && (
                <span className={`text-xs font-semibold flex items-center gap-0.5 px-2.5 py-1 rounded-full ${
                  monthGrowth >= 0
                    ? 'bg-fv-cream text-fv-primary-dark dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                }`}>
                  {monthGrowth >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                  {Math.abs(monthGrowth)}% vs last month
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 rounded-[12px] p-3 text-center">
                <Smartphone className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
                <p className="text-base font-bold text-blue-700 dark:text-blue-300">₹{fmt(stats.monthOnlineRevenue)}</p>
                <p className="text-[11px] text-blue-600 dark:text-blue-500 font-medium mt-0.5">Online</p>
                <p className="text-[10px] text-fv-muted">{pct(stats.monthOnlineRevenue, stats.monthRevenue)}% share</p>
              </div>
              <div className="border border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 rounded-[12px] p-3 text-center">
                <Truck className="w-4 h-4 text-amber-500 mx-auto mb-1.5" />
                <p className="text-base font-bold text-amber-700 dark:text-amber-300">₹{fmt(stats.monthCODRevenue)}</p>
                <p className="text-[11px] text-amber-600 dark:text-amber-500 font-medium mt-0.5">COD</p>
                <p className="text-[10px] text-fv-muted">{pct(stats.monthCODRevenue, stats.monthRevenue)}% share</p>
              </div>
              <div className="border border-green-100 dark:border-green-900/30 bg-fv-cream dark:bg-green-900/10 rounded-[12px] p-3 text-center">
                <TrendingUp className="w-4 h-4 text-fv-primary mx-auto mb-1.5" />
                <p className="text-base font-bold text-fv-primary-dark dark:text-green-300">₹{fmt(stats.monthRevenue)}</p>
                <p className="text-[11px] text-fv-primary dark:text-green-500 font-medium mt-0.5">Total</p>
                {monthGrowth !== null && (
                  <p className={`text-[10px] flex items-center justify-center gap-0.5 ${monthGrowth >= 0 ? 'text-green-500' : 'text-red-400'}`}>
                    {monthGrowth >= 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                    {Math.abs(monthGrowth)}%
                  </p>
                )}
              </div>
            </div>
            {stats.refundedAmount > 0 && (
              <p className="text-xs text-red-500 font-medium mt-3 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Refunded all-time: ₹{fmt(stats.refundedAmount)}
              </p>
            )}
          </div>

          {/* Revenue Breakdown by period */}
          <div className="bg-white  rounded-[12px] shadow-sm border border-fv-border  p-4 mb-4">
            <h2 className="text-sm font-semibold text-fv-ink  mb-3">Revenue by Period</h2>
            <div className="flex gap-1.5 flex-wrap mb-4 relative">
              {PERIOD_BUTTONS.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handlePeriodChange(btn.id)}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                    period === btn.id
                      ? 'bg-gray-900 dark:bg-fv-surface text-white dark:text-fv-heading border-gray-900 dark:border-fv-border shadow-sm'
                      : 'bg-white  text-fv-muted  border-fv-border  hover:border-gray-400 dark:hover:border-gray-400'
                  }`}
                >
                  {btn.id === 'specificmonth' && specificMonth
                    ? MONTH_OPTIONS.find((o) => o.year === specificMonth.year && o.month === specificMonth.month)?.label || '📅 Pick Month'
                    : btn.label}
                </button>
              ))}
              {showMonthPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white  border border-fv-border  rounded-[12px] shadow-[0_18px_40px_rgba(10,76,54,0.10)] z-20 max-h-56 overflow-y-auto min-w-[160px]">
                  {MONTH_OPTIONS.map((opt) => (
                    <button
                      key={`${opt.year}-${opt.month}`}
                      onClick={() => handleMonthSelect(opt)}
                      className="w-full text-left px-4 py-2 text-xs text-fv-ink  hover:bg-fv-page "
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {analyticsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-14 bg-fv-surface  rounded-[12px] animate-pulse" />
                ))}
              </div>
            ) : splitTotal > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-[12px] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-500 rounded-[12px] flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Online (Razorpay)</p>
                      <p className="text-[11px] text-fv-muted ">{splitOnlineOrders} orders · avg ₹{fmt(Math.round(splitOnlineAvg))}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-blue-700 dark:text-blue-300">₹{fmt(splitOnline)}</p>
                    <span className="text-[11px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      {pct(splitOnline, splitTotal)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-[12px] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-500 rounded-[12px] flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Cash on Delivery</p>
                      <p className="text-[11px] text-fv-muted ">{splitCODOrders} orders · avg ₹{fmt(Math.round(splitCODAvg))}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-amber-700 dark:text-amber-300">₹{fmt(splitCOD)}</p>
                    <span className="text-[11px] font-semibold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">
                      {pct(splitCOD, splitTotal)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-fv-cream dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-[12px] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-fv-primary rounded-[12px] flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-fv-primary-dark dark:text-green-300">Total Revenue</p>
                      <p className="text-[11px] text-fv-muted ">{splitOnlineOrders + splitCODOrders} orders total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-fv-primary-dark dark:text-green-300">₹{fmt(splitTotal)}</p>
                    <span className="text-[11px] font-semibold bg-fv-cream dark:bg-green-900/30 text-fv-primary dark:text-green-400 px-2 py-0.5 rounded-full">100%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <DollarSign className="w-8 h-8 text-gray-300 dark:text-fv-muted mb-2" />
                <p className="text-sm font-medium text-fv-muted dark:text-fv-muted">No paid revenue in this period</p>
                <p className="text-xs text-gray-300 dark:text-fv-muted mt-1">Try selecting a different time range</p>
              </div>
            )}
          </div>

          {/* Last 12 months table */}
          {monthly12.length > 0 && (
            <div className="bg-white  rounded-[12px] shadow-sm border border-fv-border  overflow-hidden mb-4">
              <div className="flex items-center justify-between px-4 py-3 border-b border-fv-border ">
                <h2 className="text-sm font-semibold text-fv-ink ">Last 12 Months</h2>
                {monthly12.length > 6 && (
                  <button
                    onClick={() => setShowAllMonths(v => !v)}
                    className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    {showAllMonths ? 'Show fewer ↑' : `Show all ${monthly12.length} months ↓`}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-fv-page /50 text-[11px] font-semibold text-fv-muted dark:text-fv-muted uppercase tracking-wide border-b border-fv-border ">
                <span>Month</span>
                <span className="text-right text-blue-500">Online</span>
                <span className="text-right text-amber-500">COD</span>
                <span className="text-right text-fv-primary">Total</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {(showAllMonths ? monthly12 : monthly12.slice(0, 6)).map((m, i) => {
                  const online = m.onlineRevenue || 0;
                  const cod = m.codRevenue || 0;
                  const total = online + cod;
                  const monthLabel = new Date(m._id?.year, (m._id?.month || 1) - 1, 1)
                    .toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                  return (
                    <div key={i} className="grid grid-cols-4 gap-2 px-4 py-2.5 hover:bg-fv-page /30 transition-colors text-xs">
                      <span className="font-medium text-fv-ink ">{monthLabel}</span>
                      <span className="text-right font-semibold text-blue-600 dark:text-blue-400">₹{fmt(online)}</span>
                      <span className="text-right font-semibold text-amber-600 dark:text-amber-400">₹{fmt(cod)}</span>
                      <span className="text-right font-bold text-fv-primary-dark dark:text-green-400">₹{fmt(total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </>)}

        {/* ══════════════════════════════════════════════════════
            ANALYTICS TAB — Period picker + Top products + Categories
        ══════════════════════════════════════════════════════ */}
        {activeTab === 'analytics' && (<>

          {/* Period picker — now lives in Analytics tab */}
          <div className="bg-white  rounded-[12px] shadow-sm border border-fv-border  p-4 mb-4">
            <h2 className="text-sm font-semibold text-fv-ink  mb-3">Select Period</h2>
            <div className="flex gap-1.5 flex-wrap relative">
              {PERIOD_BUTTONS.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handlePeriodChange(btn.id)}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-all ${
                    period === btn.id
                      ? 'bg-gray-900 dark:bg-fv-surface text-white dark:text-fv-heading border-gray-900 dark:border-fv-border shadow-sm'
                      : 'bg-white  text-fv-muted  border-fv-border  hover:border-gray-400 dark:hover:border-gray-400'
                  }`}
                >
                  {btn.id === 'specificmonth' && specificMonth
                    ? MONTH_OPTIONS.find((o) => o.year === specificMonth.year && o.month === specificMonth.month)?.label || '📅 Pick Month'
                    : btn.label}
                </button>
              ))}
              {showMonthPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white  border border-fv-border  rounded-[12px] shadow-[0_18px_40px_rgba(10,76,54,0.10)] z-20 max-h-56 overflow-y-auto min-w-[160px]">
                  {MONTH_OPTIONS.map((opt) => (
                    <button
                      key={`${opt.year}-${opt.month}`}
                      onClick={() => handleMonthSelect(opt)}
                      className="w-full text-left px-4 py-2 text-xs text-fv-ink  hover:bg-fv-page "
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {analyticsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="h-64 bg-white  rounded-[12px] animate-pulse" />
              <div className="h-64 bg-white  rounded-[12px] animate-pulse" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

              {/* Top Products */}
              <div className="bg-white  rounded-[12px] shadow-sm border border-fv-border  overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-fv-border ">
                  <h2 className="text-sm font-semibold text-fv-ink ">Top Products</h2>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setProductSort('revenue')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                        productSort === 'revenue'
                          ? 'bg-gray-900 dark:bg-fv-surface text-white dark:text-fv-heading border-gray-900 dark:border-fv-border'
                          : 'bg-white  text-fv-muted  border-fv-border  hover:border-gray-400'
                      }`}
                    >
                      <DollarSign className="w-3 h-3" /> Revenue
                    </button>
                    <button
                      onClick={() => setProductSort('units')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                        productSort === 'units'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white  text-fv-muted  border-fv-border  hover:border-gray-400'
                      }`}
                    >
                      <Package className="w-3 h-3" /> Units
                    </button>
                  </div>
                </div>
                {sortedProducts.length > 0 ? (
                  <>
                    <div className="grid grid-cols-12 gap-1 px-4 py-2 bg-fv-page /50 text-[10px] font-semibold text-fv-muted uppercase tracking-wide border-b border-fv-border ">
                      <span className="col-span-1">#</span>
                      <span className="col-span-5">Product</span>
                      <span className="col-span-3 text-right">Revenue</span>
                      <span className="col-span-2 text-right">Units</span>
                      <span className="col-span-1 text-right">%</span>
                    </div>
                    <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {sortedProducts.slice(0, 8).map((p, i) => (
                        <div key={p._id || i} className="grid grid-cols-12 gap-1 px-4 py-2.5 hover:bg-fv-page /30 transition-colors text-xs items-center">
                          <span className="col-span-1 text-fv-muted font-bold">{i + 1}</span>
                          <span className="col-span-5 font-medium text-fv-ink  truncate">{p.name || p._id}</span>
                          <span className="col-span-3 text-right font-semibold text-fv-primary-dark dark:text-green-400">₹{fmt(p.revenue)}</span>
                          <span className="col-span-2 text-right text-fv-muted ">{p.totalSold}</span>
                          <span className="col-span-1 text-right text-[10px] text-fv-muted">{pct(p.revenue, totalProductRevenue)}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-10 text-center px-4">
                    <Package className="w-7 h-7 text-gray-300 dark:text-fv-muted mb-2" />
                    <p className="text-sm text-fv-muted dark:text-fv-muted">No product data for this period</p>
                    <p className="text-xs text-gray-300 dark:text-fv-muted mt-1">Try a wider time range above</p>
                  </div>
                )}
              </div>

              {/* Category Revenue */}
              <div className="bg-white  rounded-[12px] shadow-sm border border-fv-border  overflow-hidden">
                <div className="px-4 py-3 border-b border-fv-border ">
                  <h2 className="text-sm font-semibold text-fv-ink ">Revenue by Category</h2>
                </div>
                {analytics?.categoryRevenue?.length > 0 ? (() => {
                  const totalCatRev = analytics.categoryRevenue.reduce((s, c) => s + (c.revenue || 0), 0);
                  return (
                    <>
                      <div className="grid grid-cols-12 gap-1 px-4 py-2 bg-fv-page /50 text-[10px] font-semibold text-fv-muted uppercase tracking-wide border-b border-fv-border ">
                        <span className="col-span-1">#</span>
                        <span className="col-span-6">Category</span>
                        <span className="col-span-3 text-right">Revenue</span>
                        <span className="col-span-2 text-right">Share</span>
                      </div>
                      <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                        {analytics.categoryRevenue.map((c, i) => (
                          <div key={c._id || i} className="grid grid-cols-12 gap-1 px-4 py-2.5 hover:bg-fv-page /30 transition-colors text-xs items-center">
                            <span className="col-span-1 text-fv-muted font-bold">{i + 1}</span>
                            <span className="col-span-6 font-medium text-fv-ink  truncate">{c._id || 'Uncategorized'}</span>
                            <span className="col-span-3 text-right font-semibold text-blue-700 dark:text-blue-400">₹{fmt(c.revenue)}</span>
                            <span className="col-span-2 text-right">
                              <span className="text-[10px] font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full">
                                {pct(c.revenue, totalCatRev)}%
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })() : (
                  <div className="flex flex-col items-center py-10 text-center px-4">
                    <Layers className="w-7 h-7 text-gray-300 dark:text-fv-muted mb-2" />
                    <p className="text-sm text-fv-muted dark:text-fv-muted">No category data for this period</p>
                    <p className="text-xs text-gray-300 dark:text-fv-muted mt-1">Try a wider time range above</p>
                  </div>
                )}
              </div>

            </div>
          )}

        </>)}

      </div>
    </div>
  );
};

export default AdminDashboard;
