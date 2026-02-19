import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle, XCircle, Trash2, MessageSquare, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [selectedReview, setSelectedReview] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [actionType, setActionType] = useState(''); // approve or reject

  const applyFilter = useCallback(() => {
    if (filter === 'all') {
      setFilteredReviews(reviews);
    } else if (filter === 'pending') {
      setFilteredReviews(reviews.filter(r => r.isApproved === null));
    } else if (filter === 'approved') {
      setFilteredReviews(reviews.filter(r => r.isApproved === true));
    } else if (filter === 'rejected') {
      setFilteredReviews(reviews.filter(r => r.isApproved === false));
    }
  }, [reviews, filter]);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reviews/admin');
      setReviews(response.data.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (review) => {
    setSelectedReview(review);
    setActionType('approve');
    setAdminResponse('');
    setShowResponseDialog(true);
  };

  const handleRejectClick = (review) => {
    setSelectedReview(review);
    setActionType('reject');
    setAdminResponse('');
    setShowResponseDialog(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedReview) return;

    try {
      await api.put(`/reviews/${selectedReview._id}/approve`, {
        isApproved: actionType === 'approve',
        adminResponse: adminResponse.trim() || undefined
      });
      toast.success(`Review ${actionType === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setShowResponseDialog(false);
      setSelectedReview(null);
      setAdminResponse('');
      fetchReviews();
    } catch (error) {
      console.error('Error updating review:', error);
      toast.error(error.response?.data?.message || 'Failed to update review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success('Review deleted successfully!');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStatusBadge = (review) => {
    if (review.isApproved === null) {
      return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Pending</span>;
    } else if (review.isApproved === true) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Approved</span>;
    } else {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Rejected</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Review Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Moderate customer reviews and provide responses</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Pending ({reviews.filter(r => r.isApproved === null).length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'approved'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Approved ({reviews.filter(r => r.isApproved === true).length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'rejected'
              ? 'bg-red-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          Rejected ({reviews.filter(r => r.isApproved === false).length})
        </button>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl"
        >
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No reviews found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'all' ? 'No reviews have been submitted yet.' : `No ${filter} reviews.`}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review, index) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <img
                    src={review.productId?.images?.[0] || '/placeholder.jpg'}
                    alt={review.productId?.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                </div>

                {/* Review Content */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {review.productId?.name || 'Product Deleted'}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {review.rating}/5
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(review)}
                  </div>

                  {/* Review Title */}
                  {review.title && (
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {review.title}
                    </h4>
                  )}

                  {/* Review Comment */}
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>

                  {/* Review Meta */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      By: <strong>{review.userId?.name || 'Anonymous'}</strong>
                    </span>
                    {review.isVerifiedPurchase && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <ShoppingBag className="w-4 h-4" />
                        Verified Purchase
                      </span>
                    )}
                    <span>
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {/* Admin Response */}
                  {review.adminResponse && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-3 rounded mb-3">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        Admin Response:
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {review.adminResponse}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {review.isApproved === null && (
                      <>
                        <button
                          onClick={() => handleApproveClick(review)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(review)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                    {review.isApproved !== null && (
                      <button
                        onClick={() => handleApproveClick(review)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        {review.adminResponse ? 'Update Response' : 'Add Response'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      {showResponseDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {actionType === 'approve' ? 'Approve Review' : 'Reject Review'}
            </h3>

            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Product:</strong> {selectedReview?.productId?.name}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                <strong>Rating:</strong> {selectedReview?.rating}/5
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                <strong>Comment:</strong> {selectedReview?.comment}
              </p>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Response (Optional)
              </label>
              <textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Add a response to this review..."
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirmAction}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowResponseDialog(false);
                  setSelectedReview(null);
                  setAdminResponse('');
                }}
                className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default AdminReviews;
