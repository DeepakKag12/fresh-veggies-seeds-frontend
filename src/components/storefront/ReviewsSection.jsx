import React, { useEffect, useState, useCallback } from 'react';
import { Star, Loader2, BadgeCheck, PenSquare, ThumbsUp, Image as ImageIcon, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import WriteReviewModal from './WriteReviewModal';

const GreenStars = ({ value, size = 'h-4 w-4' }) => (
  <span className="flex items-center gap-0.5" aria-hidden="true">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`${size} ${
          i <= Math.round(value) ? 'fill-[#00A93D] text-[#00A93D]' : 'text-gray-200 fill-gray-100'
        }`}
      />
    ))}
  </span>
);

const fmtDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getInitials = (name) => {
  if (!name) return 'C';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ReviewsSection = ({ productId, productName }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [state, setState] = useState({
    loading: true,
    reviews: [],
    avg: 0,
    total: 0,
    totalApproved: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, withPhotos: 0 },
  });

  const [eligibility, setEligibility] = useState({
    canReview: false,
    hasReviewed: false,
    existingReview: null,
    deliveredOrderId: null,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Filters & Sorting
  const [activeStarFilter, setActiveStarFilter] = useState(null); // null = all, or 1..5
  const [photosOnlyFilter, setPhotosOnlyFilter] = useState(false);
  const [sortBy, setSortBy] = useState('recent'); // recent, highest, lowest, helpful
  const [votedReviews, setVotedReviews] = useState({});

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      const params = {
        limit: 50,
        sort: sortBy,
      };
      if (activeStarFilter) params.rating = activeStarFilter;
      if (photosOnlyFilter) params.hasPhotos = 'true';

      const res = await api.get(`/reviews/product/${productId}`, { params });
      const d = res?.data || {};
      setState({
        loading: false,
        reviews: d.data || [],
        avg: d.avgRating || 0,
        total: d.total || 0,
        totalApproved: d.totalApproved || d.total || 0,
        breakdown: d.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, withPhotos: 0 },
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [productId, sortBy, activeStarFilter, photosOnlyFilter]);

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
  }, [fetchReviews]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const handleHelpfulVote = async (reviewId) => {
    if (votedReviews[reviewId]) {
      toast('You already voted on this review', { icon: 'ℹ️' });
      return;
    }
    try {
      const res = await api.post(`/reviews/${reviewId}/helpful`);
      if (res.data?.success) {
        setVotedReviews((prev) => ({ ...prev, [reviewId]: true }));
        setState((prev) => ({
          ...prev,
          reviews: prev.reviews.map((r) =>
            r._id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
          ),
        }));
        toast.success('Thank you for your feedback!');
      }
    } catch {
      toast.error('Could not register vote');
    }
  };

  const handleOpenReviewModal = () => {
    if (!user) {
      toast('Please sign in to write your review', { icon: '🔒' });
      navigate('/login');
      return;
    }
    setIsModalOpen(true);
  };

  const { loading, reviews, avg, total, totalApproved, breakdown } = state;
  const grandTotal = totalApproved || total || 1;

  return (
    <section className="bg-fv-page px-4 py-16 sm:px-6 lg:px-10 border-t border-fv-border" id="reviews-heading" aria-label="Customer Reviews">
      <div className="mx-auto max-w-[1200px]">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-fv-primary text-xs font-semibold uppercase tracking-wider mb-2">
            <BadgeCheck className="w-3.5 h-3.5 text-[#00A93D]" />
            <span>Customer Opinions</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-fv-heading">
            Ratings &amp; Reviews
          </h2>
        </div>

        {/* Ugaoo-Style Rating Breakdown & Summary Card */}
        <div className="rounded-[22px] border border-fv-border bg-white p-6 sm:p-8 shadow-xs mb-8">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 items-center">
            {/* Left: Overall Score + CTA */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-fv-border/70 pb-6 md:pb-0 md:pr-8">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-5xl sm:text-6xl font-bold text-fv-heading tracking-tight">
                  {avg > 0 ? avg.toFixed(1) : '5.0'}
                </span>
                <span className="text-lg text-fv-muted font-medium">/ 5.0</span>
              </div>

              <div className="mt-2.5">
                <GreenStars value={avg || 5} size="h-6 w-6" />
              </div>

              <p className="mt-2 text-xs sm:text-sm text-fv-muted font-medium">
                Based on {totalApproved || total || 0} verified customer {total === 1 ? 'review' : 'reviews'}
              </p>

              <button
                type="button"
                onClick={handleOpenReviewModal}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-fv-primary px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition-all hover:bg-fv-primary-dark hover:shadow-md cursor-pointer"
              >
                <PenSquare className="w-4 h-4" />
                <span>{eligibility.hasReviewed ? 'Edit Your Review' : 'Write a Review'}</span>
              </button>
            </div>

            {/* Right: Star Distribution Progress Bars */}
            <div className="space-y-2.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] || 0;
                const pct = grandTotal > 0 ? Math.round((count / grandTotal) * 100) : 0;
                const isSelected = activeStarFilter === star;

                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      setActiveStarFilter((prev) => (prev === star ? null : star));
                      setPhotosOnlyFilter(false);
                    }}
                    className={`group w-full flex items-center gap-3 p-1.5 rounded-xl transition-all cursor-pointer text-left ${
                      isSelected ? 'bg-emerald-50 ring-1 ring-fv-primary' : 'hover:bg-fv-page/70'
                    }`}
                  >
                    <span className="w-12 shrink-0 text-xs font-semibold text-gray-700 flex items-center gap-1">
                      <span>{star}</span>
                      <Star className="w-3 h-3 fill-[#00A93D] text-[#00A93D]" />
                    </span>

                    {/* Progress Bar */}
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100 relative">
                      <div
                        className="h-full rounded-full bg-[#00A93D] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <span className="w-14 shrink-0 text-right text-xs font-semibold text-gray-600">
                      {count} ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Filter Pills & Sorting Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pt-2">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveStarFilter(null);
                setPhotosOnlyFilter(false);
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                !activeStarFilter && !photosOnlyFilter
                  ? 'bg-fv-primary text-white border-fv-primary shadow-xs'
                  : 'bg-white text-gray-700 border-fv-border hover:border-fv-primary'
              }`}
            >
              All Reviews ({totalApproved || total})
            </button>

            {breakdown.withPhotos > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPhotosOnlyFilter((prev) => !prev);
                  setActiveStarFilter(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                  photosOnlyFilter
                    ? 'bg-fv-primary text-white border-fv-primary shadow-xs'
                    : 'bg-white text-gray-700 border-fv-border hover:border-fv-primary'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>With Photos ({breakdown.withPhotos})</span>
              </button>
            )}

            {[5, 4, 3, 2, 1].map((s) => {
              if (!breakdown[s]) return null;
              const isSelected = activeStarFilter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setActiveStarFilter((prev) => (prev === s ? null : s));
                    setPhotosOnlyFilter(false);
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-fv-primary text-white border-fv-primary shadow-xs'
                      : 'bg-white text-gray-700 border-fv-border hover:border-fv-primary'
                  }`}
                >
                  {s} ★ ({breakdown[s]})
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <label htmlFor="review-sort" className="text-xs font-semibold text-fv-muted">
              Sort by:
            </label>
            <div className="relative">
              <select
                id="review-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-fv-border rounded-full pl-3.5 pr-8 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-fv-primary cursor-pointer shadow-2xs"
              >
                <option value="recent">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-16 text-center text-fv-muted flex items-center justify-center gap-2 text-sm font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-fv-primary" />
            <span>Loading reviews…</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && reviews.length === 0 && (
          <div className="rounded-2xl border border-dashed border-fv-border bg-white p-12 text-center">
            <p className="font-serif text-lg font-bold text-gray-800">No reviews matching your filter</p>
            <p className="mt-1 text-xs text-fv-muted">Try clearing your filters or be the first to review this product!</p>
            <button
              type="button"
              onClick={() => {
                setActiveStarFilter(null);
                setPhotosOnlyFilter(false);
              }}
              className="mt-4 text-xs font-bold text-fv-primary hover:underline cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Review Cards List */}
        {!loading && reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((r) => {
              const reviewerName = r.userId?.name || 'Customer';
              const initials = getInitials(reviewerName);
              const hasPhotos = Array.isArray(r.images) && r.images.length > 0;

              return (
                <article
                  key={r._id}
                  className="rounded-2xl border border-fv-border/80 bg-white p-5 sm:p-6 shadow-2xs transition-all hover:border-emerald-200"
                >
                  {/* Top Bar: Reviewer Info + Rating */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Initials Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-fv-primary shadow-xs">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">{reviewerName}</span>
                          {r.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                              <BadgeCheck className="w-3 h-3 text-[#00A93D]" />
                              <span>Verified Buyer</span>
                            </span>
                          )}
                        </div>
                        <time dateTime={r.createdAt} className="text-[11px] text-gray-400 block mt-0.5">
                          {fmtDate(r.createdAt)}
                        </time>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <GreenStars value={r.rating} size="h-4 w-4" />
                    </div>
                  </div>

                  {/* Review Title & Comment */}
                  <div className="mt-3.5">
                    <h4 className="font-sans text-sm sm:text-base font-bold text-gray-900 leading-snug">
                      {r.title}
                    </h4>
                    <p className="mt-1.5 text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {r.comment}
                    </p>
                  </div>

                  {/* Customer Uploaded Photos */}
                  {hasPhotos && (
                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {r.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedPhoto(img)}
                          className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden border border-fv-border hover:border-fv-primary hover:scale-105 transition-all shadow-2xs cursor-pointer group"
                        >
                          <img
                            src={img}
                            alt="Customer plant harvest"
                            className="h-full w-full object-cover group-hover:opacity-90"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Official Store Response */}
                  {r.adminResponse && (
                    <div className="mt-4 rounded-xl bg-fv-cream/70 p-3.5 border border-fv-border/70 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-fv-primary mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Store Response</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{r.adminResponse}</p>
                    </div>
                  )}

                  {/* Footer: Helpful Vote */}
                  <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <button
                      type="button"
                      onClick={() => handleHelpfulVote(r._id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                        votedReviews[r._id]
                          ? 'bg-emerald-50 text-emerald-700 font-bold'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      <ThumbsUp className={`w-3.5 h-3.5 ${votedReviews[r._id] ? 'fill-emerald-600 text-emerald-600' : ''}`} />
                      <span>Helpful {r.helpfulCount > 0 ? `(${r.helpfulCount})` : ''}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Photo Lightbox Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <div className="relative max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-black">
              <img src={selectedPhoto} alt="Customer garden harvest" className="max-h-[85vh] w-auto object-contain" />
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Write Review Modal */}
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
