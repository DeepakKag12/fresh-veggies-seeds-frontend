import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  PackageCheck,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  User,
  Package
} from 'lucide-react';
import api from '../../utils/api';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchParams] = useSearchParams();

  const statusOptions = ['All', 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];

  const filterOrders = useCallback(() => {
    if (statusFilter === 'All') {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter(order => order.orderStatus === statusFilter));
    }
  }, [statusFilter, orders]);

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const statusFromUrl = searchParams.get('status');
    if (statusFromUrl) {
      setStatusFilter(statusFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders?limit=100');
      const ordersData = response.data?.data || response.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { orderStatus: newStatus });
      alert('Order status updated successfully!');
      fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Confirmed: 'bg-green-100 text-green-800 border-green-300',
      Packed: 'bg-blue-100 text-blue-800 border-blue-300',
      Shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      Delivered: 'bg-green-100 text-green-800 border-green-300',
      Cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    const iconProps = { className: 'w-4 h-4' };
    const icons = {
      Pending: <Clock {...iconProps} />,
      Confirmed: <CheckCircle {...iconProps} />,
      Packed: <Package {...iconProps} />,
      Shipped: <Truck {...iconProps} />,
      Delivered: <PackageCheck {...iconProps} />,
      Cancelled: <XCircle {...iconProps} />
    };
    return icons[status] || <Package {...iconProps} />;
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const stats = {
    all: orders.length,
    pending: orders.filter(o => o.orderStatus === 'Pending').length,
    confirmed: orders.filter(o => o.orderStatus === 'Confirmed').length,
    shipped: orders.filter(o => o.orderStatus === 'Shipped').length,
    delivered: orders.filter(o => o.orderStatus === 'Delivered').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-8" />
            <div className="h-64 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Order Management
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Manage and track all customer orders
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          <div
            onClick={() => setStatusFilter('All')}
            className={`p-3 md:p-4 rounded-lg md:rounded-xl cursor-pointer transition-all ${
              statusFilter === 'All'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-900 shadow-md hover:shadow-lg'
            }`}
          >
            <p className="text-xs md:text-sm opacity-90 mb-1">All Orders</p>
            <p className="text-xl md:text-2xl font-bold">{stats.all}</p>
          </div>
          <div
            onClick={() => setStatusFilter('Pending')}
            className={`p-3 md:p-4 rounded-lg md:rounded-xl cursor-pointer transition-all ${
              statusFilter === 'Pending'
                ? 'bg-yellow-600 text-white shadow-lg'
                : 'bg-white text-gray-900 shadow-md hover:shadow-lg'
            }`}
          >
            <p className="text-xs md:text-sm opacity-90 mb-1">Pending</p>
            <p className="text-xl md:text-2xl font-bold">{stats.pending}</p>
          </div>
          <div
            onClick={() => setStatusFilter('Confirmed')}
            className={`p-3 md:p-4 rounded-lg md:rounded-xl cursor-pointer transition-all ${
              statusFilter === 'Confirmed'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-900 shadow-md hover:shadow-lg'
            }`}
          >
            <p className="text-xs md:text-sm opacity-90 mb-1">Confirmed</p>
            <p className="text-xl md:text-2xl font-bold">{stats.confirmed}</p>
          </div>
          <div
            onClick={() => setStatusFilter('Shipped')}
            className={`p-3 md:p-4 rounded-lg md:rounded-xl cursor-pointer transition-all ${
              statusFilter === 'Shipped'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-white text-gray-900 shadow-md hover:shadow-lg'
            }`}
          >
            <p className="text-xs md:text-sm opacity-90 mb-1">Shipped</p>
            <p className="text-xl md:text-2xl font-bold">{stats.shipped}</p>
          </div>
          <div
            onClick={() => setStatusFilter('Delivered')}
            className={`p-3 md:p-4 rounded-lg md:rounded-xl cursor-pointer transition-all ${
              statusFilter === 'Delivered'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-900 shadow-md hover:shadow-lg'
            }`}
          >
            <p className="text-xs md:text-sm opacity-90 mb-1">Delivered</p>
            <p className="text-xl md:text-2xl font-bold">{stats.delivered}</p>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                isExpanded={expandedOrderId === order._id}
                onToggleExpand={() => toggleOrderExpansion(order._id)}
                onUpdateStatus={handleUpdateStatus}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                statusOptions={statusOptions}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Order Card Component
const OrderCard = ({ order, isExpanded, onToggleExpand, onUpdateStatus, getStatusColor, getStatusIcon, statusOptions }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus) => {
    if (newStatus === order.orderStatus) return;
    
    setIsUpdating(true);
    await onUpdateStatus(order._id, newStatus);
    setIsUpdating(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-md overflow-hidden"
    >
      {/* Card Header - Always Visible */}
      <div 
        className="p-4 md:p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Left Section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs md:text-sm font-mono font-semibold text-gray-900">
                #{order._id.slice(-8).toUpperCase()}
              </span>
              <span className={`px-2 md:px-3 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full border ${getStatusColor(order.orderStatus)}`}>
                {getStatusIcon(order.orderStatus)}
                {order.orderStatus}
              </span>
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              {new Date(order.createdAt).toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            <div className="text-right">
              <div className="text-xs md:text-sm text-gray-600 mb-1">
                {order.orderItems?.length || 0} items
              </div>
              <div className="text-lg md:text-xl font-bold text-green-600">
                ₹{order.totalAmount}
              </div>
            </div>
            <div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200"
          >
            <div className="p-4 md:p-6 space-y-6">
              {/* Customer Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Name</div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.userId?.name || order.shippingAddress?.name || 'Guest'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-600 mt-0.5" />
                    <div>
                      <div className="text-xs text-gray-500">Phone</div>
                      <a 
                        href={`tel:${order.userId?.phone || order.shippingAddress?.phone}`}
                        className="text-sm font-medium text-green-600 hover:text-green-700"
                      >
                        {order.userId?.phone || order.shippingAddress?.phone || 'N/A'}
                      </a>
                    </div>
                  </div>
                  {order.userId?.email && (
                    <div className="flex items-start gap-2 md:col-span-2">
                      <Mail className="w-4 h-4 text-gray-600 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <a 
                          href={`mailto:${order.userId.email}`}
                          className="text-sm font-medium text-green-600 hover:text-green-700 break-all"
                        >
                          {order.userId.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  Shipping Address
                </h3>
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="font-medium">{order.shippingAddress?.name}</div>
                  <div>{order.shippingAddress?.street}</div>
                  <div>
                    {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                  </div>
                  <div>{order.shippingAddress?.country || 'India'}</div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                  Order Items
                </h3>
                <div className="space-y-3">
                  {order.orderItems?.map((item, index) => (
                    <div key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      {item.image && (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md"
                        />
                      )}
                      <div className="flex-1">
                        <div className="text-sm md:text-base font-medium text-gray-900">
                          {item.name}
                        </div>
                        <div className="text-xs md:text-sm text-gray-600 mt-1">
                          Quantity: {item.quantity}
                        </div>
                        <div className="text-sm md:text-base font-semibold text-green-600 mt-1">
                          ₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items Price:</span>
                    <span className="font-medium">₹{order.itemsPrice || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">₹{order.shippingPrice || 0}</span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">-₹{order.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base md:text-lg font-bold pt-2 border-t">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{order.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">{order.paymentMode}</span>
                  </div>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-3">
                  Update Order Status
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  {statusOptions.filter(s => s !== 'All').map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={isUpdating || status === order.orderStatus}
                      className={`px-3 py-2 text-xs md:text-sm font-medium rounded-lg transition-all ${
                        status === order.orderStatus
                          ? 'bg-green-600 text-white cursor-default'
                          : 'bg-white text-gray-700 hover:bg-green-50 hover:text-green-700 border border-gray-300'
                      } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminOrders;
