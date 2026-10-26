import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { getProductImageUrl, handleImageError, DEFAULT_PRODUCT_IMAGE } from '../utils/imageFallback';

/**
 * Nike / ASOS Benchmark:
 * Wishlist Drawer & Quick Toggle (FEAT-009)
 *
 * Features:
 * - Persistent right-hand slide-over panel powered by framer-motion
 * - In-stock status badges & real-time stock checks
 * - 1-Click "Move to Cart" with auto-removal from wishlist
 * - "Clear Wishlist" bulk action
 * - Focus management and light-dismiss backdrop
 */
const WishlistDrawer = () => {
  const location = useLocation();
  const { wishlist, wishlistOpen, closeWishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!wishlistOpen) return undefined;

    returnFocusRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') closeWishlist();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = originalOverflow;
      if (returnFocusRef.current instanceof HTMLElement) {
        returnFocusRef.current.focus();
      }
    };
  }, [wishlistOpen, closeWishlist]);

  const handleMoveToCart = (product) => {
    const isOutOfStock =
      (Number(product.stock) || 0) <= 0 &&
      (!Array.isArray(product.packages) ||
        product.packages.length === 0 ||
        product.packages.every((p) => (Number(p.stock) || 0) <= 0));

    if (isOutOfStock) {
      toast.error(`"${product.name}" is currently out of stock.`);
      return;
    }

    // Auto-select first in-stock variant package or base product
    const pkg =
      product.packages?.find((p) => (Number(p.stock) || 0) > 0) || product.packages?.[0] || null;
    const cartProduct = {
      ...product,
      price: pkg ? pkg.price : product.price,
      packageId: pkg?._id || null,
      selectedPackage: pkg ? { size: pkg.quantity, price: pkg.price } : null,
    };

    addToCart(cartProduct, 1);
    removeFromWishlist(product._id);
    toast.success(`Moved "${product.name}" to cart!`, { icon: '🛒' });
  };

  return (
    <AnimatePresence>
      {wishlistOpen && (
        <div
          className="fixed inset-0 z-[60] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-label="Your wishlist"
        >
          {/* Light dismiss backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeWishlist}
            aria-label="Close wishlist backdrop"
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px] cursor-pointer"
          />

          {/* Slide-over panel */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 flex h-full w-full max-w-[460px] flex-col bg-white shadow-2xl focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-white">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                <h2 className="font-serif text-[20px] font-bold text-slate-900">
                  Saved Items ({wishlist.length})
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {wishlist.length > 0 && (
                  <button
                    type="button"
                    onClick={clearWishlist}
                    className="text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors px-2 py-1 rounded"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeWishlist}
                  aria-label="Close wishlist"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Empty State */}
            {wishlist.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-1">
                  <Heart className="h-8 w-8 fill-rose-200 text-rose-400" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">Your wishlist is empty</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-xs">
                    Tap the heart on any seed variety or plant to save it for your upcoming garden.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeWishlist}
                  className="mt-2 inline-flex h-11 items-center rounded-full bg-[#0A4D3C] px-6 text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-[#07362b] transition-all"
                >
                  Explore Catalog
                </button>
              </div>
            ) : (
              /* Wishlist Items List */
              <div className="flex flex-col flex-1 overflow-hidden">
                <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto px-5 scrollbar-thin">
                  {wishlist.map((item) => {
                    const hasDiscount = item.originalPrice > item.price;
                    const discountPct = hasDiscount
                      ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                      : 0;
                    const isOutOfStock =
                      (Number(item.stock) || 0) <= 0 &&
                      (!Array.isArray(item.packages) ||
                        item.packages.length === 0 ||
                        item.packages.every((p) => (Number(p.stock) || 0) <= 0));

                    return (
                      <li key={item._id} className="flex gap-3 py-4 group">
                        {/* Thumbnail */}
                        <Link
                          to={`/product/${item._id}`}
                          state={{ from: location }}
                          onClick={closeWishlist}
                          className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-50 border border-slate-100 relative"
                        >
                          <img
                            src={getProductImageUrl(item)}
                            alt={item.name}
                            loading="lazy"
                            onError={(e) => handleImageError(e, DEFAULT_PRODUCT_IMAGE)}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {isOutOfStock ? (
                            <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              Out of Stock
                            </span>
                          ) : discountPct > 0 ? (
                            <span className="absolute top-1 left-1 bg-[#fed02f] text-[#0A4D3C] text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                              {discountPct}% OFF
                            </span>
                          ) : null}
                        </Link>

                        {/* Product Info & Action */}
                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to={`/product/${item._id}`}
                              state={{ from: location }}
                              onClick={closeWishlist}
                              className="block font-semibold text-sm text-slate-900 hover:text-[#0A4D3C] transition-colors truncate"
                            >
                              {item.name}
                            </Link>
                            <button
                              type="button"
                              onClick={() => removeFromWishlist(item._id)}
                              aria-label={`Remove ${item.name} from wishlist`}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-sm font-bold text-slate-900">
                              ₹{(item.price || 0).toLocaleString('en-IN')}
                            </span>
                            {hasDiscount && (
                              <s className="text-xs text-slate-400">
                                ₹{item.originalPrice?.toLocaleString('en-IN')}
                              </s>
                            )}
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                isOutOfStock
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-emerald-50 text-emerald-800'
                              }`}
                            >
                              {isOutOfStock ? 'Sold Out' : 'In Stock'}
                            </span>
                          </div>

                          {/* 1-Click Move to Cart CTA */}
                          <div className="mt-2.5">
                            <button
                              type="button"
                              disabled={isOutOfStock}
                              onClick={() => handleMoveToCart(item)}
                              className={`w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-bold transition-all shadow-xs ${
                                isOutOfStock
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                  : 'bg-[#0A4D3C] hover:bg-[#07362b] text-white active:scale-98 cursor-pointer'
                              }`}
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{isOutOfStock ? 'Temporarily Unavailable' : 'Move to Cart'}</span>
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Footer Navigation */}
                <div className="border-t border-slate-100 p-4 bg-slate-50/70">
                  <Link
                    to="/"
                    onClick={closeWishlist}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full border border-[#0A4D3C] text-[#0A4D3C] font-bold text-xs uppercase tracking-wider hover:bg-[#0A4D3C] hover:text-white transition-all shadow-xs"
                  >
                    <span>Browse More Seeds & Plants</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WishlistDrawer;
