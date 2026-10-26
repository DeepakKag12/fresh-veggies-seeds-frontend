import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, 
  Search,
  ShoppingCart, 
  Heart,
  User, 
  Menu, 
  X, 
  LogOut, 
  Package,
  LayoutDashboard,
  ClipboardList,
  CheckCircle,
  Users,
  Settings,
  Tag,
  Image
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useSettings } from '../context/SettingsContext';
import { Button } from './ui/Button';
import SearchAutocomplete from './SearchAutocomplete';

const Navbar = () => {
  const { settings } = useSettings();
  const storeName = settings?.store?.name || 'Fresh Veggies';
  const storeLogo = settings?.store?.logo || '/logo.png';
  const freeDeliveryThreshold = settings?.delivery?.freeDeliveryThreshold ?? 499;
  const isCodAvailable = (settings?.delivery?.codAvailable ?? true) && (settings?.payments?.codEnabled ?? true);
  const isStoreClosed = Boolean(settings?.maintenance?.isStoreClosed);
  const closureNotice = settings?.maintenance?.closureNotice || 'Our storefront is currently closed for routine maintenance.';
  const announcement = settings?.maintenance?.announcementBanner;
  const showAnnouncement = Boolean(announcement?.enabled && announcement?.message);

  const OFFERS = [
    `Free shipping on orders above ₹${freeDeliveryThreshold}`,
    'Fresh stock & tested germination',
    isCodAvailable ? 'Cash on delivery available' : 'Fast door-to-door dispatch',
  ];

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { cartItems, openCart } = useCart();
  const { wishlistCount, openWishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const cartItemsCount = cartItems?.reduce((totalCount, item) => totalCount + item.quantity, 0) || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const isActive = (targetPath) => {
    if (targetPath.includes('?')) {
      const [pathPart, queryPart] = targetPath.split('?');
      if (location.pathname !== pathPart) return false;
      const targetParams = new URLSearchParams(queryPart);
      const currentParams = new URLSearchParams(location.search);
      for (const [key, val] of targetParams.entries()) {
        if (currentParams.get(key)?.toLowerCase() !== val.toLowerCase()) return false;
      }
      return true;
    }
    if (targetPath === '/') {
      const currentParams = new URLSearchParams(location.search);
      return location.pathname === '/' && !currentParams.get('category') && !currentParams.get('search');
    }
    return location.pathname === targetPath || location.pathname.startsWith(targetPath + '/');
  };

  // Offers belong on the storefront. On checkout, the account pages and admin
  // screens they are a distraction from the task the page exists for.
  const showOffersBar = location.pathname === '/';

  const navLinks = [
    { path: '/', label: 'All' },
    { path: '/?category=Plants', label: 'Plants' },
    { path: '/?category=Seeds', label: 'Seeds' },
    { path: '/?category=Pots', label: 'Pots & Planters' },
    { path: '/?category=Soils', label: 'Soil & Care' },
    { path: '/combos', label: 'Combos & Kits' },
    { path: '/?category=Garden%20Tools', label: 'Garden Tools' },
    { path: '/about', label: 'About' },
    { path: '/contact', label: 'Contact' },
  ];

  return (
    <nav
      className="sticky top-0 z-50 bg-white border-b border-fv-border"
    >
      {/* Emergency Store Closure Notice */}
      {isStoreClosed && (
        <div className="bg-red-600 text-white py-2.5 px-4 text-center text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-sm">
          <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse" />
          <span>{closureNotice}</span>
        </div>
      )}

      {/* Dynamic Announcement Banner */}
      {!isStoreClosed && showAnnouncement && (
        <div className={`py-2 px-4 text-center text-xs font-medium tracking-wide flex items-center justify-center gap-2 shadow-xs transition-colors ${
          announcement?.type === 'emergency'
            ? 'bg-rose-600 text-white'
            : announcement?.type === 'warning'
            ? 'bg-amber-400 text-slate-950 font-semibold'
            : announcement?.type === 'success'
            ? 'bg-emerald-600 text-white'
            : 'bg-indigo-600 text-white'
        }`}>
          <span>{announcement?.message}</span>
          {announcement?.link && (
            <Link
              to={announcement.link}
              className="underline font-bold hover:opacity-90 ml-1 inline-flex items-center gap-0.5"
            >
              Learn More →
            </Link>
          )}
        </div>
      )}

      {showOffersBar && (
      <div className="overflow-hidden bg-[#FFF3D9] border-b border-[#E8D7B8]/60 py-2" aria-hidden="true">
        <div className="fv-offers-track">
          {['a', 'b'].map((pass) => (
            <div className="fv-offers-pass" key={pass}>
              {OFFERS.map((offerText) => (
                <span key={offerText} className="whitespace-nowrap px-8 text-[12px] font-bold uppercase tracking-wider text-[#0A4D3C]">
                  ⚡ {offerText}
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
        <div className="flex items-center justify-between h-16 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
          {/* Logo */}
          <div className="flex items-center justify-start shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <img 
                src={storeLogo} 
                alt={storeName} 
                className="h-11 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <span className="hidden font-serif text-[22px] font-bold text-fv-primary lg:block">
                {storeName}
              </span>
            </Link>
          </div>

          {/* Amazon / Sephora 300ms Debounced Autocomplete Search */}
          <div className="hidden lg:flex items-center justify-center w-full min-w-[340px] max-w-xl xl:max-w-2xl mx-auto px-4">
            <SearchAutocomplete />
          </div>

          {/* Right Actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 shrink-0 ml-auto lg:ml-0">
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

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={openWishlist}
              aria-label={wishlistCount > 0 ? `Open wishlist, ${wishlistCount} items` : 'Open wishlist'}
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-fv-primary
                         hover:bg-fv-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
            >
              <Heart className="h-5 w-5" aria-hidden="true" />
              {wishlistCount > 0 && (
                <motion.span
                  key={wishlistCount}
                  initial={{ scale: 0.5, y: -3 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full
                             bg-rose-500 text-xs font-semibold text-white shadow-xs"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={openCart}
              aria-label={cartItemsCount > 0 ? `Open cart, ${cartItemsCount} items` : 'Open cart'}
              className="relative flex h-11 w-11 items-center justify-center rounded-full text-fv-primary
                         hover:bg-fv-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {cartItemsCount > 0 && (
                <motion.span
                  key={cartItemsCount}
                  initial={{ scale: 0.5, y: -3 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-full
                             bg-fv-primary text-xs font-semibold text-white shadow-xs"
                >
                  {cartItemsCount}
                </motion.span>
              )}
            </button>

            {/* User Menu */}
            {user ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-fv-primary hover:bg-fv-surface"
                  aria-label="User profile and account settings"
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
                state={{ from: location }}
                aria-label="Sign in to your account"
                className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-fv-primary
                           hover:bg-fv-surface focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-fv-primary"
              >
                <User className="h-5 w-5" aria-hidden="true" />
              </Link>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-full text-fv-primary hover:bg-fv-surface"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Open navigation menu"
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
              className="border-t border-fv-border bg-white px-3 py-2.5 lg:hidden"
            >
              <SearchAutocomplete onClose={() => setMobileSearchOpen(false)} />
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

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openWishlist();
                      }}
                      className="flex items-center justify-between w-full min-h-[44px] px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>My Wishlist</span>
                      </div>
                      {wishlistCount > 0 && (
                        <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                          {wishlistCount}
                        </span>
                      )}
                    </button>
                    
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
                      state={{ from: location }}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block"
                    >
                      <Button variant="outline" className="w-full min-h-[44px]">
                        Login
                      </Button>
                    </Link>
                    <Link
                      to="/register"
                      state={{ from: location }}
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
    </nav>
  );
};

export default Navbar;
