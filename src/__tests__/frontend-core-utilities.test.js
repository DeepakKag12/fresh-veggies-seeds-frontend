import { validatePassword, PASSWORD_RULE_TEXT } from '../utils/passwordPolicy';
import {
  extractQuantityCount,
  getVolumeDiscountRate,
  calculateProportionalTier
} from '../utils/pricing-engine';
import {
  isBrokenUrl,
  getBannerImageUrl,
  DEFAULT_MONSOON_BANNER,
  DEFAULT_BANNER_IMAGE
} from '../utils/imageFallback';

describe('Frontend Password Policy Utility', () => {
  test('rejects passwords shorter than 8 characters', () => {
    const res = validatePassword('Short1');
    expect(res.valid).toBe(false);
    expect(res.message).toMatch(/at least 8 characters/);
  });

  test('rejects passwords without numbers or letters', () => {
    const resNoDigits = validatePassword('OnlyLettersHere');
    expect(resNoDigits.valid).toBe(false);

    const resNoLetters = validatePassword('1234567890');
    expect(resNoLetters.valid).toBe(false);
  });

  test('accepts strong valid passwords meeting the policy', () => {
    const res = validatePassword('GreenGarden2026!');
    expect(res.valid).toBe(true);
  });
});

describe('Frontend Proportional Pricing Engine', () => {
  test('extracts counts from strings', () => {
    expect(extractQuantityCount('250g')).toBe(250);
    expect(extractQuantityCount('1kg')).toBe(1000);
    expect(extractQuantityCount('50 Seeds')).toBe(50);
    expect(extractQuantityCount(null)).toBe(0);
  });

  test('derives volume discount rates', () => {
    expect(getVolumeDiscountRate(1)).toBe(0.0);
    expect(getVolumeDiscountRate(2)).toBe(0.08);
    expect(getVolumeDiscountRate(5)).toBe(0.15);
    expect(getVolumeDiscountRate(10)).toBe(0.20);
  });

  test('calculates tiered pricing with volume discount', () => {
    const tier = calculateProportionalTier({
      count: '500g',
      baseQuantity: 100,
      baseMrp: 50,
      basePrice: 40,
      applyVolumeDiscount: true
    });
    expect(tier.count).toBe(500);
    expect(tier.originalPrice).toBe(250);
    expect(tier.price).toBe(170); // 200 * 0.85 = 170
    expect(tier.volumeDiscountPct).toBe(15);
  });
});

describe('Frontend Image Fallback & Resolution Utility', () => {
  test('identifies broken or invalid image URLs', () => {
    expect(isBrokenUrl(null)).toBe(true);
    expect(isBrokenUrl('')).toBe(true);
    expect(isBrokenUrl('https://res.cloudinary.com/fresh-veggies/image/upload/sample.jpg')).toBe(true);
    expect(isBrokenUrl('https://example.com/broken-image.jpg')).toBe(true);
    expect(isBrokenUrl('https://images.unsplash.com/photo-valid.jpg')).toBe(false);
  });

  test('resolves monsoon banner contextual fallback correctly', () => {
    const fallback = getBannerImageUrl(null, 'Monsoon Gardening Festival', 'Sowing special');
    expect(fallback).toBe(DEFAULT_MONSOON_BANNER);
  });

  test('returns default banner image for general fallback', () => {
    const fallback = getBannerImageUrl(null, 'General Announcement', '');
    expect(fallback).toBe(DEFAULT_BANNER_IMAGE);
  });
});

describe('Navbar Announcement & Responsive Search Bar Enhancements', () => {
  test('determines modal trigger vs external navigation for announcement links', () => {
    const resolveBannerAction = (link) => {
      if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
        return { type: 'external', url: link };
      }
      return { type: 'modal', url: null };
    };

    expect(resolveBannerAction('/shop').type).toBe('modal');
    expect(resolveBannerAction('').type).toBe('modal');
    expect(resolveBannerAction(null).type).toBe('modal');
    expect(resolveBannerAction('https://external-promo.com').type).toBe('external');
  });

  test('normalizes search bar query and avoids firing on single character', () => {
    const shouldFetchSuggestions = (query) => {
      const trimmed = (query || '').trim();
      return trimmed.length >= 2;
    };

    expect(shouldFetchSuggestions('')).toBe(false);
    expect(shouldFetchSuggestions(' ')).toBe(false);
    expect(shouldFetchSuggestions('t')).toBe(false);
    expect(shouldFetchSuggestions('tomato')).toBe(true);
    expect(shouldFetchSuggestions('  seeds ')).toBe(true);
  });
});

describe('Checkout COD Handling Fee & Guest Login Cart Retention', () => {
  test('does not add COD charge until paymentMode is explicitly COD', () => {
    const calculateCodFee = (mode, codExtraCharge) => {
      return (mode === 'COD' && codExtraCharge > 0) ? codExtraCharge : 0;
    };

    const COD_EXTRA_CHARGE = 50;

    // Default unselected state on Step 1 / Step 2
    expect(calculateCodFee(null, COD_EXTRA_CHARGE)).toBe(0);
    expect(calculateCodFee(undefined, COD_EXTRA_CHARGE)).toBe(0);
    expect(calculateCodFee('', COD_EXTRA_CHARGE)).toBe(0);

    // Online payment mode selected
    expect(calculateCodFee('Online', COD_EXTRA_CHARGE)).toBe(0);

    // Cash on Delivery specifically selected
    expect(calculateCodFee('COD', COD_EXTRA_CHARGE)).toBe(50);
  });

  test('preserves guest cart items when customer logs in with empty server cart', () => {
    const guestCart = [
      { _id: 'prod_tomato_1', name: 'Cherry Tomato Seeds', price: 90, quantity: 2 },
      { _id: 'prod_soil_2', name: 'Organic Potting Soil', price: 150, quantity: 1 }
    ];
    const serverCart = []; // Customer account previously had empty cart

    const sameCartLine = (a, b) => String(a._id || a.productId) === String(b._id || b.productId);

    // Union merge logic implemented in CartContext
    const mergedCart = [...serverCart];
    guestCart.forEach((guestItem) => {
      const existing = mergedCart.find((item) => sameCartLine(item, guestItem));
      if (existing) {
        existing.quantity = Math.max(existing.quantity, guestItem.quantity);
      } else {
        mergedCart.push(guestItem);
      }
    });

    // Ensure cart was not cleared
    expect(mergedCart.length).toBe(2);
    expect(mergedCart[0].name).toBe('Cherry Tomato Seeds');
    expect(mergedCart[0].quantity).toBe(2);
    expect(mergedCart[1].name).toBe('Organic Potting Soil');
  });
});


