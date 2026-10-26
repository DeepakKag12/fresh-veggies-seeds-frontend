import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  PanelLeft,
  Search,
  Plus,
  ChevronDown,
  Store,
  ExternalLink,
  Settings,
  ShieldAlert,
  LogOut,
  UserCheck,
  ChevronRight,
  Package,
  Layers,
  Ticket,
  Boxes,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import AdminNotificationBell from './AdminNotificationBell';
import AdminCommandPalette from './AdminCommandPalette';

/**
 * Stripe-Grade Lightweight Top Header Bar
 * Features:
 * - Sidebar collapse toggle & mobile drawer trigger
 * - Store live status pill ("Live Operational" with pulsing indicator)
 * - Breadcrumbs showing current section
 * - Universal Search console bar (opens Command Palette with ⌘K)
 * - Prominent "+ Quick Action" clickable dropdown (+ New Product, + New Category, + New Coupon, etc.)
 * - Operational Alerts Bell & Admin Profile dropdown
 */
const AdminTopHeader = ({
  onToggleSidebar,
  onOpenMobileSidebar,
  sidebarCollapsed = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { adminUnreadCount, supportOnline } = useChat();

  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const quickActionRef = useRef(null);
  const chatMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickActionRef.current && !quickActionRef.current.contains(e.target)) {
        setQuickActionOpen(false);
      }
      if (chatMenuRef.current && !chatMenuRef.current.contains(e.target)) {
        setChatMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setQuickActionOpen(false);
    setChatMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userInitials = (user?.name || 'Admin')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  // Dynamic breadcrumb label
  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p.includes('/products')) return 'Catalog / Products & Variants';
    if (p.includes('/categories')) return 'Catalog / Categories & Taxonomy';
    if (p.includes('/combos')) return 'Catalog / Combos & Kits';
    if (p.includes('/orders')) return 'Orders / All Orders & Invoices';
    if (p.includes('/coupons')) return 'Marketing / Coupons & Deals';
    if (p.includes('/banners')) return 'Marketing / Hero Banners';
    if (p.includes('/reviews')) return 'Marketing / Customer Reviews';
    if (p.includes('/communication') || p.includes('/messages') || p.includes('/chat')) return 'Live Chat / Customer Inquiries';
    if (p.includes('/users')) return 'Customers / Customer Directory';
    if (p.includes('/settings')) return 'Settings / Store Configuration';
    if (p.includes('/delete-history')) return 'Settings / Audit Logs';
    if (p.includes('/danger-zone')) return 'Settings / Recycle Bin & Reset';
    if (location.search.includes('tab=revenue')) return 'Overview / Revenue Flow';
    if (location.search.includes('tab=analytics')) return 'Overview / Sales Analytics';
    if (location.search.includes('tab=pipeline')) return 'Orders / Fulfillment Pipeline';
    return 'Overview / Executive Dashboard';
  };

  const quickActions = [
    {
      label: 'New Product',
      icon: Package,
      path: '/admin/products?action=new',
      description: 'Add fresh produce item or variant',
    },
    {
      label: 'New Category',
      icon: Layers,
      path: '/admin/categories?action=new',
      description: 'Create catalog taxonomy tier',
    },
    {
      label: 'New Coupon',
      icon: Ticket,
      path: '/admin/coupons?action=new',
      description: 'Create discount or promotional code',
    },
    {
      label: 'New Combo Offer',
      icon: Boxes,
      path: '/admin/combos?action=new',
      description: 'Bundle fresh produce kits',
    },
    {
      label: 'New Hero Banner',
      icon: ImageIcon,
      path: '/admin/banners?action=new',
      description: 'Publish promotional storefront carousel',
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-gray-800 transition-all">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-3 max-w-full">
        {/* Left: Sidebar Toggle, Live Status Pill & Breadcrumbs */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          {/* Store Live Status Pill */}
          <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Operational</span>
          </div>

          {/* Breadcrumbs */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 pl-2 border-l border-slate-200 dark:border-gray-800">
            <Link
              to="/admin/dashboard"
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-medium"
            >
              Console
            </Link>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-gray-600" />
            <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[200px] lg:max-w-[320px]">
              {getBreadcrumb()}
            </span>
          </div>
        </div>

        {/* Center: Universal Search Console Bar */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl text-xs text-slate-400 bg-slate-50 dark:bg-gray-850 hover:bg-slate-100 dark:hover:bg-gray-800 border border-slate-200/80 dark:border-gray-700/80 hover:border-slate-300 transition-all shadow-2xs group text-left"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              <span className="truncate">Search orders, products, customers...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 text-slate-500 shadow-2xs shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right: + Quick Action Button, Storefront, Bell, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Prominent "+ Quick Action" Dropdown */}
          <div className="relative" ref={quickActionRef}>
            <button
              type="button"
              onClick={() => setQuickActionOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Quick Action</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  quickActionOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {quickActionOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-gray-700 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-gray-700/80 mb-1">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Instant Creation
                  </p>
                </div>
                <div className="space-y-0.5">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.path}
                        to={action.path}
                        onClick={() => setQuickActionOpen(false)}
                        className="flex items-start gap-2.5 p-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700/80 hover:text-emerald-600 transition-colors group"
                      >
                        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-white leading-tight">
                            {action.label}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {action.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Live Chat & Communication Dropdown */}
          <div className="relative" ref={chatMenuRef}>
            <button
              type="button"
              onClick={() => setChatMenuOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                adminUnreadCount > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-gray-700'
              }`}
              title="Live Customer Chat Desk"
            >
              <div className="relative flex items-center">
                <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {adminUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                )}
              </div>
              <span className="hidden md:inline font-bold">Live Chat</span>
              {adminUnreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] leading-tight">
                  {adminUnreadCount}
                </span>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  chatMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {chatMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-gray-700 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-gray-700/80 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white">Customer Support Desk</span>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    {supportOnline ? 'Desk Active' : 'Online'}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-gray-700/50 border border-slate-100 dark:border-gray-700 text-xs">
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">Pending Customer Inquiries</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {adminUnreadCount > 0 ? `${adminUnreadCount} message(s) awaiting reply` : 'All inquiries resolved'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    to="/admin/communication"
                    onClick={() => setChatMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#0A4C36] hover:bg-[#073626] text-white transition-all shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Open Live Chat Console</span>
                  </Link>

                  <Link
                    to="/admin/users"
                    onClick={() => setChatMenuOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span>Customer Directory</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* View Storefront Link */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200/80 dark:hover:bg-gray-700 transition-colors"
            title="Open live customer storefront in new tab"
          >
            <Store className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Store</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          {/* Operational Alerts Bell */}
          <AdminNotificationBell variant="topbar" />

          {/* Admin Profile Dropdown */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition-all text-left"
              aria-label="Admin Profile Menu"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {userInitials}
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  userMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200/80 dark:border-gray-700 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-gray-700/80 mb-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || 'admin@store.com'}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    <UserCheck className="w-3 h-3" />
                    <span>Authorized Admin</span>
                  </div>
                </div>

                <Link
                  to="/admin/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Store Settings</span>
                </Link>

                <Link
                  to="/admin/danger-zone"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Production Reset & Purge</span>
                </Link>

                <div className="border-t border-slate-100 dark:border-gray-700/80 my-1" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Universal Command Palette / Spotlight Modal */}
      <AdminCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </header>
  );
};

export default AdminTopHeader;
