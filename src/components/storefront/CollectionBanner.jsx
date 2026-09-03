import React from 'react';
import { BANNER } from './sandboxAssets';

/**
 * Wide rounded collection banner.
 *
 * The artwork carries its own headline, so the image is decorative (alt="") and
 * the heading is provided as real, visually-hidden text. That keeps the banner
 * pixel-accurate to the design while still giving screen readers and search
 * engines a genuine heading in the document outline — rather than leaving the
 * message locked inside a JPEG.
 */
const CollectionBanner = ({ title = 'Bring life to your space' }) => (
  <section className="bg-fv-page px-4 pt-6 sm:px-6 lg:px-10" aria-labelledby="collection-banner-heading">
    <h1 id="collection-banner-heading" className="sr-only">{title}</h1>
    <div className="mx-auto max-w-[1500px] overflow-hidden rounded-[18px] bg-fv-surface">
      <img
        src={BANNER.src}
        alt=""
        width="2500"
        height="547"
        loading="eager"
        decoding="async"
        className="aspect-[2500/547] w-full object-cover"
      />
    </div>
  </section>
);

export default CollectionBanner;
