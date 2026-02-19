import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12">
        <div className="container mx-auto px-4 text-center">
          <ShoppingBag className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-700 mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your cart is empty
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Add some products to get started
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  const FREE_DELIVERY_THRESHOLD = 300;
  const total = getCartTotal();
  const shippingFee = total >= FREE_DELIVERY_THRESHOLD ? 0 : 50;
  const finalTotal = total + shippingFee;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-8">
          Shopping Cart
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={`${item._id}-${item.isCombo}`}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 lg:p-6"
              >
                <div className="flex gap-4">
                  <img
                    src={item.images?.[0] || 'https://via.placeholder.com/150'}
                    alt={item.name}
                    className="w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </h3>
                        {item.selectedPackage && (
                          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                            Package: {item.selectedPackage.size}
                          </p>
                        )}
                        {item.weight && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Weight: {item.weight}
                          </p>
                        )}
                        {item.isCombo && (
                          <span className="inline-block mt-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                            Combo Pack
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item._id, item.isCombo)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item._id, item.isCombo, item.quantity - 1)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-gray-900 dark:text-white px-2">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.isCombo, item.quantity + 1)}
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Order Summary
              </h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery</span>
                  {shippingFee === 0 ? (
                    <span className="font-semibold text-green-600 dark:text-green-400">FREE</span>
                  ) : (
                    <span className="font-semibold">₹{shippingFee}</span>
                  )}
                </div>
                {shippingFee === 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    🎉 You've unlocked free delivery!
                  </p>
                )}
                {shippingFee > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Add ₹{FREE_DELIVERY_THRESHOLD - total} more for free delivery
                  </p>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span className="text-green-600 dark:text-green-400">
                      ₹{finalTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className="block w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-center py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all mb-3"
              >
                Proceed to Checkout
              </Link>
              <Link
                to="/shop"
                className="block w-full border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-center py-4 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
