import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, MapPin, Package, AlertCircle, CheckCircle, Tag,
  Navigation, Loader2, Plus, Star, Check, Lock, ChevronDown, ChevronUp, ShieldCheck
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import api from '../utils/api';
import { fetchCurrentAddress } from '../utils/locationService';
import { lookupPincode, isValidPincodeFormat } from '../utils/pincodeService';
import GuestMobileOtpStep from '../components/checkout/GuestMobileOtpStep';

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
            placeholder="Flat / House no., Street, Area, Landmark"
            value={addr.street || ''}
            onChange={e => setAddr(a => ({ ...a, street: e.target.value }))}
            className={inputCls}
          />
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
  const { cartItems, getCartTotal, clearCart, cartReady } = useCart();
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
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [pincodeStatus, setPincodeStatus] = useState({ loading: false, valid: null, message: '' });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [saveNewAddr, setSaveNewAddr] = useState(true);

  // Mobile Order Summary items expansion
  const [showAllItems, setShowAllItems] = useState(false);

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
  }, [user]);

  /* Payment state */
  const [paymentMode, setPaymentMode] = useState('COD');

  /* Coupon state */
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

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

  /* Resolve the shipping address for order submission */
  const resolveShippingAddress = () => {
    if (mode === 'saved' && selectedSavedId) {
      const saved = savedAddresses.find(a => a._id === selectedSavedId);
      if (saved) {
        return {
          name: getRealName(saved.name) || getRealName(user?.name),
          phone: saved.phone || user?.phone || '',
          street: saved.street,
          city: saved.city,
          state: saved.state,
          pincode: saved.pincode,
          country: saved.country || 'India',
        };
      }
    }
    return { ...newAddr, name: getRealName(newAddr.name), country: 'India' };
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

      // Auto-save new address if user opted in
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
              navigate(`/orders/${verifyResponse.data.data._id}`, {
                state: { success: true, message: 'Payment successful! Order confirmed.' }
              });
            }
          } catch (verifyError) {
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
        theme: { color: '#16a34a' }
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

      // Auto-save new address if user opted in
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
      };

      const response = await api.post('/orders', orderData);
      clearCart();
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

  /* Pricing calculations */
  const FREE_DELIVERY_THRESHOLD = storeSettings?.delivery?.freeDeliveryThreshold ?? 300;
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

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!user) {
      setError('Please complete Step 1 (Mobile Verification) before continuing.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const shippingAddress = resolveShippingAddress();
    if (!shippingAddress.name?.trim() || isPlaceholderName(shippingAddress.name)) {
      setError('Please enter your actual Full Name (e.g. Rahul Sharma) in the Delivery Address (Step 2).');
      const nameInput = document.getElementById('shipping-name-input');
      if (nameInput) {
        nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        nameInput.focus();
      }
      return;
    }

    if (!shippingAddress.phone?.trim() || !shippingAddress.street?.trim() || !shippingAddress.city?.trim() || !shippingAddress.state?.trim() || !shippingAddress.pincode?.trim()) {
      setError('Please provide a complete delivery address (Name, Phone, Street, City, State, PIN Code) in Step 2.');
      return;
    }

    if (!isValidPincodeFormat(shippingAddress.pincode)) {
      setError('Please enter a valid 6-digit Indian PIN code (e.g. 452001).');
      return;
    }

    if (mode === 'new' && pincodeStatus?.valid === false) {
      setError(pincodeStatus.message || 'Invalid PIN code. Please check and enter a valid PIN code.');
      return;
    }

    if (MIN_ORDER_AMOUNT && itemsPrice < MIN_ORDER_AMOUNT) {
      setError(`Minimum order amount is ₹${MIN_ORDER_AMOUNT}. Current items total is ₹${itemsPrice}.`);
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
      handleCODPayment(e);
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

  /* Coupon helpers */
  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponError('');
    setCouponLoading(true);
    try {
      const res = await api.post('/coupons/validate', { code, orderAmount: itemsPrice });
      setAppliedCoupon(res.data.data);
      setCouponCode(code);
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.response?.data?.message || 'Could not apply this coupon.');
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  useEffect(() => {
    if (!appliedCoupon) return;
    let cancelled = false;
    api.post('/coupons/validate', { code: appliedCoupon.code, orderAmount: itemsPrice })
      .then(res => { if (!cancelled) setAppliedCoupon(res.data.data); })
      .catch(err => {
        if (cancelled) return;
        setAppliedCoupon(null);
        setCouponError(err.response?.data?.message || 'Coupon is no longer valid for this basket.');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPrice]);

  /* ── Order Summary Card Component (Proportional & Responsive) ─────────── */
  const renderOrderSummaryContent = (isMobileInline = false) => {
    const displayedItems = (!isMobileInline || showAllItems) ? cartItems : cartItems.slice(0, 2);

    return (
      <div className="space-y-4">
        {/* Items Preview */}
        <div className="space-y-2.5">
          {displayedItems.map(item => (
            <div key={`${item._id}-${item.isCombo}`} className="flex justify-between items-start text-xs sm:text-sm gap-2">
              <div className="min-w-0 flex-1">
                <span className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1">
                  {item.name}
                </span>
                <span className="text-[11px] text-fv-muted dark:text-gray-400">
                  Qty: {item.quantity} {item.selectedPackage ? `(${item.selectedPackage.size})` : ''}
                </span>
              </div>
              <span className="font-bold text-gray-900 dark:text-white shrink-0">
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </span>
            </div>
          ))}

          {/* Toggle for mobile when > 2 items */}
          {isMobileInline && cartItems.length > 2 && (
            <button
              type="button"
              onClick={() => setShowAllItems(v => !v)}
              className="flex items-center gap-1 text-xs font-semibold text-fv-primary hover:text-fv-primary-dark pt-1"
            >
              {showAllItems ? (
                <><span>Show less</span> <ChevronUp className="w-3.5 h-3.5" /></>
              ) : (
                <><span>View all {cartItems.length} items</span> <ChevronDown className="w-3.5 h-3.5" /></>
              )}
            </button>
          )}
        </div>

        {/* Coupon Code Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          {appliedCoupon ? (
            <div className="flex items-center justify-between bg-fv-cream dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Tag className="w-3.5 h-3.5 text-fv-primary shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-fv-primary-dark dark:text-green-400 truncate">
                  {appliedCoupon.code}
                </span>
                <span className="text-xs text-fv-primary dark:text-green-500 font-semibold whitespace-nowrap">
                  −₹{appliedCoupon.discountAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-xs font-semibold text-gray-500 hover:text-red-600 shrink-0 ml-2 p-1"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={e => { setCouponCode(e.target.value); setCouponError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                placeholder="Coupon code"
                className="flex-1 h-11 px-3.5 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl uppercase text-base sm:text-sm focus:ring-2 focus:ring-fv-primary focus:outline-none shadow-2xs"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="h-11 px-4 sm:px-5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-40 shrink-0 transition-colors active:scale-[0.98]"
              >
                {couponLoading ? '…' : 'Apply'}
              </button>
            </div>
          )}
          {couponError && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">{couponError}</p>
          )}
        </div>

        {/* Price Breakdown */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2 text-xs sm:text-sm">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Subtotal</span>
            <span className="font-semibold text-gray-900 dark:text-white">₹{itemsPrice.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Delivery Fee</span>
            <span className="font-semibold">
              {shippingPrice === 0 ? (
                <span className="text-fv-primary dark:text-green-400 font-bold">FREE</span>
              ) : (
                `₹${shippingPrice}`
              )}
            </span>
          </div>

          {shippingPrice === 0 ? (
            <p className="text-[11px] text-fv-primary dark:text-green-400 font-medium">🎉 Free delivery applied on your order!</p>
          ) : (
            <p className="text-[11px] text-fv-muted dark:text-gray-400">
              Add ₹{FREE_DELIVERY_THRESHOLD - itemsPrice} more for FREE delivery
            </p>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between text-fv-primary dark:text-green-400 font-medium">
              <span>Coupon Discount ({appliedCoupon?.code})</span>
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

          {/* Grand Total */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-2.5 mt-1">
            <div className="flex justify-between items-baseline text-base sm:text-lg font-bold">
              <span className="text-gray-900 dark:text-white">Total Amount</span>
              <span className="text-fv-primary dark:text-green-400 text-lg sm:text-xl font-black">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── Proportional Place Order CTA Button ── */
  const renderPlaceOrderButton = () => (
    <button
      type="submit"
      disabled={loading || !user}
      className="w-full h-12 sm:h-13 rounded-xl bg-fv-primary hover:bg-fv-primary-dark active:scale-[0.99] text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Placing Order…</span>
        </>
      ) : !user ? (
        <>
          <Lock className="w-4 h-4" />
          <span>Verify Mobile to Continue</span>
        </>
      ) : (
        <>
          <CheckCircle className="w-5 h-5" />
          <span>Place Order • ₹{totalAmount.toLocaleString('en-IN')}</span>
        </>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-fv-page pb-24 sm:pb-16 pt-4 sm:pt-6">
      <div className="mx-auto max-w-[1100px] px-3.5 sm:px-6 lg:px-8">

        {/* ── Page Header & Step Progress Bar ── */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif text-fv-heading dark:text-white mb-3 sm:mb-4">
            Checkout
          </h1>

          {/* Clean Step Breadcrumbs */}
          <div className="flex items-center justify-between max-w-sm sm:max-w-md bg-white dark:bg-gray-800 rounded-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-200/90 dark:border-gray-700/80 shadow-xs">
            {/* Step 1 Pill */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                user ? 'bg-fv-primary text-white shadow-xs' : 'bg-fv-primary text-white ring-4 ring-fv-primary/20 shadow-xs'
              }`}>
                {user ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" /> : '1'}
              </div>
              <span className={`text-[11px] sm:text-xs font-semibold ${user ? 'text-gray-900 dark:text-white' : 'text-fv-primary font-bold'}`}>
                Mobile
              </span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 transition-colors ${user ? 'bg-fv-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />

            {/* Step 2 Pill */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                user ? (resolveShippingAddress().street ? 'bg-fv-primary text-white shadow-xs' : 'bg-fv-primary/10 text-fv-primary border-2 border-fv-primary ring-4 ring-fv-primary/20') : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }`}>
                {user && resolveShippingAddress().street ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" /> : '2'}
              </div>
              <span className={`text-[11px] sm:text-xs font-semibold ${user ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                Address
              </span>
            </div>

            <div className={`flex-1 h-0.5 mx-2 transition-colors ${user && resolveShippingAddress().street ? 'bg-fv-primary' : 'bg-gray-200 dark:bg-gray-700'}`} />

            {/* Step 3 Pill */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                user && resolveShippingAddress().street ? 'bg-fv-primary/10 text-fv-primary border-2 border-fv-primary ring-4 ring-fv-primary/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }`}>
                3
              </div>
              <span className={`text-[11px] sm:text-xs font-semibold ${user && resolveShippingAddress().street ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                Payment
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 p-3.5 text-xs sm:text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* ── Main Form ── */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 items-start">

            {/* ── Primary Column (Steps 1, 2 on desktop; plus 3 & 4 on mobile) ── */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-5">

              {/* ── STEP 1: Mobile Verification ────────────────────────── */}
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
                <div className="rounded-2xl border border-green-200 bg-green-50/70 dark:bg-green-950/20 dark:border-green-800/40 p-3.5 sm:p-4 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-fv-primary text-white shrink-0">
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.5]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-fv-primary dark:text-green-400">
                          Step 1 Completed
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">• Mobile Verified</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate mt-0.5">
                        +91 {user.phone} {getRealName(user.name) ? `(${getRealName(user.name)})` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Delivery Address ──────────────────────────── */}
              <div className="rounded-2xl border border-fv-border bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fv-cream dark:bg-green-900/30 text-fv-primary shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-fv-primary text-white">
                        Step 2
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-fv-heading dark:text-white leading-tight">
                        Delivery Address
                      </h2>
                    </div>
                  </div>
                  {!user && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <div className={!user ? 'opacity-40 pointer-events-none select-none transition-opacity' : ''}>
                  {/* Saved addresses list */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {savedAddresses.map(addr => (
                        <div
                          key={addr._id}
                          className={`flex items-start justify-between gap-2.5 sm:gap-3 p-3 sm:p-3.5 border-2 rounded-xl transition-all ${
                            mode === 'saved' && selectedSavedId === addr._id
                              ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <label
                            onClick={() => { setMode('saved'); setSelectedSavedId(addr._id); }}
                            className="flex items-start gap-2.5 sm:gap-3 flex-1 cursor-pointer min-w-0"
                          >
                            <div className={`mt-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              mode === 'saved' && selectedSavedId === addr._id ? 'border-fv-primary bg-fv-primary' : 'border-gray-400'
                            }`}>
                              {mode === 'saved' && selectedSavedId === addr._id && (
                                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                                  {addr.name || user?.name}
                                </span>
                                {addr.isDefault && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-fv-primary/10 text-fv-primary rounded-full">
                                    <Star className="w-2.5 h-2.5" fill="currentColor" /> Default
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                                {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
                              </p>
                              {addr.phone && (
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">📞 {addr.phone}</p>
                              )}
                            </div>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setNewAddr({
                                name: getRealName(addr.name) || getRealName(user?.name),
                                phone: addr.phone || user?.phone || '',
                                street: addr.street || '',
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

                      {/* Add new address toggle */}
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
                        {mode === 'new' ? 'Use saved address instead' : 'Add / use a different address'}
                      </button>
                    </div>
                  )}

                  {/* New / manual address form */}
                  {(mode === 'new' || savedAddresses.length === 0) && (
                    <div className="space-y-3">
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
                        <div
                          className={`w-4 h-4 sm:w-5 sm:h-5 rounded flex items-center justify-center border-2 transition-colors ${
                            saveNewAddr ? 'bg-fv-primary border-fv-primary' : 'border-gray-300'
                          }`}
                          onClick={() => setSaveNewAddr(v => !v)}
                        >
                          {saveNewAddr && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          Save this address for future orders
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* ── STEP 3 ON MOBILE: Order Summary (Between Address and Payment) ── */}
              <div className="block lg:hidden rounded-2xl border border-fv-border bg-white dark:bg-gray-800 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fv-cream dark:bg-green-900/30 text-fv-primary shrink-0">
                      <Package className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-fv-primary text-white">
                        Step 3
                      </span>
                      <h2 className="text-base font-bold text-fv-heading dark:text-white leading-tight">
                        Order Summary
                      </h2>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {renderOrderSummaryContent(true)}
              </div>

              {/* ── STEP 4: Payment Method ──────────────────────────── */}
              <div className="rounded-2xl border border-fv-border bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fv-cream dark:bg-green-900/30 text-fv-primary shrink-0">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex lg:hidden items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-fv-primary text-white">
                        Step 4
                      </span>
                      <h2 className="text-base sm:text-lg font-bold text-fv-heading dark:text-white leading-tight">
                        Payment Method
                      </h2>
                    </div>
                  </div>
                  {!user && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  )}
                </div>

                <div className={!user ? 'opacity-40 pointer-events-none select-none transition-opacity' : ''}>
                  <div className="space-y-2.5">
                    {/* COD Option */}
                    {COD_AVAILABLE ? (
                      <label className={`flex items-start justify-between p-3 sm:p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMode === 'COD'
                          ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="COD"
                            checked={paymentMode === 'COD'}
                            onChange={e => setPaymentMode(e.target.value)}
                            className="mt-0.5 w-4 h-4 text-fv-primary"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Cash on Delivery (COD)</p>
                              {COD_EXTRA_CHARGE > 0 && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                  +₹{COD_EXTRA_CHARGE}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              Pay cash or UPI when your parcel arrives {COD_MAX_ORDER ? `(up to ₹${COD_MAX_ORDER})` : ''}
                            </p>
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div className="p-3 rounded-xl border border-gray-200 text-gray-400 text-xs bg-gray-50 dark:bg-gray-800">
                        Cash on Delivery is currently unavailable
                      </div>
                    )}

                    {/* Online Payment Option */}
                    {ONLINE_AVAILABLE ? (
                      <label className={`flex items-start justify-between p-3 sm:p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                        paymentMode === 'Online'
                          ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}>
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="Online"
                            checked={paymentMode === 'Online'}
                            onChange={e => setPaymentMode(e.target.value)}
                            className="mt-0.5 w-4 h-4 text-fv-primary"
                          />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Online Payment (Razorpay)</p>
                              {ONLINE_DISCOUNT_VALUE > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                  {ONLINE_DISCOUNT_TYPE === 'percentage' ? `${ONLINE_DISCOUNT_VALUE}% Extra OFF` : `₹${ONLINE_DISCOUNT_VALUE} OFF`}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                              UPI (GPay, PhonePe, Paytm), Cards & Net Banking
                            </p>
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div className="p-3 rounded-xl border border-gray-200 text-gray-400 text-xs bg-gray-50 dark:bg-gray-800">
                        Online Payment is currently unavailable
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── STEP 5 ON MOBILE: Final Place Order Card ──────────── */}
              <div className="block lg:hidden rounded-2xl border border-fv-border bg-white dark:bg-gray-800 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fv-cream dark:bg-green-900/30 text-fv-primary shrink-0">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold bg-fv-primary text-white">
                        Step 5
                      </span>
                      <h2 className="text-base font-bold text-fv-heading dark:text-white leading-tight">
                        Place Order
                      </h2>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-fv-primary dark:text-green-400">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700/40 p-2.5 rounded-xl text-gray-600 dark:text-gray-300">
                  <span>Paying via: <strong className="text-gray-900 dark:text-white">{paymentMode === 'COD' ? 'Cash on Delivery' : 'Online Payment (Razorpay)'}</strong></span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</span>
                </div>

                {renderPlaceOrderButton()}

                <p className="text-[11px] text-center text-fv-muted dark:text-gray-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-fv-primary shrink-0" />
                  <span>256-bit encrypted checkout • Instant order confirmation</span>
                </p>
              </div>
            </div>

            {/* ── Desktop Right Column: Sticky Order Summary & CTA ──── */}
            <div className="hidden lg:block lg:col-span-1 lg:sticky lg:top-24 space-y-4">
              <div className="rounded-2xl border border-fv-border bg-white dark:bg-gray-800 p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fv-cream dark:bg-green-900/30 text-fv-primary shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-bold text-fv-heading dark:text-white">
                    Order Summary
                  </h2>
                </div>

                {renderOrderSummaryContent(false)}

                <div className="mt-5">
                  {renderPlaceOrderButton()}
                </div>
              </div>
            </div>

          </div>
        </form>

        {/* ── Proportional Trust Strip ─────────────────────────────── */}
        <div className="mt-6 sm:mt-8 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border p-3 sm:p-4 shadow-2xs text-center sm:text-left">
          {[
            [`Free delivery over ₹${FREE_DELIVERY_THRESHOLD}`, `Flat ₹${DELIVERY_CHARGE} below threshold`],
            ['Cash on delivery', 'Pay safely upon arrival'],
            ['Tracked shipping', 'Follow order via SMS alerts'],
            ['Secure payments', '100% Encrypted transactions'],
          ].map(([title, detail]) => (
            <div key={title} className="p-2">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-fv-primary shrink-0" />
                <span className="text-xs font-bold text-fv-heading dark:text-white">{title}</span>
              </div>
              <span className="text-[11px] text-fv-muted dark:text-gray-400 block">{detail}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default Checkout;
