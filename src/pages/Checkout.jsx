import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard, MapPin, Package, AlertCircle, CheckCircle, Tag,
  Navigation, Loader2, Plus, Star, Check, Lock, ShieldCheck, Phone, ArrowLeft,
  Home, Briefcase, Sprout, Compass, MessageSquare, Truck, Clock, RefreshCw,
  ChevronDown, ChevronUp, ShoppingBag, Ticket, Sparkles, Gift, X, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../utils/api';
import { fetchCurrentAddress } from '../utils/locationService';
import { lookupPincode, isValidPincodeFormat } from '../utils/pincodeService';
import { cleanupMsg91Captcha } from '../utils/msg91';
import GuestMobileOtpStep from '../components/checkout/GuestMobileOtpStep';
import { getProductImageUrl, handleImageError, DEFAULT_PRODUCT_IMAGE } from '../utils/imageFallback';

/* ─── Standardized Proportional Input & Label Styles ───────────────────── */
const inputCls =
  'w-full h-11 sm:h-12 px-3.5 border border-gray-300 dark:border-gray-600 rounded-xl ' +
  'bg-white dark:bg-gray-700/80 text-gray-900 dark:text-white text-base sm:text-sm ' +
  'placeholder:text-gray-400 focus:ring-2 focus:ring-fv-primary/30 focus:border-fv-primary transition-all shadow-2xs';

const labelCls = 'block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

/* ─── Real Customer Name Helpers (replaces Customer123 placeholder) ──── */
const isPlaceholderName = (name) => {
  if (!name || typeof name !== 'string') return true;
  const trimmed = name.trim();
  if (trimmed.length < 2) return true;
  return /^customer(\s*\d+)?$/i.test(trimmed);
};

const getRealName = (name) => {
  if (isPlaceholderName(name)) return '';
  return name.trim();
};

