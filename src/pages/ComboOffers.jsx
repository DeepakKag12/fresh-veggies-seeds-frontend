import React, { useEffect, useState } from 'react';
import { Loader, ShoppingCart, Package, X } from 'lucide-react';
import { cachedGet } from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const ComboOffers = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    try {
      const response = await cachedGet('/combos');
      setCombos(response.data.data);
    } catch (error) {
      console.error('Error fetching combos:', error);
    }
    setLoading(false);
  };

  const handleAddToCart = (combo) => {
    addToCart(combo, 1, true);
  };

  // Calculate actual original price from included products
  const calculateOriginalPrice = (combo) => {
    // An explicit originalPrice is what the admin set the combo up against, so
    // it wins. Summing the members' current (already discounted) prices is only
    // a fallback, and can legitimately come out below the combo price.
    if (combo.originalPrice > 0) return combo.originalPrice;

    if (!combo.includedProducts || combo.includedProducts.length === 0) {
      return combo.price;
    }

    const total = combo.includedProducts.reduce((sum, item) => {
      const productPrice = item.productId?.price || 0;
      const quantity = item.quantity || 1;
      return sum + (productPrice * quantity);
    }, 0);
    
    return total;
  };

  // A saving is only a saving when it is positive.
  const calculateSaving = (combo) =>
    Math.max(0, calculateOriginalPrice(combo) - combo.price);

  // ComboCard component with auto-rotating images
  const ComboCard = ({ combo }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    // A combo can be created without imagery, and a member product's URL can
    // die on its own; either way the card must not show a broken-image icon.
    const [imgFailed, setImgFailed] = useState(false);
    
    // Get all product images from combo - use includedProducts from backend
    const allImages = combo.includedProducts?.map(item => item.productId?.images?.[0]).filter(Boolean) || [];
    const images = allImages.length > 0 ? allImages : [combo.images?.[0] || 'https://via.placeholder.com/400x240?text=Combo+Pack'];
    
    useEffect(() => {
      if (images.length > 1) {
        const interval = setInterval(() => {
          setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 1000); // Change image every 1 second
        
        return () => clearInterval(interval);
      }
    }, [images.length]);

    return (
      <div
       className="bg-white rounded-[12px]  overflow-hidden hover:shadow-xl transition-all group cursor-pointer"
        onClick={() => setSelectedCombo(combo)}
      >
        <div className="relative h-48 overflow-hidden bg-fv-surface">
          {images[currentImageIndex] && !imgFailed ? (
            <img
              src={images[currentImageIndex]}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105
                         motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fv-cream to-fv-surface">
              <Package className="h-12 w-12 text-fv-primary/25" aria-hidden="true" />
            </div>
          )}
          {combo.discount > 0 && (
            <div className="absolute left-3 top-3 rounded-[6px] bg-fv-yellow px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-fv-primary">
              {combo.discount}% off
            </div>
          )}
          <div className="absolute right-3 top-3 rounded-[6px] bg-fv-primary px-2.5 py-1 text-[11px] font-medium text-white">
            {combo.comboType}
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, idx) => (
                <div
                  key={idx}
                 className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-serif text-[20px] font-semibold text-fv-heading  mb-2 line-clamp-2">
            {combo.name}
          </h3>
          
          <p className="text-sm text-fv-muted  mb-3 line-clamp-2">
            {combo.description}
          </p>

          {combo.features && combo.features.length > 0 && (
            <div className="mb-3 space-y-1">
              {combo.features.slice(0, 3).map((feature, index) => (
                <p key={index} className="text-xs text-fv-muted ">
                  ✓ {feature}
                </p>
              ))}
            </div>
          )}

          <div className="mb-3 p-2 bg-fv-cream dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-fv-primary-dark dark:text-green-400 font-medium">
              {combo.includedProducts?.length || 0} products{calculateSaving(combo) > 0 ? ` \u2022 Save \u20b9${calculateSaving(combo).toFixed(0)}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold text-fv-primary dark:text-green-400">
              ₹{combo.price}
            </span>
            {calculateOriginalPrice(combo) > combo.price && (
              <div className="text-sm text-fv-muted  line-through">
                ₹{calculateOriginalPrice(combo).toFixed(0)}
              </div>
            )}
          </div>

          {user?.role !== 'admin' && combo.stock > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(combo);
              }}
             className="w-full bg-fv-primary hover:bg-fv-primary-dark text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          )}

          {combo.stock === 0 && (
            <div className="w-full bg-gray-300  text-fv-muted  py-2 rounded-lg font-semibold text-center">
              Out of Stock
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="w-12 h-12 text-fv-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fv-page pt-24 pb-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl lg:text-4xl font-bold text-fv-heading  mb-2">
          Combo Packs - Best Value! 🔥
        </h1>
        <p className="text-fv-muted  mb-8">
          Get more for less with our specially curated combo packs for home gardening
        </p>

        {combos.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-24 h-24 mx-auto text-gray-300 dark:text-fv-ink mb-6" />
            <h2 className="text-2xl font-semibold text-fv-heading ">
              No combo packs available
            </h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {combos.map((combo) => (
              <ComboCard key={combo._id} combo={combo} />
            ))}
          </div>
        )}
      </div>

      {/* Combo Detail Modal */}
      {selectedCombo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[12px] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-fv-border  p-4 flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold text-fv-heading ">Combo Details</h2>
              <button
                onClick={() => setSelectedCombo(null)}
               className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Combo Images */}
              <ComboImageSlider combo={selectedCombo} />

              {/* Combo Info */}
              <div className="mt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-fv-heading  mb-2">
                      {selectedCombo.name}
                    </h3>
                    <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedCombo.comboType}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-serif text-[30px] font-semibold text-fv-primary dark:text-green-400">
                      ₹{selectedCombo.price}
                    </div>
                    {calculateOriginalPrice(selectedCombo) > selectedCombo.price && (
                      <div className="text-sm text-fv-muted  line-through">
                        ₹{calculateOriginalPrice(selectedCombo).toFixed(0)}
                      </div>
                    )}
                    {selectedCombo.discount > 0 && (
                      <div className="mt-1 text-sm font-semibold text-fv-primary">
                        Save {selectedCombo.discount}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-fv-heading  mb-2">Description</h4>
                  <p className="text-fv-muted ">{selectedCombo.description}</p>
                </div>

                {/* Features */}
                {selectedCombo.features && selectedCombo.features.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-fv-heading  mb-3">Features</h4>
                    <ul className="space-y-2">
                      {selectedCombo.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-fv-muted ">
                          <span className="text-fv-primary dark:text-green-400 mt-0.5">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Products in Combo */}
                {selectedCombo.includedProducts && selectedCombo.includedProducts.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-fv-heading  mb-3">
                      Products in this Combo ({selectedCombo.includedProducts.length} items)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedCombo.includedProducts.map((item, index) => (
                        <div key={index} className="flex gap-3 p-4 bg-gray-50  rounded-lg border border-fv-border ">
                          <img
                            src={item.productId?.images?.[0] || 'https://via.placeholder.com/80'}
                            alt={item.productId?.name}
                           className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-fv-heading  mb-1 line-clamp-2">
                              {item.productId?.name}
                            </p>
                            <p className="text-sm text-fv-muted  mb-2">
                              Quantity: {item.quantity}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-fv-primary dark:text-green-400">
                                ₹{item.productId?.price}
                              </span>
                              <span className="text-xs text-fv-muted ">
                                × {item.quantity} = ₹{(item.productId?.price * item.quantity).toFixed(0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Total Summary */}
                    <div className="mt-4 p-4 bg-fv-cream dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-fv-ink ">Total Original Price:</span>
                        <span className="text-sm font-semibold text-fv-heading ">₹{calculateOriginalPrice(selectedCombo).toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-fv-ink ">Combo Price:</span>
                        <span className="text-sm font-semibold text-fv-primary dark:text-green-400">₹{selectedCombo.price}</span>
                      </div>
                      <div className="pt-2 border-t border-green-200 dark:border-green-700">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-bold text-fv-primary-dark dark:text-green-400">You Save:</span>
                          <span className="text-lg font-bold text-fv-primary dark:text-green-400">
                            ₹{(calculateOriginalPrice(selectedCombo) - selectedCombo.price).toFixed(0)} ({((calculateOriginalPrice(selectedCombo) - selectedCombo.price) / calculateOriginalPrice(selectedCombo) * 100).toFixed(0)}% OFF)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stock Status */}
                <div className="mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
                    selectedCombo.stock > 0 
                      ? 'bg-fv-cream dark:bg-green-900/20 text-fv-primary-dark dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}>
                    <Package className="w-4 h-4" />
                    <span className="font-medium">
                      {selectedCombo.stock > 0 ? `${selectedCombo.stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </div>

                {/* Add to Cart Button */}
                {user?.role !== 'admin' && selectedCombo.stock > 0 && (
                  <button
                    onClick={() => {
                      handleAddToCart(selectedCombo);
                      setSelectedCombo(null);
                    }}
                   className="w-full bg-fv-primary hover:bg-fv-primary-dark text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors text-lg"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
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

// ComboImageSlider component for modal
const ComboImageSlider = ({ combo }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Get all product images from combo - use includedProducts from backend
  const allImages = combo.includedProducts?.map(item => item.productId?.images?.[0]).filter(Boolean) || [];
  const images = allImages.length > 0 ? allImages : [combo.images?.[0] || 'https://via.placeholder.com/400x240?text=Combo+Pack'];
  
  useEffect(() => {
    if (images.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1000); // Change image every 1 second
      
      return () => clearInterval(interval);
    }
  }, [images.length]);

  return (
    <div className="relative h-80 bg-gray-100  rounded-lg overflow-hidden">
      <img
        src={images[currentImageIndex]}
        alt={combo.name}
       className="w-full h-full object-contain"
      />
      {combo.discount > 0 && (
        <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold">
          {combo.discount}% OFF
        </div>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
             className={`w-3 h-3 rounded-full transition-all ${
                idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      )}
      {/* Image counter */}
      <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
        {currentImageIndex + 1} / {images.length}
      </div>
    </div>
  );
};

export default ComboOffers;
