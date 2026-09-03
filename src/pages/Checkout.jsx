import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Package, AlertCircle, CheckCircle, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart, cartReady } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  // Ref-based guard: prevents double-submit in the tiny window before loading state propagates
  const submittingRef = useRef(false);

  const [shippingAddress, setShippingAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
  });

  const [paymentMode, setPaymentMode] = useState('COD');

  // ── Coupon ────────────────────────────────────────────────────────────────
  // Only the CODE is ever sent to the server; the server computes the discount.
  // The value held here is a preview for display and is re-derived server-side
  // at order time, so tampering with it changes nothing about what is charged.
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Redirect to cart if empty — but only once the cart has actually loaded.
  // cartItems starts as [] and hydrates from storage asynchronously, so
  // checking it immediately bounced anyone who opened /checkout directly or
  // refreshed the page mid-checkout, even with items in their cart.
  useEffect(() => {
    if (cartReady && cartItems.length === 0) {
      navigate('/cart', { replace: true });
    }
  }, [cartReady, cartItems, navigate]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Razorpay Payment Handler
  const handleRazorpayPayment = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return; // prevent double-submit
    submittingRef.current = true;
    setError('');
    setLoading(true);

    try {
      const orderItems = cartItems.map((item) => ({
        product: item._id,
        productType: item.isCombo ? 'Combo' : 'Product',
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.images?.[0] || '',
        ...(item.packageId ? { packageId: item.packageId } : {}),
      }));

      // Send only what server needs — server computes prices
      const orderData = {
        orderItems,
        shippingAddress: { ...shippingAddress, country: 'India' },
        couponCode: appliedCoupon?.code || null,
      };

      // Step 1: Create Razorpay Order (server computes total)
      const createOrderResponse = await api.post('/payments/create-order', orderData);
      const { razorpayOrderId, internalOrderId, key, amount } = createOrderResponse.data.data;

      // Step 2: Open Razorpay Checkout Modal
      const options = {
        key: key,
        amount: amount, // server-authoritative paise amount
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
            // Step 3: Verify Payment — pass internalOrderId (no price data)
            const verifyResponse = await api.post('/payments/verify-payment', {
              razorpay_order_id:  razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              internalOrderId,     // links to the pending order on server
            });

            if (verifyResponse.data.success) {
              clearCart();
              navigate(`/orders/${verifyResponse.data.data._id}`, {
                state: { success: true, message: 'Payment successful! Order confirmed.' }
              });
            }
          } catch (verifyError) {
            // Notify backend of failure — pass both IDs so it can mark the order Failed
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
            // Cancel the pending order so it doesn't pollute admin dashboard
            api.post('/payments/payment-failure', {
              razorpay_order_id: razorpayOrderId,
              internalOrderId,
            }).catch(() => {});
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

  // COD Payment Handler
  const handleCODPayment = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return; // prevent double-submit
    submittingRef.current = true;
    setError('');
    setLoading(true);

    try {
      const orderItems = cartItems.map((item) => ({
        product: item._id,
        productType: item.isCombo ? 'Combo' : 'Product',
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        image: item.images?.[0] || '',
        ...(item.packageId ? { packageId: item.packageId } : {}),
      }));

      // Server computes prices — only send items + address
      const orderData = {
        orderItems,
        shippingAddress: { ...shippingAddress, country: 'India' },
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

  const handleSubmit = (e) => {
    if (paymentMode === 'Online') {
      if (!razorpayLoaded) {
        setError('Payment gateway is loading. Please wait a moment and try again.');
        return;
      }
      handleRazorpayPayment(e);
    } else {
      handleCODPayment(e);
    }
  };

  const FREE_DELIVERY_THRESHOLD = 300;
  const itemsPrice = getCartTotal();
  const shippingPrice = itemsPrice >= FREE_DELIVERY_THRESHOLD ? 0 : 50;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const totalAmount = itemsPrice + shippingPrice - discountAmount;

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

  // The basket can change after a coupon is applied (another tab, a stock
  // change). Re-check it against the new subtotal so the preview never shows a
  // discount the server would refuse.
  useEffect(() => {
    if (!appliedCoupon) return;
    let cancelled = false;
    api.post('/coupons/validate', { code: appliedCoupon.code, orderAmount: itemsPrice })
      .then((res) => { if (!cancelled) setAppliedCoupon(res.data.data); })
      .catch((err) => {
        if (cancelled) return;
        setAppliedCoupon(null);
        setCouponError(err.response?.data?.message || 'Coupon is no longer valid for this basket.');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPrice]);

  return (
    <div className="min-h-screen bg-fv-page pb-24 pt-8">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-10">
        <h1 className="mb-6 font-serif text-[30px] font-semibold text-fv-heading sm:text-[38px]">
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
              {/* Shipping Address */}
              <div className="rounded-[18px] border border-fv-border bg-white p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="w-6 h-6 text-fv-primary" />
                  <h2 className="font-serif text-[20px] font-semibold text-fv-heading">
                    Shipping Address
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.name}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, name: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fv-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, phone: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fv-primary focus:border-transparent"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, street: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fv-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, city: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fv-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      State *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, state: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fv-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress.pincode}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, pincode: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-fv-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="rounded-[18px] border border-fv-border bg-white p-6">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-fv-primary" />
                  <h2 className="font-serif text-[20px] font-semibold text-fv-heading">
                    Payment Method
                  </h2>
                </div>
                
                <div className="space-y-3">
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMode === 'COD'
                      ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMode"
                      value="COD"
                      checked={paymentMode === 'COD'}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-5 h-5 text-fv-primary"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Cash on Delivery (COD)</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pay when you receive your order</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMode === 'Online'
                      ? 'border-fv-primary bg-fv-cream dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMode"
                      value="Online"
                      checked={paymentMode === 'Online'}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-5 h-5 text-fv-primary"
                    />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Online Payment (Razorpay)</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pay securely using Razorpay</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-[18px] border border-fv-border bg-white p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Package className="w-6 h-6 text-fv-primary" />
                  <h2 className="font-serif text-[20px] font-semibold text-fv-heading">
                    Order Summary
                  </h2>
                </div>

                <div className="space-y-3 mb-6">
                  {cartItems.map((item) => (
                    <div
                      key={`${item._id}-${item.isCombo}`}
                      className="flex justify-between text-sm"
                    >
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
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-sm text-gray-500 hover:text-red-600 flex-shrink-0 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => { setCouponCode(e.target.value); setCouponError(''); }}
                        onKeyDown={(e) => {
                          // The summary sits inside the checkout <form>; without this
                          // Enter would submit the order instead of applying the code.
                          if (e.key === 'Enter') { e.preventDefault(); handleApplyCoupon(); }
                        }}
                        placeholder="Coupon code"
                        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg uppercase text-sm focus:ring-2 focus:ring-fv-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode.trim()}
                        className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg text-sm font-semibold disabled:opacity-40 hover:bg-gray-800"
                      >
                        {couponLoading ? '...' : 'Apply'}
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
                      {shippingPrice === 0 ? (
                        <span className="text-fv-primary dark:text-green-400">FREE</span>
                      ) : (
                        `₹${shippingPrice}`
                      )}
                    </span>
                  </div>
                  {shippingPrice === 0 && (
                    <p className="text-xs text-fv-primary dark:text-green-400">
                      🎉 You qualify for free delivery!
                    </p>
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
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span className="text-gray-900 dark:text-white">Total</span>
                      <span className="text-fv-primary dark:text-green-400">
                        ₹{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-fv-primary hover:bg-fv-primary-dark text-white py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      Placing Order...
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

        {/* Every line here is honoured by the backend: the ₹300 threshold and
            ₹50 fee come from orderConfig.js, COD is a real payment method, and
            tracking is the courier integration. */}
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
