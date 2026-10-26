import React from 'react';
import { Link } from 'react-router-dom';
import {
  PackagePlus,
  ClipboardList,
  Ticket,
  Image,
  Layers,
  Users,
  Settings,
  Star,
  ArchiveRestore,
  MessageSquare
} from 'lucide-react';
import { useChat } from '../../../context/ChatContext';

export const DashboardQuickActions = ({ stats = {} }) => {
  const { adminUnreadCount } = useChat();
  const pendingOrders = (stats?.pendingOrders || 0) + (stats?.cancellationRequests || 0);
  const lowStock = stats?.lowStockProducts || 0;
  const pendingReviews = stats?.pendingReviews || 0;

  const quickActions = [
    {
      title: 'Live Chat',
      subtitle: adminUnreadCount > 0 ? `${adminUnreadCount} waiting` : 'Customer Desk',
      to: '/admin/communication',
      icon: MessageSquare,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
      badge: adminUnreadCount > 0 ? adminUnreadCount : null,
      badgeColor: 'bg-emerald-600 text-white font-bold animate-pulse',
    },
    {
      title: 'New Product',
      subtitle: lowStock > 0 ? `${lowStock} low in stock` : 'Add to catalog',
      to: '/admin/products?new=true',
      icon: PackagePlus,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40',
      badge: lowStock > 0 ? `${lowStock} low` : null,
      badgeColor: 'bg-amber-500 text-white font-medium text-[10px]',
    },
    {
      title: 'Orders Workspace',
      subtitle: `${pendingOrders > 0 ? `${pendingOrders} need action` : 'View fulfillment'}`,
      to: '/admin/orders',
      icon: ClipboardList,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40',
      badge: pendingOrders > 0 ? pendingOrders : null,
      badgeColor: 'bg-red-500 text-white animate-pulse',
    },
    {
      title: 'Coupons & Promos',
      subtitle: 'Discounts & deals',
      to: '/admin/coupons',
      icon: Ticket,
      color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/40',
    },
    {
      title: 'Store Banners',
      subtitle: 'Hero sliders & ads',
      to: '/admin/banners',
      icon: Image,
      color: 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800/40',
    },
    {
      title: 'Categories',
      subtitle: 'Store departments',
      to: '/admin/categories',
      icon: Layers,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/40',
    },
    {
      title: 'Customer Directory',
      subtitle: `${stats?.totalUsers || 0} registered`,
      to: '/admin/users',
      icon: Users,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/40',
    },
    {
      title: 'Customer Reviews',
      subtitle: `${pendingReviews > 0 ? `${pendingReviews} pending` : 'Ratings & trust'}`,
      to: '/admin/reviews',
      icon: Star,
      color: 'text-amber-500 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40',
      badge: pendingReviews > 0 ? pendingReviews : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      title: 'Store Settings',
      subtitle: 'Pincodes & delivery',
      to: '/admin/settings',
      icon: Settings,
      color: 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700',
    },
    {
      title: 'Delete History',
      subtitle: 'Trash & recovery',
      to: '/admin/delete-history',
      icon: ArchiveRestore,
      color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/40',
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-fv-heading dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-fv-primary animate-pulse" />
          Quick Management Launchpad
        </h2>
        <span className="text-[11px] text-fv-muted hidden sm:inline">1-Click Administrative Shortcuts</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link
              key={idx}
              to={action.to}
              className="group relative flex flex-col items-center text-center p-3 rounded-xl border border-fv-border/80 hover:border-fv-primary/40 hover:bg-fv-surface/60 dark:hover:bg-gray-700/50 transition-all duration-150 hover:-translate-y-0.5"
            >
              {action.badge != null && (
                <span
                  className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold rounded-full leading-none shadow-xs ${action.badgeColor}`}
                >
                  {action.badge}
                </span>
              )}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 border ${action.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-fv-heading dark:text-white group-hover:text-fv-primary leading-tight line-clamp-1">
                {action.title}
              </span>
              <span className="text-[10px] text-fv-muted leading-tight mt-0.5 line-clamp-1">
                {action.subtitle}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardQuickActions;
