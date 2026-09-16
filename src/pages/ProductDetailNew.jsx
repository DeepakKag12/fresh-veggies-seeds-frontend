import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Star, Share2, ChevronRight, ShieldCheck, Truck, Banknote, Sprout } from 'lucide-react';
import { cachedGet } from '../utils/api';
import { useCart } from '../context/CartContext';
import PageLoader from '../components/PageLoader';
import ProductGallery from '../components/storefront/ProductGallery';
import VariantPicker from '../components/storefront/VariantPicker';
import QuantityStepper from '../components/storefront/QuantityStepper';
import OffersBox from '../components/storefront/OffersBox';
import ReviewsSection from '../components/storefront/ReviewsSection';
import RelatedProducts from '../components/storefront/RelatedProducts';
import { useSettings } from '../context/SettingsContext';

const ProductDetailNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { settings } = useSettings();

  const freeDeliveryThreshold = settings?.delivery?.freeDeliveryThreshold ?? 300;
  const deliveryCharge = settings?.delivery?.deliveryCharge ?? 50;

  const GUARANTEES = [
    { Icon: Truck, title: `Free delivery over ₹${freeDeliveryThreshold}`, detail: `Flat ₹${deliveryCharge} below that` },
    { Icon: Banknote, title: 'Cash on delivery', detail: 'Pay when it arrives' },
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
        <ol className="flex flex-wrap items-center gap-1 text-[13px] text-fv-muted">
          <li><Link to="/" className="hover:text-fv-primary hover:underline">Shop</Link></li>
          <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
          <li aria-current="page" className="truncate text-fv-heading">{product.name}</li>
        </ol>
      </nav>

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <ProductGallery images={product.images || []} name={product.name} />

          <div className="min-w-0">
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-serif text-[28px] font-semibold leading-tight text-fv-heading sm:text-[36px]">
                {product.name}
              </h1>
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share this product"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-fv-border
                           text-fv-primary hover:bg-white focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-fv-primary"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" />
              </button>
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
              <span className="text-[32px] font-semibold text-fv-deep">₹{price?.toLocaleString('en-IN')}</span>
              {hasDiscount && <s className="text-[18px] text-fv-muted">₹{original.toLocaleString('en-IN')}</s>}
              <span className="text-[13px] text-fv-muted">Inclusive of all taxes</span>
            </p>

            <p className={`mt-2 text-[14px] font-medium ${stock > 0 ? 'text-fv-success' : 'text-fv-danger'}`}>
              {stock > 0 ? `In stock · ${stock} available` : 'Out of stock'}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <QuantityStepper value={quantity} onChange={setQuantity} max={stock || 1} />
              <button
                type="button"
                disabled={!stock}
                onClick={handleAddToCart}
                className="h-12 flex-1 rounded-full bg-fv-primary px-6 text-[15px] font-semibold text-white shadow-xs
                           transition-all duration-200 hover:bg-fv-primary-dark hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed
                           disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-fv-primary focus-visible:ring-offset-2 motion-reduce:transition-none cursor-pointer"
              >
                Add to cart · ₹{lineTotal.toLocaleString('en-IN')}
              </button>
              <button
                type="button"
                disabled={!stock}
                onClick={handleBuyNow}
                className="h-12 rounded-full border-2 border-fv-primary px-6 text-[15px] font-semibold text-fv-primary
                           hover:bg-fv-primary hover:text-white transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary
                           focus-visible:ring-offset-2 cursor-pointer"
              >
                Buy now
              </button>
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
              <section className="mt-8" aria-labelledby="grow-heading">
                <h2 id="grow-heading" className="font-serif text-[20px] font-semibold text-fv-heading">How to grow</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-fv-ink">{product.howToGrow}</p>
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
            className="h-12 min-h-[44px] shrink-0 rounded-full bg-fv-primary px-6 text-[15px] font-semibold text-white
                       disabled:opacity-50 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary shadow-xs cursor-pointer"
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailNew;
