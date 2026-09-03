import React, { useState } from 'react';
import { Sprout } from 'lucide-react';

/**
 * Thumbnail rail + main image. Thumbnails are real buttons in a listbox-ish
 * pattern so the gallery is fully keyboard operable, and any image whose URL
 * dies is dropped from the rail rather than shown as a broken thumbnail.
 */
const ProductGallery = ({ images = [], name }) => {
  const [active, setActive] = useState(0);
  const [dead, setDead] = useState(() => new Set());

  const usable = images.filter((_, i) => !dead.has(i));
  const activeSrc = images[active] && !dead.has(active) ? images[active] : usable[0];

  const markDead = (i) => setDead((prev) => new Set(prev).add(i));

  return (
    <div className="flex gap-3">
      {usable.length > 1 && (
        <ul className="flex w-[72px] shrink-0 flex-col gap-3">
          {images.map((src, i) => dead.has(i) ? null : (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Show image ${i + 1} of ${usable.length}`}
                aria-pressed={i === active}
                className={`block h-[72px] w-[72px] overflow-hidden rounded-[10px] bg-fv-surface
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary
                            ${i === active ? 'ring-2 ring-fv-primary' : 'ring-1 ring-fv-border'}`}
              >
                <img src={src} alt="" loading="lazy" decoding="async"
                     onError={() => markDead(i)} className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="min-w-0 flex-1 overflow-hidden rounded-[18px] bg-fv-surface">
        <div className="aspect-square w-full">
          {activeSrc ? (
            <img
              key={activeSrc}
              src={activeSrc}
              alt={name}
              loading="eager"
              decoding="async"
              onError={() => markDead(active)}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Sprout className="h-20 w-20 text-fv-primary/20" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGallery;
