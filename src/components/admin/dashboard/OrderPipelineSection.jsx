import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
} from 'lucide-react';

export const OrderPipelineSection = ({ stats, lowStockProducts = [] }) => {
  const pipelineStatuses = [
    { status: 'Pending',   count: stats.pendingOrders,   icon: Clock,         border: 'border-amber-200 dark:border-amber-800',  bg: 'bg-fv-cream',   text: 'text-amber-700 dark:text-amber-400',   iconColor: 'text-amber-500' },
    { status: 'Confirmed', count: stats.confirmedOrders, icon: CheckCircle,   border: 'border-blue-200 dark:border-blue-800',    bg: 'bg-fv-cream',     text: 'text-blue-700 dark:text-blue-400',     iconColor: 'text-blue-500' },
    { status: 'Shipped',   count: stats.shippedOrders,   icon: Truck,         border: 'border-purple-200 dark:border-purple-800', bg: 'bg-fv-cream', text: 'text-purple-700 dark:text-purple-400', iconColor: 'text-purple-500' },
    { status: 'Delivered', count: stats.deliveredOrders, icon: CheckCircle,   border: 'border-green-200 dark:border-green-800',  bg: 'bg-fv-cream',   text: 'text-fv-primary-dark dark:text-green-400',   iconColor: 'text-green-500' },
    { status: 'Cancelled', count: stats.cancelledOrders, icon: AlertCircle,   border: 'border-red-200 dark:border-red-800',      bg: 'bg-fv-cream',       text: 'text-red-700 dark:text-red-400',       iconColor: 'text-red-500' },
  ];

  return (
    <div className="space-y-4 mb-4">
      {/* Order Status Pipeline */}
      <div className="bg-white dark:bg-gray-800 rounded-[12px] shadow-sm border border-fv-border p-4">
        <h2 className="text-sm font-semibold text-fv-ink mb-3">Order Status</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {pipelineStatuses.map(({ status, count, icon: Icon, border, bg, text, iconColor }) => (
            <Link key={status} to={`/admin/orders?status=${status}`} className="flex-shrink-0">
              <div className={`${bg} border ${border} rounded-[12px] p-3.5 min-w-[108px] transition-all`}>
                <Icon className={`w-5 h-5 ${iconColor} mb-2`} />
                <p className={`text-2xl font-bold ${text}`}>{count || 0}</p>
                <p className="text-xs text-fv-muted mt-0.5">{status}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-[12px] p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="text-sm font-bold text-red-800 dark:text-red-300">Low Stock Alert</h3>
              <span className="text-xs bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300 font-semibold px-2 py-0.5 rounded-full">
                {lowStockProducts.length}
              </span>
            </div>
            <Link to="/admin/products" className="text-xs text-red-700 dark:text-red-400 font-semibold hover:underline">
              View all →
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {lowStockProducts.slice(0, 6).map((product) => (
              <div key={product._id} className="flex-shrink-0 bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 rounded-lg px-3 py-2 shadow-sm min-w-[140px]">
                <p className="text-xs font-semibold text-fv-heading truncate mb-1">{product.name}</p>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">⚠ Only {product.stock} left</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OrderPipelineSection;
