import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Edit,
  Trash2,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Layers,
  Image as ImageIcon,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Package,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import DualMediaPicker from '../../components/admin/DualMediaPicker';
import { handleImageError, DEFAULT_CATEGORY_ICON } from '../../utils/imageFallback';

const AdminCategories = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [isSlugAuto, setIsSlugAuto] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    image: '',
    isActive: true,
    showInCircle: true,
  });

  useEffect(() => {
    fetchCategories();
    if (searchParams.get('action') === 'new') {
      handleOpen();
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get('/categories?all=true');
      const data = response.data?.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const slugify = (text) => {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  };

  const handleOpen = (category = null) => {
    if (category) {
      setEditMode(true);
      setCurrentCategory(category);
      setIsSlugAuto(false);
      setFormData({
        name: category.name || '',
        slug: category.slug || '',
        description: category.description || '',
        icon: category.icon || '',
        image: category.image || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
        showInCircle: category.showInCircle !== false,
      });
    } else {
      setEditMode(false);
      setCurrentCategory(null);
      setIsSlugAuto(true);
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        image: '',
        isActive: true,
        showInCircle: true,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setMessage({ type: '', text: '' });
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, name: val };
      if (isSlugAuto) {
        next.slug = slugify(val);
      }
      return next;
    });
  };

  const handleSlugChange = (e) => {
    setIsSlugAuto(false);
    setFormData((prev) => ({
      ...prev,
      slug: slugify(e.target.value),
    }));
  };

  const toggleAutoSlug = () => {
    const nextAuto = !isSlugAuto;
    setIsSlugAuto(nextAuto);
    if (nextAuto && formData.name) {
      setFormData((prev) => ({
        ...prev,
        slug: slugify(prev.name),
      }));
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const trimmedName = formData.name?.trim();
    if (!trimmedName) {
      const errText = 'Category name is required and cannot be empty.';
      setMessage({ type: 'error', text: errText });
      toast.error(errText);
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        name: trimmedName,
        slug: formData.slug?.trim() || slugify(trimmedName),
      };

      if (editMode) {
        await api.put(`/categories/${currentCategory._id}`, payload);
        const successText = 'Category updated successfully!';
        setMessage({ type: 'success', text: successText });
        toast.success(successText);
      } else {
        await api.post('/categories', payload);
        const successText = 'Category created successfully!';
        setMessage({ type: 'success', text: successText });
        toast.success(successText);
      }

      await fetchCategories();
      setTimeout(() => handleClose(), 800);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to save category';
      setMessage({
        type: 'error',
        text: errorMsg,
      });
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/categories/${categoryToDelete._id}`);
      fetchCategories();
      toast.success(`Category "${categoryToDelete.name}" deleted successfully!`);
      setCategoryToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const nextList = [...categories];
    const movedItem = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = movedItem;

    setCategories(nextList);
    setIsReordering(true);
    try {
      await api.put('/categories/reorder', {
        categoryIds: nextList.map((c) => c._id),
      });
      toast.success('Category hierarchy order updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update category order');
      fetchCategories();
    } finally {
      setIsReordering(false);
    }
  };

  const handleToggleCircle = async (category) => {
    const nextVal = category.showInCircle === false ? true : false;
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c._id === category._id ? { ...c, showInCircle: nextVal } : c))
    );
    try {
      await api.put(`/categories/${category._id}`, { showInCircle: nextVal });
      toast.success(
        nextVal
          ? `"${category.name}" is now visible in the landing page circle strip!`
          : `"${category.name}" is now hidden from the landing page circle strip.`
      );
    } catch (error) {
      // Revert on error
      setCategories((prev) =>
        prev.map((c) => (c._id === category._id ? { ...c, showInCircle: !nextVal } : c))
      );
      toast.error(error.response?.data?.message || 'Failed to update circle visibility');
    }
  };

  const handleToggleActive = async (category) => {
    const nextVal = category.isActive === false ? true : false;
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((c) => (c._id === category._id ? { ...c, isActive: nextVal } : c))
    );
    try {
      await api.put(`/categories/${category._id}`, { isActive: nextVal });
      toast.success(`"${category.name}" set to ${nextVal ? 'Active' : 'Inactive'}`);
    } catch (error) {
      // Revert on error
      setCategories((prev) =>
        prev.map((c) => (c._id === category._id ? { ...c, isActive: !nextVal } : c))
      );
      toast.error(error.response?.data?.message || 'Failed to update category status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 pb-28 md:pb-6 space-y-4">
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
        <span className="text-fv-heading dark:text-white font-semibold">Categories</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-fv-heading flex items-center gap-2">
            Categories & Hierarchy
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary font-bold">
              {categories.length} categories
            </span>
          </h1>
          <p className="text-xs text-fv-muted mt-0.5">
            Manage category tree hierarchy, automated slugification, promotional banners, and circular icons
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpen()}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-fv-primary hover:bg-fv-primary-dark text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs active:scale-95 transition-all min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-gray-800 rounded-2xl border border-fv-border animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-12 text-center">
          <Layers className="w-12 h-12 text-fv-muted mx-auto mb-3" />
          <p className="text-base font-semibold text-fv-heading">No categories found</p>
          <p className="text-xs text-fv-muted mt-1">Get started by creating your first product category</p>
          <button
            onClick={() => handleOpen()}
            className="mt-4 px-4 py-2.5 bg-fv-primary text-white text-xs font-semibold rounded-xl min-h-[44px]"
          >
            Create Category
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="space-y-3 md:hidden">
            {categories.map((category, index) => (
              <div
                key={category._id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-fv-border shadow-xs space-y-3"
              >
                <div className="flex items-start gap-3">
                  {/* Category Thumbnail / Disc Preview */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border border-fv-border/80 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                      {category.icon || category.image ? (
                        <img
                          src={category.icon || category.image}
                          alt={category.name}
                          className="w-9 h-9 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <Layers className="w-5 h-5 text-fv-muted" />
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-fv-surface dark:bg-gray-600 text-fv-muted border border-fv-border">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-fv-heading dark:text-white truncate">
                        {category.name}
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(category)}
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 transition-transform active:scale-95 cursor-pointer ${
                          category.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                        }`}
                        title="Click to toggle active status"
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-fv-surface dark:bg-gray-700 text-[10px] font-mono text-fv-muted border border-fv-border">
                        /{category.slug}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <Package className="w-3 h-3" />
                        {category.productCount ?? 0} Products
                      </span>
                    </div>

                    {category.description && (
                      <p className="text-xs text-fv-muted mt-1.5 line-clamp-2">{category.description}</p>
                    )}

                    {/* Quick Controls */}
                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCircle(category)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                          category.showInCircle !== false
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700 shadow-2xs'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                        }`}
                        title="Click to toggle landing page circle strip"
                      >
                        <span className={`w-2 h-2 rounded-full ${category.showInCircle !== false ? 'bg-amber-500' : 'bg-gray-400'}`} />
                        {category.showInCircle !== false ? 'Circle: Visible' : 'Circle: Hidden'}
                      </button>

                      {/* Hierarchy Reorder Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0 || isReordering}
                          onClick={() => handleMoveOrder(index, -1)}
                          className="p-1 rounded-md border border-fv-border text-fv-muted hover:text-fv-heading hover:bg-fv-surface disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === categories.length - 1 || isReordering}
                          onClick={() => handleMoveOrder(index, 1)}
                          className="p-1 rounded-md border border-fv-border text-fv-muted hover:text-fv-heading hover:bg-fv-surface disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-fv-border">
                  <button
                    onClick={() => handleOpen(category)}
                    className="px-3 py-1.5 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-900/20 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all min-h-[38px]"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setCategoryToDelete(category)}
                    className="px-3 py-1.5 rounded-lg text-red-600 bg-red-50 dark:bg-red-900/20 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all min-h-[38px]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-fv-border overflow-hidden">
            <table className="min-w-full divide-y divide-fv-border">
              <thead className="bg-fv-surface dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider w-16">
                    Order
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Thumbnail
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Category Name & Slug
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Assigned Products
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Landing Circles
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fv-border/60">
                {categories.map((category, index) => (
                  <tr key={category._id} className="hover:bg-fv-surface/50 dark:hover:bg-gray-700/40 transition-colors">
                    {/* Order Hierarchy Controls */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-fv-muted min-w-[20px]">#{index + 1}</span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            disabled={index === 0 || isReordering}
                            onClick={() => handleMoveOrder(index, -1)}
                            className="p-1 rounded text-fv-muted hover:text-fv-heading hover:bg-fv-surface disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            title="Move Category Up in Hierarchy"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={index === categories.length - 1 || isReordering}
                            onClick={() => handleMoveOrder(index, 1)}
                            className="p-1 rounded text-fv-muted hover:text-fv-heading hover:bg-fv-surface disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            title="Move Category Down in Hierarchy"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </td>

                    {/* Thumbnail / Icon Disc */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-11 h-11 rounded-full bg-white dark:bg-gray-700 border border-fv-border/80 shadow-2xs flex items-center justify-center overflow-hidden shrink-0">
                          {category.icon ? (
                            <img
                              src={category.icon}
                              alt={category.name}
                              className="w-8 h-8 object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Layers className="w-4 h-4 text-fv-muted" />
                          )}
                        </div>
                        {category.image && (
                          <div className="w-12 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden border border-fv-border shrink-0">
                            <img
                              src={category.image}
                              alt={`${category.name} Banner`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                handleImageError(e, DEFAULT_CATEGORY_ICON);
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Name & Slug */}
                    <td className="px-5 py-3">
                      <div className="text-sm font-bold text-fv-heading dark:text-white">{category.name}</div>
                      <div className="inline-block mt-0.5">
                        <span className="px-2 py-0.5 rounded-md bg-fv-surface dark:bg-gray-700/80 text-[11px] font-mono text-fv-muted border border-fv-border">
                          /{category.slug}
                        </span>
                      </div>
                      {category.description && (
                        <div className="text-xs text-fv-muted mt-0.5 max-w-xs truncate">{category.description}</div>
                      )}
                    </td>

                    {/* Assigned Products Count Chip */}
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
                        <Package className="w-3.5 h-3.5" />
                        {category.productCount ?? 0} Products
                      </span>
                    </td>

                    {/* Landing Page Circle Strip 1-Click Interactive Toggle */}
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleCircle(category)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 ${
                          category.showInCircle !== false
                            ? 'bg-amber-100/90 text-amber-900 border border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700 hover:bg-amber-200 shadow-2xs'
                            : 'bg-gray-100 text-gray-500 border border-gray-200 dark:bg-gray-700/60 dark:text-gray-400 dark:border-gray-600 hover:bg-gray-200'
                        }`}
                        title={category.showInCircle !== false ? 'Click to hide from homepage circle strip' : 'Click to display in homepage circle strip'}
                      >
                        <span className={`w-2 h-2 rounded-full ${category.showInCircle !== false ? 'bg-amber-500 animate-pulse' : 'bg-gray-400'}`} />
                        {category.showInCircle !== false ? 'Visible on Homepage' : 'Hidden from Circles'}
                      </button>
                    </td>

                    {/* Status Active Toggle */}
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(category)}
                        className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full cursor-pointer transition-transform active:scale-95 ${
                          category.isActive
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                        }`}
                        title="Click to toggle active status"
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>

                    {/* Action Buttons */}
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpen(category)}
                          className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="Edit Category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCategoryToDelete(category)}
                          className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Edit / Create Modal with Real-Time Slugification */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-fv-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-fv-border">
                <div>
                  <h2 className="text-base font-bold text-fv-heading dark:text-white">
                    {editMode ? 'Edit Category' : 'Create New Category'}
                  </h2>
                  <p className="text-xs text-fv-muted">
                    Strapi & Magento taxonomy standards with auto-slug generation
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1 rounded-lg text-fv-muted hover:text-fv-heading hover:bg-fv-surface transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 space-y-4 max-h-[75vh] overflow-y-auto">
                {message.text && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold ${
                      message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                {/* Category Name */}
                <div>
                  <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-3 py-2 text-xs md:text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-700 text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary min-h-[42px]"
                    placeholder="e.g., Organic Leafy Greens, Flower Seeds"
                  />
                </div>

                {/* Real-Time Auto-Generated Slug */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-fv-heading dark:text-white flex items-center gap-1.5">
                      URL Slug
                      {isSlugAuto && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                          <Sparkles className="w-2.5 h-2.5" /> Auto-syncing
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={toggleAutoSlug}
                      className="text-[11px] text-fv-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {isSlugAuto ? 'Edit Manually' : 'Auto-Generate'}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-fv-muted font-mono select-none">
                      /shop?category=
                    </span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={handleSlugChange}
                      className="w-full pl-32 pr-3 py-2 text-xs font-mono border border-fv-border rounded-xl bg-white dark:bg-gray-700 text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary min-h-[42px]"
                      placeholder="organic-leafy-greens"
                    />
                  </div>
                  <p className="text-[11px] text-fv-muted mt-1">
                    Collision detection automatically resolves duplicate slugs (e.g. `leafy-greens-1`)
                  </p>
                </div>

                {/* Circular Icon URL & Disc Live Preview */}
                <div>
                  <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                    Circular Icon Image URL
                  </label>
                  <div className="flex items-center gap-3">
                    {/* Live Preview Disc */}
                    <div className="w-14 h-14 rounded-full bg-white dark:bg-gray-700 border-2 border-dashed border-fv-border shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                      {formData.icon ? (
                        <img
                          src={formData.icon}
                          alt="Icon Preview"
                          className="w-10 h-10 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-fv-muted" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="url"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-fv-border rounded-xl bg-white dark:bg-gray-700 text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary min-h-[42px]"
                        placeholder="https://.../circular-icon.png"
                      />
                      <p className="text-[11px] text-fv-muted mt-1">
                        Displayed in circular category discs on storefront navigation
                      </p>
                    </div>
                  </div>
                </div>

                {/* Category Promotional Cover / Banner Image */}
                <DualMediaPicker
                  label="Category Cover & Banner Image"
                  aspectRatioHint="16:9 or 4:3 recommended"
                  value={formData.image}
                  onChange={(val) => setFormData({ ...formData, image: val })}
                  uploadEndpoint="/upload"
                  helperText="Upload category hero photo or paste direct image URL"
                />

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs md:text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-700 text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary resize-none"
                    placeholder="Brief description for SEO and category headers"
                  />
                </div>

                {/* Show in Homepage Circle Strip Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40">
                  <div>
                    <span className="block text-xs font-bold text-fv-heading dark:text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      Show in Homepage Circle Strip
                    </span>
                    <span className="block text-[11px] text-fv-muted">
                      Display circular icon disc on the storefront homepage strip
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.showInCircle}
                    onChange={(e) => setFormData({ ...formData, showInCircle: e.target.checked })}
                    className="w-5 h-5 rounded-md text-amber-600 focus:ring-amber-500 border-fv-border cursor-pointer"
                  />
                </div>

                {/* Active Toggle Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-fv-surface dark:bg-gray-700 border border-fv-border">
                  <div>
                    <span className="block text-xs font-bold text-fv-heading dark:text-white">Active in Storefront</span>
                    <span className="block text-[11px] text-fv-muted">Make this category visible to shoppers</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded-md text-fv-primary focus:ring-fv-primary border-fv-border cursor-pointer"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-fv-border bg-fv-surface/40 dark:bg-gray-700/40">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-fv-heading border border-fv-border rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <span>{editMode ? 'Saving...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{editMode ? 'Save Changes' : 'Create Category'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enterprise Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(categoryToDelete)}
        title="Delete Category?"
        message={
          categoryToDelete ? (
            <div className="space-y-2">
              <p>
                Are you sure you want to delete category{' '}
                <strong className="text-fv-heading dark:text-white">"{categoryToDelete.name}"</strong>?
              </p>
              {categoryToDelete.productCount > 0 ? (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-700 dark:text-red-300">
                  <strong>Warning:</strong> This category has <strong>{categoryToDelete.productCount}</strong> assigned products.
                  Backend protection will prevent deletion until all assigned products are reassigned to another category.
                </div>
              ) : (
                <p className="text-xs text-fv-muted">
                  This category has 0 assigned products and can be safely soft-deleted and restored at any time.
                </p>
              )}
            </div>
          ) : null
        }
        confirmText="Yes, Delete Category"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteCategory}
        onClose={() => setCategoryToDelete(null)}
      />
    </div>
  );
};

export default AdminCategories;

