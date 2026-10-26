import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  MousePointer,
  Calendar,
  Image as ImageIcon,
  Link as LinkIcon,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Upload,
  Smartphone,
  Monitor,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import AdminConfirmModal from '../../components/admin/AdminConfirmModal';
import {
  getBannerImageUrl,
  handleImageError,
} from '../../utils/imageFallback';

function AdminBanners() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null); // 'desktop' | 'mobile' | null
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [filterPosition, setFilterPosition] = useState('all');

  const desktopFileInputRef = useRef(null);
  const mobileFileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    mobileImageUrl: '',
    linkUrl: '/shop',
    linkType: 'category',
    position: 'hero',
    order: 0,
    startDate: '',
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchBanners();
    fetchCategories();
    if (searchParams.get('action') === 'new') {
      handleOpenDialog();
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const response = await api.get('/banners/admin');
      const loadedBanners = response.data?.data || [];
      // Ensure sorted by order
      loadedBanners.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setBanners(loadedBanners);
    } catch (error) {
      console.error('Error fetching banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load categories for deep-link:', err);
    }
  };

  const handleOpenDialog = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title || '',
        description: banner.description || '',
        imageUrl: banner.imageUrl || '',
        mobileImageUrl: banner.mobileImageUrl || '',
        linkUrl: banner.linkUrl || '/shop',
        linkType: banner.linkType || 'internal',
        position: banner.position || 'hero',
        order: banner.order ?? 0,
        startDate: banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : '',
        endDate: banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : '',
        isActive: banner.isActive !== false
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: '',
        description: '',
        imageUrl: '',
        mobileImageUrl: '',
        linkUrl: '/shop',
        linkType: 'category',
        position: 'hero',
        order: banners.length,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true
      });
    }
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingBanner(null);
    setUploadingSlot(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = async (e, slot) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file (JPG, PNG, WebP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file size must be under 10MB');
      return;
    }

    setUploadingSlot(slot);
    const uploadData = new FormData();
    uploadData.append('image', file);
    uploadData.append('slot', slot);

    try {
      const res = await api.post('/upload/banner', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.data?.url;
      if (url) {
        if (slot === 'desktop') {
          setFormData((prev) => ({ ...prev, imageUrl: url }));
          toast.success('Desktop banner image uploaded!');
        } else {
          setFormData((prev) => ({ ...prev, mobileImageUrl: url }));
          toast.success('Mobile banner image uploaded!');
        }
      }
    } catch (err) {
      console.warn('Dedicated banner upload failed, trying standard upload fallback...', err);
      try {
        const fallbackRes = await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const url = fallbackRes.data?.data?.url;
        if (url) {
          if (slot === 'desktop') {
            setFormData((prev) => ({ ...prev, imageUrl: url }));
          } else {
            setFormData((prev) => ({ ...prev, mobileImageUrl: url }));
          }
          toast.success('Banner image uploaded!');
        }
      } catch (fallbackErr) {
        toast.error('Failed to upload image. You can also paste an image URL directly.');
      }
    } finally {
      setUploadingSlot(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Please enter a promotional banner title');
      return;
    }
    if (!formData.imageUrl.trim()) {
      toast.error('Please upload or provide a desktop banner image');
      return;
    }

    setIsSaving(true);
    try {
      const dataToSend = {
        ...formData,
        order: parseInt(formData.order) || 0,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined
      };

      if (editingBanner) {
        await api.put(`/banners/${editingBanner._id}`, dataToSend);
        toast.success('Banner updated successfully!');
      } else {
        await api.post('/banners', dataToSend);
        toast.success('Banner created successfully!');
      }

      handleCloseDialog();
      fetchBanners();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast.error(error.response?.data?.message || 'Failed to save banner');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (banner) => {
    const nextActive = !banner.isActive;
    // Optimistic UI update
    setBanners((prev) =>
      prev.map((b) => (b._id === banner._id ? { ...b, isActive: nextActive } : b))
    );

    try {
      await api.put(`/banners/${banner._id}`, { isActive: nextActive });
      toast.success(`Banner ${nextActive ? 'activated' : 'deactivated'}!`);
    } catch (error) {
      // Revert on failure
      setBanners((prev) =>
        prev.map((b) => (b._id === banner._id ? { ...b, isActive: banner.isActive } : b))
      );
      toast.error('Failed to update banner visibility');
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= filteredBanners.length) return;

    const newBanners = [...banners];
    const currentItem = filteredBanners[index];
    const targetItem = filteredBanners[targetIndex];

    const currentGlobalIndex = newBanners.findIndex((b) => b._id === currentItem._id);
    const targetGlobalIndex = newBanners.findIndex((b) => b._id === targetItem._id);

    if (currentGlobalIndex === -1 || targetGlobalIndex === -1) return;

    // Swap items
    const temp = newBanners[currentGlobalIndex];
    newBanners[currentGlobalIndex] = newBanners[targetGlobalIndex];
    newBanners[targetGlobalIndex] = temp;

    // Renumber orders
    newBanners.forEach((b, idx) => {
      b.order = idx;
    });

    setBanners(newBanners);

    try {
      await api.put('/banners/reorder', {
        bannerIds: newBanners.map((b) => b._id)
      });
      toast.success('Banner sequence updated!');
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to save banner sequence');
      fetchBanners();
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newBanners = [...banners];
    const draggedItem = filteredBanners[draggedIndex];
    const globalFromIndex = newBanners.findIndex((b) => b._id === draggedItem._id);
    const globalDropIndex = newBanners.findIndex((b) => b._id === filteredBanners[dropIndex]._id);

    if (globalFromIndex === -1 || globalDropIndex === -1) return;

    const [removed] = newBanners.splice(globalFromIndex, 1);
    newBanners.splice(globalDropIndex, 0, removed);

    newBanners.forEach((b, idx) => {
      b.order = idx;
    });

    setBanners(newBanners);
    setDraggedIndex(null);

    try {
      await api.put('/banners/reorder', {
        bannerIds: newBanners.map((b) => b._id)
      });
      toast.success('Banners reordered successfully!');
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to save reordered sequence');
      fetchBanners();
    }
  };

  const handleConfirmDeleteBanner = async () => {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/banners/${bannerToDelete._id}`);
      toast.success('Banner deleted successfully!');
      setBannerToDelete(null);
      fetchBanners();
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast.error(error.response?.data?.message || 'Failed to delete banner');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCampaignStatus = (banner) => {
    if (!banner.isActive) {
      return {
        label: 'Inactive',
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
        dot: 'bg-gray-400'
      };
    }
    const now = new Date();
    const start = banner.startDate ? new Date(banner.startDate) : null;
    const end = banner.endDate ? new Date(banner.endDate) : null;

    if (start && now < start) {
      return {
        label: `Scheduled (${start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`,
        color: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
        dot: 'bg-amber-500'
      };
    }
    if (end && now > end) {
      return {
        label: `Expired (${end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })})`,
        color: 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200',
        dot: 'bg-rose-500'
      };
    }
    return {
      label: 'Live Now',
      color: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200',
      dot: 'bg-emerald-500'
    };
  };

  const getCTR = (banner) => {
    if (!banner.viewCount || banner.viewCount === 0) return '0%';
    return ((banner.clickCount / banner.viewCount) * 100).toFixed(1) + '%';
  };

  const filteredBanners = banners.filter((b) => {
    if (filterPosition === 'all') return true;
    return b.position === filterPosition;
  });

  const liveBannersCount = banners.filter((b) => {
    if (!b.isActive) return false;
    const now = new Date();
    const start = b.startDate ? new Date(b.startDate) : null;
    const end = b.endDate ? new Date(b.endDate) : null;
    return (!start || now >= start) && (!end || now <= end);
  }).length;

  const totalImpressions = banners.reduce((sum, b) => sum + (b.viewCount || 0), 0);
  const totalClicks = banners.reduce((sum, b) => sum + (b.clickCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 pb-28 md:pb-6 space-y-5">
      {/* Navigation Breadcrumb */}
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
        <span className="text-fv-heading dark:text-white font-semibold">Banners CMS</span>
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-fv-heading dark:text-white flex items-center gap-2.5">
            Promotional Banner Carousel CMS
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-fv-primary/10 text-fv-primary font-bold">
              {banners.length} Banners
            </span>
          </h1>
          <p className="text-xs text-fv-muted mt-0.5">
            Contentful / Webflow Visual Merchandising: Drag-and-drop sequencing, dual desktop/mobile slots, scheduling & deep links
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchBanners()}
            className="p-2.5 rounded-xl border border-fv-border hover:bg-fv-surface dark:hover:bg-gray-800 text-fv-heading dark:text-gray-200 transition-colors"
            title="Refresh Banners"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => handleOpenDialog()}
            className="px-4 py-2.5 bg-fv-primary text-white rounded-xl hover:bg-fv-primary-dark transition-colors font-bold text-xs flex items-center gap-2 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Banner</span>
          </button>
        </div>
      </div>

      {/* CMS Analytics Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fv-muted">Total Carousel Slides</span>
            <Layers className="w-4 h-4 text-fv-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-fv-heading dark:text-white mt-1">
            {banners.length}
          </p>
          <p className="text-[11px] text-fv-muted mt-0.5">Stored banner creative assets</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fv-muted">Live on Storefront</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {liveBannersCount}
          </p>
          <p className="text-[11px] text-fv-muted mt-0.5">Active & within schedule</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fv-muted">Total Impressions</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-fv-heading dark:text-white mt-1">
            {totalImpressions.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-fv-muted mt-0.5">Storefront hero views</p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-fv-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-fv-muted">Click-Through Rate</span>
            <MousePointer className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1">
            {totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) + '%' : '0%'}
          </p>
          <p className="text-[11px] text-fv-muted mt-0.5">{totalClicks.toLocaleString('en-IN')} total clicks</p>
        </div>
      </div>

      {/* Position Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'All Placements' },
          { id: 'hero', label: 'Hero Carousel (Top)' },
          { id: 'middle', label: 'Middle Promotional' },
          { id: 'bottom', label: 'Bottom Showcase' },
          { id: 'sidebar', label: 'Sidebar Highlights' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterPosition(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterPosition === tab.id
                ? 'bg-fv-primary text-white shadow-xs'
                : 'bg-white dark:bg-gray-800 border border-fv-border text-fv-muted hover:text-fv-heading'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banners Grid / Reorderable Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-white dark:bg-gray-800 rounded-2xl border border-fv-border animate-pulse"
            />
          ))}
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-fv-border p-12 text-center">
          <ImageIcon className="w-12 h-12 text-fv-muted mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-fv-heading dark:text-white">No Banners Found</h3>
          <p className="text-xs text-fv-muted mt-1">
            {filterPosition !== 'all'
              ? 'No promotional banners created for this placement position yet.'
              : 'Create your first promotional carousel banner to display offers on the storefront.'}
          </p>
          <button
            type="button"
            onClick={() => handleOpenDialog()}
            className="mt-4 px-4 py-2 bg-fv-primary text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Create First Banner
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-fv-muted px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <GripVertical className="w-3.5 h-3.5" />
              Drag cards or use Up / Down buttons to reorder slide sequence
            </span>
            <span>{filteredBanners.length} banners shown</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBanners.map((banner, index) => {
              const status = getCampaignStatus(banner);

              return (
                <div
                  key={banner._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border border-fv-border shadow-xs overflow-hidden flex flex-col transition-all hover:shadow-md ${
                    draggedIndex === index ? 'opacity-40 border-dashed border-fv-primary scale-98' : ''
                  }`}
                >
                  {/* Banner Image Preview Container */}
                  <div className="relative aspect-[16/6] bg-fv-surface dark:bg-gray-900 overflow-hidden group">
                    <img
                      src={getBannerImageUrl(banner.imageUrl, banner.title)}
                      alt={banner.title}
                      onError={(e) => handleImageError(e, getBannerImageUrl(banner.imageUrl, banner.title))}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />

                    {/* Gradient overlay simulating customer storefront rendering */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-xs text-white uppercase tracking-wider">
                          Position: {banner.position || 'hero'}
                        </span>
                        {banner.mobileImageUrl && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/80 text-white flex items-center gap-1">
                            <Smartphone className="w-2.5 h-2.5" /> Mobile Crop
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-white mt-1 drop-shadow-sm leading-tight line-clamp-1">
                        {banner.title}
                      </h3>
                      {banner.description && (
                        <p className="text-xs text-white/90 line-clamp-1 mt-0.5">{banner.description}</p>
                      )}
                    </div>

                    {/* Reorder Sequence Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl text-xs font-mono font-bold shadow-xs">
                      <GripVertical className="w-3.5 h-3.5 text-white/70" />
                      <span>#{index + 1}</span>
                    </div>

                    {/* Campaign Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border backdrop-blur-xs ${status.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        <span>{status.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    {/* Routing Link & Schedule Dates */}
                    <div className="space-y-1.5 text-xs">
                      {banner.linkUrl && (
                        <div className="flex items-center gap-1.5 text-fv-muted truncate">
                          <LinkIcon className="w-3.5 h-3.5 shrink-0 text-fv-primary" />
                          <span className="text-fv-heading dark:text-gray-200 font-semibold truncate">
                            {banner.linkUrl}
                          </span>
                        </div>
                      )}

                      {(banner.startDate || banner.endDate) && (
                        <div className="flex items-center gap-1.5 text-fv-muted">
                          <Calendar className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                          <span>
                            {banner.startDate ? new Date(banner.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Always'}
                            {' → '}
                            {banner.endDate ? new Date(banner.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No Expiry'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Performance Analytics Strip */}
                    <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-fv-surface/60 dark:bg-gray-750 border border-fv-border text-center text-xs">
                      <div>
                        <span className="text-[10px] text-fv-muted uppercase font-semibold">Views</span>
                        <p className="font-bold text-fv-heading dark:text-white mt-0.5">
                          {banner.viewCount || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-fv-muted uppercase font-semibold">Clicks</span>
                        <p className="font-bold text-fv-heading dark:text-white mt-0.5">
                          {banner.clickCount || 0}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-fv-muted uppercase font-semibold">CTR</span>
                        <p className="font-bold text-fv-primary mt-0.5">{getCTR(banner)}</p>
                      </div>
                    </div>

                    {/* Bottom Action Controls */}
                    <div className="pt-2 border-t border-fv-border/60 flex items-center justify-between gap-2">
                      {/* Active Toggle Switch */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(banner)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            banner.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                          title={banner.isActive ? 'Active on store • Click to deactivate' : 'Deactivated • Click to activate'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              banner.isActive ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-xs font-semibold text-fv-muted">
                          {banner.isActive ? 'Visible' : 'Hidden'}
                        </span>
                      </div>

                      {/* Sequence Buttons & Edit/Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMove(index, 'up')}
                          className="p-1.5 rounded-lg border border-fv-border hover:bg-fv-surface text-fv-heading dark:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Slide Up / Left in Carousel"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={index === filteredBanners.length - 1}
                          onClick={() => handleMove(index, 'down')}
                          className="p-1.5 rounded-lg border border-fv-border hover:bg-fv-surface text-fv-heading dark:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Move Slide Down / Right in Carousel"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDialog(banner)}
                          className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBannerToDelete(banner)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visual Merchandising Modal: Dual Cloudinary Image Uploader & Deep-Link Config */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full my-6 border border-fv-border overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-fv-border flex items-center justify-between bg-fv-surface/40 dark:bg-gray-750">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-fv-primary" />
                <h3 className="text-base font-bold text-fv-heading dark:text-white">
                  {editingBanner ? 'Edit Promotional Banner' : 'Create Promotional Carousel Banner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseDialog}
                className="p-1 rounded-lg text-fv-muted hover:text-fv-heading hover:bg-fv-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Dual Cloudinary Image Uploader */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-fv-heading dark:text-white uppercase tracking-wider">
                  Visual Media Assets (Dual Responsive Slots) *
                </label>

                {/* 1. Desktop Image Slot (16:6) */}
                <div className="p-3.5 rounded-2xl bg-fv-surface/60 dark:bg-gray-750 border border-fv-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fv-heading dark:text-white flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-fv-primary" />
                      Desktop Banner Image (Aspect Ratio 16:6 / 2500×547px) *
                    </span>
                    <span className="text-[11px] font-mono text-fv-muted">q_auto,f_auto</span>
                  </div>

                  {formData.imageUrl ? (
                    <div className="relative aspect-[16/6] rounded-xl overflow-hidden border border-fv-border group">
                      <img
                        src={getBannerImageUrl(formData.imageUrl, formData.title)}
                        alt="Desktop Preview"
                        onError={(e) => handleImageError(e, getBannerImageUrl(formData.imageUrl, formData.title))}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => desktopFileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-gray-800 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-100"
                        >
                          Replace Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, imageUrl: '' }))}
                          className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => desktopFileInputRef.current?.click()}
                      className="border-2 border-dashed border-fv-border hover:border-fv-primary/60 rounded-xl p-5 text-center cursor-pointer bg-white dark:bg-gray-800 transition-colors"
                    >
                      <Upload className={`w-8 h-8 mx-auto mb-1.5 text-fv-muted ${uploadingSlot === 'desktop' ? 'animate-bounce text-fv-primary' : ''}`} />
                      <p className="text-xs font-bold text-fv-heading dark:text-white">
                        {uploadingSlot === 'desktop' ? 'Uploading to Cloudinary CDN...' : 'Click to Upload Desktop Banner'}
                      </p>
                      <p className="text-[11px] text-fv-muted mt-0.5">Recommended 2500 × 547 px (Max 10MB JPG, PNG, WebP)</p>
                    </div>
                  )}

                  <input
                    ref={desktopFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'desktop')}
                    className="hidden"
                  />

                  {/* Fallback direct URL input */}
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="Or paste direct Cloudinary / HTTPS image URL"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-fv-border rounded-xl text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary"
                  />
                </div>

                {/* 2. Mobile Image Slot (4:3) */}
                <div className="p-3.5 rounded-2xl bg-fv-surface/60 dark:bg-gray-750 border border-fv-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fv-heading dark:text-white flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-emerald-500" />
                      Mobile Phone Image (Aspect Ratio 4:3 / Optional)
                    </span>
                    <span className="text-[11px] text-fv-muted">Serves responsive &lt;picture&gt;</span>
                  </div>

                  {formData.mobileImageUrl ? (
                    <div className="relative aspect-[4/3] max-w-[200px] rounded-xl overflow-hidden border border-fv-border group">
                      <img
                        src={formData.mobileImageUrl}
                        alt="Mobile Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => mobileFileInputRef.current?.click()}
                          className="px-2 py-1 bg-white text-gray-800 text-[10px] font-bold rounded shadow-sm hover:bg-gray-100"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, mobileImageUrl: '' }))}
                          className="px-2 py-1 bg-rose-600 text-white text-[10px] font-bold rounded shadow-sm hover:bg-rose-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => mobileFileInputRef.current?.click()}
                      className="border-2 border-dashed border-fv-border hover:border-emerald-500/60 rounded-xl p-4 text-center cursor-pointer bg-white dark:bg-gray-800 transition-colors"
                    >
                      <Smartphone className={`w-6 h-6 mx-auto mb-1 text-fv-muted ${uploadingSlot === 'mobile' ? 'animate-bounce text-emerald-500' : ''}`} />
                      <p className="text-xs font-bold text-fv-heading dark:text-white">
                        {uploadingSlot === 'mobile' ? 'Uploading Mobile Crop...' : 'Upload Mobile Specific Banner (4:3)'}
                      </p>
                      <p className="text-[11px] text-fv-muted mt-0.5">Optimized for smartphones • 800 × 600 px</p>
                    </div>
                  )}

                  <input
                    ref={mobileFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'mobile')}
                    className="hidden"
                  />

                  <input
                    type="url"
                    name="mobileImageUrl"
                    value={formData.mobileImageUrl}
                    onChange={handleInputChange}
                    placeholder="Or paste direct mobile image URL"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-fv-border rounded-xl text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary"
                  />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                    Promotional Headline *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Monsoon Sowing Festival 20% Off"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-fv-border rounded-xl text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                    Subtitle / Promotional Callout
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="e.g., Use Code SEEDFEST at checkout"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-fv-border rounded-xl text-fv-heading dark:text-white focus:outline-hidden focus:ring-2 focus:ring-fv-primary min-h-[40px]"
                  />
                </div>
              </div>

              {/* Target Deep-Link Routing */}
              <div className="p-3.5 rounded-2xl bg-fv-surface/60 dark:bg-gray-750 border border-fv-border space-y-2">
                <label className="block text-xs font-bold text-fv-heading dark:text-white">
                  Target Deep-Link Routing
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-fv-muted mb-1">Link Destination Preset</label>
                    <select
                      value={
                        formData.linkUrl === '/shop'
                          ? 'shop'
                          : formData.linkUrl === '/combos'
                          ? 'combos'
                          : categories.some((c) => formData.linkUrl.includes(c.slug || c.name))
                          ? 'category'
                          : 'custom'
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'shop') setFormData((p) => ({ ...p, linkUrl: '/shop', linkType: 'internal' }));
                        else if (val === 'combos') setFormData((p) => ({ ...p, linkUrl: '/combos', linkType: 'internal' }));
                        else if (val === 'category' && categories.length > 0) {
                          setFormData((p) => ({ ...p, linkUrl: `/shop?category=${encodeURIComponent(categories[0].name)}`, linkType: 'category' }));
                        }
                      }}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-fv-border rounded-xl text-fv-heading dark:text-white min-h-[40px]"
                    >
                      <option value="shop">All Store Products (/shop)</option>
                      <option value="combos">Combo Packs & Offers (/combos)</option>
                      <option value="category">Category Deep-Link</option>
                      <option value="custom">Custom URL Link</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-fv-muted mb-1">Destination URL</label>
                    <input
                      type="text"
                      name="linkUrl"
                      value={formData.linkUrl}
                      onChange={handleInputChange}
                      placeholder="/shop?category=leafy-greens"
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-fv-border rounded-xl text-fv-heading dark:text-white font-mono min-h-[40px]"
                    />
                  </div>
                </div>

                {categories.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                    <span className="text-fv-muted">Quick Category Links:</span>
                    {categories.slice(0, 4).map((cat) => (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() =>
                          setFormData((p) => ({
                            ...p,
                            linkUrl: `/shop?category=${encodeURIComponent(cat.name)}`,
                            linkType: 'category'
                          }))
                        }
                        className="px-2 py-0.5 rounded-lg bg-white dark:bg-gray-800 border border-fv-border hover:border-fv-primary text-fv-heading dark:text-gray-200"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Placement & Sequence Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                    Placement Position
                  </label>
                  <select
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-fv-border rounded-xl text-fv-heading dark:text-white min-h-[40px]"
                  >
                    <option value="hero">Hero Carousel (Homepage Top)</option>
                    <option value="top">Top Banner Bar</option>
                    <option value="middle">Middle Promo Strip</option>
                    <option value="bottom">Bottom Showcase</option>
                    <option value="sidebar">Sidebar Highlights</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                    Sequence Order Index
                  </label>
                  <input
                    type="number"
                    name="order"
                    min="0"
                    value={formData.order}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-fv-border rounded-xl text-fv-heading dark:text-white font-mono min-h-[40px]"
                  />
                </div>
              </div>

              {/* Campaign Schedule Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-fv-border rounded-xl text-fv-heading dark:text-white min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-fv-heading dark:text-white mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-fv-border rounded-xl text-fv-heading dark:text-white min-h-[40px]"
                  />
                </div>
              </div>

              {/* Active Toggle Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-fv-surface/60 dark:bg-gray-750 border border-fv-border">
                <div>
                  <p className="text-xs font-bold text-fv-heading dark:text-white">Active Storefront Visibility</p>
                  <p className="text-[11px] text-fv-muted">Display banner on storefront when within scheduled dates</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, isActive: !p.isActive }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    formData.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      formData.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-fv-border">
                <button
                  type="button"
                  onClick={handleCloseDialog}
                  className="px-4 py-2.5 text-xs font-semibold text-fv-heading dark:text-gray-200 border border-fv-border rounded-xl hover:bg-fv-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || Boolean(uploadingSlot)}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-fv-primary hover:bg-fv-primary-dark rounded-xl transition-colors shadow-xs disabled:opacity-50"
                >
                  {isSaving ? 'Saving Banner...' : editingBanner ? 'Save Changes' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={Boolean(bannerToDelete)}
        title="Delete Promotional Banner?"
        message={
          bannerToDelete
            ? `Are you sure you want to remove "${bannerToDelete.title}"? This banner will be moved to Delete History and can be restored at any time.`
            : ''
        }
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Banner'}
        cancelLabel="Keep Banner"
        isDanger={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteBanner}
        onClose={() => {
          if (!isDeleting) setBannerToDelete(null);
        }}
      />
    </div>
  );
}

export default AdminBanners;
