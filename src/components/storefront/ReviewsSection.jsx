import React, { useEffect, useState } from 'react';
import { Star, Loader2, BadgeCheck } from 'lucide-react';
import { cachedGet } from '../../utils/api';

const Stars = ({ value, size = 'h-4 w-4' }) => (
  <span className="flex" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} className={`${size} ${i <= Math.round(value) ? 'fill-fv-star text-fv-star' : 'text-fv-border'}`} />
    ))}
  </span>
);

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/**
 * Ratings & reviews, read from /api/reviews/product/:id.
 *
 * The distribution bars, the average and the count are all computed from the
 * reviews returned — none of it is asserted independently of the data, so the
 * summary can never contradict the list below it.
 */
const ReviewsSection = ({ productId }) => {
  const [state, setState] = useState({ loading: true, reviews: [], avg: 0, total: 0 });

  useEffect(() => {
    if (!productId) return undefined;
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    (async () => {
      try {
        const res = await cachedGet(`/reviews/product/${productId}`, { params: { limit: 20 } });
        if (!alive) return;
        const d = res?.data || {};
        setState({ loading: false, reviews: d.data || [], avg: d.avgRating || 0, total: d.total || 0 });
      } catch {
        if (alive) setState({ loading: false, reviews: [], avg: 0, total: 0 });
      }
    })();
    return () => { alive = false; };
  }, [productId]);

  const { loading, reviews, avg, total } = state;

  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <section className="bg-fv-page px-4 py-14 sm:px-6 lg:px-10" aria-labelledby="reviews-heading">
      <div className="mx-auto max-w-[1000px]">
        <h2 id="reviews-heading" className="text-center font-serif text-[28px] font-semibold text-fv-heading sm:text-[36px]">
          Ratings &amp; Reviews
        </h2>

        {loading && (
          <p className="mt-8 flex items-center justify-center gap-2 text-fv-muted">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading reviews…
          </p>
        )}

        {!loading && total === 0 && (
          <p className="mt-6 text-center text-[15px] text-fv-muted">
            No reviews yet — be the first to review this product.
          </p>
        )}

        {!loading && total > 0 && (
          <>
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <Stars value={avg} size="h-5 w-5" />
                <p className="text-[16px] font-semibold text-fv-heading">
                  {avg.toFixed(1)}
                  <span className="ml-1 font-normal text-fv-muted">({total} {total === 1 ? 'review' : 'reviews'})</span>
                </p>
              </div>
            </div>

            {/* Distribution, computed from the same list rendered below. */}
            <ul className="mx-auto mt-6 max-w-sm space-y-1.5">
              {counts.map(({ star, n }) => (
                <li key={star} className="flex items-center gap-3">
                  <span className="w-10 shrink-0 text-[13px] text-fv-muted">{star} star</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-fv-border/50">
                    <span
                      className="block h-full rounded-full bg-fv-star"
                      style={{ width: reviews.length ? `${(n / reviews.length) * 100}%` : '0%' }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right text-[13px] text-fv-muted">{n}</span>
                </li>
              ))}
            </ul>

            <ul className="mt-10 divide-y divide-fv-border">
              {reviews.map((r) => (
                <li key={r._id} className="py-6">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="sr-only">{r.rating} out of 5</span>
                    <p className="text-[15px] font-semibold text-fv-heading">{r.title}</p>
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-fv-ink">{r.comment}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-fv-muted">
                    <span className="font-medium text-fv-heading">{r.userId?.name || 'Customer'}</span>
                    {r.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 rounded-[4px] bg-fv-primary px-2 py-0.5 text-[11px] font-semibold text-white">
                        <BadgeCheck className="h-3 w-3" aria-hidden="true" /> Verified
                      </span>
                    )}
                    {r.createdAt && <time dateTime={r.createdAt}>{fmtDate(r.createdAt)}</time>}
                  </p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
};

export default ReviewsSection;
