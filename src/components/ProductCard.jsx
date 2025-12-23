import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product, onAddToCart }) => {
  const [selectedPackage, setSelectedPackage] = useState(product.weight || '50g');
  const [quantity, setQuantity] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://via.placeholder.com/300x300?text=No+Image';

  const handleEditClick = (e) => {
    e.preventDefault();
    navigate('/admin/products', { state: { editProduct: product } });
  };

  const calculateDiscount = () => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  };

  const discount = calculateDiscount();

  return (
    <Link to={`/product/${product._id}`} className="group block h-full">
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden h-full flex flex-direction-column transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {/* Admin Edit Button */}
        {user?.role === 'admin' && (
          <button
            onClick={handleEditClick}
            className="absolute top-2 right-2 z-10 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg transition-all"
            title="Edit Product"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold z-10">
            -{discount}% OFF
          </div>
        )}

        {/* Product Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* Product Details */}
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {product.name}
          </h3>

          {/* Weight & Season */}
          <div className="flex gap-2 mb-3">
            {product.weight && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                {product.weight}
              </span>
            )}
            {product.season && (
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                {product.season}
              </span>
            )}
          </div>

          {/* Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1 mb-3">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({product.numReviews || 0})
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{product.price}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {/* Stock Status - Hide for Admin */}
            {user?.role !== 'admin' && (
              <>
                {product.stock > 0 ? (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (onAddToCart) onAddToCart(product);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                ) : (
                  <div className="w-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-2 rounded-lg font-semibold text-center">
                    Out of Stock
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
