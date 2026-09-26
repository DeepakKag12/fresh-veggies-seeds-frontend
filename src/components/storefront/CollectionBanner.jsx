import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight, Sprout, Sparkles } from 'lucide-react';
import api from '../../utils/api';

/**
 * Curated thematic cover banners for Fresh Veggies.
 * High-resolution, optimized photography highlighting organic seeds,
 * greenhouse greens, gardening combo kits, and bountiful farm harvest.
 */
const DEFAULT_SLIDES = [
  {
    id: 'slide-1',
    imageUrl: '/sandbox-assets/banner.jpg',
    tag: '🌱 100% Organic & Non-GMO',
    title: 'Farm-Fresh Vegetable Seeds',
    subtitle: 'High-germination heirloom varieties harvested for lush home gardens & organic terrace farms.',
    ctaText: 'Explore Seeds',
    linkUrl: '#catalogue-heading',
  },
  {
    id: 'slide-2',
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=2000&q=80',
    tag: '🥕 100% Chemical-Free',
    title: 'Grow Crisp Greens At Home',
    subtitle: 'Enriched organic potting mixes, coco peat, and heavy-duty UV grow bags for healthy harvests.',
    ctaText: 'View Gardening Kits',
    linkUrl: '/combos',
  },
  {
    id: 'slide-3',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=2000&q=80',
    tag: '✨ Best Value Bundles',
    title: 'Seasonal Combo Packages',
    subtitle: 'Save up to 40% with all-in-one gardener kits, seeds, and organic enrichment packs.',
    ctaText: 'Shop Combo Offers',
    linkUrl: '/combos',
  },
  {
    id: 'slide-4',
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=2000&q=80',
    tag: '🚚 Fast Farm Dispatch',
    title: 'Bountiful Harvest Guaranteed',
    subtitle: 'Free delivery on orders over ₹300 with trusted Cash on Delivery and prompt dispatch.',
    ctaText: 'Start Shopping',
    linkUrl: '#catalogue-heading',
  },
];

const CollectionBanner = ({ title = 'Fresh Veggies Organic Garden' }) => {
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
            tag: '🌟 Featured Offer',
            title: b.title,
            subtitle: b.description || 'Special limited-time promotional collection.',
            ctaText: 'View Collection',
            linkUrl: b.linkUrl || '/',
          }));
          setSlides([...formatted, ...DEFAULT_SLIDES]);
        }
      })
      .catch(() => {
        // Fallback gracefully to default high-res thematic slides
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
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }
    }
  };

  return (
    <section
      className="bg-fv-page px-3 pt-4 sm:px-6 sm:pt-6 lg:px-10"
      aria-label="Featured Collections"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <h1 className="sr-only">{title}</h1>

      <div className="group relative mx-auto max-w-[1500px] overflow-hidden rounded-[20px] sm:rounded-[24px] bg-slate-900 shadow-md h-[270px] sm:h-[350px] md:h-[420px] lg:h-[460px]">
        {/* Slide Layers with Cross-Fade Transitions */}
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id || idx}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {/* Background Cover Image with Ken Burns Zoom Effect */}
              <img
                src={slide.imageUrl}
                alt=""
                loading={idx === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className={`h-full w-full object-cover fv-banner-ken-burns ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
              />

              {/* Theme Botanical Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/25 sm:from-black/80 sm:via-black/40 sm:to-transparent" />

              {/* Decorative Floating Botanical Elements */}
              <div className="absolute top-4 right-6 hidden md:flex items-center gap-3 pointer-events-none opacity-40">
                <span className="animate-botanical-float text-emerald-300">
                  <Sprout className="w-8 h-8" />
                </span>
                <span className="animate-pulse-subtle text-amber-300">
                  <Sparkles className="w-6 h-6" />
                </span>
              </div>

              {/* Content Box (Left-Aligned, Vertically Centered) */}
              <div className="relative z-20 flex h-full flex-col justify-center px-6 sm:px-12 lg:px-16 max-w-[780px]">
                {/* Badge Tag */}
                <div
                  className={`mb-2 sm:mb-3 inline-flex items-center gap-1.5 w-fit rounded-full bg-white/20 px-3 py-1 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-200 backdrop-blur-md border border-white/20 shadow-xs transition-all duration-500 delay-100 ${
                    isActive ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
                  }`}
                >
                  <span className="inline-block animate-pulse-subtle">{slide.tag}</span>
                </div>

                {/* Headline */}
                <h2
                  className={`font-serif text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.15] mb-2 sm:mb-3 drop-shadow-sm transition-all duration-500 delay-200 ${
                    isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                >
                  {slide.title}
                </h2>

                {/* Subtitle */}
                <p
                  className={`text-xs sm:text-sm md:text-base text-white/90 font-normal leading-relaxed line-clamp-2 sm:line-clamp-none max-w-[580px] mb-4 sm:mb-6 transition-all duration-500 delay-300 ${
                    isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                >
                  {slide.subtitle}
                </p>

                {/* CTA Action Button */}
                <div
                  className={`transition-all duration-500 delay-400 ${
                    isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                  }`}
                >
                  {slide.linkUrl.startsWith('#') ? (
                    <a
                      href={slide.linkUrl}
                      onClick={(e) => handleCtaClick(e, slide.linkUrl)}
                      className="group/btn inline-flex items-center gap-2 rounded-full bg-fv-primary hover:bg-fv-primary-dark px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </a>
                  ) : (
                    <Link
                      to={slide.linkUrl}
                      className="group/btn inline-flex items-center gap-2 rounded-full bg-fv-primary hover:bg-fv-primary-dark px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      <span>{slide.ctaText}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Previous Button (Visible on Hover / Accessible) */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-md transition-all duration-200 hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 sm:flex cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Next Button (Visible on Hover / Accessible) */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-black/35 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 shadow-md transition-all duration-200 hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 sm:flex cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Slide Indicator Navigation Dots */}
        {slides.length > 1 && (
          <div
            className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2"
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
                      ? 'w-7 sm:w-8 h-2 sm:h-2.5 bg-white shadow-sm'
                      : 'w-2 sm:w-2.5 h-2 sm:h-2.5 bg-white/40 hover:bg-white/70'
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
