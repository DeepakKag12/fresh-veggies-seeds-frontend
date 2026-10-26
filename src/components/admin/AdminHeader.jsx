import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Layers,
  Boxes,
  Users,
  Ticket,
  Image,
  Star,
  Settings,
  ShieldAlert,
  ExternalLink,
  ChevronDown,
  LogOut,
  Menu,
  X,
  UserCheck,
  Store,
  Search,
  ArchiveRestore,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import AdminNotificationBell from './AdminNotificationBell';
import AdminCommandPalette from './AdminCommandPalette';

const AdminHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { settings } = useSettings();

  const [stats, setStats] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const userMenuRef = useRef(null);

  // Global Ctrl+K / Cmd+K shortcut listener
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

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch {
      // silently fail on intermittent network drop
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/admin/dashboard') return location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const pendingActionCount = (stats?.pendingOrders || 0) + (stats?.cancellationRequests || 0);
  const lowStockCount = stats?.lowStockProducts || 0;
  const pendingReviewsCount = stats?.pendingReviews || 0;

  const storeName = settings?.store?.name || 'Fresh Veggies';
  const userInitials = (user?.name || 'Admin')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const navLinks = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      path: '/admin/orders',
      label: 'Orders',
      icon: ClipboardList,
      badge: pendingActionCount > 0 ? pendingActionCount : null,
      badgeColor: 'bg-red-500 text-white animate-pulse',
    },
    {
      path: '/admin/products',
      label: 'Products',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      path: '/admin/categories',
      label: 'Categories',
      icon: Layers,
    },
    {
      path: '/admin/combos',
      label: 'Combos & Kits',
      icon: Boxes,
    },
    {
      path: '/admin/reviews',
      label: 'Reviews',
      icon: Star,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : null,
      badgeColor: 'bg-blue-500 text-white',
    },
    {
      path: '/admin/coupons',
      label: 'Coupons',
      icon: Ticket,
    },
    {
      path: '/admin/banners',
      label: 'Banners',
      icon: Image,
    },
    {
      path: '/admin/users',
      label: 'Customers',
      icon: Users,
    },
    {
      path: '/admin/settings',
      label: 'Store Settings',
      icon: Settings,
    },
    {
      path: '/admin/delete-history',
      label: 'Delete History',
      icon: ArchiveRestore,
    },
    {
      path: '/admin/danger-zone',
      label: 'Danger Zone',
      icon: ShieldAlert,
      danger: true,
    },
  ];

  const getPageTitle = (path) => {
    if (path.includes('/products')) return 'Products';
    if (path.includes('/orders')) return 'Orders';
    if (path.includes('/categories')) return 'Categories';
    if (path.includes('/combos')) return 'Combos & Kits';
    if (path.includes('/coupons')) return 'Coupons';
    if (path.includes('/reviews')) return 'Reviews';
    if (path.includes('/banners')) return 'Banners';
    if (path.includes('/users')) return 'Customers';
    if (path.includes('/delete-history')) return 'Delete History';
    if (path.includes('/danger-zone')) return 'Danger Zone';
    if (path.includes('/settings')) return 'Store Settings';
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-fv-border shadow-xs">
      {/* Tier 1: Brand Bar & Quick Controls */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 border-b border-fv-border/60">
          {/* Left: Brand Identity & Back Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            {location.pathname !== '/admin/dashboard' ? (
              <button
                type="button"
                onClick={() => {
                  if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/admin/dashboard');
                  }
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-fv-border bg-fv-surface dark:bg-gray-700 hover:bg-fv-border dark:hover:bg-gray-600 text-xs font-bold text-fv-heading dark:text-white transition-all shadow-2xs hover:-translate-x-0.5 active:scale-95 shrink-0"
                title="Go back to previous page"
                aria-label="Back"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-fv-primary dark:text-emerald-400" />
                <span className="hidden sm:inline">Back</span>
              </button>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-xs font-bold text-emerald-800 dark:text-emerald-300 transition-all shadow-2xs hover:-translate-x-0.5 active:scale-95 shrink-0"
                title="Return to customer storefront"
                aria-label="Return to Store"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Store</span>
              </Link>
            )}

            <Link
              to="/admin/dashboard"
              className="flex items-center gap-2.5 group transition-transform active:scale-95"
            >
              <img
                src="/logo.png"
                alt="Store Logo"
                className="h-8 w-8 object-contain rounded-lg shadow-2xs group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-fv-heading dark:text-white leading-none">
                  {storeName}
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-emerald-700 dark:text-emerald-400 uppercase mt-0.5">
                  Admin Console
                </span>
              </div>
            </Link>

            {/* Breadcrumb Trail */}
            {location.pathname !== '/admin/dashboard' && (
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-fv-muted font-medium pl-2 border-l border-fv-border/70">
                <Link
                  to="/admin/dashboard"
                  className="hover:text-fv-primary dark:hover:text-emerald-400 transition-colors"
                >
                  Dashboard
                </Link>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <span className="font-bold text-fv-heading dark:text-white">
                  {getPageTitle(location.pathname)}
                </span>
              </div>
            )}

            {/* Live Status Pill */}
            {location.pathname === '/admin/dashboard' && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Operational</span>
              </div>
            )}
          </div>

          {/* Right: Actions, Alerts & Admin Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Command & Universal Search Trigger */}
            <button
              type="button"
              onClick={() => setCommandPaletteOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium text-fv-muted bg-fv-surface dark:bg-gray-700 hover:text-fv-heading hover:bg-fv-border dark:hover:bg-gray-600 border border-fv-border transition-all"
              title="Quick search / Spotlight (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-fv-muted" />
              <span className="hidden md:inline">Search console...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-white dark:bg-gray-800 border border-fv-border text-fv-muted">
                ⌘K
              </kbd>
            </button>

            {/* View Live Storefront Button */}
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-fv-heading bg-fv-surface dark:bg-gray-700 hover:bg-fv-border dark:hover:bg-gray-600 transition-colors"
              title="Open storefront in a new tab"
            >
              <Store className="w-3.5 h-3.5 text-fv-primary dark:text-emerald-400" />
              <span className="hidden sm:inline">View Store</span>
              <ExternalLink className="w-3 h-3 text-fv-muted" />
            </Link>

            {/* Live Operational Alerts Bell */}
            <AdminNotificationBell variant="topbar" />

            {/* Admin User Profile Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-fv-border hover:bg-fv-surface dark:hover:bg-gray-700 transition-all text-left"
                aria-label="Admin Profile Menu"
              >
                <div className="w-7 h-7 rounded-lg bg-fv-primary text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {userInitials}
                </div>
                <div className="hidden md:flex flex-col">
                  <span className="text-xs font-bold text-fv-heading dark:text-white leading-none">
                    {user?.name || 'Administrator'}
                  </span>
                  <span className="text-[10px] text-fv-muted leading-tight mt-0.5 capitalize">
                    {user?.role || 'Admin'}
                  </span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-fv-muted transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-fv-border p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2.5 border-b border-fv-border/70 mb-1">
                    <p className="text-xs font-bold text-fv-heading dark:text-white truncate">
                      {user?.name || 'Administrator'}
                    </p>
                    <p className="text-[11px] text-fv-muted truncate">{user?.email || 'admin@store.com'}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                      <UserCheck className="w-3 h-3" />
                      <span>Authorized Administrator</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigate('/admin/settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-fv-heading dark:text-gray-200 hover:bg-fv-surface dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-fv-primary dark:text-emerald-400" />
                    Store Configuration
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      navigate('/admin/danger-zone');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-xl transition-colors text-left"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Production Reset & Purge
                  </button>

                  <div className="border-t border-fv-border/70 my-1" />

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl border border-fv-border hover:bg-fv-surface dark:hover:bg-gray-700 text-fv-heading dark:text-white"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Tier 2: Desktop Horizontal Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 py-1.5 overflow-x-auto scrollbar-none">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  active
                    ? 'bg-fv-primary text-white shadow-2xs font-bold'
                    : item.danger
                    ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                    : 'text-gray-700 dark:text-gray-300 hover:text-fv-primary hover:bg-fv-surface dark:hover:bg-gray-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : ''}`} />
                <span>{item.label}</span>
                {item.badge != null && (
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-bold rounded-full leading-none ${
                      item.badgeColor || 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer / Slide Down Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-fv-border bg-white dark:bg-gray-800 px-4 py-3 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1 pb-4">
            <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-fv-muted">
              Admin Navigation
            </p>
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-fv-primary text-white shadow-xs font-bold'
                      : item.danger
                      ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-fv-surface dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge != null && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full leading-none ${
                        item.badgeColor || 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-fv-border pt-3 space-y-2">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-fv-surface dark:bg-gray-700 text-fv-heading dark:text-white hover:bg-fv-border"
            >
              <Store className="w-4 h-4 text-fv-primary" />
              <span>View Live Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-fv-muted" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Universal Command Palette / Spotlight Modal */}
      <AdminCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </header>
  );
};

export default AdminHeader;
