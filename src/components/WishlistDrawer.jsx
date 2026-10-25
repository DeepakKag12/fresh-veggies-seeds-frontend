import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Trash2, Heart, ShoppingBag, Sprout, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const WishlistDrawer = () => {
  const location = useLocation();
  const { wishlist, wishlistOpen, closeWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!wishlistOpen) return undefined;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape') closeWishlist();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [wishlistOpen, closeWishlist]);

  if (!wishlistOpen) return null;

  const handleMoveToCart = (product) => {
    // If product has packages, select the first available or default package
    const pkg = product.packages?.find((p) => p.stock > 0) || product.packages?.[0] || null;
    const cartProduct = {
      ...product,
      price: pkg ? pkg.price : product.price,
      packageId: pkg?._id || null,
      selectedPackage: pkg ? { size: pkg.quantity, price: pkg.price } : null,
    };
    addToCart(cartProduct, 1);
    removeFromWishlist(product._id);
  };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Your wishlist">
      <button
        type="button"
        aria-label="Close wishlist"
        onClick={closeWishlist}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl
                   focus:outline-none animate-fv-slide-in motion-reduce:animate-none"
      >
        <div className="flex items-center justify-between border-b border-fv-border px-5 py-4 bg-gradient-to-r from-emerald-50/50 to-white">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            <h2 className="font-serif text-[22px] font-semibold text-fv-heading">
              My Wishlist ({wishlist.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={closeWishlist}
            aria-label="Close wishlist"
            className="flex h-10 w-10 items-center justify-center rounded-full text-fv-heading hover:bg-fv-surface
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {wishlist.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center text-fv-primary">
              <Heart className="h-8 w-8 text-fv-primary/40" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[17px] font-semibold text-fv-heading">Your wishlist is empty</p>
              <p className="text-[14px] text-fv-muted mt-1">Explore our high-germination seeds and save your favorites!</p>
            </div>
            <button
              type="button"
              onClick={closeWishlist}
              className="inline-flex h-11 items-center rounded-full bg-fv-primary px-6 text-[14px] font-semibold text-white hover:bg-fv-primary-dark transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
            >
              Start Exploring
            </button>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            <ul className="flex-1 divide-y divide-fv-border overflow-y-auto px-5 py-2">
              {wishlist.map((item) => {
                const hasDiscount = item.originalPrice > item.price;
                const discountPct = hasDiscount ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
                return (
                  <li key={item._id} className="flex gap-3 py-4 group">
                    <Link
                      to={`/product/${item._id}`}
                      state={{ from: location }}
                      onClick={closeWishlist}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-[12px] bg-fv-surface border border-fv-border/50 relative"
                    >
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Sprout className="m-auto mt-6 h-7 w-7 text-fv-primary/25" aria-hidden="true" />
                      )}
                      {discountPct > 0 && (
                        <span className="absolute top-1 left-1 bg-[#fed02f] text-[#0a4c36] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {discountPct}% OFF
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to={`/product/${item._id}`}
                          state={{ from: location }}
                          onClick={closeWishlist}
                          className="block font-semibold text-[15px] text-fv-heading hover:text-fv-primary transition-colors truncate"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(item._id)}
                          aria-label={`Remove ${item.name} from wishlist`}
                          className="text-fv-muted hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-[16px] font-bold text-fv-primary">
                          ₹{item.price?.toLocaleString('en-IN')}
                        </span>
                        {hasDiscount && (
                          <span className="text-[12px] text-gray-400 line-through">
                            ₹{item.originalPrice?.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <div className="mt-2.5">
                        <button
                          type="button"
                          onClick={() => handleMoveToCart(item)}
                          className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-lg bg-fv-primary hover:bg-fv-primary-dark text-white text-[12px] font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Move to Cart</span>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-fv-border p-4 bg-gray-50/70">
              <Link
                to="/"
                onClick={closeWishlist}
                className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-full border border-fv-primary text-fv-primary font-semibold text-[14px] hover:bg-fv-primary hover:text-white transition-all shadow-xs"
              >
                <span>Browse More Gardening Seeds</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistDrawer;
