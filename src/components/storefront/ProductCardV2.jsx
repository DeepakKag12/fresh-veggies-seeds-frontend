import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Sprout, Pencil, Trash2 } from 'lucide-react';

/**
 * The single product card used across the storefront.
 *
 *   square image → badge top-left → rating chip bottom-left → 16px content pad
 *   → title → one-line blurb → price row with the action on the right.
 *
 * Every value shown comes from the product document; a missing field omits its
 * element rather than rendering a placeholder value.
 *
 * `onAddToCart` turns the action into a real add-to-cart button. Without it the
 * card falls back to a plain "View" link, which is what listing contexts with
 * no cart wiring (and the admin view) want.
 */
const ProductCardV2 = ({ product, onEdit, onDelete, isAdmin = false }) => {
  const [imgFailed, setImgFailed] = useState(false);
  if (!product) return null;

  const { _id, name, price, originalPrice, images, rating, numReviews, description, stock, packages, featured } = product;

  const hasPackages = Array.isArray(packages) && packages.length > 0;
  const packageStock = hasPackages
    ? packages.reduce((sum, pkg) => sum + (Number(pkg.stock) || 0), 0)
    : 0;
  const effectiveStock = hasPackages ? packageStock : (stock ?? 0);

  const hasDiscount = originalPrice > price;
  const discountPct = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const outOfStock = effectiveStock <= 0;
  const showImage = images?.[0] && !imgFailed;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-[20px] border border-gray-100/90 dark:border-gray-800 bg-white dark:bg-gray-900 transition-all
                 duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-10px_rgba(10,76,54,0.14)] motion-reduce:transition-none"
    >
      {isAdmin && (
        <div className="absolute right-3 top-3 z-20 flex gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(product)}
              aria-label={`Edit ${name}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-fv-primary shadow-sm
                         hover:bg-white hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary cursor-pointer"
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(product)}
              aria-label={`Delete ${name}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-fv-danger shadow-sm
                         hover:bg-white hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-danger cursor-pointer"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

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
            <Sprout className="h-14 w-14 text-fv-primary/25" aria-hidden="true" />
          </div>
        )}

        {(featured || hasDiscount || outOfStock) && !isAdmin && (
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-xs transition-transform duration-200 group-hover:scale-105 ${
              outOfStock
                ? 'bg-white/90 text-fv-muted border border-gray-200'
                : featured
                ? 'bg-fv-primary text-white border border-fv-primary/20'
                : 'bg-fv-yellow text-fv-primary border border-fv-yellow/30'
            }`}
          >
            {outOfStock ? 'Out of stock' : featured ? 'Bestseller' : `${discountPct}% off`}
          </span>
        )}

        {rating > 0 && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-white/90 dark:bg-gray-800/90 px-2.5 py-1 shadow-xs backdrop-blur-md border border-white/40 dark:border-gray-700/40">
            <span className="text-[12px] font-bold leading-none text-fv-primary dark:text-green-400">{rating.toFixed(1)}</span>
            <Star className="h-3 w-3 fill-fv-star text-fv-star" aria-hidden="true" />
            {numReviews > 0 && <span className="text-[11px] leading-none text-fv-muted dark:text-gray-400 font-medium">({numReviews})</span>}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4 pt-3 sm:pt-3.5">
        <h3 className="truncate font-serif text-[16px] sm:text-[19px] font-bold leading-snug text-fv-heading dark:text-white">
          <Link
            to={`/product/${_id}`}
            className="hover:text-fv-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
          >
            {name}
          </Link>
        </h3>
        {description && <p className="mt-0.5 sm:mt-1 truncate text-[12px] sm:text-[13px] text-fv-muted dark:text-gray-400">{description}</p>}

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="flex shrink-0 items-baseline gap-1.5">
            <span className="text-[17px] sm:text-[20px] font-bold text-fv-deep dark:text-white">₹{price?.toLocaleString('en-IN')}</span>
            {hasDiscount && <s className="text-[12px] sm:text-[14px] text-fv-muted line-through opacity-70">₹{originalPrice.toLocaleString('en-IN')}</s>}
          </p>

          <Link
            to={`/product/${_id}`}
            className="inline-flex h-9 sm:h-10 w-full shrink-0 items-center justify-center rounded-full bg-fv-primary
                       px-3 sm:px-5 text-[13px] sm:text-[14px] font-semibold text-white shadow-xs transition-all duration-200
                       hover:bg-fv-primary-dark hover:shadow-md active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-fv-primary focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-auto cursor-pointer"
          >
            View Product<span className="sr-only"> — {name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ProductCardV2;
