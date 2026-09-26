import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Package,
  MapPin,
  CreditCard,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useSettings } from '../context/SettingsContext';

const steps = ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];
const stepIcons = {
  Pending: Clock,
  Confirmed: CheckCircle,
  Packed: Package,
  Shipped: Truck,
  Delivered: CheckCircle
};

const statusColors = {
  Pending: 'text-amber-700 bg-amber-50 border-amber-200',
  Confirmed: 'text-blue-700 bg-blue-50 border-blue-200',
  Packed: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  Shipped: 'text-purple-700 bg-purple-50 border-purple-200',
  Delivered: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Cancelled: 'text-rose-700 bg-rose-50 border-rose-200',
  CancellationRequested: 'text-orange-700 bg-orange-50 border-orange-200',
};

/**
 * [CHG-026] OrderDetailDrawer
 * Interactive slide-over drawer for viewing full order details, tracking status,
 * items, delivery address, invoice breakdown, and cancellation requests without leaving
 * the orders list or account settings page.
 */
const OrderDetailDrawer = ({ orderId, isOpen, onClose, onOrderUpdated }) => {
  const { settings } = useSettings();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const panelRef = useRef(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/orders/${orderId}`);
      if (res.data?.success && res.data?.data) {
        setOrder(res.data.data);
      } else {
        setError('Order details could not be found.');
      }
    } catch (err) {
      console.error('Drawer fetch error:', err);
      setError(err.response?.data?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrder();
      setShowCancelInput(false);
      setCancelReason('');
    } else {
      setOrder(null);
      setError('');
    }
  }, [isOpen, orderId, fetchOrder]);

  // Lock scroll and handle Escape key
  useEffect(() => {
    if (!isOpen) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [isOpen, onClose]);

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error('Please enter a cancellation reason.');
      return;
    }
    setCancelling(true);
    try {
      const res = await api.put(`/orders/${order._id}/cancel`, { reason: cancelReason.trim() });
      if (res.data?.success) {
        setOrder(res.data.data);
        setShowCancelInput(false);
        setCancelReason('');
        toast.success('Cancellation request submitted!');
        if (onOrderUpdated) onOrderUpdated(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit cancellation request.');
    } finally {
      setCancelling(false);
    }
  };

  if (!isOpen) return null;

  const allowCustomerCancel = settings?.orders?.allowCustomerCancellation ?? true;
  const cancelCutoff = settings?.orders?.cancellationAllowedUntil || 'Before Shipped';
  const isPastCutoff =
    cancelCutoff === 'Before Packed'
      ? ['Packed', 'Shipped', 'Delivered', 'Cancelled'].includes(order?.orderStatus)
      : ['Shipped', 'Delivered', 'Cancelled'].includes(order?.orderStatus);

  const canRequestCancel =
    order &&
    allowCustomerCancel &&
    !isPastCutoff &&
    order.orderStatus !== 'CancellationRequested' &&
    order.orderStatus !== 'Cancelled';

  const activeStep = order ? steps.indexOf(order.orderStatus) : -1;
  const storePhone = settings?.store?.phone || '9876543210';
  const cleanPhone = storePhone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(`Hello Fresh Veggies Support, I need help with my Order ${order?.orderNumber || order?._id || ''}`)}`;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Order Details">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close order details"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
      />

      {/* Slide-over panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-[540px] flex-col bg-white shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-fv-border px-5 py-4 bg-white/95 backdrop-blur-sm z-10">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-fv-heading font-mono truncate">
                {order ? (order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`) : 'Order Details'}
              </h2>
              {order && (
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-700'}`}>
                  {order.orderStatus}
                </span>
              )}
            </div>
            {order && (
              <p className="text-xs text-fv-muted mt-0.5">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-fv-muted hover:bg-fv-page hover:text-fv-heading transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5 bg-slate-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-9 h-9 animate-spin text-fv-primary mb-3" />
              <p className="text-sm font-medium text-fv-heading">Loading order details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 px-4">
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <p className="text-sm font-semibold text-rose-700 mb-1">{error}</p>
              <button
                type="button"
                onClick={fetchOrder}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-fv-primary text-white text-xs font-bold rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          ) : order ? (
            <>
              {/* Stepper (hide for Cancelled/Requested) */}
              {!['Cancelled', 'CancellationRequested'].includes(order.orderStatus) && (
                <div className="rounded-2xl border border-fv-border bg-white p-4 shadow-2xs">
                  <span className="text-xs font-bold text-fv-primary block mb-3">Order Tracking</span>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
                    <div
                      className="absolute top-4 left-0 h-0.5 bg-fv-primary z-0 transition-all duration-500"
                      style={{ width: activeStep < 0 ? '0%' : `${(activeStep / (steps.length - 1)) * 100}%` }}
                    />
                    {steps.map((step, index) => {
                      const Icon = stepIcons[step] || CheckCircle;
                      const isCompleted = activeStep >= index;
                      const isCurrent = activeStep === index;
                      return (
                        <div key={step} className="flex flex-col items-center z-10">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isCompleted ? 'bg-fv-primary text-white' : 'bg-gray-100 text-gray-400'
                            } ${isCurrent ? 'ring-3 ring-emerald-200' : ''}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span
                            className={`text-[10px] mt-1 font-medium text-center truncate max-w-[50px] ${
                              isCompleted ? 'text-fv-primary font-bold' : 'text-gray-400'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status Alert Banners */}
              {order.orderStatus === 'CancellationRequested' && (
                <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50 text-xs text-orange-800 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block">Cancellation Request Pending</span>
                    <p className="mt-0.5 text-orange-700">Your cancellation request is awaiting review by our support team.</p>
                  </div>
                </div>
              )}

              {order.orderStatus === 'Cancelled' && (
                <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold block">Order Cancelled</span>
                    {order.refund?.refundStatus === 'Processed' ? (
                      <p className="mt-0.5 text-emerald-700 font-medium">Refund of ₹{order.refund.refundAmount} has been processed.</p>
                    ) : (
                      <p className="mt-0.5 text-rose-700">This order was cancelled. No further action is required.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="rounded-2xl border border-fv-border bg-white p-4 shadow-2xs">
                <span className="text-xs font-bold text-fv-heading flex items-center gap-1.5 mb-3">
                  <Package className="w-4 h-4 text-fv-primary" /> Order Items ({order.orderItems?.length || 0})
                </span>
                <div className="divide-y divide-gray-100">
                  {(order.orderItems || []).map((item, idx) => (
                    <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                      <img
                        src={item.image || 'https://via.placeholder.com/60'}
                        alt={item.name}
                        className="w-13 h-13 object-cover rounded-lg bg-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-fv-heading truncate">{item.name}</p>
                        <p className="text-[11px] text-fv-muted mt-0.5">
                          Qty: {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-fv-heading">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="rounded-2xl border border-fv-border bg-white p-4 shadow-2xs">
                  <span className="text-xs font-bold text-fv-heading flex items-center gap-1.5 mb-2">
                    <MapPin className="w-4 h-4 text-fv-primary" /> Delivery Address
                  </span>
                  <p className="text-xs font-bold text-fv-heading">{order.shippingAddress.name}</p>
                  <p className="text-xs text-fv-muted mt-0.5">{order.shippingAddress.phone}</p>
                  <p className="text-xs text-fv-muted mt-0.5">
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                  </p>
                </div>
              )}

              {/* Payment & Invoice Summary */}
              <div className="rounded-2xl border border-fv-border bg-white p-4 shadow-2xs">
                <span className="text-xs font-bold text-fv-heading flex items-center gap-1.5 mb-3">
                  <CreditCard className="w-4 h-4 text-fv-primary" /> Payment & Billing Summary
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-fv-muted">
                    <span>Payment Mode</span>
                    <span className="font-semibold text-fv-heading">{order.paymentMode || 'COD'} ({order.paymentStatus || 'Pending'})</span>
                  </div>
                  <div className="flex justify-between text-fv-muted">
                    <span>Items Subtotal</span>
                    <span>₹{order.itemsPrice}</span>
                  </div>
                  <div className="flex justify-between text-fv-muted">
                    <span>Delivery Shipping</span>
                    <span>{order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-fv-primary font-semibold">
                      <span>Coupon Discount</span>
                      <span>-₹{order.discountAmount}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100 flex justify-between font-bold text-sm text-fv-heading">
                    <span>Total Amount</span>
                    <span className="text-fv-primary">₹{order.totalAmount}</span>
                  </div>
                </div>
              </div>

              {/* Cancellation form or trigger */}
              {canRequestCancel && (
                <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
                  {!showCancelInput ? (
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-orange-900 block">Need to cancel?</span>
                        <p className="text-[11px] text-orange-700">Orders can be cancelled before dispatch.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCancelInput(true)}
                        className="px-3 py-1.5 bg-white border border-orange-300 text-orange-700 text-xs font-bold rounded-lg hover:bg-orange-100 transition-colors"
                      >
                        Request Cancel
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleCancelOrder} className="space-y-2">
                      <span className="text-xs font-bold text-orange-900 block">Reason for Cancellation</span>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Please tell us why you wish to cancel this order..."
                        rows={2}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-orange-300 bg-white text-fv-heading focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCancelInput(false)}
                          disabled={cancelling}
                          className="px-3 py-1 text-xs text-fv-muted hover:text-fv-heading"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={cancelling}
                          className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                        >
                          {cancelling ? 'Submitting...' : 'Confirm Request'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer Actions */}
        {order && (
          <div className="border-t border-fv-border px-5 py-3.5 bg-white flex items-center justify-between gap-3 z-10">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              WhatsApp Help
            </a>

            <div className="flex items-center gap-2">
              <Link
                to={`/orders/${order._id}`}
                onClick={onClose}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-fv-border hover:border-fv-primary text-fv-heading text-xs font-semibold rounded-lg transition-colors"
              >
                <span>Full Page View</span>
                <ExternalLink className="w-3.5 h-3.5 text-fv-muted" />
              </Link>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-fv-primary hover:bg-fv-primary-dark text-white text-xs font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailDrawer;
