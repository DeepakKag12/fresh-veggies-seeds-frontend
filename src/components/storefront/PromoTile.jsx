import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import api from '../../utils/api';

/**
 * [CHG-027] Dynamic Promotional In-Feed Banner (Ugaoo-style).
 *
 * Restores dynamic redirection for the "Shop now" CTA and connects to the
 * admin-controlled dynamic banner system (`position: 'middle'`) and dynamic
 * category filtering.
 *
 * Strict height (h-44 sm:h-52 md:h-60 max-h-[250px]) guarantees it never expands
 * vertically or takes up the whole screen, maintaining the botanical panoramic aesthetic.
 */
const PromoTile = ({
  title = 'Feed your plants right with our organic fertilizers',
  tag = 'Organic Plant Nutrition',
  cta = 'Shop now',
  to = '/?category=fertilizers',
  image,
  bannerId = null,
  onCtaClick = null,
}) => {
  const navigate = useNavigate();

  const handleAction = (e) => {
    // Track banner click analytics if bannerId exists
    if (bannerId) {
      api.post(`/banners/${bannerId}/click`).catch(() => {});
    }

    if (onCtaClick) {
      e?.preventDefault?.();
      onCtaClick(to);
      return;
    }

    if (!to || to === '#') {
      e?.preventDefault?.();
      const el = document.getElementById('catalogue-heading');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }
      return;
    }

    // External URL handling
    if (to.startsWith('http://') || to.startsWith('https://')) {
      return;
    }

    e?.preventDefault?.();

    // Hash anchor navigation
    if (to.startsWith('#')) {
      const el = document.querySelector(to);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 400, behavior: 'smooth' });
      }
      return;
    }

    // Internal routing
    navigate(to);

    // If navigating to home catalog or category filter, smooth scroll to products
    if (to.includes('category=') || to === '/' || to.startsWith('/?')) {
      setTimeout(() => {
        const el = document.getElementById('catalogue-heading');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isExternal = Boolean(to && (to.startsWith('http://') || to.startsWith('https://')));

  return (
    <article
      className="relative h-44 sm:h-52 md:h-60 w-full max-h-[250px] overflow-hidden rounded-[22px] bg-fv-primary shadow-sm group select-none cursor-pointer"
      role="region"
      aria-label={title}
      onClick={handleAction}
    >
      {image && (
        <img
          src={image}
          alt={title || ''}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none" />

      <div className="absolute inset-0 flex flex-col items-start justify-center gap-2 sm:gap-3 p-5 sm:p-8 md:p-10 text-left max-w-xl z-10">
        {tag && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ffd029] text-[#0a4c36] text-[11px] font-bold uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#0a4c36]" />
            {tag}
          </span>
        )}

        <h3 className="font-serif text-[18px] sm:text-[24px] md:text-[26px] font-bold leading-tight text-white line-clamp-2 drop-shadow-sm">
          {title}
        </h3>

        {isExternal ? (
          <a
            href={to}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(e);
            }}
            className="group/btn inline-flex h-9 sm:h-10 items-center rounded-full bg-white px-5 sm:px-6 text-[13px] sm:text-[14px] font-bold
                       text-fv-primary hover:bg-fv-cream transition-all shadow-md active:scale-95 shimmer-btn gap-2 cursor-pointer"
          >
            <span>{cta}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </a>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleAction(e);
            }}
            className="group/btn inline-flex h-9 sm:h-10 items-center rounded-full bg-white px-5 sm:px-6 text-[13px] sm:text-[14px] font-bold
                       text-fv-primary hover:bg-fv-cream transition-all shadow-md active:scale-95 shimmer-btn gap-2 cursor-pointer"
          >
            <span>{cta}</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </article>
  );
};

export default PromoTile;
