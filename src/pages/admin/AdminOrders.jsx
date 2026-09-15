import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  PackageCheck,
  MapPin,
  ChevronDown,
  ChevronUp,
  User,
  Package,
  AlertTriangle,
  RefreshCw,
  Search,
  CheckCircle2,
  Boxes,
  History
} from 'lucide-react';
import api from '../../utils/api';

// All valid order statuses that admin can change to at any time
export const ALL_STATUS_OPTIONS = [
  'Pending',
  'Confirmed',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const NEXT_PRIMARY_ACTION = {
  Pending:   { target: 'Confirmed', label: 'Confirm Order', icon: CheckCircle2, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  Confirmed: { target: 'Packed',    label: 'Mark as Packed', icon: Boxes,        color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  Packed:    { target: 'Shipped',   label: 'Ship Order',    icon: Truck,        color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  Shipped:   { target: 'Delivered', label: 'Mark Delivered', icon: PackageCheck, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
};

const AdminOrders = () => {
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
  const LIMIT = 20;

  const statusOptions = [
    { id: 'All', label: 'All Orders' },
    { id: 'action_required', label: '⚡ Action Required' },
    { id: 'Pending', label: 'Pending' },
    { id: 'Confirmed', label: 'Confirmed' },
    { id: 'Packed', label: 'Packed' },
    { id: 'Shipped', label: 'Shipped' },
    { id: 'Delivered', label: 'Delivered' },
    { id: 'Cancelled', label: 'Cancelled' },
    { id: 'CancellationRequested', label: 'Cancellation Req' }
  ];

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
    api.get('/admin/stats')
      .then(r => setOrderCounts(r.data.data))
      .catch(() => {});
  }, []);

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

  const handleUpdateStatus = async (orderId, newStatus, note) => {
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: newStatus, note });
      toast.success(`Order moved to ${newStatus}!`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleApproveCancel = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/approve-cancel`);
      toast.success('Cancellation approved! Refund initiated.');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve cancellation');
    }
  };

  const handleRejectCancel = async (orderId, rejectionReason) => {
    try {
      await api.put(`/orders/${orderId}/reject-cancel`, { rejectionReason });
      toast.success('Cancellation request rejected.');
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject cancellation');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Confirmed: 'bg-fv-cream text-green-800 border-green-300',
      Packed: 'bg-blue-100 text-blue-800 border-blue-300',
      Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      Delivered: 'bg-fv-cream text-green-800 border-green-300',
      Cancelled: 'bg-red-100 text-red-800 border-red-300',
      CancellationRequested: 'bg-orange-100 text-orange-800 border-orange-300'
    };
    return colors[status] || 'bg-fv-surface text-fv-heading border-fv-border';
  };

  const getStatusIcon = (status) => {
    const iconProps = { className: 'w-4 h-4' };
    const icons = {
      Pending: <Clock {...iconProps} />,
      Confirmed: <CheckCircle {...iconProps} />,
      Packed: <Package {...iconProps} />,
      Shipped: <Truck {...iconProps} />,
      Delivered: <PackageCheck {...iconProps} />,
      Cancelled: <XCircle {...iconProps} />,
      CancellationRequested: <AlertTriangle {...iconProps} />
    };
    return icons[status] || <Package {...iconProps} />;
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const stats = {
    all:                  orderCounts?.totalOrders          ?? total,
    actionRequired:       orderCounts?.actionRequiredCount  ?? ((orderCounts?.pendingOrders || 0) + (orderCounts?.cancellationRequests || 0)),
    pending:              orderCounts?.pendingOrders         ?? orders.filter(o => o.orderStatus === 'Pending').length,
    confirmed:            orderCounts?.confirmedOrders       ?? orders.filter(o => o.orderStatus === 'Confirmed').length,
    packed:               orderCounts?.packedOrders          ?? orders.filter(o => o.orderStatus === 'Packed').length,
    shipped:              orderCounts?.shippedOrders         ?? orders.filter(o => o.orderStatus === 'Shipped').length,
    delivered:            orderCounts?.deliveredOrders       ?? orders.filter(o => o.orderStatus === 'Delivered').length,
    cancelled:            orderCounts?.cancelledOrders       ?? orders.filter(o => o.orderStatus === 'Cancelled').length,
    cancellationRequests: orderCounts?.cancellationRequests  ?? orders.filter(o => o.orderStatus === 'CancellationRequested').length,
  };

  return (
    <div className="min-h-screen bg-fv-page p-3 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-fv-heading flex items-center gap-2">
              Orders Management
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary font-bold">
                {total} orders
              </span>
            </h1>
            <p className="text-xs text-fv-muted mt-0.5">
              Track fulfillment, verify payments, and handle customer requests
            </p>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-fv-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order #, customer, phone..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-800 border border-fv-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-fv-primary text-fv-heading"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="text-xs text-fv-muted hover:text-fv-heading px-2 py-1.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills (Scrollable horizontally) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {statusOptions.map((tab) => {
            const isActive = statusFilter === tab.id;
            let badgeCount = null;
            if (tab.id === 'All') badgeCount = stats.all;
            else if (tab.id === 'action_required') badgeCount = stats.actionRequired;
            else if (tab.id === 'Pending') badgeCount = stats.pending;
            else if (tab.id === 'Confirmed') badgeCount = stats.confirmed;
            else if (tab.id === 'Packed') badgeCount = stats.packed;
            else if (tab.id === 'Shipped') badgeCount = stats.shipped;
            else if (tab.id === 'Delivered') badgeCount = stats.delivered;
            else if (tab.id === 'Cancelled') badgeCount = stats.cancelled;
            else if (tab.id === 'CancellationRequested') badgeCount = stats.cancellationRequests;

            return (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-fv-heading text-white shadow-xs'
                    : 'bg-white dark:bg-gray-800 text-fv-muted hover:text-fv-heading border border-fv-border'
                }`}
              >
                <span>{tab.label}</span>
                {badgeCount !== null && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : tab.id === 'action_required' && badgeCount > 0
                        ? 'bg-red-500 text-white'
                        : 'bg-fv-surface text-fv-muted'
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white dark:bg-gray-800 rounded-2xl border border-fv-border animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-12 text-center">
            <Package className="w-12 h-12 text-fv-muted mx-auto mb-3" />
            <p className="text-base font-semibold text-fv-heading">No orders match your criteria</p>
            <p className="text-xs text-fv-muted mt-1">Try clearing your search query or filter</p>
            {(statusFilter !== 'All' || searchQuery) && (
              <button
                onClick={() => { setStatusFilter('All'); setSearchQuery(''); setPage(1); }}
                className="mt-4 px-4 py-2 bg-fv-surface hover:bg-fv-surface text-xs font-semibold rounded-xl"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                isExpanded={expandedOrderId === order._id}
                onToggleExpand={() => toggleOrderExpansion(order._id)}
                onUpdateStatus={handleUpdateStatus}
                onApproveCancel={handleApproveCancel}
                onRejectCancel={handleRejectCancel}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-medium border border-fv-border rounded-lg hover:bg-fv-surface disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-fv-muted px-2">
              Page {page} of {totalPages} &bull; {total} total orders
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-medium border border-fv-border rounded-lg hover:bg-fv-surface disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({
  order,
  isExpanded,
  onToggleExpand,
  onUpdateStatus,
  onApproveCancel,
  onRejectCancel,
  getStatusColor,
  getStatusIcon
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [customNote, setCustomNote] = useState('');

  const primaryAction = NEXT_PRIMARY_ACTION[order.orderStatus];

  const handleStatusChange = async (newStatus, note) => {
    if (newStatus === order.orderStatus) return;
    setIsUpdating(true);
    await onUpdateStatus(order._id, newStatus, note || customNote);
    setIsUpdating(false);
    setCustomNote('');
  };

  const handleApprove = async () => {
    setProcessing(true);
    await onApproveCancel(order._id);
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setProcessing(true);
    await onRejectCancel(order._id, rejectionReason);
    setShowRejectInput(false);
    setRejectionReason('');
    setProcessing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border shadow-xs overflow-hidden"
    >
      {/* Card Header */}
      <div
        className="p-4 md:p-5 cursor-pointer hover:bg-fv-surface/40 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left section */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-sm font-bold text-fv-heading">
                #{order.orderNumber || order._id.slice(-6).toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 inline-flex items-center gap-1 text-[11px] font-bold rounded-full border ${getStatusColor(order.orderStatus)}`}>
                {getStatusIcon(order.orderStatus)}
                {order.orderStatus}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-fv-surface text-fv-muted">
                {order.paymentMode} · {order.paymentStatus || 'Pending'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-fv-muted truncate">
              <span className="font-medium text-fv-heading">
                {order.shippingAddress?.name || order.userId?.name || 'Customer'}
              </span>
              <span>•</span>
              <span>{order.shippingAddress?.phone || order.userId?.phone || 'No phone'}</span>
              <span>•</span>
              <span>
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          {/* Right section with Price + Status Selector & Actions */}
          <div
            className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-fv-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-left md:text-right">
              <div className="text-[11px] text-fv-muted">{order.orderItems?.length || 0} items</div>
              <div className="text-base md:text-lg font-bold text-fv-primary">₹{order.totalAmount}</div>
            </div>

            {/* Quick Actions & Universal Status Dropdown */}
            <div className="flex items-center gap-1.5 relative flex-wrap justify-end">
              {order.orderStatus === 'CancellationRequested' ? (
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1 disabled:opacity-50"
                  title="Review customer cancellation"
                >
                  {processing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Review Cancel'}
                </button>
              ) : primaryAction ? (
                <button
                  onClick={() => handleStatusChange(primaryAction.target)}
                  disabled={isUpdating}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 ${primaryAction.color}`}
                  title={`Quick move to ${primaryAction.target}`}
                >
                  {isUpdating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <primaryAction.icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{primaryAction.label}</span>
                    </>
                  )}
                </button>
              ) : null}

              {/* Direct Status Selector: Allows switching to ANY status */}
              <div className="relative">
                <select
                  value={order.orderStatus}
                  disabled={isUpdating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-xs font-semibold py-1.5 pl-2.5 pr-6 rounded-xl border border-fv-border bg-white dark:bg-gray-800 text-fv-heading hover:border-fv-primary focus:outline-none focus:ring-1 focus:ring-fv-primary cursor-pointer disabled:opacity-50 transition-all shadow-xs"
                  title="Change status to anything"
                >
                  {ALL_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st === order.orderStatus ? `✓ ${st}` : st}
                    </option>
                  ))}
                  {order.orderStatus === 'CancellationRequested' && (
                    <option value="CancellationRequested" disabled>
                      ● CancellationRequested
                    </option>
                  )}
                </select>
              </div>

              {/* Accordion expander */}
              <button
                onClick={onToggleExpand}
                className="p-1.5 text-fv-muted hover:text-fv-heading rounded-lg transition-colors"
                title={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Order Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-fv-border p-4 md:p-6 space-y-5 bg-fv-surface/20"
          >
            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-fv-border">
                <h4 className="text-xs font-bold text-fv-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-fv-primary" /> Customer Info
                </h4>
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-fv-heading">
                    {order.userId?.name || order.shippingAddress?.name || 'Guest'}
                  </p>
                  <p className="text-xs text-fv-muted">
                    Phone: <a href={`tel:${order.shippingAddress?.phone || order.userId?.phone}`} className="text-fv-primary font-medium hover:underline">{order.shippingAddress?.phone || order.userId?.phone || 'N/A'}</a>
                  </p>
                  {order.userId?.email && (
                    <p className="text-xs text-fv-muted">Email: {order.userId.email}</p>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-fv-border">
                <h4 className="text-xs font-bold text-fv-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> Delivery Address
                </h4>
                <div className="text-xs text-fv-heading leading-relaxed">
                  <p>{order.shippingAddress?.addressLine1 || order.shippingAddress?.street || 'N/A'}</p>
                  {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} - <span className="font-bold">{order.shippingAddress?.pincode}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-fv-border">
              <h4 className="text-xs font-bold text-fv-muted uppercase tracking-wider mb-3">Order Items ({order.orderItems?.length || 0})</h4>
              <div className="divide-y divide-fv-border">
                {order.orderItems?.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg border border-fv-border flex-shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-fv-heading">{item.name}</p>
                        <p className="text-[11px] text-fv-muted">Qty: {item.quantity} × ₹{item.price}</p>
                      </div>
                    </div>
                    <span className="font-bold text-fv-heading">₹{(item.quantity || 1) * (item.price || 0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-fv-border space-y-1.5 text-xs">
              <div className="flex justify-between text-fv-muted">
                <span>Items Subtotal:</span>
                <span className="font-medium text-fv-heading">₹{order.itemsPrice || 0}</span>
              </div>
              <div className="flex justify-between text-fv-muted">
                <span>Delivery Charge:</span>
                <span className="font-medium text-fv-heading">₹{order.shippingPrice || 0}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount Applied:</span>
                  <span>-₹{order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-fv-heading pt-2 border-t border-fv-border">
                <span>Total Amount:</span>
                <span className="text-fv-primary">₹{order.totalAmount}</span>
              </div>
            </div>

            {/* Admin Order Status Control Panel & Audit History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-fv-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-fv-muted uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 text-fv-primary" /> Admin Order Status Control
                </h4>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${getStatusColor(order.orderStatus)}`}>
                  Current: {order.orderStatus}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {ALL_STATUS_OPTIONS.map((st) => {
                  const isCurrent = order.orderStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdating || isCurrent}
                      onClick={() => handleStatusChange(st, customNote)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                        isCurrent
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-default opacity-90'
                          : 'bg-fv-surface hover:bg-fv-border/50 text-fv-heading border border-fv-border hover:border-fv-primary'
                      } disabled:opacity-50`}
                    >
                      {isCurrent && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {st}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Optional admin note for this status update..."
                  className="flex-1 text-xs px-3 py-1.5 bg-fv-surface/40 border border-fv-border rounded-lg text-fv-heading placeholder:text-fv-muted focus:outline-none focus:ring-1 focus:ring-fv-primary"
                />
              </div>

              {/* Status Audit History */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="pt-2 border-t border-fv-border">
                  <p className="text-[11px] font-bold text-fv-muted uppercase tracking-wider mb-2 flex items-center gap-1">
                    <History className="w-3 h-3 text-fv-muted" /> Status History ({order.statusHistory.length})
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {order.statusHistory.slice().reverse().map((h, idx) => (
                      <div key={idx} className="text-[11px] flex items-start justify-between gap-2 p-1.5 bg-fv-surface/40 rounded-lg border border-fv-border/60">
                        <div>
                          <span className="font-semibold text-fv-heading">{h.status}</span>
                          {h.from && <span className="text-fv-muted"> (from {h.from})</span>}
                          {h.note && <p className="text-fv-muted italic text-[10px] mt-0.5">{h.note}</p>}
                        </div>
                        <span className="text-[10px] text-fv-muted whitespace-nowrap">
                          {new Date(h.changedAt).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cancellation Request Actions */}
            {order.orderStatus === 'CancellationRequested' && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-900 dark:text-red-200">
                    <p className="font-bold">Cancellation Request from Customer</p>
                    {order.cancellationRequest?.reason && (
                      <p className="mt-0.5 italic">"{order.cancellationRequest.reason}"</p>
                    )}
                  </div>
                </div>

                {!showRejectInput ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleApprove}
                      disabled={processing}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Approve & Refund'}
                    </button>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      disabled={processing}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
                    >
                      Reject Request
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Reason for rejection (sent to customer)..."
                      className="w-full text-xs p-2.5 bg-white dark:bg-gray-800 border border-fv-border rounded-xl focus:ring-1 focus:ring-fv-primary"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleReject}
                        disabled={processing}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => setShowRejectInput(false)}
                        className="px-3 py-1.5 bg-fv-surface text-fv-heading rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminOrders;
