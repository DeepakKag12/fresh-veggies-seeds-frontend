import React, { useEffect, useState } from 'react';
import Pagination from '../../components/Pagination';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users', { params: { page, limit: 25 } });
      setUsers(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalUsers(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error.response?.data?.message || 'Failed to load users');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(
      'Delete this user?\n\nIf they have placed orders the account is deactivated instead, so their order history is preserved.'
    )) return;
    try {
      const res = await api.delete(`/admin/users/${id}`);
      fetchUsers();
      // Report what actually happened. This used to always claim the user was
      // deleted, even when the backend deactivated them to keep their orders.
      toast.success(res.data?.message || 'User removed successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 pb-28 md:pb-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-fv-heading">
            Manage Customers
          </h1>
          <p className="text-xs text-fv-muted mt-0.5">
            {totalUsers} registered customer accounts
          </p>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <div
            key={user._id}
            className="bg-white rounded-[16px] p-4 border border-fv-border shadow-xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-fv-heading">{user.name}</h3>
                <p className="text-xs text-fv-muted">{user.email}</p>
                {user.phone && <p className="text-xs text-fv-muted mt-0.5">📞 {user.phone}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    user.role === 'admin'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                      : 'bg-fv-surface text-fv-muted'
                  }`}
                >
                  {user.role}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    user.isActive
                      ? 'bg-fv-cream text-fv-primary-dark dark:bg-green-900/40 dark:text-green-300'
                      : 'bg-fv-surface text-fv-muted'
                  }`}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-fv-border text-xs text-fv-muted">
              <span>Joined: {new Date(user.createdAt).toLocaleDateString('en-IN')}</span>
              {user.role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => handleDelete(user._id)}
                  aria-label={`Remove ${user.name}`}
                  className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Deactivate / Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-[12px] shadow-sm border border-fv-border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-fv-page">
            <tr>
              {['Name', 'Email', 'Phone', 'Role', 'Joined', 'Status', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-fv-page/40 transition-colors">
                <td className="px-4 py-3 text-sm text-fv-heading">{user.name}</td>
                <td className="px-4 py-3 text-sm text-fv-muted">{user.email}</td>
                <td className="px-4 py-3 text-sm text-fv-muted">{user.phone || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      user.role === 'admin'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'bg-fv-surface text-fv-muted'
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-fv-muted">
                  {new Date(user.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-fv-cream text-fv-primary-dark dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-fv-surface text-fv-muted'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDelete(user._id)}
                    disabled={user.role === 'admin'}
                    aria-label={`Remove ${user.name}`}
                    title={user.role === 'admin' ? 'Admin accounts cannot be removed here' : `Remove ${user.name}`}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={totalUsers}
        onPageChange={setPage}
        itemLabel="users"
      />
    </div>
  );
};

export default AdminUsers;
