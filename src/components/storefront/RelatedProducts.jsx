import React, { useEffect, useState } from 'react';
import { cachedGet } from '../../utils/api';
import ProductCardV2 from './ProductCardV2';

/**
 * "You may also like" — real products from the same category, with the current
 * product excluded. Renders nothing at all when there is no genuine
 * alternative to show rather than padding the row with unrelated stock.
 */
const RelatedProducts = ({ categoryId, excludeId }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!categoryId) return undefined;
    let alive = true;
    (async () => {
      try {
        const res = await cachedGet('/products', { params: { category: categoryId, limit: 8 } });
        if (!alive) return;
        setItems((res?.data?.data || []).filter((p) => p._id !== excludeId).slice(0, 4));
      } catch { /* leave the section unrendered */ }
    })();
    return () => { alive = false; };
  }, [categoryId, excludeId]);

  if (!items.length) return null;

  return (
    <section className="bg-fv-cream px-4 py-14 sm:px-6 lg:px-10" aria-labelledby="related-heading">
      <div className="mx-auto max-w-[1500px]">
        <h2 id="related-heading" className="font-serif text-[28px] font-semibold text-fv-heading sm:text-[36px]">
          You may also like
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {items.map((p) => <ProductCardV2 key={p._id} product={p} />)}
        </div>
      </div>
    </section>
  );
};

export default RelatedProducts;
