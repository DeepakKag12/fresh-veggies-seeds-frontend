import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartPopup, setCartPopup] = useState({ show: false, product: null });
  // Ref to track the auto-hide timer — prevents stacked setTimeout calls
  const popupTimerRef = useRef(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, isCombo = false) => {
    const existingItem = cartItems.find(
      (item) => item._id === product._id && item.isCombo === isCombo
    );

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          item._id === product._id && item.isCombo === isCombo
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCartItems([
        ...cartItems,
        {
          ...product,
          quantity,
          isCombo,
        },
      ]);
    }
    
    // Show popup notification — clear any existing timer first to prevent stacking
    if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    setCartPopup({ show: true, product });
    popupTimerRef.current = setTimeout(() => {
      setCartPopup({ show: false, product: null });
      popupTimerRef.current = null;
    }, 3000);
  };

  const removeFromCart = (productId, isCombo) => {
    setCartItems(
      cartItems.filter(
        (item) => !(item._id === productId && item.isCombo === isCombo)
      )
    );
  };

  const updateQuantity = (productId, isCombo, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, isCombo);
    } else {
      setCartItems(
        cartItems.map((item) =>
          item._id === productId && item.isCombo === isCombo
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Clear timer and hide popup immediately (used on route changes and manual close)
  const hideCartPopup = () => {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
    setCartPopup({ show: false, product: null });
  };

  const value = {
    cartItems,
    cart: cartItems, // alias for compatibility
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    cartPopup,
    hideCartPopup,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
