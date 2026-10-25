import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Star, Sprout, Pencil, Trash2, Heart, ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

/**
 * Ugaoo-Inspired Botanical Product Card:
 * - Direct variant pill selector (Weight: 8g, 25g, 100g... or Count: 50 Seeds, 100 Seeds...)
 * - Live price update on variant change
 * - Dual image cross-fade on card hover
 * - 1-Click "Add to Cart" directly into CartDrawer
 * - Wishlist heart toggle
 * - Verified star rating and discount badges
 * - Preserves admin edit/delete controls
 */
const ProductCardV2 = ({ product, onEdit, onDelete, isAdmin = false }) => {
  const location = useLocation();
  const [imgFailed, setImgFailed] = useState(false);
  const [secondImgFailed, setSecondImgFailed] = useState(false);
  const [addedAnim, setAddedAnim] = useState(false);
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
    weight,
    season,
    featured,
  } = product;

  const activePrice = selectedPkg ? selectedPkg.price : basePrice;
  const activeStock = selectedPkg ? selectedPkg.stock : stock;
  const activeOriginalPrice = selectedPkg?.originalPrice || baseOriginalPrice || (activePrice > 0 ? Math.round(activePrice * 1.3) : activePrice);
  const hasDiscount = activeOriginalPrice > activePrice;
  const discountPct = hasDiscount ? Math.round(((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100) : 0;
  const isOutOfStock = activeStock <= 0;

  const FALLBACK_PRODUCT_IMAGE = '/sandbox-assets/guides/guide_1.webp';
  const primaryImage = images?.[0] && !imgFailed ? images[0] : null;
  const effectivePrimaryImage = primaryImage || FALLBACK_PRODUCT_IMAGE;
  const secondaryImage = images?.[1] && !secondImgFailed ? images[1] : null;

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
    toggleWishlist(product);
  };

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[18px] border border-[#CADFD4]/70 bg-white transition-all duration-300 hover:shadow-xl hover:border-[#0A4D3C]/60">
      {/* Admin Action Buttons */}
      {isAdmin && (
        <div className="absolute right-3 top-3 z-30 flex gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(product)}
              aria-label={`Edit ${name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-fv-primary shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(product)}
              aria-label={`Delete ${name}`}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-fv-danger shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Product Image Area with Dual Hover Swap */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#F7F7F7]">
        <Link to={`/product/${_id}`} state={{ from: location }} className="block h-full w-full">
          {effectivePrimaryImage ? (
            <>
              {/* Primary Image */}
              <img
                src={effectivePrimaryImage}
                alt={name}
                loading="lazy"
                decoding="async"
                onError={() => setImgFailed(true)}
                className={`h-full w-full object-cover transition-all duration-500 ease-out ${
                  secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
                }`}
              />
              {/* Secondary Image cross-fade on hover (Ugaoo style) */}
              {secondaryImage && (
                <img
                  src={secondaryImage}
                  alt={`${name} preview`}
                  loading="lazy"
                  decoding="async"
                  onError={() => setSecondImgFailed(true)}
                  className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-hover:scale-105"
                />
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-50">
              <Sprout className="h-12 w-12 text-fv-primary/30" aria-hidden="true" />
            </div>
          )}
        </Link>

        {/* Top-Left Badges */}
        <div className="absolute left-2.5 top-2.5 z-20 flex flex-col gap-1 pointer-events-none">
          {isOutOfStock ? (
            <span className="rounded-full bg-gray-900/80 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
              Sold Out
            </span>
          ) : featured ? (
            <span className="rounded-full bg-[#fed02f] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#0a4c36] shadow-xs">
              Bestseller
            </span>
          ) : hasDiscount && discountPct > 0 ? (
            <span className="rounded-full bg-[#fed02f] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#0a4c36] shadow-xs">
              {discountPct}% OFF
            </span>
          ) : null}
        </div>

        {/* Top-Right Wishlist Button */}
        {!isAdmin && (
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label={isFavorited ? 'Remove from wishlist' : 'Add to wishlist'}
            className="absolute right-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-xs backdrop-blur-sm transition-all hover:bg-white hover:scale-110 active:scale-90 cursor-pointer"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600 hover:text-red-500'
              }`}
            />
          </button>
        )}

        {/* Bottom-Left Star Rating Pill */}
        {rating > 0 && (
          <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-gray-800 shadow-xs backdrop-blur-sm border border-gray-100">
            <span>{rating.toFixed(1)}</span>
            <Star className="h-3 w-3 fill-[#00A93D] text-[#00A93D]" />
            {numReviews > 0 && (
              <span className="text-[10px] font-normal text-gray-500">({numReviews})</span>
            )}
          </div>
        )}
      </div>

      {/* Card Content Area */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Category / Season Subtext */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
          <span className="uppercase tracking-wider font-semibold text-emerald-800/80">
            {season || 'All Season'}
          </span>
          {weight && !hasPackages && (
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
              {weight}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-sans text-[14px] sm:text-[16px] font-semibold leading-snug text-gray-900 group-hover:text-fv-primary transition-colors line-clamp-1">
          <Link to={`/product/${_id}`} state={{ from: location }} className="hover:underline">
            {name}
          </Link>
        </h3>

        {/* Brief description / blurb */}
        {description && (
          <p className="mt-1 line-clamp-1 text-[12px] text-gray-500 leading-normal">
            {description}
          </p>
        )}

        {/* Ugaoo In-Card Variant Selector Pills (Count or Weight) */}
        {hasPackages && packages.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {packages.map((pkg) => {
              const isSelected = selectedPkg?._id === pkg._id;
              const isPkgSoldOut = pkg.stock <= 0;
              return (
                <button
                  key={pkg._id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedPkg(pkg);
                  }}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-fv-primary text-white border-fv-primary shadow-xs'
                      : isPkgSoldOut
                      ? 'bg-gray-50 text-gray-400 border-gray-200 line-through opacity-70'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-fv-primary'
                  }`}
                  title={isPkgSoldOut ? `${pkg.quantity} (Out of Stock)` : `${pkg.quantity} - ₹${pkg.price}`}
                >
                  {pkg.quantity}
                </button>
              );
            })}
          </div>
        )}

        {/* Price & Add to Cart Row */}
        <div className="mt-auto pt-2.5 sm:pt-3 flex items-center justify-between gap-1.5 sm:gap-2 border-t border-gray-100/80">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-[15px] sm:text-[19px] font-extrabold text-[#00B566]">
                ₹{activePrice?.toLocaleString('en-IN')}
              </span>
              {hasDiscount && (
                <s className="text-[11px] sm:text-[12px] text-gray-400 line-through">
                  ₹{activeOriginalPrice?.toLocaleString('en-IN')}
                </s>
              )}
            </div>
            {selectedPkg && (
              <span className="text-[10px] text-gray-500 font-medium -mt-0.5 truncate">
                Size: {selectedPkg.quantity}
              </span>
            )}
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleQuickAdd}
            className={`inline-flex h-8 sm:h-9 shrink-0 items-center justify-center gap-1 sm:gap-1.5 rounded-full px-2.5 sm:px-4 text-[11px] sm:text-[13px] font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-xs ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                : addedAnim
                ? 'bg-[#00A93D] text-white'
                : 'bg-[#0A4D3C] text-white hover:bg-[#083B2A] hover:shadow-md'
            }`}
          >
            {addedAnim ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Added</span>
              </>
            ) : isOutOfStock ? (
              <span>Sold Out</span>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCardV2;
