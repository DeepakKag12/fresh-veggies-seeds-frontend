import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  CreditCard,
  Boxes,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

export const UrgentOrdersBanner = ({
  stats,
  actionLoadingId,
  onQuickConfirm,
  onQuickApproveCancel,
}) => {
  const urgentCount = (stats.pendingOrders || 0) + (stats.cancellationRequests || 0);

  return (
    <div className="bg-gradient-to-r from-red-500/10 via-amber-500/10 to-transparent border border-red-200 dark:border-red-900/40 rounded-2xl p-4 md:p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Orders Requiring Action
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-600 text-white shadow-sm">
              {urgentCount} URGENT
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
                        onClick={() => onQuickApproveCancel(order._id)}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1 min-h-[36px]"
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
                        onClick={() => onQuickConfirm(order._id)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1 min-h-[36px]"
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
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
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
  );
};

export default UrgentOrdersBanner;
