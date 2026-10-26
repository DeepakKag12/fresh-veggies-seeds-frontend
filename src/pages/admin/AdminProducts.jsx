import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, X, Package, Upload, MoreVertical, Search, Boxes, Filter, AlertTriangle, Download, LayoutGrid, List, Sparkles, ArrowLeft } from 'lucide-react';
import api from '../../utils/api';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import { exportProductsToCsv } from '../../utils/adminCsvExport';

const AdminProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [quickStockValue, setQuickStockValue] = useState('');
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stockFilter, setStockFilter] = useState(''); // '' | 'low' | 'out'
  const [selectedCategory, setSelectedCategory] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [packages, setPackages] = useState([
    { quantity: '50 Seeds', price: '', stock: '' }
  ]);
  
  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    price: '',
    originalPrice: '',
    weight: '',
    stock: '',
    description: '',
    season: 'All Season',
    images: '',
    featured: false,
    trending: false,
    hasPackages: false   // toggle: sell by package variants (quantity-based)
  });


  // Synchronize stockFilter if URL params change
  useEffect(() => {
    if (searchParams.get('lowstock') === 'true') {
      setStockFilter('low');
    } else if (searchParams.get('outofstock') === 'true') {
      setStockFilter('out');
    }
  }, [searchParams]);

  // Refetch whenever the page, search, stockFilter, or category changes
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery, stockFilter, selectedCategory, searchParams]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Check if redirected from product card edit or new
    if (location.state?.editProduct) {
      handleOpen(location.state.editProduct);
    } else if (searchParams.get('new') === 'true') {
      handleOpen();
      // clean param from URL so refresh doesn't reopen modal
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('new');
      setSearchParams(newParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, searchParams]);

  const fetchProducts = async () => {
    try {
      const params = { page, limit: 24 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (stockFilter === 'low' || searchParams.get('lowstock') === 'true') params.lowstock = 'true';
      if (stockFilter === 'out' || searchParams.get('outofstock') === 'true') params.outofstock = 'true';
      if (selectedCategory) params.category = selectedCategory;

      const response = await api.get('/products', { params });
      setProducts(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalProducts(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const handleQuickStockSave = async () => {
    if (!stockModalProduct) return;
    const newStock = parseInt(quickStockValue, 10);
    if (isNaN(newStock) || newStock < 0) {
      toast.error('Please enter a valid stock count');
      return;
    }

    try {
      await api.put(`/products/${stockModalProduct._id}`, { stock: newStock });
      toast.success(`Stock updated to ${newStock}!`);
      setStockModalProduct(null);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleExportCsv = () => {
    try {
      exportProductsToCsv(products, 'inventory_catalog');
      toast.success(`Exported ${products.length} products to CSV!`);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpen = (product = null) => {
    if (product) {
      setEditMode(true);
      setCurrentProduct(product);
      const hasPkgs = product.packages && product.packages.length > 0;
      setFormData({
        name: product.name,
        categoryId: product.categoryId._id || product.categoryId,
        price: product.price,
        originalPrice: product.originalPrice || '',
        weight: product.weight || '',
        stock: product.stock,
        description: product.description,
        season: product.season || 'All Season',
        images: product.images.join(', '),
        featured: product.featured || false,
        trending: product.trending || false,
        hasPackages: hasPkgs
      });
      // Load packages if exists
      if (hasPkgs) {
        setPackages(product.packages.map(p => ({
          quantity: p.quantity,
          price: p.price.toString(),
          stock: p.stock.toString()
        })));
      } else {
        setPackages([{ quantity: '', price: '', stock: '' }]);
      }
      setImagePreview(product.images || []);
    } else {
      setEditMode(false);
      setCurrentProduct(null);
      setFormData({
        name: '',
        categoryId: '',
        price: '',
        originalPrice: '',
        weight: '',
        stock: '',
        description: '',
        season: 'All Season',
        images: '',
        featured: false,
        trending: false,
        hasPackages: false
      });
      setPackages([{ quantity: '', price: '', stock: '' }]);
      setImagePreview([]);
      setImageFiles([]);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setMessage({ type: '', text: '' });
    setImageFiles([]);
    setImagePreview([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    
    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const handleAddPackage = () => {
    setPackages([...packages, { quantity: '', price: '', stock: '50' }]);
  };

  const handleAddPresetPackage = (labelPreset) => {
    // If the last package is empty, replace it; otherwise add new
    const last = packages[packages.length - 1];
    if (last && !last.quantity && !last.price) {
      const updated = [...packages];
      updated[packages.length - 1] = {
        ...last,
        quantity: labelPreset,
        price: last.price || formData.price || '',
        stock: last.stock || '50'
      };
      setPackages(updated);
    } else {
      setPackages([
        ...packages,
        { quantity: labelPreset, price: formData.price || '', stock: '50' }
      ]);
    }
  };

  const handleRemovePackage = (index) => {
    setPackages(packages.filter((_, i) => i !== index));
  };

  const handlePackageChange = (index, field, value) => {
    const newPackages = [...packages];
    newPackages[index][field] = value;
    setPackages(newPackages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      let imageUrls = formData.images.split(',').map((url) => url.trim()).filter(url => url);
      
      // Upload new images if selected
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('image', file);
          const response = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return response.data.data.url;
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      // Filter valid packages (allowing 0 stock for sold-out variants)
      const validPackages = packages
        .filter(p => p.quantity?.trim() && p.price !== '' && !isNaN(p.price) && p.stock !== '' && !isNaN(p.stock))
        .map(p => ({
          quantity: p.quantity.trim(),
          price: parseFloat(p.price),
          stock: Math.max(0, parseInt(p.stock, 10) || 0)
        }));

      if (formData.hasPackages && validPackages.length === 0) {
        setMessage({
          type: 'error',
          text: 'Please add at least one package variant with label, price, and stock.'
        });
        return;
      }

      // Strip UI-only fields before sending to backend
      const { hasPackages, ...restFormData } = formData;

      const totalVariantStock = validPackages.reduce((sum, p) => sum + (p.stock || 0), 0);

      const productData = {
        ...restFormData,
        images: imageUrls,
        packages: formData.hasPackages && validPackages.length > 0 ? validPackages : [],
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        price: parseFloat(formData.price),
        // If selling by packages, overall stock is the sum of variant package stock
        stock: formData.hasPackages && validPackages.length > 0 ? totalVariantStock : (parseInt(formData.stock, 10) || 0),
        // Clear weight when using packages
        weight: formData.hasPackages ? undefined : (formData.weight || undefined)
      };

      if (editMode) {
        await api.put(`/products/${currentProduct._id}`, productData);
        setMessage({ type: 'success', text: 'Product updated successfully!' });
      } else {
        await api.post('/products', productData);
        setMessage({ type: 'success', text: 'Product created successfully!' });
      }

      fetchProducts();
      setTimeout(() => handleClose(), 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save product',
      });
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/products/${productToDelete._id}`);
      fetchProducts();
      toast.success(`"${productToDelete.name}" deleted successfully!`);
      setProductToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-fv-page py-6 md:py-8 pb-28 md:pb-8">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Navigation Breadcrumb & Back Action */}
        <div className="flex items-center gap-2 mb-4 text-xs font-medium text-fv-muted">
          <button
            type="button"
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/admin/dashboard');
              }
            }}
            className="inline-flex items-center gap-1 hover:text-fv-primary dark:hover:text-emerald-400 transition-colors font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="hover:text-fv-primary transition-colors"
          >
            Dashboard
          </button>
          <span>/</span>
          <span className="text-fv-heading dark:text-white font-semibold">Products</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-fv-heading flex items-center gap-2">
              Manage Products
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary font-bold">
                {totalProducts} products
              </span>
            </h1>
            <p className="text-xs md:text-sm text-fv-muted mt-0.5">
              Control your catalog, manage inventory levels, and configure pricing
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-60 min-w-[180px]">
              <Search className="w-4 h-4 text-fv-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-800 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading min-h-[42px]"
              />
            </div>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!products || products.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-fv-surface dark:hover:bg-gray-700 text-fv-heading border border-fv-border rounded-xl text-xs font-semibold disabled:opacity-40 min-h-[42px] transition-colors shrink-0 shadow-2xs"
              title="Export inventory to CSV"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 bg-white dark:bg-gray-800 rounded-xl border border-fv-border shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-fv-surface dark:bg-gray-700 text-fv-primary shadow-xs font-bold'
                    : 'text-fv-muted hover:text-fv-heading'
                }`}
                title="Grid View (Cards)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-fv-surface dark:bg-gray-700 text-fv-primary shadow-xs font-bold'
                    : 'text-fv-muted hover:text-fv-heading'
                }`}
                title="Table View (Amazon Spreadsheet)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => handleOpen()}
              className="flex items-center gap-1.5 bg-fv-primary hover:bg-fv-primary-dark text-white px-4 py-2 rounded-xl text-xs md:text-sm font-semibold shadow-xs transition-all whitespace-nowrap min-h-[42px]"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filter & Organization Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-fv-border shadow-2xs">
          {/* Segmented Stock Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => { setStockFilter(''); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                stockFilter === ''
                  ? 'bg-fv-primary text-white shadow-2xs'
                  : 'bg-fv-surface text-fv-muted hover:text-fv-heading'
              }`}
            >
              All Products
            </button>
            <button
              type="button"
              onClick={() => { setStockFilter('low'); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                stockFilter === 'low'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-fv-surface text-amber-700 dark:text-amber-400 hover:bg-amber-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Low Stock (≤10)
            </button>
            <button
              type="button"
              onClick={() => { setStockFilter('out'); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                stockFilter === 'out'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-fv-surface text-red-600 dark:text-red-400 hover:bg-red-50'
              }`}
            >
              Out of Stock
            </button>
          </div>

          {/* Category Dropdown Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-fv-muted hidden sm:inline" />
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-fv-border bg-fv-surface text-fv-heading focus:ring-1 focus:ring-fv-primary cursor-pointer min-h-[36px]"
            >
              <option value="">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {(stockFilter || selectedCategory || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStockFilter('');
                  setSelectedCategory('');
                  setSearchQuery('');
                  setPage(1);
                  setSearchParams({}, { replace: true });
                }}
                className="text-xs text-fv-muted hover:text-fv-heading px-2 py-1 rounded-lg transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Products Display (Table View vs Grid View) */}
        {viewMode === 'table' ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border overflow-hidden shadow-xs mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-fv-surface/60 dark:bg-gray-700/50 border-b border-fv-border text-[11px] font-bold text-fv-muted uppercase tracking-wider">
                    <th className="py-3 px-4">Item & Catalog Info</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-center">Stock Level</th>
                    <th className="py-3 px-4">Tags & Packages</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fv-border">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-xs text-fv-muted">
                        No products match your current filters.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const stockCount = product.packages && product.packages.length > 0
                        ? product.packages.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
                        : product.stock;
                      const isOutOfStock = stockCount <= 0;
                      const isLowStock = !isOutOfStock && stockCount <= 10;

                      return (
                        <tr key={product._id} className="hover:bg-fv-surface/40 transition-colors text-xs">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={product.images?.[0] || 'https://via.placeholder.com/80'}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded-xl border border-fv-border shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-fv-heading dark:text-white line-clamp-1">{product.name}</p>
                                <p className="text-[10px] text-fv-muted font-mono">{product.season || 'All Season'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-fv-muted">
                            <span className="px-2 py-0.5 rounded-md bg-fv-surface text-[11px] font-semibold text-fv-heading">
                              {product.categoryId?.name || 'Produce'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-fv-primary text-sm">₹{product.price}</span>
                            {product.originalPrice > product.price && (
                              <span className="text-[10px] text-fv-muted line-through block">₹{product.originalPrice}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setStockModalProduct(product);
                                setQuickStockValue(product.stock);
                              }}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-transform hover:scale-105 ${
                                isOutOfStock
                                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                                  : isLowStock
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                              }`}
                              title="Click to quickly adjust stock"
                            >
                              <span>{isOutOfStock ? 'Out of Stock' : `${stockCount} in stock`}</span>
                              <Boxes className="w-3 h-3 opacity-70" />
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1">
                              {product.featured && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                  <Sparkles className="w-2.5 h-2.5" /> Featured
                                </span>
                              )}
                              {product.packages?.length > 0 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {product.packages.length} Packs
                                </span>
                              )}
                              {product.weight && !product.packages?.length && (
                                <span className="text-[10px] text-fv-muted font-medium">
                                  {product.weight}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpen(product)}
                                className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors font-semibold"
                                title="Edit Product"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setProductToDelete(product)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {products.map((product) => {
            const stockCount = product.packages && product.packages.length > 0
              ? product.packages.reduce((sum, p) => sum + (Number(p.stock) || 0), 0)
              : product.stock;
            const isOutOfStock = stockCount <= 0;
            const isLowStock = !isOutOfStock && stockCount <= 10;

            return (
              <div
                key={product._id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border overflow-hidden shadow-xs hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/300'}
                      alt={product.name}
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end">
                      {isOutOfStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-xs">
                          Low: {stockCount} left
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm text-fv-heading line-clamp-2">
                        {product.name}
                      </h3>
                    </div>
                    <p className="text-xs text-fv-muted mb-2">
                      {product.categoryId?.name || 'No Category'}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-base font-bold text-fv-primary">
                        ₹{product.price}
                      </span>
                      <span className="text-xs font-semibold text-fv-muted">
                        Stock: {stockCount}
                      </span>
                    </div>
                    {product.packages && product.packages.length > 0 ? (
                      <div className="mb-2">
                        <div className="flex flex-wrap gap-1">
                          {product.packages.slice(0, 3).map((pkg, pIdx) => (
                            <span key={pIdx} className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded-md font-medium">
                              {pkg.quantity} (₹{pkg.price})
                            </span>
                          ))}
                          {product.packages.length > 3 && (
                            <span className="text-[10px] text-fv-muted font-medium self-center">
                              +{product.packages.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    ) : product.weight ? (
                      <div className="mb-2">
                        <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-md font-medium">
                          Weight: {product.weight}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Consolidate: Primary Edit Button + More Options Dropdown */}
                <div className="p-4 pt-0 flex items-center gap-2 relative">
                  <button
                    onClick={() => handleOpen(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === product._id ? null : product._id)}
                      className="p-2 text-fv-muted hover:text-fv-heading hover:bg-fv-surface rounded-xl border border-fv-border transition-colors"
                      title="More actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === product._id && (
                      <div className="absolute right-0 bottom-full mb-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-fv-border p-1 z-20">
                        <button
                          onClick={() => {
                            setStockModalProduct(product);
                            setQuickStockValue(product.stock);
                            setActiveMenuId(null);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-fv-heading hover:bg-fv-surface rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Boxes className="w-3.5 h-3.5 text-orange-500" />
                          Quick Adjust Stock
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            setProductToDelete(product);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Product
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

        {/* Quick Stock Modal */}
        {stockModalProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-5 border border-fv-border">
              <h3 className="text-sm font-bold text-fv-heading mb-1">
                Quick Adjust Stock
              </h3>
              <p className="text-xs text-fv-muted mb-4 truncate">
                {stockModalProduct.name}
              </p>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-fv-muted mb-1.5">
                  Current Stock Available
                </label>
                <input
                  type="number"
                  min="0"
                  value={quickStockValue}
                  onChange={(e) => setQuickStockValue(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStockModalProduct(null)}
                  className="flex-1 py-2 bg-fv-surface text-fv-heading rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleQuickStockSave}
                  className="flex-1 py-2 bg-fv-primary hover:bg-fv-primary-dark text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Update Stock
                </button>
              </div>
            </div>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          total={totalProducts}
          onPageChange={setPage}
          itemLabel="products"
        />

        {/* Modal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white  rounded-[12px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 sm:p-6 border-b border-fv-border">
                  <h2 className="text-xl sm:text-2xl font-bold text-fv-heading">
                    {editMode ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-2 hover:bg-fv-surface rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Message */}
                  {message.text && (
                    <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-fv-cream dark:bg-green-900/20 text-fv-primary-dark dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                      {message.text}
                    </div>
                  )}

                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-fv-ink  mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                    />
                  </div>

                  {/* Category & Season */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-fv-ink  mb-2">
                        Category *
                      </label>
                      <select
                        required
                        value={formData.categoryId}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-fv-ink  mb-2">
                        Season
                      </label>
                      <select
                        value={formData.season}
                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                        className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                      >
                        <option value="All Season">All Season</option>
                        <option value="Summer">Summer</option>
                        <option value="Winter">Winter</option>
                        <option value="Monsoon">Monsoon</option>
                        <option value="Spring">Spring</option>
                      </select>
                    </div>
                  </div>

                  {/* Base Price & Original Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-fv-ink  mb-2">
                        Base Price * (₹)
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-fv-ink  mb-2">
                        Original Price (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                      />
                    </div>
                  </div>

                  {/* Selling Mode Toggle */}
                  <div className="border border-fv-border  rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-fv-heading ">Sell by Package / Quantity Variants</p>
                        <p className="text-xs text-fv-muted  mt-0.5">
                          Enable to offer multiple quantity options (e.g. 50 Seeds, 1 Bag, 5 Bags). Disable to sell as a single unit with weight.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hasPackages: !formData.hasPackages })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          formData.hasPackages ? 'bg-fv-primary' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            formData.hasPackages ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Weight — only when NOT using package variants */}
                  {!formData.hasPackages && (
                    <div>
                      <label className="block text-sm font-medium text-fv-ink  mb-2">
                        Weight <span className="text-fv-muted font-normal">(optional)</span>
                      </label>
                      <select
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                      >
                        <option value="">Select Weight</option>
                        {['5g','8g','10g','20g','50g','100g','150g','250g','500g','1kg','2kg','5kg','10kg'].map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Stock — only when NOT using package variants (each package has its own stock) */}
                  {!formData.hasPackages && (
                    <div>
                      <label className="block text-sm font-medium text-fv-ink  mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        required={!formData.hasPackages}
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                      />
                    </div>
                  )}

                  {/* Package Variants — Seed Count & Weight dual support */}
                  {formData.hasPackages && (
                    <div className="border border-green-200 dark:border-green-800 rounded-2xl p-5 bg-[#FBFDFB] dark:bg-green-950/20 shadow-xs">
                      <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                        <div>
                          <h3 className="text-sm font-bold text-fv-heading flex items-center gap-2">
                            <Package className="w-4 h-4 text-fv-primary dark:text-green-400" />
                            <span>Variants (Seed Count or Weight)</span>
                          </h3>
                          <p className="text-xs text-fv-muted mt-0.5">
                            Sell by seed count (e.g. 50 Seeds) or weight (e.g. 25 gm, 100 gm). Customers see interactive pills.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {packages.length} Variants • {packages.reduce((sum, p) => sum + (parseInt(p.stock, 10) || 0), 0)} Total Stock
                          </span>
                          <button
                            type="button"
                            onClick={handleAddPackage}
                            className="flex items-center gap-1.5 bg-fv-primary hover:bg-fv-primary-dark text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Row
                          </button>
                        </div>
                      </div>

                      {/* Quick Presets Toolbar */}
                      <div className="mb-4 p-3 bg-white dark:bg-gray-800/80 rounded-xl border border-fv-border space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-semibold text-fv-heading text-[11px] uppercase tracking-wider mr-1">
                            Seed Count:
                          </span>
                          {['50 Seeds', '100 Seeds', '250 Seeds', '500 Seeds', '1000 Seeds'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleAddPresetPackage(preset)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-colors"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1 border-t border-gray-100 dark:border-gray-700/60">
                          <span className="font-semibold text-fv-heading text-[11px] uppercase tracking-wider mr-1">
                            Weight:
                          </span>
                          {['8 gm', '25 gm', '50 gm', '100 gm', '250 gm', '500 gm', '1 kg'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => handleAddPresetPackage(preset)}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 transition-colors"
                            >
                              + {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Column headers */}
                      <div className="flex gap-3 mb-1.5 px-1">
                        <span className="flex-1 text-xs font-semibold text-fv-muted">Variant Label (Count or Weight)</span>
                        <span className="w-28 text-xs font-semibold text-fv-muted">Price (₹)</span>
                        <span className="w-24 text-xs font-semibold text-fv-muted">Stock (Qty)</span>
                        <span className="w-8"></span>
                      </div>

                      {/* Variant Rows */}
                      <div className="space-y-2.5">
                        {packages.map((pkg, index) => (
                          <div key={index} className="flex gap-2.5 items-center">
                            <input
                              type="text"
                              placeholder="e.g. 50 Seeds or 25 gm"
                              value={pkg.quantity}
                              onChange={(e) => handlePackageChange(index, 'quantity', e.target.value)}
                              className="flex-1 px-3 py-2 text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-800 text-fv-heading focus:ring-2 focus:ring-fv-primary"
                            />
                            <div className="relative w-28">
                              <span className="absolute left-3 top-2 text-xs text-fv-muted">₹</span>
                              <input
                                type="number"
                                placeholder="Price"
                                value={pkg.price}
                                onChange={(e) => handlePackageChange(index, 'price', e.target.value)}
                                className="w-full pl-6 pr-2 py-2 text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-800 text-fv-heading focus:ring-2 focus:ring-fv-primary"
                              />
                            </div>
                            <input
                              type="number"
                              placeholder="Stock"
                              value={pkg.stock}
                              onChange={(e) => handlePackageChange(index, 'stock', e.target.value)}
                              className="w-24 px-3 py-2 text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-800 text-fv-heading focus:ring-2 focus:ring-fv-primary"
                            />
                            {packages.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => handleRemovePackage(index)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                                title="Remove variant"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            ) : <span className="w-8" />}
                          </div>
                        ))}
                      </div>

                      <p className="text-[11px] text-fv-muted mt-3">
                        Tip: Customers will see interactive pills on both the product grid card and the detail page to switch between these variants instantly.
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-fv-ink  mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      rows="4"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-fv-ink  mb-2">
                      Product Images
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 bg-fv-surface  hover:bg-gray-200 dark:hover:bg-gray-600 px-4 py-3 rounded-lg cursor-pointer transition-colors">
                        <Upload className="w-5 h-5" />
                        <span>Upload from Device</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {imagePreview.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {imagePreview.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`Preview ${idx}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      placeholder="Or paste image URLs (comma-separated)"
                      value={formData.images}
                      onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                      className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary mt-2"
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                        className="w-4 h-4 text-fv-primary"
                      />
                      <span className="text-fv-ink ">Featured Product</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.trending}
                        onChange={(e) => setFormData({ ...formData, trending: e.target.checked })}
                        className="w-4 h-4 text-fv-primary"
                      />
                      <span className="text-fv-ink ">Trending Product</span>
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-3 p-4 sm:p-6 border-t border-fv-border">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full sm:w-auto px-6 py-2.5 sm:py-3 border border-fv-border text-fv-ink rounded-xl hover:bg-fv-surface text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-fv-primary hover:bg-fv-primary-dark text-white rounded-xl text-sm font-semibold shadow-xs transition-all"
                  >
                    {editMode ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enterprise Delete Confirmation Modal */}
        <AdminConfirmModal
          isOpen={Boolean(productToDelete)}
          title="Delete Product from Catalog?"
          message={
            productToDelete ? (
              <div className="space-y-2">
                <p>
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-fv-heading dark:text-white">"{productToDelete.name}"</strong>?
                </p>
                <p className="text-xs text-fv-muted">
                  ⚠️ This removes the product and associated customer reviews from the catalog. If this product is part of any active combos, deletion will safely be prevented until removed from those combo kits.
                </p>
              </div>
            ) : null
          }
          confirmText="Yes, Delete Product"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleConfirmDeleteProduct}
          onClose={() => setProductToDelete(null)}
        />
      </div>
    </div>
  );
};

export default AdminProducts;
