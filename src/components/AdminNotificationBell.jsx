import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  X,
  ShoppingCart,
  AlertTriangle,
  CreditCard,
  Package,
  Star,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import api from '../utils/api';

const AdminNotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const fetchStats = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data.data);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Notification fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + poll every 30s
  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const notifications = stats
    ? [
        {
          id: 'pending',
          label: 'New Orders',
          count: stats.pendingOrders || 0,
          desc: 'Awaiting confirmation',
          icon: ShoppingCart,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50 border-yellow-200',
          iconBg: 'bg-yellow-100',
          link: '/admin/orders?status=Pending',
          urgent: true,
        },
        {
          id: 'cancel',
          label: 'Cancellation Requests',
          count: stats.cancellationRequests || 0,
          desc: 'Waiting for your decision',
          icon: AlertTriangle,
          color: 'text-orange-600',
          bg: 'bg-orange-50 border-orange-200',
          iconBg: 'bg-orange-100',
          link: '/admin/orders?status=CancellationRequested',
          urgent: true,
        },
        {
          id: 'payment',
          label: 'Failed Payments',
          count: stats.failedPayments || 0,
          desc: 'Orders with payment issues',
          icon: CreditCard,
          color: 'text-red-600',
          bg: 'bg-red-50 border-red-200',
          iconBg: 'bg-red-100',
          link: '/admin/orders',
          urgent: true,
        },
        {
          id: 'stock',
          label: 'Low Stock',
          count: stats.lowStockProducts || 0,
          desc: 'Products below 10 units',
          icon: Package,
          color: 'text-blue-600',
          bg: 'bg-blue-50 border-blue-200',
          iconBg: 'bg-blue-100',
          link: '/admin/products',
          urgent: false,
        },
        {
          id: 'reviews',
          label: 'Pending Reviews',
          count: stats.pendingReviews || 0,
          desc: 'Awaiting approval',
          icon: Star,
          color: 'text-purple-600',
          bg: 'bg-purple-50 border-purple-200',
          iconBg: 'bg-purple-100',
          link: '/admin/reviews',
          urgent: false,
        },
      ]
    : [];

  const urgentCount = notifications
    .filter((n) => n.urgent)
    .reduce((sum, n) => sum + n.count, 0);

  const totalCount = notifications.reduce((sum, n) => sum + n.count, 0);

  const handleNotificationClick = (link) => {
    navigate(link);
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) fetchStats(true);
        }}
        className="relative flex flex-col items-center justify-center h-full py-2 px-3 transition-colors"
        aria-label="Admin notifications"
      >
        <div className={`p-1.5 rounded-full transition-colors ${open ? 'bg-green-600' : ''}`}>
          <Bell className={`w-5 h-5 ${open ? 'text-white' : 'text-gray-400'} ${urgentCount > 0 && !open ? 'animate-[wiggle_1s_ease-in-out_infinite]' : ''}`} />
        </div>
        {totalCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
        <span className={`text-[10px] mt-1 font-medium ${open ? 'text-green-400' : 'text-gray-400'}`}>
          Alerts
        </span>
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="fixed bottom-20 right-2 left-2 sm:left-auto sm:right-4 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[60] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-green-400" />
              <span className="text-sm font-bold text-white">Admin Alerts</span>
              {urgentCount > 0 ? (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {urgentCount} urgent
                </span>
              ) : (
                <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  All clear
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchStats(true)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification Items */}
          <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
            {urgentCount === 0 && (
              <div className="px-4 py-5 flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-sm font-semibold text-gray-800">All Clear!</p>
                <p className="text-xs text-gray-500">No pending orders or requests right now.</p>
              </div>
            )}
            {notifications.map((n) => {
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n.link)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                    n.count === 0 ? 'opacity-50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${n.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${n.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900 truncate">{n.label}</span>
                      <span
                        className={`text-sm font-bold flex-shrink-0 ${
                          n.count > 0 ? n.color : 'text-gray-400'
                        }`}
                      >
                        {n.count}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{n.desc}</p>
                  </div>
                  {n.count > 0 && n.urgent && (
                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                  )}
                  {n.count > 0 && !n.urgent && (
                    <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  )}
                  {n.count === 0 && (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">
              {lastFetched
                ? `Updated ${lastFetched.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
                : 'Loading...'}
            </span>
            <button
              onClick={() => handleNotificationClick('/admin/orders')}
              className="text-[11px] text-green-600 font-semibold hover:text-green-700"
            >
              View all orders →
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(15deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminNotificationBell;
