import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

/**
 * Ugaoo-style sleek panoramic promotional banner.
 * Strict height (h-44 sm:h-52 md:h-60 max-h-[250px]) guarantees it NEVER expands vertically
 * or takes up the entire screen, delivering rich, brand-aligned botanical aesthetics.
 */
const PromoTile = ({ title, cta = 'Shop now', to = '/', image }) => (
  <article className="relative h-44 sm:h-52 md:h-60 w-full max-h-[250px] overflow-hidden rounded-[22px] bg-fv-primary shadow-sm group">
    {image && (
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
    )}
    <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent" />
    <div className="absolute inset-0 flex flex-col items-start justify-center gap-2 sm:gap-3 p-5 sm:p-8 md:p-10 text-left max-w-xl">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffd029] text-[#0a4c36] text-[11px] font-bold uppercase tracking-wider shadow-xs">
        <Sparkles className="w-3.5 h-3.5 text-[#0a4c36]" />
        Organic Plant Nutrition
      </span>
      <h3 className="font-serif text-[18px] sm:text-[24px] md:text-[26px] font-bold leading-tight text-white line-clamp-2 drop-shadow-sm">
        {title}
      </h3>
      <Link
        to={to}
        className="inline-flex h-9 sm:h-10 items-center rounded-full bg-white px-5 sm:px-6 text-[13px] sm:text-[14px] font-bold
                   text-fv-primary hover:bg-fv-cream transition-all shadow-md active:scale-95 shimmer-btn gap-2"
      >
        <span>{cta}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  </article>
);

export default PromoTile;
