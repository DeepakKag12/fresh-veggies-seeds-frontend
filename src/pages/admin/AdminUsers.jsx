import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Phone,
  Mail,
  Shield,
  User,
  ShoppingBag,
  X,
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  RotateCcw,
  Eye,
  IndianRupee,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import CustomerProfileDrawer from '../../components/admin/customers/CustomerProfileDrawer';

const AdminUsers = () => {
  const navigate = useNavigate();
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'customer' | 'admin'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'suspended'
  const [sortBy, setSortBy] = useState('createdAt'); // 'createdAt' | 'totalSpend' | 'totalOrders' | 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc'

  // Modals & Drawers state
  const [drawerUserId, setDrawerUserId] = useState(null);
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusTogglingId, setStatusTogglingId] = useState(null);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery, roleFilter, statusFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 25,
        sortBy,
        sortOrder
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await api.get('/admin/users', { params });
      setUsers(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalUsers(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Quick stats derived from currently loaded customer list
  const statsSummary = useMemo(() => {
    const activeCount = users.filter((u) => u.isActive).length;
    const suspendedCount = users.filter((u) => !u.isActive).length;
    const totalSpendSum = users.reduce((acc, u) => acc + (Number(u.lifetimeSpend || u.totalSpend) || 0), 0);
    return {
      activeCount,
      suspendedCount,
      totalSpendSum
    };
  }, [users]);

  const handleToggleStatus = async (userToToggle) => {
    const targetId = userToToggle._id;
    const isSelf = currentAdmin && String(currentAdmin._id || currentAdmin.id) === String(targetId);

    if (isSelf && userToToggle.isActive) {
      toast.error('You cannot suspend your own administrative account.');
      return;
    }

    const nextStatus = !userToToggle.isActive;
    setStatusTogglingId(targetId);

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u._id === targetId ? { ...u, isActive: nextStatus } : u))
    );

    try {
      const res = await api.put(`/admin/users/${targetId}/status`, {
        isActive: nextStatus
      });
      toast.success(res.data?.message || `Account for ${userToToggle.name} ${nextStatus ? 'activated' : 'suspended'}.`);
    } catch (error) {
      // Revert on failure
      setUsers((prev) =>
        prev.map((u) => (u._id === targetId ? { ...u, isActive: userToToggle.isActive } : u))
      );
      toast.error(error.response?.data?.message || 'Failed to update account status');
    } finally {
      setStatusTogglingId(null);
    }
  };

  const handleOpenRoleModal = (user) => {
    setRoleModalUser(user);
    setSelectedRole(user.role || 'customer');
  };

  const handleUpdateRole = async () => {
    if (!roleModalUser) return;
    const isSelf = currentAdmin && String(currentAdmin._id || currentAdmin.id) === String(roleModalUser._id);
    if (isSelf && selectedRole !== 'admin') {
      toast.error('You cannot remove your own administrator privileges.');
      return;
    }

    setIsUpdatingRole(true);
    try {
      await api.put(`/admin/users/${roleModalUser._id}/role`, { role: selectedRole });
      toast.success(`Role updated to ${selectedRole} for ${roleModalUser.name}!`);
      setRoleModalUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/admin/users/${userToDelete._id}`);
      fetchUsers();
      toast.success(res.data?.message || 'Customer account updated successfully');
      setUserToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove user');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isFiltersActive = searchQuery || roleFilter !== 'all' || statusFilter !== 'all' || sortBy !== 'createdAt';

  const resetAllFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-28 md:pb-6 space-y-5">
      {/* Navigation Breadcrumb */}
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
        <span className="text-fv-heading dark:text-white font-semibold">Customer Directory</span>
      </div>

      {/* Header & CRM Quick Counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-fv-heading dark:text-white flex items-center gap-2.5">
            Customer Directory & CRM
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary font-bold">
              {totalUsers} Accounts
            </span>
          </h1>
          <p className="text-xs text-fv-muted mt-0.5">
            Customer 360 profiles, lifetime spending analytics, order history & account status auditing
          </p>
        </div>

        {/* Quick Refresh */}
        <button
          type="button"
          onClick={() => fetchUsers()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-fv-border hover:bg-fv-surface dark:hover:bg-gray-800 text-fv-heading dark:text-gray-200 transition-colors self-start sm:self-auto min-h-[40px]"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* CRM Overview Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fv-muted">Total Directory</span>
            <Users className="w-4 h-4 text-fv-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-fv-heading dark:text-white mt-1">
            {totalUsers}
          </p>
          <p className="text-[11px] text-fv-muted mt-0.5">Registered customer records</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fv-muted">Active Buyers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {statsSummary.activeCount}
          </p>
          <p className="text-[11px] text-fv-muted mt-0.5">Permitted to order</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fv-muted">Suspended</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
            {statsSummary.suspendedCount}
          </p>
          <p className="text-[11px] text-fv-muted mt-0.5">Temporarily deactivated</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fv-muted">Page Spend Volume</span>
            <IndianRupee className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-fv-heading dark:text-white mt-1">
            {formatCurrency(statsSummary.totalSpendSum)}
          </p>
          <p className="text-[11px] text-fv-muted mt-0.5">Cumulative lifetime spend</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-2xl border border-fv-border shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-fv-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers by name, email, or 10-digit phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 text-xs md:text-sm bg-fv-surface/50 dark:bg-gray-750 border border-fv-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-fv-primary text-fv-heading dark:text-white min-h-[42px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-fv-muted hover:text-fv-heading"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-fv-muted" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by role"
              className="px-3 py-2 text-xs font-semibold bg-fv-surface/50 dark:bg-gray-750 border border-fv-border rounded-xl text-fv-heading dark:text-white min-h-[42px] focus:outline-hidden focus:ring-2 focus:ring-fv-primary"
            >
              <option value="all">All Roles</option>
              <option value="customer">Customers Only</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by account status"
              className="px-3 py-2 text-xs font-semibold bg-fv-surface/50 dark:bg-gray-750 border border-fv-border rounded-xl text-fv-heading dark:text-white min-h-[42px] focus:outline-hidden focus:ring-2 focus:ring-fv-primary"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-fv-muted" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              aria-label="Sort customer directory"
              className="px-3 py-2 text-xs font-semibold bg-fv-surface/50 dark:bg-gray-750 border border-fv-border rounded-xl text-fv-heading dark:text-white min-h-[42px] focus:outline-hidden focus:ring-2 focus:ring-fv-primary"
            >
              <option value="createdAt">Registration Date</option>
              <option value="totalSpend">Highest Lifetime Spend</option>
              <option value="totalOrders">Most Total Orders</option>
              <option value="name">Customer Name (A-Z)</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-2.5 py-2 text-xs font-bold bg-fv-surface/50 dark:bg-gray-750 border border-fv-border rounded-xl text-fv-heading dark:text-white min-h-[42px] hover:bg-fv-surface"
              title={`Sorting ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>

          {isFiltersActive && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-3 py-2 text-xs font-bold text-fv-muted hover:text-fv-heading hover:bg-fv-surface rounded-xl transition-colors shrink-0 min-h-[42px]"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Directory Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-20 bg-white dark:bg-gray-800 rounded-2xl border border-fv-border animate-pulse"
            />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-12 text-center">
          <User className="w-12 h-12 text-fv-muted mx-auto mb-3 opacity-50" />
          <p className="text-base font-bold text-fv-heading dark:text-white">No Customers Found</p>
          <p className="text-xs text-fv-muted mt-1">
            {searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'No customer records match your filter criteria.'
              : 'No customer accounts registered in the database yet.'}
          </p>
          {isFiltersActive && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-4 px-4 py-2 bg-fv-surface hover:bg-fv-border text-xs font-semibold rounded-xl min-h-[40px]"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="space-y-3 md:hidden">
            {users.map((u) => {
              const initials = (u.name || 'User')
                .split(' ')
                .filter(Boolean)
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();
              const isSelf = currentAdmin && String(currentAdmin._id || currentAdmin.id) === String(u._id);

              return (
                <div
                  key={u._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-fv-border shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-fv-primary/10 text-fv-primary font-bold text-xs flex items-center justify-center shrink-0 border border-fv-primary/20">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-fv-heading dark:text-white">{u.name}</h3>
                        <p className="text-xs text-fv-muted flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[180px]">{u.email || 'No email registered'}</span>
                        </p>
                        {u.phone && (
                          <p className="text-xs text-fv-muted flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{u.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {u.role === 'admin' ? '🛡️ Admin' : 'Customer'}
                    </span>
                  </div>

                  {/* KPIs row */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-fv-surface/60 dark:bg-gray-750 border border-fv-border text-xs">
                    <div>
                      <span className="text-fv-muted text-[10px] uppercase font-semibold">Lifetime Spend</span>
                      <p className="font-extrabold text-fv-heading dark:text-white">
                        {formatCurrency(u.lifetimeSpend || u.totalSpend)}
                      </p>
                    </div>
                    <div>
                      <span className="text-fv-muted text-[10px] uppercase font-semibold">Total Orders</span>
                      <p className="font-extrabold text-fv-heading dark:text-white">
                        {u.totalOrders || u.orderCount || 0} orders
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle & Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-fv-border text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={statusTogglingId === u._id || (isSelf && u.isActive)}
                        onClick={() => handleToggleStatus(u)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                          u.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                        } ${(isSelf && u.isActive) || statusTogglingId === u._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={
                          isSelf && u.isActive
                            ? 'Cannot suspend own account'
                            : u.isActive
                            ? 'Click to Suspend Account'
                            : 'Click to Activate Account'
                        }
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            u.isActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span
                        className={`text-[11px] font-bold ${
                          u.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                        }`}
                      >
                        {u.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDrawerUserId(u._id)}
                        className="px-2.5 py-1.5 rounded-lg bg-fv-primary/10 text-fv-primary hover:bg-fv-primary/20 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>360 Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenRoleModal(u)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold"
                        title="Change Role"
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => setUserToDelete(u)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold"
                          title="Deactivate or Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop CRM Table View */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-fv-border overflow-hidden">
            <table className="min-w-full divide-y divide-fv-border">
              <thead className="bg-fv-surface/60 dark:bg-gray-750">
                <tr>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-fv-muted uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-fv-muted uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-fv-muted uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-fv-muted uppercase tracking-wider">
                    Lifetime Spend
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-fv-muted uppercase tracking-wider">
                    Total Orders
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-fv-muted uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold text-fv-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-bold text-fv-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fv-border/60">
                {users.map((u) => {
                  const initials = (u.name || 'User')
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();
                  const isSelf = currentAdmin && String(currentAdmin._id || currentAdmin.id) === String(u._id);

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-fv-surface/40 dark:hover:bg-gray-700/40 transition-colors"
                    >
                      {/* Customer Name & Joined */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setDrawerUserId(u._id)}
                            className="w-9 h-9 rounded-xl bg-fv-primary/10 text-fv-primary font-bold text-xs flex items-center justify-center shrink-0 border border-fv-primary/20 hover:scale-105 transition-transform"
                            title="Open 360 Profile Drawer"
                          >
                            {initials}
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() => setDrawerUserId(u._id)}
                              className="text-sm font-bold text-fv-heading dark:text-white leading-tight hover:text-fv-primary text-left transition-colors"
                            >
                              {u.name}
                            </button>
                            <p className="text-[11px] text-fv-muted mt-0.5">
                              Joined: {formatDate(u.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-3.5 text-xs">
                        {u.email ? (
                          <a
                            href={`mailto:${u.email}`}
                            className="text-fv-heading dark:text-gray-200 hover:text-fv-primary flex items-center gap-1.5 transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-fv-muted shrink-0" />
                            <span className="truncate max-w-[170px]">{u.email}</span>
                          </a>
                        ) : (
                          <span className="text-fv-muted">—</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="px-5 py-3.5 text-xs">
                        {u.phone ? (
                          <a
                            href={`tel:${u.phone}`}
                            className="text-fv-heading dark:text-gray-200 hover:text-fv-primary flex items-center gap-1.5 transition-colors font-mono"
                          >
                            <Phone className="w-3.5 h-3.5 text-fv-muted shrink-0" />
                            <span>{u.phone}</span>
                          </a>
                        ) : (
                          <span className="text-fv-muted">—</span>
                        )}
                      </td>

                      {/* Lifetime Spend */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 font-extrabold text-sm text-fv-heading dark:text-white">
                          <IndianRupee className="w-3.5 h-3.5 text-fv-primary" />
                          {formatCurrency(u.lifetimeSpend || u.totalSpend).replace('₹', '')}
                        </span>
                      </td>

                      {/* Total Orders */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-fv-surface dark:bg-gray-750 text-fv-heading dark:text-gray-200 border border-fv-border">
                          <ShoppingBag className="w-3 h-3 text-fv-muted" />
                          {u.totalOrders || u.orderCount || 0}
                        </span>
                      </td>

                      {/* Role Pill */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {u.role === 'admin' ? (
                            <>
                              <Shield className="w-3 h-3" />
                              Admin
                            </>
                          ) : (
                            'Customer'
                          )}
                        </span>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={statusTogglingId === u._id || (isSelf && u.isActive)}
                            onClick={() => handleToggleStatus(u)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                              u.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                            } ${(isSelf && u.isActive) || statusTogglingId === u._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={
                              isSelf && u.isActive
                                ? 'You cannot suspend your own administrative account'
                                : u.isActive
                                ? 'Active account • Click to Suspend'
                                : 'Suspended account • Click to Activate'
                            }
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                u.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span
                            className={`text-xs font-semibold ${
                              u.isActive
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDrawerUserId(u._id)}
                            className="px-2.5 py-1.5 rounded-lg text-fv-primary bg-fv-primary/10 hover:bg-fv-primary/20 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                            title="Open Customer 360 Profile Drawer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>360 Profile</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/admin/orders?search=${encodeURIComponent(u.email || u.name)}`)
                            }
                            className="p-1.5 rounded-lg text-fv-heading dark:text-gray-200 hover:bg-fv-surface dark:hover:bg-gray-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Filter customer orders"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-fv-muted" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenRoleModal(u)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Edit Role"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          {u.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete(u)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Deactivate or Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalUsers}
            onPageChange={setPage}
            itemLabel="customers"
          />
        </>
      )}

      {/* Customer 360 Slide-Out Profile Drawer */}
      <CustomerProfileDrawer
        isOpen={Boolean(drawerUserId)}
        userId={drawerUserId}
        onClose={() => setDrawerUserId(null)}
        currentAdminId={currentAdmin?._id || currentAdmin?.id}
        onStatusChange={(updatedUserId, nextStatus) => {
          setUsers((prev) =>
            prev.map((u) => (u._id === updatedUserId ? { ...u, isActive: nextStatus } : u))
          );
        }}
        onRoleClick={(targetUser) => {
          handleOpenRoleModal(targetUser);
        }}
      />

      {/* Role Management Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-fv-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-fv-border">
              <h2 className="text-base font-bold text-fv-heading dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-fv-primary" />
                Manage User Role
              </h2>
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="p-1 rounded-lg text-fv-muted hover:text-fv-heading hover:bg-fv-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-xs text-fv-muted">User Account</p>
                <p className="text-sm font-bold text-fv-heading dark:text-white mt-0.5">
                  {roleModalUser.name}
                </p>
                <p className="text-xs text-fv-muted">{roleModalUser.email}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-fv-heading dark:text-white mb-2">
                  Assign Authorization Level
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('customer')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedRole === 'customer'
                        ? 'border-fv-primary bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-fv-primary/20'
                        : 'border-fv-border hover:bg-fv-surface'
                    }`}
                  >
                    <p className="text-xs font-bold text-fv-heading dark:text-white">Customer</p>
                    <p className="text-[11px] text-fv-muted mt-1">
                      Standard store ordering & review permissions
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedRole === 'admin'
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 ring-2 ring-purple-600/20'
                        : 'border-fv-border hover:bg-fv-surface'
                    }`}
                  >
                    <p className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Administrator
                    </p>
                    <p className="text-[11px] text-fv-muted mt-1">
                      Full access to orders, products, revenue & settings
                    </p>
                  </button>
                </div>
              </div>

              {selectedRole === 'admin' && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 text-xs text-purple-900 dark:text-purple-300">
                  <AlertCircle className="w-4 h-4 shrink-0 text-purple-600 mt-0.5" />
                  <span>
                    Granting administrator privileges gives this user access to sensitive order, customer, and catalog data.
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-fv-border bg-fv-surface/40 dark:bg-gray-700/40">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 text-xs font-semibold text-fv-heading border border-fv-border rounded-xl hover:bg-white min-h-[40px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingRole}
                onClick={handleUpdateRole}
                className="px-5 py-2 text-xs font-bold text-white bg-fv-primary hover:bg-fv-primary-dark rounded-xl transition-colors shadow-xs min-h-[40px] disabled:opacity-50"
              >
                {isUpdatingRole ? 'Saving...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Deletion / Deactivation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(userToDelete)}
        title="Deactivate or Remove Customer Account?"
        message={
          userToDelete
            ? `Are you sure you want to proceed for "${userToDelete.name || userToDelete.email || 'this user'}"? If they have prior orders, their account will be safely deactivated to preserve accounting records.`
            : ''
        }
        confirmLabel={isDeleting ? 'Processing...' : 'Proceed'}
        cancelLabel="Keep Account"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteUser}
        onClose={() => {
          if (!isDeleting) setUserToDelete(null);
        }}
      />
    </div>
  );
};

export default AdminUsers;
