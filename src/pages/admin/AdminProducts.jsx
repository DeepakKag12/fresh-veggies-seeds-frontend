import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, X, Package, MoreVertical, Search, Boxes, Filter, AlertTriangle, Download, LayoutGrid, List, Sparkles, ArrowLeft, FileSpreadsheet } from 'lucide-react';
import api from '../../utils/api';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import { exportProductsToCsv } from '../../utils/adminCsvExport';
import { ProductCsvModal } from '../../components/admin/ProductCsvModal';
import {
  calculateProportionalTier,
  generateStandardTiers,
  extractQuantityCount,
} from '../../utils/pricing-engine';
import DualMediaPicker from '../../components/admin/DualMediaPicker';
import { getProductImageUrl, handleImageError } from '../../utils/imageFallback';

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
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
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
  const [packages, setPackages] = useState([
    { quantity: '50 Seeds', price: '', originalPrice: '', stock: '50', isCustomPrice: false }
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
    hasPackages: false,   // toggle: sell by package variants (quantity-based)
    isAutoPricing: false, // toggle: automatic count-based MRP calculation
    baseQuantity: '50',   // base quantity e.g. 50 seeds
    baseMrp: '',          // base MRP e.g. ₹100
    baseUnit: 'Seeds'     // base unit label
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
    } else if (searchParams.get('new') === 'true' || searchParams.get('action') === 'new') {
      handleOpen();
      // clean param from URL so refresh doesn't reopen modal
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('new');
      newParams.delete('action');
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

  const toggleSelectProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p._id));
    }
  };

  const handleBatchStatus = async (isActive) => {
    if (selectedProductIds.length === 0) return;
    setIsBatchProcessing(true);
    try {
      await Promise.all(
        selectedProductIds.map((id) => api.put(`/products/${id}`, { isActive }))
      );
      toast.success(`${selectedProductIds.length} product(s) marked as ${isActive ? 'Active' : 'Inactive'}!`);
      setSelectedProductIds([]);
      fetchProducts();
    } catch {
      toast.error('Failed to update status for selected products');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedProductIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProductIds.length} product(s)? They will be moved to Delete History.`)) return;
    setIsBatchProcessing(true);
    try {
      await Promise.all(
        selectedProductIds.map((id) => api.delete(`/products/${id}?reason=Batch administrative deletion`))
      );
      toast.success(`${selectedProductIds.length} product(s) moved to Delete History!`);
      setSelectedProductIds([]);
      fetchProducts();
    } catch {
      toast.error('Failed to delete selected products');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchExport = () => {
    const selectedList = products.filter((p) => selectedProductIds.includes(p._id));
    exportProductsToCsv(selectedList, 'selected_products');
    toast.success(`Exported ${selectedList.length} selected product(s) to CSV!`);
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const extractCount = extractQuantityCount;

  const computeAutoPrices = (currentPackages, autoActive, bQty, bMrp, currentPrice) => {
    if (!autoActive) return currentPackages;
    const baseQ = parseFloat(bQty);
    const baseM = parseFloat(bMrp);
    if (!baseQ || baseQ <= 0 || !baseM || baseM <= 0) return currentPackages;

    const baseSelling = parseFloat(currentPrice) || Math.round(baseM * 0.75);

    return currentPackages.map((pkg) => {
      if (pkg.isCustomPrice) return pkg;
      const count = extractQuantityCount(pkg.quantity);
      if (count <= 0) return pkg;

      // Use Centralized Pricing Engine with progressive volume discount curve (FEAT-006)
      const tier = calculateProportionalTier({
        count,
        baseQuantity: baseQ,
        baseMrp: baseM,
        basePrice: baseSelling,
        applyVolumeDiscount: true,
      });

      return {
        ...pkg,
        originalPrice: tier.originalPrice.toString(),
        price: pkg.isCustomPrice && pkg.price ? pkg.price : tier.price.toString(),
        volumeDiscountPct: tier.volumeDiscountPct,
      };
    });
  };

  const handleGenerateStandardTiers = (type = 'weight') => {
    const bMrp = parseFloat(formData.baseMrp || formData.originalPrice || formData.price || '100');
    const bQty = parseFloat(formData.baseQuantity || (type === 'weight' ? '100' : '50'));
    const bPrice = parseFloat(formData.price || Math.round(bMrp * 0.75));

    const tiers = generateStandardTiers({
      baseQuantity: bQty,
      baseMrp: bMrp,
      basePrice: bPrice,
      type,
    });

    setPackages(tiers);
    setFormData((prev) => ({
      ...prev,
      hasPackages: true,
      isAutoPricing: true,
      baseQuantity: bQty.toString(),
      baseMrp: bMrp.toString(),
      baseUnit: type === 'weight' ? 'Grams' : 'Seeds',
    }));
    toast.success(`Generated ${tiers.length} ${type} volume tiers with volume discount curves!`);
  };

  const handleToggleAutoPricing = (enabled) => {
    const bMrp = formData.baseMrp || formData.originalPrice || formData.price || '100';
    const bQty = formData.baseQuantity || '50';
    const updatedForm = {
      ...formData,
      isAutoPricing: enabled,
      baseMrp: bMrp,
      baseQuantity: bQty
    };
    setFormData(updatedForm);
    if (enabled) {
      setPackages(computeAutoPrices(packages, true, bQty, bMrp, formData.price));
    }
  };

  const handleBasePricingChange = (field, value) => {
    const updatedForm = { ...formData, [field]: value };
    setFormData(updatedForm);
    if (updatedForm.isAutoPricing) {
      setPackages(computeAutoPrices(packages, true, updatedForm.baseQuantity, updatedForm.baseMrp, updatedForm.price));
    }
  };

  const handleOpen = (product = null) => {
    if (product) {
      setEditMode(true);
      setCurrentProduct(product);
      const hasPkgs = Array.isArray(product.packages) && product.packages.length > 0;
      const isAuto = Boolean(product.isAutoPricing);
      const bQty = product.baseQuantity != null ? product.baseQuantity.toString() : '50';
      const bMrpVal = product.baseMrp != null ? product.baseMrp.toString() : (product.originalPrice || product.price || '').toString();

      setFormData({
        name: product.name || '',
        categoryId: product.categoryId?._id || product.categoryId || '',
        price: product.price ?? '',
        originalPrice: product.originalPrice || '',
        weight: product.weight || '',
        stock: product.stock ?? '',
        description: product.description || '',
        season: product.season || 'All Season',
        images: Array.isArray(product.images) ? product.images.join(', ') : (product.images || ''),
        featured: Boolean(product.featured),
        trending: Boolean(product.trending),
        hasPackages: hasPkgs,
        isAutoPricing: isAuto,
        baseQuantity: bQty,
        baseMrp: bMrpVal,
        baseUnit: product.baseUnit || 'Seeds'
      });
      // Load packages if exists
      if (hasPkgs) {
        setPackages(product.packages.map(p => ({
          quantity: p.quantity || '',
          price: p.price != null ? p.price.toString() : '',
          originalPrice: p.originalPrice ? p.originalPrice.toString() : '',
          stock: p.stock != null ? p.stock.toString() : '50',
          isCustomPrice: Boolean(p.isCustomPrice)
        })));
      } else {
        setPackages([{ quantity: '', price: '', originalPrice: '', stock: '50', isCustomPrice: false }]);
      }
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
        hasPackages: false,
        isAutoPricing: false,
        baseQuantity: '50',
        baseMrp: '',
        baseUnit: 'Seeds'
      });
      setPackages([{ quantity: '50 Seeds', price: '', originalPrice: '', stock: '50', isCustomPrice: false }]);
      setImageFiles([]);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setMessage({ type: '', text: '' });
    setImageFiles([]);
  };

  const handleAddPackage = () => {
    let autoOriginal = '';
    let autoPrice = formData.price || '';
    setPackages([...packages, { quantity: '', price: autoPrice, originalPrice: autoOriginal, stock: '50', isCustomPrice: false }]);
  };

  const handleAddPresetPackage = (labelPreset) => {
    const count = extractCount(labelPreset);
    let autoOriginal = '';
    let autoPrice = formData.price || '';
    if (formData.isAutoPricing) {
      const bQty = parseFloat(formData.baseQuantity);
      const bMrp = parseFloat(formData.baseMrp);
      if (count > 0 && bQty > 0 && bMrp > 0) {
        autoOriginal = Math.round((bMrp * count) / bQty).toString();
        const baseSelling = parseFloat(formData.price) || bMrp;
        autoPrice = Math.round((baseSelling * count) / bQty).toString();
      }
    }
    const last = packages[packages.length - 1];
    if (last && !last.quantity && !last.price) {
      const updated = [...packages];
      updated[packages.length - 1] = {
        ...last,
        quantity: labelPreset,
        originalPrice: autoOriginal || last.originalPrice || '',
        price: autoPrice || last.price || '',
        stock: last.stock || '50',
        isCustomPrice: false
      };
      setPackages(updated);
    } else {
      setPackages([
        ...packages,
        { quantity: labelPreset, originalPrice: autoOriginal, price: autoPrice, stock: '50', isCustomPrice: false }
      ]);
    }
  };

  const handleRemovePackage = (index) => {
    setPackages(packages.filter((_, i) => i !== index));
  };

  const handlePackageChange = (index, field, value) => {
    const newPackages = [...packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    if (field === 'price' || field === 'originalPrice') {
      newPackages[index].isCustomPrice = true;
    }
    if (field === 'quantity' && formData.isAutoPricing && !newPackages[index].isCustomPrice) {
      const count = extractCount(value);
      const bQty = parseFloat(formData.baseQuantity);
      const bMrp = parseFloat(formData.baseMrp);
      if (count > 0 && bQty > 0 && bMrp > 0) {
        newPackages[index].originalPrice = Math.round((bMrp * count) / bQty).toString();
        const baseSelling = parseFloat(formData.price) || bMrp;
        newPackages[index].price = Math.round((baseSelling * count) / bQty).toString();
      }
    }
    setPackages(newPackages);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      let imageUrls = formData.images.split(',').map((url) => url.trim()).filter(url => url);
      
      // Upload new images if selected (FEAT-018 multi-image Cloudinary streaming)
      if (imageFiles.length > 0) {
        try {
          const uploadForm = new FormData();
          imageFiles.forEach((file) => uploadForm.append('images', file));
          const response = await api.post('/upload/multiple', uploadForm, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          const uploadedUrls = (response.data?.data || []).map((item) => item.url);
          imageUrls = [...imageUrls, ...uploadedUrls];
        } catch {
          // Fallback to single upload loop if /upload/multiple fails
          const uploadPromises = imageFiles.map(async (file) => {
            const singleForm = new FormData();
            singleForm.append('image', file);
            const response = await api.post('/upload', singleForm, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data.data.url;
          });
          const uploadedUrls = await Promise.all(uploadPromises);
          imageUrls = [...imageUrls, ...uploadedUrls];
        }
      }

      // Filter valid packages (allowing 0 stock for sold-out variants)
      const validPackages = packages
        .filter(p => p.quantity?.trim() && p.price !== '' && !isNaN(p.price) && p.stock !== '' && !isNaN(p.stock))
        .map(p => ({
          quantity: p.quantity.trim(),
          price: parseFloat(p.price),
          originalPrice: p.originalPrice ? parseFloat(p.originalPrice) : undefined,
          isCustomPrice: Boolean(p.isCustomPrice),
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
        isAutoPricing: Boolean(formData.isAutoPricing),
        baseQuantity: formData.isAutoPricing ? (parseInt(formData.baseQuantity, 10) || 50) : undefined,
        baseMrp: formData.isAutoPricing && formData.baseMrp ? parseFloat(formData.baseMrp) : undefined,
        baseUnit: formData.baseUnit || 'Seeds',
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

            {/* CSV Pipeline (Import/Export) */}
            <button
              type="button"
              onClick={() => setCsvModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold min-h-[42px] transition-colors shrink-0 shadow-2xs"
              title="Bulk CSV Import/Export Pipeline"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">CSV Pipeline</span>
            </button>

            {/* Quick Export CSV */}
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
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={products.length > 0 && selectedProductIds.length === products.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Select All"
                      />
                    </th>
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
                      <td colSpan="7" className="py-12 text-center text-xs text-fv-muted">
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
                      const isSelected = selectedProductIds.includes(product._id);

                      return (
                        <tr key={product._id} className={`hover:bg-fv-surface/40 transition-colors text-xs ${isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProduct(product._id)}
                              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={getProductImageUrl(product)}
                                alt={product.name}
                                onError={(e) => handleImageError(e, getProductImageUrl(product))}
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
                      src={getProductImageUrl(product)}
                      alt={product.name}
                      onError={(e) => handleImageError(e, getProductImageUrl(product))}
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

                      {/* Auto-Proportional Count-Based Pricing Configuration Panel */}
                      <div className="mb-4 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div>
                            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Automatic Proportional Count-Based Pricing</span>
                            </span>
                            <p className="text-[11px] text-fv-muted mt-0.5">
                              Formula: <code className="bg-white/90 dark:bg-gray-800 px-1 py-0.5 rounded text-[10.5px] font-mono font-bold text-emerald-800 dark:text-emerald-300">Calculated MRP = Base MRP × (Selected Variant Quantity ÷ Base Quantity)</code>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleAutoPricing(!formData.isAutoPricing)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${
                              formData.isAutoPricing ? 'bg-fv-primary' : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                formData.isAutoPricing ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        {formData.isAutoPricing && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 mt-2 border-t border-emerald-200/70 dark:border-emerald-800/70">
                            <div>
                              <label className="block text-xs font-bold text-fv-heading mb-1">
                                Base Quantity *
                              </label>
                              <input
                                type="number"
                                min="1"
                                placeholder="e.g. 50"
                                value={formData.baseQuantity}
                                onChange={(e) => handleBasePricingChange('baseQuantity', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-fv-border rounded-xl bg-white dark:bg-gray-800 text-fv-heading focus:ring-2 focus:ring-fv-primary font-semibold"
                              />
                              <span className="text-[10px] text-fv-muted">Configurable base (e.g. 50)</span>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-fv-heading mb-1">
                                Base MRP (₹) *
                              </label>
                              <input
                                type="number"
                                min="0"
                                placeholder="e.g. 100"
                                value={formData.baseMrp}
                                onChange={(e) => handleBasePricingChange('baseMrp', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-fv-border rounded-xl bg-white dark:bg-gray-800 text-fv-heading focus:ring-2 focus:ring-fv-primary font-semibold"
                              />
                              <span className="text-[10px] text-fv-muted">MRP of the base quantity</span>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-fv-heading mb-1">
                                Unit Name
                              </label>
                              <input
                                type="text"
                                placeholder="Seeds"
                                value={formData.baseUnit}
                                onChange={(e) => handleBasePricingChange('baseUnit', e.target.value)}
                                className="w-full px-3 py-2 text-xs border border-fv-border rounded-xl bg-white dark:bg-gray-800 text-fv-heading focus:ring-2 focus:ring-fv-primary"
                              />
                              <span className="text-[10px] text-fv-muted">e.g. Seeds, Bulbs, Tubers</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quick Presets Toolbar */}
                      <div className="mb-4 p-3 bg-white dark:bg-gray-800/80 rounded-xl border border-fv-border space-y-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="font-semibold text-fv-heading text-[11px] uppercase tracking-wider mr-1">
                            Seed Count:
                          </span>
                          {['50 Seeds', '100 Seeds', '150 Seeds', '200 Seeds', '250 Seeds', '500 Seeds'].map((preset) => (
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

                        {/* 1-Click Costco / Bulk Volume Tier Generator (FEAT-006) */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700/60">
                          <span className="font-semibold text-fv-heading text-[11px] uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Costco Tier Generator:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleGenerateStandardTiers('weight')}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs hover:from-amber-600 hover:to-amber-700 transition-all cursor-pointer"
                          >
                            Weight Packs (100g, 250g, 500g, 1kg)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGenerateStandardTiers('seeds')}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer"
                          >
                            Seed Packs (50, 100, 250, 500 Seeds)
                          </button>
                        </div>
                      </div>

                      {/* Column headers */}
                      <div className="flex gap-2.5 mb-1.5 px-1 items-center text-xs font-semibold text-fv-muted">
                        <span className="flex-1">Variant Label (Count / Weight)</span>
                        {formData.isAutoPricing && (
                          <span className="w-28 text-center">Calculated MRP (₹)</span>
                        )}
                        <span className="w-28">Selling Price (₹)</span>
                        <span className="w-24">Stock (Qty)</span>
                        <span className="w-8"></span>
                      </div>

                      {/* Variant Rows */}
                      <div className="space-y-2.5">
                        {packages.map((pkg, index) => {
                          const count = extractQuantityCount(pkg.quantity);
                          const bQty = parseFloat(formData.baseQuantity) || 50;
                          const bMrp = parseFloat(formData.baseMrp) || 0;
                          const formulaDisplay = formData.isAutoPricing && count > 0 && bMrp > 0
                            ? `₹${bMrp} × ${count}/${bQty} = ₹${pkg.originalPrice || Math.round((bMrp * count) / bQty)}`
                            : null;

                          return (
                            <div key={index} className="flex flex-col gap-1.5 p-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-800/60">
                              <div className="flex gap-2.5 items-center">
                                <div className="flex-1 min-w-0">
                                  <input
                                    type="text"
                                    placeholder="e.g. 50 Seeds or 25 gm"
                                    value={pkg.quantity}
                                    onChange={(e) => handlePackageChange(index, 'quantity', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-800 text-fv-heading focus:ring-2 focus:ring-fv-primary font-medium"
                                  />
                                </div>

                                {formData.isAutoPricing && (
                                  <div className="relative w-28">
                                    <span className="absolute left-2.5 top-2 text-xs text-fv-muted">₹</span>
                                    <input
                                      type="number"
                                      placeholder="MRP"
                                      value={pkg.originalPrice}
                                      onChange={(e) => handlePackageChange(index, 'originalPrice', e.target.value)}
                                      className="w-full pl-6 pr-2 py-2 text-sm border border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl text-emerald-900 dark:text-emerald-200 font-bold focus:ring-2 focus:ring-fv-primary"
                                      title={pkg.isCustomPrice ? "Custom MRP override" : "Automatically calculated MRP"}
                                    />
                                  </div>
                                )}

                                <div className="relative w-28">
                                  <span className="absolute left-2.5 top-2 text-xs text-fv-muted">₹</span>
                                  <input
                                    type="number"
                                    placeholder="Price"
                                    value={pkg.price}
                                    onChange={(e) => handlePackageChange(index, 'price', e.target.value)}
                                    className="w-full pl-6 pr-2 py-2 text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-800 text-fv-heading focus:ring-2 focus:ring-fv-primary font-semibold"
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
                                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors shrink-0"
                                    title="Remove variant"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                ) : <span className="w-8 shrink-0" />}
                              </div>

                              {formulaDisplay && (
                                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] px-1 text-fv-muted">
                                  <span className="font-mono text-emerald-700 dark:text-emerald-400">
                                    Formula: {formulaDisplay}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    {pkg.volumeDiscountPct > 0 && !pkg.isCustomPrice && (
                                      <span className="text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded text-[10px]">
                                        Costco {pkg.volumeDiscountPct}% Bulk Discount
                                      </span>
                                    )}
                                    {pkg.isCustomPrice && (
                                      <span className="text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded text-[10px]">
                                        Custom Price Override
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <p className="text-[11px] text-fv-muted mt-3">
                        Tip: Proportional pricing automatically calculates each variant's MRP. Customers see these real-time price updates on product pages and carts.
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

                  {/* Dual Mode Media Picker (Shopify-grade media management) */}
                  <DualMediaPicker
                    label="Product Images & Gallery"
                    multiple={true}
                    aspectRatioHint="1:1 square recommended"
                    value={
                      formData.images
                        ? formData.images.split(',').map((u) => u.trim()).filter(Boolean)
                        : []
                    }
                    onChange={(newUrls) => {
                      const joined = Array.isArray(newUrls) ? newUrls.join(', ') : newUrls;
                      setFormData((prev) => ({ ...prev, images: joined }));
                    }}
                    uploadEndpoint="/upload"
                    helperText="Upload JPG, PNG, WebP up to 10MB or paste direct image links. First image is primary."
                  />

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

        {/* Sticky Batch Actions Toolbar */}
        {selectedProductIds.length > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl px-5 py-3 shadow-2xl flex flex-wrap items-center gap-3 sm:gap-4 border border-gray-700 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <span className="text-xs font-bold text-emerald-400">
              {selectedProductIds.length} product(s) selected
            </span>
            <div className="h-4 w-px bg-gray-700 hidden sm:block" />
            <button
              type="button"
              onClick={() => handleBatchStatus(true)}
              disabled={isBatchProcessing}
              className="text-xs font-semibold hover:text-emerald-400 transition-colors"
            >
              Activate
            </button>
            <button
              type="button"
              onClick={() => handleBatchStatus(false)}
              disabled={isBatchProcessing}
              className="text-xs font-semibold hover:text-amber-400 transition-colors"
            >
              Deactivate
            </button>
            <button
              type="button"
              onClick={handleBatchExport}
              className="text-xs font-semibold hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              disabled={isBatchProcessing}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
            <div className="h-4 w-px bg-gray-700 hidden sm:block" />
            <button
              type="button"
              onClick={() => setSelectedProductIds([])}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* CSV Import/Export Pipeline Modal */}
        <ProductCsvModal
          isOpen={csvModalOpen}
          onClose={() => setCsvModalOpen(false)}
          onImportSuccess={() => {
            fetchProducts();
            setCsvModalOpen(false);
          }}
        />
      </div>
    </div>
  );
};

export default AdminProducts;
