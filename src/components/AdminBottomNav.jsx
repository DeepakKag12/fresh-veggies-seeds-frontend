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
  Home
} from 'lucide-react';
import api from '../utils/api';

const AdminBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [showMore, setShowMore] = useState(false);

  const fetchPendingOrders = useCallback(async () => {
    try {
      const response = await api.get('/admin/stats');
      setPendingCount(response.data.data.pendingOrders || 0);
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
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const moreNavItems = [
    { path: '/admin/categories', label: 'Categories', icon: Layers },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/combos', label: 'Combos', icon: Tag },
    { path: '/admin/coupons', label: 'Coupons', icon: Ticket },
    { path: '/admin/banners', label: 'Banners', icon: Image },
    { path: '/admin/reviews', label: 'Reviews', icon: Star },
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
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More Menu Panel */}
      {showMore && (
        <div className="fixed bottom-16 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 rounded-t-2xl p-4 md:hidden animate-slide-up">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Admin Options</h3>
            <button onClick={() => setShowMore(false)} className="text-gray-400">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setShowMore(false);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-colors"
                  style={{ backgroundColor: active ? '#16a34a' : '#374151' }}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-300'}`} />
                  <span className={`text-[10px] font-medium ${active ? 'text-white' : 'text-gray-300'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
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
