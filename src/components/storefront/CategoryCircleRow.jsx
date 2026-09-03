import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
    <li className="shrink-0">
      <Tag
        {...tagProps}
        className="group flex w-[120px] flex-col items-center gap-3 rounded-[18px] p-1 text-center sm:w-[150px]
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary
                   focus-visible:ring-offset-2 sm:w-[124px]"
      >
        <span
          className={`flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-white
                      transition-transform duration-200 group-hover:scale-105
                      motion-reduce:transition-none motion-reduce:group-hover:scale-100 sm:h-[108px] sm:w-[108px]
                      ${active ? 'ring-2 ring-fv-primary' : 'ring-1 ring-fv-border'}`}
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
              className="h-[68%] w-[68%] object-contain"
            />
          ) : (
            <span className="text-3xl" aria-hidden="true">{category.icon || '🌱'}</span>
          )}
        </span>
        <span className={`text-[15px] leading-snug ${active ? 'font-semibold text-fv-primary' : 'text-fv-heading'}`}>
          {category.name}
        </span>
      </Tag>
    </li>
  );
};

const CategoryCircleRow = ({ categories = [], activeId, onSelect }) => {
  if (!categories.length) return null;
  return (
    <nav aria-label="Browse categories" className="bg-fv-page px-4 py-6 sm:px-6 lg:px-10">
      {/* Scrolls within itself on small screens rather than pushing the page wide. */}
      <ul className="mx-auto flex max-w-[1500px] justify-start gap-1 overflow-x-auto pb-2 lg:justify-center
                     [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((c) => (
          <Tile key={c._id} category={c} active={c._id === activeId} onSelect={onSelect} />
        ))}
      </ul>
    </nav>
  );
};

export default CategoryCircleRow;
