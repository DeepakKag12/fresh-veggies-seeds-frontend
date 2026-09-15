import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard, MapPin, Package, AlertCircle, CheckCircle, Tag,
  Navigation, Loader2, Plus, Star, Check
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { fetchCurrentAddress } from '../utils/locationService';
import Msg91OtpWidget from '../components/Msg91OtpWidget';

/* ─── small helper ─────────────────────────────────────────────────────── */
const inputCls =
  'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg ' +
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white ' +
  'focus:ring-2 focus:ring-fv-primary focus:border-transparent transition-shadow';

const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5';

/* ─── Reusable address form fields ─────────────────────────────────────── */
const AddressFields = ({ addr, setAddr, gpsLoading, onUseLocation }) => (
  <div className="space-y-4">
    {/* GPS button */}
    <button
      type="button"
      onClick={onUseLocation}
      disabled={gpsLoading}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                 rounded-lg border-2 border-dashed border-fv-primary/50 hover:border-fv-primary
                 text-fv-primary hover:bg-fv-cream dark:hover:bg-green-900/20
                 text-sm font-semibold transition-all disabled:opacity-60"
    >
      {gpsLoading
        ? <><Loader2 className="w-4 h-4 animate-spin" />Detecting location…</>
        : <><Navigation className="w-4 h-4" />Use Current Location</>}
    </button>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>Full Name *</label>
        <input type="text" required value={addr.name}
          onChange={e => setAddr(a => ({ ...a, name: e.target.value }))}
          className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Phone Number *</label>
        <input type="tel" required value={addr.phone}
          onChange={e => setAddr(a => ({ ...a, phone: e.target.value }))}
          className={inputCls} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Email Address (Optional — for Brevo order updates)</label>
        <input type="email" value={addr.email || ''}
          onChange={e => setAddr(a => ({ ...a, email: e.target.value }))}
          placeholder="your.email@example.com"
          className={inputCls} />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Street / Area *</label>
        <input type="text" required value={addr.street}
          onChange={e => setAddr(a => ({ ...a, street: e.target.value }))}
          placeholder="House no., Building, Street, Area"
          className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>City *</label>
        <input type="text" required value={addr.city}
          onChange={e => setAddr(a => ({ ...a, city: e.target.value }))}
          className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>State *</label>
        <input type="text" required value={addr.state}
          onChange={e => setAddr(a => ({ ...a, state: e.target.value }))}
          className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Pincode *</label>
        <input type="text" required value={addr.pincode} maxLength={6}
          onChange={e => setAddr(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))}
          className={inputCls} />
      </div>
    </div>
  </div>
);

