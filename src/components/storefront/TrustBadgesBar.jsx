import React from 'react';

/**
 * Ugaoo-Identical Trust Badges Bar
 * Reverse engineered from #tbb-template--...__trust_badges_bar_6V9KdQ
 * Uses exact Ugaoo coral/warm peach accent (#FF8962), white circular icon badges, and #042018 dark text.
 */
const BADGES = [
  {
    icon: '/sandbox-assets/trust/tbb_soil.png',
    title: '90-Day Pre Fertilised Soil',
    subtitle: 'Nourished for rapid growth',
  },
  {
    icon: '/sandbox-assets/trust/tbb_healthy.png',
    title: 'Arrives Healthy',
    subtitle: 'Guaranteed safe arrival',
  },
  {
    icon: '/sandbox-assets/trust/tbb_replacement.png',
    title: 'Free Replacement',
    subtitle: 'No questions asked',
  },
  {
    icon: '/sandbox-assets/trust/tbb_support.png',
    title: 'Free Plant Care Support',
    subtitle: 'Expert gardener live chat help',
  },
];

const TrustBadgesBar = () => {
  return (
    <section className="bg-[#FFF6F4] px-4 py-3 sm:px-6 lg:px-10" aria-label="Store Guarantees">
      <div className="mx-auto max-w-[1500px]">
        <div className="rounded-[16px] bg-[#FF8962] p-3 sm:px-8 sm:py-4 shadow-sm grid grid-cols-2 lg:flex lg:flex-nowrap items-center justify-between gap-2.5 sm:gap-6">
          {BADGES.map((b, idx) => (
            <div 
              key={idx} 
              className={`flex items-center gap-2 sm:gap-3 flex-1 min-w-0 ${
                idx !== BADGES.length - 1 ? 'lg:border-r lg:border-[#042018]/15 lg:pr-4' : ''
              }`}
            >
              <div className="h-8 w-8 sm:h-11 sm:w-11 shrink-0 rounded-full bg-white p-1 sm:p-1.5 shadow-xs flex items-center justify-center">
                <img 
                  src={b.icon} 
                  alt={b.title} 
                  className="h-full w-full object-contain"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-[11px] sm:text-[14px] font-bold text-[#042018] leading-tight line-clamp-1 sm:line-clamp-none">
                  {b.title}
                </span>
                <span className="font-sans text-[10px] sm:text-[11px] text-[#042018]/80 leading-tight hidden sm:block">
                  {b.subtitle}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadgesBar;
