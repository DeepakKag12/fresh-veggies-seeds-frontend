import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, Minus, Plus, Sprout, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

/**
 * Slide-in cart. Opens whenever something is added, and from the header icon.
 *
 * It is a real modal dialog: Escape closes it, focus moves in on open and
 * returns to whatever opened it on close, background scrolling is locked, and
 * the rest of the page is hidden from assistive tech while it is open.
 */
const CartDrawer = () => {
  const { cartItems, cartOpen, closeCart, updateQuantity, removeFromCart, getCartTotal,
          removedItems, clearRemovedNotice } = useCart();
  const { settings } = useSettings();
  const panelRef = useRef(null);
  const returnFocusRef = useRef(null);
  const freeDeliveryThreshold = settings?.delivery?.freeDeliveryThreshold ?? 300;

  useEffect(() => {
    if (!cartOpen) return undefined;

    returnFocusRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKey = (e) => { if (e.key === 'Escape') closeCart(); };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      // Send focus back where it came from, so keyboard users are not dumped
      // at the top of the document.
      if (returnFocusRef.current instanceof HTMLElement) returnFocusRef.current.focus();
    };
  }, [cartOpen, closeCart]);

  if (!cartOpen) return null;

  const subtotal = getCartTotal();
  const shortfall = Math.max(0, freeDeliveryThreshold - subtotal);
  const progress = shortfall === 0 ? 100 : Math.min(99, Math.floor((subtotal / freeDeliveryThreshold) * 100));

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Your cart">
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl
                   focus:outline-none animate-[fv-slide-in_240ms_ease-out] motion-reduce:animate-none"
      >
        <style>{`@keyframes fv-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        <div className="flex items-center justify-between border-b border-fv-border px-5 py-4">
          <h2 className="font-serif text-[22px] font-semibold text-fv-heading">Cart</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="flex h-11 w-11 items-center justify-center rounded-full text-fv-heading hover:bg-fv-surface
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Lines dropped because the product no longer exists. Saying so beats
            a cart that silently shrank, or a checkout that refuses with no
            explanation. */}
        {removedItems?.length > 0 && (
          <p role="status" className="flex items-start justify-between gap-3 border-b border-fv-border bg-fv-cream px-5 py-3 text-[13px] text-fv-ink">
            <span>
              Removed {removedItems.length === 1 ? '1 item' : `${removedItems.length} items`} that
              {removedItems.length === 1 ? ' is' : ' are'} no longer available: {removedItems.join(', ')}.
            </span>
            <button type="button" onClick={clearRemovedNotice} aria-label="Dismiss"
                    className="shrink-0 font-medium text-fv-primary hover:underline">Dismiss</button>
          </p>
        )}

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingBag className="h-12 w-12 text-fv-primary/25" aria-hidden="true" />
            <p className="text-[16px] font-medium text-fv-heading">Your cart is empty</p>
            <button
              type="button"
              onClick={closeCart}
              className="inline-flex h-12 items-center rounded-[50px] bg-fv-primary px-6 text-[15px] font-semibold text-white hover:bg-fv-primary-dark"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            {/* Free-delivery progress, using the same ₹300 rule as the server. */}
            <div className="border-b border-fv-border px-5 py-4">
              <p className="text-[14px] text-fv-ink">
                {shortfall > 0
                  ? <>Add <strong>₹{shortfall.toLocaleString('en-IN')}</strong> more for free delivery</>
                  : <>You&apos;ve unlocked <strong>free delivery</strong> on this order</>}
              </p>
              <span
                className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-fv-border"
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress towards free delivery"
              >
                <span className="block h-full rounded-full bg-fv-accent transition-[width] duration-300 motion-reduce:transition-none"
                      style={{ width: `${progress}%` }} />
              </span>
            </div>

            <ul className="flex-1 divide-y divide-fv-border overflow-y-auto px-5">
              {cartItems.map((item) => (
                <li key={`${item._id}-${item.packageId || 'base'}-${item.isCombo}`} className="flex gap-3 py-4">
                  <span className="h-20 w-20 shrink-0 overflow-hidden rounded-[10px] bg-fv-surface">
                    {item.images?.[0]
                      ? <img src={item.images[0]} alt="" loading="lazy"
                             onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                             className="h-full w-full object-cover" />
                      : <Sprout className="m-auto mt-6 h-7 w-7 text-fv-primary/25" aria-hidden="true" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0">
                        <Link to={`/product/${item._id}`} onClick={closeCart}
                              className="block truncate text-[15px] font-medium text-fv-heading hover:underline">
                          {item.name}
                        </Link>
                        {item.selectedPackage?.size && (
                          <span className="block text-[13px] text-fv-muted">{item.selectedPackage.size}</span>
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item._id, item.isCombo, item.packageId)}
                        aria-label={`Remove ${item.name} from cart`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-fv-muted
                                   hover:bg-fv-surface hover:text-fv-danger focus-visible:outline-none
                                   focus-visible:ring-2 focus-visible:ring-fv-danger"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <p className="flex items-baseline gap-1.5">
                        <span className="text-[15px] font-semibold text-fv-deep">₹{item.price?.toLocaleString('en-IN')}</span>
                        {item.originalPrice > item.price && (
                          <s className="text-[13px] text-fv-muted">₹{item.originalPrice.toLocaleString('en-IN')}</s>
                        )}
                      </p>

                      <span className="flex items-center rounded-[50px] border border-fv-border">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item._id, item.isCombo, item.quantity - 1, item.packageId)}
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="flex h-10 w-10 items-center justify-center rounded-l-[50px] text-fv-primary
                                     hover:bg-fv-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary active:bg-fv-surface"
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-[14px] font-medium" aria-live="polite">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item._id, item.isCombo, item.quantity + 1, item.packageId)}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="flex h-10 w-10 items-center justify-center rounded-r-[50px] text-fv-primary
                                     hover:bg-fv-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary active:bg-fv-surface"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-fv-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
              <p className="flex items-baseline justify-between">
                <span className="text-[20px] font-semibold text-fv-deep">₹{subtotal.toLocaleString('en-IN')}</span>
                <span className="text-[13px] text-fv-muted">Inclusive of all taxes</span>
              </p>
              <Link
                to="/checkout"
                onClick={closeCart}
                className="mt-3 flex h-12 w-full items-center justify-center rounded-[50px] bg-fv-primary
                           text-[15px] font-semibold uppercase tracking-wide text-white hover:bg-fv-primary-dark
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary focus-visible:ring-offset-2 active:scale-[0.99]"
              >
                Checkout
              </Link>
              <button
                type="button"
                onClick={closeCart}
                className="mt-2 flex h-11 w-full items-center justify-center rounded-[50px] text-[14px] font-medium text-fv-primary hover:bg-fv-surface
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
              >
                Continue shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
