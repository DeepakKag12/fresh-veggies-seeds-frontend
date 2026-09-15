import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Grid3X3, ShoppingCart, Package, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { getCartCount, openCart } = useCart();
  const cartCount = getCartCount();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/shop', label: 'Shop', icon: Grid3X3 },
    { path: '/cart', label: 'Cart', icon: ShoppingCart, badge: cartCount, action: () => openCart() },
    { path: user ? '/orders' : '/login', label: 'Orders', icon: Package },
    { path: user ? '/settings' : '/login', label: 'Account', icon: User },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-gray-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
      <div className="flex justify-around items-center h-16 px-1 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.action && location.pathname !== '/checkout') {
                  item.action();
                } else {
                  navigate(item.path);
                }
              }}
              aria-label={item.label}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 min-h-[48px] min-w-[48px] transition-colors relative"
            >
              <div className="relative">
                <div
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    active
                      ? 'bg-fv-cream dark:bg-emerald-950/60 text-fv-primary dark:text-emerald-400 scale-105'
                      : 'text-slate-500 dark:text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-fv-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-xs">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] mt-0.5 font-medium transition-colors ${
                  active ? 'text-fv-primary dark:text-emerald-400 font-semibold' : 'text-slate-500 dark:text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

