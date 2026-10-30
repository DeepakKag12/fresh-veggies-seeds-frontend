import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import api from '../utils/api';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

/**
 * Nike / ASOS Benchmark:
 * Wishlist Drawer & Quick Toggle (FEAT-009)
 *
 * Provides:
 * - Instant heart micro-interaction with optimistic state
 * - Guest mode persistence in localStorage
 * - Seamless authenticated database synchronization via /api/auth/wishlist
 * - Direct move-to-cart integration with automatic wishlist removal
 */
export const WishlistProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('fv_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [wishlistReady, setWishlistReady] = useState(false);
  const userId = user?._id || null;
  const syncedUserId = useRef(null);

  // Hydrate & synchronize wishlist on auth state change
  useEffect(() => {
    if (authLoading) return undefined;

    let cancelled = false;
    const hydrateWishlist = async () => {
      const storageKey = userId ? `fv_wishlist:${userId}` : 'fv_wishlist';
      let guestList = [];
      try {
        const saved = localStorage.getItem('fv_wishlist');
        guestList = saved ? JSON.parse(saved) : [];
      } catch {
        guestList = [];
      }

      if (!userId) {
        if (!cancelled) {
          setWishlist(Array.isArray(guestList) ? guestList : []);
          syncedUserId.current = null;
          setWishlistReady(true);
        }
        return;
      }

      // User logged in: sync guest list to server once per login session
      try {
        let serverList = [];
        let savedAccountList = [];
        try {
          savedAccountList = JSON.parse(localStorage.getItem(storageKey) || '[]');
        } catch {
          savedAccountList = [];
        }
        if (Array.isArray(guestList) && guestList.length > 0 && syncedUserId.current !== userId) {
          const syncRes = await api.put('/auth/wishlist/sync', { guestWishlist: guestList });
          serverList = Array.isArray(syncRes.data?.data) ? syncRes.data.data : [];
          syncedUserId.current = userId;
        } else {
          const getRes = await api.get('/auth/wishlist');
          serverList = Array.isArray(getRes.data?.data) ? getRes.data.data : [];
        }

        if (!cancelled) {
          // Merge client-cached details with server populated data
          const merged = [...serverList, ...(Array.isArray(savedAccountList) ? savedAccountList : [])];
          const serverIdSet = new Set(serverList.map((i) => String(i._id)));

          const accountList = Array.isArray(savedAccountList) ? savedAccountList : [];
          [...guestList, ...accountList].forEach((gItem) => {
            if (!serverIdSet.has(String(gItem._id))) {
              if (!merged.some((item) => String(item._id) === String(gItem._id))) merged.push(gItem);
            }
          });

          setWishlist(merged);
          localStorage.setItem(storageKey, JSON.stringify(merged));
          localStorage.removeItem('fv_wishlist');
          setWishlistReady(true);
        }
      } catch {
        if (!cancelled) {
          setWishlist(Array.isArray(guestList) ? guestList : []);
          setWishlistReady(true);
        }
      }
    };

    hydrateWishlist();
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId]);

  // Persist to local storage whenever wishlist state changes
  useEffect(() => {
    if (!wishlistReady) return;
    try {
      const storageKey = userId ? `fv_wishlist:${userId}` : 'fv_wishlist';
      localStorage.setItem(storageKey, JSON.stringify(wishlist));
      if (!userId) localStorage.setItem('fv_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Failed to persist wishlist to localStorage', e);
    }
  }, [wishlist, wishlistReady, userId]);

  const isInWishlist = useCallback(
    (productId) => {
      const targetId = String(productId || '');
      return wishlist.some((item) => String(item._id) === targetId);
    },
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (product) => {
      if (!product || !product._id) return;
      const targetId = String(product._id);
      const exists = wishlist.some((item) => String(item._id) === targetId);

      if (exists) {
        // Optimistic remove
        setWishlist((prev) => prev.filter((item) => String(item._id) !== targetId));
        toast.success(`Removed "${product.name}" from wishlist`, { icon: '🤍' });
        if (userId) {
          api.delete(`/auth/wishlist/${targetId}`).catch((error) => {
            setWishlist((prev) => [...prev, product]);
            toast.error(error.response?.data?.message || 'Unable to update wishlist');
          });
        }
      } else {
        // Optimistic add
        setWishlist((prev) => [...prev, product]);
        toast.success(`Saved "${product.name}" to wishlist`, { icon: '❤️' });
        if (userId) {
          api.post(`/auth/wishlist/${targetId}`).catch((error) => {
            setWishlist((prev) => prev.filter((item) => String(item._id) !== targetId));
            toast.error(error.response?.data?.message || 'Unable to update wishlist');
          });
        }
      }
    },
    [wishlist, userId]
  );

  const removeFromWishlist = useCallback(
    (productId) => {
      const targetId = String(productId || '');
      setWishlist((prev) => prev.filter((item) => String(item._id) !== targetId));
      if (userId) {
        api.delete(`/auth/wishlist/${targetId}`).catch((error) => {
          toast.error(error.response?.data?.message || 'Unable to remove wishlist item');
        });
      }
    },
    [userId]
  );

  const clearWishlist = useCallback(() => {
    setWishlist([]);
    localStorage.removeItem('fv_wishlist');
    toast.success('Wishlist cleared');
    if (userId) {
      api.delete('/auth/wishlist').catch((error) => {
        toast.error(error.response?.data?.message || 'Unable to clear wishlist');
      });
    }
  }, [userId]);

  const openWishlist = () => setWishlistOpen(true);
  const closeWishlist = () => setWishlistOpen(false);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        wishlistOpen,
        openWishlist,
        closeWishlist,
        wishlistReady,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};
