import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, 
  Search,
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
import { useSettings } from '../context/SettingsContext';
import { Button } from './ui/Button';

const NavbarNew = () => {
  const { settings } = useSettings();
  const freeDeliveryThreshold = settings?.delivery?.freeDeliveryThreshold ?? 300;

  const OFFERS = [
    `🚚 Free shipping above ₹${freeDeliveryThreshold}`,
    '🌱 Fresh stock every week',
    '💳 Cash on delivery available',
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems, openCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const cartItemsCount = cartItems?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  // Offers belong on the storefront. On checkout, the account pages and admin
  // screens they are a distraction from the task the page exists for.
  const showOffersBar = location.pathname === '/';

  const navLinks = user?.role === 'admin' ? [
    { path: '/', label: 'Home' },
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/orders', label: 'All Orders' },
    { path: '/admin/categories', label: 'Categories' },
  ] : [
    { path: '/', label: 'Shop' },
    { path: '/combos', label: 'Combos' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-white border-b border-fv-border"
    >
      {showOffersBar && (
      <div className="overflow-hidden bg-fv-primary py-2" aria-hidden="true">
        <style>{`
          .fv-offers-track { display:flex; width:max-content; animation: fv-offers 28s linear infinite; will-change:transform; }
          @keyframes fv-offers { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          .fv-offers-pass { display:flex; flex-shrink:0; min-width:100vw; justify-content:space-around; }
          @media (prefers-reduced-motion: reduce) { .fv-offers-track { animation:none; } }
        `}</style>
        <div className="fv-offers-track">
          {['a', 'b'].map((pass) => (
            <div className="fv-offers-pass" key={pass}>
              {OFFERS.map((o) => (
                <span key={o} className="whitespace-nowrap px-8 text-[12px] font-semibold uppercase tracking-wide text-white">
                  {o}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      )}
      {/* The bar is decorative motion; the same facts are stated in the footer. */}
      <p className="sr-only">Free delivery on orders over ₹{freeDeliveryThreshold}. Cash on delivery available.</p>
      <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-4 h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img 
              src="/logo.png" 
              alt="Fresh Veggies" 
              className="h-12 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <span className="hidden font-serif text-[22px] font-bold text-fv-primary lg:block">
              Fresh Veggies
            </span>
          </Link>

          {/* Search — the primary way people find products, so it gets the
              centre of the bar rather than a cramped corner. */}
          <form
            role="search"
            onSubmit={(e) => { e.preventDefault(); const q = new FormData(e.currentTarget).get('q');
              navigate(q ? `/?search=${encodeURIComponent(q)}` : '/'); }}
            className="hidden flex-1 lg:block"
          >
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fv-muted" aria-hidden="true" />
              <input
                id="site-search"
                name="q"
                type="search"
                placeholder="Search for seeds, soil, tools…"
                className="h-11 w-full rounded-[50px] bg-fv-surface pl-12 pr-4 text-[15px] text-fv-ink
                           placeholder:text-fv-muted focus:outline-none focus:ring-2 focus:ring-fv-primary"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {/* Admin Buttons */}
            {user?.role === 'admin' && (
              <>
                <Link to="/admin/orders?status=Pending">
                  <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-fv-yellow text-fv-primary hover:brightness-95 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
                    <ClipboardList className="w-4 h-4" />
                    <span className="text-sm">New Orders</span>
                  </button>
                </Link>
                <Link to="/admin/products">
                  <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-fv-primary hover:bg-fv-primary-dark text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Add Product</span>
                  </button>
                </Link>
              </>
            )}
            
            {/* Mobile Search Trigger */}
            <button
              type="button"
              onClick={() => {
                setMobileSearchOpen((prev) => !prev);
                setMobileMenuOpen(false);
              }}
              aria-label="Search products"
              className="flex h-11 w-11 items-center justify-center rounded-full text-fv-primary
                         hover:bg-fv-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary lg:hidden"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Cart Button - Only for non-admin users */}
            {user?.role !== 'admin' && (
              <button
                type="button"
                onClick={openCart}
                aria-label={cartItemsCount > 0 ? `Open cart, ${cartItemsCount} items` : 'Open cart'}
                className="relative flex h-11 w-11 items-center justify-center rounded-full text-fv-primary
                           hover:bg-fv-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
              >
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {cartItemsCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full
                                   bg-fv-primary text-xs font-semibold text-white">
                    {cartItemsCount}
                  </span>
                )}
              </button>
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
                                to="/admin/danger-zone"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-fv-danger hover:bg-red-50"
                              >
                                <ShieldAlert className="w-4 h-4" />
                                Production prep
                              </Link>
                              <Link
                                to="/admin/users"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Users className="w-4 h-4" />
                                Users
                              </Link>
                              <Link
                                to="/admin/settings"
                                onClick={() => setUserMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2 text-sm text-fv-primary font-medium hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                <Settings className="w-4 h-4" />
                                Store Settings
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
              <Link
                to="/login"
                aria-label="Sign in to your account"
                className="hidden h-11 w-11 items-center justify-center rounded-full text-fv-primary
                           hover:bg-fv-surface focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-fv-primary md:flex"
              >
                <User className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search Dropdown */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-fv-border bg-white px-3 py-2.5 lg:hidden overflow-hidden"
            >
              <form
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = new FormData(e.currentTarget).get('q');
                  navigate(q ? `/?search=${encodeURIComponent(q)}` : '/');
                  setMobileSearchOpen(false);
                }}
              >
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-fv-muted" aria-hidden="true" />
                  <input
                    name="q"
                    type="search"
                    autoFocus
                    placeholder="Search seeds, soil, tools…"
                    className="h-11 w-full rounded-full bg-fv-surface pl-10 pr-10 text-[15px] sm:text-[14px] text-fv-heading
                               placeholder:text-fv-muted focus:outline-none focus:ring-2 focus:ring-fv-primary/30"
                  />
                  <button
                    type="button"
                    onClick={() => setMobileSearchOpen(false)}
                    className="absolute right-1 flex h-10 w-10 items-center justify-center rounded-full text-fv-muted hover:text-fv-heading"
                    aria-label="Close search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category row, centred beneath the search bar. */}
        <nav aria-label="Product categories" className="hidden border-t border-fv-border md:block">
          <ul className="flex items-center justify-center gap-8 py-3">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  aria-current={isActive(link.path) ? 'page' : undefined}
                  className={`text-[14px] uppercase tracking-wide transition-colors motion-reduce:transition-none ${
                    isActive(link.path)
                      ? 'font-semibold text-fv-primary underline underline-offset-8'
                      : 'text-fv-heading hover:text-fv-primary'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

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
                    className={`flex items-center min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.path)
                        ? 'bg-fv-cream text-fv-primary'
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
                      <>
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 min-h-[44px] px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                        <Link
                          to="/admin/settings"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex items-center gap-3 min-h-[44px] px-4 py-2 text-sm text-fv-primary font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                        >
                          <Settings className="w-4 h-4" />
                          Store Settings
                        </Link>
                      </>
                    )}
                    
                    <Link
                      to="/orders"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 min-h-[44px] px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <Package className="w-4 h-4" />
                      My Orders
                    </Link>
                    
                    <Link
                      to="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 min-h-[44px] px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                      <Settings className="w-4 h-4" />
                      Account Settings
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 w-full min-h-[44px] px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-left"
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
                      <Button variant="outline" className="w-full min-h-[44px]">
                        Login
                      </Button>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button className="w-full min-h-[44px] bg-fv-primary hover:bg-fv-primary-dark">
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
