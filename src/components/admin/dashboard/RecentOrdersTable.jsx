import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Smartphone, Truck, ExternalLink, Trash2, ArrowRight, Printer } from 'lucide-react';
import { ALL_STATUS_OPTIONS, getStatusColor } from '../../../config/adminOrderConfig';
import AdminConfirmModal from '../AdminConfirmModal';
import AdminInvoiceModal from '../orders/AdminInvoiceModal';
import { useSettings } from '../../../context/SettingsContext';

export const RecentOrdersTable = ({
  recentOrders = [],
  actionLoadingId,
  showAllOrders,
  onQuickStatusChange,
  onQuickDeleteOrder,
}) => {
  const [deleteModalOrder, setDeleteModalOrder] = useState(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { settings } = useSettings();

  const getPaymentModeLabel = (mode) =>
    mode === 'Online' ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 rounded-full">
        <Smartphone className="w-2.5 h-2.5" />Online
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 rounded-full">
        <Truck className="w-2.5 h-2.5" />COD
      </span>
    );

  const displayedOrders = showAllOrders ? recentOrders : recentOrders.slice(0, 8);

  const handleDeleteConfirm = async () => {
    if (!deleteModalOrder || !onQuickDeleteOrder) return;
    setIsDeleting(true);
    try {
      await onQuickDeleteOrder(deleteModalOrder._id);
      setDeleteModalOrder(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xs border border-fv-border overflow-hidden mb-6"
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-fv-border bg-fv-surface/30">
          <div>
            <h2 className="text-sm font-bold text-fv-heading dark:text-white flex items-center gap-2">
              Recent Orders
              <span className="text-[11px] font-normal text-fv-muted">
                (Live Fulfillment Feed)
              </span>
            </h2>
            <p className="text-[11px] text-fv-muted">
              Fast in-place status management & quick order resolution
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-fv-primary dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
          >
            <span>Full Orders Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Desktop Column Header */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-4 py-2.5 bg-fv-surface/60 text-[11px] font-bold text-fv-muted uppercase tracking-wider border-b border-fv-border">
          <span className="col-span-2">Order ID</span>
          <span className="col-span-3">Customer</span>
          <span className="col-span-2">Date & Time</span>
          <span className="col-span-1 text-right">Amount</span>
          <span className="col-span-1 text-center">Payment</span>
          <span className="col-span-2">Status Transition</span>
          <span className="col-span-1 text-center">Actions</span>
        </div>

        <div className="divide-y divide-fv-border/70">
          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-fv-surface flex items-center justify-center text-fv-muted mb-2">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-fv-heading">No recent orders</p>
              <p className="text-xs text-fv-muted mt-0.5">Orders will appear here in real time as they arrive.</p>
            </div>
          ) : (
            displayedOrders.map((order) => {
              const orderNum = order.orderNumber || order._id.slice(-6).toUpperCase();
              return (
                <div key={order._id} className="p-3.5 hover:bg-fv-surface/40 transition-colors">
                  {/* Desktop Row */}
                  <div className="hidden lg:grid lg:grid-cols-12 gap-3 items-center text-xs">
                    <div className="col-span-2 flex items-center gap-1.5">
                      <Link
                        to={`/admin/orders?search=${orderNum}`}
                        className="font-mono font-bold text-fv-heading dark:text-white hover:text-fv-primary dark:hover:text-emerald-400 transition-colors"
                        title="Search this order in workspace"
                      >
                        #{orderNum}
                      </Link>
                    </div>

                    <div className="col-span-3 truncate">
                      <p className="font-semibold text-fv-heading dark:text-gray-100 truncate">
                        {order.shippingAddress?.name || order.userId?.name || 'Customer'}
                      </p>
                      <p className="text-[11px] text-fv-muted truncate">
                        {order.shippingAddress?.phone || order.userId?.phone || 'No phone'}
                      </p>
                    </div>

                    <span className="col-span-2 text-fv-muted text-[11px]">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <span className="col-span-1 text-right font-bold text-fv-heading dark:text-white">
                      ₹{order.totalAmount}
                    </span>

                    <div className="col-span-1 text-center">{getPaymentModeLabel(order.paymentMode)}</div>

                    <div className="col-span-2">
                      <select
                        value={order.orderStatus}
                        disabled={actionLoadingId === order._id}
                        onChange={(e) => onQuickStatusChange(order._id, e.target.value)}
                        className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-fv-border bg-white dark:bg-gray-800 cursor-pointer focus:outline-hidden focus:ring-1 focus:ring-fv-primary transition-all w-full ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        {ALL_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        {order.orderStatus === 'CancellationRequested' && (
                          <option value="CancellationRequested" disabled>
                            CancellationRequested
                          </option>
                        )}
                      </select>
                    </div>

                    <div className="col-span-1 flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInvoiceModalOrder(order)}
                        className="p-1.5 text-fv-muted hover:text-fv-heading hover:bg-fv-surface rounded-lg transition-colors"
                        title="Print invoice & packing slip"
                      >
                        <Printer className="w-3.5 h-3.5 text-fv-primary" />
                      </button>

                      <Link
                        to={`/admin/orders?search=${orderNum}`}
                        className="p-1.5 text-fv-muted hover:text-fv-heading hover:bg-fv-surface rounded-lg transition-colors"
                        title="View order details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      {onQuickDeleteOrder && (
                        <button
                          type="button"
                          onClick={() => setDeleteModalOrder(order)}
                          className="p-1.5 text-fv-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                          title="Delete test/unwanted order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mobile Row Card */}
                  <div className="lg:hidden space-y-2">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/admin/orders?search=${orderNum}`}
                        className="font-mono text-xs font-bold text-fv-heading hover:text-fv-primary"
                      >
                        #{orderNum}
                      </Link>
                      <div className="flex items-center gap-2">
                        {getPaymentModeLabel(order.paymentMode)}
                        <span className="font-bold text-sm text-fv-heading">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-fv-muted">
                      <span>{order.shippingAddress?.name || order.userId?.name || 'Customer'}</span>
                      <span className="text-[11px]">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-fv-border/50">
                      <select
                        value={order.orderStatus}
                        disabled={actionLoadingId === order._id}
                        onChange={(e) => onQuickStatusChange(order._id, e.target.value)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-fv-border bg-white dark:bg-gray-800 cursor-pointer flex-1 ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        {ALL_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                        {order.orderStatus === 'CancellationRequested' && (
                          <option value="CancellationRequested" disabled>
                            CancellationRequested
                          </option>
                        )}
                      </select>

                      <button
                        type="button"
                        onClick={() => setInvoiceModalOrder(order)}
                        className="p-2 text-fv-primary bg-fv-surface hover:bg-fv-border rounded-xl"
                        title="Print invoice"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      <Link
                        to={`/admin/orders?search=${orderNum}`}
                        className="px-3 py-1.5 text-xs font-semibold bg-fv-surface hover:bg-fv-border rounded-xl text-fv-heading"
                      >
                        Details
                      </Link>

                      {onQuickDeleteOrder && (
                        <button
                          type="button"
                          onClick={() => setDeleteModalOrder(order)}
                          className="p-2 text-red-600 bg-red-50 dark:bg-red-950/40 rounded-xl"
                          title="Delete order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Delete Order Confirmation Dialog */}
      <AdminConfirmModal
        isOpen={Boolean(deleteModalOrder)}
        title="Delete Order Permanently?"
        message={
          deleteModalOrder ? (
            <div className="space-y-2">
              <p>
                Are you sure you want to delete order{' '}
                <strong className="text-fv-heading dark:text-white font-mono">
                  #{deleteModalOrder.orderNumber || deleteModalOrder._id.slice(-6).toUpperCase()}
                </strong>{' '}
                ({deleteModalOrder.shippingAddress?.name || 'Customer'} · ₹{deleteModalOrder.totalAmount})?
              </p>
              <p className="text-red-600 dark:text-red-400 font-medium">
                ⚠️ This removes the order record completely. If this order had reserved or decremented stock, inventory will automatically be restored.
              </p>
            </div>
          ) : null
        }
        confirmText="Yes, Delete Order"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalOrder(null)}
      />

      {/* Tax Invoice & Dispatch Slip Modal */}
      <AdminInvoiceModal
        isOpen={Boolean(invoiceModalOrder)}
        onClose={() => setInvoiceModalOrder(null)}
        order={invoiceModalOrder}
        settings={settings}
      />
    </>
  );
};

export default RecentOrdersTable;
