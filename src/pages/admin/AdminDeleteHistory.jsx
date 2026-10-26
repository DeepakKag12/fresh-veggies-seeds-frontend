import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArchiveRestore,
  RotateCcw,
  Trash2,
  Search,
  Eye,
  AlertTriangle,
  CheckCircle2,
  User,
  Activity,
  Layers,
  Package,
  Boxes,
  Ticket,
  Image as ImageIcon,
  Users,
  FileText,
  X,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import api from '../../utils/api';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import Pagination from '../../components/Pagination';

const ENTITY_ICONS = {
  Product: Package,
  Category: Layers,
  Combo: Boxes,
  Coupon: Ticket,
  Banner: ImageIcon,
  User: Users,
  Order: FileText,
};

const ENTITY_COLORS = {
  Product: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
  Category: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200',
  Combo: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200',
  Coupon: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
  Banner: 'bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200',
  User: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200',
  Order: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200',
};

const ACTION_COLORS = {
  CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  SOFT_DELETE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  RESTORE: 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300',
  PERMANENT_DELETE: 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300',
  STATUS_CHANGE: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300',
  STOCK_CHANGE: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
  PRICE_CHANGE: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300',
  ROLE_CHANGE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300',
  SETTINGS_UPDATE: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
};

export const AdminDeleteHistory = ({ initialTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getResolvedTab = useCallback(() => {
    if (initialTab) return initialTab;
    if (location.pathname.includes('audit')) return 'audit';
    return 'history';
  }, [initialTab, location.pathname]);

  const [activeTab, setActiveTab] = useState(getResolvedTab());

  useEffect(() => {
    setActiveTab(getResolvedTab());
  }, [getResolvedTab]);

  // Delete History state
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action Targets
  const [selectedSnapshotItem, setSelectedSnapshotItem] = useState(null);
  const [itemToRestore, setItemToRestore] = useState(null);
  const [itemToPurge, setItemToPurge] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditEntityFilter, setAuditEntityFilter] = useState('');
  const [auditStats, setAuditStats] = useState(null);

  // Fetch Delete History
  const fetchDeleteHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const params = {
        page: historyPage,
        limit: 15,
        entityType: entityTypeFilter || undefined,
        recoveryStatus: statusFilter || undefined,
        search: searchQuery.trim() || undefined,
      };

      const res = await api.get('/admin/delete-history', { params });
      if (res.data?.success) {
        setHistoryItems(res.data.data);
        setHistoryTotalPages(res.data.totalPages || 1);
        setHistoryTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch delete history:', err);
      toast.error(err.response?.data?.message || 'Failed to load delete history');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, entityTypeFilter, statusFilter, searchQuery]);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true);
    try {
      const params = {
        page: auditPage,
        limit: 20,
        action: auditActionFilter || undefined,
        entityType: auditEntityFilter || undefined,
      };

      const res = await api.get('/admin/audit-logs', { params });
      if (res.data?.success) {
        setAuditLogs(res.data.data);
        setAuditTotalPages(res.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      toast.error('Failed to load audit trail');
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditActionFilter, auditEntityFilter]);

  // Fetch Audit Stats
  const fetchAuditStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/audit-logs/stats');
      if (res.data?.success) {
        setAuditStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit stats:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchDeleteHistory();
    } else {
      fetchAuditLogs();
      fetchAuditStats();
    }
  }, [activeTab, fetchDeleteHistory, fetchAuditLogs, fetchAuditStats]);

  // Quick stats derived
  const recoverableCount = historyItems.filter((i) => i.recoveryStatus === 'Recoverable').length;
  const restoredCount = historyItems.filter((i) => i.recoveryStatus === 'Restored').length;
  const purgedCount = historyItems.filter((i) => i.recoveryStatus === 'Permanently Deleted').length;

  // Handle Restore
  const handleConfirmRestore = async () => {
    if (!itemToRestore) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/admin/delete-history/${itemToRestore._id}/restore`);
      if (res.data?.success) {
        toast.success(res.data.message || `${itemToRestore.entityType} restored successfully!`);
        setItemToRestore(null);
        fetchDeleteHistory();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to restore record';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Permanent Purge
  const handleConfirmPurge = async () => {
    if (!itemToPurge) return;
    setActionLoading(true);
    try {
      const res = await api.delete(`/admin/delete-history/${itemToPurge._id}/permanent`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Record permanently erased from database');
        setItemToPurge(null);
        fetchDeleteHistory();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to permanently delete record';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-16">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation Breadcrumb & Back Action */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400">
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
          <span className="text-gray-900 dark:text-white font-semibold">
            {activeTab === 'audit' ? 'Audit Trail Logs' : 'Recycle Bin'}
          </span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                activeTab === 'audit'
                  ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                  : 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400'
              }`}>
                {activeTab === 'audit' ? <Activity className="w-5 h-5" /> : <ArchiveRestore className="w-5 h-5" />}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {activeTab === 'audit' ? 'Admin Audit Trail Logs' : 'Recycle Bin & Soft-Delete Recovery'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {activeTab === 'audit'
                    ? 'Immutable append-only audit trail tracking administrative modifications, price adjustments, and settings revisions.'
                    : 'Linear-style trash bin with 30-day retention, conflict-safe 1-click restoration, and permanent cloud purge.'}
                </p>
              </div>
            </div>
          </div>

          {/* Tab Switcher & Refresh */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('history');
                  navigate('/admin/recycle-bin');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'history'
                    ? 'bg-fv-primary text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <ArchiveRestore className="w-3.5 h-3.5" />
                <span>Recycle Bin (Trash)</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                  {historyTotal}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('audit');
                  navigate('/admin/audit-logs');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'audit'
                    ? 'bg-fv-primary text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Audit Logs</span>
                {auditStats?.totalLogs ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
                    {auditStats.totalLogs}
                  </span>
                ) : null}
              </button>
            </div>

            <button
              type="button"
              onClick={activeTab === 'history' ? fetchDeleteHistory : fetchAuditLogs}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-fv-primary hover:border-fv-primary transition-colors shadow-xs"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${(historyLoading || auditLoading) ? 'animate-spin text-fv-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* TAB 1: DELETE HISTORY & RECOVERY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Deleted</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{historyTotal}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                  <ArchiveRestore className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Recoverable Now</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{recoverableCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Restored</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{restoredCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">Purged Permanently</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{purgedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col md:flex-row items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or deletion reason..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-fv-primary text-gray-900 dark:text-white"
                />
              </div>

              {/* Entity Type Filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={entityTypeFilter}
                  onChange={(e) => {
                    setEntityTypeFilter(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="w-full md:w-auto px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-fv-primary"
                >
                  <option value="">All Entity Types</option>
                  <option value="Product">Products</option>
                  <option value="Category">Categories</option>
                  <option value="Combo">Combos</option>
                  <option value="Coupon">Coupons</option>
                  <option value="Banner">Banners</option>
                  <option value="Order">Orders</option>
                  <option value="User">Users</option>
                </select>

                {/* Recovery Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setHistoryPage(1);
                  }}
                  className="w-full md:w-auto px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-fv-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="Recoverable">Recoverable</option>
                  <option value="Restored">Restored</option>
                  <option value="Permanently Deleted">Permanently Deleted</option>
                </select>

                {(searchQuery || entityTypeFilter || statusFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setEntityTypeFilter('');
                      setStatusFilter('');
                      setHistoryPage(1);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Entity</th>
                      <th className="py-3.5 px-4">Record Name & ID</th>
                      <th className="py-3.5 px-4">Deletion Reason</th>
                      <th className="py-3.5 px-4">Deleted By</th>
                      <th className="py-3.5 px-4">Deleted At</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-200">
                    {historyLoading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-gray-500 dark:text-gray-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-fv-primary mb-2" />
                          <p>Loading Delete History ledger...</p>
                        </td>
                      </tr>
                    ) : historyItems.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-16 text-center text-gray-500 dark:text-gray-400">
                          <ArchiveRestore className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                          <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                            No deleted records found
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            When an item is deleted in the admin console, its recoverable snapshot appears here.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      historyItems.map((item) => {
                        const Icon = ENTITY_ICONS[item.entityType] || Package;
                        const badgeClass = ENTITY_COLORS[item.entityType] || 'bg-gray-100 text-gray-800';

                        return (
                          <tr
                            key={item._id}
                            className="hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition-colors"
                          >
                            {/* Entity Type Badge */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${badgeClass}`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                <span>{item.entityType}</span>
                              </span>
                            </td>

                            {/* Name & ID */}
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-gray-900 dark:text-white max-w-xs truncate">
                                {item.entityName || 'Unnamed Record'}
                              </div>
                              <div className="text-[10px] font-mono text-gray-400 mt-0.5">
                                ID: {item.entityId}
                              </div>
                            </td>

                            {/* Deletion Reason */}
                            <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                              {item.deletionReason || 'Removed by administrator'}
                            </td>

                            {/* Deleted By */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 font-medium text-gray-800 dark:text-gray-200">
                                <User className="w-3 h-3 text-gray-400" />
                                <span>{item.deletedBy?.name || 'Administrator'}</span>
                              </div>
                              {item.deletedBy?.email && (
                                <div className="text-[10px] text-gray-400">{item.deletedBy.email}</div>
                              )}
                            </td>

                            {/* Deleted At */}
                            <td className="py-3.5 px-4 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                              {new Date(item.deletedAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>

                            {/* Recovery Status */}
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {item.recoveryStatus === 'Recoverable' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Recoverable</span>
                                </span>
                              )}
                              {item.recoveryStatus === 'Restored' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200">
                                  <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                  <span>Restored</span>
                                </span>
                              )}
                              {item.recoveryStatus === 'Permanently Deleted' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700">
                                  <span>Purged</span>
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                              {/* Snapshot viewer */}
                              <button
                                type="button"
                                onClick={() => setSelectedSnapshotItem(item)}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-fv-primary hover:border-fv-primary transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                                title="View original snapshot"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Inspect</span>
                              </button>

                              {/* Restore button (only if Recoverable) */}
                              {item.recoveryStatus === 'Recoverable' && (
                                <button
                                  type="button"
                                  onClick={() => setItemToRestore(item)}
                                  className="p-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                                  title="Restore back to active catalog"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restore</span>
                                </button>
                              )}

                              {/* Purge button (only if Recoverable) */}
                              {item.recoveryStatus === 'Recoverable' && (
                                <button
                                  type="button"
                                  onClick={() => setItemToPurge(item)}
                                  className="p-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                                  title="Permanently erase from database"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Purge</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
                  <Pagination
                    currentPage={historyPage}
                    totalPages={historyTotalPages}
                    onPageChange={(p) => setHistoryPage(p)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AUDIT LOG TRAIL */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Audit Filter Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-xs flex flex-col md:flex-row items-center gap-3">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={auditActionFilter}
                  onChange={(e) => {
                    setAuditActionFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-fv-primary"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="SOFT_DELETE">SOFT_DELETE</option>
                  <option value="RESTORE">RESTORE</option>
                  <option value="PERMANENT_DELETE">PERMANENT_DELETE</option>
                  <option value="STATUS_CHANGE">STATUS_CHANGE</option>
                  <option value="STOCK_CHANGE">STOCK_CHANGE</option>
                  <option value="PRICE_CHANGE">PRICE_CHANGE</option>
                  <option value="SETTINGS_UPDATE">SETTINGS_UPDATE</option>
                </select>

                <select
                  value={auditEntityFilter}
                  onChange={(e) => {
                    setAuditEntityFilter(e.target.value);
                    setAuditPage(1);
                  }}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-fv-primary"
                >
                  <option value="">All Entities</option>
                  <option value="Product">Product</option>
                  <option value="Category">Category</option>
                  <option value="Order">Order</option>
                  <option value="Combo">Combo</option>
                  <option value="Coupon">Coupon</option>
                  <option value="Banner">Banner</option>
                  <option value="Settings">Settings</option>
                </select>

                {(auditActionFilter || auditEntityFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuditActionFilter('');
                      setAuditEntityFilter('');
                      setAuditPage(1);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Audit Log Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Action</th>
                      <th className="py-3.5 px-4">Target Entity</th>
                      <th className="py-3.5 px-4">Record Name / ID</th>
                      <th className="py-3.5 px-4">Actor</th>
                      <th className="py-3.5 px-4">IP Address</th>
                      <th className="py-3.5 px-4">Timestamp</th>
                      <th className="py-3.5 px-4">Details Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs text-gray-700 dark:text-gray-200">
                    {auditLoading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-gray-500 dark:text-gray-400">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-fv-primary mb-2" />
                          <p>Loading audit logs...</p>
                        </td>
                      </tr>
                    ) : auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-16 text-center text-gray-500 dark:text-gray-400">
                          <Activity className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                          <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">
                            No audit log entries recorded
                          </p>
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => {
                        const actionBadgeClass =
                          ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800';

                        return (
                          <tr
                            key={log._id}
                            className="hover:bg-gray-50/60 dark:hover:bg-gray-750/50 transition-colors"
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span
                                className={`inline-block px-2.5 py-0.8 rounded-md text-[10px] font-mono font-bold ${actionBadgeClass}`}
                              >
                                {log.action}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                              {log.entityType}
                            </td>

                            <td className="py-3.5 px-4 max-w-xs truncate">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {log.entityName || '-'}
                              </span>
                              {log.entityId && (
                                <div className="text-[10px] font-mono text-gray-400 truncate">
                                  ID: {log.entityId}
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {log.actor?.name || 'System / Admin'}
                              </div>
                              {log.actor?.email && (
                                <div className="text-[10px] text-gray-400">{log.actor.email}</div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-gray-500">
                              {log.ipAddress || '-'}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-gray-500">
                              {new Date(log.createdAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </td>

                            <td className="py-3.5 px-4 max-w-sm truncate text-[11px] text-gray-500 font-mono">
                              {log.details ? JSON.stringify(log.details) : '-'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {auditTotalPages > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-center">
                  <Pagination
                    currentPage={auditPage}
                    totalPages={auditTotalPages}
                    onPageChange={(p) => setAuditPage(p)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SNAPSHOT INSPECTION MODAL */}
      {selectedSnapshotItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedSnapshotItem(null)}
          />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4 z-10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-fv-primary" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Snapshot: {selectedSnapshotItem.entityName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSnapshotItem(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-gray-400">Entity:</span>{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {selectedSnapshotItem.entityType}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Original ID:</span>{' '}
                  <span className="font-mono text-gray-800 dark:text-gray-200">
                    {selectedSnapshotItem.entityId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Deleted Date:</span>{' '}
                  <span className="text-gray-800 dark:text-gray-200">
                    {new Date(selectedSnapshotItem.deletedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Reason:</span>{' '}
                  <span className="text-gray-800 dark:text-gray-200">
                    {selectedSnapshotItem.deletionReason || '-'}
                  </span>
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Full Document Snapshot (JSON):
                </p>
                <pre className="p-3 bg-gray-900 text-emerald-400 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed border border-gray-800">
                  {JSON.stringify(selectedSnapshotItem.snapshot, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setSelectedSnapshotItem(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      <AdminConfirmModal
        isOpen={Boolean(itemToRestore)}
        title={`Restore ${itemToRestore?.entityType}: ${itemToRestore?.entityName}?`}
        message={
          <div>
            <p>
              This action will unmark <strong className="text-gray-900 dark:text-white">{itemToRestore?.entityName}</strong> as deleted and return it immediately to active store listings and admin management.
            </p>
            <p className="mt-2 text-[11px] text-gray-500">
              ✓ Automated conflict checks will ensure no newer records conflict with its SKU, slug, or unique identifiers.
            </p>
          </div>
        }
        confirmText="Confirm & Restore"
        confirmVariant="primary"
        isLoading={actionLoading}
        onConfirm={handleConfirmRestore}
        onClose={() => setItemToRestore(null)}
      />

      {/* PERMANENT PURGE CONFIRMATION MODAL */}
      <AdminConfirmModal
        isOpen={Boolean(itemToPurge)}
        title={`Permanently Purge ${itemToPurge?.entityType}?`}
        message={
          <div>
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 mb-3 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Irreversible Action
              </p>
              <p className="text-[11px]">
                This will completely remove <strong className="font-semibold">{itemToPurge?.entityName}</strong> and its underlying database record permanently. It cannot be recovered again.
              </p>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Are you sure you want to execute permanent database deletion?
            </p>
          </div>
        }
        confirmText="Permanently Erase"
        confirmVariant="danger"
        isLoading={actionLoading}
        onConfirm={handleConfirmPurge}
        onClose={() => setItemToPurge(null)}
      />
    </div>
  );
};

export default AdminDeleteHistory;
