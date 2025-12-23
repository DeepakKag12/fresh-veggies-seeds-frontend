import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Check,
  Minus,
  Plus,
  Package,
  Leaf,
  Award
} from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';

const ProductDetailNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('');
  const { addToCart } = useCart();

  // Check if product is a seed product based on category name
  const isSeedProduct = () => {
    const categoryName = product?.categoryId?.name?.toLowerCase() || '';
    return categoryName.includes('seed') || categoryName.includes('बीज');
  };

  // Package options - only for seed products
  const packageOptions = [
    { label: '50 Seeds', value: '50', price: product?.price || 0 },
    { label: '100 Seeds', value: '100', price: product ? product.price * 1.8 : 0 },
    { label: '250 Seeds', value: '250', price: product ? product.price * 4 : 0 },
    { label: '500 Seeds', value: '500', price: product ? product.price * 7 : 0 }
  ];

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data.data);
      
      // Fetch related products
      if (response.data.data.categoryId) {
        const relatedRes = await api.get(`/products?category=${response.data.data.categoryId._id}&limit=4`);
        setRelatedProducts((relatedRes.data.data || []).filter(p => p._id !== id));
      }
      
      // Fetch reviews
      try {
        const reviewsRes = await api.get(`/reviews/product/${id}`);
        setReviews(reviewsRes.data.data || []);
      } catch (error) {
        console.log('Reviews not available');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    const productWithPackage = {
      ...product,
      selectedPackage: (selectedPackage && isSeedProduct()) ? {
        size: packageOptions.find(p => p.value === selectedPackage)?.label,
        price: packageOptions.find(p => p.value === selectedPackage)?.price
      } : null
    };
    const finalPrice = (selectedPackage && isSeedProduct())
      ? packageOptions.find(p => p.value === selectedPackage)?.price 
      : product.price;
    addToCart({ ...productWithPackage, price: finalPrice }, quantity);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleBuyNow = () => {
    const productWithPackage = {
      ...product,
      selectedPackage: (selectedPackage && isSeedProduct()) ? {
        size: packageOptions.find(p => p.value === selectedPackage)?.label,
        price: packageOptions.find(p => p.value === selectedPackage)?.price
      } : null
    };
    const finalPrice = (selectedPackage && isSeedProduct())
      ? packageOptions.find(p => p.value === selectedPackage)?.price 
      : product.price;
    addToCart({ ...productWithPackage, price: finalPrice }, quantity);
    navigate('/cart');
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} - ₹${product.price}`,
      url: window.location.href
    };

    try {
      // Check if Web Share API is supported
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(window.location.href);
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      }
    } catch (error) {
      // If sharing fails or is cancelled, copy to clipboard as fallback
      if (error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(window.location.href);
          alert('Product link copied to clipboard!');
        } catch (clipboardError) {
          console.error('Failed to share:', error);
        }
      }
    }
  };

  const calculateDiscount = () => {
    if (product?.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Product Not Found</h2>
          <button onClick={() => navigate('/shop')} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : ['https://via.placeholder.com/600x600?text=No+Image'];
  
  const discount = calculateDiscount();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-12">
      {/* Success Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3"
          >
            <Check className="w-5 h-5" />
            <span className="font-medium">Added to cart successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="text-gray-600 hover:text-green-600 dark:text-gray-400">Home</Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <Link to="/shop" className="text-gray-600 hover:text-green-600 dark:text-gray-400">Shop</Link>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-900 dark:text-white font-medium">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="sticky top-24">
              {/* Main Image */}
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl mb-4">
                {discount > 0 && (
                  <div className="absolute top-4 left-4 z-10 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg shadow-lg">
                    -{discount}% OFF
                  </div>
                )}
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 p-3 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  {isFavorite ? (
                    <Heart className="w-6 h-6 fill-red-500 text-red-500" />
                  ) : (
                    <Heart className="w-6 h-6 text-gray-400" />
                  )}
                </button>
                
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-96 lg:h-[500px] object-cover"
                />
              </div>

              {/* Thumbnail Images */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-green-600 scale-105 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 hover:border-green-400'
                      }`}
                    >
                      <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Category Badge */}
            {product.categoryId && (
              <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
                <Leaf className="w-4 h-4" />
                {product.categoryId.name}
              </div>
            )}

            {/* Product Name */}
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
              {product.name}
            </h1>

            {/* Rating and Reviews */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {product.rating?.toFixed(1) || '0.0'}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                ({product.numReviews || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                ₹{(selectedPackage && isSeedProduct())
                  ? packageOptions.find(p => p.value === selectedPackage)?.price.toLocaleString() 
                  : product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && !selectedPackage && (
                <span className="text-2xl text-gray-500 dark:text-gray-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    In Stock ({product.stock} available)
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-red-600 font-semibold">Out of Stock</span>
                </>
              )}
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {product.description || 'No description available.'}
              </p>
            </div>

            {/* Package Size Selector - Only for Seed Products */}
            {isSeedProduct() && (
              <div className="space-y-3">
                <label htmlFor="package-select" className="block text-sm font-semibold text-gray-900 dark:text-white">
                  Package Size
                </label>
                <div className="relative">
                  <select
                    id="package-select"
                    value={selectedPackage}
                    onChange={(e) => setSelectedPackage(e.target.value)}
                    className="w-full appearance-none bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 pr-10 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all cursor-pointer hover:border-green-400"
                  >
                    <option value="">Choose an option</option>
                    {packageOptions.map((pkg) => (
                      <option key={pkg.value} value={pkg.value}>
                        {pkg.label} - ₹{pkg.price.toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                {selectedPackage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {packageOptions.find(p => p.value === selectedPackage)?.label} selected
                    </span>
                  </motion.div>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="px-6 py-3 font-semibold text-lg text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Subtotal: <span className="font-bold text-green-600 text-lg">
                    ₹{((selectedPackage && isSeedProduct())
                      ? packageOptions.find(p => p.value === selectedPackage)?.price * quantity 
                      : product.price * quantity
                    ).toLocaleString()}
                  </span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 flex items-center justify-center bg-orange-500 hover:bg-orange-600 text-white py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            {/* Share Button */}
            <button 
              onClick={handleShare}
              className="flex items-center justify-center gap-2 w-full py-3 border-2 border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium">Share Product</span>
            </button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-6">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <Truck className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <p className="text-xs font-medium text-gray-900 dark:text-white">Free Delivery</p>
                <p className="text-xs text-gray-500">On orders over ₹500</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <Shield className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <p className="text-xs font-medium text-gray-900 dark:text-white">Secure Payment</p>
                <p className="text-xs text-gray-500">100% Protected</p>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <p className="text-xs font-medium text-gray-900 dark:text-white">Easy Returns</p>
                <p className="text-xs text-gray-500">7 Days Return</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        {reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Customer Reviews</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.slice(0, 4).map((review) => (
                <div key={review._id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{review.userId?.name?.charAt(0) || 'U'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{review.userId?.name || 'Customer'}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    {review.isVerifiedPurchase && (
                      <div className="flex items-center gap-1 text-green-600 text-xs">
                        <Award className="w-4 h-4" />
                        <span>Verified</span>
                      </div>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{review.title}</h4>
                  )}
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Related Products</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct._id}
                  to={`/product/${relatedProduct._id}`}
                  className="group"
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={relatedProduct.images?.[0] || 'https://via.placeholder.com/300'}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">₹{relatedProduct.price}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm text-gray-600">{relatedProduct.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailNew;
