import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Edit,
  Trash2,
  Plus,
  X,
  ShoppingBag,
  ArrowLeft,
  Search,
  Check,
  AlertTriangle,
  Zap,
  TrendingUp
} from 'lucide-react';
import api, { fetchAllPages } from '../../utils/api';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import DualMediaPicker from '../../components/admin/DualMediaPicker';
import {
  getProductImageUrl,
  handleImageError,
  DEFAULT_COMBO_IMAGE,
  DEFAULT_PRODUCT_IMAGE,
} from '../../utils/imageFallback';

const AdminCombos = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCombo, setCurrentCombo] = useState(null);
  const [comboToDelete, setComboToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    discount: '',
    comboType: 'Custom',
    stock: '',
    images: '',
  });

  useEffect(() => {
    fetchCombos();
    fetchProducts();
    fetchCategories();
    if (searchParams.get('action') === 'new') {
      handleOpen();
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCombos = async () => {
    try {
      const response = await api.get('/combos?all=true');
      setCombos(response.data.data || []);
    } catch (error) {
      console.error('Error fetching combos:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const allProducts = await fetchAllPages('/products?all=true');
      setProducts(allProducts || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories?all=true');
      setCategories(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fast map to resolve product metadata even if combo only saved string productIds
  const productMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (p?._id) map.set(p._id.toString(), p);
    });
    return map;
  }, [products]);

  // Robust ID extractor handling populated object, raw ObjectId, or plain string
  const getProductId = (item) => {
    if (!item) return '';
    const raw = item.productId?._id || item.productId || item._id || item.id;
    return raw ? raw.toString() : '';
  };

  // Robust metadata resolver for combo item
  const resolveProductInfo = useCallback((item) => {
    const id = getProductId(item);
    const fromCatalog = productMap.get(id);
    const populated = (typeof item.productId === 'object' && item.productId) ? item.productId : null;
    return {
      id,
      name: populated?.name || fromCatalog?.name || 'Product item',
      price: populated?.price ?? fromCatalog?.price ?? 0,
      stock: populated?.stock ?? fromCatalog?.stock ?? 0,
      image: populated?.images?.[0] || fromCatalog?.images?.[0] || DEFAULT_PRODUCT_IMAGE,
      category: populated?.categoryId?.name || fromCatalog?.categoryId?.name || '',
    };
  }, [productMap]);

  // Auto-calculated cumulative MRP: sum of (item.price * item.quantity)
  const computedOriginalPrice = useMemo(() => {
    return selectedProducts.reduce((sum, item) => {
      const info = resolveProductInfo(item);
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      return sum + (Number(info.price) || 0) * qty;
    }, 0);
  }, [selectedProducts, resolveProductInfo]);

  // Dynamic stock controller: maximum sets available based on child product availability
  const dynamicStock = useMemo(() => {
    if (selectedProducts.length === 0) return 0;
    const maxSets = selectedProducts.map((item) => {
      const info = resolveProductInfo(item);
      const availableStock = typeof info.stock === 'number' ? info.stock : 0;
      const qty = Math.max(1, parseInt(item.quantity) || 1);
      return Math.floor(availableStock / qty);
    });
    return Math.max(0, Math.min(...maxSets));
  }, [selectedProducts, resolveProductInfo]);

  // Live economics calculation
  const effectiveOriginalPrice = Number(formData.originalPrice) || computedOriginalPrice;
  const sellingPrice = Number(formData.price) || 0;
  const savingsAmount = Math.max(0, effectiveOriginalPrice - sellingPrice);
  const discountPercentage = effectiveOriginalPrice > 0 ? Math.round((savingsAmount / effectiveOriginalPrice) * 100) : 0;
  const isPriceInverted = sellingPrice > effectiveOriginalPrice && effectiveOriginalPrice > 0;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const nameMatch = !productSearch ||
        product.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
        product.description?.toLowerCase().includes(productSearch.toLowerCase());

      const catId = (product.categoryId?._id || product.categoryId)?.toString();
      const categoryMatch = selectedCategoryFilter === 'all' || catId === selectedCategoryFilter;

      return nameMatch && categoryMatch;
    });
  }, [products, productSearch, selectedCategoryFilter]);

  const handleOpen = (combo = null) => {
    if (combo) {
      setEditMode(true);
      setCurrentCombo(combo);
      setFormData({
        name: combo.name || '',
        description: combo.description || '',
        price: combo.price || '',
        originalPrice: combo.originalPrice || '',
        discount: combo.discount || '',
        comboType: combo.comboType || 'Custom',
        stock: combo.stock ?? '',
        images: Array.isArray(combo.images) ? combo.images.join(', ') : '',
      });
      setSelectedProducts(Array.isArray(combo.includedProducts) ? [...combo.includedProducts] : []);
    } else {
      setEditMode(false);
      setCurrentCombo(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        discount: '',
        comboType: 'Custom',
        stock: '',
        images: '',
      });
      setSelectedProducts([]);
      setImageFiles([]);
    }
    setProductSearch('');
    setSelectedCategoryFilter('all');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setMessage({ type: '', text: '' });
    setImageFiles([]);
    setShowProductSelector(false);
    setProductSearch('');
    setSelectedCategoryFilter('all');
  };

  const handleProductSelect = (product) => {
    const prodId = product._id.toString();
    const exists = selectedProducts.some((p) => getProductId(p) === prodId);
    if (!exists) {
      setSelectedProducts((prev) => [
        ...prev,
        {
          productId: product,
          quantity: 1,
        },
      ]);
    }
  };

  const handleRemoveProduct = (targetId) => {
    const idStr = targetId.toString();
    setSelectedProducts((prev) => prev.filter((p) => getProductId(p) !== idStr));
  };

  const handleToggleProduct = (product) => {
    const prodId = product._id.toString();
    const exists = selectedProducts.some((p) => getProductId(p) === prodId);
    if (exists) {
      handleRemoveProduct(prodId);
    } else {
      handleProductSelect(product);
    }
  };

  const handleProductQuantityChange = (targetId, quantity) => {
    const idStr = targetId.toString();
    const qty = Math.max(1, parseInt(quantity) || 1);
    setSelectedProducts((prev) =>
      prev.map((p) => (getProductId(p) === idStr ? { ...p, quantity: qty } : p))
    );
  };

  const handleDismissReview = async (combo) => {
    try {
      await api.put(`/combos/${combo._id}/dismiss-review`);
      setCombos((prev) =>
        prev.map((c) => (c._id === combo._id ? { ...c, needsReview: false, reviewReason: '' } : c))
      );
      toast.success(`Review flag cleared for "${combo.name}"`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to dismiss review alert');
    }
  };

  const handleSyncStockToComponent = () => {
    setFormData((prev) => ({
      ...prev,
      stock: dynamicStock,
    }));
    toast.success(`Combo stock synced to component maximum: ${dynamicStock}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const trimmedName = formData.name?.trim();
    if (!trimmedName) {
      const err = 'Combo name is required.';
      setMessage({ type: 'error', text: err });
      toast.error(err);
      return;
    }

    if (selectedProducts.length < 2) {
      const err = 'A combo pack must contain at least 2 distinct products.';
      setMessage({ type: 'error', text: err });
      toast.error(err);
      return;
    }

    setIsSaving(true);
    try {
      let imageUrls = [];

      // Keep existing URL-based images if editing
      if (formData.images) {
        imageUrls = formData.images
          .split(',')
          .map((url) => url.trim())
          .filter((url) => url);
      }

      // Upload new images if selected
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const formDataUpload = new FormData();
          formDataUpload.append('image', file);
          const response = await api.post('/upload', formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return response.data.data.url;
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      const finalOriginalPrice = formData.originalPrice ? parseFloat(formData.originalPrice) : computedOriginalPrice;
      const finalPrice = parseFloat(formData.price);
      const finalDiscount = finalOriginalPrice > 0 ? Math.max(0, Math.round(((finalOriginalPrice - finalPrice) / finalOriginalPrice) * 100)) : 0;

      const comboData = {
        name: trimmedName,
        description: formData.description,
        price: finalPrice,
        originalPrice: finalOriginalPrice,
        discount: finalDiscount,
        comboType: formData.comboType,
        stock: formData.stock !== '' ? parseInt(formData.stock) : dynamicStock,
        dynamicStock: dynamicStock,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        includedProducts: selectedProducts.map((p) => ({
          productId: getProductId(p),
          quantity: Math.max(1, parseInt(p.quantity) || 1),
        })),
        clearReview: true,
      };

      if (editMode) {
        await api.put(`/combos/${currentCombo._id}`, comboData);
        const successMsg = 'Combo updated successfully!';
        setMessage({ type: 'success', text: successMsg });
        toast.success(successMsg);
      } else {
        await api.post('/combos', comboData);
        const successMsg = 'Combo created successfully!';
        setMessage({ type: 'success', text: successMsg });
        toast.success(successMsg);
      }

      await fetchCombos();
      setTimeout(() => handleClose(), 1000);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Failed to save combo';
      setMessage({
        type: 'error',
        text: errMsg,
      });
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteCombo = async () => {
    if (!comboToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/combos/${comboToDelete._id}`);
      fetchCombos();
      toast.success(`Combo "${comboToDelete.name}" deleted successfully!`);
      setComboToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete combo');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-fv-page py-8">
      <div className="container mx-auto px-4 space-y-4">
        {/* Navigation Breadcrumb & Back Action */}
        <div className="flex items-center gap-2 text-xs font-medium text-fv-muted">
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
          <span className="text-fv-heading dark:text-white font-semibold">Combos & Kits</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-fv-heading dark:text-white flex items-center gap-2">
              Combo Pack Assembler
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary font-bold">
                {combos.length} bundles
              </span>
            </h1>
            <p className="text-xs text-fv-muted mt-1">
              Shopify Bundler & WooCommerce composite builder with dynamic component inventory syncing
            </p>
          </div>
          <button
            onClick={() => handleOpen()}
            className="flex items-center gap-2 bg-fv-primary hover:bg-fv-primary-dark text-white px-5 py-2.5 rounded-xl font-semibold shadow-xs active:scale-95 transition-all min-h-[44px]"
          >
            <Plus className="w-5 h-5" />
            Assemble Combo
          </button>
        </div>

        {/* Combos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {combos.map((combo) => (
            <div
              key={combo._id}
              className={`bg-white dark:bg-gray-800 rounded-2xl border overflow-hidden transition-all flex flex-col justify-between ${
                combo.needsReview
                  ? 'border-amber-400 dark:border-amber-600 shadow-md ring-1 ring-amber-400/30'
                  : 'border-fv-border hover:shadow-lg'
              }`}
            >
              <div>
                {/* Thumbnail */}
                <div className="relative">
                  <img
                    src={combo.images?.[0] || DEFAULT_COMBO_IMAGE}
                    alt={combo.name}
                    className="w-full h-44 object-cover bg-gray-50 dark:bg-gray-700"
                    onError={(e) => {
                      handleImageError(e, DEFAULT_COMBO_IMAGE);
                    }}
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
                    {combo.comboType}
                  </span>
                </div>

                {/* Review Alert Banner */}
                {combo.needsReview && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex items-start gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <span className="text-[11px] leading-tight">Review Required:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDismissReview(combo)}
                        className="text-[10px] font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
                      >
                        Dismiss
                      </button>
                    </div>
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80 line-clamp-2">
                      {combo.reviewReason || 'Constituent product price changed or item deleted.'}
                    </p>
                  </div>
                )}

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-fv-heading dark:text-white line-clamp-1">
                      {combo.name}
                    </h3>
                    <p className="text-xs text-fv-muted mt-0.5 line-clamp-2">
                      {combo.description}
                    </p>
                  </div>

                  {/* Pricing and Margin */}
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-fv-primary dark:text-emerald-400">
                      ₹{combo.price}
                    </span>
                    {combo.originalPrice && combo.originalPrice > combo.price && (
                      <>
                        <span className="text-xs text-fv-muted line-through">
                          ₹{combo.originalPrice}
                        </span>
                        <span className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full font-bold">
                          {combo.discount}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Stock Information Chip */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-fv-border">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-fv-muted">
                      <Zap className="w-3 h-3 text-amber-500" />
                      Stock: {combo.effectiveStock ?? combo.stock}
                    </span>
                    {combo.includedProducts && combo.includedProducts.length > 0 && (
                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full font-bold">
                        {combo.includedProducts.length} Items Included
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 pt-0 flex gap-2">
                <button
                  onClick={() => handleOpen(combo)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-300 py-2 rounded-xl text-xs font-semibold transition-colors min-h-[38px]"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Kit
                </button>
                <button
                  onClick={() => setComboToDelete(combo)}
                  className="p-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl transition-colors min-h-[38px]"
                  title="Delete combo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Bundle Assembler Modal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-fv-border animate-in fade-in zoom-in-95 duration-150">
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-fv-border">
                  <div>
                    <h2 className="text-xl font-bold text-fv-heading dark:text-white">
                      {editMode ? 'Edit Combo Bundle' : 'Assemble New Combo Pack'}
                    </h2>
                    <p className="text-xs text-fv-muted">
                      Select 2+ botanical products, review real-time pricing economics, and sync kit inventory
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-2 text-fv-muted hover:text-fv-heading hover:bg-fv-surface rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Status / Error Message */}
                  {message.text && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold ${
                        message.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {message.text}
                    </div>
                  )}

                  {/* Combo Name */}
                  <div>
                    <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                      Bundle Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Kitchen Herb Garden Starter Kit"
                      className="w-full px-3 py-2 text-xs md:text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-700 text-fv-heading dark:text-white focus:ring-2 focus:ring-fv-primary min-h-[42px]"
                    />
                  </div>

                  {/* Type & Stock Controller */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                        Bundle Taxonomy Category *
                      </label>
                      <select
                        required
                        value={formData.comboType}
                        onChange={(e) => setFormData({ ...formData, comboType: e.target.value })}
                        className="w-full px-3 py-2 text-xs md:text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-700 text-fv-heading dark:text-white focus:ring-2 focus:ring-fv-primary min-h-[42px]"
                      >
                        {['Small', 'Medium', 'Kitchen Garden', 'Terrace Garden', 'Growing Kit', 'Custom'].map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-fv-heading dark:text-white">
                          Inventory Stock *
                        </label>
                        {selectedProducts.length > 0 && (
                          <button
                            type="button"
                            onClick={handleSyncStockToComponent}
                            className="text-[11px] text-fv-primary dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            Sync to Component Max ({dynamicStock})
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        placeholder={`Max based on items: ${dynamicStock}`}
                        className="w-full px-3 py-2 text-xs md:text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-700 text-fv-heading dark:text-white focus:ring-2 focus:ring-fv-primary min-h-[42px]"
                      />
                    </div>
                  </div>

                  {/* Live Pricing & Margins Calculator Panel */}
                  <div className="p-4 rounded-xl bg-fv-surface dark:bg-gray-700/50 border border-fv-border space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-fv-heading dark:text-white flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-fv-primary" />
                        Bundle Pricing Economics (Bundler Benchmark)
                      </span>
                      <span className="text-[11px] text-fv-muted">
                        Auto-calculated from constituent catalog prices
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Bundle Selling Price */}
                      <div>
                        <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                          Bundle Price * (₹)
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="e.g. 299"
                          className="w-full px-3 py-2 text-xs md:text-sm font-bold border border-fv-border rounded-xl bg-white dark:bg-gray-800 text-fv-heading dark:text-white focus:ring-2 focus:ring-fv-primary min-h-[42px]"
                        />
                      </div>

                      {/* Cumulative MRP (Auto-Calculated) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-fv-heading dark:text-white">
                            Sum of Item MRPs (₹)
                          </label>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            Auto: ₹{computedOriginalPrice}
                          </span>
                        </div>
                        <input
                          type="number"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                          placeholder={`Auto: ${computedOriginalPrice}`}
                          className="w-full px-3 py-2 text-xs md:text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-800 text-fv-heading dark:text-white focus:ring-2 focus:ring-fv-primary min-h-[42px]"
                        />
                      </div>

                      {/* Live Discount Percentage & Savings */}
                      <div>
                        <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                          Customer Discount (%)
                        </label>
                        <div className="flex items-center h-[42px] px-3 bg-white dark:bg-gray-800 border border-fv-border rounded-xl text-xs">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {discountPercentage}% OFF
                          </span>
                          <span className="text-fv-muted ml-2">
                            (Saves ₹{savingsAmount})
                          </span>
                        </div>
                      </div>
                    </div>

                    {isPriceInverted && (
                      <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-1.5 font-semibold">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                        <span>Price Inversion Alert: Bundle price (₹{sellingPrice}) is higher than the sum of individual products (₹{effectiveOriginalPrice}).</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                      Bundle Description *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed contents and planting guidance for this combo pack..."
                      className="w-full px-3 py-2 text-xs md:text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-700 text-fv-heading dark:text-white focus:ring-2 focus:ring-fv-primary resize-none"
                    />
                  </div>

                  {/* Multi-Product Picker Section */}
                  <div className="border border-fv-border rounded-2xl p-4 bg-fv-surface/30 dark:bg-gray-800/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-fv-border">
                      <div>
                        <h3 className="text-sm font-bold text-fv-heading dark:text-white flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-fv-primary" />
                          Included Products in this Combo
                          <span className="text-xs px-2 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary font-bold">
                            {selectedProducts.length} selected
                          </span>
                        </h3>
                        <p className="text-xs text-fv-muted mt-0.5">
                          A combo pack requires at least 2 distinct products. Adjust quantities per item.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowProductSelector(!showProductSelector)}
                        className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] ${
                          showProductSelector
                            ? 'bg-gray-200 dark:bg-gray-700 text-fv-heading dark:text-white'
                            : 'bg-fv-primary hover:bg-fv-primary-dark text-white shadow-xs'
                        }`}
                      >
                        {showProductSelector ? (
                          <>
                            <X className="w-3.5 h-3.5" />
                            Hide Picker
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            + Browse & Add Products
                          </>
                        )}
                      </button>
                    </div>

                    {/* Selected Products List */}
                    {selectedProducts.length === 0 ? (
                      <div className="text-center py-6 px-4 border border-dashed border-fv-border rounded-xl bg-white/50 dark:bg-gray-700/30">
                        <ShoppingBag className="w-8 h-8 text-fv-muted mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-semibold text-fv-heading dark:text-white">No products added yet</p>
                        <p className="text-[11px] text-fv-muted mt-0.5">
                          Click "Browse & Add Products" above to pick at least 2 items for this bundle
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {selectedProducts.map((item, index) => {
                          const info = resolveProductInfo(item);
                          return (
                            <div
                              key={info.id || index}
                              className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700/80 rounded-xl border border-fv-border shadow-xs hover:border-fv-primary/30 transition-all"
                            >
                              <img
                                src={info.image && !info.image.includes('via.placeholder') ? info.image : DEFAULT_PRODUCT_IMAGE}
                                alt={info.name}
                                className="w-12 h-12 object-cover rounded-lg border border-fv-border shrink-0 bg-white"
                                onError={(e) => {
                                  handleImageError(e, DEFAULT_PRODUCT_IMAGE);
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-xs sm:text-sm text-fv-heading dark:text-white truncate">
                                  {info.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 text-xs text-fv-muted">
                                  <span>₹{info.price} each</span>
                                  <span>• In Stock: {info.stock}</span>
                                  {info.category && <span>• {info.category}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex flex-col items-end">
                                  <label className="text-[10px] text-fv-muted font-semibold uppercase tracking-wider">
                                    Qty
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity || 1}
                                    onChange={(e) => handleProductQuantityChange(info.id, e.target.value)}
                                    className="w-16 px-2 py-1 text-xs border border-fv-border rounded-lg bg-white dark:bg-gray-800 text-fv-heading dark:text-white font-bold text-center focus:ring-2 focus:ring-fv-primary"
                                    title="Quantity of this product in combo"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveProduct(info.id)}
                                  className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-colors border border-red-200 dark:border-red-900/50 hover:border-red-600 active:scale-95 ml-1"
                                  title="Remove this product from combo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Searchable Full Catalog Product Picker */}
                    {showProductSelector && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-xl border-2 border-fv-primary/30 shadow-md space-y-3">
                        <div className="flex items-center justify-between pb-1 border-b border-fv-border">
                          <span className="text-xs font-bold text-fv-heading dark:text-white flex items-center gap-1.5">
                            <Search className="w-3.5 h-3.5 text-fv-primary" />
                            Select Products from Catalog ({filteredProducts.length} available)
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowProductSelector(false)}
                            className="text-xs text-fv-muted hover:text-fv-heading font-semibold"
                          >
                            Close
                          </button>
                        </div>

                        {/* Search and Category Filter Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-fv-muted" />
                            <input
                              type="text"
                              value={productSearch}
                              onChange={(e) => setProductSearch(e.target.value)}
                              placeholder="Search products by name or keywords..."
                              className="w-full pl-9 pr-3 py-1.5 text-xs border border-fv-border rounded-lg bg-fv-surface dark:bg-gray-700 text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary min-h-[38px]"
                            />
                            {productSearch && (
                              <button
                                type="button"
                                onClick={() => setProductSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fv-muted hover:text-fv-heading"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {categories.length > 0 && (
                            <div className="sm:w-48 shrink-0">
                              <select
                                value={selectedCategoryFilter}
                                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                                className="w-full px-3 py-1.5 text-xs border border-fv-border rounded-lg bg-fv-surface dark:bg-gray-700 text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary min-h-[38px]"
                              >
                                <option value="all">All Categories</option>
                                {categories.map((cat) => (
                                  <option key={cat._id} value={cat._id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Product Picker Scroll Area */}
                        <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-fv-border/50">
                          {filteredProducts.length === 0 ? (
                            <p className="text-xs text-center py-6 text-fv-muted">
                              No products found matching "{productSearch}".
                            </p>
                          ) : (
                            filteredProducts.map((product) => {
                              const prodId = product._id.toString();
                              const isAdded = selectedProducts.some((p) => getProductId(p) === prodId);
                              return (
                                <div
                                  key={prodId}
                                  className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-fv-surface/60 dark:hover:bg-gray-700/60 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <img
                                      src={getProductImageUrl(product)}
                                      alt={product.name}
                                      onError={(e) => handleImageError(e, DEFAULT_PRODUCT_IMAGE)}
                                      className="w-9 h-9 object-cover rounded-md border border-fv-border shrink-0 bg-white"
                                    />
                                    <div className="min-w-0">
                                      <p className="font-semibold text-xs text-fv-heading dark:text-white truncate">
                                        {product.name}
                                      </p>
                                      <p className="text-[11px] text-fv-muted">
                                        ₹{product.price} • Stock: {product.stock || 0}
                                        {product.categoryId?.name ? ` • ${product.categoryId.name}` : ''}
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleProduct(product)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all active:scale-95 flex items-center gap-1 min-h-[32px] ${
                                      isAdded
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                        : 'bg-fv-primary text-white hover:bg-fv-primary-dark shadow-2xs'
                                    }`}
                                  >
                                    {isAdded ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Added</span>
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dual Mode Media Picker (Shopify-grade media management) */}
                  <DualMediaPicker
                    label="Combo Pack Images & Gallery"
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
                    helperText="Upload JPG, PNG, WebP or paste direct image links. First image is used as kit cover."
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-fv-border bg-fv-surface/40 dark:bg-gray-700/40">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-semibold text-fv-heading border border-fv-border rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors min-h-[40px] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 text-xs font-bold text-white bg-fv-primary hover:bg-fv-primary-dark rounded-xl transition-colors shadow-xs min-h-[40px] flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{editMode ? 'Updating Combo...' : 'Creating Combo...'}</span>
                      </>
                    ) : (
                      <span>{editMode ? 'Update Combo' : 'Assemble Combo'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Enterprise Delete Confirmation Modal */}
        <AdminConfirmModal
          isOpen={Boolean(comboToDelete)}
          title="Delete Combo Package?"
          message={
            comboToDelete ? (
              <p>
                Are you sure you want to delete combo{' '}
                <strong className="text-fv-heading dark:text-white">"{comboToDelete.name}"</strong>?
                This will soft-delete the bundle offer from the storefront. Individual constituent product records and inventory will remain intact.
              </p>
            ) : null
          }
          confirmText="Yes, Delete Combo"
          confirmVariant="danger"
          isLoading={isDeleting}
          onConfirm={handleConfirmDeleteCombo}
          onClose={() => setComboToDelete(null)}
        />
      </div>
    </div>
  );
};

export default AdminCombos;

