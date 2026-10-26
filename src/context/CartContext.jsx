import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
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
  const [cartOpen, setCartOpen] = useState(false);
  const [cartReady, setCartReady] = useState(false);
  const [removedItems, setRemovedItems] = useState([]);
  const cartOwnerId = user?._id || null;
  const popupTimerRef = useRef(null);
  const syncTimeoutRef = useRef(null);

  const sameCartLine = useCallback((a, b) => {
    const idA = String(a._id || a.productId || a.product || '');
    const idB = String(b._id || b.productId || b.product || '');
    const comboA = Boolean(a.isCombo);
    const comboB = Boolean(b.isCombo);
    const packA = String(a.packageId || a.selectedPackage?._id || a.selectedPackage?.size || '');
    const packB = String(b.packageId || b.selectedPackage?._id || b.selectedPackage?.size || '');
    return idA === idB && comboA === comboB && packA === packB;
  }, []);

  // Hydrate cart on mount or auth change
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

      // Guest user: restore local cart
      if (!cartOwnerId) {
        const { kept, removed } = await pruneUnavailable(Array.isArray(guestCart) ? guestCart : []);
        if (!cancelled) {
          setCartItems(kept);
          if (removed.length) setRemovedItems(removed);
          setCartReady(true);
        }
        return;
      }

      // Authenticated user: Bidirectional Union Merge via server /api/auth/cart/sync
      try {
        let accountCart = [];
        if (Array.isArray(guestCart) && guestCart.length > 0) {
          const syncRes = await api.put('/auth/cart/sync', { guestCart });
          accountCart = Array.isArray(syncRes?.data?.data) ? syncRes.data.data : [];
        } else {
          const response = await api.get('/auth/cart');
          accountCart = Array.isArray(response?.data?.data) ? response.data.data : [];
        }

        // Client-side safety fallback union merge
        const mergedCart = [...accountCart];
        (Array.isArray(guestCart) ? guestCart : []).forEach((savedItem) => {
          const existingItem = mergedCart.find((item) => sameCartLine(item, savedItem));
          if (existingItem) {
            existingItem.quantity = Math.max(Number(existingItem.quantity) || 1, Number(savedItem.quantity) || 1);
          } else {
            mergedCart.push(savedItem);
          }
        });

        const { kept, removed } = await pruneUnavailable(mergedCart);
        if (!cancelled) {
          setCartItems(kept);
          if (removed.length) setRemovedItems(removed);
          setCartReady(true);
          // Clean guest cart and update account storage
          localStorage.removeItem('cart');
          localStorage.setItem(storageKey, JSON.stringify(kept));
          if (guestCart.length > 0 || removed.length) {
            await api.put('/auth/cart', { cart: kept }).catch(() => {});
          }
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
  }, [authLoading, cartOwnerId, sameCartLine]);

  // Persist cart to localStorage and debounced server sync (500ms)
  useEffect(() => {
    if (!cartReady) return;
    const storageKey = cartOwnerId ? `cart:${cartOwnerId}` : 'cart';
    localStorage.setItem(storageKey, JSON.stringify(cartItems));

    if (cartOwnerId) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        api.put('/auth/cart', { cart: cartItems }).catch(() => {});
      }, 500);
    }

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [cartItems, cartOwnerId, cartReady]);

  const matches = useCallback((item, productId, isCombo, packageId) => {
    const idA = String(item._id || item.productId || item.product || '');
    const idB = String(productId || '');
    return (
      idA === idB &&
      Boolean(item.isCombo) === Boolean(isCombo) &&
      (item.packageId || null) === (packageId || null)
    );
  }, []);

  const addToCart = (product, quantity = 1, isCombo = false) => {
    const sameLine = (item) => matches(item, product._id, isCombo, product.packageId);
    const existingItem = cartItems.find(sameLine);
    const maxStock = product.stock !== undefined ? product.stock : (existingItem?.stock ?? 99);

    if (existingItem) {
      const targetQty = existingItem.quantity + quantity;
      if (product.stock !== undefined && targetQty > maxStock) {
        toast.error(`Only ${maxStock} packets available in stock`);
      }
      const finalQty = Math.min(targetQty, maxStock);
      setCartItems(
        cartItems.map((item) =>
          sameLine(item) ? { ...item, quantity: finalQty, stock: product.stock ?? item.stock } : item
        )
      );
    } else {
      if (product.stock !== undefined && quantity > maxStock) {
        toast.error(`Only ${maxStock} packets available in stock`);
      }
      const initialQty = Math.min(quantity, maxStock);
      setCartItems([
        ...cartItems,
        {
          ...product,
          quantity: initialQty,
          isCombo,
        },
      ]);
    }
    
    // Automatically open slide-over drawer
    setCartOpen(true);
  };

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  const removeFromCart = (productId, isCombo, packageId = null) => {
    const itemToRemove = cartItems.find((item) => matches(item, productId, isCombo, packageId));
    if (itemToRemove) {
      toast((t) => (
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-slate-800">Removed {itemToRemove.name}</span>
          <button
            type="button"
            onClick={() => {
              setCartItems((prev) => [...prev, itemToRemove]);
              toast.dismiss(t.id);
            }}
            className="rounded bg-[#0A4D3C] px-2 py-0.5 text-xs font-semibold text-white hover:bg-[#07362b] transition-colors"
          >
            Undo
          </button>
        </div>
      ), { duration: 4000 });
    }
    setCartItems((prev) => prev.filter((item) => !matches(item, productId, isCombo, packageId)));
  };

  const updateQuantity = (productId, isCombo, quantity, packageId = null) => {
    if (quantity <= 0) {
      removeFromCart(productId, isCombo, packageId);
    } else {
      const targetItem = cartItems.find((item) => matches(item, productId, isCombo, packageId));
      const maxStock = targetItem?.stock !== undefined ? targetItem.stock : 99;

      if (targetItem?.stock !== undefined && quantity > maxStock) {
        toast.error(`Only ${maxStock} packets available in stock`);
        return;
      }

      setCartItems((prev) =>
        prev.map((item) => {
          if (!matches(item, productId, isCombo, packageId)) return item;
          const cappedQty = Math.max(1, Math.min(quantity, maxStock));
          return { ...item, quantity: cappedQty };
        })
      );
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0);
  };

  const getCartCount = () => {
    return cartItems.reduce((count, item) => count + (item.quantity || 1), 0);
  };

  const hideCartPopup = () => {
    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
      popupTimerRef.current = null;
    }
    setCartPopup({ show: false, product: null });
  };

  const value = {
    cartItems,
    cart: cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setCartItems,
    replaceCart: (newItems) => setCartItems(newItems),
    getCartTotal,
    getCartCount,
    cartPopup,
    hideCartPopup,
    cartOpen,
    openCart,
    closeCart,
    cartReady,
    removedItems,
    clearRemovedNotice: () => setRemovedItems([]),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
