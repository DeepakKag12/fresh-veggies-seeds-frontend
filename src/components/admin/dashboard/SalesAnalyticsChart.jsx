import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  PieChart as PieIcon,
  Calendar,
  BarChart2
} from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('en-IN');

const STATUS_COLORS = {
  Delivered: '#10b981', // emerald-500
  Pending: '#f59e0b',   // amber-500
  Cancelled: '#f43f5e', // rose-500
  Confirmed: '#3b82f6', // blue-500
  Packed: '#8b5cf6',    // purple-500
  Shipped: '#06b6d4',   // cyan-500
  CancellationRequested: '#ec4899', // pink-500
};

export const SalesAnalyticsChart = ({
  analyticsData = {},
  stats = {},
  period = '30days',
  onPeriodChange,
  loading = false
}) => {
  const [chartType, setChartType] = useState('revenue'); // 'revenue' | 'orders'

  // Time series data with guaranteed zero-revenue fallback
  const rawDaily = analyticsData?.dailyRevenue || [];
  const chartData = rawDaily.map((item) => {
    const rawDate = item._id || item.date || '';
    let label = rawDate;
    if (rawDate && rawDate.length >= 10) {
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        label = `${parts[2]}/${parts[1]}`;
      }
    }
    return {
      date: label,
      fullDate: rawDate,
      revenue: item.revenue || 0,
      orders: item.orders || 0,
      onlineRevenue: item.onlineRevenue || 0,
      codRevenue: item.codRevenue || 0
    };
  });

  // Calculate totals for active period
  const totalPeriodRevenue = chartData.reduce((acc, d) => acc + d.revenue, 0);
  const totalPeriodOrders = chartData.reduce((acc, d) => acc + d.orders, 0);

  // Order status distribution for pie chart
  const statusCounts = [
    { name: 'Delivered', value: stats.deliveredOrders || 0, color: STATUS_COLORS.Delivered },
    { name: 'Pending', value: stats.pendingOrders || 0, color: STATUS_COLORS.Pending },
    { name: 'Cancelled', value: (stats.cancelledOrders || 0) + (stats.cancellationRequests || 0), color: STATUS_COLORS.Cancelled },
    { name: 'In Transit', value: (stats.shippedOrders || 0) + (stats.packedOrders || 0) + (stats.confirmedOrders || 0), color: STATUS_COLORS.Confirmed },
  ].filter((s) => s.value > 0);

  const totalStatusOrders = statusCounts.reduce((acc, s) => acc + s.value, 0) || stats.totalOrders || 1;

  const presets = [
    { id: 'today', label: 'Today' },
    { id: '7days', label: '7D' },
    { id: '30days', label: '30D' },
    { id: 'yearly', label: '1Y' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {/* ── Main Time-Series Sales Chart (2 cols on large) ── */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200/90 dark:border-gray-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Sales & Order Velocity
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              ₹{fmt(totalPeriodRevenue)} total &bull; {totalPeriodOrders} order(s) across selected timeframe
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700/60 p-0.5 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setChartType('revenue')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  chartType === 'revenue'
                    ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                Revenue (₹)
              </button>
              <button
                type="button"
                onClick={() => setChartType('orders')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  chartType === 'orders'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                }`}
              >
                Orders
              </button>
            </div>

            {/* Filter Presets (Today, 7D, 30D, 1Y) */}
            <div className="flex bg-gray-100 dark:bg-gray-700/60 p-0.5 rounded-xl text-xs font-semibold">
              {presets.map((preset) => {
                const isActive = period === preset.id || (preset.id === '30days' && period === '30d') || (preset.id === '7days' && period === '7d');
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onPeriodChange && onPeriodChange(preset.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recharts Area / Bar Chart Container */}
        <div className="h-[260px] w-full">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/20 rounded-xl animate-pulse">
              <span className="text-xs text-gray-400">Loading live analytics...</span>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-center p-4">
              <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-xs font-medium text-gray-500">No transactions recorded for this period</p>
            </div>
          ) : chartType === 'revenue' ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white p-2.5 rounded-xl shadow-xl text-xs border border-gray-800">
                          <p className="text-gray-400 text-[10px] font-semibold">{data.fullDate || data.date}</p>
                          <p className="text-emerald-400 font-bold text-sm mt-0.5">₹{fmt(data.revenue)}</p>
                          <p className="text-gray-300 text-[11px] mt-0.5">{data.orders} order(s)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white p-2.5 rounded-xl shadow-xl text-xs border border-gray-800">
                          <p className="text-gray-400 text-[10px] font-semibold">{data.fullDate || data.date}</p>
                          <p className="text-blue-400 font-bold text-sm mt-0.5">{data.orders} Order(s)</p>
                          <p className="text-gray-300 text-[11px] mt-0.5">Revenue: ₹{fmt(data.revenue)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Order Status Doughnut / Pie Chart (1 col on large) ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-200/90 dark:border-gray-800 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Order Statuses</h3>
            </div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              {stats.totalOrders || 0} Total
            </span>
          </div>

          <div className="h-[180px] w-full relative flex items-center justify-center">
            {statusCounts.length === 0 ? (
              <div className="text-center text-xs text-gray-400">No orders recorded</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusCounts}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`${val} orders`, name]}
                      contentStyle={{
                        backgroundColor: '#111827',
                        borderRadius: '0.75rem',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Callout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                    {stats.totalOrders || 0}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Orders</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status Legend Breakdown */}
        <div className="space-y-1.5 pt-3 border-t border-gray-100 dark:border-gray-800">
          {statusCounts.map((item) => {
            const share = Math.round((item.value / totalStatusOrders) * 100);
            return (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">{item.value}</span>
                  <span className="text-[10px] text-gray-400 w-8 text-right font-medium">{share}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SalesAnalyticsChart;
