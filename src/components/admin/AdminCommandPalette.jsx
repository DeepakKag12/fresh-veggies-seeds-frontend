import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
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
  ArrowRight,
  PlusCircle,
  X,
  ArchiveRestore
} from 'lucide-react';
import api from '../../utils/api';

export const AdminCommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
    }
  }, [isOpen]);

  // Global keyboard shortcut listener for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Parent triggers open
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live product search debounce
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setProducts([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/products', { params: { search: query.trim(), limit: 5 } });
        setProducts(res.data?.data || []);
      } catch {
        setProducts([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const defaultNavItems = [
    { title: 'Orders Workspace', subtitle: 'Manage fulfillments, print invoices & cancellations', path: '/admin/orders', icon: ClipboardList, section: 'Core Ops' },
    { title: 'Products Catalog', subtitle: 'Stock control, prices, and inventory management', path: '/admin/products', icon: Package, section: 'Core Ops' },
    { title: 'Dashboard Overview', subtitle: 'Operational KPIs, sales charts and urgency funnel', path: '/admin/dashboard', icon: LayoutDashboard, section: 'Core Ops' },
    { title: 'Categories & Departments', subtitle: 'Priorities and department organization', path: '/admin/categories', icon: Layers, section: 'Catalog' },
    { title: 'Combos & Veggie Kits', subtitle: 'Curated farm bundles and multi-product boxes', path: '/admin/combos', icon: Boxes, section: 'Catalog' },
    { title: 'Customer Reviews', subtitle: 'Moderate feedback and rating approvals', path: '/admin/reviews', icon: Star, section: 'Marketing' },
    { title: 'Coupons & Discounts', subtitle: 'Percentage and flat discounts with minimum rules', path: '/admin/coupons', icon: Ticket, section: 'Marketing' },
    { title: 'Promotional Banners', subtitle: 'Hero carousel sliders and home screen campaigns', path: '/admin/banners', icon: Image, section: 'Marketing' },
    { title: 'Customer Directory', subtitle: 'Customer accounts, profiles, and past orders', path: '/admin/users', icon: Users, section: 'Customers' },
    { title: 'Store Settings', subtitle: 'Pincodes, delivery slots, business info & fees', path: '/admin/settings', icon: Settings, section: 'Configuration' },
    { title: 'Delete History & Recovery', subtitle: 'Track deleted items, audit trails & restore records', path: '/admin/delete-history', icon: ArchiveRestore, section: 'Configuration' },
    { title: 'Danger Zone & Purge', subtitle: 'Production preparation and test data reset', path: '/admin/danger-zone', icon: ShieldAlert, section: 'Configuration', danger: true },
  ];

  const quickActions = [
    { title: 'Create New Product', subtitle: 'Add fresh vegetable to catalog', path: '/admin/products?new=true', icon: PlusCircle },
    { title: 'Create Promo Coupon', subtitle: 'Launch new discount code', path: '/admin/coupons', icon: Ticket },
    { title: 'Upload Hero Banner', subtitle: 'Add storefront carousel banner', path: '/admin/banners', icon: Image },
  ];

  const filteredNav = query.trim()
    ? defaultNavItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
        item.section.toLowerCase().includes(query.toLowerCase())
      )
    : defaultNavItems;

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-fv-border overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-fv-border bg-fv-surface/40">
          <Search className="w-5 h-5 text-fv-muted mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, page name, or search catalog products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm md:text-base font-medium text-fv-heading dark:text-white placeholder:text-fv-muted focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-fv-muted hover:text-fv-heading rounded-md mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-gray-700 border border-fv-border rounded-md text-fv-muted">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto p-3 space-y-4 divide-y divide-fv-border/50">
          {/* Quick Actions (when query is short or empty) */}
          {!query && (
            <div className="space-y-1.5 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-fv-muted px-2">
                Quick Shortcuts
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {quickActions.map((qa) => {
                  const Icon = qa.icon;
                  return (
                    <button
                      key={qa.title}
                      onClick={() => handleSelect(qa.path)}
                      className="p-2.5 rounded-xl border border-fv-border hover:border-fv-primary hover:bg-fv-surface dark:hover:bg-gray-700/60 text-left transition-all flex items-start gap-2.5 group"
                    >
                      <div className="p-1.5 rounded-lg bg-fv-primary/10 text-fv-primary group-hover:scale-110 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-fv-heading dark:text-white truncate">{qa.title}</p>
                        <p className="text-[10px] text-fv-muted truncate">{qa.subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Catalog Products Live Matches */}
          {products.length > 0 && (
            <div className="space-y-1 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 flex items-center gap-1">
                <Package className="w-3 h-3" /> Catalog Products Found ({products.length})
              </span>
              {products.map((p) => (
                <button
                  key={p._id}
                  onClick={() => handleSelect(`/admin/products?search=${encodeURIComponent(p.name)}`)}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-fv-surface dark:hover:bg-gray-700/60 transition-colors text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-fv-border shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-fv-surface flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-fv-muted" />
                      </div>
                    )}
                    <div className="truncate">
                      <p className="text-xs font-bold text-fv-heading dark:text-white group-hover:text-fv-primary transition-colors truncate">
                        {p.name}
                      </p>
                      <p className="text-[10px] text-fv-muted">
                        ₹{p.price} · Stock: {p.stock} · {p.category?.name || 'Produce'}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-fv-muted group-hover:text-fv-primary shrink-0 transition-transform group-hover:translate-x-1" />
                </button>
              ))}
            </div>
          )}

          {/* Navigation Items */}
          <div className="space-y-1 pt-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fv-muted px-2">
              Admin Sections & Workspaces
            </span>
            {filteredNav.length === 0 && products.length === 0 ? (
              <div className="text-center py-8 text-xs text-fv-muted">
                No commands or matching sections found for "{query}".
              </div>
            ) : (
              filteredNav.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleSelect(item.path)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-fv-surface dark:hover:bg-gray-700/60 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl ${
                        item.danger
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                          : 'bg-fv-surface text-fv-heading group-hover:bg-fv-primary/10 group-hover:text-fv-primary transition-colors'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <p className={`text-xs font-bold ${
                          item.danger ? 'text-amber-700 dark:text-amber-400' : 'text-fv-heading dark:text-white'
                        } group-hover:text-fv-primary transition-colors`}>
                          {item.title}
                        </p>
                        <p className="text-[10px] text-fv-muted truncate">{item.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-fv-muted uppercase tracking-wider px-2 py-0.5 rounded-md bg-fv-surface">
                      {item.section}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-fv-surface/60 border-t border-fv-border flex items-center justify-between text-[11px] text-fv-muted">
          <span>Pro tip: Press <kbd className="font-mono font-bold text-fv-heading">Ctrl+K</kbd> anywhere to jump</span>
          <span>Fresh Veggies Admin</span>
        </div>
      </div>
    </div>
  );
};

export default AdminCommandPalette;
