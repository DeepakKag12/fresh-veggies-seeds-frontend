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
      {/* Two identical passes; the -50% travel lands exactly on the seam. */}
      <div className="fv-marquee-track">
        {renderPass('a')}
        {renderPass('b')}
      </div>
    </div>
  );
};

export default BadgeMarquee;
