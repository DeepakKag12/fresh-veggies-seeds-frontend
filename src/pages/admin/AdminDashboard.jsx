import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCircle, ListOrdered, DollarSign, BarChart2 } from 'lucide-react';
import { useAdminDashboard } from '../../hooks/admin/useAdminDashboard';
import { DashboardKpiGrid } from '../../components/admin/dashboard/DashboardKpiGrid';
import { UrgentOrdersBanner } from '../../components/admin/dashboard/UrgentOrdersBanner';
import { RevenueSnapshot } from '../../components/admin/dashboard/RevenueSnapshot';
import { OrderPipelineSection } from '../../components/admin/dashboard/OrderPipelineSection';
import { RecentOrdersTable } from '../../components/admin/dashboard/RecentOrdersTable';
import { RevenueAnalyticsTab } from '../../components/admin/dashboard/RevenueAnalyticsTab';

const TABS = [
  { id: 'home',      label: 'Home',      icon: CheckCircle },
  { id: 'orders',    label: 'Orders',    icon: ListOrdered },
  { id: 'revenue',   label: 'Revenue',   icon: DollarSign },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const {
    stats,
    actionLoadingId,
    recentOrders,
    lowStockProducts,
    analytics,
    loading,
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
    fetchAnalytics,
    handlePeriodChange,
    handleMonthSelect,
    handleQuickStatusChange,
    handleQuickConfirm,
    handleQuickApproveCancel,
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

  return (
    <div className="min-h-screen bg-fv-page pb-24 md:pb-6">
      {/* Sticky Header + Tabs */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-fv-border shadow-xs">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-base md:text-lg font-bold text-fv-heading">Admin Dashboard</h1>
            <p className="text-[11px] text-fv-muted">
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              &nbsp;·&nbsp;Auto-refreshes every 30s
            </p>
          </div>
          <button
            onClick={() => { fetchDashboardData(); fetchAnalytics(period, specificMonth); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-fv-surface hover:bg-fv-border text-fv-heading rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-3 md:px-6 pb-0 flex gap-0 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => (tab.id === 'orders' ? navigate('/admin/orders') : setActiveTab(tab.id))}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all min-h-[44px] ${
                  isActive
                    ? 'border-gray-900 dark:border-white text-fv-heading'
                    : 'border-transparent text-fv-muted hover:text-fv-heading hover:border-fv-border'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'orders' && (stats.pendingOrders + stats.cancellationRequests) > 0 && (
                  <span className="ml-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 leading-none">
                    {stats.pendingOrders + stats.cancellationRequests}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-6">
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <>
            <UrgentOrdersBanner
              stats={stats}
              actionLoadingId={actionLoadingId}
              onQuickConfirm={handleQuickConfirm}
              onQuickApproveCancel={handleQuickApproveCancel}
            />
            <DashboardKpiGrid stats={stats} />
            <RevenueSnapshot stats={stats} />
            <RecentOrdersTable
              recentOrders={recentOrders}
              actionLoadingId={actionLoadingId}
              showAllOrders={showAllOrders}
              onQuickStatusChange={handleQuickStatusChange}
            />
          </>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <>
            <OrderPipelineSection stats={stats} lowStockProducts={lowStockProducts} />
            <RecentOrdersTable
              recentOrders={recentOrders}
              actionLoadingId={actionLoadingId}
              showAllOrders={true}
              onQuickStatusChange={handleQuickStatusChange}
            />
          </>
        )}

        {/* REVENUE & ANALYTICS TAB */}
        {(activeTab === 'revenue' || activeTab === 'analytics') && (
          <RevenueAnalyticsTab
            analytics={analytics}
            analyticsLoading={analyticsLoading}
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
