import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Edit, Trash2, Plus, X, Package, Upload, MoreVertical, Search, Boxes } from 'lucide-react';
import api from '../../utils/api';

const AdminProducts = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [quickStockValue, setQuickStockValue] = useState('');
  const [products, setProducts] = useState([]);
  // Real pagination. This screen used to request `?limit=100`, but the API caps
  // page size at 50 — so an admin with more than 50 products simply could not
  // see or edit the rest, with nothing on screen indicating they existed.
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


  // Refetch whenever the page, search, or URL filter changes
  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchQuery, searchParams]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Check if redirected from product card edit
    if (location.state?.editProduct) {
      handleOpen(location.state.editProduct);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const fetchProducts = async () => {
    try {
      const params = { page, limit: 24 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (searchParams.get('lowstock') === 'true') params.lowstock = 'true';
      if (searchParams.get('outofstock') === 'true') params.outofstock = 'true';

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
    setPackages([...packages, { quantity: '', price: '', stock: '' }]);
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
        alert('Product deleted successfully!');
      } catch (error) {
        alert('Failed to delete product');
      }
    }
  };

  return (
    <div className="min-h-screen bg-fv-page py-6 md:py-8 pb-28 md:pb-8">
      <div className="container mx-auto px-3 sm:px-4">
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

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-fv-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-800 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading"
              />
            </div>
            <button
              onClick={() => handleOpen()}
              className="flex items-center gap-1.5 bg-fv-primary hover:bg-fv-primary-dark text-white px-4 py-2 rounded-xl text-xs md:text-sm font-semibold shadow-xs transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Products Grid */}
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
                    {product.packages && product.packages.length > 0 && (
                      <div className="mb-2">
                        <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-medium">
                          {product.packages.length} Variants
                        </span>
                      </div>
                    )}
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
                            handleDelete(product._id);
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

                  {/* Package Variants — any product type */}
                  {formData.hasPackages && (
                    <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-fv-cream dark:bg-green-900/20">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-base font-semibold text-fv-heading  flex items-center gap-2">
                          <Package className="w-5 h-5 text-fv-primary dark:text-green-400" />
                          Package / Quantity Variants
                        </h3>
                        <button
                          type="button"
                          onClick={handleAddPackage}
                          className="flex items-center gap-2 bg-fv-primary hover:bg-fv-primary-dark text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Variant
                        </button>
                      </div>
                      <p className="text-xs text-fv-primary-dark dark:text-green-400 mb-3">
                        Each row is one option shown in the dropdown on the product page. Label it anything — e.g. &quot;50 Seeds&quot;, &quot;1 Bag&quot;, &quot;5 Bags&quot;, &quot;Small Box&quot;.
                      </p>
                      {/* Column headers */}
                      <div className="flex gap-3 mb-1 px-1">
                        <span className="flex-1 text-xs font-medium text-fv-muted ">Label (shown to customer)</span>
                        <span className="w-24 text-xs font-medium text-fv-muted ">Price (₹)</span>
                        <span className="w-20 text-xs font-medium text-fv-muted ">Stock</span>
                        <span className="w-8"></span>
                      </div>
                      <div className="space-y-3">
                        {packages.map((pkg, index) => (
                          <div key={index} className="flex gap-3 items-center">
                            <input
                              type="text"
                              placeholder="e.g. 50 Seeds / 1 Bag / Small Box"
                              value={pkg.quantity}
                              onChange={(e) => handlePackageChange(index, 'quantity', e.target.value)}
                              className="flex-1 px-3 py-2 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                            />
                            <input
                              type="number"
                              placeholder="Price"
                              value={pkg.price}
                              onChange={(e) => handlePackageChange(index, 'price', e.target.value)}
                              className="w-24 px-3 py-2 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                            />
                            <input
                              type="number"
                              placeholder="Stock"
                              value={pkg.stock}
                              onChange={(e) => handlePackageChange(index, 'stock', e.target.value)}
                              className="w-20 px-3 py-2 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                            />
                            {packages.length > 1 ? (
                              <button
                                type="button"
                                onClick={() => handleRemovePackage(index)}
                                className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            ) : <span className="w-8" />}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-fv-muted dark:text-fv-muted mt-3">
                        * Base Price above is used as fallback. Each variant overrides it.
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
      </div>
    </div>
  );
};

export default AdminProducts;
