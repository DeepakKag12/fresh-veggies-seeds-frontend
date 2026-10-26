import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { getProductImageUrl, handleImageError, DEFAULT_PRODUCT_IMAGE } from '../../../utils/imageFallback';

export const LowStockWarningTable = ({ lowStockProducts = [] }) => {
  if (!lowStockProducts || lowStockProducts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200/90 dark:border-gray-800 shadow-2xs mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Inventory Health Optimal</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                All store products are comfortably stocked above low-stock thresholds.
              </p>
            </div>
          </div>
          <Link
            to="/admin/products"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            <span>Product Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/90 dark:border-gray-800 shadow-2xs overflow-hidden mb-6">
      {/* Table Header */}
      <div className="p-4 md:p-5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-rose-50/30 dark:bg-rose-950/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Urgent Low Stock Warnings
              </h3>
              <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {lowStockProducts.length} Items Critical
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              These products have fallen below minimum thresholds and risk cart stockout errors.
            </p>
          </div>
        </div>

        <Link
          to="/admin/products?lowstock=true"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
        >
          <span>Manage All Inventory</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4">Product</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Remaining Stock</th>
              <th className="py-3 px-4">Price</th>
              <th className="py-3 px-4">Urgency</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
            {lowStockProducts.map((p) => {
              const stock = p.stock ?? 0;
              const isCritical = stock <= 5;
              const imageUrl = getProductImageUrl(p);
              const categoryName = p.categoryId?.name || p.category || 'Fresh Produce';

              return (
                <tr
                  key={p._id}
                  className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  {/* Product Thumbnail & Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0 flex items-center justify-center border border-gray-200/60 dark:border-gray-700">
                        <img
                          src={imageUrl}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            handleImageError(e, DEFAULT_PRODUCT_IMAGE);
                          }}
                        />
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                        {p.name}
                      </span>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                    {categoryName}
                  </td>

                  {/* Remaining Stock with badge */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-black text-xs ${
                        isCritical
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {stock} units left
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                    ₹{p.price}
                  </td>

                  {/* Urgency */}
                  <td className="py-3 px-4">
                    <span
                      className={`text-[11px] font-bold ${
                        isCritical
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isCritical ? 'CRITICAL RESTOCK' : 'LOW LEVEL'}
                    </span>
                  </td>

                  {/* Restock Action Link */}
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/admin/products?search=${encodeURIComponent(p.name)}`}
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                    >
                      <span>Restock</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LowStockWarningTable;
