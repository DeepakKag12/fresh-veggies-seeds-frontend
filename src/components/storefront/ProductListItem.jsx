import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Star, Heart, ShoppingBag, Check, ShieldCheck, Sun, Snowflake, CloudRain, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { getProductImageUrl, handleImageError } from '../../utils/imageFallback';

/**
 * BigBasket / Nature's Basket Botanical Product List Item
 * Horizontal layout for high-efficiency grocery/botanical catalog browsing.
 */
const ProductListItem = ({ product, onEdit, onDelete, isAdmin = false }) => {
  const location = useLocation();
  const [imgFailed, setImgFailed] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);
  const [heartBounced, setHeartBounced] = useState(false);
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const productPackages = product?.packages || [];
  const hasPackages = Array.isArray(productPackages) && productPackages.length > 0;
  const initialPkg = hasPackages ? (productPackages.find((p) => p.stock > 0) || productPackages[0]) : null;
  const [selectedPkg, setSelectedPkg] = useState(initialPkg);

  useEffect(() => {
    if (hasPackages) {
      setSelectedPkg(productPackages.find((p) => p.stock > 0) || productPackages[0]);
    } else {
      setSelectedPkg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  if (!product) return null;

  const {
    _id,
    name,
    price: basePrice,
    originalPrice: baseOriginalPrice,
    images = [],
    rating = 0,
    numReviews = 0,
    description,
    stock = 0,
    packages = [],
    season,
    featured,
  } = product;

  const activePrice = selectedPkg ? selectedPkg.price : basePrice;
  const activeStock = selectedPkg ? selectedPkg.stock : stock;
  const activeOriginalPrice = selectedPkg?.originalPrice || baseOriginalPrice || (activePrice > 0 ? Math.round(activePrice * 1.3) : activePrice);
  const hasDiscount = activeOriginalPrice > activePrice;
  const discountPct = hasDiscount ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100) : 0;
  const isOutOfStock = activeStock <= 0;

  const fallbackProductImage = getProductImageUrl(product);
  const primaryImage = images?.[0] && !imgFailed && !images[0].includes('via.placeholder') ? images[0] : null;
  const effectivePrimaryImage = primaryImage || fallbackProductImage;
  const isFavorited = isInWishlist(_id);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    const cartItem = {
      ...product,
      price: activePrice,
      stock: activeStock,
      packageId: selectedPkg?._id || null,
      selectedPackage: selectedPkg ? { size: selectedPkg.quantity, price: selectedPkg.price } : null,
    };

    addToCart(cartItem, 1);
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 1200);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHeartBounced(true);
    setTimeout(() => setHeartBounced(false), 400);
    toggleWishlist(product);
  };

  return (
    <article className={`group relative flex flex-col sm:flex-row items-stretch rounded-2xl border transition-all duration-200 overflow-hidden ${
      isOutOfStock
        ? 'border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/60'
        : 'border-[#CADFD4]/80 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-fv-primary hover:shadow-md'
    }`}>
      {/* Thumbnail with Out-of-Stock Greyscale Edge Case */}
      <div className="relative w-full sm:w-44 md:w-52 aspect-square sm:aspect-auto shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-700">
        <Link to={`/product/${_id}`} state={{ from: location }} className="block h-full w-full">
          <img
            src={effectivePrimaryImage}
            alt={name}
            loading="lazy"
            onError={(e) => {
              setImgFailed(true);
              handleImageError(e, fallbackProductImage);
            }}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isOutOfStock ? 'grayscale contrast-75 opacity-75' : ''
            }`}
          />
        </Link>

        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none z-10">
          {isOutOfStock ? (
            <span className="rounded-full bg-black/85 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Out of Stock
            </span>
          ) : featured ? (
            <span className="rounded-full bg-[#fed02f] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0a4c36] shadow-2xs">
              Bestseller
            </span>
          ) : hasDiscount && discountPct > 0 ? (
            <span className="rounded-full bg-[#fed02f] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#0a4c36] shadow-2xs">
              {discountPct}% OFF
            </span>
          ) : null}
        </div>

        {/* Wishlist Button */}
        {!isAdmin && (
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-2xs hover:scale-110 active:scale-95 transition-all z-10"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-all duration-300 ${
                heartBounced ? 'scale-125' : 'scale-100'
              } ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            />
          </button>
        )}
      </div>

      {/* Middle Details */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
        <div>
          {/* Botanical Freshness Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {season && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {season === 'Summer' && <Sun className="w-2.5 h-2.5 text-amber-500" />}
                {season === 'Winter' && <Snowflake className="w-2.5 h-2.5 text-blue-400" />}
                {season === 'Monsoon' && <CloudRain className="w-2.5 h-2.5 text-cyan-500" />}
                {season === 'All Season' && <Sparkles className="w-2.5 h-2.5 text-emerald-500" />}
                <span>{season} Crop</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200">
              <ShieldCheck className="w-2.5 h-2.5 text-green-600" />
              <span>100% Organic</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
              <span>98% Germination</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-fv-primary transition-colors line-clamp-1">
            <Link to={`/product/${_id}`} state={{ from: location }}>
              {name}
            </Link>
          </h3>

          {/* Reviews & Star Rating */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
              <span>{(rating || 4.8).toFixed(1)}</span>
              <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
            </div>
            <span className="text-xs text-gray-500">
              ({numReviews || 12} reviews)
            </span>
          </div>

          {/* Description */}
          {description && (
            <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {/* Variant Selector */}
          {hasPackages && packages.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">
                Pack Size:
              </span>
              {packages.map((pkg) => {
                const isSelected = selectedPkg?._id === pkg._id;
                const isPkgSoldOut = pkg.stock <= 0;
                return (
                  <button
                    key={pkg._id}
                    type="button"
                    onClick={() => setSelectedPkg(pkg)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border ${
                      isSelected
                        ? 'bg-fv-primary text-white border-fv-primary shadow-2xs'
                        : isPkgSoldOut
                        ? 'bg-gray-100 text-gray-400 border-gray-200 line-through opacity-70'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-fv-primary'
                    }`}
                  >
                    {pkg.quantity} — ₹{pkg.price}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Pricing & Quick Add Section */}
      <div className="w-full sm:w-48 p-4 sm:p-5 flex sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-3 shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40">
        <div className="text-left sm:text-right">
          <div className="flex items-baseline gap-1.5 sm:justify-end">
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{activePrice?.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <s className="text-xs text-gray-400 line-through">
                ₹{activeOriginalPrice?.toLocaleString('en-IN')}
              </s>
            )}
          </div>
          <div className="mt-0.5">
            {isOutOfStock ? (
              <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                Out of Stock
              </span>
            ) : activeStock <= 10 ? (
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 animate-pulse">
                Only {activeStock} left!
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                In Stock • Fresh Batch
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={isOutOfStock}
          onClick={handleQuickAdd}
          className={`w-full sm:w-36 h-10 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-xs ${
            isOutOfStock
              ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600'
              : addedAnim
              ? 'bg-emerald-600 text-white'
              : 'bg-fv-primary hover:bg-fv-primary-dark text-white hover:shadow-md cursor-pointer active:scale-95'
          }`}
        >
          {addedAnim ? (
            <>
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Added!</span>
            </>
          ) : isOutOfStock ? (
            <span>Sold Out</span>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Cart</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};

export default ProductListItem;
