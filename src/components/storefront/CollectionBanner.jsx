import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../utils/api';
import { BANNER } from './sandboxAssets';

/**
 * [CHG-011] Sleek Wide Panoramic Collection Banner.
 *
 * Restores the exact 2500/547 panoramic aspect ratio and rounded layout
 * previously favored, eliminating tall square container heights on mobile & desktop.
 * Features auto-rotating curated slides (every 5s), smooth cross-fade, Ken Burns zoom,
 * and touch swipe for mobile while keeping artwork unobscured.
 */
const DEFAULT_SLIDES = [
  {
    id: 'slide-1',
    imageUrl: BANNER.src,
    tag: '🌱 100% Organic & Non-GMO',
    title: 'Bring life to your space',
    subtitle: 'High-germination heirloom varieties for lush home gardens & organic terrace farms.',
    linkUrl: '#catalogue-heading',
  },
  {
    id: 'slide-2',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=2500&q=80',
    tag: '🥕 100% Chemical-Free',
    title: 'Grow Crisp Greens At Home',
    subtitle: 'Enriched organic potting mixes, coco peat, and heavy-duty UV grow bags.',
    linkUrl: '/combos',
  },
  {
    id: 'slide-3',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=2500&q=80',
    tag: '✨ Best Value Bundles',
    title: 'Seasonal Combo Packages',
    subtitle: 'Save up to 40% with all-in-one gardener kits and organic enrichment packs.',
    linkUrl: '/combos',
  },
  {
    id: 'slide-4',
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=2500&q=80',
    tag: '🚚 Fast Farm Dispatch',
    title: 'Bountiful Harvest Guaranteed',
    subtitle: 'Free delivery on orders over ₹300 with trusted Cash on Delivery.',
    linkUrl: '#catalogue-heading',
  },
];

