import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Loader,
  ShoppingCart,
  Package,
  X,
  Check,
  ArrowLeft,
  ChevronRight,
  Plus,
  AlertCircle,
  Layers,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { cachedGet } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  getProductImageUrl,
  handleImageError,
  DEFAULT_COMBO_IMAGE,
  DEFAULT_PRODUCT_IMAGE,
} from '../utils/imageFallback';

/**
 * Amazon ("Frequently Bought Together") & HelloFresh Benchmark:
 * Combo Pack Discovery & Curated Bundles (FEAT-007)
 * - Visual Cluster showing plus icons between products (Product A + Product B + Product C)
 * - Transparent price breakdown: Total individual value strike-through vs combo package price
 * - "You Save ₹X (Y% OFF)" callout badge
 * - 1-Click "Add Bundle to Cart"
 * - Bundle stock dependency tracking (unavailable if any constituent product is depleted)
 */

// Helper to calculate total retail value of included products
const calculateOriginalPrice = (combo) => {
  if (combo.originalPrice > 0) return combo.originalPrice;
  if (!combo.includedProducts || combo.includedProducts.length === 0) {
    return combo.price;
  }
  return combo.includedProducts.reduce((sum, item) => {
    const productPrice = item.productId?.price || 0;
    const quantity = item.quantity || 1;
    return sum + productPrice * quantity;
  }, 0);
};

const calculateSaving = (combo) =>
  Math.max(0, calculateOriginalPrice(combo) - combo.price);

/**
 * Amazon / HelloFresh Benchmark Combo Card
 * Renders the visual cluster with connecting plus badges between items
 */
