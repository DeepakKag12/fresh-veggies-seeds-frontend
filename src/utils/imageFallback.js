/**
 * Centralized Image Resolution & Resilient Fallback Utility
 * ─────────────────────────────────────────────────────────────────────────────
 * Ensures every image across the application (banners, storefront cards,
 * cart drawers, categories, and admin tables) always displays a high-quality,
 * contextually relevant visual even when remote URLs are missing, 404, or broken.
 */

export const DEFAULT_MONSOON_BANNER = '/sandbox-assets/banners/monsoon_gardening.jpg';
export const DEFAULT_BANNER_IMAGE = '/sandbox-assets/hero/slide_1.webp';
export const DEFAULT_PRODUCT_IMAGE = '/sandbox-assets/spotlight/spotlight_kitchen_garden.webp';
export const DEFAULT_SOIL_IMAGE = '/sandbox-assets/spotlight/spotlight_soil_care.webp';
export const DEFAULT_COMBO_IMAGE = '/sandbox-assets/hero/slide_3.webp';
export const DEFAULT_CATEGORY_ICON = '/sandbox-assets/icons/seeds.webp';

/**
 * Checks if a given image URL is likely broken or placeholder
 */
export const isBrokenUrl = (url) => {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return true;
  return (
    trimmed.includes('fresh-veggies/image/upload') ||
    trimmed.includes('via.placeholder') ||
    trimmed.includes('example.com') ||
    trimmed.includes('broken-image')
  );
};

/**
 * Returns a context-appropriate banner image based on banner content
 */
export const getBannerImageUrl = (rawUrl, title = '', tag = '') => {
  const content = `${title} ${tag}`.toLowerCase();

  // If URL is explicitly valid and not a dead dummy link, return it
  if (!isBrokenUrl(rawUrl)) {
    return rawUrl;
  }

  // Context-aware fallback resolution
  if (content.includes('monsoon') || content.includes('rain') || content.includes('sowing')) {
    return DEFAULT_MONSOON_BANNER;
  }
  if (content.includes('fertilizer') || content.includes('feed') || content.includes('nutrition') || content.includes('soil')) {
    return '/sandbox-assets/banners/organic_fertilizer_promo.webp';
  }
  if (content.includes('combo') || content.includes('kit') || content.includes('sale') || content.includes('deal') || content.includes('harvest') || content.includes('diwali')) {
    return DEFAULT_COMBO_IMAGE;
  }
  if (content.includes('indoor') || content.includes('decor') || content.includes('living')) {
    return '/sandbox-assets/hero/slide_2.webp';
  }
  if (content.includes('seed') || content.includes('garden') || content.includes('kitchen')) {
    return '/sandbox-assets/hero/slide_4.webp';
  }

  return DEFAULT_BANNER_IMAGE;
};

/**
 * Returns a context-appropriate product image based on title / category
 */
export const getProductImageUrl = (product) => {
  if (!product) return DEFAULT_PRODUCT_IMAGE;

  let candidate = null;
  if (Array.isArray(product.images) && product.images.length > 0) {
    candidate = product.images[0];
  } else if (product.image) {
    candidate = product.image;
  } else if (product.coverImage) {
    candidate = product.coverImage;
  }

  if (!isBrokenUrl(candidate)) {
    return candidate;
  }

  const name = (product.name || '').toLowerCase();
  const categoryName = (typeof product.categoryId === 'object' ? product.categoryId?.name : '')?.toLowerCase() || '';
  const combined = `${name} ${categoryName}`;

  if (combined.includes('fertilizer') || combined.includes('soil') || combined.includes('compost') || combined.includes('manure')) {
    return DEFAULT_SOIL_IMAGE;
  }
  if (combined.includes('combo') || combined.includes('kit') || combined.includes('bundle')) {
    return DEFAULT_COMBO_IMAGE;
  }

  return DEFAULT_PRODUCT_IMAGE;
};

/**
 * Universal onError handler that prevents infinite error loops and falls back
 * gracefully to a relevant context-appropriate image.
 */
export const handleImageError = (event, fallbackUrl = DEFAULT_PRODUCT_IMAGE) => {
  if (!event || !event.target) return;
  const img = event.target;
  if (img.dataset.hasHandledError === 'true') return;

  img.dataset.hasHandledError = 'true';
  img.src = fallbackUrl;
};
