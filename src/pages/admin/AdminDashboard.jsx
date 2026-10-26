import React from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  LayoutDashboard,
  ListOrdered,
  DollarSign,
  BarChart2,
  ArrowRight,
  ClipboardList,
  MessageSquare
} from 'lucide-react';
import { useAdminDashboard } from '../../hooks/admin/useAdminDashboard';
import { useChat } from '../../context/ChatContext';
import { DashboardQuickActions } from '../../components/admin/dashboard/DashboardQuickActions';
import { UrgentOrdersBanner } from '../../components/admin/dashboard/UrgentOrdersBanner';
import { OrderPipelineSection } from '../../components/admin/dashboard/OrderPipelineSection';
import { RecentOrdersTable } from '../../components/admin/dashboard/RecentOrdersTable';
import { RevenueTab } from '../../components/admin/dashboard/RevenueTab';
import { AnalyticsTab } from '../../components/admin/dashboard/AnalyticsTab';
import { ExecutiveKpiCards } from '../../components/admin/dashboard/ExecutiveKpiCards';
import { SalesAnalyticsChart } from '../../components/admin/dashboard/SalesAnalyticsChart';
import { LowStockWarningTable } from '../../components/admin/dashboard/LowStockWarningTable';

const TABS = [
  { id: 'home',      label: 'Executive Overview',  icon: LayoutDashboard },
  { id: 'pipeline',  label: 'Order Pipeline',      icon: ListOrdered },
  { id: 'revenue',   label: 'Revenue & Cashflow',  icon: DollarSign },
  { id: 'analytics', label: 'Sales Analytics',     icon: BarChart2 },
];

