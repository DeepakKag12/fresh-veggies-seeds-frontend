import React, { useState, useRef } from 'react';
import { Star, X, Loader2, ImagePlus, Trash2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const RATING_LABELS = {
  5: 'Outstanding! (5/5)',
  4: 'Very Good (4/5)',
  3: 'Average (3/5)',
  2: 'Disappointed (2/5)',
  1: 'Poor (1/5)',
};

const WriteReviewModal = ({ isOpen, onClose, productId, productName, orderId, existingReview, onSuccess }) => {
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState(existingReview?.title || '');
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [images, setImages] = useState(existingReview?.images || []);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 4) {
      toast.error('You can upload up to 4 photos per review');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImg(true);
    try {
      const res = await api.post('/upload/review-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.data?.url || res.data?.url;
      if (url) {
        setImages((prev) => [...prev, url]);
        toast.success('Photo added!');
      }
    } catch {
      toast.error('Failed to upload image. Please try another photo.');
    } finally {
      setUploadingImg(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

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
      const payload = {
        rating,
        title: title.trim(),
        comment: comment.trim(),
        images,
      };

      if (existingReview?._id) {
        await api.put(`/reviews/${existingReview._id}`, payload);
        toast.success('Review updated! It will be reviewed by admin.');
      } else {
        await api.post('/reviews', {
          ...payload,
          productId,
          orderId,
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-fv-border animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fv-border bg-fv-cream/40">
          <div>
            <h3 className="font-serif text-lg font-bold text-fv-heading">
              {existingReview ? 'Update Your Review' : 'Write a Verified Review'}
            </h3>
            <p className="text-xs text-fv-muted truncate max-w-sm mt-0.5">
              {productName || 'Verified Purchase'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-fv-muted hover:text-fv-heading hover:bg-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
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
                  className="p-1 focus:outline-hidden transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= (hoverRating || rating)
                        ? 'fill-[#00A93D] text-[#00A93D]'
                        : 'text-gray-300'
                    } transition-colors`}
                  />
                </button>
              ))}
              <span className="ml-3 text-xs sm:text-sm font-bold text-gray-800">
                {RATING_LABELS[hoverRating || rating]}
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
              placeholder="e.g. 95% germination within 4 days, crisp harvest!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading"
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
              placeholder="Share details about growth, soil mix, container setup, pest resistance, or harvest quality..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading resize-none"
            />
          </div>

          {/* Customer Photos Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-fv-muted uppercase tracking-wider">
                Add Photos of Your Plants / Harvest (Optional)
              </label>
              <span className="text-[11px] text-fv-muted">{images.length}/4</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative h-16 w-16 rounded-xl overflow-hidden border border-fv-border group">
                  <img src={img} alt="Review upload" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}

              {images.length < 4 && (
                <button
                  type="button"
                  disabled={uploadingImg}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-16 w-16 rounded-xl border-2 border-dashed border-fv-border hover:border-fv-primary flex flex-col items-center justify-center text-fv-muted hover:text-fv-primary transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploadingImg ? (
                    <Loader2 className="w-5 h-5 animate-spin text-fv-primary" />
                  ) : (
                    <>
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-[10px] font-medium mt-0.5">Upload</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-fv-primary hover:bg-fv-primary-dark text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{existingReview ? 'Update Review' : 'Submit Review'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;
