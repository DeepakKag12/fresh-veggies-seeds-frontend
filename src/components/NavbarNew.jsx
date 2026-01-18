import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  LogOut, 
  Package,
  LayoutDashboard,
  Plus,
  ClipboardList,
  CheckCircle,
  Users,
  Settings,
  Tag,
  Image
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/Button';

const NavbarNew = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const cartItemsCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = user?.role === 'admin' ? [
    { path: '/', label: 'Home' },
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/orders', label: 'All Orders' },
    { path: '/admin/categories', label: 'Categories' },
  ] : [
    { path: '/', label: 'Home' },
    { path: '/shop', label: 'Shop' },
    { path: '/combos', label: 'Combos' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src="/logo.png" 
              alt="Fresh Veggies" 
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent hidden lg:block">
              Fresh Veggies
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive(link.path)
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Admin Buttons */}
            {user?.role === 'admin' && (
              <>
                <Link to="/admin/orders?status=Pending">
                  <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
                    <ClipboardList className="w-4 h-4" />
                    <span className="text-sm">New Orders</span>
                  </button>
                </Link>
                <Link to="/admin/products">
                  <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add Product</span>
                  </button>
                </Link>
              </>
            )}
            
            {/* Cart Button - Only for non-admin users */}
            {user?.role !== 'admin' && (
              <Link to="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartItemsCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-semibold"
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </Button>
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hidden md:flex"
                >
                  <User className="w-5 h-5" />
                </Button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>

                        <div className="py-1">
                          {user.role === 'admin' && (
                            <>
                              <Link
                                to="/admin/dashboard"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                              </Link>
                              <Link
                                to="/admin/products"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Package className="w-4 h-4" />
                                All Products
                              </Link>
                              <Link
                                to="/admin/orders"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <ClipboardList className="w-4 h-4" />
                                All Orders
                              </Link>
                              <Link
                                to="/admin/coupons"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Tag className="w-4 h-4" />
                                Coupons
                              </Link>
                              <Link
                                to="/admin/reviews"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Reviews
                              </Link>
                              <Link
                                to="/admin/banners"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Image className="w-4 h-4" />
                                Banners
                              </Link>
                              <Link
                                to="/admin/users"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Users className="w-4 h-4" />
                                Users
                              </Link>
                              <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                            </>
                          )}
                          
                          <Link
                            to="/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Package className="w-4 h-4" />
                            My Orders
                          </Link>
                          
                          <Link
                            to="/settings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Settings className="w-4 h-4" />
                            Account Settings
                          </Link>
                          
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-800 overflow-hidden"
            >
              <div className="py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}

                {user ? (
                  <>
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 mt-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                    
                    {user.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    
                    <Link
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <Package className="w-4 h-4" />
                      My Orders
                    </Link>
                    
                    <Link
                      to="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <Settings className="w-4 h-4" />
                      Account Settings
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-2 space-y-2 border-t border-gray-200 dark:border-gray-800 mt-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default NavbarNew;
