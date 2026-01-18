import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartPopup = () => {
  const { cartPopup, hideCartPopup, getCartCount } = useCart();
  
  // Force fresh deployment
  const deploymentVersion = '2.0.1';

  return (
    <AnimatePresence>
      {cartPopup.show && cartPopup.product && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-green-500 px-4 py-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">Added to Cart!</span>
              <button 
                onClick={hideCartPopup}
                className="ml-auto text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Product Info */}
            <div className="p-4 flex gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                {cartPopup.product.images?.[0] ? (
                  <img 
                    src={cartPopup.product.images[0]} 
                    alt={cartPopup.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {cartPopup.product.name}
                </h4>
                <p className="text-green-600 font-bold text-lg">
                  ₹{cartPopup.product.price}
                </p>
              </div>
            </div>
            
            {/* Actions */}
            <div className="px-4 pb-4 flex gap-3">
              <button
                onClick={hideCartPopup}
                className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Continue Shopping
              </button>
              <Link
                to="/cart"
                onClick={hideCartPopup}
                className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                Cart ({getCartCount()})
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartPopup;
