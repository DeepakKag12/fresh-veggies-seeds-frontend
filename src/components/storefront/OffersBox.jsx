import React, { useEffect, useState } from 'react';
import { Tag, Truck } from 'lucide-react';
import { cachedGet } from '../../utils/api';
import { useSettings } from '../../context/SettingsContext';

/**
 * Offers. The free-delivery line mirrors dynamic store settings; the
 * coupons come from /api/coupons/active. When no coupons are running the box
 * shows only what is genuinely true rather than inventing a promotion.
 */
const OffersBox = () => {
  const { settings } = useSettings();
  const [coupons, setCoupons] = useState([]);
  const freeDeliveryThreshold = settings?.delivery?.freeDeliveryThreshold ?? 300;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await cachedGet('/coupons/active');
        if (alive) setCoupons(res?.data?.data || []);
      } catch { /* the free-delivery line still stands on its own */ }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <section className="mt-6 rounded-[12px] border border-fv-border bg-fv-cream p-4" aria-labelledby="offers-heading">
      <h2 id="offers-heading" className="text-[15px] font-semibold text-fv-heading">Offers for you</h2>
      <ul className="mt-3 space-y-3">
        <li className="flex items-start gap-3">
          <Truck className="mt-0.5 h-5 w-5 shrink-0 text-fv-primary" aria-hidden="true" />
          <p className="text-[14px] text-fv-ink">
            Free delivery on orders over <strong>₹{freeDeliveryThreshold}</strong>
            <span className="block text-[13px] text-fv-muted">Applied automatically at checkout</span>
          </p>
        </li>
        {coupons.map((c) => (
          <li key={c._id} className="flex items-start gap-3">
            <Tag className="mt-0.5 h-5 w-5 shrink-0 text-fv-primary" aria-hidden="true" />
            <p className="text-[14px] text-fv-ink">
              <strong>{c.code}</strong> — {c.description || 'Discount available'}
              {c.minPurchase > 0 && (
                <span className="block text-[13px] text-fv-muted">On orders above ₹{c.minPurchase}</span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default OffersBox;
