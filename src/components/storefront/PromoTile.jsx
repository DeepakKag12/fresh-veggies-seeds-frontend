import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Wide promotional tile that sits inside the product grid, spanning two
 * columns so the grid rhythm is preserved rather than broken.
 * Decorative image; the heading and link carry all the meaning.
 */
const PromoTile = ({ title, cta = 'Shop now', to = '/shop', image }) => (
  <article className="relative col-span-2 overflow-hidden rounded-[18px] bg-fv-primary">
    {image && (
      <img src={image} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h3 className="font-serif text-[22px] font-semibold leading-tight text-white sm:text-[30px]">{title}</h3>
      <Link
        to={to}
        className="inline-flex h-11 items-center rounded-[50px] bg-white px-6 text-[15px] font-semibold
                   text-fv-primary hover:bg-fv-yellow focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-white focus-visible:ring-offset-2"
      >
        {cta}
      </Link>
    </div>
  </article>
);

export default PromoTile;
