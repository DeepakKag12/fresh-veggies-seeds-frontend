import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package, MapPin, CreditCard, Truck, CheckCircle,
  Clock, XCircle, AlertTriangle, RefreshCw, ArrowLeft, Star,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import WriteReviewModal from '../components/storefront/WriteReviewModal';

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [reviewingProduct, setReviewingProduct] = useState(null);

  // Admin status control state
  const [adminUpdating, setAdminUpdating] = useState(false);
  const [adminSelectedStatus, setAdminSelectedStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [adminRejectReason, setAdminRejectReason] = useState('');
  const [showAdminReject, setShowAdminReject] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }
    setCancelling(true);
    try {
      const response = await api.put(`/orders/${id}/cancel`, { reason: cancelReason });
      setOrder(response.data.data);
      setShowCancelModal(false);
      setCancelReason('');
      toast.success('Cancellation request submitted! Admin will review it shortly.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit cancellation request');
    } finally {
      setCancelling(false);
    }
  };

  const handleAdminStatusChange = async (newStatus) => {
    const statusToSet = newStatus || adminSelectedStatus;
    if (!statusToSet) {
      toast.error('Please select a status');
      return;
    }
    setAdminUpdating(true);
    try {
      const res = await api.put(`/orders/${id}/status`, {
        orderStatus: statusToSet,
        note: adminNote.trim() || undefined
      });
      setOrder(res.data.data);
      setAdminNote('');
      setAdminSelectedStatus('');
      toast.success(`Order status updated to ${statusToSet}!`);
    } catch (err) {
      console.error('Admin status update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setAdminUpdating(false);
    }
  };

  const handleAdminApproveCancel = async () => {
    setAdminUpdating(true);
    try {
      const res = await api.put(`/orders/${id}/approve-cancel`);
      setOrder(res.data.data);
      toast.success('Cancellation approved! Refund initiated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve cancellation');
    } finally {
      setAdminUpdating(false);
    }
  };

  const handleAdminRejectCancel = async () => {
    if (!adminRejectReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }
    setAdminUpdating(true);
    try {
      const res = await api.put(`/orders/${id}/reject-cancel`, { rejectionReason: adminRejectReason });
      setOrder(res.data.data);
      setShowAdminReject(false);
      setAdminRejectReason('');
      toast.success('Cancellation request rejected.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject cancellation');
    } finally {
      setAdminUpdating(false);
    }
  };

  const canRequestCancel = order &&
    !['Delivered', 'Cancelled', 'CancellationRequested'].includes(order.orderStatus);

  const steps = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
  const stepIcons = { Pending: Clock, Confirmed: CheckCircle, Packed: Package, Shipped: Truck, Delivered: CheckCircle };

  const statusColors = {
    Pending: 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    Confirmed: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    Packed: 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
    Shipped: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
    Delivered: 'text-fv-primary bg-fv-cream border-green-200 dark:bg-green-900/20 dark:border-green-800',
    Cancelled: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    CancellationRequested: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-12 h-12 border-4 border-fv-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-xl text-fv-muted ">Order not found</p>
          <button onClick={() => navigate('/orders')} className="mt-4 text-fv-primary hover:underline">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const activeStep = steps.indexOf(order.orderStatus);

  return (
    <div className="min-h-screen bg-fv-page pb-24">
      <div className="container mx-auto px-4 max-w-4xl pt-20">

        {/* Admin Order Management Bar (Visible to Admin Users) */}
        {(isAdmin || user?.role === 'admin') && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-emerald-500/40 p-4 sm:p-5 mb-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-fv-border">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" /> Admin Control
                </span>
                <span className="text-xs text-fv-muted">
                  Update order status directly from this page
                </span>
              </div>
              <button
                onClick={() => navigate('/admin/orders')}
                className="text-xs font-semibold text-fv-primary hover:underline self-start sm:self-auto"
              >
                ← Go to Admin Orders Dashboard
              </button>
            </div>

            {/* Status selector & actions */}
            <div className="pt-3 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-fv-heading">Status:</span>
                <select
                  value={adminSelectedStatus || order.orderStatus}
                  onChange={(e) => setAdminSelectedStatus(e.target.value)}
                  disabled={adminUpdating}
                  className="text-xs font-semibold py-1.5 px-3 rounded-xl border border-fv-border bg-fv-surface text-fv-heading hover:border-fv-primary focus:outline-none focus:ring-1 focus:ring-fv-primary cursor-pointer disabled:opacity-50"
                >
                  {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                    <option key={st} value={st}>
                      {st === order.orderStatus ? `✓ Current: ${st}` : st}
                    </option>
                  ))}
                  {order.orderStatus === 'CancellationRequested' && (
                    <option value="CancellationRequested" disabled>
                      ● CancellationRequested
                    </option>
                  )}
                </select>

                <button
                  type="button"
                  onClick={() => handleAdminStatusChange()}
                  disabled={adminUpdating || (adminSelectedStatus && adminSelectedStatus === order.orderStatus)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {adminUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Apply Status'}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Optional admin note (reason, courier note, etc.)..."
                  className="w-full text-xs p-2 bg-fv-surface/40 border border-fv-border rounded-xl text-fv-heading placeholder:text-fv-muted focus:ring-1 focus:ring-fv-primary"
                />
              </div>

              {/* Cancellation request review buttons for Admin */}
              {order.orderStatus === 'CancellationRequested' && (
                <div className="pt-2 border-t border-red-200 dark:border-red-900/40">
                  <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-2">
                    Action Required: Review Customer Cancellation Request
                  </p>
                  {!showAdminReject ? (
                    <div className="flex gap-2">
                      <button
                        onClick={handleAdminApproveCancel}
                        disabled={adminUpdating}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 shadow-xs"
                      >
                        Approve Cancellation & Refund
                      </button>
                      <button
                        onClick={() => setShowAdminReject(true)}
                        disabled={adminUpdating}
                        className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 shadow-xs"
                      >
                        Reject Request
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-w-md">
                      <input
                        type="text"
                        value={adminRejectReason}
                        onChange={(e) => setAdminRejectReason(e.target.value)}
                        placeholder="Enter rejection reason to send to customer..."
                        className="w-full text-xs p-2 bg-fv-surface border border-fv-border rounded-xl"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAdminRejectCancel}
                          disabled={adminUpdating}
                          className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-xl"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => setShowAdminReject(false)}
                          className="px-3 py-1.5 bg-fv-surface text-fv-heading text-xs font-semibold rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <button
            onClick={() => navigate('/orders')}
           className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex-shrink-0 mt-0.5"
          >
            <ArrowLeft className="w-5 h-5 text-fv-muted " />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-fv-heading  truncate">
              Order {order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <p className="text-sm text-fv-muted ">
                {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
              <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${statusColors[order.orderStatus] || ''}`}>
                {order.orderStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Tracker — hide for cancelled/cancellationRequested */}
        {!['Cancelled', 'CancellationRequested'].includes(order.orderStatus) && (
          <div className="bg-white rounded-[16px] shadow-xs border border-fv-border p-4 sm:p-6 mb-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-4 sm:top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              <div
                className="absolute top-4 sm:top-5 left-0 h-0.5 bg-fv-primary z-0 transition-all duration-500"
                style={{ width: activeStep < 0 ? '0%' : `${(activeStep / (steps.length - 1)) * 100}%` }}
              />
              {steps.map((step, index) => {
                const Icon = stepIcons[step];
                const isCompleted = activeStep >= index;
                const isCurrent = activeStep === index;
                return (
                  <div key={step} className="flex flex-col items-center z-10">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all
                      ${isCompleted ? 'bg-fv-primary text-white shadow-xs' : 'bg-gray-100 text-gray-400'}
                      ${isCurrent ? 'ring-4 ring-green-100 dark:ring-green-900' : ''}`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className={`text-[10px] sm:text-xs mt-1.5 font-medium text-center truncate max-w-[56px] sm:max-w-none ${
                      isCompleted ? 'text-fv-primary dark:text-green-400 font-semibold' : 'text-gray-400'
                    }`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Cancellation Requested Banner */}
        {order.orderStatus === 'CancellationRequested' && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-[12px] p-4 mb-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-700 dark:text-orange-400">Cancellation Request Pending</p>
                <p className="text-sm text-orange-600 dark:text-orange-300 mt-1">
                  Your request is awaiting admin review. We'll process it as soon as possible.
                </p>
                {order.cancellationRequest?.reason && (
                  <p className="text-xs text-fv-muted  mt-2">
                    Your reason: <span className="italic">"{order.cancellationRequest.reason}"</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rejection Banner — shown when a previous request was rejected */}
        {order.cancellationRequest?.rejectionReason && order.orderStatus !== 'CancellationRequested' && order.orderStatus !== 'Cancelled' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[12px] p-4 mb-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">Cancellation Request Rejected</p>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  {order.cancellationRequest.rejectionReason}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Your order is back to <span className="font-semibold">{order.orderStatus}</span> status.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancelled + Refund Banner */}
        {order.orderStatus === 'Cancelled' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[12px] p-4 mb-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-400">Order Cancelled</p>
                {order.refund ? (
                  <div className="mt-1">
                    {order.refund.refundStatus === 'Processed' ? (
                      <p className="text-sm text-red-600 dark:text-red-300">
                        ✅ Refund of <span className="font-bold">₹{order.refund.refundAmount}</span> has been processed and will be credited to your original payment method within <span className="font-bold">5–7 business days</span>.
                        {order.refund.refundId && (
                          <span className="block mt-1 text-xs text-fv-muted ">
                            Refund ID: <code className="bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 rounded">{order.refund.refundId}</code>
                          </span>
                        )}
                      </p>
                    ) : order.refund.refundStatus === 'Failed' ? (
                      <p className="text-sm text-red-600 dark:text-red-300">
                        ⚠️ Refund processing failed. Please contact support with Order ID: <span className="font-semibold">{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
                      </p>
                    ) : (
                      <p className="text-sm text-blue-600 dark:text-blue-300 flex items-center gap-1 mt-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Refund of ₹{order.refund.refundAmount} is being processed…
                      </p>
                    )}
                  </div>
                ) : order.paymentMode !== 'Online' ? (
                  <p className="text-sm text-fv-muted  mt-1">
                    COD order — no payment was collected, so no refund is needed.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left — Items + Address */}
          <div className="md:col-span-2 space-y-4">
            {/* Order Items */}
            <div className="bg-white rounded-[12px] shadow-sm p-6">
              <h2 className="text-lg font-semibold text-fv-heading mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-fv-primary" /> Order Items
              </h2>
              <div className="space-y-4">
                {order.orderItems.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-fv-border last:border-0">
                    <div className="flex items-center gap-4 min-w-0">
                      <img
                        src={item.image || 'https://via.placeholder.com/80'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-fv-heading truncate">{item.name}</p>
                        <p className="text-sm text-fv-muted">Qty: {item.quantity}</p>
                        <p className="text-sm text-fv-muted">₹{item.price} × {item.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <p className="font-semibold text-fv-heading">₹{item.price * item.quantity}</p>
                      {order.orderStatus === 'Delivered' && item.productType === 'Product' && (
                        <button
                          type="button"
                          onClick={() => setReviewingProduct(item)}
                          className="px-3 py-1.5 bg-fv-surface hover:bg-fv-cream border border-fv-border hover:border-fv-primary/50 text-fv-heading text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                          <span>Review</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-[12px] shadow-sm p-6">
              <h2 className="text-lg font-semibold text-fv-heading  mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-fv-primary" /> Shipping Address
              </h2>
              <p className="font-medium text-fv-heading ">{order.shippingAddress.name}</p>
              <p className="text-fv-muted  text-sm mt-1">{order.shippingAddress.phone}</p>
              <p className="text-fv-muted  text-sm">{order.shippingAddress.street}</p>
              <p className="text-fv-muted  text-sm">
                {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
              </p>
            </div>

            {/* Order Timeline — every recorded status change, newest last */}
            {order.statusHistory?.length > 0 && (
              <div className="bg-white rounded-[12px] shadow-sm p-6">
                <h2 className="text-lg font-semibold text-fv-heading  mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-fv-primary" /> Order Timeline
                </h2>
                <ol className="relative border-l border-fv-border  ml-2">
                  {order.statusHistory.map((entry, i) => (
                    <li key={i} className="ml-5 pb-5 last:pb-0">
                      <span className={`absolute -left-[6px] w-3 h-3 rounded-full ${
                        i === order.statusHistory.length - 1
                          ? 'bg-fv-primary ring-4 ring-green-100 dark:ring-green-900/40'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`} />
                      <p className="font-medium text-fv-heading  text-sm">
                        {entry.status}
                        {entry.from && entry.from !== entry.status && (
                          <span className="text-gray-400 font-normal"> · from {entry.from}</span>
                        )}
                      </p>
                      <p className="text-xs text-fv-muted  mt-0.5">
                        {new Date(entry.changedAt).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-fv-muted  mt-1 italic">{entry.note}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Right — Summary + Payment + Cancel */}
          <div className="space-y-4">

            {/* Order Summary */}
            <div className="bg-white rounded-[12px] shadow-sm p-6">
              <h2 className="text-lg font-semibold text-fv-heading  mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-fv-muted ">
                  <span>Items Total</span>
                  <span>₹{order.itemsPrice}</span>
                </div>
                <div className="flex justify-between text-fv-muted ">
                  <span>Shipping</span>
                  <span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-fv-primary">
                    <span>Discount</span>
                    <span>-₹{order.discountAmount}</span>
                  </div>
                )}
                <div className="border-t border-fv-border  pt-2 mt-2 flex justify-between font-bold text-fv-heading  text-base">
                  <span>Grand Total</span>
                  <span className="text-fv-primary">₹{order.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-[12px] shadow-sm p-6">
              <h2 className="text-lg font-semibold text-fv-heading  mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-fv-primary" /> Payment
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-fv-muted ">Method</span>
                  <span className="font-medium text-fv-heading ">{order.paymentMode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-fv-muted ">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    order.paymentStatus === 'Paid' ? 'bg-fv-cream text-fv-primary-dark dark:bg-green-900/30 dark:text-green-400' :
                    order.paymentStatus === 'Refunded' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}>
                    {order.paymentStatus === 'Refunded' ? '↩ Refunded' : order.paymentStatus}
                  </span>
                </div>
                {order.paymentDetails?.razorpayPaymentId && (
                  <div className="pt-1 border-t border-fv-border ">
                    <p className="text-xs text-gray-400 dark:text-fv-muted mb-1">Transaction ID</p>
                    <p className="text-xs font-mono text-fv-muted  break-all">
                      {order.paymentDetails.razorpayPaymentId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel / Request Cancellation Button */}
            {canRequestCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
               className="w-full py-3 border-2 border-orange-400 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-[12px] font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Request Cancellation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancellation Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[18px] shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-fv-heading ">Request Cancellation</h3>
                <p className="text-sm text-fv-muted ">Admin will review your request</p>
              </div>
            </div>

            {/* Refund notice for online paid orders */}
            {order.paymentMode === 'Online' && order.paymentStatus === 'Paid' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-[12px] p-3 mb-4">
                <div className="flex items-start gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    If approved, a refund of <span className="font-bold">₹{order.totalAmount}</span> will be credited to your original payment method within <span className="font-bold">5–7 business days</span>.
                  </p>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-fv-ink  mb-2">
                Reason for cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please explain why you want to cancel this order..."
                rows={3}
               className="w-full px-3 py-2 border border-fv-border  rounded-[12px] bg-white  text-fv-heading  text-sm focus:ring-2 focus:ring-orange-400 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
               className="flex-1 py-2.5 border border-fv-border  text-fv-ink  rounded-[12px] font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling || !cancelReason.trim()}
               className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-[12px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Submit Request'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal for Delivered Items */}
      {reviewingProduct && (
        <WriteReviewModal
          isOpen={!!reviewingProduct}
          onClose={() => setReviewingProduct(null)}
          productId={reviewingProduct.product}
          productName={reviewingProduct.name}
          orderId={order._id}
          onSuccess={() => {
            fetchOrder();
          }}
        />
      )}
    </div>
  );
};

export default OrderDetail;
