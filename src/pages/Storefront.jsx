import CollectionBanner from '../components/storefront/CollectionBanner';
import CategoryCircleRow from '../components/storefront/CategoryCircleRow';
import FilterSortBar from '../components/storefront/FilterSortBar';
import ProductCardV2 from '../components/storefront/ProductCardV2';
import PageLoader from '../components/PageLoader';
import PromoTile from '../components/storefront/PromoTile';
import SupportCta from '../components/storefront/SupportCta';
import Pagination from '../components/Pagination';
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Upload, X, ShoppingBag } from 'lucide-react';
import api, { cachedGet } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Storefront = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    season: '',
    search: '',
    sort: 'newest',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Admin combo modal states
  const [showComboModal, setShowComboModal] = useState(false);
  const [selectedProductsForCombo, setSelectedProductsForCombo] = useState([]);
  const [comboData, setComboData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    discount: '',
    comboType: 'Custom',
    stock: ''
  });
  const [comboImages, setComboImages] = useState([]);
  const [comboImagePreview, setComboImagePreview] = useState([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page,
        limit: 12,
      };
      const response = await cachedGet('/products', { params });
      const productsData = response.data?.data || response.data || [];
      setProducts(Array.isArray(productsData) ? productsData : []);
      setTotalPages(response.data?.totalPages || 1);
      setTotal(response.data?.total ?? productsData.length);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
    setLoading(false);
  }, [filters, page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Update filters when URL params change
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl && categoryFromUrl !== filters.category) {
      setFilters(prev => ({ ...prev, category: categoryFromUrl }));
    }
  }, [searchParams, filters.category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  const fetchCategories = async () => {
    try {
      const response = await cachedGet('/categories');
      const categoriesData = response.data?.data || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
    setPage(1);
    
    // Update URL params for category
    if (field === 'category') {
      if (value) {
        setSearchParams({ category: value });
      } else {
        setSearchParams({});
      }
    }
  };

  // Admin Functions
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/products/${productId}`);
      alert('Product deleted successfully!');
      fetchProducts();
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
      setComboData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        discount: '',
        comboType: 'Custom',
        stock: ''
      });
      setSelectedProductsForCombo([]);
      setComboImages([]);
      setComboImagePreview([]);
    } catch (error) {
      alert('Failed to create combo: ' + (error.response?.data?.message || error.message));
    }
  };

  const SORT_OPTIONS = [
    { value: 'newest', label: 'Newest' },
    { value: 'price-low', label: 'Price: low to high' },
    { value: 'price-high', label: 'Price: high to low' },
  ];

  const hasExtraFilters = filters.search || filters.season;

  // Reuse a real catalogue photo for the promo tile rather than shipping
  // another stock image; the tile falls back to a flat panel if none loads.
  const promoImage = products.find((p) => /fertilizer|compost|soil/i.test(p.name) && p.images?.[0])?.images?.[0]
    || products.find((p) => p.images?.[0])?.images?.[0];

  return (
    <div className="bg-fv-page">
      <CollectionBanner />

      <CategoryCircleRow
        categories={categories}
        activeId={filters.category}
        onSelect={(id) => handleFilterChange('category', id)}
      />

      <FilterSortBar
        count={total}
        sort={filters.sort}
        options={SORT_OPTIONS}
        onSortChange={(v) => handleFilterChange('sort', v)}
        onOpenFilter={() => setFiltersOpen((o) => !o)}
        filtersOpen={filtersOpen}
      />

      {/* Search and season live behind FILTER so the bar stays uncluttered,
          but they stay mounted once opened so typing is not interrupted. */}
      {filtersOpen && (
        <div className="px-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-end gap-4 border-b border-fv-border py-4">
            <p className="min-w-[220px] flex-1">
              <label htmlFor="shop-search" className="block text-[13px] font-medium text-fv-muted">Search</label>
              <input
                id="shop-search"
                type="search"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Search for seeds, soil, tools…"
                className="mt-1 h-11 w-full rounded-[50px] border border-fv-border bg-white px-4 text-[15px]
                           focus:border-fv-primary focus:outline-none focus:ring-2 focus:ring-fv-primary"
              />
            </p>
            <p className="min-w-[180px]">
              <label htmlFor="shop-season" className="block text-[13px] font-medium text-fv-muted">Season</label>
              <select
                id="shop-season"
                value={filters.season}
                onChange={(e) => handleFilterChange('season', e.target.value)}
                className="mt-1 h-11 w-full rounded-[50px] border border-fv-border bg-white px-4 text-[15px]
                           focus:border-fv-primary focus:outline-none focus:ring-2 focus:ring-fv-primary"
              >
                <option value="">All seasons</option>
                <option value="Summer">Summer</option>
                <option value="Winter">Winter</option>
                <option value="All Season">All season</option>
                <option value="Monsoon">Monsoon</option>
              </select>
            </p>
            {hasExtraFilters && (
              <button
                type="button"
                onClick={() => { handleFilterChange('search', ''); handleFilterChange('season', ''); }}
                className="h-11 rounded-[50px] border border-fv-primary px-5 text-[14px] font-semibold text-fv-primary
                           hover:bg-fv-primary hover:text-white focus-visible:outline-none focus-visible:ring-2
                           focus-visible:ring-fv-primary"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10">
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowComboModal(true)}
            className="mb-6 inline-flex h-11 items-center gap-2 rounded-[50px] bg-fv-primary px-5 text-[15px]
                       font-semibold text-white hover:bg-fv-primary-dark focus-visible:outline-none
                       focus-visible:ring-2 focus-visible:ring-fv-primary focus-visible:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create combo
          </button>
        )}

        {loading ? (
          <PageLoader text="Loading products…" />
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product, i) => (
                <React.Fragment key={product._id}>
                  <ProductCardV2
                    product={product}
                    isAdmin={user?.role === 'admin'}
                    onEdit={user?.role === 'admin' ? handleEditProduct : undefined}
                    onDelete={user?.role === 'admin' ? handleDeleteProduct : undefined}
                  />
                  {/* Break the grid once, after the first full row. */}
                  {i === 5 && (
                    <PromoTile
                      title="Feed your plants right with our organic fertilizers"
                      to="/"
                      image={promoImage}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={setPage}
                itemLabel="products"
              />
            </div>
          </>
        ) : (
          <div className="py-20 text-center">
            <p className="text-[18px] font-medium text-fv-heading">No products found</p>
            <p className="mt-1 text-[15px] text-fv-muted">Try a different category or clear your filters.</p>
          </div>
        )}
      </div>

      <SupportCta />

      {/* Create Combo Modal */}
      {showComboModal && user?.role === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fadeIn">
            <form onSubmit={handleCreateCombo}>
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-gray-800 rounded-t-2xl">
                <h2 className="text-xl md:text-2xl font-bold text-green-800 dark:text-green-400 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
                  Create New Combo
                </h2>
                <button
                  type="button"
                  onClick={() => setShowComboModal(false)}
                  className="p-2 hover:bg-white/50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Combo Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={comboData.name}
                    onChange={(e) => setComboData({ ...comboData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter combo name..."
                  />
                </div>

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
                        <option key={type} value={type}>{type}</option>
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
                      placeholder="0"
                    />
                  </div>
                </div>

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
                    placeholder="Describe the combo..."
                  />
                </div>

                <div className="border-2 border-green-200 dark:border-green-900 rounded-lg p-3 md:p-4 bg-green-50/50 dark:bg-green-900/10">
                  <h3 className="text-base md:text-lg font-semibold text-green-800 dark:text-green-400 mb-3 md:mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                    Select Products for Combo
                  </h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 max-h-64 overflow-y-auto mb-3 md:mb-4 p-1 md:p-2">
                    {products.map((product) => {
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
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            ₹{product.price}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {selectedProductsForCombo.length > 0 && (
                    <div className="space-y-2 bg-white dark:bg-gray-800 p-2 md:p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                          {selectedProductsForCombo.length}
                        </span>
                        Selected Products
                      </h4>
                      {selectedProductsForCombo.map((item) => (
                        <div key={item.productId._id} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
                            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

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
              <div className="flex justify-end gap-2 md:gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setShowComboModal(false)}
                  className="px-4 md:px-6 py-2 md:py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 md:px-8 py-2 md:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all text-sm md:text-base"
                >
                  <ShoppingBag className="w-4 h-4 md:w-5 md:h-5" />
                  <span>Create Combo</span>
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
      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center mb-3">
        <div className="text-center">
          <ShoppingBag className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Select products to see preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-inner mb-3">
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

export default Storefront;
