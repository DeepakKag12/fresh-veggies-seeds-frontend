import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

export function useAdminDashboard() {
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
  const [productSort, setProductSort] = useState('revenue');
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, ordersRes, lowStockRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/orders?limit=10'),
        api.get('/admin/lowstock?threshold=10'),
      ]);
      setStats(statsRes.data?.data || {});
      setRecentOrders(ordersRes.data?.data || []);
      setLowStockProducts(lowStockRes.data?.data || []);
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
      setAnalytics(res.data?.data || null);
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

  return {
    stats,
    actionLoadingId,
    recentOrders,
    lowStockProducts,
    analytics,
    loading,
    analyticsLoading,
    period,
    specificMonth,
    showMonthPicker,
    setShowMonthPicker,
    productSort,
    setProductSort,
    showAllOrders,
    setShowAllOrders,
    activeTab,
    setActiveTab,
    fetchDashboardData,
    fetchAnalytics,
    handlePeriodChange,
    handleMonthSelect,
    handleQuickStatusChange,
    handleQuickConfirm,
    handleQuickApproveCancel,
  };
}
