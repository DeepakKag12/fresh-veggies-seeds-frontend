import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react';
import { ALL_STATUS_OPTIONS, NEXT_PRIMARY_ACTION } from '../../../config/adminOrderConfig';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderHistoryTimeline } from './OrderHistoryTimeline';

export const OrderCard = ({
  order,
  isExpanded,
  onToggleExpand,
  onUpdateStatus,
  onApproveCancel,
  onRejectCancel,
  onPromptDeleteHistory,
  onPromptBulkDeleteHistory,
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border shadow-xs overflow-hidden"
    >
      {/* Card Summary Header */}
      <div
        className="p-4 md:p-5 cursor-pointer hover:bg-fv-surface/40 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Left section: Order ID, status, date, customer */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-sm font-bold text-fv-heading">
                #{order.orderNumber || order._id.slice(-6).toUpperCase()}
              </span>
              <OrderStatusBadge status={order.orderStatus} />
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

          {/* Right section: Price + In-place Action Controls */}
          <div
            className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-fv-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-left md:text-right">
              <div className="text-[11px] text-fv-muted">{order.orderItems?.length || 0} items</div>
              <div className="text-base md:text-lg font-bold text-fv-primary">₹{order.totalAmount}</div>
            </div>

            {/* Quick in-place workflow actions */}
            <div className="flex items-center gap-1.5 relative flex-wrap justify-end">
              {order.orderStatus === 'CancellationRequested' ? (
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 min-h-[44px]"
                  title="Review & approve cancellation"
                >
                  {processing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Review Cancel'}
                </button>
              ) : primaryAction ? (
                <button
                  onClick={() => handleStatusChange(primaryAction.target)}
                  disabled={isUpdating}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 min-h-[44px] ${primaryAction.color}`}
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

              {/* Direct In-place Status Selector */}
              <div className="relative">
                <select
                  value={order.orderStatus}
                  disabled={isUpdating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="text-xs font-semibold py-2 pl-2.5 pr-6 rounded-xl border border-fv-border bg-white dark:bg-gray-800 text-fv-heading hover:border-fv-primary focus:outline-hidden focus:ring-1 focus:ring-fv-primary cursor-pointer disabled:opacity-50 transition-all shadow-2xs min-h-[44px]"
                  title="Change status directly"
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

              {/* Accordion expand toggle */}
              <button
                onClick={onToggleExpand}
                className="p-2.5 text-fv-muted hover:text-fv-heading rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
                title={isExpanded ? 'Collapse details' : 'Expand details'}
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Order Details & Audit History Drawer */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-fv-border p-4 md:p-6 space-y-5 bg-fv-surface/20"
          >
            {/* Customer & Delivery Address */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-fv-border">
                <h4 className="text-xs font-bold text-fv-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-fv-primary" /> Customer Info
                </h4>
                <div className="text-sm space-y-1">
                  <p className="font-semibold text-fv-heading">
                    {order.userId?.name || order.shippingAddress?.name || 'Customer'}
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
              <h4 className="text-xs font-bold text-fv-muted uppercase tracking-wider mb-3">
                Order Items ({order.orderItems?.length || 0})
              </h4>
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

            {/* Status Transition Control Panel */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-fv-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold text-fv-muted uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 text-fv-primary" /> Admin Workflow Transition
                </h4>
                <OrderStatusBadge status={order.orderStatus} />
              </div>

              <div className="flex flex-wrap gap-2">
                {ALL_STATUS_OPTIONS.map((st) => {
                  const isCurrent = order.orderStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      disabled={isUpdating || isCurrent}
                      onClick={() => handleStatusChange(st, customNote)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[44px] ${
                        isCurrent
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 cursor-default opacity-90'
                          : 'bg-fv-surface hover:bg-fv-border text-fv-heading border border-fv-border hover:border-fv-primary'
                      } disabled:opacity-50`}
                    >
                      {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
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
                  className="flex-1 text-xs px-3 py-2 bg-fv-surface/40 border border-fv-border rounded-xl text-fv-heading placeholder:text-fv-muted focus:outline-hidden focus:ring-1 focus:ring-fv-primary min-h-[44px]"
                />
              </div>
            </div>

            {/* Status History & Audit Log Timeline */}
            <OrderHistoryTimeline
              orderId={order._id}
              statusHistory={order.statusHistory || []}
              onPromptDeleteHistory={onPromptDeleteHistory}
              onPromptBulkDeleteHistory={onPromptBulkDeleteHistory}
            />

            {/* Customer Cancellation Request Actions */}
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
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 min-h-[44px]"
                    >
                      {processing ? 'Processing...' : 'Approve & Refund'}
                    </button>
                    <button
                      onClick={() => setShowRejectInput(true)}
                      disabled={processing}
                      className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 min-h-[44px]"
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
                        className="px-3.5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold disabled:opacity-50 min-h-[44px]"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => setShowRejectInput(false)}
                        className="px-3.5 py-2 bg-fv-surface text-fv-heading rounded-xl text-xs font-semibold min-h-[44px]"
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

export default OrderCard;
