import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Grid3X3, Package, Gift, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/shop', label: 'Shop', icon: Grid3X3 },
    { path: '/combos', label: 'Offers', icon: Gift },
    { path: user ? '/orders' : '/login', label: 'Orders', icon: Package },
    { path: user ? '/settings' : '/login', label: 'Account', icon: User },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 md:hidden">
      <div className="flex justify-around items-center h-16 px-1 safe-area-bottom">
        {navItems.map((item) => {
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
              </div>
              <span className={`text-[10px] mt-1 font-medium ${
                active ? 'text-green-400' : 'text-gray-400'
              }`}>
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
