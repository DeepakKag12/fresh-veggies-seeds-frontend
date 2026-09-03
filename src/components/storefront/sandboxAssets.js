/**
 * SINGLE SWAP POINT for sandbox imagery.
 *
 * These files under /public/sandbox-assets are reference artwork used so the
 * proposed design can be judged with real-looking imagery. They belong to the
 * reference storefront and MUST be replaced with Fresh Veggies' own photography
 * and illustrations before this direction ships to the live site.
 *
 * Replacing them is a change to this file only — no component references a
 * path directly.
 */

export const BANNER = {
  src: '/sandbox-assets/banner.jpg',
  // Decorative: the headline lives in real text beside it, not in the image.
  alt: '',
};

// Illustration mapped onto the category slugs the API actually returns.
// Unmapped slugs fall back to the category's own icon character.
export const CATEGORY_ART = {
  'vegetable-seeds': '/sandbox-assets/icons/seeds.png',
  'flower-seeds': '/sandbox-assets/icons/decor.png',
  'grow-bags': '/sandbox-assets/icons/pots.png',
  'soil-fertilizers': '/sandbox-assets/icons/soils.png',
  tools: '/sandbox-assets/icons/tools.png',
  plants: '/sandbox-assets/icons/plants.png',
  fertilizers: '/sandbox-assets/icons/fertilisers.png',
  'watering-solutions': '/sandbox-assets/icons/watering.png',
  'pest-control': '/sandbox-assets/icons/pest.png',
};

export const BADGES = [
  '/sandbox-assets/badges/b1.png',
  '/sandbox-assets/badges/b2.png',
  '/sandbox-assets/badges/b3.png',
];