const AdminDashboard = () => {
  const { adminUnreadCount } = useChat();
  const {
    stats,
    actionLoadingId,
    recentOrders,
    lowStockProducts,
    revenueData,
    analyticsData,
    loading,
    revenueLoading,
    analyticsLoading,
    period,
    specificMonth,
    showMonthPicker,
    setShowMonthPicker,
    productSort,
    setProductSort,
    showAllOrders,
    activeTab,
    setActiveTab,
    fetchDashboardData,
    fetchRevenue,
    fetchAnalytics,
    handlePeriodChange,
    handleMonthSelect,
    handleQuickStatusChange,
    handleQuickConfirm,
    handleQuickApproveCancel,
    handleQuickDeleteOrder,
  } = useAdminDashboard();

  if (loading) {
    return (
      <div className="min-h-screen bg-fv-page">
        <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-fv-border px-4 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="space-y-1.5">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-44 animate-pulse" />
              <div className="h-3 bg-fv-surface dark:bg-gray-600 rounded w-64 animate-pulse" />
            </div>
            <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4">
          <div className="h-32 bg-white dark:bg-gray-800 rounded-2xl animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-2xl border border-fv-border animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const urgentOrderCount = (stats?.pendingOrders || 0) + (stats?.cancellationRequests || 0);

  return (
    <div className="min-h-screen bg-fv-page pb-24 md:pb-8">
      {/* Sub-Header + Inner Dashboard Views */}
      <div className="bg-white dark:bg-gray-800 border-b border-fv-border shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-base md:text-lg font-bold text-fv-heading dark:text-white flex items-center gap-2">
              Executive Dashboard
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold hidden sm:inline">
                Live Storefront Operational
              </span>
            </h1>
            <p className="text-[11px] text-fv-muted">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              &nbsp;·&nbsp;Real-time store metrics · Auto-refreshes every 30s
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Chat Direct Button */}
            <Link
              to="/admin/communication"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 transition-colors min-h-[40px] relative"
              title="Open Live Customer Chat"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Live Chat</span>
              {adminUnreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-600 text-white animate-pulse">
                  {adminUnreadCount}
                </span>
              )}
            </Link>

            <Link
              to="/admin/orders"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-fv-surface hover:bg-fv-border text-fv-heading dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors min-h-[40px]"
              title="Open full orders workspace"
            >
              <ClipboardList className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Full Orders ({stats?.totalOrders || 0})</span>
            </Link>

            <button
              onClick={() => {
                fetchDashboardData();
                if (activeTab === 'revenue') fetchRevenue(period, specificMonth);
                else if (activeTab === 'analytics') fetchAnalytics(period, specificMonth);
                else {
                  fetchRevenue(period, specificMonth);
                  fetchAnalytics(period, specificMonth);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-fv-surface hover:bg-fv-border text-fv-heading dark:text-gray-200 rounded-xl text-xs font-semibold transition-colors min-h-[40px] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-fv-primary dark:text-emerald-400" />
              <span className="hidden md:inline">Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-0 flex gap-1 overflow-x-auto scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all min-h-[42px] cursor-pointer ${
                  isActive
                    ? 'border-fv-primary text-fv-primary dark:text-emerald-400 font-bold'
                    : 'border-transparent text-fv-muted hover:text-fv-heading hover:border-fv-border'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'pipeline' && urgentOrderCount > 0 && (
                  <span className="ml-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none animate-pulse">
                    {urgentOrderCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-6">
        {/* EXECUTIVE OVERVIEW (HOME) TAB - Streamlined & Non-Redundant */}
        {activeTab === 'home' && (
          <>
            {/* Urgent attention banner for pending orders or customer cancellation requests */}
            <UrgentOrdersBanner
              stats={stats}
              actionLoadingId={actionLoadingId}
              onQuickConfirm={handleQuickConfirm}
              onQuickApproveCancel={handleQuickApproveCancel}
            />

            {/* Core Executive Metric KPI Cards (Gross Revenue, Total Orders, Average Order Value, Active Customers) */}
            <ExecutiveKpiCards stats={stats} revenueData={revenueData} />

            {/* Interactive Time-Series Sales & Orders Recharts with filter presets (Today, 7D, 30D, 1Y) + Status Pie Chart */}
            <SalesAnalyticsChart
              analyticsData={analyticsData}
              stats={stats}
              period={period}
              onPeriodChange={handlePeriodChange}
              loading={analyticsLoading}
            />

            {/* Urgent Low Stock Warning Table */}
            <LowStockWarningTable lowStockProducts={lowStockProducts} />

            {/* Quick 1-click Management Launchpad Shortcuts (including Live Chat) */}
            <DashboardQuickActions stats={stats} />

            {/* Recent Orders Live Table with In-Place Status Update & Delete */}
            <RecentOrdersTable
              recentOrders={recentOrders}
              actionLoadingId={actionLoadingId}
              showAllOrders={showAllOrders}
              onQuickStatusChange={handleQuickStatusChange}
              onQuickDeleteOrder={handleQuickDeleteOrder}
            />
          </>
        )}

        {/* ORDER PIPELINE TAB */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Top Workspace Banner */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-emerald-400" />
                  Visual Order Fulfillment Funnel
                </h3>
                <p className="text-xs text-emerald-100 mt-1">
                  Track orders across every operational stage from verification to final doorstep delivery
                </p>
              </div>
              <Link
                to="/admin/orders"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
              >
                <span>Full Orders Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <OrderPipelineSection stats={stats} lowStockProducts={lowStockProducts} />

            <RecentOrdersTable
              recentOrders={recentOrders}
              actionLoadingId={actionLoadingId}
              showAllOrders={true}
              onQuickStatusChange={handleQuickStatusChange}
              onQuickDeleteOrder={handleQuickDeleteOrder}
            />
          </div>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <RevenueTab
            revenueData={revenueData}
            loading={revenueLoading}
            period={period}
            specificMonth={specificMonth}
            showMonthPicker={showMonthPicker}
            setShowMonthPicker={setShowMonthPicker}
            onPeriodChange={handlePeriodChange}
            onMonthSelect={handleMonthSelect}
          />
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <AnalyticsTab
            analyticsData={analyticsData}
            loading={analyticsLoading}
            period={period}
            specificMonth={specificMonth}
            showMonthPicker={showMonthPicker}
            setShowMonthPicker={setShowMonthPicker}
            productSort={productSort}
            setProductSort={setProductSort}
            onPeriodChange={handlePeriodChange}
            onMonthSelect={handleMonthSelect}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
