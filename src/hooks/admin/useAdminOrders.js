import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const LIMIT = 20;

export function useAdminOrders() {
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [orderCounts, setOrderCounts] = useState(null);
  const [searchParams] = useSearchParams();

  // History deletion confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    orderId: null,
    historyId: null,
    bulkIds: null,
    title: '',
    message: ''
  });
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);

  const fetchStats = useCallback(() => {
    api.get('/admin/stats')
      .then(r => setOrderCounts(r.data?.data || null))
      .catch(() => {});
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (statusFilter && statusFilter !== 'All') {
        params.set('status', statusFilter);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      if (paymentFilter) {
        params.set('paymentStatus', paymentFilter);
      }
      const period = searchParams.get('period');
      if (period) {
        params.set('period', period);
      }

      const response = await api.get(`/orders?${params.toString()}`);
      const ordersData = response.data?.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setTotalPages(response.data?.totalPages || 1);
      setTotal(response.data?.total || ordersData.length);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchQuery, paymentFilter, searchParams]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    const paymentFromUrl = searchParams.get('paymentStatus');
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
      setPage(1);
    }
    if (paymentFromUrl) {
      setPaymentFilter(paymentFromUrl);
      setPage(1);
    }
  }, [searchParams]);

  // In-place reactive status update (zero full page reload)
  const handleUpdateStatus = async (orderId, newStatus, note) => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { orderStatus: newStatus, note });
      const updatedOrder = res.data?.data;
      if (updatedOrder) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...updatedOrder } : o));
      } else {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
      }
      toast.success(`Order moved to ${newStatus}!`);
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleApproveCancel = async (orderId) => {
    try {
      const res = await api.put(`/orders/${orderId}/approve-cancel`);
      const updatedOrder = res.data?.data;
      if (updatedOrder) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...updatedOrder } : o));
      } else {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: 'Cancelled' } : o));
      }
      toast.success('Cancellation approved! Refund initiated.');
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve cancellation');
    }
  };

  const handleRejectCancel = async (orderId, rejectionReason) => {
    try {
      const res = await api.put(`/orders/${orderId}/reject-cancel`, { rejectionReason });
      const updatedOrder = res.data?.data;
      if (updatedOrder) {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...updatedOrder } : o));
      }
      toast.success('Cancellation request rejected.');
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject cancellation');
    }
  };

  const promptDeleteHistoryItem = (orderId, historyId) => {
    setDeleteModal({
      isOpen: true,
      orderId,
      historyId,
      bulkIds: null,
      title: 'Delete Status History Entry',
      message: 'Are you sure you want to permanently delete this audit log entry from the order history?'
    });
  };

  const promptBulkDeleteHistory = (orderId, bulkIds) => {
    setDeleteModal({
      isOpen: true,
      orderId,
      historyId: null,
      bulkIds,
      title: `Delete ${bulkIds.length} History Entries`,
      message: `Are you sure you want to permanently delete these ${bulkIds.length} selected audit log entries?`
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, orderId: null, historyId: null, bulkIds: null, title: '', message: '' });
  };

  const confirmDeleteHistory = async () => {
    const { orderId, historyId, bulkIds } = deleteModal;
    setIsDeletingHistory(true);
    try {
      if (bulkIds && bulkIds.length > 0) {
        const res = await api.post(`/orders/${orderId}/history/bulk-delete`, { historyIds: bulkIds });
        const newHistory = res.data?.data || [];
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, statusHistory: newHistory } : o));
        toast.success(`${bulkIds.length} audit log entries removed`);
      } else if (historyId) {
        const res = await api.delete(`/orders/${orderId}/history/${historyId}`);
        const newHistory = res.data?.data || [];
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, statusHistory: newHistory } : o));
        toast.success('Status history entry removed');
      }
    } catch (error) {
      console.error('Failed to delete history item:', error);
      toast.error(error.response?.data?.message || 'Failed to delete history entry');
    } finally {
      setIsDeletingHistory(false);
      closeDeleteModal();
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  };

  const stats = useMemo(() => ({
    all:                  orderCounts?.totalOrders          ?? total,
    actionRequired:       orderCounts?.actionRequiredCount  ?? ((orderCounts?.pendingOrders || 0) + (orderCounts?.cancellationRequests || 0)),
    pending:              orderCounts?.pendingOrders         ?? orders.filter(o => o.orderStatus === 'Pending').length,
    confirmed:            orderCounts?.confirmedOrders       ?? orders.filter(o => o.orderStatus === 'Confirmed').length,
    packed:               orderCounts?.packedOrders          ?? orders.filter(o => o.orderStatus === 'Packed').length,
    shipped:              orderCounts?.shippedOrders         ?? orders.filter(o => o.orderStatus === 'Shipped').length,
    delivered:            orderCounts?.deliveredOrders       ?? orders.filter(o => o.orderStatus === 'Delivered').length,
    cancelled:            orderCounts?.cancelledOrders       ?? orders.filter(o => o.orderStatus === 'Cancelled').length,
    cancellationRequests: orderCounts?.cancellationRequests  ?? orders.filter(o => o.orderStatus === 'CancellationRequested').length,
  }), [orderCounts, total, orders]);

  return {
    orders,
    expandedOrderId,
    loading,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    total,
    stats,
    deleteModal,
    isDeletingHistory,
    toggleOrderExpansion,
    handleUpdateStatus,
    handleApproveCancel,
    handleRejectCancel,
    promptDeleteHistoryItem,
    promptBulkDeleteHistory,
    closeDeleteModal,
    confirmDeleteHistory,
  };
}
