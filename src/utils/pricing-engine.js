/**
 * Frontend Proportional Variant Pricing Engine (FEAT-006)
 * Benchmark: Costco / BulkSupplements / Instacart (Volume & Tiered Pricing)
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides algorithmic unit pricing, volume discount curve derivation,
 * comparative unit savings ("Save 18% vs base pack"), and standard tier generation.
 */

export function extractQuantityCount(quantityStr) {
  if (typeof quantityStr === 'number') return quantityStr;
  if (!quantityStr) return 0;
  const str = String(quantityStr).trim();

  // Handle kg conversion to grams
  const kgMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|kilograms?)/i);
  if (kgMatch) {
    return parseFloat(kgMatch[1]) * 1000;
  }

  // Handle grams or seed counts
  const match = str.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

export function getVolumeDiscountRate(ratio) {
  if (ratio >= 10) return 0.20; // 20% volume discount on 10x bulk tier (e.g. 1kg vs 100g)
  if (ratio >= 5)  return 0.15; // 15% volume discount on 5x tier (e.g. 500g vs 100g)
  if (ratio >= 2)  return 0.08; // 8% volume discount on 2x-4x tier (e.g. 250g vs 100g)
  return 0.0;
}

export function calculateProportionalTier({
  count,
  baseQuantity,
  baseMrp,
  basePrice,
  applyVolumeDiscount = true
}) {
  const numericCount = extractQuantityCount(count);
  const baseQty = Number(baseQuantity) > 0 ? Number(baseQuantity) : 1;
  const bMrp = Number(baseMrp) > 0 ? Number(baseMrp) : (Number(basePrice) || 100);
  const bPrice = Number(basePrice) > 0 ? Number(basePrice) : Math.round(bMrp * 0.75);

  if (numericCount <= 0) {
    return { count: 0, originalPrice: bMrp, price: bPrice, ratio: 1, volumeDiscountPct: 0 };
  }

  const ratio = numericCount / baseQty;
  const proportionalMrp = Math.round((bMrp * numericCount) / baseQty);
  let sellingPrice = Math.round((bPrice * numericCount) / baseQty);

  let volumeDiscountPct = 0;
  if (applyVolumeDiscount && ratio > 1) {
    const discountRate = getVolumeDiscountRate(ratio);
    volumeDiscountPct = Math.round(discountRate * 100);
    sellingPrice = Math.round(sellingPrice * (1 - discountRate));
  }

  sellingPrice = Math.min(sellingPrice, proportionalMrp);

  return {
    count: numericCount,
    originalPrice: proportionalMrp,
    price: Math.max(0, sellingPrice),
    ratio: Math.round(ratio * 100) / 100,
    volumeDiscountPct
  };
}

/**
 * Computes comparative volume savings relative to buying multiples of the base unit.
 * Benchmark: Costco / BulkSupplements "Save ₹X (Y% cheaper per unit)"
 */
export function calculateComparativeSavings(tierPrice, tierCount, basePrice, baseQuantity) {
  const tCount = extractQuantityCount(tierCount);
  const bCount = extractQuantityCount(baseQuantity);
  if (tCount <= 0 || bCount <= 0 || !basePrice || !tierPrice) {
    return { savingsAmount: 0, savingsPct: 0, unitSavingsText: '' };
  }

  const baseUnitRate = basePrice / bCount;
  const baseEquivalentCost = Math.round(baseUnitRate * tCount);
  const savingsAmount = Math.max(0, baseEquivalentCost - tierPrice);
  const savingsPct = baseEquivalentCost > 0 ? Math.round((savingsAmount / baseEquivalentCost) * 100) : 0;

  return {
    savingsAmount,
    savingsPct,
    baseEquivalentCost,
    unitSavingsText: savingsPct > 0 ? `Save ₹${savingsAmount} (${savingsPct}% cheaper vs ${baseQuantity} base)` : ''
  };
}

export function generateStandardTiers({ baseQuantity, baseMrp, basePrice, type = 'weight' }) {
  const isWeight = type === 'weight';
  const tierConfigs = isWeight
    ? [
        { label: '100g', count: 100 },
        { label: '250g', count: 250 },
        { label: '500g', count: 500 },
        { label: '1kg',  count: 1000 },
      ]
    : [
        { label: '50 Seeds',  count: 50 },
        { label: '100 Seeds', count: 100 },
        { label: '250 Seeds', count: 250 },
        { label: '500 Seeds', count: 500 },
      ];

  const baseQty = Number(baseQuantity) || (isWeight ? 100 : 50);
  const bMrp = Number(baseMrp) || 100;
  const bPrice = Number(basePrice) || Math.round(bMrp * 0.75);

  return tierConfigs.map((cfg) => {
    const tier = calculateProportionalTier({
      count: cfg.count,
      baseQuantity: baseQty,
      baseMrp: bMrp,
      basePrice: bPrice,
      applyVolumeDiscount: true
    });

    return {
      quantity: cfg.label,
      price: tier.price.toString(),
      originalPrice: tier.originalPrice.toString(),
      stock: '50',
      isCustomPrice: false
    };
  });
}
