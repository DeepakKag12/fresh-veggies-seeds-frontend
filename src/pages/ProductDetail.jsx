import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Star,
  Share2,
  ChevronRight,
  ShieldCheck,
  Truck,
  Banknote,
  Sprout,
  AlertCircle,
  ShoppingBag,
  Heart,
  CheckCircle2,
  Sun,
  Droplets,
  Calendar,
  Leaf,
  ArrowLeft,
  Bell,
  Mail,
  Flame,
} from 'lucide-react';
import api, { cachedGet } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import PageLoader from '../components/PageLoader';
import ProductGallery from '../components/storefront/ProductGallery';
import VariantPicker from '../components/storefront/VariantPicker';
import QuantityStepper from '../components/storefront/QuantityStepper';
import OffersBox from '../components/storefront/OffersBox';
import DeliveryCheck from '../components/storefront/DeliveryCheck';
import ReviewsSection from '../components/storefront/ReviewsSection';
import RelatedProducts from '../components/storefront/RelatedProducts';
import { useSettings } from '../context/SettingsContext';

/**
 * Gymshark / BigBasket Benchmark Product Detail & Dynamic Variant Packet Picker (FEAT-005)
 * - Dynamic Packet Size Selector (100g, 250g, 500g, 1kg / 20, 50, 100 seeds) with instant price/unit recalculation
 * - High-resolution image gallery with desktop hover zoom lens and fullscreen lightbox
 * - High-demand stock urgency ticker (e.g. "⚡ Only 4 left in stock!")
 * - Out-of-stock state with "Notify Me When Available" back-in-stock registration
 * - Gymshark / BigBasket mobile sticky bottom dock with active packet pill, line total, and quick cart trigger
 */
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { settings } = useSettings();

  const freeDeliveryThreshold = settings?.delivery?.freeDeliveryThreshold ?? 499;
  const deliveryCharge = settings?.delivery?.deliveryCharge ?? 50;
  const deliveryTime = settings?.delivery?.deliveryTime || '3–5 Days';
  const isCodAvailable = (settings?.delivery?.codAvailable ?? true) && (settings?.payments?.codEnabled ?? true);

  const GUARANTEES = [
    { Icon: Truck, title: `Free delivery over ₹${freeDeliveryThreshold}`, detail: `Flat ₹${deliveryCharge} below threshold · ${deliveryTime}` },
    ...(isCodAvailable ? [{ Icon: Banknote, title: 'Cash on delivery', detail: 'Pay when it arrives' }] : []),
    { Icon: ShieldCheck, title: 'Secure payments', detail: 'UPI, cards & wallets' },
  ];

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Out of stock alert state
  const [notifyContact, setNotifyContact] = useState('');
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cachedGet(`/products/${id}`);
      const p = res.data.data;
      setProduct(p);
      // Prioritize packages in stock, fallback to first package or null
      setPkg(p?.packages?.find((x) => x.stock > 0) || p?.packages?.[0] || null);
      setQuantity(1);
    } catch {
      setProduct(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Recalculate dynamic pricing and savings based on selected package
  const price = pkg ? pkg.price : product?.price;
  const stock = pkg ? pkg.stock : product?.stock;
  const original =
    pkg && typeof pkg.originalPrice === 'number' && pkg.originalPrice > 0
      ? pkg.originalPrice
      : product?.originalPrice || (price > 0 ? Math.round(price * 1.3) : price);
  const hasDiscount = original > price;
  const discountPct = hasDiscount ? Math.round(((original - price) / original) * 100) : 0;
  const savings = hasDiscount ? original - price : 0;
  const lineTotal = useMemo(() => (price || 0) * quantity, [price, quantity]);
  const categoryId = product?.categoryId?._id || product?.categoryId;

  // Review statistics fallback to API aggregate or embedded rollup
  const displayRating = product?.reviewStats?.rating || product?.rating || 0;
  const displayReviewsCount = product?.reviewStats?.numReviews || product?.numReviews || 0;

  const buildCartItem = () => ({
    ...product,
    price,
    originalPrice: original,
    stock,
    packageId: pkg?._id || null,
    selectedPackage: pkg
      ? { size: pkg.quantity, price: pkg.price, originalPrice: pkg.originalPrice || original }
      : null,
  });

  const handleAddToCart = () => {
    if (!stock) return;
    addToCart(buildCartItem(), quantity);
    toast.success(`${product.name} (${pkg?.quantity || 'Standard'}) added to cart`);
  };

  const handleBuyNow = () => {
    if (!stock) return;
    addToCart(buildCartItem(), quantity);
    navigate('/checkout');
  };

  const handleShare = async () => {
    const shareData = { title: product.name, text: `${product.name} — ₹${price}`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch {
      /* the user dismissed the share sheet */
    }
  };

  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    if (!notifyContact.trim()) {
      toast.error('Please enter an email or phone number');
      return;
    }
    setNotifySubmitting(true);
    try {
      const isEmail = notifyContact.includes('@');
      const payload = {
        [isEmail ? 'email' : 'phone']: notifyContact.trim(),
        packageId: pkg?._id,
        quantity: pkg?.quantity,
      };
      await api.post(`/products/${product._id}/notify-stock`, payload);
      setNotifySuccess(true);
      toast.success("You're on the list! We will notify you when restocked.");
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to register notification. Please try again.');
    } finally {
      setNotifySubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-fv-page">
        <PageLoader fullHeight text="Loading seed details…" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-fv-page px-4 text-center">
        <Sprout className="h-12 w-12 text-fv-primary/30" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-[24px] font-semibold text-fv-heading">Product not found</h1>
        <p className="mt-1 text-[15px] text-fv-muted">It may have been removed or the link is wrong.</p>
        <Link
          to="/"
          className="mt-6 inline-flex h-12 items-center rounded-[50px] bg-fv-primary px-6 text-[15px] font-semibold text-white hover:bg-fv-primary-dark"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-fv-page pb-36 lg:pb-12">
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-[1500px] px-4 pt-6 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-fv-muted">
            <li>
              <Link to="/" className="hover:text-fv-primary hover:underline font-medium">
                Shop
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronRight className="h-3 w-3" />
            </li>
            {product.categoryId?.name && (
              <>
                <li>
                  <Link
                    to={`/?category=${encodeURIComponent(product.categoryId.name)}`}
                    className="hover:text-fv-primary hover:underline font-medium"
                  >
                    {product.categoryId.name}
                  </Link>
                </li>
                <li aria-hidden="true">
                  <ChevronRight className="h-3 w-3" />
                </li>
              </>
            )}
            <li aria-current="page" className="truncate font-semibold text-fv-heading max-w-[200px] sm:max-w-md">
              {product.name}
            </li>
          </ol>
          <button
            type="button"
            onClick={() => {
              if (location.state?.from) {
                navigate(location.state.from);
              } else if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-fv-border bg-white dark:bg-gray-800 hover:bg-fv-surface text-xs font-semibold text-fv-heading transition-colors shadow-2xs"
            title="Return to previous page"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-fv-primary" />
            <span>Back</span>
          </button>
        </div>
      </nav>

      {/* Main PDP Grid */}
      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Left Column: High-Resolution Thumbnail Gallery with Hover Zoom */}
          <ProductGallery images={product.images || []} name={product.name} />

          {/* Right Column: Dynamic Variant Packet Picker & Details */}
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-serif text-[28px] font-semibold leading-tight text-fv-heading sm:text-[36px]">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label={isInWishlist(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-fv-border
                             text-fv-primary hover:bg-white focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-fv-primary transition-all cursor-pointer shadow-xs"
                >
                  <Heart
                    className={`h-5 w-5 transition-colors ${
                      isInWishlist(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-600'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share this product"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-fv-border
                             text-fv-primary hover:bg-white focus-visible:outline-none focus-visible:ring-2
                             focus-visible:ring-fv-primary transition-all cursor-pointer shadow-xs"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Ratings and Reviews Aggregate Anchor */}
            {displayRating > 0 && (
              <a
                href="#reviews-heading"
                className="mt-2.5 inline-flex items-center gap-2 text-[14px] text-fv-primary hover:underline"
              >
                <span className="flex" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i <= Math.round(displayRating) ? 'fill-fv-star text-fv-star' : 'text-fv-border'
                      }`}
                    />
                  ))}
                </span>
                <span className="font-bold text-gray-900 dark:text-gray-100">{displayRating.toFixed(1)}</span>
                <span className="text-gray-500">· {displayReviewsCount} verified reviews</span>
              </a>
            )}

            {product.description && (
              <p className="mt-4 text-[15px] leading-relaxed text-fv-ink">{product.description}</p>
            )}

            {/* Gymshark / BigBasket Packet Size Selector */}
            <VariantPicker
              packages={product.packages || []}
              selectedId={pkg?._id}
              onSelect={(p) => {
                setPkg(p);
                setQuantity(1);
                setNotifySuccess(false);
              }}
            />

            {/* Live Pricing & Savings Breakdown */}
            <div className="mt-6">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-[32px] font-extrabold text-[#00B566]">
                  ₹{price?.toLocaleString('en-IN')}
                </span>
                {hasDiscount && (
                  <>
                    <s className="text-[18px] text-gray-400">₹{original.toLocaleString('en-IN')}</s>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      SAVE ₹{savings.toLocaleString('en-IN')} ({discountPct}% OFF)
                    </span>
                  </>
                )}
              </div>
              <span className="text-[13px] text-gray-500 block mt-1">Inclusive of all taxes</span>
            </div>

            {/* Gymshark / BigBasket Stock Urgency Ticker */}
            {stock > 0 && stock <= 5 ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-300 dark:border-amber-700/60 px-3.5 py-1.5 text-[13px] font-bold text-amber-900 dark:text-amber-200 shadow-2xs animate-pulse">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                </span>
                <Flame className="w-4 h-4 text-rose-600 fill-rose-500 shrink-0" />
                <span>High Demand: Only {stock} packets left in stock — order soon!</span>
              </div>
            ) : stock > 0 && stock <= (settings?.inventory?.lowStockThreshold ?? 10) && (settings?.inventory?.showOnlyXLeft ?? true) ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 px-3 py-1.5 text-[13px] font-semibold text-amber-800 dark:text-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" /> Limited stock: Only {stock} packets left
              </div>
            ) : stock > 0 ? (
              <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> In stock · Dispatches within 24 hours
              </p>
            ) : (
              <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-3 py-1.5 text-[13px] font-bold text-rose-700 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> Currently Out of Stock ({pkg ? pkg.quantity : 'All sizes'})
              </div>
            )}

            {/* Out-of-Stock Edge Case & "Notify Me When Available" */}
            {stock === 0 ? (
              <div className="mt-6 rounded-2xl border-2 border-dashed border-rose-200 dark:border-rose-800/60 bg-gradient-to-br from-rose-50/60 via-white to-amber-50/40 dark:from-rose-950/20 dark:to-gray-900 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      Notify Me When {pkg ? `"${pkg.quantity}"` : 'This Pack'} Is Back in Stock
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                      Enter your email or phone below. We'll send an instant notification as soon as fresh packets are restocked.
                    </p>

                    {notifySuccess ? (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 px-3.5 py-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span>You're on the list! We will notify you the moment this packet is available.</span>
                      </div>
                    ) : (
                      <form onSubmit={handleNotifySubmit} className="mt-3 flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            required
                            value={notifyContact}
                            onChange={(e) => setNotifyContact(e.target.value)}
                            placeholder="Enter email or phone number"
                            className="h-11 w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-9 pr-3 text-xs font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-fv-primary focus:outline-none focus:ring-1 focus:ring-fv-primary"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={notifySubmitting}
                          className="h-11 shrink-0 rounded-xl bg-fv-primary px-5 text-xs font-bold text-white hover:bg-fv-primary-dark transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                        >
                          {notifySubmitting ? 'Registering…' : 'Notify Me'}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* In-Stock Action Stepper and Buttons */
              <div className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <span className="text-[14px] font-semibold text-fv-heading sm:hidden">Quantity:</span>
                  <QuantityStepper value={quantity} onChange={setQuantity} max={stock || 1} />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-1 sm:items-center sm:gap-3">
                  <button
                    type="button"
                    disabled={!stock}
                    onClick={handleAddToCart}
                    className="h-12 w-full sm:flex-1 rounded-xl bg-fv-primary px-3 sm:px-6 text-[14px] sm:text-[15px] font-semibold text-white shadow-xs
                               transition-all duration-200 hover:bg-fv-primary-dark hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed
                               disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2
                               focus-visible:ring-fv-primary focus-visible:ring-offset-2 motion-reduce:transition-none cursor-pointer shimmer-btn flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0 hidden xs:inline-block" />
                    <span>Add to cart</span>
                  </button>
                  <button
                    type="button"
                    disabled={!stock}
                    onClick={handleBuyNow}
                    className="h-12 w-full sm:w-auto rounded-xl border-2 border-fv-primary px-3 sm:px-6 text-[14px] sm:text-[15px] font-semibold text-fv-primary
                               hover:bg-fv-primary hover:text-white transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary
                               focus-visible:ring-offset-2 cursor-pointer flex items-center justify-center whitespace-nowrap"
                  >
                    Buy now
                  </button>
                </div>
              </div>
            )}

            <OffersBox />

            <ul className="mt-6 grid gap-3 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-green-50/70 dark:from-emerald-950/30 dark:to-green-950/20 border border-emerald-100/80 dark:border-emerald-800/40 p-4 sm:grid-cols-3">
              {GUARANTEES.map(({ Icon, title, detail }) => (
                <li key={title} className="flex items-start gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white dark:bg-gray-800 text-fv-primary shadow-2xs shrink-0 mt-0.5">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <span className="block text-[13px] font-bold text-gray-900 dark:text-white">{title}</span>
                    <span className="block text-[11px] text-gray-600 dark:text-gray-400">{detail}</span>
                  </div>
                </li>
              ))}
            </ul>

            <DeliveryCheck />

            {/* Botanical Growing Specifications Grid */}
            <section
              className="mt-8 rounded-2xl border border-fv-border/70 bg-white dark:bg-gray-800 p-5 shadow-xs"
              aria-labelledby="specs-heading"
            >
              <h2
                id="specs-heading"
                className="font-serif text-[18px] font-semibold text-fv-heading flex items-center gap-2"
              >
                <Leaf className="w-5 h-5 text-emerald-600" />
                <span>Growing Specifications & Plant Info</span>
              </h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#F8FAF9] dark:bg-gray-700/50 p-3 border border-emerald-50 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Germination Rate
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">85%+ Lab Tested</p>
                </div>
                <div className="rounded-xl bg-[#F8FAF9] dark:bg-gray-700/50 p-3 border border-emerald-50 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5" /> Best Season
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">
                    {product.season || 'All Season'}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F8FAF9] dark:bg-gray-700/50 p-3 border border-emerald-50 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <Sun className="w-3.5 h-3.5" /> Sunlight
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">4–6 Hours Direct</p>
                </div>
                <div className="rounded-xl bg-[#F8FAF9] dark:bg-gray-700/50 p-3 border border-emerald-50 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <Droplets className="w-3.5 h-3.5" /> Watering
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">Keep Soil Moist</p>
                </div>
                <div className="rounded-xl bg-[#F8FAF9] dark:bg-gray-700/50 p-3 border border-emerald-50 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <Sprout className="w-3.5 h-3.5" /> Sprouting Time
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">6–10 Days</p>
                </div>
                <div className="rounded-xl bg-[#F8FAF9] dark:bg-gray-700/50 p-3 border border-emerald-50 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Seed Purity
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">100% Non-GMO</p>
                </div>
              </div>
            </section>

            {product.features?.length > 0 && (
              <section className="mt-8" aria-labelledby="features-heading">
                <h2 id="features-heading" className="font-serif text-[20px] font-semibold text-fv-heading">
                  Highlights
                </h2>
                <ul className="mt-3 space-y-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[15px] text-fv-ink">
                      <Sprout className="mt-1 h-4 w-4 shrink-0 text-fv-accent" aria-hidden="true" />
                      {f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {product.howToGrow && (
              <section
                className="mt-8 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-gray-800 border border-emerald-100 dark:border-emerald-800 p-5"
                aria-labelledby="grow-heading"
              >
                <h2
                  id="grow-heading"
                  className="font-serif text-[20px] font-semibold text-fv-heading flex items-center gap-2"
                >
                  <Sprout className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                  <span>How to Sow & Grow</span>
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-800 dark:text-gray-200">
                  {product.howToGrow}
                </p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-3 text-xs text-emerald-900 dark:text-emerald-200">
                  <div className="rounded-lg bg-white/90 dark:bg-gray-800/90 p-2.5 border border-emerald-100 dark:border-gray-700 shadow-2xs">
                    <strong className="block font-bold">1. Soil Prep</strong>
                    <span className="text-gray-600 dark:text-gray-400 mt-0.5 block">
                      Use loose, well-draining potting mix with vermicompost.
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/90 dark:bg-gray-800/90 p-2.5 border border-emerald-100 dark:border-gray-700 shadow-2xs">
                    <strong className="block font-bold">2. Sowing Depth</strong>
                    <span className="text-gray-600 dark:text-gray-400 mt-0.5 block">
                      Plant seeds 0.5 cm deep; cover lightly with fine soil.
                    </span>
                  </div>
                  <div className="rounded-lg bg-white/90 dark:bg-gray-800/90 p-2.5 border border-emerald-100 dark:border-gray-700 shadow-2xs">
                    <strong className="block font-bold">3. Moisture</strong>
                    <span className="text-gray-600 dark:text-gray-400 mt-0.5 block">
                      Spray gently with water mister to keep surface moist.
                    </span>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <ReviewsSection productId={product._id} productName={product.name} />
      <RelatedProducts categoryId={categoryId} excludeId={product._id} />

      {/* Gymshark / BigBasket Benchmark Mobile Sticky Bottom Dock */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-fv-border bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:hidden">
        <div className="flex items-center justify-between gap-3 max-w-[1500px] mx-auto">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {pkg && (
                <span className="rounded-md bg-emerald-100/90 dark:bg-emerald-950/80 px-1.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  {pkg.quantity}
                </span>
              )}
              {hasDiscount && (
                <span className="rounded-md bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                  {discountPct}% OFF
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[18px] font-extrabold text-[#00B566]">
                ₹{lineTotal.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <s className="text-[12px] text-gray-400">
                  ₹{(original * quantity).toLocaleString('en-IN')}
                </s>
              )}
            </div>
          </div>

          {stock > 0 ? (
            <div className="flex items-center gap-2 shrink-0">
              <QuantityStepper value={quantity} onChange={setQuantity} max={stock || 1} />
              <button
                type="button"
                onClick={handleAddToCart}
                className="h-11 min-h-[44px] shrink-0 rounded-xl bg-fv-primary px-4 text-[13px] font-bold text-white active:scale-95 transition-transform shadow-xs cursor-pointer shimmer-btn flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('specs-heading');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                toast('Enter your email above to receive instant back-in-stock alert', { icon: '🔔' });
              }}
              className="h-11 shrink-0 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 text-[13px] font-bold text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span>Notify Me</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
