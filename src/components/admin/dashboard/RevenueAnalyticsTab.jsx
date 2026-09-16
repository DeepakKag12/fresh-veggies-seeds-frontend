import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Truck } from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('en-IN');
const pct = (part, total) => (total > 0 ? Math.round((part / total) * 100) : 0);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const buildMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return options;
};
const MONTH_OPTIONS = buildMonthOptions();

const PERIOD_BUTTONS = [
  { id: '7days', label: '7 Days' },
  { id: '30days', label: '30 Days' },
  { id: '90days', label: '90 Days' },
  { id: 'thismonth', label: 'This Month' },
  { id: 'lastmonth', label: 'Last Month' },
  { id: 'yearly', label: 'This Year' },
  { id: 'specificmonth', label: '📅 Pick Month' },
];

export const RevenueAnalyticsTab = ({
  analytics,
  analyticsLoading,
  period,
  specificMonth,
  showMonthPicker,
  setShowMonthPicker,
  productSort,
  setProductSort,
  onPeriodChange,
  onMonthSelect,
}) => {
  const paymentSplit = analytics?.paymentSplit || [];
  const splitOnline = paymentSplit.find((s) => s._id === 'Online')?.revenue || 0;
  const splitCOD = paymentSplit.find((s) => s._id === 'COD')?.revenue || 0;
  const splitTotal = splitOnline + splitCOD;
  const splitOnlineOrders = paymentSplit.find((s) => s._id === 'Online')?.orders || 0;
  const splitCODOrders = paymentSplit.find((s) => s._id === 'COD')?.orders || 0;
  const splitOnlineAvg = paymentSplit.find((s) => s._id === 'Online')?.avgOrderValue || 0;
  const splitCODAvg = paymentSplit.find((s) => s._id === 'COD')?.avgOrderValue || 0;

  const sortedProducts = analytics?.topProducts
    ? [...analytics.topProducts].sort((a, b) =>
        productSort === 'units' ? b.totalSold - a.totalSold : b.revenue - a.revenue
      )
    : [];

  return (
    <div className="space-y-6">
      {/* Period Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {PERIOD_BUTTONS.map((btn) => (
          <button
            key={btn.id}
            onClick={() => onPeriodChange(btn.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              period === btn.id
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow-xs'
                : 'bg-white dark:bg-gray-800 text-fv-muted border-fv-border hover:border-fv-primary'
            }`}
          >
            {btn.id === 'specificmonth' && specificMonth
              ? `📅 ${MONTH_NAMES[specificMonth.month - 1]} ${specificMonth.year}`
              : btn.label}
          </button>
        ))}
      </div>

      {/* Month Picker Dropdown */}
      {showMonthPicker && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-fv-border p-3 grid grid-cols-3 sm:grid-cols-6 gap-2 shadow-lg"
        >
          {MONTH_OPTIONS.map((opt) => (
            <button
              key={`${opt.year}-${opt.month}`}
              onClick={() => onMonthSelect(opt)}
              className="text-xs p-2 rounded-lg hover:bg-fv-surface text-fv-heading font-medium border border-fv-border/50 text-center"
            >
              {opt.label}
            </button>
          ))}
        </motion.div>
      )}

      {analyticsLoading ? (
        <div className="h-64 bg-white dark:bg-gray-800 rounded-2xl border border-fv-border animate-pulse" />
      ) : (
        <>
          {/* Payment Split Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-fv-heading">Online Payments (Razorpay)</h4>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                  {pct(splitOnline, splitTotal)}% of total
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="bg-fv-surface/40 p-2 rounded-xl">
                  <p className="text-[11px] text-fv-muted">Revenue</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">₹{fmt(splitOnline)}</p>
                </div>
                <div className="bg-fv-surface/40 p-2 rounded-xl">
                  <p className="text-[11px] text-fv-muted">Orders</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">{splitOnlineOrders}</p>
                </div>
                <div className="bg-fv-surface/40 p-2 rounded-xl">
                  <p className="text-[11px] text-fv-muted">Avg Order</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">₹{fmt(Math.round(splitOnlineAvg))}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-600" />
                  <h4 className="text-sm font-bold text-fv-heading">Cash on Delivery (COD)</h4>
                </div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                  {pct(splitCOD, splitTotal)}% of total
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="bg-fv-surface/40 p-2 rounded-xl">
                  <p className="text-[11px] text-fv-muted">Revenue</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">₹{fmt(splitCOD)}</p>
                </div>
                <div className="bg-fv-surface/40 p-2 rounded-xl">
                  <p className="text-[11px] text-fv-muted">Orders</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">{splitCODOrders}</p>
                </div>
                <div className="bg-fv-surface/40 p-2 rounded-xl">
                  <p className="text-[11px] text-fv-muted">Avg Order</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">₹{fmt(Math.round(splitCODAvg))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-fv-border">
              <h3 className="text-sm font-bold text-fv-heading">Top Performing Products</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => setProductSort('revenue')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    productSort === 'revenue' ? 'bg-fv-primary text-white' : 'bg-fv-surface text-fv-muted'
                  }`}
                >
                  By Revenue
                </button>
                <button
                  onClick={() => setProductSort('units')}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    productSort === 'units' ? 'bg-fv-primary text-white' : 'bg-fv-surface text-fv-muted'
                  }`}
                >
                  By Units Sold
                </button>
              </div>
            </div>
            <div className="divide-y divide-fv-border max-h-80 overflow-y-auto">
              {sortedProducts.length === 0 ? (
                <p className="p-8 text-center text-xs text-fv-muted">No sales data for this period</p>
              ) : (
                sortedProducts.map((prod, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-fv-muted w-5">{idx + 1}.</span>
                      <span className="font-semibold text-fv-heading truncate">{prod.name}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="text-fv-muted">{prod.totalSold || 0} units</span>
                      <span className="font-bold text-fv-heading">₹{fmt(prod.revenue || 0)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenueAnalyticsTab;