const CollectionBanner = ({ title = 'Bring life to your space' }) => {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Fetch active banners from backend if configured by admin, merging with curated defaults
  useEffect(() => {
    let isMounted = true;
    api.get('/banners/active')
      .then((res) => {
        if (!isMounted) return;
        const remoteBanners = res.data?.data;
        if (Array.isArray(remoteBanners) && remoteBanners.length > 0) {
          const formatted = remoteBanners.map((b) => ({
            id: b._id,
            imageUrl: b.imageUrl,
            mobileImageUrl: b.mobileImageUrl,
            tag: '🌟 Featured Offer',
            title: b.title,
            subtitle: b.description || '',
            linkUrl: b.linkUrl || '/',
          }));
          setSlides([...formatted, ...DEFAULT_SLIDES]);
        }
      })
      .catch(() => {
        // Fallback gracefully to curated panoramic slides
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-slide transition timer (changes automatically every 5 seconds)
  useEffect(() => {
    if (isHovered || slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered, slides.length]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  // Touch gesture support for mobile phones
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 45) {
      nextSlide();
    } else if (diff < -45) {
      prevSlide();
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleCtaClick = (e, linkUrl) => {
    if (linkUrl.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(linkUrl);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 350, behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      className="bg-fv-page px-4 pt-6 sm:px-6 lg:px-10"
      aria-label="Featured Collections"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <h1 className="sr-only">{title}</h1>

      {/* Sleek, wide panoramic banner container with exact aspect-[2500/547] */}
      <div className="group relative mx-auto max-w-[1500px] overflow-hidden rounded-[18px] bg-fv-surface shadow-xs aspect-[2500/547] w-full">
        {/* Slide Layers with Cross-Fade Transitions */}
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          const isBannerArtwork = slide.imageUrl === BANNER.src || slide.imageUrl.includes('banner.jpg');

          return (
            <div
              key={slide.id || idx}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {slide.linkUrl ? (
                slide.linkUrl.startsWith('#') ? (
                  <a
                    href={slide.linkUrl}
                    onClick={(e) => handleCtaClick(e, slide.linkUrl)}
                    className="block w-full h-full relative cursor-pointer"
                  >
                    <img
                      src={slide.imageUrl}
                      alt={slide.title || ''}
                      width="2500"
                      height="547"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className={`h-full w-full object-cover fv-banner-ken-burns ${
                        isActive ? 'scale-105' : 'scale-100'
                      }`}
                    />
                    {!isBannerArtwork && slide.title && (
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent flex items-center px-4 sm:px-10 lg:px-14">
                        <div className="max-w-[70%] sm:max-w-[50%]">
                          {slide.tag && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[9px] sm:text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-0.5 sm:mb-1.5">
                              {slide.tag}
                            </span>
                          )}
                          <h2 className="font-serif text-xs sm:text-2xl md:text-3xl font-bold text-white drop-shadow-sm line-clamp-1 sm:line-clamp-2">
                            {slide.title}
                          </h2>
                          {slide.subtitle && (
                            <p className="hidden sm:block text-xs sm:text-sm text-white/90 mt-0.5 sm:mt-1 line-clamp-1">
                              {slide.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </a>
                ) : (
                  <Link
                    to={slide.linkUrl}
                    className="block w-full h-full relative cursor-pointer"
                  >
                    <img
                      src={slide.imageUrl}
                      alt={slide.title || ''}
                      width="2500"
                      height="547"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                      className={`h-full w-full object-cover fv-banner-ken-burns ${
                        isActive ? 'scale-105' : 'scale-100'
                      }`}
                    />
                    {!isBannerArtwork && slide.title && (
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent flex items-center px-4 sm:px-10 lg:px-14">
                        <div className="max-w-[70%] sm:max-w-[50%]">
                          {slide.tag && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[9px] sm:text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-0.5 sm:mb-1.5">
                              {slide.tag}
                            </span>
                          )}
                          <h2 className="font-serif text-xs sm:text-2xl md:text-3xl font-bold text-white drop-shadow-sm line-clamp-1 sm:line-clamp-2">
                            {slide.title}
                          </h2>
                          {slide.subtitle && (
                            <p className="hidden sm:block text-xs sm:text-sm text-white/90 mt-0.5 sm:mt-1 line-clamp-1">
                              {slide.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                )
              ) : (
                <div className="w-full h-full relative">
                  <img
                    src={slide.imageUrl}
                    alt={slide.title || ''}
                    width="2500"
                    height="547"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    className={`h-full w-full object-cover fv-banner-ken-burns ${
                      isActive ? 'scale-105' : 'scale-100'
                    }`}
                  />
                  {!isBannerArtwork && slide.title && (
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent flex items-center px-4 sm:px-10 lg:px-14">
                      <div className="max-w-[70%] sm:max-w-[50%]">
                        {slide.tag && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[9px] sm:text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-0.5 sm:mb-1.5">
                            {slide.tag}
                          </span>
                        )}
                        <h2 className="font-serif text-xs sm:text-2xl md:text-3xl font-bold text-white drop-shadow-sm line-clamp-1 sm:line-clamp-2">
                          {slide.title}
                        </h2>
                        {slide.subtitle && (
                          <p className="hidden sm:block text-xs sm:text-sm text-white/90 mt-0.5 sm:mt-1 line-clamp-1">
                            {slide.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Previous Button (Visible on Hover / Accessible) */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-md transition-all duration-200 hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Next Button (Visible on Hover / Accessible) */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-md transition-all duration-200 hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Slide Indicator Navigation Dots */}
        {slides.length > 1 && (
          <div
            className="absolute bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2"
            role="tablist"
            aria-label="Banner slides"
          >
            {slides.map((_, dotIdx) => {
              const isDotActive = dotIdx === currentIndex;
              return (
                <button
                  key={dotIdx}
                  type="button"
                  role="tab"
                  aria-selected={isDotActive}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                  onClick={() => setCurrentIndex(dotIdx)}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    isDotActive
                      ? 'w-5 sm:w-7 h-1.5 sm:h-2 bg-white shadow-sm'
                      : 'w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default CollectionBanner;
