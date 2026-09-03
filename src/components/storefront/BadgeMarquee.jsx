import React from 'react';
import { BADGES } from './sandboxAssets';

/**
 * Two independent motions, as on the reference: the whole strip translates
 * left continuously while each badge spins on its own axis.
 *
 * The list is rendered twice and travels exactly -50%, so the loop is seamless
 * with no jump. Both animations are transform-only (compositor work, no layout)
 * and both stop under prefers-reduced-motion — this is decoration and carries
 * no information, so removing it costs nothing.
 */
const MARQUEE_CSS = `
  .fv-marquee-track {
    display: flex;
    width: max-content;
    animation: fv-marquee-scroll 45s linear infinite;
    will-change: transform;
  }
  /* Each pass is at least a full viewport wide, so translating exactly one pass
     can never expose a gap on a wide screen. */
  .fv-marquee-pass {
    display: flex;
    flex-shrink: 0;
    min-width: 100vw;
    justify-content: space-around;
  }
  @keyframes fv-marquee-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
  .fv-marquee-badge {
    animation: fv-marquee-spin 16s linear infinite;
    will-change: transform;
  }
  @keyframes fv-marquee-spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .fv-marquee-track, .fv-marquee-badge { animation: none; }
  }
`;

const BadgeMarquee = ({ repeat = 12 }) => {
  const pass = Array.from({ length: repeat }, (_, i) => BADGES[i % BADGES.length]);

  const renderPass = (key) => (
    <div className="fv-marquee-pass" key={key}>
      {pass.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          width="96"
          height="96"
          loading="lazy"
          decoding="async"
          className="fv-marquee-badge mx-2 h-20 w-20 shrink-0 sm:h-24 sm:w-24"
        />
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden bg-fv-primary py-4" aria-hidden="true">
      <style>{MARQUEE_CSS}</style>
      {/* Two identical passes; the -50% travel lands exactly on the seam. */}
      <div className="fv-marquee-track">
        {renderPass('a')}
        {renderPass('b')}
      </div>
    </div>
  );
};

export default BadgeMarquee;
