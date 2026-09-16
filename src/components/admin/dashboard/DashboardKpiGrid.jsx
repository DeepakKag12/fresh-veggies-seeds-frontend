import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  AlertTriangle,
  Boxes,
  Package,
  CreditCard,
  Users,
} from 'lucide-react';

const fmt = (n) => (n || 0).toLocaleString('en-IN');

export const DashboardKpiGrid = ({ stats }) => {
  const kpis = [
    {
      label: "Today's Orders",
      value: stats.todayOrders || 0,
      icon: ShoppingCart,
      link: '/admin/orders?period=today',
      bg: 'hover:bg-blue-50/50 dark:hover:bg-blue-900/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      label: "Today's Revenue",
      value: `₹${fmt(stats.todayRevenue)}`,
      icon: TrendingUp,
      link: null,
      bg: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    },
    {
      label: 'Pending Orders',
      value: stats.pendingOrders || 0,
      icon: Clock,
      link: '/admin/orders?status=Pending',
      badge: stats.pendingOrders > 0,
      bg: 'hover:bg-amber-50/50 dark:hover:bg-amber-900/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    },
    {
      label: 'Cancellation Requests',
      value: stats.cancellationRequests || 0,
      icon: AlertTriangle,
      link: '/admin/orders?status=CancellationRequested',
      badge: stats.cancellationRequests > 0,
      bg: 'hover:bg-red-50/50 dark:hover:bg-red-900/10',
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
    },
    {
      label: 'Low Stock Products',
      value: stats.lowStockProducts || 0,
      icon: Boxes,
      link: '/admin/products?lowstock=true',
      bg: 'hover:bg-orange-50/50 dark:hover:bg-orange-900/10',
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      label: 'Out of Stock',
      value: stats.outOfStockProducts || 0,
      icon: Package,
      link: '/admin/products?outofstock=true',
      bg: 'hover:bg-rose-50/50 dark:hover:bg-rose-900/10',
      iconColor: 'text-rose-600 dark:text-rose-400',
      iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    },
    {
      label: 'Failed Payments',
      value: stats.failedPayments || 0,
      icon: CreditCard,
      link: '/admin/orders?paymentStatus=Failed',
      bg: 'hover:bg-purple-50/50 dark:hover:bg-purple-900/10',
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      label: 'New Customers Today',
      value: stats.todayUsers || 0,
      icon: Users,
      link: '/admin/users',
      bg: 'hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Store Operations Pulse
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400">Click any card to inspect</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => {
          const content = (
            <div className={`p-4 rounded-2xl border border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-full cursor-pointer ${kpi.bg}`}>
              <div className="flex items-center justify-between mb-2.5">
                <div className={`w-9 h-9 rounded-xl ${kpi.iconBg} flex items-center justify-center shadow-2xs`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
                {kpi.badge && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{kpi.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{kpi.label}</p>
              </div>
            </div>
          );

          return kpi.link ? (
            <Link key={i} to={kpi.link} className="block group active:scale-[0.98] transition-transform">
              {content}
            </Link>
          ) : (
            <div key={i}>{content}</div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardKpiGrid;
