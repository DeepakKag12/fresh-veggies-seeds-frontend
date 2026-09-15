import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList,
  Package,
  Menu,
  X,
  Tag,
  Image,
  Star,
  Ticket,
  Users,
  Layers,
  Home,
  Settings
} from 'lucide-react';
import api from '../utils/api';
import AdminNotificationBell from './AdminNotificationBell';

const AdminBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [showMore, setShowMore] = useState(false);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const response = await api.get('/admin/stats');
      const data = response.data.data;
      // badge = new orders + cancellation requests
      const combined = (data.pendingOrders || 0) + (data.cancellationRequests || 0);
      setPendingCount(combined);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  }, []);

  useEffect(() => {
    fetchPendingOrders();
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchPendingOrders]);

  const mainNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/admin/orders', label: 'Orders', icon: ClipboardList, badge: pendingCount },
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const moreNavGroups = [
    {
      title: 'Products & Inventory',
      items: [
        { path: '/admin/products', label: 'Products', icon: Package },
        { path: '/admin/categories', label: 'Categories', icon: Layers },
        { path: '/admin/combos', label: 'Combos', icon: Tag },
        { path: '/admin/products?lowstock=true', label: 'Low Stock', icon: Tag },
      ]
    },
    {
      title: 'Marketing & Feedback',
      items: [
        { path: '/admin/coupons', label: 'Coupons', icon: Ticket },
        { path: '/admin/banners', label: 'Banners', icon: Image },
        { path: '/admin/reviews', label: 'Reviews', icon: Star },
      ]
    },
    {
      title: 'Management & Settings',
      items: [
        { path: '/admin/users', label: 'Customers', icon: Users },
        { path: '/admin/settings', label: 'Store Settings', icon: Settings },
      ]
    }
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* More Menu Overlay */}
      {showMore && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More Menu Panel */}
      {showMore && (
        <div className="fixed bottom-16 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 rounded-t-3xl p-5 md:hidden animate-slide-up max-h-[80vh] overflow-y-auto shadow-2xl">
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-gray-800">
            <div>
              <h3 className="text-white font-bold text-base">Admin Navigation</h3>
              <p className="text-xs text-gray-400">Quick access to store management</p>
            </div>
            <button 
              onClick={() => setShowMore(false)} 
              className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {moreNavGroups.map((group) => (
              <div key={group.title}>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2 px-1">
                  {group.title}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setShowMore(false);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                          active
                            ? 'bg-fv-primary text-white font-semibold shadow-md'
                            : 'bg-gray-800/80 hover:bg-gray-800 text-gray-300'
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-fv-primary'}`} />
                        <span className="text-xs font-medium truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 md:hidden">
        <div className="flex justify-around items-center h-16 px-1 safe-area-bottom">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors relative"
              >
                <div className="relative">
                  <div className={`p-1.5 rounded-full transition-colors ${
                    active ? 'bg-green-600' : ''
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      active ? 'text-white' : 'text-gray-400'
                    }`} />
                  </div>
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold animate-pulse">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${
                  active ? 'text-green-400' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Notification Bell */}
          <AdminNotificationBell />
          
          {/* More Button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center justify-center flex-1 h-full py-2 transition-colors"
          >
            <div className={`p-1.5 rounded-full transition-colors ${
              showMore ? 'bg-green-600' : ''
            }`}>
              <Menu className={`w-5 h-5 ${
                showMore ? 'text-white' : 'text-gray-400'
              }`} />
            </div>
            <span className={`text-[10px] mt-1 font-medium ${
              showMore ? 'text-green-400' : 'text-gray-400'
            }`}>
              More
            </span>
          </button>
        </div>
      </nav>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default AdminBottomNav;
