import CollectionBanner from '../components/storefront/CollectionBanner';
import CategoryCircleRow from '../components/storefront/CategoryCircleRow';
import FilterSortBar from '../components/storefront/FilterSortBar';
import FacetFilterSidebar from '../components/storefront/FacetFilterSidebar';
import ActiveFilterPills from '../components/storefront/ActiveFilterPills';
import ProductCardV2 from '../components/storefront/ProductCardV2';
import ProductListItem from '../components/storefront/ProductListItem';
import ProductSkeletonGrid from '../components/storefront/ProductSkeletonGrid';
import SupportCta from '../components/storefront/SupportCta';
import GardeningGuides from '../components/storefront/GardeningGuides';
import CustomerTestimonials from '../components/storefront/CustomerTestimonials';
import FeatureSpotlight from '../components/storefront/FeatureSpotlight';
import FAQAccordion from '../components/storefront/FAQAccordion';
import Pagination from '../components/Pagination';
import TrustBadgesBar from '../components/storefront/TrustBadgesBar';
import FarmToHome from '../components/storefront/FarmToHome';
import ComparisonMatrix from '../components/storefront/ComparisonMatrix';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Upload, X, ShoppingBag, Search, Sparkles, RotateCcw } from 'lucide-react';
import api, { cachedGet } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getProductImageUrl, handleImageError } from '../utils/imageFallback';

