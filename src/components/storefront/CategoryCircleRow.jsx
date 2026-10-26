import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { CATEGORY_ART } from './sandboxAssets';

/**
 * Ugaoo-Inspired Category Circle Strip:
 * - Perfectly round white discs with clean, high-resolution illustrated artwork
 * - Sized generously (72px on mobile, 96-104px on tablet/desktop) with subtle borders & soft shadows
 * - Outfit font family, centered typography with medium/semibold weights
 * - Smooth horizontal touch scroll with zero clutter
 * - Direct filtering and visual active states in #0A4C36
 */
const FEATURED_CATEGORY_ORDER = [
  'Plants',
  'Flowers',
  'Seeds',
  'Pots',
  'Vegetable Seeds',
  'Flower Seeds',
  'Soils',
  'Fertilisers',
  'Fertilizers',
  'Garden Tools',
  'Watering Solutions',
  'Pest Control',
];

const getCategoryArt = (categoryItem) => {
  const categoryIdentifier = (categoryItem?.slug || categoryItem?.name || '').toLowerCase().trim();
  
  if (categoryIdentifier.includes('plant')) return '/sandbox-assets/icons/plants.webp';
  if (categoryIdentifier.includes('flower') || categoryIdentifier.includes('floral')) return '/sandbox-assets/icons/flowers.png';
  if (categoryIdentifier.includes('pot') || categoryIdentifier.includes('bag') || categoryIdentifier.includes('planter')) return '/sandbox-assets/icons/pots.webp';
  if (categoryIdentifier.includes('soil')) return '/sandbox-assets/icons/soils.webp';
  if (categoryIdentifier.includes('fertil') || categoryIdentifier.includes('compost')) return '/sandbox-assets/icons/fertilisers.webp';
  if (categoryIdentifier.includes('seed')) return '/sandbox-assets/icons/seeds.webp';
  if (categoryIdentifier.includes('tool')) return '/sandbox-assets/icons/tools.webp';
  if (categoryIdentifier.includes('water')) return '/sandbox-assets/icons/watering.webp';
  if (categoryIdentifier.includes('pest')) return '/sandbox-assets/icons/pest.webp';
  if (CATEGORY_ART[categoryItem?.slug]) return CATEGORY_ART[categoryItem.slug];
  if (categoryItem?.imageUrl) return categoryItem.imageUrl;
  if (categoryItem?.image) return categoryItem.image;

  return '/sandbox-assets/icons/seeds.webp';
};

const Tile = ({ category, active, onSelect }) => {
  const [failed, setFailed] = useState(false);
  const art = getCategoryArt(category);
  const showArt = art && !failed;

  const Tag = onSelect ? 'button' : Link;
  const tagProps = onSelect
    ? { 
        type: 'button', 
        onClick: () => onSelect(active ? '' : (category._id || category.slug)), 
        'aria-pressed': active 
      }
    : { 
        to: `/?category=${encodeURIComponent(category._id || category.slug)}`, 
        'aria-current': active ? 'page' : undefined 
      };

  return (
    <li className="shrink-0 flex justify-center snap-center w-[72px] min-[360px]:w-[80px] sm:w-[96px] md:w-[108px] lg:w-[116px]">
      <Tag
        {...tagProps}
        className="group flex flex-col items-center gap-1.5 sm:gap-2 p-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 cursor-pointer w-full"
      >
        {/* Circle Disc with responsive dimensions for mobile & desktop */}
        <span
          className={`flex h-[56px] w-[56px] min-[360px]:h-[64px] min-[360px]:w-[64px] sm:h-[84px] sm:w-[84px] lg:h-[96px] lg:w-[96px] items-center justify-center overflow-hidden rounded-full bg-white
                      transition-all duration-300 group-hover:scale-105 group-hover:shadow-md
                      motion-reduce:transition-none motion-reduce:group-hover:scale-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mx-auto
                      ${active 
                        ? 'ring-2 ring-[#0A4D3C] ring-offset-2 scale-[1.04] border-[#0A4D3C] shadow-md' 
                        : 'border border-[#F0EBE1] group-hover:border-[#0A4D3C]/60'}`}
        >
          {showArt ? (
            <img
              src={art}
              alt={category.name}
              width="100"
              height="100"
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="h-[70%] w-[70%] object-contain select-none transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Sprout className="w-6 h-6 sm:w-8 sm:h-8 text-[#0A4D3C] stroke-[1.75]" />
          )}
        </span>

        {/* Text Label */}
        <span 
          title={category.name}
          className={`w-full font-sans text-[10px] min-[360px]:text-[11px] sm:text-[13px] lg:text-[14px] leading-tight tracking-normal transition-colors text-center truncate block px-0.5
                     ${active ? 'font-bold text-[#0A4D3C]' : 'font-medium text-[#1C1C1C] group-hover:text-[#0A4D3C]'}`}
        >
          {category.name}
        </span>
      </Tag>
    </li>
  );
};

const CategoryCircleRow = ({ categories = [], activeId, onSelect }) => {
  // Sort categories based on priority order while strictly respecting admin circle visibility
  const displayCategories = useMemo(() => {
    if (!categories.length) return [];

    const filtered = categories.filter((categoryDoc) => {
      // Respect admin configuration for homepage circle visibility & active status
      if (categoryDoc.showInCircle === false) return false;
      if (categoryDoc.isActive === false) return false;
      return true;
    });

    return filtered.sort((firstCategory, secondCategory) => {
      const nameA = firstCategory.name || '';
      const nameB = secondCategory.name || '';
      
      const idxA = FEATURED_CATEGORY_ORDER.findIndex((orderName) => orderName.toLowerCase() === nameA.toLowerCase() || nameA.toLowerCase().includes(orderName.toLowerCase()));
      const idxB = FEATURED_CATEGORY_ORDER.findIndex((orderName) => orderName.toLowerCase() === nameB.toLowerCase() || nameB.toLowerCase().includes(orderName.toLowerCase()));

      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return nameA.localeCompare(nameB);
    });
  }, [categories]);

  if (!displayCategories.length) return null;

  return (
    <div className="relative bg-[#FFF3D9]">
      <nav aria-label="Browse categories" className="px-1 pt-3 pb-2 min-[360px]:px-2 min-[360px]:pt-3.5 min-[360px]:pb-2.5 sm:px-6 sm:pt-5 sm:pb-3.5 lg:px-10">
        <div className="mx-auto max-w-[1500px] overflow-x-auto pb-1 sm:pb-2 scroll-smooth snap-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <ul className="w-max min-w-full mx-auto flex items-center justify-center gap-2 min-[360px]:gap-3.5 sm:gap-6 lg:gap-8 px-2 sm:px-4">
            {displayCategories.map((categoryItem) => (
              <Tile 
                key={categoryItem._id || categoryItem.slug} 
                category={categoryItem} 
                active={
                  Boolean(activeId) && (
                    String(categoryItem._id) === String(activeId) ||
                    (categoryItem.slug && categoryItem.slug.toLowerCase() === String(activeId).toLowerCase()) ||
                    (categoryItem.name && categoryItem.name.toLowerCase() === String(activeId).toLowerCase())
                  )
                } 
                onSelect={onSelect} 
              />
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom Subtle Divider Line */}
      <div 
        className="w-full h-px bg-[#EAD8B5]/80"
        aria-hidden="true"
      />
    </div>
  );
};

export default CategoryCircleRow;
