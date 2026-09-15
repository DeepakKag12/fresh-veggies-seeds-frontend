import React, { useEffect, useState, useCallback } from 'react';
import { Star, Loader2, BadgeCheck, PenSquare } from 'lucide-react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import WriteReviewModal from './WriteReviewModal';

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
 * Verified buyer review submission supported for delivered orders.
 */
const ReviewsSection = ({ productId, productName }) => {
  const { user } = useAuth();
  const [state, setState] = useState({ loading: true, reviews: [], avg: 0, total: 0 });
  const [eligibility, setEligibility] = useState({ canReview: false, hasReviewed: false, existingReview: null });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      const res = await api.get(`/reviews/product/${productId}?limit=20`);
      const d = res?.data || {};
      setState({ loading: false, reviews: d.data || [], avg: d.avgRating || 0, total: d.total || 0 });
    } catch {
      setState({ loading: false, reviews: [], avg: 0, total: 0 });
    }
  }, [productId]);

  const checkEligibility = useCallback(async () => {
    if (!productId || !user) {
      setEligibility({ canReview: false, hasReviewed: false, existingReview: null });
      return;
    }
    try {
      const res = await api.get(`/reviews/eligibility/${productId}`);
      setEligibility(res.data.data || { canReview: false, hasReviewed: false });
    } catch {
      setEligibility({ canReview: false, hasReviewed: false, existingReview: null });
    }
  }, [productId, user]);

  useEffect(() => {
    fetchReviews();
    checkEligibility();
  }, [fetchReviews, checkEligibility]);

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

        {/* Customer Review Eligibility Action Banner */}
        {user && (
          <div className="mt-6 flex justify-center">
            {eligibility.canReview ? (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-fv-primary px-6 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-fv-primary-dark transition-all"
              >
                <PenSquare className="w-4 h-4" />
                <span>Write a Verified Review</span>
              </button>
            ) : eligibility.hasReviewed ? (
              <div className="flex items-center gap-3 bg-fv-surface px-5 py-2.5 rounded-2xl border border-fv-border">
                <BadgeCheck className="w-4 h-4 text-fv-primary" />
                <span className="text-xs text-fv-muted font-medium">You have already reviewed this product</span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="text-xs font-bold text-fv-primary hover:underline ml-1"
                >
                  Edit Review
                </button>
              </div>
            ) : null}
          </div>
        )}

        {loading && (
          <p className="mt-8 flex items-center justify-center gap-2 text-fv-muted">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading reviews…
          </p>
        )}

        {!loading && total === 0 && (
          <p className="mt-6 text-center text-[15px] text-fv-muted">
            No reviews yet — verified buyers who purchased this product can leave a review.
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

        {/* Write / Edit Review Modal */}
        <WriteReviewModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productId={productId}
          productName={productName}
          orderId={eligibility.deliveredOrderId}
          existingReview={eligibility.existingReview}
          onSuccess={() => {
            fetchReviews();
            checkEligibility();
          }}
        />
      </div>
    </section>
  );
};

export default ReviewsSection;
