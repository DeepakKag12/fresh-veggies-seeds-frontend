import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { CATEGORY_ART } from './sandboxAssets';

/**
 * Row of circular illustrated category tiles. The selected category gets a ring
 * plus a bold label — colour alone never carries the state.
 *
 * The circle degrades in two steps: illustration → the category's own icon
 * character → nothing, so a missing asset never leaves an empty ring.
 */
const Tile = ({ category, active, onSelect }) => {
  const [failed, setFailed] = useState(false);
  const art = CATEGORY_ART[category.slug];
  const showArt = art && !failed;

  // On a listing page the tile filters in place; elsewhere it navigates.
  const Tag = onSelect ? 'button' : Link;
  const tagProps = onSelect
    ? { type: 'button', onClick: () => onSelect(active ? '' : category._id), 'aria-pressed': active }
    : { to: `/?category=${category._id}`, 'aria-current': active ? 'page' : undefined };

  return (
    <li className="flex-1 min-w-[68px] max-w-[88px] shrink-0 flex justify-center sm:w-[124px] sm:max-w-none sm:flex-initial">
      <Tag
        {...tagProps}
        className="group flex w-full flex-col items-center gap-1.5 rounded-[14px] p-0.5 text-center sm:gap-3 sm:rounded-[18px] sm:p-1
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary
                   focus-visible:ring-offset-2"
      >
        <span
          className={`flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-full bg-white
                      transition-all duration-300 group-hover:scale-105 group-hover:shadow-md
                      motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:h-[108px] sm:w-[108px]
                      ${active ? 'ring-2 ring-fv-primary shadow-[0_0_18px_rgba(22,163,74,0.28)] scale-[1.04] animate-botanical-glow' : 'ring-1 ring-fv-border'}`}
        >
          {showArt ? (
            <img
              src={art}
              alt=""
              width="108"
              height="108"
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="h-[62%] w-[62%] object-contain sm:h-[68%] sm:w-[68%]"
            />
          ) : category.icon && !/[\u{1F300}-\u{1FAFF}]/u.test(category.icon) ? (
            <span className="text-xl sm:text-2xl" aria-hidden="true">{category.icon}</span>
          ) : (
            <Sprout className="w-6 h-6 sm:w-8 sm:h-8 text-fv-primary stroke-[1.75]" />
          )}
        </span>
        <span className={`text-[11px] leading-tight line-clamp-1 max-w-[74px] sm:max-w-none sm:text-[15px] sm:leading-snug ${active ? 'font-semibold text-fv-primary' : 'text-fv-heading'}`}>
          {category.name}
        </span>
      </Tag>
    </li>
  );
};

const CategoryCircleRow = ({ categories = [], activeId, onSelect }) => {
  if (!categories.length) return null;
  return (
    <nav aria-label="Browse categories" className="bg-fv-page px-2 py-3 sm:px-6 sm:py-6 lg:px-10">
      {/* Covers space evenly across phone screen, scrolling smoothly if categories overflow */}
      <ul className="mx-auto flex w-full max-w-[1500px] items-center justify-evenly gap-1 overflow-x-auto pb-1 sm:justify-center sm:gap-2 sm:pb-2
                     [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <Tile key={c._id} category={c} active={c._id === activeId || c.slug === activeId} onSelect={onSelect} />
        ))}
      </ul>
    </nav>
  );
};

export default CategoryCircleRow;
