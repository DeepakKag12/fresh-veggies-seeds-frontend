import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Truck,
  RotateCcw,
  Users,
  Search,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  FileText
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

export const RevenueTab = ({
  revenueData,
  loading,
  period,
  specificMonth,
  showMonthPicker,
  setShowMonthPicker,
  onPeriodChange,
  onMonthSelect,
}) => {
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState('ALL');

  const kpis = revenueData?.kpis || {
    grossRevenue: 0,
    netRevenue: 0,
    onlineRevenue: 0,
    codRevenue: 0,
    refundedAmount: 0,
    estimatedGatewayFees: 0,
    avgOrderValue: 0,
    paidOrdersCount: 0,
    refundedOrdersCount: 0,
  };

  const paymentSplit = revenueData?.paymentSplit || [];
  const splitOnline = paymentSplit.find((s) => s._id === 'Online')?.revenue || 0;
  const splitCOD = paymentSplit.find((s) => s._id === 'COD')?.revenue || 0;
  const splitTotal = splitOnline + splitCOD;
  const splitOnlineOrders = paymentSplit.find((s) => s._id === 'Online')?.orders || 0;
  const splitCODOrders = paymentSplit.find((s) => s._id === 'COD')?.orders || 0;
  const splitOnlineAvg = paymentSplit.find((s) => s._id === 'Online')?.avgOrderValue || 0;
  const splitCODAvg = paymentSplit.find((s) => s._id === 'COD')?.avgOrderValue || 0;

  const monthlyTrend = revenueData?.monthlyRevenue || [];
  const maxMonthRev = Math.max(...monthlyTrend.map((m) => m.revenue), 1000);

  const topCustomers = revenueData?.topCustomers || [];
  const categoryRevenue = revenueData?.categoryRevenue || [];
  const totalCatRev = categoryRevenue.reduce((acc, c) => acc + c.revenue, 0);

  // Filtered Transaction Ledger
  const transactions = useMemo(() => {
    const list = revenueData?.recentTransactions || [];
    return list.filter((t) => {
      const matchSearch =
        !ledgerSearch ||
        t.orderNumber?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        t.customerName?.toLowerCase().includes(ledgerSearch.toLowerCase()) ||
        t.customerPhone?.includes(ledgerSearch);

      if (!matchSearch) return false;
      if (ledgerFilter === 'ONLINE') return t.paymentMode === 'Online';
      if (ledgerFilter === 'COD') return t.paymentMode === 'COD';
      if (ledgerFilter === 'REFUNDED') return t.paymentStatus === 'Refunded' || !!t.refundStatus;
      return true;
    });
  }, [revenueData?.recentTransactions, ledgerSearch, ledgerFilter]);

  return (
    <div className="space-y-6">
      {/* ── Period Selector Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-fv-border shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-fv-heading flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Financial & Revenue Command Center
          </h2>
          <p className="text-[11px] text-fv-muted">
            Track gross inflows, fee deductions, net settlement projections, and transaction ledgers.
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
          {/* ── Financial KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Gross Revenue */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-1.5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-fv-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Gross Revenue</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-fv-heading tracking-tight">₹{fmt(kpis.grossRevenue)}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{kpis.paidOrdersCount} Paid Orders</span>
              </div>
            </div>

            {/* Estimated Net Revenue */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-1.5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-fv-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Estimated Net</span>
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-fv-heading tracking-tight text-blue-600 dark:text-blue-400">
                ₹{fmt(kpis.netRevenue)}
              </p>
              <p className="text-[10px] text-fv-muted">After fees & refunds</p>
            </div>

            {/* Gateway Fees & Refunds */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-1.5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-fv-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Fees & Deductions</span>
                <RotateCcw className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-fv-heading tracking-tight text-amber-600">
                ₹{fmt(kpis.estimatedGatewayFees + kpis.refundedAmount)}
              </p>
              <p className="text-[10px] text-fv-muted">
                Fees: ₹{fmt(kpis.estimatedGatewayFees)} · Refunds: ₹{fmt(kpis.refundedAmount)} ({kpis.refundedOrdersCount})
              </p>
            </div>

            {/* Average Order Value (AOV) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-1.5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-fv-muted">
                <span className="text-[11px] font-bold uppercase tracking-wider">Avg Order Value (AOV)</span>
                <ArrowUpRight className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xl md:text-2xl font-black text-fv-heading tracking-tight text-indigo-600 dark:text-indigo-400">
                ₹{fmt(kpis.avgOrderValue)}
              </p>
              <p className="text-[10px] text-fv-muted">Average spend per basket</p>
            </div>
          </div>

          {/* ── Payment Method Split Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Online (Razorpay) Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-bold text-fv-heading">Online UPI & Cards (Razorpay)</h4>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                  {pct(splitOnline, splitTotal)}% of total
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2">
                <div className="bg-fv-surface/40 p-2.5 rounded-xl border border-fv-border/40">
                  <p className="text-[11px] text-fv-muted">Revenue</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">₹{fmt(splitOnline)}</p>
                </div>
                <div className="bg-fv-surface/40 p-2.5 rounded-xl border border-fv-border/40">
                  <p className="text-[11px] text-fv-muted">Paid Orders</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">{splitOnlineOrders}</p>
                </div>
                <div className="bg-fv-surface/40 p-2.5 rounded-xl border border-fv-border/40">
                  <p className="text-[11px] text-fv-muted">Avg Basket</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">₹{fmt(Math.round(splitOnlineAvg))}</p>
                </div>
              </div>
            </div>

            {/* Cash on Delivery (COD) Card */}
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
                <div className="bg-fv-surface/40 p-2.5 rounded-xl border border-fv-border/40">
                  <p className="text-[11px] text-fv-muted">Revenue</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">₹{fmt(splitCOD)}</p>
                </div>
                <div className="bg-fv-surface/40 p-2.5 rounded-xl border border-fv-border/40">
                  <p className="text-[11px] text-fv-muted">Delivered/COD</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">{splitCODOrders}</p>
                </div>
                <div className="bg-fv-surface/40 p-2.5 rounded-xl border border-fv-border/40">
                  <p className="text-[11px] text-fv-muted">Avg Basket</p>
                  <p className="text-sm font-bold text-fv-heading mt-0.5">₹{fmt(Math.round(splitCODAvg))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 12-Month Financial Revenue Trend Bar Chart ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-fv-heading flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-fv-primary" />
                  12-Month Inflow Trend & Financial Run Rate
                </h3>
                <p className="text-[11px] text-fv-muted">Monthly billing cycle comparison across Online vs COD</p>
              </div>
            </div>

            <div className="h-44 flex items-end gap-2 pt-4 border-b border-fv-border pb-2 overflow-x-auto">
              {monthlyTrend.map((m) => {
                const heightPct = Math.max(8, Math.round((m.revenue / maxMonthRev) * 100));
                return (
                  <div key={m._id} className="flex-1 min-w-[38px] flex flex-col items-center gap-1.5 group">
                    <div className="text-[10px] font-bold text-fv-muted opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ₹{fmt(m.revenue)}
                    </div>
                    <div className="w-full bg-fv-surface rounded-t-lg relative flex flex-col justify-end overflow-hidden" style={{ height: `${heightPct}%` }}>
                      <div
                        className="bg-blue-600 transition-all"
                        style={{ height: `${pct(m.onlineRevenue || 0, m.revenue || 1)}%` }}
                        title={`Online: ₹${fmt(m.onlineRevenue)}`}
                      />
                      <div
                        className="bg-amber-500 transition-all"
                        style={{ height: `${pct(m.codRevenue || 0, m.revenue || 1)}%` }}
                        title={`COD: ₹${fmt(m.codRevenue)}`}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-fv-muted">{m._id.slice(5)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 text-[11px] font-semibold text-fv-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                <span>Online (Razorpay)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>Cash on Delivery</span>
              </div>
            </div>
          </div>

          {/* ── Category Contribution & VIP Spenders Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category Revenue Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-fv-border pb-2.5">
                <h3 className="text-sm font-bold text-fv-heading flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Category Revenue Share
                </h3>
                <span className="text-xs text-fv-muted font-medium">Total: ₹{fmt(totalCatRev)}</span>
              </div>
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {categoryRevenue.length === 0 ? (
                  <p className="text-xs text-fv-muted text-center py-6">No category data for this period</p>
                ) : (
                  categoryRevenue.map((c) => {
                    const share = pct(c.revenue, totalCatRev);
                    return (
                      <div key={c._id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-fv-heading">{c._id || 'Uncategorized'}</span>
                          <span className="text-fv-muted">
                            ₹{fmt(c.revenue)} ({share}%)
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-fv-surface rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${share}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Top Revenue-Generating Customers */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-fv-border pb-2.5">
                <h3 className="text-sm font-bold text-fv-heading flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  Top Revenue Customers (VIPs)
                </h3>
                <span className="text-xs text-fv-muted font-medium">Ranked by spend</span>
              </div>
              <div className="divide-y divide-fv-border max-h-60 overflow-y-auto pr-1">
                {topCustomers.length === 0 ? (
                  <p className="text-xs text-fv-muted text-center py-6">No customer orders recorded yet</p>
                ) : (
                  topCustomers.map((cust, idx) => (
                    <div key={cust._id || idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="font-bold text-fv-muted w-4">{idx + 1}.</span>
                        <div className="min-w-0">
                          <p className="font-bold text-fv-heading truncate">{cust.name}</p>
                          <p className="text-[10px] text-fv-muted truncate">{cust.email || cust.phone || 'Verified User'}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-fv-heading">₹{fmt(cust.totalSpent)}</p>
                        <p className="text-[10px] text-fv-muted">{cust.orderCount} order(s)</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Transaction Ledger Table ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border overflow-hidden shadow-xs">
            <div className="p-4 border-b border-fv-border flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-fv-heading flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Transactional Settlement Ledger
                </h3>
                <p className="text-[11px] text-fv-muted">Real-time ledger with fee deductions and refund status</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-fv-muted" />
                  <input
                    type="text"
                    placeholder="Search order or name..."
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-fv-surface border border-fv-border rounded-xl text-fv-heading focus:outline-none focus:border-fv-primary w-44 md:w-56"
                  />
                </div>

                {/* Filter pills */}
                <div className="flex gap-1 bg-fv-surface p-1 rounded-xl border border-fv-border/50 text-[11px] font-semibold">
                  {['ALL', 'ONLINE', 'COD', 'REFUNDED'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setLedgerFilter(f)}
                      className={`px-2 py-1 rounded-lg transition-colors ${
                        ledgerFilter === f ? 'bg-white dark:bg-gray-800 text-fv-heading shadow-xs' : 'text-fv-muted hover:text-fv-heading'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-fv-surface/60 border-b border-fv-border text-[11px] text-fv-muted font-bold">
                  <tr>
                    <th className="py-2.5 px-4">Order #</th>
                    <th className="py-2.5 px-4">Customer</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Method</th>
                    <th className="py-2.5 px-4 text-right">Gross Amount</th>
                    <th className="py-2.5 px-4 text-right">Gateway Fee</th>
                    <th className="py-2.5 px-4 text-right">Net Settlement</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fv-border">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-fv-muted text-xs">
                        No transactions found matching filter criteria
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t._id} className="hover:bg-fv-surface/40 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-bold text-fv-heading">{t.orderNumber}</td>
                        <td className="py-2.5 px-4">
                          <p className="font-semibold text-fv-heading">{t.customerName}</p>
                          <p className="text-[10px] text-fv-muted">{t.customerPhone || t.customerEmail}</p>
                        </td>
                        <td className="py-2.5 px-4 text-fv-muted">
                          {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.paymentMode === 'Online'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            }`}
                          >
                            {t.paymentMode === 'Online' ? <CreditCard className="w-3 h-3" /> : <Truck className="w-3 h-3" />}
                            {t.paymentMode}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-fv-heading">₹{fmt(t.grossAmount)}</td>
                        <td className="py-2.5 px-4 text-right text-fv-muted">
                          {t.gatewayFee > 0 ? `-₹${fmt(t.gatewayFee)}` : '₹0'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{fmt(t.netAmount)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {t.paymentStatus === 'Refunded' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 dark:bg-red-950/40 text-[10px] font-bold rounded-full">
                              <RotateCcw className="w-3 h-3" /> Refunded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 text-[10px] font-bold rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Paid
                            </span>
                          )}
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

export default RevenueTab;
