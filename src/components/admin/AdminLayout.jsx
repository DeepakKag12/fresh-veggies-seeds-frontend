import React, { useState, useEffect, useCallback } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminTopHeader from './AdminTopHeader';
import AdminBottomNav from './AdminBottomNav';
import api from '../../utils/api';

/**
 * Unified Admin Workspace Layout (Shopify Admin + Stripe Dashboard benchmarks)
 * - Collapsible Vertical Sidebar (Shopify gold standard)
 * - Anti-Clutter Top Header Bar & Generous Canvas Spacing (Stripe gold standard)
 * - Responsive Mobile Drawer & Bottom Navigation
 */
const AdminLayout = ({ children }) => {
  // Sidebar collapsed state persisted in localStorage
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('fv_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState(null);

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('fv_admin_sidebar_collapsed', String(next));
      } catch {
        // ignore storage quota error
      }
      return next;
    });
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch {
      // silently ignore network drops
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-gray-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased">
      {/* Shopify-Grade Collapsible Vertical Left Sidebar */}
      <AdminSidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        stats={stats}
      />

      {/* Main Workspace Column: Offsets to the right by sidebar width on desktop */}
      <div
        className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Stripe-Grade Clean Top Header Bar */}
        <AdminTopHeader
          onToggleSidebar={toggleCollapse}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
          stats={stats}
        />

        {/* Content Canvas: Generous Stripe-Grade Spacing & Visual Hierarchy */}
        <main className="flex-1 pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Admin Bottom Nav for fast thumb reachability on phones */}
      <AdminBottomNav />
    </div>
  );
};

export default AdminLayout;
