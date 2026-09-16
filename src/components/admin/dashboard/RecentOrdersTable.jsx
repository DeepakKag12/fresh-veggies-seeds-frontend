import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Smartphone, Truck } from 'lucide-react';
import { ALL_STATUS_OPTIONS, getStatusColor } from '../../../config/adminOrderConfig';

export const RecentOrdersTable = ({
  recentOrders = [],
  actionLoadingId,
  showAllOrders,
  onQuickStatusChange,
}) => {
  const getPaymentModeLabel = (mode) =>
    mode === 'Online' ? (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">
        <Smartphone className="w-2.5 h-2.5" />Online
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 rounded-full">
        <Truck className="w-2.5 h-2.5" />COD
      </span>
    );

  const displayedOrders = showAllOrders ? recentOrders : recentOrders.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-[12px] shadow-sm border border-fv-border overflow-hidden mb-6"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-fv-border">
        <div>
          <h2 className="text-sm font-bold text-fv-heading">Recent Orders</h2>
          <p className="text-[11px] text-fv-muted">{recentOrders.length} latest</p>
        </div>
        <Link
          to="/admin/orders"
          className="rounded-[50px] bg-fv-cream dark:bg-gray-700 px-3 py-1.5 text-xs font-semibold text-fv-primary dark:text-emerald-400 transition-colors hover:bg-fv-border/40"
        >
          View all →
        </Link>
      </div>

      {/* Desktop Column Header */}
      <div className="hidden md:grid md:grid-cols-12 gap-2 px-4 py-2 bg-fv-page/50 text-[11px] font-semibold text-fv-muted uppercase tracking-wide border-b border-fv-border">
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
            <p className="text-sm font-medium text-fv-muted">No orders yet</p>
            <p className="text-xs text-gray-400 dark:text-fv-muted mt-1">Orders will appear here once customers place them</p>
          </div>
        ) : (
          displayedOrders.map((order) => (
            <div key={order._id} className="p-3 hover:bg-fv-page/30 transition-colors">
              {/* Desktop Row */}
              <div className="hidden md:grid md:grid-cols-12 gap-2 items-center text-xs">
                <Link to="/admin/orders" className="col-span-2 font-mono font-bold text-fv-heading hover:text-fv-primary">
                  #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                </Link>
                <span className="col-span-3 font-medium text-fv-heading truncate">
                  {order.shippingAddress?.name || order.userId?.name || 'Customer'}
                </span>
                <span className="col-span-2 text-fv-muted text-[11px]">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                </span>
                <span className="col-span-2 font-bold text-fv-heading">₹{order.totalAmount}</span>
                <div className="col-span-2">
                  <select
                    value={order.orderStatus}
                    disabled={actionLoadingId === order._id}
                    onChange={(e) => onQuickStatusChange(order._id, e.target.value)}
                    className={`text-[10px] font-semibold px-2 py-1 rounded-full border cursor-pointer focus:outline-none ${getStatusColor(order.orderStatus)}`}
                  >
                    {ALL_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    {order.orderStatus === 'CancellationRequested' && (
                      <option value="CancellationRequested" disabled>CancellationRequested</option>
                    )}
                  </select>
                </div>
                <div className="col-span-1">{getPaymentModeLabel(order.paymentMode)}</div>
              </div>

              {/* Mobile Card */}
              <div className="md:hidden space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-fv-heading">
                    #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {getPaymentModeLabel(order.paymentMode)}
                    <select
                      value={order.orderStatus}
                      disabled={actionLoadingId === order._id}
                      onChange={(e) => onQuickStatusChange(order._id, e.target.value)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none ${getStatusColor(order.orderStatus)}`}
                    >
                      {ALL_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                      {order.orderStatus === 'CancellationRequested' && (
                        <option value="CancellationRequested" disabled>CancellationRequested</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-fv-muted">
                  <span>{order.shippingAddress?.name || order.userId?.name || 'Customer'}</span>
                  <span className="font-bold text-fv-heading">₹{order.totalAmount}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default RecentOrdersTable;
