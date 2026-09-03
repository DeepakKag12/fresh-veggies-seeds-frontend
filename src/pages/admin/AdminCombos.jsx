import React, { useEffect, useState } from 'react';
import { Edit, Trash2, Plus, X, Upload, ShoppingBag } from 'lucide-react';
import api, { fetchAllPages } from '../../utils/api';

const AdminCombos = () => {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCombo, setCurrentCombo] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
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
  }, []);

  const fetchCombos = async () => {
    try {
      const response = await api.get('/combos');
      setCombos(response.data.data);
    } catch (error) {
      console.error('Error fetching combos:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      // The picker must offer every product, and `?limit=100` did not do that —
      // the API clamps page size, so products beyond the cap were unpickable.
      const allProducts = await fetchAllPages('/products');
      setProducts(allProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleOpen = (combo = null) => {
    if (combo) {
      setEditMode(true);
      setCurrentCombo(combo);
      setFormData({
        name: combo.name,
        description: combo.description,
        price: combo.price,
        originalPrice: combo.originalPrice || '',
        discount: combo.discount || '',
        comboType: combo.comboType,
        stock: combo.stock,
        images: combo.images.join(', '),
      });
      setImagePreview(combo.images || []);
      setSelectedProducts(combo.includedProducts || []);
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
      setImagePreview([]);
      setSelectedProducts([]);
      setImageFiles([]);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setMessage({ type: '', text: '' });
    setImageFiles([]);
    setImagePreview([]);
    setShowProductSelector(false);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
  };

  const handleProductSelect = (product) => {
    const exists = selectedProducts.find(p => p.productId._id === product._id);
    if (!exists) {
      setSelectedProducts([...selectedProducts, {
        productId: product,
        quantity: 1
      }]);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.productId._id !== productId));
  };

  const handleProductQuantityChange = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.productId._id === productId ? { ...p, quantity: parseInt(quantity) } : p
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    try {
      // Handle image uploads
      let imageUrls = [];
      
      // Keep existing URL-based images if editing
      if (editMode && formData.images) {
        imageUrls = formData.images.split(',').map(url => url.trim()).filter(url => url);
      }

      // Upload new images if selected
      if (imageFiles.length > 0) {
        const uploadPromises = imageFiles.map(async (file) => {
          const formDataUpload = new FormData();
          formDataUpload.append('image', file);
          const response = await api.post('/upload', formDataUpload, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return response.data.data.url;
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        imageUrls = [...imageUrls, ...uploadedUrls];
      }

      const comboData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : parseFloat(formData.price),
        discount: formData.discount ? parseFloat(formData.discount) : 0,
        comboType: formData.comboType,
        stock: parseInt(formData.stock),
        images: imageUrls.length > 0 ? imageUrls : undefined,
        includedProducts: selectedProducts.map(p => ({
          productId: p.productId._id,
          quantity: p.quantity
        }))
      };

      if (editMode) {
        await api.put(`/combos/${currentCombo._id}`, comboData);
        setMessage({ type: 'success', text: 'Combo updated successfully!' });
      } else {
        await api.post('/combos', comboData);
        setMessage({ type: 'success', text: 'Combo created successfully!' });
      }

      fetchCombos();
      setTimeout(() => handleClose(), 1500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save combo',
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this combo?')) {
      try {
        await api.delete(`/combos/${id}`);
        fetchCombos();
        alert('Combo deleted successfully!');
      } catch (error) {
        alert('Failed to delete combo');
      }
    }
  };

  return (
    <div className="min-h-screen bg-fv-page  py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-fv-heading ">
            Manage Combo Packs
          </h1>
          <button
            onClick={() => handleOpen()}
            className="flex items-center gap-2 bg-fv-primary hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-semibold  transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Combo
          </button>
        </div>

        {/* Combos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {combos.map((combo) => (
            <div
              key={combo._id}
              className="bg-white  rounded-[12px]  overflow-hidden hover:shadow-[0_18px_40px_rgba(10,76,54,0.10)] transition-shadow"
            >
              <img
                src={combo.images?.[0] || 'https://via.placeholder.com/300'}
                alt={combo.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-fv-heading  mb-2 line-clamp-2">
                  {combo.name}
                </h3>
                <p className="text-sm text-fv-muted  mb-2">
                  {combo.comboType}
                </p>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-fv-primary">
                    ₹{combo.price}
                  </span>
                  {combo.originalPrice && combo.originalPrice > combo.price && (
                    <>
                      <span className="text-sm text-fv-muted line-through">
                        ₹{combo.originalPrice}
                      </span>
                      <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-full">
                        {combo.discount}% OFF
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-fv-muted">
                    Stock: {combo.stock}
                  </span>
                  {combo.includedProducts && combo.includedProducts.length > 0 && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                      {combo.includedProducts.length} Products
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpen(combo)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(combo._id)}
                    className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white  rounded-[12px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-fv-border ">
                  <h2 className="text-2xl font-bold text-fv-heading ">
                    {editMode ? 'Edit Combo' : 'Add New Combo'}
                  </h2>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="p-2 hover:bg-fv-surface  rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-6">
                  {/* Message */}
                  {message.text && (
                    <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-fv-cream dark:bg-green-900/20 text-fv-primary-dark dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                      {message.text}
                    </div>
                  )}

                  {/* Combo Name */}
                  <div>
                    <label className="block text-sm font-medium text-fv-ink  mb-2">
                      Combo Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                    />
                  </div>

                  {/* Type & Stock */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-fv-ink  mb-2">
                        Combo Type *
                      </label>
                      <select
                        required
                        value={formData.comboType}
                        onChange={(e) => setFormData({ ...formData, comboType: e.target.value })}
                        className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                      >
                        {['Small', 'Medium', 'Kitchen Garden', 'Terrace Garden', 'Growing Kit', 'Custom'].map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-fv-ink  mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                      />
                    </div>
                  </div>

                  {/* Price Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-fv-ink  mb-2">
                        Combo Price * (₹)
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
                    <div>
                      <label className="block text-sm font-medium text-fv-ink  mb-2">
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        className="w-full px-4 py-3 border border-fv-border  rounded-lg bg-white  text-fv-heading  focus:ring-2 focus:ring-fv-primary"
                      />
                    </div>
                  </div>

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

                  {/* Product Selection Section */}
                  <div className="border border-fv-border  rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-fv-heading  flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        Included Products
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowProductSelector(!showProductSelector)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Select Products
                      </button>
                    </div>

                    {/* Selected Products */}
                    {selectedProducts.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {selectedProducts.map((item) => (
                          <div key={item.productId._id} className="flex items-center gap-3 p-3 bg-fv-page  rounded-lg">
                            <img
                              src={item.productId.images?.[0] || 'https://via.placeholder.com/50'}
                              alt={item.productId.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-fv-heading ">{item.productId.name}</p>
                              <p className="text-sm text-fv-muted ">₹{item.productId.price}</p>
                            </div>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleProductQuantityChange(item.productId._id, e.target.value)}
                              className="w-20 px-2 py-1 border border-fv-border  rounded bg-white  text-fv-heading "
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(item.productId._id)}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Product Selector */}
                    {showProductSelector && (
                      <div className="max-h-64 overflow-y-auto border border-fv-border  rounded-lg p-2">
                        <div className="grid grid-cols-1 gap-2">
                          {products.map((product) => (
                            <button
                              key={product._id}
                              type="button"
                              onClick={() => handleProductSelect(product)}
                              disabled={selectedProducts.some(p => p.productId._id === product._id)}
                              className={`flex items-center gap-3 p-2 rounded-lg text-left transition-colors ${
                                selectedProducts.some(p => p.productId._id === product._id)
                                  ? 'bg-gray-200 dark:bg-gray-600 cursor-not-allowed'
                                  : 'hover:bg-fv-surface '
                              }`}
                            >
                              <img
                                src={product.images?.[0] || 'https://via.placeholder.com/40'}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium text-fv-heading  text-sm">{product.name}</p>
                                <p className="text-xs text-fv-muted ">₹{product.price}</p>
                              </div>
                              {selectedProducts.some(p => p.productId._id === product._id) && (
                                <span className="text-xs bg-fv-cream dark:bg-green-900/30 text-fv-primary-dark dark:text-green-400 px-2 py-1 rounded-full">
                                  Added
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-fv-ink  mb-2">
                      Combo Images
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
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-fv-border ">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 border border-fv-border  text-fv-ink  rounded-lg hover:bg-fv-surface  transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-fv-primary hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-semibold transition-all"
                  >
                    {editMode ? 'Update Combo' : 'Create Combo'}
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

export default AdminCombos;
