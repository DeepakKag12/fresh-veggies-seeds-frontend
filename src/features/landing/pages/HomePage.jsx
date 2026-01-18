import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Star,
  Search,
  Edit,
  Trash2,
  Plus,
  X,
  Upload,
  ShoppingBag
} from 'lucide-react';
import api from '../../../utils/api';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeBanners, setActiveBanners] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrendingSearches, setShowTrendingSearches] = useState(false);
  const [showComboModal, setShowComboModal] = useState(false);
  const [selectedProductsForCombo, setSelectedProductsForCombo] = useState([]);
  const [comboData, setComboData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    discount: '',
    comboType: 'Custom',
    stock: '',
  });
  const [comboImages, setComboImages] = useState([]);
  const [comboImagePreview, setComboImagePreview] = useState([]);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const trendingSearches = [
    'Tomato Seeds',
    'Organic Fertilizer',
    'Grow Bags',
    'Winter Vegetables',
    'Marigold Seeds',
    'Gardening Tools'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (activeBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % activeBanners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeBanners]);

  // Auto-calculate original price and discount for combo
  useEffect(() => {
    if (selectedProductsForCombo.length > 0) {
      const totalOriginalPrice = selectedProductsForCombo.reduce((sum, item) => {
        return sum + (item.productId.price * item.quantity);
      }, 0);
      
      setComboData(prev => {
        const newData = { ...prev, originalPrice: totalOriginalPrice.toString() };
        
        // Auto-calculate discount if combo price is set
        if (newData.price && parseFloat(newData.price) > 0) {
          const discount = Math.round(((totalOriginalPrice - parseFloat(newData.price)) / totalOriginalPrice) * 100);
          newData.discount = Math.max(0, discount).toString();
        }
        
        return newData;
      });
    }
  }, [selectedProductsForCombo]);

  // Auto-calculate discount when combo price changes
  useEffect(() => {
    if (comboData.originalPrice && comboData.price) {
      const originalPrice = parseFloat(comboData.originalPrice);
      const price = parseFloat(comboData.price);
      if (originalPrice > 0 && price > 0) {
        const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
        setComboData(prev => ({ ...prev, discount: Math.max(0, discount).toString() }));
      }
    }
  }, [comboData.price, comboData.originalPrice]);

  // Auto-rotate testimonials
  useEffect(() => {
    if (reviews.length > 1) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % reviews.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [reviews]);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, bannersRes] = await Promise.all([
        api.get('/products?limit=100'),
        api.get('/categories'),
        api.get('/banners/active?position=hero').catch(() => ({ data: { data: [] } }))
      ]);
      
      // Handle nested data structure from backend
      const productsData = productsRes.data?.data || productsRes.data || [];
      const categoriesData = categoriesRes.data?.data || categoriesRes.data || [];
      const bannersData = bannersRes.data?.data || [];
      
      const productsList = Array.isArray(productsData) ? productsData : [];
      setAllProducts(productsList);
      setProducts(productsList);
      
      // Set featured products (first 8 products or products marked as featured)
      const featured = productsList.filter(p => p.featured).length > 0 
        ? productsList.filter(p => p.featured).slice(0, 8)
        : productsList.slice(0, 8);
      setFeaturedProducts(featured);
      
      // Set top selling products (sort by sales or take next 8)
      const topSelling = productsList
        .sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0))
        .slice(0, 8);
      setTopSellingProducts(topSelling);
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setActiveBanners(Array.isArray(bannersData) ? bannersData : []);
      
      // Fetch approved reviews for testimonials
      try {
        const reviewsRes = await api.get('/reviews/admin?status=approved&limit=10');
        const reviewsData = reviewsRes.data?.data || [];
        setReviews(Array.isArray(reviewsData) ? reviewsData.filter(r => r.rating >= 4) : []);
      } catch (error) {
        console.log('Reviews not available');
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setAllProducts([]);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setShowTrendingSearches(false);
    
    if (!query.trim()) {
      setProducts(allProducts);
      return;
    }

    // Filter products with fuzzy matching
    const searchLower = query.toLowerCase().trim();
    const filtered = allProducts.filter(product => {
      const name = product.name.toLowerCase();
      const description = (product.description || '').toLowerCase();
      const category = (product.categoryId?.name || '').toLowerCase();
      
      // Exact or partial match
      if (name.includes(searchLower) || description.includes(searchLower) || category.includes(searchLower)) {
        return true;
      }
      
      // Fuzzy match - check if words are similar (for misspellings)
      const searchWords = searchLower.split(' ');
      const productWords = name.split(' ');
      
      return searchWords.some(searchWord => 
        productWords.some(productWord => {
          // Check if words are similar (allow 1-2 character differences)
          if (productWord.includes(searchWord) || searchWord.includes(productWord)) {
            return true;
          }
          // Levenshtein-like simple check for close matches
          return isSimilar(searchWord, productWord);
        })
      );
    });
    
    setProducts(filtered);
  };

  // Simple similarity check for fuzzy matching
  const isSimilar = (str1, str2) => {
    if (str1.length < 3 || str2.length < 3) return false;
    
    // Check if majority of characters match
    let matches = 0;
    const minLen = Math.min(str1.length, str2.length);
    
    for (let i = 0; i < minLen; i++) {
      if (str1[i] === str2[i]) matches++;
    }
    
    return matches / minLen > 0.6; // 60% character match threshold
  };

  // Admin Functions
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/products/${productId}`);
      alert('Product deleted successfully!');
      fetchData(); // Refresh the data
    } catch (error) {
      alert('Failed to delete product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditProduct = (product) => {
    navigate('/admin/products', { state: { editProduct: product } });
  };

  const handleComboImageChange = (e) => {
    const files = Array.from(e.target.files);
    setComboImages(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setComboImagePreview(previews);
  };

  // Get combo preview images (custom uploads or product images)
  const getComboPreviewImages = () => {
    if (comboImagePreview.length > 0) {
      return comboImagePreview;
    }
    // Use first image from each selected product
    return selectedProductsForCombo
      .map(item => item.productId.images?.[0])
      .filter(Boolean)
      .slice(0, 4); // Limit to 4 images
  };

  const toggleProductForCombo = (product) => {
    const exists = selectedProductsForCombo.find(p => p.productId._id === product._id);
    if (exists) {
      setSelectedProductsForCombo(selectedProductsForCombo.filter(p => p.productId._id !== product._id));
    } else {
      setSelectedProductsForCombo([...selectedProductsForCombo, {
        productId: product,
        quantity: 1
      }]);
    }
  };

  const updateComboProductQuantity = (productId, quantity) => {
    setSelectedProductsForCombo(selectedProductsForCombo.map(p => 
      p.productId._id === productId ? { ...p, quantity: parseInt(quantity) } : p
    ));
  };

  const handleCreateCombo = async (e) => {
    e.preventDefault();
    
    try {
      // Upload images or use product images
      let imageUrls = [];
      if (comboImages.length > 0) {
        const uploadPromises = comboImages.map(async (file) => {
          const formData = new FormData();
          formData.append('image', file);
          const response = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return response.data.url;
        });
        imageUrls = await Promise.all(uploadPromises);
      } else {
        // Use first image from each selected product if no custom images uploaded
        imageUrls = selectedProductsForCombo
          .map(item => item.productId.images?.[0])
          .filter(Boolean)
          .slice(0, 4);
      }

      const comboPayload = {
        name: comboData.name,
        description: comboData.description,
        price: parseFloat(comboData.price),
        originalPrice: comboData.originalPrice ? parseFloat(comboData.originalPrice) : parseFloat(comboData.price),
        discount: comboData.discount ? parseFloat(comboData.discount) : 0,
        comboType: comboData.comboType,
        stock: parseInt(comboData.stock),
        images: imageUrls,
        includedProducts: selectedProductsForCombo.map(p => ({
          productId: p.productId._id,
          quantity: p.quantity
        }))
      };

      await api.post('/combos', comboPayload);
      alert('Combo created successfully!');
      setShowComboModal(false);
      // Reset form
      setComboData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        discount: '',
        comboType: 'Custom',
        stock: '',
      });
      setSelectedProductsForCombo([]);
      setComboImages([]);
      setComboImagePreview([]);
    } catch (error) {
      alert('Failed to create combo: ' + (error.response?.data?.message || error.message));
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Banner Carousel */}
      {activeBanners.length > 0 && (
        <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden bg-gradient-to-r from-green-400 to-emerald-600">
          {activeBanners.map((banner, index) => (
            <motion.div
              key={banner._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: currentBanner === index ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              className={`absolute inset-0 ${currentBanner === index ? 'z-10' : 'z-0'}`}
            >
              <Link to={banner.linkUrl || '#'} onClick={() => api.post(`/banners/${banner._id}/click`)}>
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              </Link>
            </motion.div>
          ))}
          
          {/* Banner Navigation Dots */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {activeBanners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentBanner === index ? 'bg-white w-6' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Bar with Trending Searches */}
      <div className="bg-white dark:bg-gray-800 sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="relative">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
              <Search className="w-5 h-5 text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search for seeds, plants, tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchQuery);
                  }
                }}
                onFocus={() => setShowTrendingSearches(true)}
                onBlur={() => setTimeout(() => setShowTrendingSearches(false), 200)}
                className="flex-1 bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="ml-2 bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Search
                </button>
              )}
            </div>
            
            {/* Trending Searches Dropdown */}
            {showTrendingSearches && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3"
              >
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 px-2">TRENDING SEARCHES</div>
                <div className="space-y-1">
                  {trendingSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(term)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      <Search className="w-4 h-4 inline mr-2 text-gray-400" />
                      {term}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Section - Horizontal Scroll */}
      <div className="bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Shop by Category</h2>
            <Link to="/shop" className="text-sm text-green-600 hover:text-green-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[calc(25%-12px)] min-w-[80px] flex flex-col items-center snap-start">
                  <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />
                  <div className="w-14 h-3 bg-gray-200 dark:bg-gray-700 rounded mt-2 animate-pulse" />
                </div>
              ))
            ) : (
              categories.map((category, index) => {
                // Default images for specific categories - meaningful plant/seed images
                const getCategoryImage = (name) => {
                  if (!name) return null;
                  const lowerName = name.toLowerCase().trim();
                  
                  // Vegetable Seeds
                  if (lowerName.includes('vegetable') || lowerName.includes('veggie') || lowerName === 'vegetable seeds') {
                    return 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=300&h=300&fit=crop';
                  }
                  // Flower Seeds
                  if (lowerName.includes('flower') || lowerName.includes('rose') || lowerName === 'flower seeds') {
                    return 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=300&fit=crop';
                  }
                  // Herbs
                  if (lowerName.includes('herb')) {
                    return 'https://images.unsplash.com/photo-1509587584298-0f3b3a3a1797?w=300&h=300&fit=crop';
                  }
                  // Fruits
                  if (lowerName.includes('fruit')) {
                    return 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&h=300&fit=crop';
                  }
                  // Soil & Fertilizers
                  if (lowerName.includes('soil') || lowerName.includes('fertil') || lowerName.includes('fertilizer')) {
                    return 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=300&h=300&fit=crop';
                  }
                  // Grow Bags
                  if (lowerName.includes('grow') || lowerName.includes('bag') || lowerName.includes('pot')) {
                    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSYEsxXxd50GZmSLWIwDVYSfhGVOxrCtHoyAA&s';
                  }
                  // Tools
                  if (lowerName.includes('tool') || lowerName.includes('garden')) {
                    return 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop';
                  }
                  
                  // Fallback to database image or null
                  return category.image || null;
                };
                
                const displayImage = getCategoryImage(category.name);
                
                return (
                  <Link
                    key={category._id}
                    to={`/shop?category=${category._id}`}
                    className="flex-shrink-0 w-[calc(25%-12px)] min-w-[80px] flex flex-col items-center group snap-start"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full aspect-square rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-green-400 to-emerald-500"
                    >
                      {displayImage ? (
                        <img 
                          src={displayImage} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl md:text-4xl">{category.icon || '🌱'}</span>
                      )}
                    </motion.div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2 text-center leading-tight line-clamp-2">
                      {category.name}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      {!searchQuery && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                Featured Products
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Hand-picked quality products with special offers
              </p>
            </div>
            <div className="flex gap-3">
              {user?.role === 'admin' && (
                <button
                  onClick={() => setShowComboModal(true)}
                  className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="text-sm md:text-base">Create Combo</span>
                </button>
              )}
              <Link
                to="/shop"
                className="text-green-600 hover:text-green-700 font-medium text-sm hidden md:block"
              >
                View All →
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 animate-pulse">
                  <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  addToCart={addToCart}
                  isAdmin={user?.role === 'admin'}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-6">
            <Link
              to="/shop"
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-8 py-3 rounded-lg transition-colors"
            >
              Show More Products
            </Link>
          </div>
        </div>
      )}

      {/* Top Selling Products Section */}
      {!searchQuery && (
        <div className="bg-gray-100 dark:bg-gray-800/50 py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  Top Selling Products
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Most popular products loved by our customers
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {topSellingProducts.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  addToCart={addToCart}
                  isAdmin={user?.role === 'admin'}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Looking for Seeds Category Banner */}
      {!searchQuery && categories.length > 0 && (
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Looking for Seeds?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Browse our wide variety of seed collections
            </p>
          </div>

          <div className="relative">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-6 pb-4">
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category._id}
                    to={`/shop?category=${category._id}`}
                    className="flex-shrink-0 w-72 group"
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
                    >
                      <div className="h-48 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                        <span className="text-7xl">{category.icon || '🌱'}</span>
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {category.name}
                        </h3>
                        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                          Buy {category.name.toLowerCase()}
                        </button>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {categories.slice(0, 6).map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* About Section */}
      {!searchQuery && (
        <div className="bg-white dark:bg-gray-800 py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  About Fresh Veggies
                </h2>
                <p className="text-lg text-green-600 dark:text-green-400 font-semibold mb-6">
                  Treat Your Self Organic 🌱
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Fresh Veggies is your trusted partner in organic gardening. We provide premium quality, 
                  certified organic seeds and gardening supplies to help you grow healthy, chemical-free 
                  vegetables and herbs right in your home garden.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                  With over a decade of experience in the organic farming industry, we're committed to 
                  promoting sustainable agriculture and helping families enjoy fresh, nutritious produce 
                  grown with love and care.
                </p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">10K+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Happy Customers</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">500+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Products</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">100%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Organic</div>
                  </div>
                </div>

                <Link to="/about">
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg">
                    Learn More About Us
                  </Button>
                </Link>
              </motion.div>

              {/* Right Image */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <img
                      src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=300&fit=crop"
                      alt="Organic Farming"
                      className="rounded-2xl shadow-lg w-full h-48 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=400&fit=crop"
                      alt="Fresh Vegetables"
                      className="rounded-2xl shadow-lg w-full h-64 object-cover"
                    />
                  </div>
                  <div className="space-y-4 pt-8">
                    <img
                      src="https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=400&h=400&fit=crop"
                      alt="Garden Seeds"
                      className="rounded-2xl shadow-lg w-full h-64 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1621452773781-0f992fd1f5cb?w=400&h=300&fit=crop"
                      alt="Organic Garden"
                      className="rounded-2xl shadow-lg w-full h-48 object-cover"
                    />
                  </div>
                </div>
                
                {/* Floating Badge */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-6 shadow-2xl">
                  <div className="text-center">
                    <div className="text-5xl mb-2">🏆</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">Certified</div>
                    <div className="text-sm text-green-600 dark:text-green-400">100% Organic</div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Feature Highlights */}
            <div className="grid md:grid-cols-4 gap-6 mt-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl"
              >
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🌿</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">100% Organic</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">All products are certified organic and chemical-free</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl"
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🚚</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Fast Delivery</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Quick shipping across India within 2-5 days</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl"
              >
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💯</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Quality Assured</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">High germination rate guaranteed on all seeds</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-center p-6 bg-gray-50 dark:bg-gray-900/50 rounded-xl"
              >
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🤝</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Expert Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get gardening tips and support from our experts</p>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Reviews / Testimonials */}
      {!searchQuery && reviews.length > 0 && (
        <div className="bg-gradient-to-b from-green-50 to-white dark:from-gray-800 dark:to-gray-900 py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                What People Are Saying
              </h2>
              <div className="flex justify-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>

            <div className="max-w-3xl mx-auto">
              <div className="relative min-h-[200px]">
                {reviews.map((review, index) => (
                  <motion.div
                    key={review._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: currentTestimonial === index ? 1 : 0 }}
                    className={`${currentTestimonial === index ? 'block' : 'hidden'} text-center`}
                  >
                    <p className="text-gray-700 dark:text-gray-300 text-lg italic mb-6 px-4">
                      "{review.comment}"
                    </p>
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mb-3">
                        <span className="text-2xl text-white font-bold">
                          {review.userId?.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {review.userId?.name || 'Customer'}
                      </p>
                      {review.isVerifiedPurchase && (
                        <p className="text-sm text-green-600 dark:text-green-400">
                          ✓ Verified Purchase
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Navigation Arrows and Dots */}
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentTestimonial((prev) => (prev - 1 + reviews.length) % reviews.length)}
                  className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
                >
                  ←
                </button>
                
                <div className="flex gap-2">
                  {reviews.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        currentTestimonial === index ? 'bg-green-600 w-6' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentTestimonial((prev) => (prev + 1) % reviews.length)}
                  className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Results or All Products */}
      {searchQuery && (
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Search Results
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Found {products.length} product{products.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setProducts(allProducts);
              }}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Clear Search
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-20">
            {products.map((product) => (
              <ProductCard 
                key={product._id} 
                product={product} 
                addToCart={addToCart}
                isAdmin={user?.role === 'admin'}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        </div>
      )}

      {/* Create Combo Modal */}
      {showComboModal && user?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateCombo}>
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-gray-800">
                <h2 className="text-xl md:text-2xl font-bold text-green-800 dark:text-green-400 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                  Create New Combo
                </h2>
                <button
                  type="button"
                  onClick={() => setShowComboModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Combo Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Combo Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={comboData.name}
                    onChange={(e) => setComboData({ ...comboData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Type & Stock */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Combo Type *
                    </label>
                    <select
                      required
                      value={comboData.comboType}
                      onChange={(e) => setComboData({ ...comboData, comboType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    >
                      {['Small', 'Medium', 'Kitchen Garden', 'Terrace Garden', 'Growing Kit', 'Custom'].map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      value={comboData.stock}
                      onChange={(e) => setComboData({ ...comboData, stock: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Price Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Combo Price * (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={comboData.price}
                      onChange={(e) => setComboData({ ...comboData, price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                      placeholder="Enter combo price"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Original Price (₹) - Auto Calculated
                    </label>
                    <input
                      type="number"
                      value={comboData.originalPrice}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      placeholder="Select products first"
                    />
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Sum of all selected product prices
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Discount (%) - Auto Calculated
                    </label>
                    <input
                      type="number"
                      value={comboData.discount}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                      placeholder="0"
                    />
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Based on original vs combo price
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows="4"
                    value={comboData.description}
                    onChange={(e) => setComboData({ ...comboData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Select Products */}
                <div className="border-2 border-green-200 dark:border-green-900 rounded-lg p-3 md:p-4 bg-green-50/50 dark:bg-green-900/10">
                  <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-400 mb-3 md:mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                    Select Products for Combo
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 max-h-64 overflow-y-auto mb-3 md:mb-4">
                    {allProducts.map((product) => {
                      const isSelected = selectedProductsForCombo.some(p => p.productId._id === product._id);
                      return (
                        <div
                          key={product._id}
                          onClick={() => toggleProductForCombo(product)}
                          className={`cursor-pointer border-2 rounded-lg p-2 transition-all ${
                            isSelected 
                              ? 'border-green-600 bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500/50' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                        >
                          <img
                            src={product.images?.[0] || 'https://via.placeholder.com/100'}
                            alt={product.name}
                            className="w-full h-20 object-cover rounded mb-2"
                          />
                          <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2">
                            {product.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            ₹{product.price}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Selected Products with Quantity */}
                  {selectedProductsForCombo.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Selected Products ({selectedProductsForCombo.length})
                      </h4>
                      {selectedProductsForCombo.map((item) => (
                        <div key={item.productId._id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                          <img
                            src={item.productId.images?.[0] || 'https://via.placeholder.com/40'}
                            alt={item.productId.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <p className="flex-1 text-sm text-gray-900 dark:text-white">
                            {item.productId.name}
                          </p>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateComboProductQuantity(item.productId._id, e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image Upload with Carousel Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Combo Images {comboImagePreview.length === 0 && '(Using product images by default)'}
                  </label>
                  
                  {/* Image Carousel Preview */}
                  <ComboImageCarousel images={getComboPreviewImages()} />
                  
                  <label className="flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 px-4 py-3 rounded-lg cursor-pointer transition-all border-2 border-dashed border-green-400 dark:border-green-700 mt-3">
                    <Upload className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-500" />
                    <span className="text-sm md:text-base text-green-700 dark:text-green-400 font-medium">
                      {comboImagePreview.length > 0 ? 'Change Images' : 'Upload Custom Images (Optional)'}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleComboImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {comboImagePreview.length === 0 
                      ? 'Product images will be used automatically. Upload custom images to override.'
                      : `${comboImagePreview.length} custom image(s) uploaded`}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 md:gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <button
                  type="button"
                  onClick={() => setShowComboModal(false)}
                  className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm md:text-base font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 md:px-6 py-2 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm md:text-base"
                >
                  Create Combo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Combo Image Carousel Component
const ComboImageCarousel = ({ images }) => {
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

  React.useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1000); // Change image every 1 second
      return () => clearInterval(interval);
    }
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Select products to see preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-inner">
      {images.map((image, index) => (
        <motion.img
          key={index}
          src={image}
          alt={`Combo preview ${index + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: currentImageIndex === index ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
      ))}
      
      {/* Image Counter */}
      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
        {currentImageIndex + 1} / {images.length}
      </div>

      {/* Navigation Dots */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentImageIndex === index 
                ? 'bg-white w-6' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Product Card Component
const ProductCard = ({ product, addToCart, isAdmin, onEdit, onDelete }) => {
  const calculateDiscount = () => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return 0;
  };

  const discount = calculateDiscount();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-200 dark:border-gray-700"
    >
      <Link to={`/product/${product._id}`} className="block relative">
        {/* Admin Action Buttons */}
        {isAdmin && (
          <div className="absolute top-2 right-2 z-20 flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                onEdit(product);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg transition-all"
              title="Edit Product"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(product._id);
              }}
              className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-lg transition-all"
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-md z-10">
            -{discount}%
          </div>
        )}
        
        {/* Trending Badge */}
        {product.trending && !isAdmin && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md z-10">
            🔥 HOT
          </div>
        )}

        {/* Product Image */}
        <div className="relative h-48 lg:h-56 bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <img
            src={product.images?.[0] || 'https://via.placeholder.com/300'}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
          />
        </div>
      </Link>

      {/* Product Info */}
      <div className="p-3 lg:p-4 flex flex-col flex-grow">
        <Link to={`/product/${product._id}`}>
          <h3 className="font-semibold text-sm lg:text-base text-gray-900 dark:text-white mb-1.5 line-clamp-2 hover:text-green-600 dark:hover:text-green-400 transition-colors min-h-[40px]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-300 text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {product.rating?.toFixed(1) || '0.0'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            | {product.numReviews || 0}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg lg:text-xl font-bold text-green-600 dark:text-green-400">
            ₹{product.price}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
              ₹{product.originalPrice}
            </span>
          )}
        </div>

        {/* Add to Cart Button - Hide for Admin */}
        {!isAdmin && (
          <Button
            onClick={() => addToCart(product, 1)}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2.5 rounded-xl transition-all duration-300 hover:shadow-lg mt-auto"
          >
            Add to Cart
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default HomePage;