/* ─── Main Checkout component ──────────────────────────────────────────── */
const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, cartReady } = useCart();
  const { user, addAddress, loginWithData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const submittingRef = useRef(false);


  const savedAddresses = user?.addresses || [];
  const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];

  const [selectedSavedId, setSelectedSavedId] = useState(defaultAddr?._id || null);
  const [mode, setMode] = useState(
    // 'saved' = pick from saved list, 'new' = manual form
    savedAddresses.length > 0 ? 'saved' : 'new'
  );
  const [newAddr, setNewAddr] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    street: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [saveNewAddr, setSaveNewAddr] = useState(true);

  /* Sync when user finishes loading (async auth) */
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
      name: a.name || user.name || '',
      phone: a.phone || user.phone || '',
      email: a.email || user.email || '',
    }));
  }, [user]);

  /* ── Payment state ── */
  const [paymentMode, setPaymentMode] = useState('COD');

  /* ── Coupon state ── */
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  /* ── Store settings state ── */
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    api.get('/settings')
      .then(res => {
        if (res.data?.success) setStoreSettings(res.data.data);
      })
      .catch(() => {});
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

  /* ── GPS location helper ── */
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
    } catch (err) {
      setGpsError(err.message);
    } finally {
      setGpsLoading(false);
    }
  };

  /* ── Resolve the effective shipping address for order submission ── */
  const resolveShippingAddress = () => {
    if (mode === 'saved' && selectedSavedId) {
      const saved = savedAddresses.find(a => a._id === selectedSavedId);
      if (saved) {
        return {
          name: saved.name || user?.name || '',
          phone: saved.phone || user?.phone || '',
          email: user?.email || newAddr.email || '',
          street: saved.street,
          city: saved.city,
          state: saved.state,
          pincode: saved.pincode,
          country: saved.country || 'India',
        };
      }
    }
    return {
      ...newAddr,
      name: newAddr.name?.trim() || user?.name || '',
      phone: newAddr.phone?.trim() || user?.phone || '',
      email: user?.email || newAddr.email || '',
      country: 'India'
    };
  };

  /* ── Razorpay handler ── */
  const handleRazorpayPayment = async (e) => {
    e.preventDefault();
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

  /* ── COD handler ── */
  const handleCODPayment = async (e) => {
    e.preventDefault();
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

  /* ── Pricing ── */
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

  // Dynamic COD surcharge & Online payment incentive discount
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
    e.preventDefault();
    if (!user) {
      setError('Please complete Step 1: Verify your mobile number with MSG91 SMS OTP before placing your order.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (MIN_ORDER_AMOUNT && itemsPrice < MIN_ORDER_AMOUNT) {
      setError(`Minimum order amount is ₹${MIN_ORDER_AMOUNT}. Please add more items to your cart.`);
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

  /* ── Coupon helpers ── */
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

  /* ─────────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div className="min-h-screen bg-fv-page pb-32 pt-6 sm:pt-8">
      <div className="mx-auto max-w-[1200px] px-3 sm:px-6 lg:px-10">
        <h1 className="mb-4 sm:mb-6 font-serif text-[24px] font-semibold text-fv-heading sm:text-[32px] lg:text-[38px]">
          Checkout
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">

              {/* ── Step 1: Mobile Verification with MSG91 ────────────── */}
              {!user ? (
                <Msg91OtpWidget
                  onSuccess={(verifiedData) => {
                    loginWithData(verifiedData);
                  }}
                  initialPhone={newAddr.phone}
                  initialName={newAddr.name}
                />
              ) : (
                <div className="rounded-[18px] border border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-950/20 p-4 sm:p-5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-fv-primary text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                      ✓
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-fv-primary bg-fv-primary/10 px-2.5 py-0.5 rounded-full">
                          Step 1: Mobile Verified
                        </span>
                      </div>
                      <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mt-1">
                        {user.name || 'Verified Customer'} {user.phone ? `(+91 ${user.phone})` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-fv-muted font-medium hidden sm:inline-block bg-white dark:bg-gray-800 px-2.5 py-1 rounded-full border border-green-200 dark:border-green-800">
                    MSG91 Verified
                  </span>
                </div>
              )}

              {/* ── Step 2: Shipping Address ────────────────────────── */}
              <div className="rounded-[18px] border border-fv-border bg-white p-4 sm:p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 sm:mb-5">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-fv-primary" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-fv-muted">
                        Step 2
                      </span>
                      <h2 className="font-serif text-[18px] sm:text-[20px] font-semibold text-fv-heading">
                        Delivery Address
                      </h2>
                    </div>
                  </div>
                </div>

                {/* ── Saved addresses list ── */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-2 mb-5">
                    {savedAddresses.map(addr => (
                      <label
                        key={addr._id}
                        onClick={() => { setMode('saved'); setSelectedSavedId(addr._id); }}
                        className={`flex items-start gap-3 p-3 sm:p-4 border-2 rounded-xl cursor-pointer transition-all
                          ${mode === 'saved' && selectedSavedId === addr._id
                            ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                          ${mode === 'saved' && selectedSavedId === addr._id ? 'border-fv-primary bg-fv-primary' : 'border-gray-400'}`}>
                          {mode === 'saved' && selectedSavedId === addr._id && (
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                              {addr.name || user?.name}
                            </span>
                            {addr.isDefault && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold
                                              bg-fv-primary/10 text-fv-primary rounded-full">
                                <Star className="w-2.5 h-2.5" fill="currentColor" /> Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                            {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
                          </p>
                          {addr.phone && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">📞 {addr.phone}</p>
                          )}
                        </div>
                      </label>
                    ))}

                    {/* Add new address toggle */}
                    <button
                      type="button"
                      onClick={() => setMode(mode === 'new' ? 'saved' : 'new')}
                      className="flex items-center gap-2 w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600
                                 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400
                                 hover:border-fv-primary hover:text-fv-primary transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      {mode === 'new' ? 'Cancel – use saved address' : 'Use a different / new address'}
                    </button>
                  </div>
                )}

                {/* ── New / manual address form ── */}
                {(mode === 'new' || savedAddresses.length === 0) && (
                  <div className="space-y-4">
                    {gpsError && (
                      <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{gpsError}</span>
                      </div>
                    )}

                    <AddressFields
                      addr={newAddr}
                      setAddr={setNewAddr}
                      gpsLoading={gpsLoading}
                      onUseLocation={handleUseLocation}
                    />

                    {/* Save address option */}
                    <label className="flex items-center gap-3 cursor-pointer select-none mt-2">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors
                          ${saveNewAddr ? 'bg-fv-primary border-fv-primary' : 'border-gray-300'}`}
                        onClick={() => setSaveNewAddr(v => !v)}
                      >
                        {saveNewAddr && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Save this address for future orders
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* ── Step 3: Payment Method ────────────────────────── */}
              <div className="rounded-[18px] border border-fv-border bg-white p-4 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-fv-primary" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-fv-muted">
                      Step 3
                    </span>
                    <h2 className="font-serif text-[18px] sm:text-[20px] font-semibold text-fv-heading">
                      Payment Method
                    </h2>
                  </div>
                </div>

                <div className="space-y-3">
                  {COD_AVAILABLE ? (
                    <label className={`flex items-center justify-between p-3.5 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMode === 'COD' ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="paymentMode" value="COD"
                          checked={paymentMode === 'COD'}
                          onChange={e => setPaymentMode(e.target.value)}
                          className="w-5 h-5 text-fv-primary" />
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Cash on Delivery (COD)</p>
                            {COD_EXTRA_CHARGE > 0 && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                +₹{COD_EXTRA_CHARGE} fee
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                            Pay when you receive your order {COD_MAX_ORDER ? `(up to ₹${COD_MAX_ORDER.toLocaleString()})` : ''}
                          </p>
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="p-3 rounded-lg border border-gray-200 text-gray-400 text-sm bg-gray-50 dark:bg-gray-800">
                      Cash on Delivery is currently unavailable
                    </div>
                  )}

                  {ONLINE_AVAILABLE ? (
                    <label className={`flex items-center justify-between p-3.5 sm:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      paymentMode === 'Online' ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="paymentMode" value="Online"
                          checked={paymentMode === 'Online'}
                          onChange={e => setPaymentMode(e.target.value)}
                          className="w-5 h-5 text-fv-primary" />
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">Online Payment (Razorpay)</p>
                            {ONLINE_DISCOUNT_VALUE > 0 && (
                              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                {ONLINE_DISCOUNT_TYPE === 'percentage' ? `${ONLINE_DISCOUNT_VALUE}% Extra OFF` : `₹${ONLINE_DISCOUNT_VALUE} Extra OFF`}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">Pay securely using UPI, Cards & Net Banking</p>
                        </div>
                      </div>
                    </label>
                  ) : (
                    <div className="p-3 rounded-lg border border-gray-200 text-gray-400 text-sm bg-gray-50 dark:bg-gray-800">
                      Online Payment is currently unavailable
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Order Summary ─────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-[18px] border border-fv-border bg-white p-4 sm:p-6 shadow-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                  <Package className="w-5 h-5 sm:w-6 sm:h-6 text-fv-primary" />
                  <h2 className="font-serif text-[18px] sm:text-[20px] font-semibold text-fv-heading">Order Summary</h2>
                </div>

                <div className="space-y-3 mb-6">
                  {cartItems.map(item => (
                    <div key={`${item._id}-${item.isCombo}`} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.name} x {item.quantity}
                        {item.selectedPackage && (
                          <span className="block text-xs text-fv-primary dark:text-green-400">
                            {item.selectedPackage.size}
                          </span>
                        )}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-fv-cream dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="w-4 h-4 text-fv-primary flex-shrink-0" />
                        <span className="font-semibold text-fv-primary-dark dark:text-green-400 truncate">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-sm text-fv-primary dark:text-green-500 whitespace-nowrap">
                          −₹{appliedCoupon.discountAmount.toLocaleString()}
                        </span>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon}
                        className="text-sm text-gray-500 hover:text-red-600 flex-shrink-0 ml-2">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input type="text" value={couponCode}
                        onChange={e => { setCouponCode(e.target.value); setCouponError(''); }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); } }}
                        placeholder="Coupon code"
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg uppercase text-sm focus:ring-2 focus:ring-fv-primary focus:outline-none" />
                      <button type="button" onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-gray-800">
                        {couponLoading ? '…' : 'Apply'}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">{couponError}</p>
                  )}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{itemsPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span className="font-semibold">
                      {shippingPrice === 0
                        ? <span className="text-fv-primary dark:text-green-400">FREE</span>
                        : `₹${shippingPrice}`}
                    </span>
                  </div>
                  {shippingPrice === 0 && (
                    <p className="text-xs text-fv-primary dark:text-green-400">🎉 You qualify for free delivery!</p>
                  )}
                  {shippingPrice > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Add ₹{FREE_DELIVERY_THRESHOLD - itemsPrice} more for free delivery
                    </p>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-fv-primary dark:text-green-400">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span className="font-semibold">−₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {codExtraFee > 0 && (
                    <div className="flex justify-between text-amber-700 dark:text-amber-400">
                      <span>COD Handling Fee</span>
                      <span className="font-semibold">+₹{codExtraFee.toLocaleString()}</span>
                    </div>
                  )}
                  {onlineDiscountAmount > 0 && (
                    <div className="flex justify-between text-fv-primary dark:text-green-400 font-medium">
                      <span>Online Payment Discount</span>
                      <span className="font-semibold">−₹{onlineDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-fv-primary dark:text-green-400">₹{totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-fv-primary hover:bg-fv-primary-dark text-white py-4 rounded-lg font-semibold
                             shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                      Placing Order…
                    </>
                  ) : !user ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verify Mobile (Step 1) to Place Order
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Info strip */}
        <ul className="mx-auto mt-8 grid max-w-[1200px] gap-4 rounded-[18px] bg-fv-cream p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Free delivery over ₹300', 'Flat ₹50 below that'],
            ['Cash on delivery', 'Pay when your order arrives'],
            ['Tracked shipping', 'Follow the order to your door'],
            ['Secure payments', 'UPI, cards and wallets'],
          ].map(([title, detail]) => (
            <li key={title}>
              <span className="block text-[14px] font-semibold text-fv-heading">{title}</span>
              <span className="block text-[13px] text-fv-muted">{detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Checkout;
