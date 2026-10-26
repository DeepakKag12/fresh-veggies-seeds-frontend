import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sprout, ChevronLeft, ChevronRight, Maximize2, X, ZoomIn } from 'lucide-react';
import { DEFAULT_PRODUCT_IMAGE } from '../../utils/imageFallback';

/**
 * Gymshark / BigBasket Benchmark High-Resolution Image Gallery with Hover Lens Zoom (FEAT-005)
 * - Desktop hover lens zoom with coordinate tracking (transform-origin + scale 2.2x)
 * - 1-Click fullscreen high-resolution lightbox modal
 * - Interactive carousel navigation with Chevrons and thumbnail rail
 * - Responsive mobile horizontal swipe rail + photo index indicator
 * - Resilient broken-image fallback
 */
const ProductGallery = ({ images = [], name = 'Product' }) => {
  const [active, setActive] = useState(0);
  const [dead, setDead] = useState(() => new Set());
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const containerRef = useRef(null);
  const FALLBACK_IMAGE = DEFAULT_PRODUCT_IMAGE;

  const usable = images.filter((_, i) => !dead.has(i));
  const activeSrc = (images[active] && !dead.has(active) ? images[active] : usable[0]) || FALLBACK_IMAGE;

  const markDead = useCallback((i) => {
    setDead((prev) => new Set(prev).add(i));
  }, []);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setActive((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setActive((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Desktop hover zoom lens coordinate calculation
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  };

  const handleMouseEnter = () => setIsZooming(true);
  const handleMouseLeave = () => {
    setIsZooming(false);
    setZoomPos({ x: 50, y: 50 });
  };

  // Lightbox keyboard controls
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handleNext, handlePrev]);

  return (
    <div className="flex flex-col-reverse lg:flex-row gap-4">
      {/* Thumbnail Reel (Horizontal on mobile, vertical on desktop) */}
      {usable.length > 1 && (
        <ul
          className="flex lg:flex-col gap-2.5 overflow-x-auto lg:overflow-y-auto no-scrollbar py-1 lg:py-0 lg:w-[84px] shrink-0"
          role="tablist"
          aria-label="Product thumbnails"
        >
          {images.map((src, i) =>
            dead.has(i) ? null : (
              <li key={src} role="presentation">
                <button
                  type="button"
                  role="tab"
                  onClick={() => setActive(i)}
                  aria-label={`Show image ${i + 1} of ${usable.length}`}
                  aria-selected={i === active}
                  className={`relative block h-16 w-16 lg:h-20 lg:w-20 overflow-hidden rounded-xl bg-fv-surface transition-all duration-200 cursor-pointer ${
                    i === active
                      ? 'ring-2 ring-fv-primary shadow-xs scale-[0.98]'
                      : 'ring-1 ring-fv-border opacity-70 hover:opacity-100 hover:ring-fv-primary/50'
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={() => markDead(i)}
                    className="h-full w-full object-cover"
                  />
                </button>
              </li>
            )
          )}
        </ul>
      )}

      {/* Main High-Resolution Image Container with Hover Lens Zoom */}
      <div className="relative min-w-0 flex-1">
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={() => setIsLightboxOpen(true)}
          className="group relative aspect-square w-full overflow-hidden rounded-2xl border border-fv-border bg-fv-surface cursor-zoom-in select-none shadow-xs"
        >
          {activeSrc ? (
            <img
              key={activeSrc}
              src={activeSrc}
              alt={name}
              loading="eager"
              decoding="async"
              onError={() => markDead(active)}
              style={
                isZooming
                  ? {
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      transform: 'scale(2.2)',
                    }
                  : {
                      transformOrigin: 'center center',
                      transform: 'scale(1)',
                    }
              }
              className="h-full w-full object-cover transition-transform duration-150 ease-out will-change-transform"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Sprout className="h-20 w-20 text-fv-primary/20" aria-hidden="true" />
            </div>
          )}

          {/* Hover Zoom Hint Badge (Desktop) */}
          <div className="pointer-events-none absolute bottom-3 left-3 hidden sm:flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Hover to zoom · Click to enlarge</span>
          </div>

          {/* Image Counter Badge */}
          {usable.length > 1 && (
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white">
              {active + 1} / {usable.length}
            </div>
          )}

          {/* Expand Lightbox Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(true);
            }}
            aria-label="View full screen image"
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 shadow-sm transition-all hover:bg-white hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-xs"
          >
            <Maximize2 className="h-4 w-4" />
          </button>

          {/* Chevron Overlays for Carousel (Desktop & Mobile) */}
          {usable.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="Previous image"
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 dark:bg-gray-800/85 text-fv-primary shadow-sm opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-white hover:scale-105 active:scale-90 cursor-pointer"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="Next image"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 dark:bg-gray-800/85 text-fv-primary shadow-sm opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-white hover:scale-105 active:scale-90 cursor-pointer"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lightbox Modal (Gymshark/Amazon Fullscreen View) */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged product image viewer"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            aria-label="Close fullscreen view"
            className="absolute top-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>

          <div
            className="relative max-h-[85vh] max-w-[90vw] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeSrc}
              alt={name}
              className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
            />

            {/* Navigation inside Lightbox */}
            {usable.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-1.5 text-xs font-semibold text-white">
                  {active + 1} / {usable.length} · {name}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