const Storefront = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchParams, setSearchParams] = useSearchParams();
  const [suggestions, setSuggestions] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Single Source of Truth: URL query parameters define all filter & page states
  const category = searchParams.get('category') || '';
  const search   = searchParams.get('search') || '';
  const season   = searchParams.get('season') || '';
  const sort     = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const rating   = searchParams.get('rating') || '';
  const inStock  = searchParams.get('inStock') === 'true';
  const page     = Math.max(1, parseInt(searchParams.get('page'), 10) || 1);

  const filters = useMemo(() => ({
    category,
    season,
    search,
    sort,
    minPrice,
    maxPrice,
    rating,
    inStock,
  }), [category, season, search, sort, minPrice, maxPrice, rating, inStock]);

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

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products whenever filters, page, or refreshKey changes with race cancellation
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);

    const loadProducts = async () => {
      try {
        const params = {
          ...filters,
          page,
          limit: 12,
        };

        // Sanitize empty/false params
        Object.keys(params).forEach((k) => {
          if (params[k] === '' || params[k] === null || params[k] === undefined || params[k] === false) {
            delete params[k];
          }
        });
        if (filters.inStock) {
          params.inStock = 'true';
        }

        const response = await api.get('/products', { params });
        if (isCancelled) return;

        const productsData = response.data?.data || response.data || [];
        setProducts(Array.isArray(productsData) ? productsData : []);
        setTotalPages(response.data?.totalPages || 1);
        setTotal(response.data?.total ?? productsData.length);
        setSuggestions(response.data?.suggestions || []);
        setRecommended(response.data?.recommended || []);
      } catch (error) {
        if (isCancelled) return;
        console.error('Error fetching products:', error);
        setProducts([]);
        setSuggestions([]);
        setRecommended([]);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [filters, page, refreshKey]);

  // Handle single facet filter change (direct URL searchParams mutation)
  const handleFilterChange = useCallback((key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === '' || value === false || value === null || value === undefined) {
        next.delete(key);
      } else if (key === 'sort' && value === 'newest') {
        next.delete('sort');
      } else {
        next.set(key, String(value));
      }
      next.delete('page');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Reset all facet filters
  const handleClearAllFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  // Handle pagination change
  const handlePageChange = useCallback((newPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newPage > 1) {
        next.set('page', String(newPage));
      } else {
        next.delete('page');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

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
      const response = await cachedGet('/categories', { force: true });
      const categoriesData = response.data?.data || response.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Admin Functions
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/products/${productId}`);
      alert('Product deleted successfully!');
      setRefreshKey((k) => k + 1);
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
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Top Customer Rated' },
  ];

  return (
    <div className="bg-fv-page">
      <CollectionBanner />

      {/* Sticky Horizontal Category Pill Bar (BigBasket / Nature's Basket botanical navigation) */}
      <div className="sticky top-[60px] sm:top-[68px] z-20 bg-fv-page/95 backdrop-blur-md shadow-xs border-b border-fv-border/40 transition-all">
        <CategoryCircleRow
          categories={categories}
          activeId={filters.category}
          onSelect={(id) => handleFilterChange('category', id)}
        />
      </div>

      {/* Mobile-First Search Bar: Quick in-catalogue search on mobile screens */}
      <div className="px-4 pt-2.5 pb-1 sm:px-6 lg:hidden">
        <div className="mx-auto max-w-[1500px]">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-4 h-4 w-4 text-fv-primary/60" aria-hidden="true" />
            <input
              id="mobile-shop-search"
              type="search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search plants, seeds, planters, soil…"
              className="h-10 w-full rounded-full border border-[#E8D7B8] bg-[#F4E6C6]/60 pl-11 pr-10 text-[13px] text-[#0A4C36] shadow-xs
                         placeholder:text-[#0A4C36]/60 focus:bg-white focus:border-[#0A4C36] focus:outline-none focus:ring-2 focus:ring-[#0A4C36]/20 transition-all"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => handleFilterChange('search', '')}
                className="absolute right-3 flex h-7 w-7 items-center justify-center rounded-full text-fv-primary/70 hover:text-fv-primary focus:outline-none"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Ugaoo Signature Trust Badges Bar */}
      <TrustBadgesBar />

      {/* Control Bar: Filter Toggle, View Mode Switcher, Item Count, and Sort Dropdown */}
      <FilterSortBar
        count={total}
        sort={filters.sort}
        options={SORT_OPTIONS}
        onSortChange={(v) => handleFilterChange('sort', v)}
        onOpenFilter={() => setFiltersOpen((o) => !o)}
        filtersOpen={filtersOpen}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Amazon / Sephora Benchmark: Faceted Filter Panel Drawer */}
      <FacetFilterSidebar
        filters={filters}
        categories={categories}
        onChange={handleFilterChange}
        onReset={handleClearAllFilters}
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        totalCount={total}
      />

      {/* Active Filter Pills Bar with Removable Chips and Clear All */}
      <ActiveFilterPills
        filters={filters}
        categories={categories}
        onRemoveFilter={handleFilterChange}
        onClearAll={handleClearAllFilters}
      />

      <div id="catalogue-heading" className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-10 scroll-mt-20">
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

        {loading && products.length === 0 ? (
          <ProductSkeletonGrid count={8} viewMode={viewMode} />
        ) : products.length > 0 ? (
          <div className={`transition-opacity duration-200 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <div key={product._id} className="h-full flex flex-col">
                    <ProductCardV2
                      product={product}
                      isAdmin={user?.role === 'admin'}
                      onEdit={user?.role === 'admin' ? handleEditProduct : undefined}
                      onDelete={user?.role === 'admin' ? handleDeleteProduct : undefined}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div key={product._id}>
                    <ProductListItem
                      product={product}
                      isAdmin={user?.role === 'admin'}
                      onEdit={user?.role === 'admin' ? handleEditProduct : undefined}
                      onDelete={user?.role === 'admin' ? handleDeleteProduct : undefined}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-10">
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                onPageChange={handlePageChange}
                itemLabel="products"
              />
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-fv-primary mb-4">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              No products found
            </h3>
            <p className="mt-2 text-sm text-fv-muted max-w-md mx-auto">
              We couldn't find matches for your active search or filter selection. Try adjusting keywords or clearing specific filters.
            </p>

            {/* Spelling Suggestions ("Did you mean...") */}
            {suggestions.length > 0 && (
              <div className="mt-6 p-4 rounded-2xl bg-[#FFF3D9]/80 border border-[#E8D7B8] max-w-lg mx-auto">
                <span className="text-xs font-bold text-[#0A4D3C] uppercase tracking-wider">
                  Did you mean:
                </span>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleFilterChange('search', sug)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-[#0A4D3C] border border-[#0A4D3C]/30 hover:border-[#0A4D3C] hover:bg-emerald-50 transition-all cursor-pointer shadow-2xs hover:scale-105"
                    >
                      "{sug}"
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-fv-primary hover:bg-fv-primary-dark text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset All Filters
              </button>
            </div>

            {/* Recommended Seasonal Items when Zero Results */}
            {recommended.length > 0 && (
              <div className="mt-16 text-left border-t border-fv-border pt-10">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-fv-primary" />
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                    Recommended Seasonal Varieties
                  </h4>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
                  {recommended.map((prod) => (
                    <ProductCardV2 key={prod._id} product={prod} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <FarmToHome />

      <ComparisonMatrix />

      <FeatureSpotlight />

      <CustomerTestimonials />

      <GardeningGuides />

      <FAQAccordion />

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
                            src={getProductImageUrl(product)}
                            alt={product.name}
                            onError={(e) => handleImageError(e, getProductImageUrl(product))}
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
                            src={getProductImageUrl(item.productId)}
                            alt={item.productId.name}
                            onError={(e) => handleImageError(e, getProductImageUrl(item.productId))}
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
