import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const DEFAULT_SETTINGS = {
  store: {
    name: 'Fresh Veggies',
    logo: '/logo.png',
    phone: '9876543210',
    email: 'contact@freshveggies.me',
    chatGreeting: 'Live Support Desk is Online',
    address: '123 Garden Street, Indore, Madhya Pradesh 452001',
    businessHours: '9:00 AM – 8:00 PM',
    trustPillars: {
      pillar1Title: '100% Non-GMO',
      pillar1Subtitle: 'Heirloom certified seeds',
      pillar2Title: 'Free Delivery',
      pillar2Subtitle: 'On all orders above ₹{threshold}',
      pillar3Title: 'High Germination',
      pillar3Subtitle: 'Tested & fresh batch',
      pillar4Title: 'Expert Support',
      pillar4Subtitle: 'Gardener help via Live Chat',
    },
  },
  delivery: {
    freeDeliveryThreshold: 499,
    deliveryCharge: 50,
    minOrderAmount: 100,
    codAvailable: true,
    codMaxOrder: 5000,
    deliveryTime: '3–5 Days',
  },
  orders: {
    allowCustomerCancellation: true,
    cancellationAllowedUntil: 'Before Shipped',
    autoCancelUnpaidOrders: true,
    unpaidOrderTimeoutMinutes: 30,
  },
  inventory: {
    lowStockThreshold: 10,
    showOnlyXLeft: true,
    allowBackorders: false,
    autoHideOutOfStock: false,
  },
  payments: {
    onlinePaymentEnabled: true,
    codEnabled: true,
    codMinOrder: 100,
    codMaxOrder: 5000,
    codExtraCharge: 0,
    onlineDiscountType: 'percentage',
    onlineDiscountValue: 0,
    onlineDiscountMaxLimit: 100,
  },
  maintenance: {
    isStoreClosed: false,
    closureNotice: 'Our storefront is currently closed for routine maintenance. Please check back shortly!',
    announcementBanner: {
      enabled: false,
      message: 'Free shipping on all garden orders over ₹500! Shop new harvest seeds now.',
      link: '/shop',
      type: 'info',
    },
  },
};

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: false,
  refreshSettings: async () => {},
  updateSettings: () => {},
});

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('fv_store_settings');
      return cached ? JSON.parse(cached) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      // Use timestamp query to prevent browser HTTP caching of public settings
      const res = await api.get(`/settings?_t=${Date.now()}`);
      if (res.data?.success && res.data.data) {
        setSettings(res.data.data);
        try {
          localStorage.setItem('fv_store_settings', JSON.stringify(res.data.data));
        } catch {}
      }
    } catch (err) {
      console.warn('Failed to fetch public store settings, using cached/defaults:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    // Listen for custom settings updated events from admin panel saves
    const handleSettingsUpdated = (e) => {
      if (e.detail?.settings) {
        setSettings(e.detail.settings);
        try {
          localStorage.setItem('fv_store_settings', JSON.stringify(e.detail.settings));
        } catch {}
      } else {
        fetchSettings();
      }
    };

    window.addEventListener('freshveggies:settings-updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('freshveggies:settings-updated', handleSettingsUpdated);
    };
  }, [fetchSettings]);

  useEffect(() => {
    if (settings?.store?.name) {
      const storeName = settings.store.name;
      if (!document.title.includes(storeName)) {
        document.title = `${storeName} — Fresh & Organic Garden Supplies`;
      }
    }
  }, [settings?.store?.name]);

  const updateSettings = useCallback((newSettings) => {
    setSettings((previous) => ({
      ...(previous || {}),
      ...(newSettings || {}),
    }));
    const mergedSettings = {
      ...(settings || {}),
      ...(newSettings || {}),
    };
    try {
      localStorage.setItem('fv_store_settings', JSON.stringify(mergedSettings));
    } catch {}
    window.dispatchEvent(new CustomEvent('freshveggies:settings-updated', { detail: { settings: mergedSettings } }));
  }, [settings]);

  const refreshSettings = useCallback(async () => {
    setLoading(true);
    await fetchSettings();
    setLoading(false);
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