const ComboCard = ({ combo, onSelect, onAddToCart, isAdmin }) => {
  const items = combo.includedProducts || [];
  const origPrice = calculateOriginalPrice(combo);
  const saving = calculateSaving(combo);
  const savingPct = origPrice > 0 ? Math.round((saving / origPrice) * 100) : 0;

  // Stock availability check (constituent stock dependency)
  const isAvailable = combo.isAvailable !== false && (combo.effectiveStock ?? combo.stock) > 0;
  const stockCount = combo.effectiveStock ?? combo.stock ?? 0;
  const isLowStock = isAvailable && stockCount <= 5;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border transition-all duration-200 group flex flex-col justify-between shadow-2xs hover:shadow-md cursor-pointer ${
        isAvailable
          ? 'border-fv-border hover:border-emerald-400 dark:hover:border-emerald-600'
          : 'border-rose-200 dark:border-rose-900/60 opacity-90'
      }`}
      onClick={() => onSelect(combo)}
    >
      <div>
        {/* Amazon "Frequently Bought Together" Visual Cluster */}
        <div className="p-4 bg-gradient-to-b from-[#F7FAF8] to-white dark:from-gray-900/80 dark:to-gray-800 border-b border-fv-border/70">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              <Layers className="w-2.5 h-2.5 text-slate-500" />
              {combo.comboType || 'Curated Kit'}
            </span>
            {savingPct > 0 && (
              <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider shadow-2xs">
                Save {savingPct}%
              </span>
            )}
          </div>

          {/* Visual cluster: product thumbnails connected with plus badges */}
          <div className="flex items-center justify-center gap-1.5 py-2 overflow-x-auto no-scrollbar">
            {items.slice(0, 3).map((item, idx) => {
              const p = item.productId;
              const img = p ? getProductImageUrl(p) : (combo.images?.[0] || DEFAULT_COMBO_IMAGE);
              return (
                <React.Fragment key={p?._id || idx}>
                  <div
                    className="relative flex flex-col items-center shrink-0 group/item"
                    title={`${p?.name || 'Item'} (${item.quantity || 1}x)`}
                  >
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden border border-fv-border bg-white dark:bg-gray-800 shadow-2xs p-1">
                      <img
                        src={img}
                        alt={p?.name || ''}
                        loading="lazy"
                        onError={(e) => handleImageError(e, DEFAULT_PRODUCT_IMAGE)}
                        className="w-full h-full object-cover rounded-lg group-hover/item:scale-105 transition-transform"
                      />
                    </div>
                    {item.quantity > 1 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-2xs">
                        {item.quantity}x
                      </span>
                    )}
                  </div>

                  {/* Connecting Plus Sign */}
                  {idx < Math.min(items.length, 3) - 1 && (
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {items.length > 3 && (
              <>
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                  <Plus className="w-3 h-3 stroke-[2.5]" />
                </div>
                <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl border border-dashed border-fv-border flex items-center justify-center bg-white dark:bg-gray-800 text-[11px] font-bold text-fv-muted shrink-0">
                  +{items.length - 3} more
                </div>
              </>
            )}
          </div>
        </div>

        {/* Card Details */}
        <div className="p-4">
          <h3 className="text-[18px] font-bold text-fv-heading leading-snug line-clamp-1 group-hover:text-fv-primary transition-colors">
            {combo.name}
          </h3>

          <p className="text-xs text-fv-muted mt-1 line-clamp-2 leading-relaxed">
            {combo.description}
          </p>

          {/* Included Items Pills */}
          <div className="mt-3 flex flex-wrap gap-1">
            {items.map((item, idx) => (
              <span
                key={item.productId?._id || idx}
                className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:text-gray-300"
              >
                <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate max-w-[120px]">{item.productId?.name || 'Item'}</span>
                <span className="text-gray-400">×{item.quantity || 1}</span>
              </span>
            ))}
          </div>

          {/* Pricing Breakdown: Strike-through Sum vs Bundle Price */}
          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60">
            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-[22px] font-extrabold text-[#00B566]">
                  ₹{combo.price?.toLocaleString('en-IN')}
                </span>
                {origPrice > combo.price && (
                  <s className="text-[13px] text-gray-400 font-normal">
                    ₹{origPrice?.toLocaleString('en-IN')}
                  </s>
                )}
              </div>

              {saving > 0 && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/70 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800">
                  Save ₹{saving.toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Stock / Availability Status */}
            <div className="mt-2 flex items-center justify-between text-[11px]">
              {isAvailable ? (
                isLowStock ? (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                    <Flame className="w-3 h-3 text-amber-600" />
                    Only {stockCount} kits left!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    In stock ({stockCount} kits available)
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                  <AlertCircle className="w-3 h-3" />
                  {combo.unavailableReason || 'Temporarily Unavailable'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Action Bar */}
      <div className="p-4 pt-0">
        {!isAdmin && isAvailable ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(combo);
            }}
            className="w-full h-11 bg-fv-primary hover:bg-fv-primary-dark text-white rounded-xl font-semibold text-[13px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-xs cursor-pointer shimmer-btn"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add Bundle to Cart</span>
          </button>
        ) : !isAvailable ? (
          <button
            type="button"
            disabled
            className="w-full h-11 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-1.5 cursor-not-allowed"
          >
            <span>Temporarily Unavailable</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

const ComboOffers = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const response = await cachedGet('/combos');
      setCombos(response.data.data || []);
    } catch (error) {
      console.error('Error fetching combos:', error);
      toast.error('Failed to load combo kits');
    }
    setLoading(false);
  };

  const handleAddToCart = (combo) => {
    if (combo.isAvailable === false) {
      toast.error('This combo is temporarily unavailable due to constituent item stock.');
      return;
    }
    addToCart(combo, 1, true);
    toast.success(`"${combo.name}" bundle added to cart!`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] bg-fv-page">
        <Loader className="w-10 h-10 text-fv-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fv-page pt-6 pb-20">
      <div className="container mx-auto px-4 max-w-[1500px]">
        {/* Breadcrumb & Back Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs text-fv-muted">
              <li>
                <Link to="/" className="hover:text-fv-primary hover:underline font-medium">
                  Shop
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="h-3 w-3" />
              </li>
              <li aria-current="page" className="font-semibold text-fv-heading">
                Combos & Curated Bundles
              </li>
            </ol>
          </nav>
          <button
            type="button"
            onClick={() => {
              if (location.state?.from) {
                navigate(location.state.from);
              } else if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-fv-border bg-white dark:bg-gray-800 hover:bg-fv-surface text-xs font-semibold text-fv-heading transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-fv-primary" />
            <span>Back</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Curated Botanical Kits & Value Bundles</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-fv-heading">
            Gardening Combo Packs & Starter Kits
          </h1>
          <p className="text-sm text-fv-muted mt-1 max-w-2xl">
            Save up to 40% with complementary botanical kits: curated seeds, natural fertilizers, and growing essentials packaged together for complete garden success.
          </p>
        </div>

        {/* Combos Grid */}
        {combos.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-fv-border shadow-xs">
            <Package className="w-16 h-16 mx-auto text-fv-primary/30 mb-4" />
            <h2 className="text-xl font-bold text-fv-heading">
              No combo packs available right now
            </h2>
            <p className="text-xs text-fv-muted mt-1">Check back soon for seasonal starter kits!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {combos.map((combo) => (
              <ComboCard
                key={combo._id}
                combo={combo}
                onSelect={setSelectedCombo}
                onAddToCart={handleAddToCart}
                isAdmin={user?.role === 'admin'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interactive Amazon / HelloFresh Bundle Details Modal */}
      {selectedCombo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedCombo(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-fv-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-b border-fv-border p-4 px-6 flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-fv-heading">
                  Bundle Details & Kit Breakdown
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCombo(null)}
                aria-label="Close modal"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Visual Cluster Banner */}
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/50 dark:from-emerald-950/40 dark:to-gray-900 border border-emerald-100 dark:border-emerald-800/60 p-5">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-2">
                  Frequently Bought Together · {selectedCombo.comboType}
                </span>
                <h3 className="text-2xl font-bold text-fv-heading">
                  {selectedCombo.name}
                </h3>
                <p className="text-xs text-fv-muted mt-1 leading-relaxed">
                  {selectedCombo.description}
                </p>

                {/* Items Cluster in Modal */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 py-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-emerald-100 dark:border-emerald-800">
                  {(selectedCombo.includedProducts || []).map((item, idx, arr) => (
                    <React.Fragment key={item.productId?._id || idx}>
                      <div className="flex items-center gap-2">
                        <img
                          src={getProductImageUrl(item.productId)}
                          alt={item.productId?.name || ''}
                          onError={(e) => handleImageError(e, DEFAULT_PRODUCT_IMAGE)}
                          className="w-12 h-12 rounded-lg object-cover border border-fv-border"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1 max-w-[120px]">
                            {item.productId?.name}
                          </p>
                          <p className="text-[10px] text-gray-500">Qty: {item.quantity || 1}</p>
                        </div>
                      </div>
                      {idx < arr.length - 1 && (
                        <span className="text-emerald-600 font-bold px-1">+</span>
                      )}
                    </React.Fragment>
                  ))}
                  <span className="text-fv-primary font-bold px-1">=</span>
                  <div className="text-left pl-1">
                    <span className="text-xs font-extrabold text-[#00B566] block">
                      ₹{selectedCombo.price}
                    </span>
                    <span className="text-[10px] text-gray-400 line-through">
                      ₹{calculateOriginalPrice(selectedCombo)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Products in this Kit Table */}
              <div className="mt-6">
                <h4 className="text-sm font-bold text-fv-heading uppercase tracking-wider mb-3">
                  Products Included in This Kit ({selectedCombo.includedProducts?.length || 0} Items)
                </h4>
                <div className="divide-y divide-gray-100 dark:divide-gray-700/60 border border-fv-border rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                  {(selectedCombo.includedProducts || []).map((item, idx) => {
                    const p = item.productId;
                    const childInStock = p && !p.isDeleted && p.isActive !== false && p.stock >= (item.quantity || 1);
                    return (
                      <div key={p?._id || idx} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={p?.images?.[0] || '/sandbox-assets/guides/guide_1.webp'}
                            alt={p?.name || ''}
                            className="w-12 h-12 rounded-lg object-cover border border-fv-border shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-fv-heading truncate">
                              {p?.name || 'Botanical Item'}
                            </p>
                            <p className="text-[11px] text-fv-muted mt-0.5">
                              Quantity in kit: {item.quantity || 1} unit(s)
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-gray-900 dark:text-white block">
                            ₹{((p?.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}
                          </span>
                          {childInStock ? (
                            <span className="text-[10px] text-emerald-600 font-medium">In Stock</span>
                          ) : (
                            <span className="text-[10px] text-rose-600 font-bold">Out of stock</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pricing & Savings Summary */}
              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 to-green-50/60 dark:from-emerald-950/40 dark:to-green-950/30 border border-emerald-100 dark:border-emerald-800">
                <div className="flex justify-between items-center text-xs text-fv-muted mb-1.5">
                  <span>Total Individual Retail Price:</span>
                  <span className="line-through">₹{calculateOriginalPrice(selectedCombo).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold text-fv-heading mb-2">
                  <span>Discounted Bundle Price:</span>
                  <span className="text-[20px] font-extrabold text-[#00B566]">
                    ₹{selectedCombo.price?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    Your Total Bundle Savings:
                  </span>
                  <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                    Save ₹{calculateSaving(selectedCombo).toLocaleString('en-IN')} (
                    {Math.round((calculateSaving(selectedCombo) / calculateOriginalPrice(selectedCombo)) * 100)}% OFF)
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6">
                {user?.role !== 'admin' && selectedCombo.isAvailable !== false ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(selectedCombo);
                      setSelectedCombo(null);
                    }}
                    className="w-full h-12 bg-fv-primary hover:bg-fv-primary-dark text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-xs cursor-pointer shimmer-btn"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add Entire Bundle to Cart (₹{selectedCombo.price})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full h-12 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Temporarily Unavailable (Item depleted)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComboOffers;
