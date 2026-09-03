/**
 * Design tokens measured from a live reference storefront (ugaoo.com) via
 * computed styles, then re-pointed at Fresh Veggies' own content.
 *
 * Kept in one place so the sandbox can be evaluated as a system rather than a
 * pile of one-off hex values. If this direction is approved these move into
 * tailwind.config.js as real theme colours.
 */
export const T = {
  // Greens
  primary: '#0A4C36',      // nav, primary buttons, badges
  primaryHover: '#1A4D2E', // measured hover state of their CTA
  accent: '#00B566',       // prices, accent fills
  section: '#009253',      // full-bleed USP band

  // Warm neutrals — the reason it doesn't read as a generic template
  page: '#FFF6F4',         // page background (NOT white)
  cream: '#FDF6EE',        // alternating section band
  softYellow: '#FFF9E4',

  // Signals
  yellow: '#FFD51F',       // trust strip + hero CTA
  saleBadge: '#FED02F',
  star: '#FFB503',

  // Ink
  ink: '#212326',
  heading: '#1C1C1C',
  deep: '#042018',
  muted: '#5D6B5F',
  border: '#CADFD4',
  placeholder: '#F7F7F7',
};

// Geometry: pill buttons + 18px cards + effectively no shadow is the signature.
export const RADIUS = { card: '18px', pill: '50px', chip: '4px' };
