import React, { useEffect, useState } from 'react';
import { Search, Trash2, Phone, Mail, Shield, User, ShoppingBag, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Pagination from '../../components/Pagination';
import { useNavigate } from 'react-router-dom';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('customer');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
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

  const handleOpenRoleModal = (user) => {
    setRoleModalUser(user);
    setSelectedRole(user.role || 'customer');
  };

  const handleUpdateRole = async () => {
    if (!roleModalUser) return;
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

  const handleDelete = async (id, name) => {
    if (!window.confirm(
      `Deactivate or delete customer "${name}"?\n\nIf they have placed orders, the account is deactivated to preserve financial and audit records.`
    )) return;

    try {
      const res = await api.delete(`/admin/users/${id}`);
      fetchUsers();
      toast.success(res.data?.message || 'User status updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove user');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-28 md:pb-6 space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-fv-heading flex items-center gap-2">
            Customer Directory
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary font-bold">
              {totalUsers} accounts
            </span>
          </h1>
          <p className="text-xs text-fv-muted mt-0.5">
            Registered customer profiles, account authorization levels & order linkings
          </p>
        </div>

        {/* Live Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-fv-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-800 border border-fv-border rounded-xl focus:outline-hidden focus:ring-2 focus:ring-fv-primary text-fv-heading min-h-[42px]"
            />
          </div>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="text-xs text-fv-muted hover:text-fv-heading px-2 py-2 min-h-[42px]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-gray-800 rounded-2xl border border-fv-border animate-pulse" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-12 text-center">
          <User className="w-12 h-12 text-fv-muted mx-auto mb-3" />
          <p className="text-base font-semibold text-fv-heading">No customers found</p>
          <p className="text-xs text-fv-muted mt-1">
            {searchQuery ? 'Try matching a different keyword or phone number' : 'No customer accounts registered yet'}
          </p>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="mt-4 px-4 py-2 bg-fv-surface hover:bg-fv-border text-xs font-semibold rounded-xl min-h-[40px]"
            >
              Reset Search
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
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase();

              return (
                <div
                  key={u._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-fv-border shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-fv-primary/10 text-fv-primary font-bold text-xs flex items-center justify-center shrink-0">
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
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-fv-surface text-fv-muted'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-fv-border text-xs text-fv-muted">
                    <span>Joined: {new Date(u.createdAt).toLocaleDateString('en-IN')}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/orders?search=${encodeURIComponent(u.email || u.name)}`)}
                        className="p-1.5 rounded-lg text-fv-primary hover:bg-fv-surface text-xs font-semibold flex items-center gap-1"
                        title="View Orders"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Orders
                      </button>
                      <button
                        onClick={() => handleOpenRoleModal(u)}
                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 text-xs font-semibold flex items-center gap-1"
                        title="Change Role"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        Role
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(u._id, u.name)}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 text-xs font-semibold"
                          title="Deactivate or Delete"
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

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-fv-border overflow-hidden">
            <table className="min-w-full divide-y divide-fv-border">
              <thead className="bg-fv-surface dark:bg-gray-700/50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Contact Details
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Role & Access
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fv-border/60">
                {users.map((u) => {
                  const initials = (u.name || 'User')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={u._id} className="hover:bg-fv-surface/40 dark:hover:bg-gray-700/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-fv-primary/10 text-fv-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-fv-heading dark:text-white leading-tight">
                              {u.name}
                            </p>
                            <p className="text-[11px] font-mono text-fv-muted mt-0.5">
                              ID: {u._id.substring(u._id.length - 8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-fv-muted">
                        <p className="text-fv-heading dark:text-gray-200">{u.email || '—'}</p>
                        {u.phone && <p className="text-[11px] text-fv-muted mt-0.5">📞 {u.phone}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-full ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              : 'bg-fv-surface text-fv-muted'
                          }`}
                        >
                          {u.role === 'admin' ? '🛡️ Administrator' : 'Customer'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-fv-muted">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => navigate(`/admin/orders?search=${encodeURIComponent(u.email || u.name)}`)}
                            className="p-1.5 rounded-lg text-fv-heading hover:bg-fv-surface dark:hover:bg-gray-700 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Filter customer orders"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-fv-primary" />
                            <span>Orders</span>
                          </button>
                          <button
                            onClick={() => handleOpenRoleModal(u)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                            title="Edit Role"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Role</span>
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleDelete(u._id, u.name)}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
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
                <p className="text-sm font-bold text-fv-heading dark:text-white mt-0.5">{roleModalUser.name}</p>
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
                    <p className="text-[11px] text-fv-muted mt-1">Standard store ordering & review permissions</p>
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
                    <p className="text-[11px] text-fv-muted mt-1">Full access to orders, products, revenue & settings</p>
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
    </div>
  );
};

export default AdminUsers;
