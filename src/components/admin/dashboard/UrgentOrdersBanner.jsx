import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  XCircle,
  ChevronRight,
  RefreshCw,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

/**
 * Stripe-Grade Urgent Action Section
 * Clean, uncluttered layout with generous whitespace, subtle borders,
 * and high-contrast readable typography for operational urgency.
 */
export const UrgentOrdersBanner = ({
  stats = {},
  actionLoadingId = null,
  onQuickConfirm,
  onQuickApproveCancel,
}) => {
  const pendingOrders = stats.pendingOrders || 0;
  const cancellationRequests = stats.cancellationRequests || 0;
  const failedPayments = stats.failedPayments || 0;
  const lowStock = (stats.lowStockProducts || 0) + (stats.outOfStockProducts || 0);
  const urgentCount = pendingOrders + cancellationRequests + failedPayments + (lowStock > 0 ? 1 : 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-slate-200/90 dark:border-gray-800 rounded-2xl p-5 md:p-6 mb-6 shadow-xs">
      {/* Urgency Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Action Required Today
              {urgentCount > 0 ? (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                  {pendingOrders + cancellationRequests} urgent
                </span>
              ) : (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                  All resolved
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Immediate store operations requiring administrative approval and fulfillment
            </p>
          </div>
        </div>

        <Link
          to="/admin/orders?status=urgent"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
        >
          <span>All Urgent Orders</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Stripe-Grade 3 Action Cards (Pending Orders, Low Stock, Failed Payments) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Card 1: Urgent Pending Orders */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            pendingOrders > 0
              ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/90 dark:border-amber-800/60'
              : 'bg-slate-50/60 dark:bg-gray-800/40 border-slate-200/70 dark:border-gray-700/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Pending Fulfillment
            </span>
            <span
              className={`text-lg font-black ${
                pendingOrders > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-400'
              }`}
            >
              {pendingOrders}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            {pendingOrders > 0
              ? `${pendingOrders} order(s) awaiting verification & confirmation.`
              : 'Zero unverified orders pending right now.'}
          </p>
          <Link
            to="/admin/orders?status=Pending"
            className="inline-flex items-center justify-center w-full py-2 px-3 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-800 dark:text-white border border-slate-200/90 dark:border-gray-700 shadow-2xs transition-all"
          >
            Review & Confirm
          </Link>
        </div>

        {/* Card 2: Low Stock Warnings */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            lowStock > 0
              ? 'bg-orange-50/60 dark:bg-orange-950/20 border-orange-200/90 dark:border-orange-800/60'
              : 'bg-slate-50/60 dark:bg-gray-800/40 border-slate-200/70 dark:border-gray-700/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
              Low / Out of Stock
            </span>
            <span
              className={`text-lg font-black ${
                lowStock > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-slate-400'
              }`}
            >
              {lowStock}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            {lowStock > 0
              ? `${lowStock} item(s) below safety replenishment threshold.`
              : 'All catalog inventory levels healthy.'}
          </p>
          <Link
            to="/admin/products?lowstock=true"
            className="inline-flex items-center justify-center w-full py-2 px-3 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-800 dark:text-white border border-slate-200/90 dark:border-gray-700 shadow-2xs transition-all"
          >
            Restock Inventory
          </Link>
        </div>

        {/* Card 3: Cancellations & Failed Payments */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            cancellationRequests > 0 || failedPayments > 0
              ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200/90 dark:border-rose-800/60'
              : 'bg-slate-50/60 dark:bg-gray-800/40 border-slate-200/70 dark:border-gray-700/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Cancellations & Failed
            </span>
            <span
              className={`text-lg font-black ${
                cancellationRequests > 0 || failedPayments > 0
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {cancellationRequests + failedPayments}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
            {cancellationRequests > 0
              ? `${cancellationRequests} customer cancellation request(s) waiting.`
              : failedPayments > 0
              ? `${failedPayments} checkout payment(s) marked as failed.`
              : 'No payment disputes or pending cancellations.'}
          </p>
          <Link
            to="/admin/orders?status=CancellationRequested"
            className="inline-flex items-center justify-center w-full py-2 px-3 rounded-lg text-xs font-bold bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 text-slate-800 dark:text-white border border-slate-200/90 dark:border-gray-700 shadow-2xs transition-all"
          >
            Inspect Exceptions
          </Link>
        </div>
      </div>

      {/* Individual High Priority Orders with 1-Click Action */}
      {stats.urgentOrders && stats.urgentOrders.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-gray-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Immediate 1-Click Action Queue
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stats.urgentOrders.slice(0, 4).map((order) => {
              const isCancel = order.orderStatus === 'CancellationRequested';
              return (
                <div
                  key={order._id}
                  className="bg-slate-50/70 dark:bg-gray-800/60 rounded-xl border border-slate-200/80 dark:border-gray-700 p-3.5 flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate">
                        #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCancel
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                        }`}
                      >
                        {isCancel ? 'Cancel Req' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                      <span>{order.customerName || order.user?.name || 'Customer'}</span>
                      <span>•</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        ₹{order.totalAmount}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{order.paymentMode}</span>
                    </div>
                  </div>

                  {/* 1-Click Action */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCancel ? (
                      <button
                        type="button"
                        disabled={actionLoadingId === order._id}
                        onClick={() => onQuickApproveCancel?.(order._id)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                      >
                        {actionLoadingId === order._id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionLoadingId === order._id}
                        onClick={() => onQuickConfirm?.(order._id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                      >
                        {actionLoadingId === order._id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirm</span>
                          </>
                        )}
                      </button>
                    )}
                    <Link
                      to="/admin/orders"
                      state={{ focusOrderId: order._id }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-gray-700 transition-colors"
                      title="Inspect order"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl p-3 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">
            All caught up! No urgent orders pending administrative action right now.
          </span>
        </div>
      )}
    </div>
  );
};

export default UrgentOrdersBanner;
