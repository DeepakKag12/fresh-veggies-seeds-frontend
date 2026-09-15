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
      className="group relative flex flex-col overflow-hidden rounded-[18px] bg-white transition-shadow
                 duration-200 hover:shadow-[0_14px_34px_rgba(10,76,54,0.10)] motion-reduce:transition-none"
    >
      {isAdmin && (
        <div className="absolute right-3 top-3 z-20 flex gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(product)}
              aria-label={`Edit ${name}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-fv-primary shadow-sm
                         hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
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
                         hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-danger"
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
            className="h-full w-full object-cover transition-transform duration-300 ease-out
                       group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fv-cream to-fv-surface">
            <Sprout className="h-14 w-14 text-fv-primary/25" aria-hidden="true" />
          </div>
        )}

        {(featured || hasDiscount || outOfStock) && !isAdmin && (
          <span
            className={`absolute left-3 top-3 rounded-[6px] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              outOfStock ? 'bg-white text-fv-muted' : 'bg-fv-yellow text-fv-primary'
            }`}
          >
            {outOfStock ? 'Out of stock' : featured ? 'Bestseller' : `${discountPct}% off`}
          </span>
        )}

        {rating > 0 && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-[4px] bg-white/80 px-1.5 py-1 backdrop-blur-sm">
            <span className="text-[13px] font-medium leading-none text-fv-primary">{rating.toFixed(2)}</span>
            <Star className="h-3 w-3 fill-fv-star text-fv-star" aria-hidden="true" />
            {numReviews > 0 && <span className="text-[12px] leading-none text-fv-muted">| {numReviews}</span>}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4 pt-2.5 sm:pt-3.5">
        <h3 className="truncate font-serif text-[15px] sm:text-[19px] font-semibold leading-snug text-fv-heading">
          <Link
            to={`/product/${_id}`}
            className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
          >
            {name}
          </Link>
        </h3>
        {description && <p className="mt-0.5 sm:mt-1 truncate text-[13px] sm:text-[14px] text-fv-muted">{description}</p>}

        <div className="mt-2.5 sm:mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <p className="flex shrink-0 items-baseline gap-1 sm:gap-1.5">
            <span className="text-[16px] sm:text-[19px] font-semibold text-fv-deep">₹{price?.toLocaleString('en-IN')}</span>
            {hasDiscount && <s className="text-[12px] sm:text-[15px] text-fv-muted">₹{originalPrice.toLocaleString('en-IN')}</s>}
          </p>

          <Link
            to={`/product/${_id}`}
            className="inline-flex h-9 sm:h-11 w-full shrink-0 items-center justify-center rounded-[50px] bg-fv-primary
                       px-3 sm:px-6 text-[13px] sm:text-[15px] font-semibold text-white transition-all duration-200
                       hover:bg-fv-primary-dark active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2
                       focus-visible:ring-fv-primary focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-auto"
          >
            View Product<span className="sr-only"> — {name}</span>
          </Link>
        </div>
      </div>
    </article>
  );
};

export default ProductCardV2;
