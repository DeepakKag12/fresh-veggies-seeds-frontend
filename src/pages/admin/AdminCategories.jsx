import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleOpen = (category = null) => {
    if (category) {
      setEditMode(true);
      setCurrentCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
      });
    } else {
      setEditMode(false);
      setCurrentCategory(null);
      setFormData({
        name: '',
        description: '',
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
      setTimeout(() => handleClose(), 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save category',
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
      toast.success('Category deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 pb-28 md:pb-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-fv-heading">
            Manage Categories
          </h1>
          <p className="text-xs text-fv-muted mt-0.5">
            {categories.length} product categories
          </p>
        </div>
        <button
          onClick={() => handleOpen()}
          className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 bg-fv-primary hover:bg-fv-primary-dark text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Mobile Cards View */}
      <div className="space-y-3 md:hidden">
        {categories.map((category) => (
          <div
            key={category._id}
            className="bg-white rounded-[16px] p-4 border border-fv-border shadow-xs space-y-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-fv-heading">{category.name}</h3>
                <p className="text-xs text-fv-muted font-mono mt-0.5">/{category.slug}</p>
                {category.description && (
                  <p className="text-xs text-fv-muted mt-1">{category.description}</p>
                )}
              </div>
              <span
                className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                  category.isActive
                    ? 'bg-fv-cream text-fv-primary-dark dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-fv-surface text-fv-muted'
                }`}
              >
                {category.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-fv-border">
              <button
                onClick={() => handleOpen(category)}
                className="px-3 py-1.5 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-900/20 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(category._id)}
                className="px-3 py-1.5 rounded-lg text-red-600 bg-red-50 dark:bg-red-900/20 text-xs font-semibold flex items-center gap-1 active:scale-95 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-[12px] shadow-sm border border-fv-border overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-fv-page">
            <tr>
              {['Name', 'Slug', 'Description', 'Status', 'Actions'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-fv-muted uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {categories.map((category) => (
              <tr key={category._id} className="hover:bg-fv-page/40 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-fv-heading">{category.name}</td>
                <td className="px-4 py-3 text-sm text-fv-muted">{category.slug}</td>
                <td className="px-4 py-3 text-sm text-fv-muted">{category.description || '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                      category.isActive
                        ? 'bg-fv-cream text-fv-primary-dark dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-fv-surface text-fv-muted'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 flex items-center gap-2">
                  <button
                    onClick={() => handleOpen(category)}
                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white  rounded-[18px] shadow-2xl w-full max-w-md">
            <form onSubmit={handleSubmit}>
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-fv-border ">
                <h2 className="text-lg font-bold text-fv-heading ">
                  {editMode ? 'Edit Category' : 'Add New Category'}
                </h2>
                <button type="button" onClick={handleClose} className="p-1 text-fv-muted hover:text-fv-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-4 space-y-4">
                {/* Alert */}
                {message.text && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
                      message.type === 'success'
                        ? 'bg-fv-cream text-fv-primary-dark dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    {message.text}
                  </div>
                )}

                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-fv-ink  mb-1">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-fv-border  rounded-lg bg-white  text-fv-heading  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fv-primary transition"
                    placeholder="Enter category name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-fv-ink  mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-fv-border  rounded-lg bg-white  text-fv-heading  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-fv-primary transition resize-none"
                    placeholder="Optional description"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 px-6 pb-5">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-sm font-medium text-fv-ink  border border-fv-border  rounded-lg hover:bg-fv-page  transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-fv-primary hover:bg-fv-primary-dark rounded-lg transition-colors"
                >
                  {editMode ? 'Update' : 'Create'}
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
