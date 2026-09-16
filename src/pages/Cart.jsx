import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, removedItems, clearRemovedNotice } = useCart();
  const { settings } = useSettings();

  const deliveryRules = {
    freeDeliveryThreshold: settings?.delivery?.freeDeliveryThreshold ?? 300,
    deliveryCharge: settings?.delivery?.deliveryCharge ?? 50,
  };

  // Shown in both the empty and populated branches: a shrunken cart needs an
  // explanation either way.
  const removedNotice = removedItems?.length > 0 ? (
    <p role="status" className="mb-4 flex items-start justify-between gap-3 rounded-[12px] bg-fv-cream px-4 py-3 text-[14px] text-fv-ink">
      <span>
        Removed {removedItems.length === 1 ? '1 item' : `${removedItems.length} items`} that
        {removedItems.length === 1 ? ' is' : ' are'} no longer available: {removedItems.join(', ')}.
      </span>
      <button type="button" onClick={clearRemovedNotice}
              className="shrink-0 font-medium text-fv-primary hover:underline">Dismiss</button>
    </p>
  ) : null;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-fv-page pt-24 pb-12">
        {removedNotice}
        <div className="container mx-auto px-4 text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 dark:text-fv-ink mb-6" />
          <h2 className="text-3xl font-bold text-fv-heading  mb-4">
            Your cart is empty
          </h2>
          <p className="text-fv-muted  mb-8">
            Add some products to get started
          </p>
          <Link
            to="/"
           className="inline-flex items-center gap-2 bg-fv-primary hover:bg-fv-primary-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  const total = getCartTotal();
  const shippingFee = total >= deliveryRules.freeDeliveryThreshold ? 0 : deliveryRules.deliveryCharge;
  const finalTotal = total + shippingFee;

  return (
    <div className="min-h-screen bg-fv-page pt-20 pb-28">
        {removedNotice}
      <div className="container mx-auto px-3 sm:px-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-fv-heading mb-6">
          Shopping Cart
        </h1>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {cartItems.map((item) => (
              <div
                key={`${item._id}-${item.isCombo}`}
                className="bg-white rounded-[16px] p-3.5 sm:p-4 lg:p-6 border border-fv-border shadow-xs"
              >
                <div className="flex gap-3 sm:gap-4">
                  <img
                    src={item.images?.[0] || 'https://via.placeholder.com/150'}
                    alt={item.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 object-cover rounded-xl shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-fv-heading truncate">
                          {item.name}
                        </h3>
                        {item.selectedPackage && (
                          <p className="text-xs sm:text-sm text-fv-primary dark:text-green-400 font-medium mt-0.5">
                            Package: {item.selectedPackage.size}
                          </p>
                        )}
                        {item.weight && (
                          <p className="text-xs sm:text-sm text-fv-muted">
                            Weight: {item.weight}
                          </p>
                        )}
                        {item.isCombo && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[11px] rounded-full font-medium">
                            Combo Pack
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id, item.isCombo, item.packageId)}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 sm:mt-4 pt-1">
                      <div className="flex items-center gap-2 bg-fv-surface rounded-xl p-0.5">
                        <button
                          onClick={() => updateQuantity(item._id, item.isCombo, item.quantity - 1, item.packageId)}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-white rounded-lg transition-all active:scale-95 text-fv-heading"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <span className="font-semibold text-fv-heading text-sm sm:text-base px-2 min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.isCombo, item.quantity + 1, item.packageId)}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-white rounded-lg transition-all active:scale-95 text-fv-heading"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-lg sm:text-2xl font-bold text-fv-primary dark:text-green-400">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <p className="text-[11px] sm:text-sm text-fv-muted">
                          ₹{item.price} each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-[16px] border border-fv-border p-4 sm:p-6 sticky top-24 shadow-xs">
              <h2 className="text-lg sm:text-xl font-bold text-fv-heading mb-4 sm:mb-6">
                Order Summary
              </h2>
              
              <div className="space-y-3 sm:space-y-4 mb-6">
                <div className="flex justify-between text-sm sm:text-base text-fv-muted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-fv-heading">₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base text-fv-muted">
                  <span>Delivery</span>
                  {shippingFee === 0 ? (
                    <span className="font-semibold text-fv-primary dark:text-green-400">FREE</span>
                  ) : (
                    <span className="font-semibold text-fv-heading">₹{shippingFee}</span>
                  )}
                </div>
                {shippingFee === 0 && (
                  <p className="text-xs text-fv-primary dark:text-green-400 font-medium">
                    🎉 You've unlocked free delivery!
                  </p>
                )}
                {shippingFee > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Add ₹{deliveryRules.freeDeliveryThreshold - total} more for free delivery
                  </p>
                )}
                <div className="border-t border-fv-border pt-4">
                  <div className="flex justify-between text-lg sm:text-xl font-bold text-fv-heading">
                    <span>Total</span>
                    <span className="text-fv-primary dark:text-green-400">
                      ₹{finalTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full bg-fv-primary hover:bg-fv-primary-dark active:scale-[0.99] text-white text-center py-3.5 sm:py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all mb-3 text-sm sm:text-base"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/"
                className="block w-full border border-fv-border text-fv-heading text-center py-3 sm:py-3.5 rounded-xl font-semibold hover:bg-fv-surface active:scale-[0.99] transition-all text-sm sm:text-base"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
