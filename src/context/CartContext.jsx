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
 * Drop cart lines whose product or combo no longer exists (genuine 404 only).
 */
const pruneUnavailable = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return { kept: [], removed: [] };

  const checks = await Promise.all(
    items.map(async (item) => {
      const id = item._id || item.productId || item.product || item.id;
      if (!id) return { item, ok: false };
      const path = item.isCombo ? `/combos/${id}` : `/products/${id}`;
      try {
        const res = await api.get(path);
        return { item: { ...item, _id: id }, ok: Boolean(res?.data?.data) };
      } catch (err) {
        const status = err?.response?.status;
        // ONLY drop if the backend explicitly reports 404 (product deleted)
        // If 400, 429, 500, or network offline, preserve the customer's item!
        return { item: { ...item, _id: id }, ok: status !== 404 };
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
    const idA = String(a._id || a.productId || a.product || a.id || '');
    const idB = String(b._id || b.productId || b.product || b.id || '');
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
      } catch {}
      try {
        cachedAccountCart = JSON.parse(localStorage.getItem(storageKey) || '[]');
      } catch {}

      const effectiveGuestCart = Array.isArray(guestCart) ? guestCart : [];

      // Guest user: restore local cart
      if (!cartOwnerId) {
        const { kept, removed } = await pruneUnavailable(effectiveGuestCart);
        if (!cancelled) {
          const finalKept = removed.length > 0 ? kept : effectiveGuestCart;
          setCartItems(finalKept);
          if (removed.length && kept.length > 0) setRemovedItems(removed);
          setCartReady(true);
          localStorage.setItem('cart', JSON.stringify(finalKept));
        }
        return;
      }

      // Authenticated user: Bidirectional Union Merge via server /api/auth/cart/sync
      try {
        let accountCart = [];
        let serverReadSucceeded = false;
        if (effectiveGuestCart.length > 0) {
          try {
            const syncRes = await api.put('/auth/cart/sync', { guestCart: effectiveGuestCart });
            accountCart = Array.isArray(syncRes?.data?.data) ? syncRes.data.data : [];
            serverReadSucceeded = true;
          } catch {
            serverReadSucceeded = false;
          }
        } else {
          try {
            const response = await api.get('/auth/cart');
            accountCart = Array.isArray(response?.data?.data) ? response.data.data : [];
            serverReadSucceeded = true;
          } catch {
            serverReadSucceeded = false;
          }
        }

        // Client-side safety fallback union merge: combine server cart, cached user cart, and effective guest cart
        const mergedCart = [...accountCart];
        const localSources = [
          ...(Array.isArray(cachedAccountCart) ? cachedAccountCart : []),
          ...(Array.isArray(effectiveGuestCart) ? effectiveGuestCart : []),
        ];

        localSources.forEach((savedItem) => {
          const existingItem = mergedCart.find((item) => sameCartLine(item, savedItem));
          if (existingItem) {
            existingItem.quantity = Math.max(Number(existingItem.quantity) || 1, Number(savedItem.quantity) || 1);
          } else {
            mergedCart.push(savedItem);
          }
        });

        // Ensure we never drop cart items if server returned empty
        const candidateCart = mergedCart.length > 0
          ? mergedCart
          : (effectiveGuestCart.length > 0 ? effectiveGuestCart : cachedAccountCart);

        const { kept, removed } = await pruneUnavailable(candidateCart);
        const finalItems = removed.length > 0 ? kept : candidateCart;

        if (!cancelled) {
          setCartItems(finalItems);
          if (removed.length && kept.length > 0) setRemovedItems(removed);
          setCartReady(true);
          // Persist authenticated carts only under the account-specific key.
          localStorage.setItem(storageKey, JSON.stringify(finalItems));
          localStorage.removeItem('cart');
          if (serverReadSucceeded) {
            api.put('/auth/cart', { cart: finalItems }).catch((error) => {
              toast.error(error.response?.data?.message || 'Unable to sync your cart');
            });
          } else {
            toast.error('Unable to load your saved cart. Your local cart is shown; retry before syncing.');
          }
        }
      } catch {
        if (!cancelled) {
          const fallback = effectiveGuestCart.length > 0
            ? effectiveGuestCart
            : (Array.isArray(cachedAccountCart) ? cachedAccountCart : []);
          setCartItems(fallback);
          setCartReady(true);
          localStorage.setItem(storageKey, JSON.stringify(fallback));
          if (!cartOwnerId) localStorage.setItem('cart', JSON.stringify(fallback));
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
    if (!cartOwnerId) localStorage.setItem('cart', JSON.stringify(cartItems));

    if (cartOwnerId) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        api.put('/auth/cart', { cart: cartItems }).catch((error) => {
          toast.error(error.response?.data?.message || 'Unable to sync your cart');
        });
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

    if (Number(maxStock) <= 0) {
      toast.error('This item is currently out of stock');
      if (existingItem) {
        setCartItems((prev) => prev.filter((item) => !sameLine(item)));
      }
      return;
    }

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