/* ─── Swiggy / Zomato Address Tags for Checkout ──────────────────────── */
const CHECKOUT_ADDRESS_TAGS = [
  { id: 'Home', label: 'Home', Icon: Home, color: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  { id: 'Work', label: 'Work', Icon: Briefcase, color: 'text-blue-700 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  { id: 'Farm', label: 'Farm', Icon: Sprout, color: 'text-lime-800 bg-lime-50 dark:bg-lime-950/40 border-lime-200 dark:border-lime-800' },
  { id: 'Other', label: 'Other', Icon: MapPin, color: 'text-slate-700 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700' },
];

/* ─── Delivery Slots for Step 2 ───────────────────────────────────────── */
const DELIVERY_SLOTS = [
  {
    id: 'morning',
    title: 'Morning Harvest Slot',
    time: '7:00 AM – 10:00 AM',
    desc: 'Picked fresh at dawn for breakfast & daytime cooking',
    badge: 'Most Popular'
  },
  {
    id: 'evening',
    title: 'Evening Delivery Slot',
    time: '5:00 PM – 8:00 PM',
    desc: 'Delivered in time for evening dinner preparation'
  },
  {
    id: 'standard',
    title: 'Standard Daytime Slot',
    time: '9:00 AM – 6:00 PM',
    desc: 'Flexible daytime dispatch via farm courier'
  }
];

/* ─── Reusable Address Form Fields ─────────────────────────────────────── */
const AddressFields = ({ addr, setAddr, gpsLoading, onUseLocation, pincodeStatus, setPincodeStatus }) => {
  const [checkingPin, setCheckingPin] = useState(false);

  const handlePincodeChange = async (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 6);
    setAddr(a => ({ ...a, pincode: rawVal }));

    if (rawVal.length === 6) {
      setCheckingPin(true);
      if (setPincodeStatus) setPincodeStatus({ loading: true, valid: null, message: 'Verifying PIN code…' });
      try {
        const res = await lookupPincode(rawVal);
        if (res.valid) {
          setAddr(a => ({
            ...a,
            pincode: rawVal,
            state: a.state || res.state || '',
            city: a.city || res.district || res.city || '',
          }));
          if (setPincodeStatus) {
            setPincodeStatus({
              loading: false,
              valid: true,
              message: res.message ? `Verified: ${res.message}` : 'Valid Indian PIN code',
            });
          }
        } else {
          if (setPincodeStatus) {
            setPincodeStatus({
              loading: false,
              valid: false,
              message: res.message || 'Invalid PIN code. No postal records found.',
            });
          }
        }
      } catch {
        if (setPincodeStatus) setPincodeStatus({ loading: false, valid: true, message: 'Valid format' });
      } finally {
        setCheckingPin(false);
      }
    } else {
      if (setPincodeStatus) setPincodeStatus({ loading: false, valid: null, message: '' });
    }
  };

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Address Tag Selector */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
          Save Address As
        </label>
        <div className="grid grid-cols-4 gap-2">
          {CHECKOUT_ADDRESS_TAGS.map(({ id, label, Icon }) => {
            const isSelected = (addr.tag || 'Home') === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setAddr(a => ({ ...a, tag: id }))}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl border text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-fv-primary text-white border-fv-primary shadow-xs ring-2 ring-fv-primary/25'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-fv-primary/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* GPS Location Button */}
      <button
        type="button"
        onClick={onUseLocation}
        disabled={gpsLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 min-h-[44px]
                   rounded-xl border border-dashed border-fv-primary/60 hover:border-fv-primary
                   text-fv-primary hover:bg-fv-cream dark:hover:bg-green-900/20
                   text-xs sm:text-sm font-semibold transition-all disabled:opacity-60 active:scale-[0.99] cursor-pointer"
      >
        {gpsLoading
          ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Detecting location…</span></>
          : <><Navigation className="w-4 h-4" /><span>Use Current Location</span></>}
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="shipping-name-input" className={labelCls}>Full Name (Receiver's Real Name) *</label>
            {isPlaceholderName(addr.name) && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                Required
              </span>
            )}
          </div>
          <input
            id="shipping-name-input"
            type="text"
            required
            autoComplete="name"
            placeholder="Enter receiver's actual full name"
            value={getRealName(addr.name)}
            onChange={e => setAddr(a => ({ ...a, name: e.target.value }))}
            className={`${inputCls} ${
              isPlaceholderName(addr.name) ? 'focus:border-fv-primary' : ''
            }`}
          />
        </div>
        <div>
          <label className={labelCls}>Phone Number *</label>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            required
            autoComplete="tel"
            placeholder="10-digit mobile"
            value={addr.phone || ''}
            onChange={e => setAddr(a => ({ ...a, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>House / Street / Area *</label>
          <input
            type="text"
            required
            autoComplete="street-address"
            placeholder="Flat / House no., Street, Area, Apartment (min 5 characters)"
            value={addr.street || ''}
            onChange={e => setAddr(a => ({ ...a, street: e.target.value }))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Nearby Landmark</label>
          <div className="relative">
            <Compass className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="e.g. Opp. City Mall or Near Water Tank"
              value={addr.landmark || ''}
              onChange={e => setAddr(a => ({ ...a, landmark: e.target.value }))}
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Delivery Instructions / Gate Code</label>
          <div className="relative">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="e.g. Leave with guard / Ring bell twice"
              value={addr.instructions || ''}
              onChange={e => setAddr(a => ({ ...a, instructions: e.target.value }))}
              className={`${inputCls} pl-8`}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>City / District *</label>
          <input
            type="text"
            required
            autoComplete="address-level2"
            placeholder="City or District"
            value={addr.city || ''}
            onChange={e => setAddr(a => ({ ...a, city: e.target.value }))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>State *</label>
          <input
            type="text"
            required
            autoComplete="address-level1"
            placeholder="State"
            value={addr.state || ''}
            onChange={e => setAddr(a => ({ ...a, state: e.target.value }))}
            className={inputCls}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <label className={labelCls}>PIN Code *</label>
            {checkingPin && (
              <span className="text-[11px] text-fv-primary flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Verifying PIN…
              </span>
            )}
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            autoComplete="postal-code"
            placeholder="6-digit Indian PIN code (e.g. 452001)"
            value={addr.pincode || ''}
            onChange={handlePincodeChange}
            className={`${inputCls} ${
              pincodeStatus?.valid === false
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                : pincodeStatus?.valid === true
                ? 'border-green-500 focus:border-green-500 focus:ring-green-200'
                : ''
            }`}
          />
          {pincodeStatus?.message && (
            <div className={`mt-1.5 flex items-start gap-1.5 text-xs ${
              pincodeStatus.valid === true
                ? 'text-green-700 dark:text-green-400'
                : pincodeStatus.valid === false
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500'
            }`}>
              {pincodeStatus.valid === true ? (
                <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-green-600" />
              ) : pincodeStatus.valid === false ? (
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
              ) : null}
              <span>{pincodeStatus.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Checkout Component ──────────────────────────────────────────── */
const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, cartReady, replaceCart, setCartItems } = useCart();
  const { user, addAddress } = useAuth();
  const { settings: storeSettings } = useSettings();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const submittingRef = useRef(false);

  const savedAddresses = user?.addresses || [];
  const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];

  const [selectedSavedId, setSelectedSavedId] = useState(defaultAddr?._id || null);
  const [mode, setMode] = useState(savedAddresses.length > 0 ? 'saved' : 'new');
  const [newAddr, setNewAddr] = useState({
    name: getRealName(user?.name),
    phone: user?.phone || '',
    tag: 'Home',
    street: '',
    landmark: '',
    instructions: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [pincodeStatus, setPincodeStatus] = useState({ loading: false, valid: null, message: '' });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [saveNewAddr, setSaveNewAddr] = useState(true);

  // Active checkout step: 1 = Address, 2 = Shipping, 3 = Payment & Review
  const [currentStep, setCurrentStep] = useState(() => {
    try {
      const saved = sessionStorage.getItem('fv_checkout_step');
      return saved ? Math.min(3, Math.max(1, parseInt(saved, 10))) : 1;
    } catch {
      return 1;
    }
  });

  // Step 2 Delivery / Shipping Options
  const [deliveryMethod] = useState('standard');
  const [deliverySlot, setDeliverySlot] = useState('morning');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Payment state: null by default so COD handling charge is NOT added until payment method is selected
  const [paymentMode, setPaymentMode] = useState(null);

  // Coupon state (Domino's / Zomato Benchmark)
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponDrawer, setShowCouponDrawer] = useState(false);
  const [couponCelebration, setCouponCelebration] = useState(false);

  // Mobile Order Summary Drawer state
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Cart Integrity Warning Modal state
  const [showIntegrityModal, setShowIntegrityModal] = useState(false);
  const [integrityChanges, setIntegrityChanges] = useState([]);
  const [verifiedCartData, setVerifiedCartData] = useState([]);
  const [integrityLoading, setIntegrityLoading] = useState(false);

  // Flipkart / Myntra COD Double Confirmation Modal state
  const [showCodConfirmModal, setShowCodConfirmModal] = useState(false);

  /* Sync address state when user loads */
  useEffect(() => {
    if (!user) return;
    const addrs = user.addresses || [];
    const def = addrs.find(a => a.isDefault) || addrs[0];
    if (addrs.length > 0) {
      setMode('saved');
      setSelectedSavedId(def?._id || null);
    }
    setNewAddr(a => ({
      ...a,
      name: getRealName(a.name) || getRealName(user.name),
      phone: a.phone || user.phone || '',
    }));
    cleanupMsg91Captcha();
  }, [user]);

  useEffect(() => {
    return () => {
      cleanupMsg91Captcha();
    };
  }, []);

  /* Redirect to cart if empty */
  useEffect(() => {
    if (cartReady && cartItems.length === 0) navigate('/cart', { replace: true });
  }, [cartReady, cartItems, navigate]);

  /* Load Razorpay script */
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  /* GPS location helper */
  const handleUseLocation = async () => {
    setGpsError('');
    setGpsLoading(true);
    try {
      const detected = await fetchCurrentAddress();
      setNewAddr(a => ({
        ...a,
        street: detected.street || a.street,
        city: detected.city || a.city,
        state: detected.state || a.state,
        pincode: detected.pincode || a.pincode,
      }));

      if (detected.pincode && detected.pincode.length === 6) {
        lookupPincode(detected.pincode).then(res => {
          if (res.valid) {
            setPincodeStatus({
              loading: false,
              valid: true,
              message: res.message ? `Verified: ${res.message}` : 'Valid Indian PIN code',
            });
            setNewAddr(a => ({
              ...a,
              state: a.state || res.state || '',
              city: a.city || res.district || res.city || '',
            }));
          }
        }).catch(() => {});
      }
    } catch (err) {
      setGpsError(err.message || 'Location access failed. Please type your address manually below.');
    } finally {
      setGpsLoading(false);
    }
  };

  /* Resolve shipping address */
  const resolveShippingAddress = () => {
    if (mode === 'saved' && selectedSavedId) {
      const saved = savedAddresses.find(a => a._id === selectedSavedId);
      if (saved) {
        return {
          name: getRealName(saved.name) || getRealName(user?.name),
          phone: saved.phone || user?.phone || '',
          tag: saved.tag || 'Home',
          street: saved.street,
          landmark: saved.landmark || '',
          instructions: saved.instructions || deliveryNotes || '',
          city: saved.city,
          state: saved.state,
          pincode: saved.pincode,
          country: saved.country || 'India',
        };
      }
    }
    return {
      ...newAddr,
      name: getRealName(newAddr.name),
      instructions: newAddr.instructions || deliveryNotes || '',
      country: 'India'
    };
  };

  /* Step 1 Validation Guardrail */
  const isStep1Valid = (showErrors = false) => {
    if (!user) {
      if (showErrors) setError('Please complete Mobile Verification before proceeding.');
      return false;
    }
    const addr = resolveShippingAddress();
    if (!addr.name?.trim() || isPlaceholderName(addr.name)) {
      if (showErrors) {
        setError('Please enter your actual Full Name (Receiver’s Real Name).');
        const nameInput = document.getElementById('shipping-name-input');
        if (nameInput) {
          nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          nameInput.focus();
        }
      }
      return false;
    }
    if (!addr.phone?.trim() || addr.phone.trim().length !== 10) {
      if (showErrors) setError('Please provide a valid 10-digit mobile phone number.');
      return false;
    }
    if (!addr.street?.trim() || addr.street.trim().length < 5) {
      if (showErrors) setError('Please provide a detailed delivery street address (minimum 5 characters).');
      return false;
    }
    if (!addr.city?.trim() || !addr.state?.trim()) {
      if (showErrors) setError('Please enter your city and state.');
      return false;
    }
    if (!addr.pincode?.trim() || !isValidPincodeFormat(addr.pincode)) {
      if (showErrors) setError('Please enter a valid 6-digit Indian PIN code (e.g. 452001).');
      return false;
    }
    if (mode === 'new' && pincodeStatus?.valid === false) {
      if (showErrors) setError(pincodeStatus.message || 'Invalid PIN code. Please enter a valid PIN code.');
      return false;
    }
    return true;
  };

  /* Step 2 Validation Guardrail */
  const isStep2Valid = (showErrors = false) => {
    if (!deliverySlot) {
      if (showErrors) setError('Please select a preferred delivery slot.');
      return false;
    }
    return true;
  };

  /* Live Cart Integrity Verification (Edge Case Handler) */
  const verifyCartIntegrity = async () => {
    setIntegrityLoading(true);
    try {
      const orderItems = cartItems.map(item => ({
        product: item._id,
        productType: item.isCombo ? 'Combo' : 'Product',
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.images?.[0] || '',
        ...(item.packageId ? { packageId: item.packageId } : {}),
      }));

      const res = await api.post('/orders/verify-cart', { orderItems });
      if (res.data?.success && res.data?.hasChanges) {
        setIntegrityChanges(res.data.changes || []);
        setVerifiedCartData(res.data.verifiedItems || []);
        setShowIntegrityModal(true);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('Cart integrity check warning:', err.message);
      return true; // Allow proceeding if offline or network glitch
    } finally {
      setIntegrityLoading(false);
    }
  };

  /* Accept Integrity Updates from Modal */
  const handleAcceptIntegrityUpdates = () => {
    if (verifiedCartData && verifiedCartData.length > 0) {
      const updated = verifiedCartData.map(v => {
        const existing = cartItems.find(
          c => String(c._id) === String(v.product) && String(c.packageId || '') === String(v.packageId || '')
        );
        return {
          ...(existing || {}),
          _id: v.product,
          name: v.name,
          price: v.price,
          quantity: v.quantity,
          packageId: v.packageId,
        };
      });
      if (replaceCart) replaceCart(updated);
      else if (setCartItems) setCartItems(updated);
    }
    setShowIntegrityModal(false);
    setIntegrityChanges([]);
    setError('Cart items and pricing updated to latest store rates.');
    setCurrentStep(3);
    try { sessionStorage.setItem('fv_checkout_step', '3'); } catch {}
  };

  /* Step Navigation with strict guardrails */
  const goToStep = async (step) => {
    setError('');
    if (storeSettings?.maintenance?.isStoreClosed) {
      setError(storeSettings?.maintenance?.closureNotice || 'Our storefront is currently closed for routine maintenance.');
      return;
    }
    const target = Math.min(3, Math.max(1, step));

    // Guardrail: Cannot advance to Step 2 or 3 without valid Step 1 address
    if (target >= 2 && !isStep1Valid(true)) {
      return;
    }

    // Guardrail: Cannot advance to Step 3 without valid Step 2
    if (target === 3 && !isStep2Valid(true)) {
      return;
    }

    // Edge-case check before entering Step 3
    if (target === 3 && currentStep < 3) {
      const clean = await verifyCartIntegrity();
      if (!clean) return; // Modal opened
    }

    setCurrentStep(target);
    try {
      sessionStorage.setItem('fv_checkout_step', target.toString());
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* Pricing calculations */
  const FREE_DELIVERY_THRESHOLD = storeSettings?.delivery?.freeDeliveryThreshold ?? 499;
  const DELIVERY_CHARGE = storeSettings?.delivery?.deliveryCharge ?? 50;
  const COD_AVAILABLE = (storeSettings?.delivery?.codAvailable ?? true) && (storeSettings?.payments?.codEnabled ?? true);
  const COD_MAX_ORDER = storeSettings?.delivery?.codMaxOrder ?? storeSettings?.payments?.codMaxOrder ?? 5000;
  const MIN_ORDER_AMOUNT = storeSettings?.delivery?.minOrderAmount ?? 100;
  const ONLINE_AVAILABLE = storeSettings?.payments?.onlinePaymentEnabled ?? true;
  const COD_EXTRA_CHARGE = storeSettings?.payments?.codExtraCharge ?? 0;
  const ONLINE_DISCOUNT_TYPE = storeSettings?.payments?.onlineDiscountType || 'percentage';
  const ONLINE_DISCOUNT_VALUE = storeSettings?.payments?.onlineDiscountValue ?? 0;
  const ONLINE_DISCOUNT_MAX = storeSettings?.payments?.onlineDiscountMaxLimit ?? 100;

  const itemsPrice = getCartTotal();
  const shippingPrice = itemsPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const discountAmount = appliedCoupon ? (appliedCoupon.discountAmount || 0) : 0;

  const codExtraFee = (paymentMode === 'COD' && COD_EXTRA_CHARGE > 0) ? COD_EXTRA_CHARGE : 0;

  let onlineDiscountAmount = 0;
  if (paymentMode === 'Online' && ONLINE_DISCOUNT_VALUE > 0 && itemsPrice > 0) {
    if (ONLINE_DISCOUNT_TYPE === 'percentage') {
      onlineDiscountAmount = Math.round((itemsPrice * ONLINE_DISCOUNT_VALUE) / 100);
      if (ONLINE_DISCOUNT_MAX > 0) {
        onlineDiscountAmount = Math.min(onlineDiscountAmount, ONLINE_DISCOUNT_MAX);
      }
    } else {
      onlineDiscountAmount = ONLINE_DISCOUNT_VALUE;
    }
    onlineDiscountAmount = Math.max(0, Math.min(onlineDiscountAmount, itemsPrice));
  }

  const totalAmount = Math.max(0, itemsPrice + shippingPrice + codExtraFee - discountAmount - onlineDiscountAmount);

  /* Step 1 -> Step 2 validation */
  const handleProceedToShipping = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isStep1Valid(true)) {
      goToStep(2);
    }
  };

  /* Step 2 -> Step 3 validation */
  const handleProceedToPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isStep1Valid(true)) {
      goToStep(1);
      return;
    }
    if (!isStep2Valid(true)) return;

    if (MIN_ORDER_AMOUNT && itemsPrice < MIN_ORDER_AMOUNT) {
      setError(`Minimum order amount is ₹${MIN_ORDER_AMOUNT}. Current items total is ₹${itemsPrice}.`);
      return;
    }

    const clean = await verifyCartIntegrity();
    if (!clean) return;

    goToStep(3);
  };

  /* Razorpay handler */
  const handleRazorpayPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');
    setLoading(true);

    try {
      const shippingAddress = resolveShippingAddress();

      // Auto-save new address if opted in
      if (mode === 'new' && saveNewAddr && shippingAddress.street) {
        addAddress(shippingAddress).catch(() => {});
      }

      const orderItems = cartItems.map(item => ({
        product: item._id,
        productType: item.isCombo ? 'Combo' : 'Product',
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.images?.[0] || '',
        ...(item.packageId ? { packageId: item.packageId } : {}),
      }));

      const orderData = {
        orderItems,
        shippingAddress,
        couponCode: appliedCoupon?.code || null,
        saveAddress: mode === 'new' && saveNewAddr,
        deliverySlot,
        deliveryMethod,
      };

      const createOrderResponse = await api.post('/payments/create-order', orderData);
      const { razorpayOrderId, internalOrderId, key, amount } = createOrderResponse.data.data;

      const options = {
        key,
        amount,
        currency: 'INR',
        order_id: razorpayOrderId,
        name: 'Fresh Veggies',
        image: '/logo.png',
        prefill: {
          name: shippingAddress.name,
          email: user?.email,
          contact: shippingAddress.phone,
        },
        handler: async (response) => {
          try {
            const verifyResponse = await api.post('/payments/verify-payment', {
              razorpay_order_id:  razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              internalOrderId,
            });
            if (verifyResponse.data.success) {
              clearCart();
              try { sessionStorage.removeItem('fv_checkout_step'); } catch {}
              navigate(`/orders/${verifyResponse.data.data._id}`, {
                state: { success: true, message: 'Payment successful! Order confirmed.' }
              });
            }
          } catch {
            await api.post('/payments/payment-failure', {
              razorpay_order_id: razorpayOrderId,
              internalOrderId
            }).catch(() => {});
            setError('Payment verification failed. Please contact support with your order reference.');
            submittingRef.current = false;
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            api.post('/payments/payment-failure', { razorpay_order_id: razorpayOrderId, internalOrderId }).catch(() => {});
            submittingRef.current = false;
            setLoading(false);
            setError('Payment was cancelled. Your order has not been placed. Please try again.');
          }
        },
        theme: { color: '#0A4D3C' }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
      submittingRef.current = false;
      setLoading(false);
    }
  };

  /* COD handler */
  const handleCODPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');
    setLoading(true);

    try {
      const shippingAddress = resolveShippingAddress();

      if (mode === 'new' && saveNewAddr && shippingAddress.street) {
        addAddress(shippingAddress).catch(() => {});
      }

      const orderItems = cartItems.map(item => ({
        product: item._id,
        productType: item.isCombo ? 'Combo' : 'Product',
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.images?.[0] || '',
        ...(item.packageId ? { packageId: item.packageId } : {}),
      }));

      const orderData = {
        orderItems,
        shippingAddress,
        paymentMode: 'COD',
        couponCode: appliedCoupon?.code || null,
        saveAddress: mode === 'new' && saveNewAddr,
        deliverySlot,
        deliveryMethod,
      };

      const response = await api.post('/orders', orderData);
      clearCart();
      try { sessionStorage.removeItem('fv_checkout_step'); } catch {}
      submittingRef.current = false;
      navigate(`/orders/${response.data.data._id}`, {
        state: { success: true, message: 'Order placed successfully! Pay on delivery.' }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      submittingRef.current = false;
    }
    setLoading(false);
  };

  /* Final Submit Handler */
  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (storeSettings?.maintenance?.isStoreClosed) {
      setError(storeSettings?.maintenance?.closureNotice || 'Our storefront is currently closed for routine maintenance. Orders cannot be accepted at this time.');
      return;
    }

    if (!isStep1Valid(true)) {
      goToStep(1);
      return;
    }

    if (!isStep2Valid(true)) {
      goToStep(2);
      return;
    }

    if (MIN_ORDER_AMOUNT && itemsPrice < MIN_ORDER_AMOUNT) {
      setError(`Minimum order amount is ₹${MIN_ORDER_AMOUNT}. Current items total is ₹${itemsPrice}.`);
      return;
    }

    // Verify cart integrity once more right before submission
    const clean = await verifyCartIntegrity();
    if (!clean) return;

    if (!paymentMode) {
      setError('Please select a payment method (Cash on Delivery or Online Payment) to place your order.');
      return;
    }

    if (paymentMode === 'COD') {
      if (!COD_AVAILABLE) {
        setError('Cash on Delivery is currently unavailable. Please choose Online Payment.');
        return;
      }
      if (COD_MAX_ORDER && totalAmount > COD_MAX_ORDER) {
        setError(`Cash on Delivery is only available for orders up to ₹${COD_MAX_ORDER}. Please choose Online Payment.`);
        return;
      }
      // Flipkart / Myntra Double-Confirmation Modal to prevent accidental orders
      setShowCodConfirmModal(true);
      return;
    } else {
      if (!ONLINE_AVAILABLE) {
        setError('Online Payment is currently unavailable. Please choose Cash on Delivery.');
        return;
      }
      if (!razorpayLoaded) {
        setError('Payment gateway is loading. Please wait a moment and try again.');
        return;
      }
      handleRazorpayPayment(e);
    }
  };

  const handleConfirmCodFromModal = (e) => {
    setShowCodConfirmModal(false);
    handleCODPayment(e);
  };

  /* Coupon helpers (Domino's / Zomato Benchmark) */
  useEffect(() => {
    let mounted = true;
    const loadActiveCoupons = async () => {
      setLoadingCoupons(true);
      try {
        const res = await api.get('/coupons/active');
        if (mounted && res.data?.data) {
          setAvailableCoupons(Array.isArray(res.data.data) ? res.data.data : []);
        }
      } catch (e) {
        console.warn('Could not load active coupons:', e.message);
      } finally {
        if (mounted) setLoadingCoupons(false);
      }
    };
    loadActiveCoupons();
    return () => { mounted = false; };
  }, []);

  const handleApplyCoupon = async (overrideCode) => {
    const code = (typeof overrideCode === 'string' ? overrideCode : couponCode).trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const orderItems = cartItems.map(item => ({
        product: item._id,
        productType: item.isCombo ? 'Combo' : 'Product',
        quantity: item.quantity,
        packageId: item.packageId || undefined
      }));
      const res = await api.post('/coupons/apply', { code, orderItems });
      const couponData = res.data.data;
      setAppliedCoupon(couponData);
      setCouponCode(code);
      setShowCouponDrawer(false);
      setCouponCelebration(true);
      setTimeout(() => setCouponCelebration(false), 3000);
      toast.success(res.data.message || `Coupon ${code} applied! Saved ₹${couponData.discountAmount}`, {
        duration: 3500,
      });
    } catch (err) {
      setAppliedCoupon(null);
      const msg = err.response?.data?.message || 'Could not apply this coupon.';
      setCouponError(msg);
      toast.error(msg);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    toast('Coupon removed');
  };

  useEffect(() => {
    if (!appliedCoupon) return;
    let cancelled = false;
    const orderItems = cartItems.map(item => ({
      product: item._id,
      productType: item.isCombo ? 'Combo' : 'Product',
      quantity: item.quantity,
      packageId: item.packageId || undefined
    }));
    api.post('/coupons/validate', { code: appliedCoupon.code, orderItems })
      .then(res => { if (!cancelled) setAppliedCoupon(res.data.data); })
      .catch(err => {
        if (cancelled) return;
        const revokedCode = appliedCoupon.code;
        setAppliedCoupon(null);
        const msg = err.response?.data?.message || `Coupon ${revokedCode} revoked: cart total no longer meets criteria.`;
        setCouponError(msg);
        toast.error(msg, { icon: '⚠️' });
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPrice]);

  const selectedSlotInfo = DELIVERY_SLOTS.find(s => s.id === deliverySlot) || DELIVERY_SLOTS[0];

  return (
    <div className="min-h-screen bg-fv-page pb-24 sm:pb-16 pt-3 sm:pt-5">
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8">

        {/* ── Distraction-Free Header ─────────────────────────────── */}
        <header className="mb-4 sm:mb-6 border-b border-fv-border/70 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-4">
              <button
                type="button"
                onClick={() => {
                  if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/cart');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors shadow-2xs cursor-pointer shrink-0"
                title="Return to shopping cart"
                aria-label="Back to Cart"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-fv-primary dark:text-emerald-400" />
                <span className="hidden sm:inline">Back to Cart</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-bold font-serif text-fv-heading dark:text-white leading-none">
                  Fresh Veggies Checkout
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-fv-muted">
              <div className="flex items-center gap-1.5 font-semibold text-gray-600 dark:text-gray-300">
                <Lock className="w-3.5 h-3.5 text-fv-primary" />
                <span>256-Bit SSL Encrypted</span>
              </div>
              <Link
                to="/"
                className="text-xs font-semibold text-fv-primary hover:underline hidden md:inline shrink-0"
              >
                Continue Shopping →
              </Link>
            </div>
          </div>
        </header>

        {/* ── Mobile Sticky Order Summary Accordion Bar (Shopify style) ── */}
        <div className="lg:hidden mb-4">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-fv-border bg-white dark:bg-gray-800 shadow-2xs text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-fv-primary">
              <ShoppingBag className="w-4 h-4" />
              <span>{mobileSummaryOpen ? 'Hide order summary' : 'Show order summary'}</span>
              {mobileSummaryOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-fv-primary/10 text-fv-primary font-bold">
                {cartItems.length}
              </span>
            </div>
            <div className="text-sm font-black text-gray-900 dark:text-white">
              ₹{totalAmount.toLocaleString('en-IN')}
            </div>
          </button>

          {/* Expanded Mobile Summary Drawer */}
          {mobileSummaryOpen && (
            <div className="mt-2 p-4 rounded-2xl border border-fv-border bg-white dark:bg-gray-800 shadow-sm space-y-4">
              <div className="divide-y divide-fv-border/60 max-h-64 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={`${item._id}-${item.packageId || 'def'}`} className="py-2.5 flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={getProductImageUrl(item)}
                        alt={item.name}
                        onError={(e) => handleImageError(e, DEFAULT_PRODUCT_IMAGE)}
                        className="w-12 h-12 object-cover rounded-lg border border-fv-border bg-white"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-fv-primary text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-fv-muted mt-0.5">
                        {item.selectedPackage?.size && (
                          <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-bold">
                            {item.selectedPackage.size}
                          </span>
                        )}
                        <span>₹{item.price} each</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-gray-900 dark:text-white">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Row (Mobile) */}
              <div className="pt-2 space-y-2">
                {appliedCoupon ? (
                  <div className={`flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-2 text-xs transition-all ${couponCelebration ? 'ring-2 ring-emerald-500 scale-[1.01]' : ''}`}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-mono font-bold text-fv-primary-dark dark:text-green-400 truncate">{appliedCoupon.code}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-semibold whitespace-nowrap">−₹{appliedCoupon.discountAmount}</span>
                    </div>
                    <button type="button" onClick={handleRemoveCoupon} className="font-semibold text-red-600 hover:text-red-700 hover:underline shrink-0 ml-2">Remove</button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value); setCouponError(''); }}
                        placeholder="Coupon Code"
                        className="flex-1 h-9 px-3 border border-gray-300 dark:border-gray-600 rounded-lg text-xs uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-3 bg-gray-900 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40"
                      >
                        {couponLoading ? '…' : 'Apply'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowCouponDrawer(true)}
                      className="w-full flex items-center justify-between p-2 rounded-lg border border-dashed border-emerald-400 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-fv-primary" />
                        <span>View Available Coupons</span>
                        {availableCoupons.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-fv-primary text-white text-[10px] font-bold">
                            {availableCoupons.length}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-fv-primary" />
                    </button>
                  </>
                )}
                {couponError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{couponError}</p>
                )}
              </div>

              {/* Mobile Breakdown */}
              <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-fv-border">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{itemsPrice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>{shippingPrice === 0 ? <strong className="text-fv-primary">FREE</strong> : `₹${shippingPrice}`}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-fv-primary font-medium">
                    <span>Coupon Savings</span>
                    <span>−₹{discountAmount}</span>
                  </div>
                )}
                {codExtraFee > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>COD Handling</span>
                    <span>+₹{codExtraFee}</span>
                  </div>
                )}
                {onlineDiscountAmount > 0 && (
                  <div className="flex justify-between text-fv-primary font-medium">
                    <span>Online Discount</span>
                    <span>−₹{onlineDiscountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-2 border-t border-fv-border">
                  <span>Payable Total</span>
                  <span className="text-fv-primary font-black">₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Store Closure Notice */}
        {storeSettings?.maintenance?.isStoreClosed && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h3 className="font-bold text-sm">Storefront Currently Closed</h3>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {storeSettings?.maintenance?.closureNotice || 'Our storefront is currently closed for routine maintenance. Orders cannot be accepted at this time.'}
              </p>
            </div>
          </div>
        )}

        {/* ── Main 2-Column Shopify/Apple Store Layout ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ════════ LEFT COLUMN: Distraction-Free Funnel Steps (Accordion) ════════ */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-5">

            {/* Top Linear Step Breadcrumbs Indicator */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-full px-4 py-2.5 sm:px-6 sm:py-3 border border-gray-200/90 dark:border-gray-700/80 shadow-xs">
              {/* Step 1 Pill */}
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer group"
                title="Step 1: Delivery Address"
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 1
                    ? 'bg-fv-primary text-white ring-4 ring-fv-primary/20 shadow-xs'
                    : currentStep > 1
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>
                  {currentStep > 1 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
                </div>
                <span className={`text-xs font-semibold ${
                  currentStep === 1 ? 'text-fv-primary font-bold' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  1. Address
                </span>
              </button>

              <div className={`flex-1 h-0.5 mx-2 sm:mx-3 transition-colors ${
                currentStep > 1 ? 'bg-fv-primary' : 'bg-gray-200 dark:bg-gray-700'
              }`} />

              {/* Step 2 Pill */}
              <button
                type="button"
                onClick={() => { if (isStep1Valid()) goToStep(2); }}
                className={`flex items-center gap-1.5 sm:gap-2 shrink-0 transition-opacity ${
                  !isStep1Valid() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Step 2: Delivery & Shipping Method"
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 2
                    ? 'bg-fv-primary text-white ring-4 ring-fv-primary/20 shadow-xs'
                    : currentStep > 2
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>
                  {currentStep > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '2'}
                </div>
                <span className={`text-xs font-semibold ${
                  currentStep === 2 ? 'text-fv-primary font-bold' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  2. Shipping
                </span>
              </button>

              <div className={`flex-1 h-0.5 mx-2 sm:mx-3 transition-colors ${
                currentStep > 2 ? 'bg-fv-primary' : 'bg-gray-200 dark:bg-gray-700'
              }`} />

              {/* Step 3 Pill */}
              <button
                type="button"
                onClick={() => { if (isStep1Valid() && isStep2Valid()) goToStep(3); }}
                className={`flex items-center gap-1.5 sm:gap-2 shrink-0 transition-opacity ${
                  !isStep1Valid() || !isStep2Valid() ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
                title="Step 3: Payment & Order Confirmation"
              >
                <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep === 3
                    ? 'bg-fv-primary text-white ring-4 ring-fv-primary/20 shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                }`}>
                  3
                </div>
                <span className={`text-xs font-semibold ${
                  currentStep === 3 ? 'text-fv-primary font-bold' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  3. Payment
                </span>
              </button>
            </div>

            {/* Global Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-3.5 text-xs sm:text-sm text-red-700 dark:text-red-300 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {/* ════ STEP 1: SHIPPING ADDRESS (ACCORDION) ════ */}
            <div className="rounded-2xl border border-fv-border bg-white dark:bg-gray-800 shadow-2xs overflow-hidden transition-all">
              {currentStep > 1 ? (
                /* Collapsed Completed State */
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-fv-muted">
                          Step 1: Delivery Address
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                          ✓ Completed
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5">
                        {resolveShippingAddress().name} • {resolveShippingAddress().phone}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5">
                        {resolveShippingAddress().street}, {resolveShippingAddress().city}, {resolveShippingAddress().state} — {resolveShippingAddress().pincode}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-semibold text-fv-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                /* Expanded Active State */
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Mobile Verification (if guest) */}
                  {!user ? (
                    <GuestMobileOtpStep
                      onVerified={(userData) => {
                        setError('');
                        setNewAddr(a => ({
                          ...a,
                          phone: userData.phone || a.phone,
                          name: getRealName(userData.name) || getRealName(a.name)
                        }));
                      }}
                    />
                  ) : (
                    <div className="rounded-xl border border-green-200 bg-green-50/70 dark:bg-green-950/20 dark:border-green-800/40 p-3 sm:p-3.5 flex items-center justify-between shadow-2xs mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-fv-primary text-white shrink-0">
                          <Check className="h-4 w-4 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-fv-primary dark:text-green-400">
                            Mobile Verified Customer
                          </span>
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                            +91 {user.phone} {getRealName(user.name) ? `(${getRealName(user.name)})` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pb-3 border-b border-fv-border">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fv-cream dark:bg-green-900/30 text-fv-primary shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-fv-heading dark:text-white leading-tight">
                          Step 1: Delivery Address & Contact
                        </h2>
                        <p className="text-xs text-fv-muted mt-0.5">Where should we deliver your farm-fresh produce?</p>
                      </div>
                    </div>
                  </div>

                  <div className={!user ? 'opacity-40 pointer-events-none select-none transition-opacity' : ''}>
                    {/* Saved addresses selector */}
                    {savedAddresses.length > 0 && (
                      <div className="space-y-2.5 mb-4">
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Saved Delivery Addresses
                        </label>
                        {savedAddresses.map(addr => (
                          <div
                            key={addr._id}
                            className={`flex items-start justify-between gap-3 p-3.5 border-2 rounded-xl transition-all ${
                              mode === 'saved' && selectedSavedId === addr._id
                                ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20 shadow-xs'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <label
                              onClick={() => { setMode('saved'); setSelectedSavedId(addr._id); }}
                              className="flex items-start gap-3 flex-1 cursor-pointer min-w-0"
                            >
                              <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                mode === 'saved' && selectedSavedId === addr._id ? 'border-fv-primary bg-fv-primary' : 'border-gray-400'
                              }`}>
                                {mode === 'saved' && selectedSavedId === addr._id && (
                                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {(() => {
                                    const TagInfo = CHECKOUT_ADDRESS_TAGS.find(t => t.id === addr.tag) || CHECKOUT_ADDRESS_TAGS[0];
                                    const TagIcon = TagInfo.Icon;
                                    return (
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${TagInfo.color}`}>
                                        <TagIcon className="w-2.5 h-2.5" />
                                        {addr.tag || 'Home'}
                                      </span>
                                    );
                                  })()}
                                  <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                                    {addr.name || user?.name}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-fv-primary/10 text-fv-primary rounded-full">
                                      <Star className="w-2.5 h-2.5" fill="currentColor" /> Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                                  {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
                                </p>
                                {addr.phone && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                    <Phone className="w-3 h-3 shrink-0" />
                                    <span>{addr.phone}</span>
                                  </p>
                                )}
                              </div>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setNewAddr({
                                  name: getRealName(addr.name) || getRealName(user?.name),
                                  phone: addr.phone || user?.phone || '',
                                  tag: addr.tag || 'Home',
                                  street: addr.street || '',
                                  landmark: addr.landmark || '',
                                  instructions: addr.instructions || '',
                                  city: addr.city || '',
                                  state: addr.state || '',
                                  pincode: addr.pincode || '',
                                });
                                setMode('new');
                                if (addr.pincode && addr.pincode.length === 6) {
                                  lookupPincode(addr.pincode).then(res => {
                                    if (res.valid) setPincodeStatus({ loading: false, valid: true, message: `Verified: ${res.message}` });
                                  }).catch(() => {});
                                }
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-fv-primary hover:bg-fv-primary/10 rounded-lg transition-colors shrink-0"
                            >
                              Edit
                            </button>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            setMode(mode === 'new' ? 'saved' : 'new');
                            if (mode === 'saved') {
                              setNewAddr({
                                name: getRealName(user?.name),
                                phone: user?.phone || '',
                                street: '',
                                city: '',
                                state: '',
                                pincode: '',
                              });
                              setPincodeStatus({ loading: false, valid: null, message: '' });
                            }
                          }}
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 px-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:border-fv-primary hover:text-fv-primary transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {mode === 'new' ? 'Use a saved address instead' : '+ Deliver to a new address'}
                        </button>
                      </div>
                    )}

                    {/* Manual / new address form */}
                    {(mode === 'new' || savedAddresses.length === 0) && (
                      <div className="space-y-3.5 pt-2">
                        {gpsError && (
                          <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-2.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{gpsError}</span>
                          </div>
                        )}

                        <AddressFields
                          addr={newAddr}
                          setAddr={setNewAddr}
                          gpsLoading={gpsLoading}
                          onUseLocation={handleUseLocation}
                          pincodeStatus={pincodeStatus}
                          setPincodeStatus={setPincodeStatus}
                        />

                        <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                          <input
                            type="checkbox"
                            checked={saveNewAddr}
                            onChange={(e) => setSaveNewAddr(e.target.checked)}
                            className="w-4 h-4 rounded text-fv-primary focus:ring-fv-primary border-gray-300 cursor-pointer"
                          />
                          <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                            Save this address to my saved addresses list for future orders
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Step 1 Primary CTA */}
                    <div className="pt-5 border-t border-fv-border mt-5">
                      <button
                        type="button"
                        onClick={handleProceedToShipping}
                        className="w-full h-12 rounded-xl bg-fv-primary hover:bg-fv-primary-dark text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                      >
                        <span>Continue to Delivery Method</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ════ STEP 2: DELIVERY & SHIPPING METHOD (ACCORDION) ════ */}
            <div className="rounded-2xl border border-fv-border bg-white dark:bg-gray-800 shadow-2xs overflow-hidden transition-all">
              {currentStep > 2 ? (
                /* Collapsed Completed State */
                <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-fv-muted">
                          Step 2: Delivery Method & Slot
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200">
                          ✓ Completed
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5">
                        {selectedSlotInfo.title} ({selectedSlotInfo.time})
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5">
                        {shippingPrice === 0 ? 'Free Standard Farm-Fresh Delivery' : `Standard Delivery (₹${shippingPrice})`}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-xs font-semibold text-fv-primary hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shrink-0"
                  >
                    Edit
                  </button>
                </div>
              ) : currentStep === 2 ? (
                /* Expanded Active State */
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-fv-border">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fv-cream dark:bg-green-900/30 text-fv-primary shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-fv-heading dark:text-white leading-tight">
                          Step 2: Delivery Method & Preferred Slot
                        </h2>
                        <p className="text-xs text-fv-muted mt-0.5">Select when and how you would like to receive your harvest</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Speed / Method Card */}
                  <div className="p-3.5 rounded-xl border-2 border-fv-primary bg-fv-cream/50 dark:bg-green-950/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-4 border-fv-primary bg-white" />
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                          Direct Farm-to-Home Fresh Delivery
                        </p>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400">
                          Dispatched directly from hydroponic & organic beds within 24 hours of harvest
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-fv-primary dark:text-green-400">
                      {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}
                    </span>
                  </div>

                  {/* Slot Selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                      Choose Preferred Delivery Slot *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {DELIVERY_SLOTS.map((slot) => {
                        const isSelected = deliverySlot === slot.id;
                        return (
                          <div
                            key={slot.id}
                            onClick={() => setDeliverySlot(slot.id)}
                            className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20 shadow-xs ring-1 ring-fv-primary/30'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-gray-900 dark:text-white">
                                  {slot.title}
                                </span>
                                {slot.badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                    {slot.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-semibold text-fv-primary flex items-center gap-1 mb-1">
                                <Clock className="w-3 h-3" />
                                {slot.time}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                                {slot.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Contactless / Special Gate Instructions */}
                  <div>
                    <label className={labelCls}>Delivery Notes / Gate Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Leave with building security / Ring bell twice"
                      value={deliveryNotes}
                      onChange={e => setDeliveryNotes(e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  {/* Step 2 Action Buttons */}
                  <div className="pt-4 border-t border-fv-border flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => goToStep(1)}
                      className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      ← Back to Address
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={integrityLoading}
                      className="px-5 py-2.5 rounded-xl bg-fv-primary hover:bg-fv-primary-dark text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-[0.99] cursor-pointer disabled:opacity-50"
                    >
                      {integrityLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying Cart…</span>
                        </>
                      ) : (
                        <>
                          <span>Continue to Payment</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Collapsed Inactive State (Step < 2) */
                <div className="p-4 sm:p-5 flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Step 2: Delivery Method & Preferred Slot
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">Complete Step 1 first</span>
                </div>
              )}
            </div>

            {/* ════ STEP 3: PAYMENT & CONFIRMATION (ACCORDION) ════ */}
            <div className="rounded-2xl border border-fv-border bg-white dark:bg-gray-800 shadow-2xs overflow-hidden transition-all">
              {currentStep === 3 ? (
                /* Expanded Active State */
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-fv-border">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fv-cream dark:bg-green-900/30 text-fv-primary shrink-0">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-fv-heading dark:text-white leading-tight">
                          Step 3: Choose Payment Method & Place Order
                        </h2>
                        <p className="text-xs text-fv-muted mt-0.5">Encrypted transaction with instant order receipt</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    {/* COD Option */}
                    {COD_AVAILABLE ? (
                      <label className={`flex items-start justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMode === 'COD'
                          ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20 shadow-xs'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}>
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="COD"
                            checked={paymentMode === 'COD'}
                            onChange={e => setPaymentMode(e.target.value)}
                            className="mt-1 w-4 h-4 text-fv-primary focus:ring-fv-primary"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm text-gray-900 dark:text-white">Cash on Delivery (COD)</p>
                              {COD_EXTRA_CHARGE > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                  +₹{COD_EXTRA_CHARGE} handling
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Pay securely with Cash or UPI when your parcel is delivered {COD_MAX_ORDER ? `(orders up to ₹${COD_MAX_ORDER})` : ''}
                            </p>
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div className="p-3.5 rounded-xl border border-gray-200 text-gray-400 text-xs bg-gray-50 dark:bg-gray-800">
                        Cash on Delivery is currently unavailable
                      </div>
                    )}

                    {/* Online Payment Option */}
                    {ONLINE_AVAILABLE ? (
                      <label className={`flex items-start justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMode === 'Online'
                          ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20 shadow-xs'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}>
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="Online"
                            checked={paymentMode === 'Online'}
                            onChange={e => setPaymentMode(e.target.value)}
                            className="mt-1 w-4 h-4 text-fv-primary focus:ring-fv-primary"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm text-gray-900 dark:text-white">Online Payment (UPI, Cards, Net Banking)</p>
                              {ONLINE_DISCOUNT_VALUE > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                  {ONLINE_DISCOUNT_TYPE === 'percentage' ? `${ONLINE_DISCOUNT_VALUE}% Extra OFF` : `₹${ONLINE_DISCOUNT_VALUE} OFF`}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              Google Pay, PhonePe, Paytm, BHIM UPI, Credit/Debit Cards & Net Banking via Razorpay
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>100% Secure • Instant Payment Verification</span>
                            </div>
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div className="p-3.5 rounded-xl border border-gray-200 text-gray-400 text-xs bg-gray-50 dark:bg-gray-800">
                        Online Payment is currently unavailable
                      </div>
                    )}
                  </div>

                  {/* Summary Review Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl border border-fv-border bg-gray-50 dark:bg-gray-700/40 text-xs">
                      <div className="flex justify-between font-bold text-gray-700 dark:text-gray-300 mb-1">
                        <span>Delivering to</span>
                        <button type="button" onClick={() => goToStep(1)} className="text-fv-primary hover:underline">Change</button>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white truncate">{resolveShippingAddress().name}</p>
                      <p className="text-gray-600 dark:text-gray-400 truncate">{resolveShippingAddress().street}, {resolveShippingAddress().city}</p>
                    </div>

                    <div className="p-3 rounded-xl border border-fv-border bg-gray-50 dark:bg-gray-700/40 text-xs">
                      <div className="flex justify-between font-bold text-gray-700 dark:text-gray-300 mb-1">
                        <span>Delivery Slot</span>
                        <button type="button" onClick={() => goToStep(2)} className="text-fv-primary hover:underline">Change</button>
                      </div>
                      <p className="font-bold text-gray-900 dark:text-white">{selectedSlotInfo.title}</p>
                      <p className="text-gray-600 dark:text-gray-400">{selectedSlotInfo.time}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-fv-border flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      ← Back to Shipping
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !user || integrityLoading}
                      className="w-full sm:flex-1 h-12 sm:h-13 rounded-xl bg-fv-primary hover:bg-fv-primary-dark active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Processing Order…</span>
                        </>
                      ) : paymentMode === 'COD' ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Place Order (Cash on Delivery) • ₹{totalAmount.toLocaleString('en-IN')}</span>
                        </>
                      ) : paymentMode === 'Online' ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          <span>Proceed to Pay ₹{totalAmount.toLocaleString('en-IN')} via Razorpay</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>Select Payment Method • ₹{totalAmount.toLocaleString('en-IN')}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-fv-muted dark:text-gray-400 flex items-center justify-center gap-1 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-fv-primary shrink-0" />
                    <span>256-bit encrypted checkout • Zero spam guarantee</span>
                  </p>
                </form>
              ) : (
                /* Collapsed Inactive State (Step < 3) */
                <div className="p-4 sm:p-5 flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Step 3: Payment Method & Place Order
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">Complete previous steps first</span>
                </div>
              )}
            </div>

          </div>

          {/* ════════ RIGHT COLUMN: Sticky Order Summary (Shopify / Apple Store) ════════ */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-6">
            <div className="rounded-2xl border border-fv-border bg-white dark:bg-gray-800 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-fv-border">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-fv-primary" />
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Order Summary
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </span>
              </div>

              {/* Items Table with quantity badge */}
              <div className="divide-y divide-fv-border/60 max-h-80 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={`${item._id}-${item.packageId || 'def'}`} className="py-3 flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={getProductImageUrl(item)}
                        alt={item.name}
                        onError={(e) => handleImageError(e, DEFAULT_PRODUCT_IMAGE)}
                        className="w-12 h-12 object-cover rounded-xl border border-fv-border bg-white"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-fv-primary text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                        {item.quantity}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-fv-muted mt-0.5">
                        {item.selectedPackage?.size && (
                          <span className="px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-[10px] font-bold">
                            {item.selectedPackage.size}
                          </span>
                        )}
                        <span>₹{item.price} each</span>
                        {item.originalPrice && item.originalPrice > item.price && (
                          <span className="line-through text-gray-400">₹{item.originalPrice}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Section (Domino's / Zomato Benchmark) */}
              <div className="border-t border-fv-border pt-3 space-y-2.5">
                {appliedCoupon ? (
                  <div className={`flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3.5 py-2.5 transition-all ${couponCelebration ? 'ring-2 ring-emerald-500 scale-[1.02]' : ''}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-fv-primary dark:text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60">
                            {appliedCoupon.code}
                          </span>
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">
                            −₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium truncate mt-0.5">
                          You saved ₹{appliedCoupon.discountAmount.toLocaleString('en-IN')} on this order!
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline shrink-0 ml-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value); setCouponError(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                        placeholder="Coupon Code"
                        className="flex-1 h-10 px-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl uppercase text-xs focus:ring-2 focus:ring-fv-primary focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={couponLoading || !couponCode.trim()}
                        className="h-10 px-3.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold disabled:opacity-40 shrink-0 transition-colors cursor-pointer"
                      >
                        {couponLoading ? '…' : 'Apply'}
                      </button>
                    </div>

                    {/* Domino's / Zomato: View Available Coupons Drawer Trigger */}
                    <button
                      type="button"
                      onClick={() => setShowCouponDrawer(true)}
                      className="w-full flex items-center justify-between p-2 rounded-xl border border-dashed border-emerald-400 dark:border-emerald-700/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-all text-xs font-medium cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-fv-primary" />
                        <span>View Available Coupons & Offers</span>
                        {availableCoupons.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-fv-primary text-white text-[10px] font-bold">
                            {availableCoupons.length}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-fv-primary" />
                    </button>

                    {/* Quick-Apply Suggestion Chips */}
                    {availableCoupons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {availableCoupons.slice(0, 2).map((c) => {
                          const minReq = c.minOrderAmount || c.minOrderValue || 0;
                          const isEligible = itemsPrice >= minReq;
                          return (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => handleApplyCoupon(c.code)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800 text-[11px] text-gray-700 dark:text-gray-300 hover:border-fv-primary hover:text-fv-primary transition-all cursor-pointer shadow-2xs"
                              title={isEligible ? `Apply ${c.code}` : `Add ₹${minReq - itemsPrice} more to unlock`}
                            >
                              <Tag className="w-3 h-3 text-fv-primary" />
                              <span className="font-mono font-bold">{c.code}</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                                {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
                {couponError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{couponError}</p>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="border-t border-fv-border pt-3 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-white">₹{itemsPrice.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Delivery Charges</span>
                  <span className="font-semibold">
                    {shippingPrice === 0 ? (
                      <span className="text-fv-primary dark:text-green-400 font-bold">FREE</span>
                    ) : (
                      `₹${shippingPrice}`
                    )}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-fv-primary dark:text-green-400 font-medium">
                    <span>Coupon Savings ({appliedCoupon?.code})</span>
                    <span className="font-bold">−₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {codExtraFee > 0 && (
                  <div className="flex justify-between text-amber-700 dark:text-amber-400 font-medium">
                    <span>COD Handling Fee</span>
                    <span>+₹{codExtraFee.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {onlineDiscountAmount > 0 && (
                  <div className="flex justify-between text-fv-primary dark:text-green-400 font-medium">
                    <span>Online Payment Discount</span>
                    <span className="font-bold">−₹{onlineDiscountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-[11px] text-gray-500 pt-1">
                  <span>Estimated Taxes</span>
                  <span>Included in prices</span>
                </div>

                {/* Grand Total */}
                <div className="border-t border-fv-border pt-3 mt-2 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Final Payable Total</span>
                  <span className="text-xl font-black text-fv-primary dark:text-green-400">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="border-t border-fv-border/80 pt-3 text-[11px] text-gray-500 dark:text-gray-400 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-fv-primary shrink-0" />
                  <span>100% Secure Encrypted Payment Gateway</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-fv-primary shrink-0" />
                  <span>Fresh Harvest Guarantee or Free Replacement</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── Cart Integrity Warning Modal (Edge Case: Price/Stock changes during checkout) ── */}
        {showIntegrityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-fv-border p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 animate-spin-reverse" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Cart & Price Updates Detected
                  </h3>
                  <p className="text-xs text-fv-muted mt-0.5">
                    Live catalog updates occurred while you were shopping. Please review the updated rates before paying.
                  </p>
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto divide-y divide-fv-border/60 rounded-xl border border-fv-border/80 p-2 bg-gray-50 dark:bg-gray-900/40 text-xs">
                {integrityChanges.map((change, idx) => (
                  <div key={idx} className="py-2 px-1">
                    <p className="font-bold text-gray-900 dark:text-white">{change.name}</p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">{change.message}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowIntegrityModal(false);
                    navigate('/cart');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Review in Cart
                </button>
                <button
                  type="button"
                  onClick={handleAcceptIntegrityUpdates}
                  className="px-4 py-2 rounded-xl bg-fv-primary hover:bg-fv-primary-dark text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Accept Updates & Proceed
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Flipkart / Myntra Style Double-Confirmation Modal for COD Orders ── */}
        {showCodConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-fv-border p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-green-950/50 text-fv-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-fv-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white">
                    Confirm Cash on Delivery Order
                  </h3>
                  <p className="text-xs text-fv-muted mt-0.5">
                    Review your delivery details and payable amount before final confirmation.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-fv-border/80 p-3.5 bg-gray-50 dark:bg-gray-900/40 text-xs space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">Receiver:</span>
                  <span className="font-bold text-gray-900 dark:text-white truncate">{resolveShippingAddress().name}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">Delivery Address:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[210px] text-right">
                    {resolveShippingAddress().street}, {resolveShippingAddress().city} ({resolveShippingAddress().pincode})
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-gray-500 font-medium">Preferred Slot:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedSlotInfo.title}</span>
                </div>
                {codExtraFee > 0 && (
                  <div className="flex justify-between items-baseline text-amber-700 dark:text-amber-400 font-medium pt-1.5 border-t border-gray-200 dark:border-gray-700">
                    <span>COD Handling Surcharge:</span>
                    <span>+₹{codExtraFee.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-sm font-black text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Payable at Doorstep:</span>
                  <span className="text-base font-black text-fv-primary dark:text-green-400">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                💡 <strong>Doorstep Payment:</strong> You can pay with Cash or UPI directly to our delivery courier. No upfront payment required.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCodConfirmModal(false)}
                  className="px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Review Order
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmCodFromModal}
                  className="px-4 py-2.5 rounded-xl bg-fv-primary hover:bg-fv-primary-dark text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Placing Order…</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Confirm & Place Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Domino's / Zomato Interactive "Apply Coupon" Drawer ── */}
        {showCouponDrawer && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div
              className="fixed inset-0"
              onClick={() => setShowCouponDrawer(false)}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-md h-full bg-white dark:bg-gray-900 shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-fv-border flex items-center justify-between bg-gradient-to-r from-emerald-50/80 via-white to-amber-50/30 dark:from-emerald-950/40 dark:via-gray-900 dark:to-gray-900">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-fv-primary text-white flex items-center justify-center shadow-xs">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900 dark:text-white flex items-center gap-2">
                      Apply Coupon
                      {availableCoupons.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary text-xs font-bold">
                          {availableCoupons.length} Offers
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-fv-muted">
                      Select an offer to save on your fresh harvest
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCouponDrawer(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Coupon Search / Input bar in Drawer */}
              <div className="p-4 border-b border-fv-border bg-gray-50/60 dark:bg-gray-800/40">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleApplyCoupon();
                      }
                    }}
                    placeholder="ENTER COUPON CODE"
                    className="flex-1 h-11 px-3.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl uppercase text-xs font-mono font-bold tracking-wider focus:ring-2 focus:ring-fv-primary focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleApplyCoupon()}
                    disabled={couponLoading || !couponCode.trim()}
                    className="h-11 px-4 bg-fv-primary hover:bg-fv-primary-dark text-white rounded-xl text-xs font-bold disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'APPLY'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-medium">
                    {couponError}
                  </p>
                )}
              </div>

              {/* Coupon Cards List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Available Offers & Vouchers</span>
                  <span>Basket: ₹{itemsPrice}</span>
                </div>

                {loadingCoupons ? (
                  <div className="py-12 flex flex-col items-center justify-center text-fv-muted gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-fv-primary" />
                    <span className="text-xs">Finding available offers…</span>
                  </div>
                ) : availableCoupons.length === 0 ? (
                  <div className="py-12 text-center text-fv-muted space-y-2">
                    <Gift className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      No active coupons right now
                    </p>
                    <p className="text-xs max-w-xs mx-auto">
                      Check back during our seasonal harvest campaigns or enter a private promo code above.
                    </p>
                  </div>
                ) : (
                  availableCoupons.map((c) => {
                    const minReq = c.minOrderAmount || c.minOrderValue || 0;
                    const isEligible = itemsPrice >= minReq;
                    const isApplied = appliedCoupon?.code === c.code;
                    const isPercentage = c.discountType === 'percentage' || c.discountType === 'PERCENTAGE';
                    const maxCap = c.maxDiscountAmount || c.maxDiscount;
                    const potentialSavings = isPercentage
                      ? Math.min(Math.round((itemsPrice * c.discountValue) / 100), maxCap || Infinity)
                      : Math.min(c.discountValue, itemsPrice);

                    return (
                      <div
                        key={c.code}
                        className={`rounded-2xl border transition-all relative overflow-hidden p-4 ${
                          isApplied
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-2 ring-emerald-500/30'
                            : isEligible
                            ? 'border-dashed border-emerald-400 dark:border-emerald-700 bg-white dark:bg-gray-800 hover:border-fv-primary hover:shadow-md'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40 opacity-80'
                        }`}
                      >
                        {/* Decorative notch cutout circles */}
                        <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 pointer-events-none" />
                        <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 pointer-events-none" />

                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs px-2.5 py-1 rounded-md bg-fv-primary text-white tracking-wider shadow-2xs">
                                {c.code}
                              </span>
                              {isApplied && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" /> APPLIED
                                </span>
                              )}
                            </div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white pt-1">
                              {isPercentage
                                ? `Save ${c.discountValue}% OFF${maxCap ? ` (up to ₹${maxCap})` : ''}`
                                : `Flat ₹${c.discountValue} OFF`}
                            </h4>
                            {c.description && (
                              <p className="text-xs text-fv-muted leading-relaxed">
                                {c.description}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0 pt-0.5">
                            {isApplied ? (
                              <button
                                type="button"
                                onClick={handleRemoveCoupon}
                                className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            ) : isEligible ? (
                              <button
                                type="button"
                                onClick={() => handleApplyCoupon(c.code)}
                                disabled={couponLoading}
                                className="px-3.5 py-1.5 rounded-xl bg-fv-primary hover:bg-fv-primary-dark text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1"
                              >
                                <span>APPLY</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                                Locked
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Terms and Savings breakdown */}
                        <div className="mt-3 pt-2.5 border-t border-dashed border-gray-200 dark:border-gray-700 text-[11px] flex items-center justify-between">
                          <span className="text-gray-500 dark:text-gray-400">
                            {minReq > 0 ? `Orders above ₹${minReq}` : 'No minimum order'}
                          </span>
                          {isEligible ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                              Save ₹{potentialSavings}!
                            </span>
                          ) : (
                            <span className="text-amber-700 dark:text-amber-400 font-medium">
                              Add ₹{minReq - itemsPrice} more to unlock
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-fv-border bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between text-xs text-fv-muted">
                <span>💡 1 coupon per order applicable</span>
                <button
                  type="button"
                  onClick={() => setShowCouponDrawer(false)}
                  className="font-bold text-gray-700 dark:text-gray-200 hover:underline cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Checkout;
