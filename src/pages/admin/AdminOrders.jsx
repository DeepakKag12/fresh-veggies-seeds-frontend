import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Download, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminOrders } from '../../hooks/admin/useAdminOrders';
import { OrderFilterTabs } from '../../components/admin/orders/OrderFilterTabs';
import { OrderCard } from '../../components/admin/orders/OrderCard';
import { DeleteHistoryModal } from '../../components/admin/orders/DeleteHistoryModal';
import { exportOrdersToCsv } from '../../utils/adminCsvExport';

const AdminOrders = () => {
  const navigate = useNavigate();
  const {
    orders,
    expandedOrderId,
    loading,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    total,
    stats,
    deleteModal,
    isDeletingHistory,
    toggleOrderExpansion,
    handleUpdateStatus,
    handleApproveCancel,
    handleRejectCancel,
    promptDeleteHistoryItem,
    promptBulkDeleteHistory,
    promptDeleteOrder,
    closeDeleteModal,
    confirmDeleteHistory,
  } = useAdminOrders();

  const handleExportCsv = () => {
    try {
      exportOrdersToCsv(orders, `orders_${statusFilter.toLowerCase()}`);
      toast.success(`Exported ${orders.length} orders to CSV!`);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    }
  };

  return (
    <div className="min-h-screen bg-fv-page p-3 md:p-6 lg:p-8 pb-28 md:pb-8">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Navigation Breadcrumb & Back Action */}
        <div className="flex items-center gap-2 text-xs font-medium text-fv-muted">
          <button
            type="button"
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/admin/dashboard');
              }
            }}
            className="inline-flex items-center gap-1 hover:text-fv-primary dark:hover:text-emerald-400 transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="hover:text-fv-primary transition-colors"
          >
            Dashboard
          </button>
          <span>/</span>
          <span className="text-fv-heading dark:text-white font-semibold">Orders</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-fv-heading flex items-center gap-2">
              Orders Management
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary font-bold">
                {total} orders
              </span>
            </h1>
            <p className="text-xs text-fv-muted mt-0.5">
              Enterprise fulfillment center · Fast in-place status management & audit trails
            </p>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-fv-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search order #, customer, phone..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-800 border border-fv-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-fv-primary text-fv-heading min-h-[44px]"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="text-xs text-fv-muted hover:text-fv-heading px-2.5 py-2 min-h-[44px] flex items-center"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!orders || orders.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-gray-800 hover:bg-fv-surface dark:hover:bg-gray-700 text-fv-heading border border-fv-border rounded-xl text-xs font-semibold disabled:opacity-40 min-h-[44px] transition-colors shrink-0 shadow-2xs"
              title="Download orders in CSV spreadsheet format"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Segmented Top-Level Workflow Tabs */}
        <OrderFilterTabs
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          setPage={setPage}
          stats={stats}
        />

        {/* Orders List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-white dark:bg-gray-800 rounded-2xl border border-fv-border animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-12 text-center">
            <Package className="w-12 h-12 text-fv-muted mx-auto mb-3" />
            <p className="text-base font-semibold text-fv-heading">No orders found</p>
            <p className="text-xs text-fv-muted mt-1">Try clearing filters or checking other status tabs</p>
            {(statusFilter !== 'All' || searchQuery) && (
              <button
                onClick={() => { setStatusFilter('All'); setSearchQuery(''); setPage(1); }}
                className="mt-4 px-4 py-2.5 bg-fv-surface hover:bg-fv-border text-xs font-semibold rounded-xl min-h-[44px]"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                isExpanded={expandedOrderId === order._id}
                onToggleExpand={() => toggleOrderExpansion(order._id)}
                onUpdateStatus={handleUpdateStatus}
                onApproveCancel={handleApproveCancel}
                onRejectCancel={handleRejectCancel}
                onPromptDeleteHistory={promptDeleteHistoryItem}
                onPromptBulkDeleteHistory={promptBulkDeleteHistory}
                onPromptDeleteOrder={promptDeleteOrder}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 pt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3.5 py-2 min-h-[44px] text-xs font-medium border border-fv-border rounded-xl hover:bg-fv-surface disabled:opacity-40 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-fv-muted px-2">
              Page {page} of {totalPages} · {total} total orders
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3.5 py-2 min-h-[44px] text-xs font-medium border border-fv-border rounded-xl hover:bg-fv-surface disabled:opacity-40 transition-colors"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Audit Log Deletion */}
      <DeleteHistoryModal
        deleteModal={deleteModal}
        isDeletingHistory={isDeletingHistory}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteHistory}
      />
    </div>
  );
};

export default AdminOrders;
