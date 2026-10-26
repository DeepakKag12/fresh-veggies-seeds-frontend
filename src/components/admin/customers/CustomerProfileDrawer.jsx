import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Phone,
  Shield,
  ShoppingBag,
  MapPin,
  Calendar,
  IndianRupee,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  RotateCcw,
  Tag,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../utils/api';

const CustomerProfileDrawer = ({
  isOpen,
  userId,
  onClose,
  onStatusChange,
  onRoleClick,
  currentAdminId
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'addresses' | 'identity'
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchCustomerProfile(userId);
    } else {
      setProfile(null);
      setActiveTab('orders');
    }
  }, [isOpen, userId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchCustomerProfile = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${id}`);
      setProfile(res.data?.data || null);
    } catch (error) {
      console.error('Error fetching customer profile:', error);
      toast.error(error.response?.data?.message || 'Failed to load customer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!profile) return;
    const targetUserId = profile._id || profile.user?._id;
    const isSelf = currentAdminId && String(currentAdminId) === String(targetUserId);

    if (isSelf && profile.isActive) {
      toast.error('You cannot suspend your own administrative account.');
      return;
    }

    const nextStatus = !profile.isActive;
    setIsUpdatingStatus(true);
    try {
      const res = await api.put(`/admin/users/${targetUserId}/status`, {
        isActive: nextStatus
      });
      toast.success(res.data?.message || `Account ${nextStatus ? 'activated' : 'suspended'} successfully`);
      setProfile((prev) => (prev ? { ...prev, isActive: nextStatus } : prev));
      if (onStatusChange) {
        onStatusChange(targetUserId, nextStatus);
      }
    } catch (error) {
      console.error('Status toggle error:', error);
      toast.error(error.response?.data?.message || 'Failed to update account status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!isOpen) return null;

  const user = profile?.user || profile || {};
  const analytics = profile?.analytics || {
    totalOrders: profile?.totalOrders || 0,
    totalSpend: profile?.totalSpend || 0,
    averageOrderValue: profile?.totalOrders > 0 ? (profile?.totalSpend / profile?.totalOrders) : 0,
    firstOrderDate: null,
    lastOrderDate: null
  };
  const orders = profile?.orders || [];
  const addresses = profile?.addresses || [];
  const isSelf = currentAdminId && String(currentAdminId) === String(user._id);

  const initials = (user.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

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

  const getOrderStatusBadgeClass = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200';
      case 'Processing':
      case 'Confirmed':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200';
      default:
        return 'bg-fv-surface text-fv-muted border-fv-border';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col border-l border-fv-border z-10 animate-in slide-in-from-right duration-250">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-fv-border flex items-center justify-between bg-fv-surface/40 dark:bg-gray-800/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-fv-muted">
              Customer 360 CRM Profile
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary font-bold">
              ID: {user._id ? user._id.slice(-8) : '...'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-fv-muted hover:text-fv-heading hover:bg-fv-surface dark:hover:bg-gray-800 transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-16 h-16 rounded-2xl bg-fv-border dark:bg-gray-800" />
              <div className="space-y-2 flex-1">
                <div className="h-5 bg-fv-border dark:bg-gray-800 rounded-md w-1/3" />
                <div className="h-3 bg-fv-border dark:bg-gray-800 rounded-md w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-fv-border dark:bg-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-fv-border dark:bg-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : !profile ? (
          <div className="flex-1 p-12 text-center flex flex-col items-center justify-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
            <h3 className="text-base font-bold text-fv-heading">Profile Not Found</h3>
            <p className="text-xs text-fv-muted mt-1">Unable to retrieve customer details from the database.</p>
            <button
              type="button"
              onClick={() => fetchCustomerProfile(userId)}
              className="mt-4 px-4 py-2 bg-fv-primary text-white text-xs font-bold rounded-xl"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Customer Identity Banner */}
            <div className="p-6 border-b border-fv-border bg-white dark:bg-gray-900 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-fv-primary/10 text-fv-primary font-extrabold text-xl flex items-center justify-center shrink-0 border border-fv-primary/20 shadow-xs">
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-fv-heading dark:text-white leading-tight">
                        {user.name}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {user.role === 'admin' ? (
                          <>
                            <Shield className="w-3 h-3" />
                            Administrator
                          </>
                        ) : (
                          'Customer'
                        )}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          user.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}
                      >
                        {user.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-fv-muted">
                      {user.email && (
                        <a
                          href={`mailto:${user.email}`}
                          className="flex items-center gap-1.5 hover:text-fv-primary transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{user.email}</span>
                        </a>
                      )}
                      {user.phone && (
                        <a
                          href={`tel:${user.phone}`}
                          className="flex items-center gap-1.5 hover:text-fv-primary transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{user.phone}</span>
                        </a>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Joined: {formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1-Click Status Toggle */}
                <div className="shrink-0 flex flex-col items-end">
                  <button
                    type="button"
                    disabled={isUpdatingStatus || (isSelf && user.isActive)}
                    onClick={handleToggleStatus}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                      user.isActive
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={
                      isSelf && user.isActive
                        ? 'You cannot suspend your own administrative account'
                        : user.isActive
                        ? 'Temporarily block customer from placing orders'
                        : 'Re-activate customer account'
                    }
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isUpdatingStatus ? 'animate-spin' : ''}`} />
                    <span>
                      {isUpdatingStatus
                        ? 'Updating...'
                        : user.isActive
                        ? 'Suspend Account'
                        : 'Activate Account'}
                    </span>
                  </button>
                  {isSelf && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                      Logged-in account
                    </span>
                  )}
                </div>
              </div>

              {/* CRM 360 KPIs Metric Strip */}
              <div className="grid grid-cols-3 gap-3 mt-5">
                <div className="p-3.5 rounded-2xl bg-fv-surface/60 dark:bg-gray-800/60 border border-fv-border">
                  <p className="text-[11px] font-semibold text-fv-muted flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-fv-primary" />
                    Lifetime Spend
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-fv-heading dark:text-white mt-0.5">
                    {formatCurrency(analytics.lifetimeSpend || analytics.totalSpend)}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-fv-surface/60 dark:bg-gray-800/60 border border-fv-border">
                  <p className="text-[11px] font-semibold text-fv-muted flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
                    Total Orders
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-fv-heading dark:text-white mt-0.5">
                    {analytics.totalOrders || analytics.orderCount || 0}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-fv-surface/60 dark:bg-gray-800/60 border border-fv-border">
                  <p className="text-[11px] font-semibold text-fv-muted flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-500" />
                    Average Order Value
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-fv-heading dark:text-white mt-0.5">
                    {formatCurrency(analytics.averageOrderValue || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center px-6 border-b border-fv-border bg-fv-surface/30 dark:bg-gray-800/30 gap-6 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`py-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
                  activeTab === 'orders'
                    ? 'text-fv-primary dark:text-emerald-400'
                    : 'text-fv-muted hover:text-fv-heading'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Order History</span>
                <span className="px-1.5 py-0.2 rounded-full bg-fv-border dark:bg-gray-700 text-[10px]">
                  {orders.length}
                </span>
                {activeTab === 'orders' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fv-primary dark:bg-emerald-400 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`py-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
                  activeTab === 'addresses'
                    ? 'text-fv-primary dark:text-emerald-400'
                    : 'text-fv-muted hover:text-fv-heading'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Saved Addresses</span>
                <span className="px-1.5 py-0.2 rounded-full bg-fv-border dark:bg-gray-700 text-[10px]">
                  {addresses.length}
                </span>
                {activeTab === 'addresses' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fv-primary dark:bg-emerald-400 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('identity')}
                className={`py-3 text-xs font-bold transition-all relative flex items-center gap-2 ${
                  activeTab === 'identity'
                    ? 'text-fv-primary dark:text-emerald-400'
                    : 'text-fv-muted hover:text-fv-heading'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Identity & Security Audit</span>
                {activeTab === 'identity' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fv-primary dark:bg-emerald-400 rounded-full" />
                )}
              </button>
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Tab 1: Orders */}
              {activeTab === 'orders' && (
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <div className="p-12 text-center bg-fv-surface/30 dark:bg-gray-800/30 rounded-2xl border border-fv-border">
                      <ShoppingBag className="w-10 h-10 text-fv-muted mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-bold text-fv-heading">No Orders Placed Yet</p>
                      <p className="text-xs text-fv-muted mt-0.5">
                        This customer has not completed any retail transactions.
                      </p>
                    </div>
                  ) : (
                    orders.map((order) => {
                      const displayId = order.orderNumber || `#OD-${order._id.slice(-6).toUpperCase()}`;
                      return (
                        <div
                          key={order._id}
                          className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border hover:border-fv-primary/40 transition-all shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-extrabold text-fv-heading dark:text-white">
                                  {displayId}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getOrderStatusBadgeClass(
                                    order.orderStatus
                                  )}`}
                                >
                                  {order.orderStatus}
                                </span>
                              </div>
                              <p className="text-[11px] text-fv-muted mt-0.5">
                                {formatDate(order.createdAt)} • Mode: {order.paymentMode || 'COD'} (
                                {order.paymentStatus || 'Pending'})
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-sm font-bold text-fv-heading dark:text-white">
                                {formatCurrency(order.totalAmount)}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  navigate(`/admin/orders?search=${encodeURIComponent(order.orderNumber || order._id)}`);
                                }}
                                className="text-[11px] text-fv-primary font-bold hover:underline inline-flex items-center gap-0.5 mt-0.5"
                              >
                                <span>Inspect</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Items preview */}
                          {Array.isArray(order.orderItems) && order.orderItems.length > 0 && (
                            <div className="pt-2 border-t border-fv-border/60">
                              <p className="text-[11px] font-semibold text-fv-muted mb-1.5">
                                Ordered Items ({order.orderItems.reduce((acc, it) => acc + (it.quantity || 1), 0)})
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {order.orderItems.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-fv-surface dark:bg-gray-700/60 text-xs text-fv-heading dark:text-gray-200"
                                  >
                                    <span className="font-medium truncate max-w-[150px]">{item.name}</span>
                                    <span className="font-bold text-fv-muted">×{item.quantity}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tab 2: Saved Delivery Addresses */}
              {activeTab === 'addresses' && (
                <div className="space-y-3">
                  {addresses.length === 0 ? (
                    <div className="p-12 text-center bg-fv-surface/30 dark:bg-gray-800/30 rounded-2xl border border-fv-border">
                      <MapPin className="w-10 h-10 text-fv-muted mx-auto mb-2 opacity-50" />
                      <p className="text-sm font-bold text-fv-heading">No Saved Addresses</p>
                      <p className="text-xs text-fv-muted mt-0.5">
                        Customer has not saved shipping locations to their profile.
                      </p>
                    </div>
                  ) : (
                    addresses.map((addr, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                              <Tag className="w-3 h-3 text-slate-500" />
                              {addr.tag || 'Delivery Address'}
                            </span>
                            {addr.isDefault && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Default
                              </span>
                            )}
                          </div>
                          {addr.phone && (
                            <span className="text-xs text-fv-muted flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {addr.phone}
                            </span>
                          )}
                        </div>

                        {addr.name && (
                          <p className="text-xs font-bold text-fv-heading dark:text-white">
                            Recipient: {addr.name}
                          </p>
                        )}

                        <p className="text-xs text-fv-muted leading-relaxed">
                          {[addr.street, addr.landmark, addr.city, addr.state, addr.pincode, addr.country || 'India']
                            .filter(Boolean)
                            .join(', ')}
                        </p>

                        {addr.instructions && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 p-2 rounded-xl">
                            💡 Instructions: {addr.instructions}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Identity & Security Audit */}
              {activeTab === 'identity' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-fv-heading dark:text-white uppercase tracking-wider">
                      Account Credentials & Verification
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-fv-surface/60 dark:bg-gray-750 border border-fv-border">
                        <p className="text-fv-muted text-[11px]">Primary Email</p>
                        <p className="font-bold text-fv-heading dark:text-white mt-0.5">{user.email || '—'}</p>
                        <div className="mt-1 flex items-center gap-1">
                          {user.emailVerified ? (
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Unverified
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-fv-surface/60 dark:bg-gray-750 border border-fv-border">
                        <p className="text-fv-muted text-[11px]">Registered Mobile</p>
                        <p className="font-bold text-fv-heading dark:text-white mt-0.5">{user.phone || '—'}</p>
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Phone Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-fv-heading dark:text-white uppercase tracking-wider">
                      Security & Session Audit
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-fv-border/50">
                        <span className="text-fv-muted flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> Account Lockout
                        </span>
                        <span className={`font-bold ${user.isLocked ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {user.isLocked ? 'Locked (Failed Logins)' : 'Normal (Unlocked)'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1.5 border-b border-fv-border/50">
                        <span className="text-fv-muted">Login Attempts Counter</span>
                        <span className="font-bold text-fv-heading dark:text-white">
                          {user.loginAttempts || 0}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1.5 border-b border-fv-border/50">
                        <span className="text-fv-muted">Last Login Timestamp</span>
                        <span className="font-bold text-fv-heading dark:text-white">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString('en-IN') : 'Never logged in'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-fv-muted">Security Token Version</span>
                        <span className="font-mono font-bold text-fv-heading dark:text-white">
                          v{user.tokenVersion || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-4 px-6 border-t border-fv-border bg-fv-surface/40 dark:bg-gray-800/40 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/admin/orders?search=${encodeURIComponent(user.email || user.name)}`);
                }}
                className="px-4 py-2 text-xs font-bold text-fv-heading dark:text-white bg-white dark:bg-gray-800 border border-fv-border rounded-xl hover:bg-fv-surface transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-fv-primary" />
                <span>View In Orders Directory</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onRoleClick) onRoleClick(user);
                  }}
                  className="px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Change Role</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-fv-muted hover:text-fv-heading border border-fv-border rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfileDrawer;
