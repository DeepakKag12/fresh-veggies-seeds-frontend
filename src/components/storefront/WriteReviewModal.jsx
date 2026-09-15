import React, { useState } from 'react';
import { Star, X, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const WriteReviewModal = ({ isOpen, onClose, productId, productName, orderId, existingReview, onSuccess }) => {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a review headline');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please enter your review feedback');
      return;
    }

    setSubmitting(true);
    try {
      if (existingReview?._id) {
        await api.put(`/reviews/${existingReview._id}`, {
          rating,
          title: title.trim(),
          comment: comment.trim()
        });
        toast.success('Review updated! It will be reviewed by admin.');
      } else {
        await api.post('/reviews', {
          productId,
          orderId,
          rating,
          title: title.trim(),
          comment: comment.trim()
        });
        toast.success('Review submitted! It will appear once approved by admin.');
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-fv-border animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fv-border">
          <div>
            <h3 className="text-base font-bold text-fv-heading">
              {existingReview ? 'Update Your Review' : 'Write a Verified Review'}
            </h3>
            <p className="text-xs text-fv-muted truncate max-w-sm mt-0.5">
              {productName || 'Verified Purchase'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-fv-muted hover:text-fv-heading hover:bg-fv-surface rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Star Rating Picker */}
          <div>
            <label className="block text-xs font-semibold text-fv-muted uppercase tracking-wider mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-hidden transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 dark:text-gray-600'
                    } transition-colors`}
                  />
                </button>
              ))}
              <span className="ml-3 text-sm font-bold text-fv-heading">
                {rating === 5 && 'Outstanding! ⭐⭐⭐⭐⭐'}
                {rating === 4 && 'Very Good ⭐⭐⭐⭐'}
                {rating === 3 && 'Average ⭐⭐⭐'}
                {rating === 2 && 'Disappointed ⭐⭐'}
                {rating === 1 && 'Poor ⭐'}
              </span>
            </div>
          </div>

          {/* Headline */}
          <div>
            <label className="block text-xs font-semibold text-fv-muted uppercase tracking-wider mb-1.5">
              Review Headline *
            </label>
            <input
              type="text"
              required
              maxLength={100}
              placeholder="e.g. Excellent germination, crisp and fresh!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-700 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-fv-muted uppercase tracking-wider mb-1.5">
              Detailed Feedback *
            </label>
            <textarea
              required
              rows={4}
              maxLength={1000}
              placeholder="Share details about growth, harvest, quality, or delivery experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-700 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading resize-none"
            />
            <p className="text-[11px] text-fv-muted text-right mt-1">
              {comment.length}/1000 characters
            </p>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              Verified Buyer badge will automatically be awarded to this review.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-fv-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-fv-heading bg-fv-surface hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-fv-primary hover:bg-fv-primary-dark disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{existingReview ? 'Update Review' : 'Submit Review'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;
