import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, Share2, ChevronRight, ShieldCheck, Truck, Banknote, Sprout, AlertCircle, ShoppingBag, Heart, CheckCircle2, Sun, Droplets, Calendar, Leaf, ArrowLeft } from 'lucide-react';
import { cachedGet } from '../utils/api';
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

const ProductDetailNew = () => {
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

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cachedGet(`/products/${id}`);
      const p = res.data.data;
      setProduct(p);
      // Pack prices come from the product document. They used to be invented in
      // the browser (price × 1.8, × 4 …), which meant the price shown could
      // never match what the server actually charged.
      setPkg(p?.packages?.find((x) => x.stock > 0) || p?.packages?.[0] || null);
      setQuantity(1);
    } catch {
      setProduct(null);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchProduct(); }, [fetchProduct]);

  const price = pkg ? pkg.price : product?.price;
  const stock = pkg ? pkg.stock : product?.stock;
  const original = product?.originalPrice;
  const hasDiscount = original > price;
  const lineTotal = useMemo(() => (price || 0) * quantity, [price, quantity]);
  const categoryId = product?.categoryId?._id || product?.categoryId;

  // packageId is what the server prices against; without it the backend would
  // fall back to the base product price.
  const buildCartItem = () => ({
    ...product,
    price,
    stock,
    packageId: pkg?._id || null,
    selectedPackage: pkg ? { size: pkg.quantity, price: pkg.price } : null,
  });

  const handleAddToCart = () => {
    addToCart(buildCartItem(), quantity);
    toast.success(`${product.name} added to cart`);
  };

  const handleBuyNow = () => {
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
    } catch { /* the user dismissed the share sheet */ }
  };

  if (loading) return <div className="bg-fv-page"><PageLoader fullHeight text="Loading product…" /></div>;

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-fv-page px-4 text-center">
        <Sprout className="h-12 w-12 text-fv-primary/30" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-[24px] font-semibold text-fv-heading">Product not found</h1>
        <p className="mt-1 text-[15px] text-fv-muted">It may have been removed or the link is wrong.</p>
        <Link to="/" className="mt-6 inline-flex h-12 items-center rounded-[50px] bg-fv-primary px-6 text-[15px] font-semibold text-white hover:bg-fv-primary-dark">
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-fv-page pb-36 lg:pb-12">
      <nav aria-label="Breadcrumb" className="mx-auto max-w-[1500px] px-4 pt-6 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-fv-muted">
            <li>
              <Link to="/" className="hover:text-fv-primary hover:underline font-medium">
                Shop
              </Link>
            </li>
            <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
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
                <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
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
              } else if (window.history.length > 1) {
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

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images || []} name={product.name} />

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-serif text-[28px] font-semibold leading-tight text-fv-heading sm:text-[36px]">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  aria-label={isInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
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

            {product.rating > 0 && (
              <a href="#reviews-heading" className="mt-2 inline-flex items-center gap-2 text-[14px] text-fv-primary hover:underline">
                <span className="flex" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`h-4 w-4 ${i <= Math.round(product.rating) ? 'fill-fv-star text-fv-star' : 'text-fv-border'}`} />
                  ))}
                </span>
                {product.rating.toFixed(2)} · {product.numReviews} reviews
              </a>
            )}

            {product.description && (
              <p className="mt-4 text-[15px] leading-relaxed text-fv-ink">{product.description}</p>
            )}

            <VariantPicker
              packages={product.packages || []}
              selectedId={pkg?._id}
              onSelect={(p) => { setPkg(p); setQuantity(1); }}
            />

            <p className="mt-6 flex flex-wrap items-baseline gap-3">
              <span className="text-[32px] font-extrabold text-[#00B566]">₹{price?.toLocaleString('en-IN')}</span>
              {hasDiscount && <s className="text-[18px] text-gray-400">₹{original.toLocaleString('en-IN')}</s>}
              <span className="text-[13px] text-gray-500">Inclusive of all taxes</span>
            </p>

            {stock > 0 && stock <= (settings?.inventory?.lowStockThreshold ?? 10) && (settings?.inventory?.showOnlyXLeft ?? true) ? (
              <p className="mt-2 text-[13px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" /> Only {stock} left in stock — order soon!
              </p>
            ) : (
              <p className={`mt-2 text-[14px] font-medium ${stock > 0 ? 'text-fv-success' : 'text-fv-danger'}`}>
                {stock > 0 ? `In stock · ${stock} available` : 'Out of stock'}
              </p>
            )}

            <div className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
              {/* Quantity selector: comfortable row on mobile with label, inline on desktop */}
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <span className="text-[14px] font-semibold text-fv-heading sm:hidden">Quantity:</span>
                <QuantityStepper value={quantity} onChange={setQuantity} max={stock || 1} />
              </div>

              {/* Action buttons: 2 equal-width columns on mobile so neither button is squeezed */}
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

            {/* Ugaoo-Inspired Gardening Specifications Grid */}
            <section className="mt-8 rounded-2xl border border-fv-border/70 bg-white p-5 shadow-xs" aria-labelledby="specs-heading">
              <h2 id="specs-heading" className="font-serif text-[18px] font-semibold text-fv-heading flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600" />
                <span>Growing Specifications & Plant Info</span>
              </h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#F8FAF9] p-3 border border-emerald-50">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Germination Rate
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900">85%+ Lab Tested</p>
                </div>
                <div className="rounded-xl bg-[#F8FAF9] p-3 border border-emerald-50">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5" /> Best Season
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900">{product.season || 'All Season'}</p>
                </div>
                <div className="rounded-xl bg-[#F8FAF9] p-3 border border-emerald-50">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <Sun className="w-3.5 h-3.5" /> Sunlight
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900">4–6 Hours Direct</p>
                </div>
                <div className="rounded-xl bg-[#F8FAF9] p-3 border border-emerald-50">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <Droplets className="w-3.5 h-3.5" /> Watering
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900">Keep Soil Moist</p>
                </div>
                <div className="rounded-xl bg-[#F8FAF9] p-3 border border-emerald-50">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <Sprout className="w-3.5 h-3.5" /> Sprouting Time
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900">6–10 Days</p>
                </div>
                <div className="rounded-xl bg-[#F8FAF9] p-3 border border-emerald-50">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Seed Purity
                  </div>
                  <p className="mt-1 text-sm font-bold text-gray-900">100% Non-GMO</p>
                </div>
              </div>
            </section>

            {product.features?.length > 0 && (
              <section className="mt-8" aria-labelledby="features-heading">
                <h2 id="features-heading" className="font-serif text-[20px] font-semibold text-fv-heading">Highlights</h2>
                <ul className="mt-3 space-y-2">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[15px] text-fv-ink">
                      <Sprout className="mt-1 h-4 w-4 shrink-0 text-fv-accent" aria-hidden="true" />{f}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {product.howToGrow && (
              <section className="mt-8 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-white border border-emerald-100 p-5" aria-labelledby="grow-heading">
                <h2 id="grow-heading" className="font-serif text-[20px] font-semibold text-fv-heading flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-700" />
                  <span>How to Sow & Grow</span>
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-gray-800">{product.howToGrow}</p>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-3 text-xs text-emerald-900">
                  <div className="rounded-lg bg-white/90 p-2.5 border border-emerald-100 shadow-2xs">
                    <strong className="block font-bold">1. Soil Prep</strong>
                    <span className="text-gray-600 mt-0.5 block">Use loose, well-draining potting mix with vermicompost.</span>
                  </div>
                  <div className="rounded-lg bg-white/90 p-2.5 border border-emerald-100 shadow-2xs">
                    <strong className="block font-bold">2. Sowing Depth</strong>
                    <span className="text-gray-600 mt-0.5 block">Plant seeds 0.5 cm deep; cover lightly with fine soil.</span>
                  </div>
                  <div className="rounded-lg bg-white/90 p-2.5 border border-emerald-100 shadow-2xs">
                    <strong className="block font-bold">3. Moisture</strong>
                    <span className="text-gray-600 mt-0.5 block">Spray gently with water mister to keep surface moist.</span>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <ReviewsSection productId={product._id} productName={product.name} />
      <RelatedProducts categoryId={categoryId} excludeId={product._id} />

      {/* Sticky buy bar on phones, positioned cleanly with safe area support */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-fv-border bg-white/95 backdrop-blur-md px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="flex items-center gap-3 max-w-[1500px] mx-auto">
          <p className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-fv-heading">{product.name}</span>
            <span className="block text-[16px] font-bold text-fv-deep">₹{lineTotal.toLocaleString('en-IN')}</span>
          </p>
          <button
            type="button"
            disabled={!stock}
            onClick={handleAddToCart}
            className="h-11 min-h-[44px] shrink-0 rounded-xl bg-fv-primary px-5 text-[14px] font-semibold text-white
                       disabled:opacity-50 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary shadow-xs cursor-pointer shimmer-btn"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailNew;
