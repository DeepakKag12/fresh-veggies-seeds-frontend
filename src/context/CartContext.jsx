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


/**
 * Drop cart lines whose product or combo no longer exists.
 *
 * Returns the surviving items plus the names that were removed, so the caller
 * can tell the customer what happened instead of silently shrinking their cart.
 */
const pruneUnavailable = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return { kept: [], removed: [] };

  const checks = await Promise.all(
    items.map(async (item) => {
      const path = item.isCombo ? `/combos/${item._id}` : `/products/${item._id}`;
      try {
        const res = await api.get(path);
        return { item, ok: Boolean(res?.data?.data) };
      } catch (err) {
        // Only treat a definite "gone" as gone. A network blip or a 500 must
        // not wipe someone's cart.
        const status = err?.response?.status;
        return { item, ok: !(status === 404 || status === 400) };
      }
    })
  );

  return {
    kept: checks.filter((c) => c.ok).map((c) => c.item),
    removed: checks.filter((c) => !c.ok).map((c) => c.item.name || 'an item'),
  };
};

export const CartProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartPopup, setCartPopup] = useState({ show: false, product: null });
  // The cart now opens as a drawer that stays until dismissed, rather than a
  // toast that vanishes on a timer — people need time to read and adjust it.
  const [cartOpen, setCartOpen] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const [removedItems, setRemovedItems] = useState([]);
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
        const { kept, removed } = await pruneUnavailable(Array.isArray(guestCart) ? guestCart : []);
        if (!cancelled) {
          setCartItems(kept);
          if (removed.length) setRemovedItems(removed);
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
        const { kept, removed } = await pruneUnavailable(mergedCart);
        if (!cancelled) {
          setCartItems(kept);
          if (removed.length) setRemovedItems(removed);
          setCartReady(true);
          localStorage.removeItem('cart');
          localStorage.setItem(storageKey, JSON.stringify(kept));
          // Persist the pruned cart, otherwise the stale lines come straight
          // back on the next device or refresh.
          if (guestCart.length > 0 || removed.length) await api.put('/auth/cart', { cart: kept });
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
    const sameLine = (item) =>
      item._id === product._id &&
      item.isCombo === isCombo &&
      (item.packageId || null) === (product.packageId || null);

    const existingItem = cartItems.find(sameLine);

    if (existingItem) {
      setCartItems(
        cartItems.map((item) =>
          sameLine(item) ? { ...item, quantity: item.quantity + quantity } : item
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
    
    // Adding to the cart opens the drawer so the change is visible in context.
    setCartOpen(true);
  };

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  // A line is identified by product + combo flag + chosen pack, so operating on
  // one pack never disturbs another pack of the same product.
  const matches = (item, productId, isCombo, packageId) =>
    item._id === productId &&
    item.isCombo === isCombo &&
    (item.packageId || null) === (packageId || null);

  const removeFromCart = (productId, isCombo, packageId = null) => {
    setCartItems(cartItems.filter((item) => !matches(item, productId, isCombo, packageId)));
  };

  const updateQuantity = (productId, isCombo, quantity, packageId = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, isCombo, packageId);
    } else {
      setCartItems(
        cartItems.map((item) =>
          matches(item, productId, isCombo, packageId) ? { ...item, quantity } : item
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
    cartOpen,
    openCart,
    closeCart,
    // Consumers must not treat an un-hydrated cart as an empty one.
    cartReady,
    // Names of lines dropped because they no longer exist, so the UI can say so.
    removedItems,
    clearRemovedNotice: () => setRemovedItems([]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
