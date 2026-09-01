import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartPopup, setCartPopup] = useState({ show: false, product: null });
  const [cartReady, setCartReady] = useState(false);
  const cartOwnerId = user?._id || null;
  // Ref to track the auto-hide timer — prevents stacked setTimeout calls
  const popupTimerRef = useRef(null);

  useEffect(() => {
    if (authLoading) return undefined;

    let cancelled = false;
    const hydrateCart = async () => {
      const storageKey = cartOwnerId ? `cart:${cartOwnerId}` : 'cart';
      let guestCart = [];
      let cachedAccountCart = [];
      try {
        guestCart = JSON.parse(localStorage.getItem('cart') || '[]');
        cachedAccountCart = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch {
        localStorage.removeItem('cart');
        localStorage.removeItem(storageKey);
      }

      if (!cartOwnerId) {
        if (!cancelled) {
          setCartItems(Array.isArray(guestCart) ? guestCart : []);
          setCartReady(true);
        }
        return;
      }

      try {
        const response = await api.get('/auth/cart');
        const accountCart = Array.isArray(response.data.data) ? response.data.data : [];
        const mergedCart = [...accountCart];
        (Array.isArray(guestCart) ? guestCart : []).forEach((savedItem) => {
          const existingItem = mergedCart.find(
            (item) => item._id === savedItem._id && item.isCombo === savedItem.isCombo
          );
          if (existingItem) existingItem.quantity += savedItem.quantity;
          else mergedCart.push(savedItem);
        });
        if (!cancelled) {
          setCartItems(mergedCart);
          setCartReady(true);
          localStorage.removeItem('cart');
          localStorage.setItem(storageKey, JSON.stringify(mergedCart));
          if (guestCart.length > 0) await api.put('/auth/cart', { cart: mergedCart });
        }
      } catch {
        if (!cancelled) {
          setCartItems(Array.isArray(cachedAccountCart) ? cachedAccountCart : []);
          setCartReady(true);
        }
      }
    };

    setCartReady(false);
    hydrateCart();
    return () => { cancelled = true; };
  }, [authLoading, cartOwnerId]);

  useEffect(() => {
    if (!cartReady) return;
    const storageKey = cartOwnerId ? `cart:${cartOwnerId}` : 'cart';
    localStorage.setItem(storageKey, JSON.stringify(cartItems));
    if (cartOwnerId) api.put('/auth/cart', { cart: cartItems }).catch(() => {});
  }, [cartItems, cartOwnerId, cartReady]);

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
