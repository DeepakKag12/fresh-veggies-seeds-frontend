import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Package, AlertCircle, CheckCircle, Tag,
  Navigation, Loader2, Plus, Star, Check, Lock, ShieldCheck,
  ChevronDown, ChevronUp, ArrowLeft, Truck, Sparkles, Shield
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { fetchCurrentAddress } from '../utils/locationService';
import Msg91OtpWidget from '../components/Msg91OtpWidget';

/* ─── Modern Input & Label Styles ─────────────────────────────────────────── */
const inputCls =
  'w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-gray-600 ' +
  'bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ' +
  'focus:ring-2 focus:ring-fv-primary/20 focus:border-fv-primary transition-all outline-none';

const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5';

/* ─── Reusable Address Form Fields ────────────────────────────────────────── */
const AddressFields = ({ addr, setAddr, gpsLoading, onUseLocation }) => (
  <div className="space-y-4">
    <button
      type="button"
      onClick={onUseLocation}
      disabled={gpsLoading}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4
                 rounded-xl border border-dashed border-fv-primary/60 hover:border-fv-primary
                 text-fv-primary hover:bg-fv-cream dark:hover:bg-green-950/20
                 text-sm font-semibold transition-all disabled:opacity-60 cursor-pointer"
    >
      {gpsLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Detecting current location…
        </>
      ) : (
        <>
          <Navigation className="w-4 h-4" />
          Use Current Location (GPS)
        </>
      )}
    </button>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className={labelCls}>Full Name *</label>
        <input
          type="text"
          required
          value={addr.name}
          onChange={(e) => setAddr((a) => ({ ...a, name: e.target.value }))}
          placeholder="e.g. Rahul Sharma"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Phone Number *</label>
        <input
          type="tel"
          required
          value={addr.phone}
          onChange={(e) => setAddr((a) => ({ ...a, phone: e.target.value }))}
          placeholder="10-digit mobile number"
          className={inputCls}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>
          Email Address <span className="text-gray-400 font-normal lowercase">(optional — for order updates)</span>
        </label>
        <input
          type="email"
          value={addr.email || ''}
          onChange={(e) => setAddr((a) => ({ ...a, email: e.target.value }))}
          placeholder="name@example.com"
          className={inputCls}
        />
      </div>
      <div className="sm:col-span-2">
        <label className={labelCls}>Street / House / Area *</label>
        <input
          type="text"
          required
          value={addr.street}
          onChange={(e) => setAddr((a) => ({ ...a, street: e.target.value }))}
          placeholder="House/Flat no., Apartment, Street, Area"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>City *</label>
        <input
          type="text"
          required
          value={addr.city}
          onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))}
          placeholder="e.g. Mumbai"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>State *</label>
        <input
          type="text"
          required
          value={addr.state}
          onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))}
          placeholder="e.g. Maharashtra"
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Pincode *</label>
        <input
          type="text"
          required
          value={addr.pincode}
          maxLength={6}
          onChange={(e) => setAddr((a) => ({ ...a, pincode: e.target.value.replace(/\D/g, '') }))}
          placeholder="6-digit pincode"
          className={inputCls}
        />
      </div>
    </div>
  </div>
);

