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
  primary: '#0A4D3C',      // Ugaoo signature deep evergreen (nav, CTA buttons, headings)
  primaryHover: '#083B2A', // Measured hover state
  accent: '#00B566',       // Ugaoo vibrant emerald green (--color-price)
  leaf: '#00A93D',         // Ugaoo brand green (--jdgm-primary-color)
  star: '#00A93D',         // Ugaoo review star green

  // Bright warm neutrals & accents
  page: '#FFFFFF',         // Clean bright white canvas
  creamYellow: '#FFF3D9',  // Ugaoo signature warm sunny cream (header, category strip)
  coral: '#FF8962',        // Ugaoo trust badge accent coral/orange
  yellow: '#FED02F',       // Ugaoo bright gold badge (--color-sale-badge-background)
  saleBadge: '#FED02F',
  sand: '#F4E6C6',         // Ugaoo search background

  // Ink & Borders
  ink: '#212326',          // Ugaoo body text (--color-base-text)
  heading: '#1C1C1C',      // Ugaoo heading text (--color-base-heading)
  deep: '#042018',
  muted: '#5D6B5F',
  border: '#CADFD4',       // Ugaoo border (--color-base-border)
  borderLight: '#EFEFEF',
  placeholder: '#F7F7F7',
};

// Typography & Geometry reverse-engineered from live Ugaoo
export const FONT = {
  body: 'Outfit, sans-serif',
  heading: 'Outfit, sans-serif',
};

// Geometry: pill buttons (50px) + 18px rounded cards + clean borders
export const RADIUS = { card: '18px', pill: '50px', chip: '4px' };


