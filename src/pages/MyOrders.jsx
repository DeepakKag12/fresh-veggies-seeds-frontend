import React, { useEffect, useState } from 'react';
import Pagination from '../components/Pagination';
import { Link } from 'react-router-dom';
import { Package, Loader, ChevronRight, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchOrders = async () => {
    try {
      // Paginated: the endpoint returns a page, so a long-standing customer was
      // silently shown only their most recent orders with no way to reach the rest.
      const response = await api.get('/orders/myorders', { params: { page, limit: 10 } });
      setOrders(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalOrders(response.data.total || 0);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      Confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      Packed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
      Shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      Delivered: 'bg-fv-cream text-green-800 dark:bg-green-900/30 dark:text-green-400',
      Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      CancellationRequested: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800  ';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-10 h-10 text-fv-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-fv-page pt-20 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-fv-heading  mb-2">Something went wrong</h2>
          <p className="text-sm text-fv-muted  mb-4">{error}</p>
          <button
            onClick={() => { setError(''); setLoading(true); fetchOrders(); }}
           className="bg-fv-primary hover:bg-fv-primary-dark text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fv-page py-8 pb-28">
      <div className="max-w-2xl mx-auto px-3 sm:px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-fv-heading  mb-6">
          My Orders
        </h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-20 h-20 mx-auto text-gray-300 dark:text-fv-ink mb-4" />
            <h2 className="text-xl font-semibold text-fv-heading  mb-2">
              No orders yet
            </h2>
            <p className="text-sm text-fv-muted  mb-6">
              Start shopping to see your orders here
            </p>
            <Link
              to="/"
             className="inline-block bg-fv-primary hover:bg-fv-primary-dark text-white px-6 py-3 rounded-lg font-semibold transition-colors text-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
               className="flex items-center gap-3 bg-white rounded-[12px] shadow-sm hover: active:scale-[0.99] transition-all p-4"
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-full bg-fv-cream dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-fv-primary dark:text-green-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-fv-heading  font-mono">
                      {order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                    {order.refund?.refundStatus === 'Processed' && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        ↩ Refunded
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-fv-muted  truncate">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                    {' · '}
                    {order.orderItems?.length || 0} item{order.orderItems?.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Amount + arrow */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-base font-bold text-fv-primary dark:text-green-400">
                    ₹{order.totalAmount}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {orders.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={totalOrders}
            onPageChange={setPage}
            itemLabel="orders"
          />
        )}
      </div>
    </div>
  );
};

export default MyOrders;

