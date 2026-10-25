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

const getCategoryArt = (cat) => {
  const s = (cat?.slug || cat?.name || '').toLowerCase().trim();
  
  if (s.includes('plant')) return '/sandbox-assets/icons/plants.webp';
  if (s.includes('flower') || s.includes('floral')) return '/sandbox-assets/icons/flowers.png';
  if (s.includes('pot') || s.includes('bag') || s.includes('planter')) return '/sandbox-assets/icons/pots.webp';
  if (s.includes('soil')) return '/sandbox-assets/icons/soils.webp';
  if (s.includes('fertil') || s.includes('compost')) return '/sandbox-assets/icons/fertilisers.webp';
  if (s.includes('seed')) return '/sandbox-assets/icons/seeds.webp';
  if (s.includes('tool')) return '/sandbox-assets/icons/tools.webp';
  if (s.includes('water')) return '/sandbox-assets/icons/watering.webp';
  if (s.includes('pest')) return '/sandbox-assets/icons/pest.webp';
  if (CATEGORY_ART[cat?.slug]) return CATEGORY_ART[cat.slug];
  if (cat?.imageUrl) return cat.imageUrl;
  if (cat?.image) return cat.image;

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
    <li className="shrink-0 flex justify-center">
      <Tag
        {...tagProps}
        className="group flex flex-col items-center gap-1.5 sm:gap-2 p-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A4D3C] focus-visible:ring-offset-2 cursor-pointer"
      >
        {/* Circle Disc with responsive dimensions for mobile & desktop */}
        <span
          className={`flex h-[58px] w-[58px] min-[360px]:h-[66px] min-[360px]:w-[66px] sm:h-[88px] sm:w-[88px] lg:h-[100px] lg:w-[100px] items-center justify-center overflow-hidden rounded-full bg-white
                      transition-all duration-300 group-hover:scale-105 group-hover:shadow-md
                      motion-reduce:transition-none motion-reduce:group-hover:scale-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)]
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
          className={`font-sans text-[10px] min-[360px]:text-[11px] sm:text-[13px] lg:text-[14px] leading-tight tracking-normal transition-colors text-center whitespace-nowrap
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

    const filtered = categories.filter(c => {
      // Respect admin configuration for homepage circle visibility & active status
      if (c.showInCircle === false) return false;
      if (c.isActive === false) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      
      const idxA = FEATURED_CATEGORY_ORDER.findIndex(o => o.toLowerCase() === nameA.toLowerCase() || nameA.toLowerCase().includes(o.toLowerCase()));
      const idxB = FEATURED_CATEGORY_ORDER.findIndex(o => o.toLowerCase() === nameB.toLowerCase() || nameB.toLowerCase().includes(o.toLowerCase()));

      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return nameA.localeCompare(nameB);
    });
  }, [categories]);

  if (!displayCategories.length) return null;

  return (
    <div className="relative bg-[#FFF3D9]">
      <nav aria-label="Browse categories" className="px-1.5 pt-3 pb-2 min-[360px]:px-2 min-[360px]:pt-3.5 min-[360px]:pb-2.5 sm:px-6 sm:pt-6 sm:pb-4 lg:px-10">
        <div className="mx-auto max-w-[1500px]">
          <ul className="flex items-center justify-center gap-1.5 min-[360px]:gap-2.5 sm:gap-6 md:gap-8 overflow-x-auto pb-1 sm:pb-2
                         [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full">
            {displayCategories.map((c) => (
              <Tile 
                key={c._id || c.slug} 
                category={c} 
                active={
                  Boolean(activeId) && (
                    String(c._id) === String(activeId) ||
                    (c.slug && c.slug.toLowerCase() === String(activeId).toLowerCase()) ||
                    (c.name && c.name.toLowerCase() === String(activeId).toLowerCase())
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
