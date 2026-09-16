import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Clock,
  MapPin,
  Flame,
  AlertTriangle,
  PackageCheck,
  Percent
} from 'lucide-react';

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

export const AnalyticsTab = ({
  analyticsData,
  loading,
  period,
  specificMonth,
  showMonthPicker,
  setShowMonthPicker,
  productSort,
  setProductSort,
  onPeriodChange,
  onMonthSelect,
}) => {
  const [velocitySort, setVelocitySort] = useState('units');

  const operational = analyticsData?.operational || {
    totalOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    inTransitOrders: 0,
    fulfillmentRate: 0,
    cancellationRate: 0,
    fulfillmentFunnel: [],
    hourlyDistribution: [],
    geographicDistribution: [],
    lowStockRisk: [],
  };

  const hourlyList = operational.hourlyDistribution || [];
  const maxHourlyCount = Math.max(...hourlyList.map((h) => h.orderCount), 1);

  // Find peak hour window
  let peakHour = null;
  if (hourlyList.length > 0) {
    peakHour = [...hourlyList].sort((a, b) => b.orderCount - a.orderCount)[0];
  }

  const sortedProducts = analyticsData?.topProducts
    ? [...analyticsData.topProducts].sort((a, b) =>
        velocitySort === 'units' ? b.totalSold - a.totalSold : b.revenue - a.revenue
      )
    : [];

  const geoList = operational.geographicDistribution || [];
  const totalGeoRev = geoList.reduce((acc, g) => acc + g.revenue, 0);

  return (
    <div className="space-y-6">
      {/* ── Period Selector Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-fv-border shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-fv-heading flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            Operations & Customer Behavior Analytics
          </h2>
          <p className="text-[11px] text-fv-muted">
            Analyze peak shopping hours, pan-India regional demand, funnel conversion, and product velocity.
          </p>
        </div>

        {/* Period Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
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

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white dark:bg-gray-800 rounded-2xl border border-fv-border animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-white dark:bg-gray-800 rounded-2xl border border-fv-border animate-pulse" />
        </div>
      ) : (
        <>
          {/* ── Behavioral & Operational KPI Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Total Demand Volume */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-fv-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Order Volume</span>
                <PackageCheck className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-fv-heading tracking-tight">{operational.totalOrders}</p>
              <p className="text-[10px] text-fv-muted">{operational.deliveredOrders} fulfilled · {operational.inTransitOrders} active</p>
            </div>

            {/* Fulfillment Conversion Rate */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-fv-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Fulfillment Rate</span>
                <Percent className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-fv-heading tracking-tight text-emerald-600 dark:text-emerald-400">
                {operational.fulfillmentRate}%
              </p>
              <p className="text-[10px] text-fv-muted">Cancellation: {operational.cancellationRate}%</p>
            </div>

            {/* Peak Ordering Hour */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-fv-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Peak Rush Hour</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-fv-heading tracking-tight text-amber-600">
                {peakHour ? `${peakHour._id % 12 || 12} ${peakHour._id >= 12 ? 'PM' : 'AM'}` : 'N/A'}
              </p>
              <p className="text-[10px] text-fv-muted">
                {peakHour ? `${peakHour.orderCount} orders in this window` : 'Even traffic'}
              </p>
            </div>

            {/* Inventory Stock Risk */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-fv-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Low-Stock Watchlist</span>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-xl md:text-2xl font-black text-fv-heading tracking-tight text-red-500">
                {operational.lowStockRisk.length}
              </p>
              <p className="text-[10px] text-fv-muted">Products requiring restocking</p>
            </div>
          </div>

          {/* ── 24-Hour Peak Ordering Heatmap & Distribution ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-fv-heading flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  24-Hour Shopping Activity & Rush Hours
                </h3>
                <p className="text-[11px] text-fv-muted">Hourly distribution of customer checkout activity (IST)</p>
              </div>
            </div>

            <div className="h-40 flex items-end gap-1.5 pt-4 border-b border-fv-border pb-2 overflow-x-auto">
              {[...Array(24)].map((_, hour) => {
                const found = hourlyList.find((h) => h._id === hour);
                const count = found ? found.orderCount : 0;
                const heightPct = count > 0 ? Math.max(12, Math.round((count / maxHourlyCount) * 100)) : 4;
                const isPeak = peakHour && peakHour._id === hour;

                return (
                  <div key={hour} className="flex-1 min-w-[24px] flex flex-col items-center gap-1 group">
                    <div className="text-[9px] font-bold text-fv-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {count} orders
                    </div>
                    <div className="w-full bg-fv-surface rounded-t-md relative flex flex-col justify-end overflow-hidden" style={{ height: `${heightPct}%` }}>
                      <div
                        className={`w-full h-full transition-all ${
                          isPeak ? 'bg-amber-500' : count > 0 ? 'bg-indigo-600' : 'bg-transparent'
                        }`}
                        title={`${hour}:00 - ${count} orders`}
                      />
                    </div>
                    <span className={`text-[9px] font-semibold ${isPeak ? 'text-amber-600 font-bold' : 'text-fv-muted'}`}>
                      {hour % 6 === 0 ? `${hour}h` : ''}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-fv-muted px-1">
              <span>12 AM (Midnight)</span>
              <span>6 AM (Morning)</span>
              <span>12 PM (Noon)</span>
              <span>6 PM (Evening)</span>
              <span>11 PM (Night)</span>
            </div>
          </div>

          {/* ── Pan-India Regional Sales Distribution & Product Velocity ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Regional Demand by Indian State */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-fv-border pb-2.5">
                <h3 className="text-sm font-bold text-fv-heading flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Geographical Distribution (Top States)
                </h3>
                <span className="text-xs text-fv-muted font-medium">Pan-India Reach</span>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {geoList.length === 0 ? (
                  <p className="text-xs text-fv-muted text-center py-8">No regional shipping data in period</p>
                ) : (
                  geoList.map((geo, idx) => {
                    const share = pct(geo.revenue, totalGeoRev);
                    return (
                      <div key={geo._id || idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <div className="flex items-center gap-2">
                            <span className="text-fv-muted font-bold text-[11px]">{idx + 1}.</span>
                            <span className="text-fv-heading">{geo._id || 'Standard Delivery Zone'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-fv-muted">{geo.orderCount} order(s)</span>
                            <span className="font-bold text-fv-heading">₹{fmt(geo.revenue)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-fv-surface rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.max(share, 5)}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Product Velocity & Top Movers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-fv-border pb-2.5">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-bold text-fv-heading">Product Sales Velocity</h3>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setVelocitySort('units')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      velocitySort === 'units' ? 'bg-fv-primary text-white' : 'bg-fv-surface text-fv-muted'
                    }`}
                  >
                    By Volume
                  </button>
                  <button
                    onClick={() => setVelocitySort('revenue')}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                      velocitySort === 'revenue' ? 'bg-fv-primary text-white' : 'bg-fv-surface text-fv-muted'
                    }`}
                  >
                    By Revenue
                  </button>
                </div>
              </div>
              <div className="divide-y divide-fv-border max-h-72 overflow-y-auto pr-1">
                {sortedProducts.length === 0 ? (
                  <p className="text-xs text-fv-muted text-center py-8">No product sales data in period</p>
                ) : (
                  sortedProducts.map((p, idx) => (
                    <div key={p._id || idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-bold text-fv-muted w-4">{idx + 1}.</span>
                        <div className="min-w-0">
                          <p className="font-bold text-fv-heading truncate">{p.name}</p>
                          <p className="text-[10px] text-fv-muted">Stock Remaining: {p.stock ?? 'N/A'}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-fv-heading">{p.totalSold} units</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">₹{fmt(p.revenue)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Low-Stock Depletion Risk Alert Table ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border overflow-hidden shadow-xs">
            <div className="p-4 border-b border-fv-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-fv-heading flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Inventory Velocity & Depletion Watchlist
                </h3>
                <p className="text-[11px] text-fv-muted">Products requiring stock replenishment to prevent stockouts</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-fv-surface/60 border-b border-fv-border text-[11px] text-fv-muted font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Product Name</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-center">Current Stock</th>
                    <th className="py-2.5 px-4">Price</th>
                    <th className="py-2.5 px-4 text-right">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fv-border">
                  {operational.lowStockRisk.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-emerald-600 font-semibold">
                        ✅ All inventory levels are healthy with zero low-stock alerts
                      </td>
                    </tr>
                  ) : (
                    operational.lowStockRisk.map((item) => (
                      <tr key={item._id} className="hover:bg-fv-surface/40 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-fv-heading">{item.name}</td>
                        <td className="py-2.5 px-4 text-fv-muted">{item.categoryId?.name || 'Produce'}</td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.stock <= 0
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {item.stock <= 0 ? 'Out of Stock (0)' : `${item.stock} left`}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-fv-heading font-semibold">₹{fmt(item.price)}</td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                            {item.stock <= 0 ? 'CRITICAL' : 'REORDER SOON'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsTab;
