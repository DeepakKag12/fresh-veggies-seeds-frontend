import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, X, CheckCircle, AlertCircle, Layers, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    image: '',
    isActive: true,
    showInCircle: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleOpen = (category = null) => {
    if (category) {
      setEditMode(true);
      setCurrentCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        image: category.image || '',
        isActive: category.isActive !== undefined ? category.isActive : true,
        showInCircle: category.showInCircle !== false,
      });
    } else {
      setEditMode(false);
      setCurrentCategory(null);
      setFormData({
        name: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      if (editMode) {
        await api.put(`/categories/${currentCategory._id}`, formData);
        setMessage({ type: 'success', text: 'Category updated successfully!' });
      } else {
        await api.post('/categories', formData);
        setMessage({ type: 'success', text: 'Category created successfully!' });
      }

      fetchCategories();
      setTimeout(() => handleClose(), 1200);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save category',
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Products linked to this category may lose their categorization.')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
      toast.success('Category deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleToggleCircle = async (category) => {
    const nextVal = category.showInCircle === false ? true : false;
    // Optimistic UI update
    setCategories(prev =>
      prev.map(c => c._id === category._id ? { ...c, showInCircle: nextVal } : c)
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
      setCategories(prev =>
        prev.map(c => c._id === category._id ? { ...c, showInCircle: !nextVal } : c)
      );
      toast.error(error.response?.data?.message || 'Failed to update circle visibility');
    }
  };

  const handleToggleActive = async (category) => {
    const nextVal = category.isActive === false ? true : false;
    // Optimistic UI update
    setCategories(prev =>
      prev.map(c => c._id === category._id ? { ...c, isActive: nextVal } : c)
    );
    try {
      await api.put(`/categories/${category._id}`, { isActive: nextVal });
      toast.success(`"${category.name}" set to ${nextVal ? 'Active' : 'Inactive'}`);
    } catch (error) {
      // Revert on error
      setCategories(prev =>
        prev.map(c => c._id === category._id ? { ...c, isActive: !nextVal } : c)
      );
      toast.error(error.response?.data?.message || 'Failed to update category status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 pb-28 md:pb-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-fv-heading flex items-center gap-2">
            Categories & Taxonomy
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary font-bold">
              {categories.length} categories
            </span>
          </h1>
          <p className="text-xs text-fv-muted mt-0.5">
            Configure circular catalog icons, banner hero images, and shop category hierarchy
          </p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-fv-primary hover:bg-fv-primary-dark text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs active:scale-95 transition-all min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
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
            {categories.map((category) => (
              <div
                key={category._id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-fv-border shadow-xs space-y-3"
              >
                <div className="flex items-start gap-3">
                  {/* Category Circular Disc Preview */}
                  <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border border-fv-border/80 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                    {category.icon ? (
                      <img
                        src={category.icon}
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
                    <p className="text-[11px] text-fv-muted font-mono mt-0.5">/{category.slug}</p>
                    {category.description && (
                      <p className="text-xs text-fv-muted mt-1 line-clamp-2">{category.description}</p>
                    )}

                    {/* Quick 1-touch Landing Page Circle toggle */}
                    <div className="mt-2.5 flex items-center gap-2">
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
                    onClick={() => handleDelete(category._id)}
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
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Icon Disc
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Name & URL Slug
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Landing Circles
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider">
                    Description
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
                {categories.map((category) => (
                  <tr key={category._id} className="hover:bg-fv-surface/50 dark:hover:bg-gray-700/40 transition-colors">
                    {/* Icon Disc Thumbnail */}
                    <td className="px-5 py-3">
                      <div className="w-11 h-11 rounded-full bg-white dark:bg-gray-700 border border-fv-border/80 shadow-2xs flex items-center justify-center overflow-hidden">
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
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-sm font-bold text-fv-heading dark:text-white">{category.name}</div>
                      <div className="text-[11px] font-mono text-fv-muted">/{category.slug}</div>
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
                    <td className="px-5 py-3 text-xs text-fv-muted max-w-xs truncate">
                      {category.description || '—'}
                    </td>
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
                          onClick={() => handleDelete(category._id)}
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

      {/* Edit / Create Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-fv-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-fv-border">
                <h2 className="text-base font-bold text-fv-heading dark:text-white">
                  {editMode ? 'Edit Category' : 'Create New Category'}
                </h2>
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs md:text-sm border border-fv-border rounded-xl bg-white dark:bg-gray-700 text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary min-h-[42px]"
                    placeholder="e.g., Plants, Seeds, Pots & Planters"
                  />
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
                        Displayed in the circular category disc strip on the storefront
                      </p>
                    </div>
                  </div>
                </div>

                {/* Banner / Cover Image URL */}
                <div>
                  <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                    Banner / Header Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-fv-border rounded-xl bg-white dark:bg-gray-700 text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary min-h-[42px]"
                    placeholder="https://.../banner-hero.jpg"
                  />
                </div>

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
                  className="px-4 py-2 text-xs font-semibold text-fv-heading border border-fv-border rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-colors min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-fv-primary hover:bg-fv-primary-dark rounded-xl transition-colors shadow-xs min-h-[40px]"
                >
                  {editMode ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