/* ─── Main Checkout Page Component ────────────────────────────────────────── */
const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, cartReady } = useCart();
  const { user, addAddress, loginWithData, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [orderSummaryExpanded, setOrderSummaryExpanded] = useState(false);
  const submittingRef = useRef(false);

  const savedAddresses = user?.addresses || [];
  const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  const [selectedSavedId, setSelectedSavedId] = useState(defaultAddr?._id || null);
  const [mode, setMode] = useState(savedAddresses.length > 0 ? 'saved' : 'new');
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

  /* Sync when user signs in */
  useEffect(() => {
    if (!user) return;
    const addrs = user.addresses || [];
    const def = addrs.find((a) => a.isDefault) || addrs[0];
    if (addrs.length > 0) {
      setMode('saved');
      setSelectedSavedId(def?._id || null);
    }
    setNewAddr((a) => ({
      ...a,
      name: a.name || user.name || '',
      phone: a.phone || user.phone || '',
      email: a.email || user.email || '',
    }));
  }, [user]);

  /* ── Payment Mode ── */
  const [paymentMode, setPaymentMode] = useState('COD');

  /* ── Coupon State ── */
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  /* ── Store Settings ── */
  const [storeSettings, setStoreSettings] = useState(null);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        if (res.data?.success) setStoreSettings(res.data.data);
      })
      .catch(() => {});
  }, []);

  /* Redirect if cart is empty */
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
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  /* ── GPS location helper ── */
  const handleUseLocation = async () => {
    setGpsError('');
    setGpsLoading(true);
    try {
      const detected = await fetchCurrentAddress();
      setNewAddr((a) => ({
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

  /* ── Resolve shipping address ── */
  const resolveShippingAddress = () => {
    if (mode === 'saved' && selectedSavedId) {
      const saved = savedAddresses.find((a) => a._id === selectedSavedId);
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
      country: 'India',
    };
  };

  /* ── Pricing calculations ── */
  const FREE_DELIVERY_THRESHOLD = storeSettings?.delivery?.freeDeliveryThreshold ?? 300;
  const DELIVERY_CHARGE = storeSettings?.delivery?.deliveryCharge ?? 50;
  const COD_AVAILABLE =
    (storeSettings?.delivery?.codAvailable ?? true) && (storeSettings?.payments?.codEnabled ?? true);
  const COD_MAX_ORDER = storeSettings?.delivery?.codMaxOrder ?? storeSettings?.payments?.codMaxOrder ?? 5000;
  const MIN_ORDER_AMOUNT = storeSettings?.delivery?.minOrderAmount ?? 100;
  const ONLINE_AVAILABLE = storeSettings?.payments?.onlinePaymentEnabled ?? true;
  const COD_EXTRA_CHARGE = storeSettings?.payments?.codExtraCharge ?? 0;
  const ONLINE_DISCOUNT_TYPE = storeSettings?.payments?.onlineDiscountType || 'percentage';
  const ONLINE_DISCOUNT_VALUE = storeSettings?.payments?.onlineDiscountValue ?? 0;
  const ONLINE_DISCOUNT_MAX = storeSettings?.payments?.onlineDiscountMaxLimit ?? 100;

  const itemsPrice = getCartTotal();
  const shippingPrice = itemsPrice >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount || 0 : 0;

  const codExtraFee = paymentMode === 'COD' && COD_EXTRA_CHARGE > 0 ? COD_EXTRA_CHARGE : 0;

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

  const totalOriginalPrice = cartItems.reduce((acc, item) => {
    const orig = item.originalPrice || item.mrp || (item.price ? Math.round(item.price * 1.3) : 0);
    return acc + orig * item.quantity;
  }, 0);
  const totalSavings = Math.max(0, Math.round(totalOriginalPrice - totalAmount));

  /* ── Razorpay Payment ── */
  const handleRazorpayPayment = async (e) => {
    e?.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');
    setLoading(true);

    try {
      const shippingAddress = resolveShippingAddress();
      if (mode === 'new' && saveNewAddr && shippingAddress.street) {
        addAddress(shippingAddress).catch(() => {});
      }

      const orderItems = cartItems.map((item) => ({
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
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              internalOrderId,
            });
            if (verifyResponse.data.success) {
              clearCart();
              navigate(`/orders/${verifyResponse.data.data._id}`, {
                state: { success: true, message: 'Payment successful! Order confirmed.' },
              });
            }
          } catch (verifyError) {
            await api
              .post('/payments/payment-failure', {
                razorpay_order_id: razorpayOrderId,
                internalOrderId,
              })
              .catch(() => {});
            setError('Payment verification failed. Please contact support with your order reference.');
            submittingRef.current = false;
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            api
              .post('/payments/payment-failure', { razorpay_order_id: razorpayOrderId, internalOrderId })
              .catch(() => {});
            submittingRef.current = false;
            setLoading(false);
            setError('Payment cancelled. Your order has not been placed.');
          },
        },
        theme: { color: '#16a34a' },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate payment');
      submittingRef.current = false;
      setLoading(false);
    }
  };

  /* ── COD Payment ── */
  const handleCODPayment = async (e) => {
    e?.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');
    setLoading(true);

    try {
      const shippingAddress = resolveShippingAddress();
      if (mode === 'new' && saveNewAddr && shippingAddress.street) {
        addAddress(shippingAddress).catch(() => {});
      }

      const orderItems = cartItems.map((item) => ({
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
        state: { success: true, message: 'Order placed successfully! Pay on delivery.' },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
      submittingRef.current = false;
    }
    setLoading(false);
  };

  /* ── Form Submit Dispatcher ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please enter and verify your phone number above before placing your order.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const shipping = resolveShippingAddress();
    if (!shipping.street || !shipping.city || !shipping.state || !shipping.pincode) {
      setError('Please fill in all required delivery address fields.');
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

  /* ── Coupon Handlers ── */
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
      setCouponError(err.response?.data?.message || 'Could not apply this coupon code.');
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
    api
      .post('/coupons/validate', { code: appliedCoupon.code, orderAmount: itemsPrice })
      .then((res) => {
        if (!cancelled) setAppliedCoupon(res.data.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setAppliedCoupon(null);
        setCouponError(err.response?.data?.message || 'Coupon no longer valid for this cart total.');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPrice]);

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-gray-900 pb-28 pt-6 sm:pt-8">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/cart"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-fv-primary dark:text-gray-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Cart
          </Link>
          <div className="flex items-center gap-1 text-xs text-fv-primary font-medium">
            <ShieldCheck className="w-4 h-4" /> 100% Secure Checkout
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Checkout
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete your order in 3 quick steps
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 mb-6 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 dark:text-red-300 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Mobile Order Summary Bar (Dropdown) */}
        <div className="lg:hidden mb-6 rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setOrderSummaryExpanded(!orderSummaryExpanded)}
            className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-fv-primary" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Order Summary ({cartItems.reduce((a, c) => a + c.quantity, 0)} items)
              </span>
              {orderSummaryExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-gray-900 dark:text-white">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>
          </button>

          {orderSummaryExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-gray-700 space-y-2 text-xs">
              {cartItems.map((item) => (
                <div key={`${item._id}-${item.isCombo}`} className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100 dark:border-gray-700 flex justify-between font-semibold">
                <span>Total Payable</span>
                <span className="text-fv-primary">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* Main 2-Column Grid */}
        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: 3 Stepped Cards */}
            <div className="lg:col-span-7 space-y-5">
              {/* ── Step 1: Contact Information ────────────────────── */}
              {!user ? (
                <Msg91OtpWidget
                  onSuccess={(verifiedData) => {
                    loginWithData(verifiedData);
                  }}
                  initialPhone={newAddr.phone}
                  initialName={newAddr.name}
                />
              ) : (
                <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-950/20 p-5 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-9 h-9 rounded-xl bg-fv-primary text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                      ✓
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-fv-primary">
                        Step 1: Contact Verified
                      </span>
                      <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mt-0.5">
                        {user.name || 'Customer'} {user.phone ? `(+91 ${user.phone})` : ''}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="text-xs text-fv-primary hover:underline font-semibold bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800 shadow-xs cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* ── Step 2: Delivery Address ────────────────────────── */}
              {!user ? (
                <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-5 sm:p-6 opacity-60 select-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-gray-700 text-slate-500 font-bold text-xs flex items-center justify-center">
                        2
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400">Step 2</span>
                        <h3 className="font-semibold text-base text-slate-700 dark:text-gray-300">
                          Delivery Address
                        </h3>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-gray-700 text-slate-500">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 ml-11">
                    Enter your phone number in Step 1 to add shipping details.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-fv-primary text-white font-bold text-xs flex items-center justify-center">
                        2
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-fv-primary">
                          Step 2 of 3
                        </span>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                          Delivery Address
                        </h2>
                      </div>
                    </div>
                  </div>

                  {/* Saved addresses selector */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2.5 mb-5">
                      {savedAddresses.map((addr) => (
                        <label
                          key={addr._id}
                          onClick={() => {
                            setMode('saved');
                            setSelectedSavedId(addr._id);
                          }}
                          className={`flex items-start gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                            mode === 'saved' && selectedSavedId === addr._id
                              ? 'border-fv-primary bg-fv-cream/50 dark:bg-green-950/20'
                              : 'border-slate-200 dark:border-gray-700 hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              mode === 'saved' && selectedSavedId === addr._id
                                ? 'border-fv-primary bg-fv-primary'
                                : 'border-gray-400'
                            }`}
                          >
                            {mode === 'saved' && selectedSavedId === addr._id && (
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                {addr.name || user?.name}
                              </span>
                              {addr.isDefault && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-fv-primary/10 text-fv-primary rounded-full">
                                  <Star className="w-2.5 h-2.5" fill="currentColor" /> Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                              {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
                            </p>
                            {addr.phone && (
                              <p className="text-xs text-gray-500 mt-0.5">📞 {addr.phone}</p>
                            )}
                          </div>
                        </label>
                      ))}

                      <button
                        type="button"
                        onClick={() => setMode(mode === 'new' ? 'saved' : 'new')}
                        className="flex items-center gap-1.5 text-xs font-semibold text-fv-primary hover:underline cursor-pointer pt-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {mode === 'new' ? 'Use a saved address' : 'Add new address'}
                      </button>
                    </div>
                  )}

                  {/* Manual / New Address Form */}
                  {(mode === 'new' || savedAddresses.length === 0) && (
                    <div className="space-y-4">
                      {gpsError && (
                        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
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

                      <label className="flex items-center gap-2.5 cursor-pointer select-none mt-2">
                        <input
                          type="checkbox"
                          checked={saveNewAddr}
                          onChange={(e) => setSaveNewAddr(e.target.checked)}
                          className="w-4 h-4 rounded text-fv-primary focus:ring-fv-primary"
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Save this address for future orders
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* ── Step 3: Payment Method ────────────────────────── */}
              {!user ? (
                <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/40 p-5 sm:p-6 opacity-60 select-none">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-gray-700 text-slate-500 font-bold text-xs flex items-center justify-center">
                        3
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-slate-400">Step 3</span>
                        <h3 className="font-semibold text-base text-slate-700 dark:text-gray-300">
                          Payment Method
                        </h3>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-gray-700 text-slate-500">
                      <Lock className="w-3 h-3" /> Locked
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-8 rounded-xl bg-fv-primary text-white font-bold text-xs flex items-center justify-center">
                      3
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-fv-primary">
                        Step 3 of 3
                      </span>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                        Payment Method
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* COD Option */}
                    {COD_AVAILABLE ? (
                      <label
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          paymentMode === 'COD'
                            ? 'border-fv-primary bg-fv-cream/50 dark:bg-green-950/20'
                            : 'border-slate-200 dark:border-gray-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="COD"
                            checked={paymentMode === 'COD'}
                            onChange={(e) => setPaymentMode(e.target.value)}
                            className="w-4 h-4 text-fv-primary"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                Cash on Delivery (COD)
                              </p>
                              {COD_EXTRA_CHARGE > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                  +₹{COD_EXTRA_CHARGE} fee
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Pay in cash when order is delivered to your door
                            </p>
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div className="p-3 rounded-xl border border-slate-200 text-gray-400 text-xs bg-slate-50 dark:bg-gray-800">
                        Cash on Delivery is currently unavailable
                      </div>
                    )}

                    {/* Online Payment Option */}
                    {ONLINE_AVAILABLE ? (
                      <label
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          paymentMode === 'Online'
                            ? 'border-fv-primary bg-fv-cream/50 dark:bg-green-950/20'
                            : 'border-slate-200 dark:border-gray-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMode"
                            value="Online"
                            checked={paymentMode === 'Online'}
                            onChange={(e) => setPaymentMode(e.target.value)}
                            className="w-4 h-4 text-fv-primary"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                Online Payment (UPI, Cards, NetBanking)
                              </p>
                              {ONLINE_DISCOUNT_VALUE > 0 && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                                  {ONLINE_DISCOUNT_TYPE === 'percentage'
                                    ? `${ONLINE_DISCOUNT_VALUE}% OFF`
                                    : `₹${ONLINE_DISCOUNT_VALUE} OFF`}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Instant checkout via Google Pay, PhonePe, Cards & NetBanking
                            </p>
                          </div>
                        </div>
                      </label>
                    ) : (
                      <div className="p-3 rounded-xl border border-slate-200 text-gray-400 text-xs bg-slate-50 dark:bg-gray-800">
                        Online Payment is currently unavailable
                      </div>
                    )}
                  </div>

                  {/* Primary CTA button on left column for mobile & desktop flow */}
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-gray-700">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-fv-primary hover:bg-fv-primary-dark text-white py-4 px-6 rounded-xl font-semibold text-base
                                 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Placing Order…
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Place Order • ₹{totalAmount.toLocaleString()}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Order Summary */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-gray-700">
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">
                    Order Summary
                  </h2>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {cartItems.reduce((a, c) => a + c.quantity, 0)} Items
                  </span>
                </div>

                {/* Items List */}
                <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-gray-700 pr-1 mb-5">
                  {cartItems.map((item) => (
                    <div key={`${item._id}-${item.isCombo}`} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded bg-slate-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          {item.quantity}
                        </span>
                        <div className="truncate">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {item.name}
                          </p>
                          {item.selectedPackage && (
                            <p className="text-[11px] text-gray-400">{item.selectedPackage.size}</p>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white shrink-0 ml-2">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="pt-4 border-t border-slate-100 dark:border-gray-700 mb-5">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="w-3.5 h-3.5 text-fv-primary shrink-0" />
                        <span className="font-bold text-xs text-fv-primary truncate">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-xs text-green-700 font-semibold">
                          −₹{appliedCoupon.discountAmount.toLocaleString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs text-gray-500 hover:text-red-600 font-medium cursor-pointer ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
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
                          placeholder="Coupon code (e.g. NEW75)"
                          className="flex-1 min-w-0 px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-xl text-xs uppercase font-semibold tracking-wider text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:border-fv-primary"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold disabled:opacity-40 cursor-pointer transition-colors"
                        >
                          {couponLoading ? '…' : 'Apply'}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-500 mt-1.5">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bill Breakdown */}
                <div className="pt-4 border-t border-slate-100 dark:border-gray-700 space-y-2.5 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₹{itemsPrice.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className="font-semibold">
                      {shippingPrice === 0 ? (
                        <span className="text-fv-primary font-bold">FREE</span>
                      ) : (
                        `₹${shippingPrice}`
                      )}
                    </span>
                  </div>

                  {shippingPrice > 0 && (
                    <p className="text-[11px] text-gray-400">
                      Add ₹{FREE_DELIVERY_THRESHOLD - itemsPrice} more for free delivery
                    </p>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-fv-primary font-medium">
                      <span>Discount ({appliedCoupon.code})</span>
                      <span>−₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {codExtraFee > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span>COD Handling Fee</span>
                      <span>+₹{codExtraFee.toLocaleString()}</span>
                    </div>
                  )}

                  {onlineDiscountAmount > 0 && (
                    <div className="flex justify-between text-fv-primary font-medium">
                      <span>Online Payment Discount</span>
                      <span>−₹{onlineDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 dark:border-gray-700 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Total Payable</span>
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                      ₹{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Savings Strip */}
                {totalSavings > 0 && (
                  <div className="mt-4 p-2.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold text-fv-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    You are saving ₹{totalSavings.toLocaleString()} on this order!
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        {/* Clean Trust Strip Footer */}
        <div className="mt-14 pt-8 border-t border-slate-200 dark:border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-fv-primary" />
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white">100% Safe Payments</h4>
              <p className="text-[11px] text-gray-400">Encrypted 256-bit SSL transaction</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Truck className="w-6 h-6 text-fv-primary" />
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Direct Farm Fresh</h4>
              <p className="text-[11px] text-gray-400">Carefully sorted and packed</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Package className="w-6 h-6 text-fv-primary" />
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Fast Delivery</h4>
              <p className="text-[11px] text-gray-400">Live order tracking updates</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-6 h-6 text-fv-primary" />
              <h4 className="text-xs font-semibold text-gray-900 dark:text-white">Dedicated Support</h4>
              <p className="text-[11px] text-gray-400">Quick resolution for any query</p>
            </div>
          </div>
          <div className="text-center mt-6 text-[11px] text-gray-400">
            <Link to="/terms" className="hover:underline">Terms & Conditions</Link> &nbsp;•&nbsp;
            <Link to="/privacy" className="hover:underline">Privacy Policy</Link> &nbsp;•&nbsp;
            <span>Fresh Veggies & Seeds</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
