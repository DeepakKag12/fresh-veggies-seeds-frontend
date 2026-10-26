import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  DollarSign,
  Package,
  Layers,
  Boxes,
  ClipboardList,
  AlertOctagon,
  ListOrdered,
  Ticket,
  Image as ImageIcon,
  Star,
  MessageSquare,
  Settings,
  ArchiveRestore,
  ShieldAlert,
  Store,
  ExternalLink,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  X,
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useChat } from '../../context/ChatContext';

/**
 * Executive-Grade Collapsible Left Sidebar (Linear & Stripe Admin Benchmarks)
 * - Modern deep slate aesthetic with refined emerald accents
 * - Clean section groupings with sleek typography
 * - Dynamic live status indicators (Urgent orders, Live chat unread count, Low stock)
 * - Seamless desktop collapse & mobile responsive drawer
 */
const AdminSidebar = ({
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onCloseMobile,
  stats = null,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { adminUnreadCount } = useChat();

  const storeName = settings?.store?.name || 'Fresh Veggies';
  const pendingOrdersCount = (stats?.pendingOrders || 0) + (stats?.cancellationRequests || 0);
  const lowStockCount = stats?.lowStockProducts || 0;
  const pendingReviewsCount = stats?.pendingReviews || 0;

  // Close mobile drawer on route change
  useEffect(() => {
    onCloseMobile?.();
  }, [location.pathname, location.search, onCloseMobile]);

  // Determine active item
  const isItemActive = (path, search = '') => {
    if (search) {
      return location.pathname === path && location.search === search;
    }
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard' && (!location.search || location.search === '?tab=home');
    }
    return location.pathname.startsWith(path) && (!search || location.search.includes(search));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'Overview',
      items: [
        {
          label: 'Executive Dashboard',
          path: '/admin/dashboard',
          icon: LayoutDashboard,
        },
        {
          label: 'Sales Analytics',
          path: '/admin/dashboard',
          search: '?tab=analytics',
          icon: BarChart3,
        },
        {
          label: 'Revenue Flow',
          path: '/admin/dashboard',
          search: '?tab=revenue',
          icon: DollarSign,
        },
      ],
    },
    {
      title: 'Orders & Sales',
      items: [
        {
          label: 'All Orders & Invoices',
          path: '/admin/orders',
          icon: ClipboardList,
          badge: stats?.totalOrders > 0 ? stats.totalOrders : null,
          badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700',
        },
        {
          label: 'Urgent Attention',
          path: '/admin/orders',
          search: '?status=urgent',
          icon: AlertOctagon,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
          badgeColor: 'bg-red-500 text-white font-bold animate-pulse',
        },
        {
          label: 'Fulfillment Pipeline',
          path: '/admin/dashboard',
          search: '?tab=pipeline',
          icon: ListOrdered,
        },
      ],
    },
    {
      title: 'Catalog & Inventory',
      items: [
        {
          label: 'Products & Stock',
          path: '/admin/products',
          icon: Package,
          badge: lowStockCount > 0 ? `${lowStockCount} low` : null,
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        },
        {
          label: 'Categories & Tags',
          path: '/admin/categories',
          icon: Layers,
        },
        {
          label: 'Combos & Starter Kits',
          path: '/admin/combos',
          icon: Boxes,
        },
      ],
    },
    {
      title: 'Customer Care & Growth',
      items: [
        {
          label: 'Live Chat & Inquiries',
          path: '/admin/communication',
          icon: MessageSquare,
          badge: adminUnreadCount > 0 ? adminUnreadCount : null,
          badgeColor: 'bg-emerald-500 text-white font-bold animate-pulse',
          highlight: true,
        },
        {
          label: 'Customer Directory',
          path: '/admin/users',
          icon: Users,
        },
        {
          label: 'Customer Reviews',
          path: '/admin/reviews',
          icon: Star,
          badge: pendingReviewsCount > 0 ? pendingReviewsCount : null,
          badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
        },
        {
          label: 'Coupons & Deals',
          path: '/admin/coupons',
          icon: Ticket,
        },
        {
          label: 'Storefront Banners',
          path: '/admin/banners',
          icon: ImageIcon,
        },
      ],
    },
    {
      title: 'System & Governance',
      items: [
        {
          label: 'Store Settings',
          path: '/admin/settings',
          icon: Settings,
        },
        {
          label: 'Audit Trail Logs',
          path: '/admin/audit-logs',
          icon: Activity,
        },
        {
          label: 'Recycle Bin',
          path: '/admin/recycle-bin',
          icon: ArchiveRestore,
        },
        {
          label: 'Danger Zone',
          path: '/admin/danger-zone',
          icon: ShieldAlert,
          danger: true,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300 select-none">
      {/* Brand & Store Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800/80 shrink-0 bg-[#0B1324]">
        <Link
          to="/admin/dashboard"
          className="flex items-center gap-3 overflow-hidden group"
          title="Go to Dashboard"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-xs shadow-md shrink-0 group-hover:scale-105 transition-transform">
            FV
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-white tracking-tight truncate leading-tight group-hover:text-emerald-400 transition-colors">
                {storeName}
              </span>
              <span className="text-[10px] font-semibold text-emerald-400/90 tracking-wide">
                Admin Console
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label="Toggle Sidebar"
        >
          {collapsed ? (
            <PanelLeft className="w-4 h-4 text-emerald-400" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          aria-label="Close Mobile Sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Categorized Navigation List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {navSections.map((section, sIdx) => (
          <div key={section.title || sIdx} className="space-y-1">
            {/* Section Header */}
            {!collapsed ? (
              <div className="px-2.5 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {section.title}
              </div>
            ) : (
              <div className="w-full flex justify-center py-1">
                <div className="w-6 h-px bg-slate-800" title={section.title} />
              </div>
            )}

            {/* Section Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isItemActive(item.path, item.search);
                const Icon = item.icon;
                const destination = `${item.path}${item.search || ''}`;

                return (
                  <Link
                    key={`${item.path}-${item.search || ''}-${item.label}`}
                    to={destination}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-3 px-3 py-2 text-xs transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-emerald-500/10 text-emerald-300 font-semibold border-l-2 border-emerald-400 rounded-r-xl rounded-l-none'
                        : item.danger
                        ? 'text-amber-400 hover:bg-amber-950/30 hover:text-amber-300 rounded-xl'
                        : item.highlight
                        ? 'text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-xl'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-xl'
                    } ${collapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                        active
                          ? 'text-emerald-400'
                          : item.danger
                          ? 'text-amber-400'
                          : item.highlight
                          ? 'text-emerald-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {!collapsed && (
                      <div className="flex-1 flex items-center justify-between min-w-0">
                        <span className="truncate">{item.label}</span>
                        {item.badge != null && (
                          <span
                            className={`ml-2 px-1.5 py-0.5 text-[9px] font-bold rounded-full leading-none shrink-0 ${
                              item.badgeColor || 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Collapsed mode floating notification dot */}
                    {collapsed && item.badge != null && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: Storefront Link & Admin Profile */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0 bg-[#0B1324]">
        {/* Open Storefront */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title="Open live storefront"
        >
          <Store className="w-4 h-4 text-emerald-400 shrink-0" />
          {!collapsed && (
            <div className="flex-1 flex items-center justify-between">
              <span>View Store</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </div>
          )}
        </Link>

        {/* User Card & Sign Out */}
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800 ${
            collapsed ? 'justify-center p-1.5' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {(user?.name || 'Admin')[0].toUpperCase()}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-400 truncate capitalize">
                {user?.role || 'Admin'}
              </p>
            </div>
          )}
          {!collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out border-r border-slate-800/80 shadow-xl ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-out Drawer */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#0F172A] shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminSidebar;
