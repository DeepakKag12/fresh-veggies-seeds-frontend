import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Store,
  Truck,
  Package,
  Boxes,
  CreditCard,
  Bell,
  ShieldAlert,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Loader2,
  Info
} from 'lucide-react';
import api from '../../utils/api';

const SECTIONS = [
  { id: 'store', label: 'Store', icon: Store, description: 'Basic business details & contact information' },
  { id: 'delivery', label: 'Delivery', icon: Truck, description: 'Shipping fees, free delivery rules & COD limits' },
  { id: 'orders', label: 'Orders', icon: Package, description: 'Cancellation cutoffs, auto-cancel timers & order rules' },
  { id: 'inventory', label: 'Inventory', icon: Boxes, description: 'Low stock alerts & out-of-stock visibility' },
  { id: 'payments', label: 'Payments', icon: CreditCard, description: 'Payment method switches & basic COD limits' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Email and WhatsApp alert toggles' },
  { id: 'advanced', label: 'Advanced', icon: ShieldAlert, description: 'System status & developer configuration', isSuperAdminOnly: true },
];

export default function AdminSettings() {
  const [activeSection, setActiveSection] = useState('store');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [advancedInfo, setAdvancedInfo] = useState(null);

  // Warning modal state
  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  // Reset confirmation modal state
  const [resetModal, setResetModal] = useState({
    isOpen: false,
    section: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/settings/admin');
      if (res.data?.success) {
        setSettings(res.data.data.settings);
        setAdvancedInfo(res.data.data.advanced);
      }
    } catch (err) {
      toast.error('Failed to load settings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleNotificationChange = (audience, eventKey, channel, value) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [audience]: {
          ...prev.notifications[audience],
          [eventKey]: {
            ...prev.notifications[audience][eventKey],
            [channel]: value,
          },
        },
      },
    }));
  };

  const executeSave = async (sectionName) => {
    setSaving(true);
    try {
      const payload = sectionName === 'all' ? settings : settings[sectionName];
      const res = await api.put(`/settings/admin/${sectionName}`, payload);
      if (res.data?.success) {
        toast.success(`✅ ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)} settings saved successfully!`);
        setSettings(res.data.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
      setWarningModal({ isOpen: false, title: '', message: '', onConfirm: null });
    }
  };

  const promptSave = (sectionName) => {
    if (sectionName === 'delivery') {
      setWarningModal({
        isOpen: true,
        title: 'Update Delivery Settings?',
        message: 'Changing the delivery charge or free delivery threshold will immediately affect all new orders.',
        onConfirm: () => executeSave(sectionName),
      });
      return;
    }

    if (sectionName === 'payments') {
      setWarningModal({
        isOpen: true,
        title: 'Update Payment Methods?',
        message: 'Disabling a payment method (like COD or Online Payments) will hide it from customers at checkout.',
        onConfirm: () => executeSave(sectionName),
      });
      return;
    }

    executeSave(sectionName);
  };

  const executeReset = async (sectionName) => {
    setSaving(true);
    try {
      const res = await api.post(`/settings/admin/reset/${sectionName}`);
      if (res.data?.success) {
        toast.success(`Reset ${sectionName} settings to defaults!`);
        setSettings(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to reset settings.');
    } finally {
      setSaving(false);
      setResetModal({ isOpen: false, section: '' });
    }
  };

  if (loading || !settings) {
    return (
      <div className="min-h-screen bg-fv-page flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-fv-primary animate-spin mb-4" />
        <p className="text-fv-heading font-medium">Loading Store Settings…</p>
      </div>
    );
  }

  const isSuperAdmin = Boolean(advancedInfo?.isSuperAdmin);

  return (
    <div className="min-h-screen bg-fv-page py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-fv-heading font-serif">Store Settings</h1>
          <p className="text-sm text-fv-muted mt-1">
            Manage business details, shipping fees, orders, inventory alerts, and payment methods easily.
          </p>
        </div>

        {/* Layout Grid: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 border border-fv-border shadow-sm space-y-1 sticky top-20">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;

              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all font-medium text-sm ${
                    isActive
                      ? 'bg-fv-primary text-white shadow-md shadow-fv-primary/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-fv-cream dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-fv-primary'}`} />
                    <span>{sec.label}</span>
                  </div>
                  {sec.isSuperAdminOnly && (
                    <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-fv-surface text-fv-muted border border-fv-border'
                    }`}>
                      <Lock className="w-3 h-3" />
                      Super
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Main Content Area */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 border border-fv-border shadow-sm">
            {/* 1. STORE SECTION */}
            {activeSection === 'store' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-fv-heading flex items-center gap-2">
                    <Store className="w-6 h-6 text-fv-primary" /> Store Information
                  </h2>
                  <p className="text-sm text-fv-muted mt-1">
                    Basic information about your business shown to customers across invoices, receipts, and contact channels.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-fv-muted mb-1.5">
                      Store Name
                    </label>
                    <input
                      type="text"
                      value={settings.store?.name || ''}
                      onChange={(e) => handleFieldChange('store', 'name', e.target.value)}
                      placeholder="e.g. Fresh Veggies"
                      className="w-full px-4 py-2.5 rounded-xl border border-fv-border bg-fv-page text-fv-heading focus:ring-2 focus:ring-fv-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-fv-muted mb-1.5">
                      Store Logo URL
                    </label>
                    <input
                      type="text"
                      value={settings.store?.logo || ''}
                      onChange={(e) => handleFieldChange('store', 'logo', e.target.value)}
                      placeholder="/logo.png"
                      className="w-full px-4 py-2.5 rounded-xl border border-fv-border bg-fv-page text-fv-heading focus:ring-2 focus:ring-fv-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-fv-muted mb-1.5">
                      Support Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-fv-muted absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={settings.store?.phone || ''}
                        onChange={(e) => handleFieldChange('store', 'phone', e.target.value)}
                        placeholder="9876543210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-fv-border bg-fv-page text-fv-heading focus:ring-2 focus:ring-fv-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-fv-muted mb-1.5">
                      Support Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-fv-muted absolute left-3.5 top-3.5" />
                      <input
                        type="email"
                        value={settings.store?.email || ''}
                        onChange={(e) => handleFieldChange('store', 'email', e.target.value)}
                        placeholder="contact@freshveggies.me"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-fv-border bg-fv-page text-fv-heading focus:ring-2 focus:ring-fv-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-fv-muted mb-1.5">
                      WhatsApp Support Number
                    </label>
                    <div className="relative">
                      <MessageCircle className="w-4 h-4 text-green-600 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={settings.store?.whatsappNumber || ''}
                        onChange={(e) => handleFieldChange('store', 'whatsappNumber', e.target.value)}
                        placeholder="9876543210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-fv-border bg-fv-page text-fv-heading focus:ring-2 focus:ring-fv-primary focus:outline-none"
                      />
                    </div>
                    <p className="text-xs text-fv-muted mt-1">This powers the floating WhatsApp button for shoppers.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-fv-muted mb-1.5">
                      Business Hours
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-fv-muted absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        value={settings.store?.businessHours || ''}
                        onChange={(e) => handleFieldChange('store', 'businessHours', e.target.value)}
                        placeholder="9:00 AM – 8:00 PM"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-fv-border bg-fv-page text-fv-heading focus:ring-2 focus:ring-fv-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-fv-muted mb-1.5">
                      Store Physical Address
                    </label>
                    <textarea
                      rows={2}
                      value={settings.store?.address || ''}
                      onChange={(e) => handleFieldChange('store', 'address', e.target.value)}
                      placeholder="Street, City, State, Pincode"
                      className="w-full px-4 py-2.5 rounded-xl border border-fv-border bg-fv-page text-fv-heading focus:ring-2 focus:ring-fv-primary focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <SectionActions
                  onSave={() => promptSave('store')}
                  onReset={() => setResetModal({ isOpen: true, section: 'store' })}
                  saving={saving}
                />
              </div>
            )}

            {/* 2. DELIVERY SECTION */}
            {activeSection === 'delivery' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-fv-heading flex items-center gap-2">
                    <Truck className="w-6 h-6 text-fv-primary" /> Delivery & Shipping
                  </h2>
                  <p className="text-sm text-fv-muted mt-1">
                    Set up your free delivery threshold, standard shipping fees, and Cash on Delivery rules.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="p-4 rounded-xl border border-fv-border bg-fv-page">
                    <label className="block text-sm font-semibold text-fv-heading mb-1">
                      Free Delivery Above
                    </label>
                    <p className="text-xs text-fv-muted mb-2.5">
                      Orders above this amount get free delivery automatically.
                    </p>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-fv-muted font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={settings.delivery?.freeDeliveryThreshold ?? 300}
                        onChange={(e) => handleFieldChange('delivery', 'freeDeliveryThreshold', Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2 rounded-lg border border-fv-border bg-white dark:bg-gray-700 text-fv-heading font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-fv-border bg-fv-page">
                    <label className="block text-sm font-semibold text-fv-heading mb-1">
                      Standard Delivery Charge
                    </label>
                    <p className="text-xs text-fv-muted mb-2.5">
                      Charge applied when order value is below the free delivery amount.
                    </p>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-fv-muted font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={settings.delivery?.deliveryCharge ?? 50}
                        onChange={(e) => handleFieldChange('delivery', 'deliveryCharge', Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2 rounded-lg border border-fv-border bg-white dark:bg-gray-700 text-fv-heading font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-fv-border bg-fv-page">
                    <label className="block text-sm font-semibold text-fv-heading mb-1">
                      Minimum Order Amount
                    </label>
                    <p className="text-xs text-fv-muted mb-2.5">
                      The smallest basket size a customer is allowed to checkout.
                    </p>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-fv-muted font-bold">₹</span>
                      <input
                        type="number"
                        min="0"
                        value={settings.delivery?.minOrderAmount ?? 100}
                        onChange={(e) => handleFieldChange('delivery', 'minOrderAmount', Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2 rounded-lg border border-fv-border bg-white dark:bg-gray-700 text-fv-heading font-semibold"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-fv-border bg-fv-page">
                    <label className="block text-sm font-semibold text-fv-heading mb-1">
                      Estimated Delivery Time
                    </label>
                    <p className="text-xs text-fv-muted mb-2.5">
                      Shown to customers on the cart and product pages.
                    </p>
                    <input
                      type="text"
                      value={settings.delivery?.deliveryTime || '3–5 Days'}
                      onChange={(e) => handleFieldChange('delivery', 'deliveryTime', e.target.value)}
                      placeholder="e.g. 3–5 Days"
                      className="w-full px-4 py-2 rounded-lg border border-fv-border bg-white dark:bg-gray-700 text-fv-heading font-semibold"
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-fv-border bg-fv-page sm:col-span-2 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-fv-heading block">
                        Cash on Delivery (COD) Available
                      </span>
                      <p className="text-xs text-fv-muted mt-0.5">
                        Allow customers to pay cash when their order arrives.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(settings.delivery?.codAvailable)}
                      onChange={(v) => handleFieldChange('delivery', 'codAvailable', v)}
                    />
                  </div>

                  {settings.delivery?.codAvailable && (
                    <div className="p-4 rounded-xl border border-fv-border bg-fv-page sm:col-span-2">
                      <label className="block text-sm font-semibold text-fv-heading mb-1">
                        COD Maximum Order Limit
                      </label>
                      <p className="text-xs text-fv-muted mb-2">
                        Baskets above this total will require prepaid online payment to reduce return risk.
                      </p>
                      <div className="relative max-w-xs">
                        <span className="absolute left-3.5 top-2.5 text-fv-muted font-bold">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={settings.delivery?.codMaxOrder ?? 5000}
                          onChange={(e) => handleFieldChange('delivery', 'codMaxOrder', Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-2 rounded-lg border border-fv-border bg-white dark:bg-gray-700 text-fv-heading font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <SectionActions
                  onSave={() => promptSave('delivery')}
                  onReset={() => setResetModal({ isOpen: true, section: 'delivery' })}
                  saving={saving}
                />
              </div>
            )}

            {/* 3. ORDERS SECTION */}
            {activeSection === 'orders' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-fv-heading flex items-center gap-2">
                    <Package className="w-6 h-6 text-fv-primary" /> Order Rules & Flow
                  </h2>
                  <p className="text-sm text-fv-muted mt-1">
                    Control customer cancellation policies, automated timeouts, and view your fulfillment workflow.
                  </p>
                </div>

                {/* Visual Order Lifecycle */}
                <div className="p-5 rounded-xl border border-fv-border bg-fv-cream dark:bg-gray-700/30">
                  <span className="text-xs font-bold uppercase tracking-wider text-fv-primary block mb-3">
                    Standard Fulfillment Pipeline
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-semibold">
                    <div className="p-2.5 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-300">
                      1. Pending
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300">
                      2. Confirmed
                    </div>
                    <div className="p-2.5 rounded-lg bg-blue-100 text-blue-800 border border-blue-300">
                      3. Packed
                    </div>
                    <div className="p-2.5 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-300">
                      4. Shipped
                    </div>
                    <div className="p-2.5 rounded-lg bg-green-100 text-green-800 border border-green-300 col-span-2 sm:col-span-1">
                      5. Delivered
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-fv-border bg-fv-page flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-fv-heading block">
                        Allow Customer Cancellation
                      </span>
                      <p className="text-xs text-fv-muted mt-0.5">
                        Permit customers to submit cancellation requests from their "My Orders" screen.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(settings.orders?.allowCustomerCancellation)}
                      onChange={(v) => handleFieldChange('orders', 'allowCustomerCancellation', v)}
                    />
                  </div>

                  {settings.orders?.allowCustomerCancellation && (
                    <div className="p-4 rounded-xl border border-fv-border bg-fv-page">
                      <label className="block text-sm font-semibold text-fv-heading mb-1">
                        Cancellation Allowed Until
                      </label>
                      <p className="text-xs text-fv-muted mb-2">
                        Define the latest stage at which a customer can request cancellation.
                      </p>
                      <select
                        value={settings.orders?.cancellationAllowedUntil || 'Before Shipped'}
                        onChange={(e) => handleFieldChange('orders', 'cancellationAllowedUntil', e.target.value)}
                        className="px-4 py-2 rounded-lg border border-fv-border bg-white dark:bg-gray-700 text-fv-heading font-medium text-sm"
                      >
                        <option value="Before Shipped">Before Shipped (Pending or Packed)</option>
                        <option value="Before Packed">Before Packed (Pending or Confirmed only)</option>
                      </select>
                    </div>
                  )}

                  <div className="p-4 rounded-xl border border-fv-border bg-fv-page flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-fv-heading block">
                        Auto-Cancel Abandoned Unpaid Online Orders
                      </span>
                      <p className="text-xs text-fv-muted mt-0.5">
                        Automatically releases stock if a customer begins online checkout but abandons payment.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(settings.orders?.autoCancelUnpaidOrders)}
                      onChange={(v) => handleFieldChange('orders', 'autoCancelUnpaidOrders', v)}
                    />
                  </div>

                  {settings.orders?.autoCancelUnpaidOrders && (
                    <div className="p-4 rounded-xl border border-fv-border bg-fv-page">
                      <label className="block text-sm font-semibold text-fv-heading mb-1">
                        Unpaid Order Timeout (Minutes)
                      </label>
                      <p className="text-xs text-fv-muted mb-2">
                        How long to wait before marking an abandoned online order as Failed.
                      </p>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        value={settings.orders?.unpaidOrderTimeoutMinutes ?? 30}
                        onChange={(e) => handleFieldChange('orders', 'unpaidOrderTimeoutMinutes', Number(e.target.value))}
                        className="w-32 px-4 py-2 rounded-lg border border-fv-border bg-white dark:bg-gray-700 text-fv-heading font-semibold text-sm"
                      />
                    </div>
                  )}
                </div>

                <SectionActions
                  onSave={() => promptSave('orders')}
                  onReset={() => setResetModal({ isOpen: true, section: 'orders' })}
                  saving={saving}
                />
              </div>
            )}

            {/* 4. INVENTORY SECTION */}
            {activeSection === 'inventory' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-fv-heading flex items-center gap-2">
                    <Boxes className="w-6 h-6 text-fv-primary" /> Inventory & Stock Controls
                  </h2>
                  <p className="text-sm text-fv-muted mt-1">
                    Keep your inventory healthy with low stock alerts and automated out-of-stock badges.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-fv-border bg-fv-page">
                    <label className="block text-sm font-semibold text-fv-heading mb-1">
                      Low Stock Alert Threshold
                    </label>
                    <p className="text-xs text-fv-muted mb-2">
                      When a product or pack variant falls below this number, you receive an urgent alert to restock.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={settings.inventory?.lowStockThreshold ?? 10}
                        onChange={(e) => handleFieldChange('inventory', 'lowStockThreshold', Number(e.target.value))}
                        className="w-28 px-4 py-2 rounded-lg border border-fv-border bg-white dark:bg-gray-700 text-fv-heading font-semibold text-sm"
                      />
                      <span className="text-sm text-fv-muted">items remaining</span>
                    </div>
                  </div>

                  {/* Visual Example Banner */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-sm block">How notifications work:</span>
                      <p className="text-xs mt-0.5">
                        When stock reaches the low-stock number, you will get an instant alert. Example:
                      </p>
                      <div className="mt-2 px-3 py-1.5 rounded-lg bg-white/70 dark:bg-black/30 border border-amber-300 text-xs font-mono">
                        ⚠ Tomato Seeds is low on stock. Only 7 left.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-fv-border bg-fv-page flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-fv-heading block">
                        Show "Only X Left" Badge on Storefront
                      </span>
                      <p className="text-xs text-fv-muted mt-0.5">
                        Creates urgency for shoppers when an item has low quantity.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(settings.inventory?.showOnlyXLeft)}
                      onChange={(v) => handleFieldChange('inventory', 'showOnlyXLeft', v)}
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-fv-border bg-fv-page flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-fv-heading block">
                        Allow Purchases When Out of Stock (Backorders)
                      </span>
                      <p className="text-xs text-fv-muted mt-0.5">
                        Recommended: Keep OFF to prevent overselling seeds you do not physically have in stock.
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(settings.inventory?.allowBackorders)}
                      onChange={(v) => handleFieldChange('inventory', 'allowBackorders', v)}
                    />
                  </div>

                  <div className="p-4 rounded-xl border border-fv-border bg-fv-page flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-fv-heading block">
                        Automatically Hide Out-of-Stock Products
                      </span>
                      <p className="text-xs text-fv-muted mt-0.5">
                        When stock hits 0, hide the item completely from the storefront instead of showing "Sold Out".
                      </p>
                    </div>
                    <Switch
                      checked={Boolean(settings.inventory?.autoHideOutOfStock)}
                      onChange={(v) => handleFieldChange('inventory', 'autoHideOutOfStock', v)}
                    />
                  </div>
                </div>

                <SectionActions
                  onSave={() => promptSave('inventory')}
                  onReset={() => setResetModal({ isOpen: true, section: 'inventory' })}
                  saving={saving}
                />
              </div>
            )}

            {/* 5. PAYMENTS SECTION */}
            {activeSection === 'payments' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-fv-heading flex items-center gap-2">
                    <CreditCard className="w-6 h-6 text-fv-primary" /> Payment Methods
                  </h2>
                  <p className="text-sm text-fv-muted mt-1">
                    Toggle customer-facing checkout payment options and configure order limits.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Online Payment Settings */}
                  <div className="p-5 rounded-xl border border-fv-border bg-fv-page space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-fv-heading block">
                          Razorpay / Online Payment (UPI, Cards, Net Banking)
                        </span>
                        <p className="text-xs text-fv-muted mt-0.5">
                          Accept secure online payments via Razorpay Gateway.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(settings.payments?.onlinePaymentEnabled)}
                        onChange={(v) => handleFieldChange('payments', 'onlinePaymentEnabled', v)}
                      />
                    </div>

                    {settings.payments?.onlinePaymentEnabled && (
                      <div className="pt-3 border-t border-fv-border">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-sm font-semibold text-fv-heading block">
                              Online Payment Incentive Discount
                            </span>
                            <p className="text-xs text-fv-muted">
                              Reward customers who pay online to reduce COD return and cancellation rates.
                            </p>
                          </div>
                          <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg p-0.5 border border-fv-border">
                            <button
                              type="button"
                              onClick={() => handleFieldChange('payments', 'onlineDiscountType', 'percentage')}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                (settings.payments?.onlineDiscountType || 'percentage') === 'percentage'
                                  ? 'bg-fv-primary text-white shadow-sm'
                                  : 'text-fv-muted hover:text-fv-heading'
                              }`}
                            >
                              Percentage (%)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFieldChange('payments', 'onlineDiscountType', 'flat')}
                              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                settings.payments?.onlineDiscountType === 'flat'
                                  ? 'bg-fv-primary text-white shadow-sm'
                                  : 'text-fv-muted hover:text-fv-heading'
                              }`}
                            >
                              Flat (₹)
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3.5 rounded-lg border border-fv-border bg-white dark:bg-gray-800">
                            <label className="block text-xs font-semibold text-fv-heading mb-1">
                              {(settings.payments?.onlineDiscountType || 'percentage') === 'percentage'
                                ? 'Discount Percentage (%)'
                                : 'Flat Discount Amount (₹)'}
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-fv-muted font-bold text-sm">
                                {(settings.payments?.onlineDiscountType || 'percentage') === 'percentage' ? '%' : '₹'}
                              </span>
                              <input
                                type="number"
                                min="0"
                                max={(settings.payments?.onlineDiscountType || 'percentage') === 'percentage' ? '100' : '10000'}
                                value={settings.payments?.onlineDiscountValue ?? 0}
                                onChange={(e) => handleFieldChange('payments', 'onlineDiscountValue', Math.max(0, Number(e.target.value)))}
                                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-fv-border bg-transparent text-fv-heading font-semibold"
                                placeholder="0"
                              />
                            </div>
                            <span className="text-[11px] text-fv-muted mt-1 block">Set to 0 for no discount.</span>
                          </div>

                          {(settings.payments?.onlineDiscountType || 'percentage') === 'percentage' && (
                            <div className="p-3.5 rounded-lg border border-fv-border bg-white dark:bg-gray-800">
                              <label className="block text-xs font-semibold text-fv-heading mb-1">
                                Maximum Discount Cap (₹)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-fv-muted font-bold text-sm">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={settings.payments?.onlineDiscountMaxLimit ?? 100}
                                  onChange={(e) => handleFieldChange('payments', 'onlineDiscountMaxLimit', Math.max(0, Number(e.target.value)))}
                                  className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-fv-border bg-transparent text-fv-heading font-semibold"
                                  placeholder="100"
                                />
                              </div>
                              <span className="text-[11px] text-fv-muted mt-1 block">Upper limit per order.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cash on Delivery Settings */}
                  <div className="p-5 rounded-xl border border-fv-border bg-fv-page space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-fv-heading block">
                          Cash on Delivery (COD)
                        </span>
                        <p className="text-xs text-fv-muted mt-0.5">
                          Accept cash collected by courier upon doorstep delivery.
                        </p>
                      </div>
                      <Switch
                        checked={Boolean(settings.payments?.codEnabled)}
                        onChange={(v) => handleFieldChange('payments', 'codEnabled', v)}
                      />
                    </div>

                    {settings.payments?.codEnabled && (
                      <div className="pt-3 border-t border-fv-border space-y-4">
                        <div className="p-3.5 rounded-lg border border-fv-border bg-white dark:bg-gray-800">
                          <label className="block text-xs font-semibold text-fv-heading mb-1">
                            Extra COD Handling Charge / Fee (₹)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-fv-muted font-bold text-sm">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={settings.payments?.codExtraCharge ?? 0}
                              onChange={(e) => handleFieldChange('payments', 'codExtraCharge', Math.max(0, Number(e.target.value)))}
                              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-fv-border bg-transparent text-fv-heading font-semibold"
                              placeholder="0"
                            />
                          </div>
                          <p className="text-[11px] text-fv-muted mt-1">
                            Added to customer checkout total specifically when COD is chosen. Set to ₹0 for free COD.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-3.5 rounded-lg border border-fv-border bg-white dark:bg-gray-800">
                            <label className="block text-xs font-semibold text-fv-heading mb-1">
                              Minimum COD Order
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-fv-muted font-bold text-sm">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={settings.payments?.codMinOrder ?? 100}
                                onChange={(e) => handleFieldChange('payments', 'codMinOrder', Number(e.target.value))}
                                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-fv-border bg-transparent text-fv-heading font-semibold"
                              />
                            </div>
                          </div>

                          <div className="p-3.5 rounded-lg border border-fv-border bg-white dark:bg-gray-800">
                            <label className="block text-xs font-semibold text-fv-heading mb-1">
                              Maximum COD Order
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-fv-muted font-bold text-sm">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={settings.payments?.codMaxOrder ?? 5000}
                                onChange={(e) => handleFieldChange('payments', 'codMaxOrder', Number(e.target.value))}
                                className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-fv-border bg-transparent text-fv-heading font-semibold"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informational Box */}
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-200 flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs">
                      Technical API credentials (Razorpay Key ID & Webhooks) are kept safe in the <strong>Advanced Settings</strong> area to prevent accidental disruption.
                    </p>
                  </div>
                </div>

                <SectionActions
                  onSave={() => promptSave('payments')}
                  onReset={() => setResetModal({ isOpen: true, section: 'payments' })}
                  saving={saving}
                />
              </div>
            )}

            {/* 6. NOTIFICATIONS SECTION */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-fv-heading flex items-center gap-2">
                    <Bell className="w-6 h-6 text-fv-primary" /> Notifications & Alerts
                  </h2>
                  <p className="text-sm text-fv-muted mt-1">
                    Choose exactly which alerts are sent to the admin and customers via Email and WhatsApp.
                  </p>
                </div>

                {/* Admin Notifications */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-fv-heading flex items-center gap-2">
                    Admin Notifications
                  </h3>
                  <div className="border border-fv-border rounded-xl overflow-hidden divide-y divide-fv-border">
                    {[
                      { key: 'newOrder', label: 'New Order Received' },
                      { key: 'cancellationRequest', label: 'Cancellation Request' },
                      { key: 'lowStock', label: 'Low Stock Alert' },
                      { key: 'paymentFailed', label: 'Payment Failure' },
                      { key: 'courierFailed', label: 'Courier Dispatch Failure' },
                    ].map((item) => {
                      const cfg = settings.notifications?.admin?.[item.key] || { email: true, whatsapp: false };
                      return (
                        <div key={item.key} className="p-4 bg-white dark:bg-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-sm font-medium text-fv-heading">{item.label}</span>
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <span>Email</span>
                              <Switch
                                checked={Boolean(cfg.email)}
                                onChange={(v) => handleNotificationChange('admin', item.key, 'email', v)}
                              />
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <span>WhatsApp</span>
                              <Switch
                                checked={Boolean(cfg.whatsapp)}
                                onChange={(v) => handleNotificationChange('admin', item.key, 'whatsapp', v)}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Notifications */}
                <div className="space-y-3 pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-fv-heading flex items-center gap-2">
                    Customer Notifications
                  </h3>
                  <div className="border border-fv-border rounded-xl overflow-hidden divide-y divide-fv-border">
                    {[
                      { key: 'orderConfirmation', label: 'Order Confirmation' },
                      { key: 'orderShipped', label: 'Order Shipped with Tracking' },
                      { key: 'orderDelivered', label: 'Order Delivered' },
                      { key: 'orderCancelled', label: 'Order Cancellation & Refund' },
                    ].map((item) => {
                      const cfg = settings.notifications?.customer?.[item.key] || { email: true, whatsapp: true };
                      return (
                        <div key={item.key} className="p-4 bg-white dark:bg-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <span className="text-sm font-medium text-fv-heading">{item.label}</span>
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <span>Email</span>
                              <Switch
                                checked={Boolean(cfg.email)}
                                onChange={(v) => handleNotificationChange('customer', item.key, 'email', v)}
                              />
                            </label>
                            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                              <span>WhatsApp</span>
                              <Switch
                                checked={Boolean(cfg.whatsapp)}
                                onChange={(v) => handleNotificationChange('customer', item.key, 'whatsapp', v)}
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <SectionActions
                  onSave={() => promptSave('notifications')}
                  onReset={() => setResetModal({ isOpen: true, section: 'notifications' })}
                  saving={saving}
                />
              </div>
            )}

            {/* 7. ADVANCED SECTION (SUPER ADMIN ONLY) */}
            {activeSection === 'advanced' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-fv-heading flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-red-600" /> Advanced & System Settings
                  </h2>
                  <p className="text-sm text-fv-muted mt-1">
                    System health, external API readiness, environment info, and developer tools.
                  </p>
                </div>

                {!isSuperAdmin ? (
                  <div className="p-6 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-900/20 text-center">
                    <Lock className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Access Restricted</h3>
                    <p className="text-sm text-red-700 dark:text-red-400 max-w-md mx-auto mt-1">
                      Advanced system settings are only accessible to the Super Admin. This protects the store from accidental API or environment disruptions.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* External Service Integration Status */}
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-fv-heading mb-3">
                        External Integration Status
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { name: 'Razorpay Payment Gateway', key: 'razorpay' },
                          { name: 'Razorpay Webhooks', key: 'webhook' },
                          { name: 'Brevo (Sendinblue) SMTP Mail', key: 'brevoSmtp' },
                          { name: 'Twilio WhatsApp & SMS', key: 'twilio' },
                          { name: 'DTDC Logistics Integration', key: 'dtdc' },
                          { name: 'Cloudinary Image CDN', key: 'cloudinary' },
                        ].map((srv) => {
                          const isConfigured = advancedInfo?.services?.[srv.key]?.configured;
                          return (
                            <div key={srv.key} className="p-4 rounded-xl border border-fv-border bg-fv-page flex items-center justify-between">
                              <span className="text-sm font-medium text-fv-heading">{srv.name}</span>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                                isConfigured
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isConfigured ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                {isConfigured ? 'Configured' : 'Missing Env'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Environment Overview */}
                    <div className="p-4 rounded-xl border border-fv-border bg-fv-page flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-fv-heading block">Runtime Environment</span>
                        <span className="text-xs text-fv-muted font-mono">{advancedInfo?.nodeEnv}</span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded bg-fv-surface border border-fv-border font-mono font-bold">
                        Node.js &bull; Express
                      </span>
                    </div>

                    {/* Danger Zone Link */}
                    <div className="p-5 rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-sm font-bold text-red-900 dark:text-red-200 block">
                          Production Data Purge (Danger Zone)
                        </span>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-0.5">
                          Wipe test orders, demo coupons, and non-admin records before official public launch.
                        </p>
                      </div>
                      <a
                        href="/admin/danger-zone"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-sm"
                      >
                        Go to Danger Zone <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Impact Warning Modal ── */}
      <AnimatePresence>
        {warningModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-fv-border shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-600">
                <AlertTriangle className="w-7 h-7 flex-shrink-0" />
                <h3 className="text-lg font-bold text-fv-heading">{warningModal.title}</h3>
              </div>
              <p className="text-sm text-fv-muted leading-relaxed">
                {warningModal.message}
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWarningModal({ isOpen: false, title: '', message: '', onConfirm: null })}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-fv-border text-fv-heading hover:bg-fv-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={warningModal.onConfirm}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-fv-primary hover:bg-fv-primary-dark text-white shadow-md shadow-fv-primary/20 transition-all flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Save'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Reset Confirmation Modal ── */}
      <AnimatePresence>
        {resetModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-fv-border shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <RotateCcw className="w-6 h-6 flex-shrink-0" />
                <h3 className="text-lg font-bold text-fv-heading">Reset to Defaults?</h3>
              </div>
              <p className="text-sm text-fv-muted leading-relaxed">
                This will restore all <strong>{resetModal.section}</strong> settings back to original factory defaults. You can re-adjust them at any time.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModal({ isOpen: false, section: '' })}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-fv-border text-fv-heading hover:bg-fv-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeReset(resetModal.section)}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-md transition-all flex items-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset to Default'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
        checked ? 'bg-fv-primary justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'
      }`}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-4 h-4 rounded-full bg-white shadow-md"
      />
    </button>
  );
}

function SectionActions({ onSave, onReset, saving }) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-fv-border">
      <button
        type="button"
        onClick={onReset}
        disabled={saving}
        className="text-xs font-semibold text-fv-muted hover:text-red-600 flex items-center gap-1.5 transition-colors order-2 sm:order-1"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset to Default
      </button>

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-fv-primary hover:bg-fv-primary-dark text-white font-semibold text-sm shadow-md shadow-fv-primary/25 transition-all flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-60"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </div>
  );
}
