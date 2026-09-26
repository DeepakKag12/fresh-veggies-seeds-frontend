import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Sprout, Pencil, Trash2, ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

/**
 * [CHG-028] ProductCardV2
 *
 * Polished botanical product card with direct "Add to Cart" functionality
 * and a crisp rectangular button (`rounded-[10px] sm:rounded-xl`) that maintains
 * its professional button shape on mobile phones without collapsing into an awkward circle.
 */
const ProductCardV2 = ({ product, onEdit, onDelete, isAdmin = false }) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  if (!product) return null;

  const {
    _id,
    name,
    price,
    originalPrice,
    images,
    rating,
    numReviews,
    description,
    stock,
    packages,
    featured,
  } = product;

  const hasPackages = Array.isArray(packages) && packages.length > 0;
  const packageStock = hasPackages
    ? packages.reduce((sum, pkg) => sum + (Number(pkg.stock) || 0), 0)
    : 0;
  const effectiveStock = hasPackages ? packageStock : (stock ?? 0);

  const hasDiscount = originalPrice > price;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;
  const outOfStock = effectiveStock <= 0;
  const showImage = images?.[0] && !imgFailed;

  const handleActionClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (outOfStock) return;

    // If product has multiple packages, let customer select packaging size on product page
    if (hasPackages && packages.length > 1) {
      navigate(`/product/${_id}`);
      return;
    }

    // Default package or single price product
    const itemToAdd =
      hasPackages && packages.length === 1
        ? {
            ...product,
            packageId: packages[0]._id,
            price: packages[0].price,
            selectedWeight: packages[0].size || packages[0].weight || '',
          }
        : product;

    addToCart(itemToAdd, 1);
    setAdded(true);
    toast.success(`${name} added to cart!`);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-[18px] sm:rounded-[20px] border border-gray-100/90 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all
                 duration-300 botanical-card-hover hover:border-emerald-300 dark:hover:border-emerald-700 motion-reduce:transition-none shadow-2xs"
    >
      {isAdmin && (
        <div className="absolute right-2.5 top-2.5 z-20 flex gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(product)}
              aria-label={`Edit ${name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-fv-primary shadow-sm
                         hover:bg-white hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(product)}
              aria-label={`Delete ${name}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/95 text-fv-danger shadow-sm
                         hover:bg-white hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-danger cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/* Product Image Link */}
      <Link
        to={`/product/${_id}`}
        className="relative block aspect-square overflow-hidden bg-fv-surface"
        tabIndex={-1}
        aria-hidden="true"
      >
        {showImage ? (
          <img
            src={images[0]}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out
                       group-hover:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fv-cream to-fv-surface">
            <Sprout className="h-12 w-12 text-fv-primary/25" aria-hidden="true" />
          </div>
        )}

        {/* Badges */}
        {(featured || hasDiscount || outOfStock) && !isAdmin && (
          <span
            className={`absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-xs backdrop-blur-xs transition-transform duration-200 group-hover:scale-105 ${
              outOfStock
                ? 'bg-white/90 text-fv-muted border border-gray-200'
                : featured
                ? 'bg-[#ffd029] text-[#0a4c36] border border-[#ffd029]/80 shadow-xs'
                : 'bg-fv-primary text-white border border-fv-primary/20'
            }`}
          >
            {outOfStock ? 'Out of stock' : featured ? 'Bestseller' : `${discountPct}% off`}
          </span>
        )}

        {/* Rating pill */}
        {rating > 0 && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-white/95 dark:bg-gray-800/95 px-2 py-0.5 shadow-2xs backdrop-blur-md border border-gray-100 dark:border-gray-700/60">
            <span className="text-[11px] sm:text-[12px] font-bold leading-none text-emerald-800 dark:text-emerald-300">
              {rating.toFixed(1)}
            </span>
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-[#00A93D] text-[#00A93D]" aria-hidden="true" />
            {numReviews > 0 && (
              <span className="text-[10px] leading-none text-gray-500 dark:text-gray-400 font-medium">
                ({numReviews})
              </span>
            )}
          </span>
        )}
      </Link>

      {/* Card Info & CTA */}
      <div className="flex flex-1 flex-col p-2.5 sm:p-4 pt-2.5 sm:pt-3.5">
        <h3 className="truncate font-sans text-[14px] sm:text-[16px] font-semibold leading-snug text-gray-900 dark:text-white group-hover:text-fv-primary transition-colors">
          <Link
            to={`/product/${_id}`}
            className="hover:text-fv-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
          >
            {name}
          </Link>
        </h3>
        {description && (
          <p className="mt-0.5 truncate text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}

        <div className="mt-auto pt-2.5 sm:pt-3 flex flex-col gap-2">
          {/* Price line */}
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-[16px] sm:text-[19px] font-bold text-gray-900 dark:text-white">
              ₹{price?.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <>
                <s className="text-[11px] sm:text-[13px] text-gray-400 line-through">
                  ₹{originalPrice.toLocaleString('en-IN')}
                </s>
                <span className="text-[10px] sm:text-[12px] font-bold text-emerald-700 dark:text-emerald-400">
                  ({discountPct}% OFF)
                </span>
              </>
            )}
          </div>

          {/* Action Button: Crisp rectangular button with soft corners (rounded-[10px] sm:rounded-xl) - NEVER a circle */}
          <button
            type="button"
            disabled={outOfStock}
            onClick={handleActionClick}
            className={`w-full inline-flex h-9 sm:h-10 items-center justify-center rounded-[10px] sm:rounded-xl text-[12px] sm:text-[14px] font-semibold transition-all duration-200 shadow-2xs active:scale-[0.98] cursor-pointer ${
              outOfStock
                ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white'
                : 'bg-fv-primary hover:bg-fv-primary-dark text-white hover:shadow-xs shimmer-btn'
            }`}
          >
            {outOfStock ? (
              <span>Out of stock</span>
            ) : added ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1 stroke-[2.5]" />
                <span>Added!</span>
              </>
            ) : hasPackages && packages.length > 1 ? (
              <>
                <span>Select Pack</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCardV2;
