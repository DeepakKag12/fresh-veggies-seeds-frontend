import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import api from '../../utils/api';

/**
 * Pincode serviceability, checked against the real courier integration at
 * /api/orders/check-pincode/:pincode.
 *
 * The three outcomes are kept distinct on purpose: serviceable, genuinely not
 * serviceable, and "we could not reach the courier". Collapsing the last into
 * "not serviceable" would tell customers something untrue whenever the courier
 * API is simply down.
 */
const DeliveryCheck = () => {
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' });

  const check = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setState({ status: 'invalid', message: 'Enter a valid 6-digit pincode' });
      return;
    }
    setState({ status: 'loading', message: '' });
    try {
      const res = await api.get(`/orders/check-pincode/${pincode}`);
      const d = res?.data?.data || {};
      if (d.serviceable) {
        setState({ status: 'ok', message: d.estimatedDelivery ? `Delivers by ${d.estimatedDelivery}` : 'Delivery available to this pincode' });
      } else if (d.error) {
        setState({ status: 'unknown', message: 'Could not reach the courier just now — please try again shortly.' });
      } else {
        setState({ status: 'no', message: 'We do not deliver to this pincode yet.' });
      }
    } catch {
      setState({ status: 'unknown', message: 'Could not check right now — please try again shortly.' });
    }
  };

  const tone = { ok: 'text-fv-success', no: 'text-fv-danger', invalid: 'text-fv-danger', unknown: 'text-fv-muted' }[state.status];

  return (
    <section className="mt-6 rounded-[12px] border border-fv-border bg-white p-4" aria-labelledby="delivery-heading">
      <h2 id="delivery-heading" className="flex items-center gap-2 text-[15px] font-semibold text-fv-heading">
        <MapPin className="h-4 w-4 text-fv-primary" aria-hidden="true" /> Check delivery
      </h2>
      <form onSubmit={check} className="mt-3 flex gap-2">
        <label htmlFor="pincode" className="sr-only">Delivery pincode</label>
        <input
          id="pincode"
          inputMode="numeric"
          maxLength={6}
          value={pincode}
          onChange={(e) => { setPincode(e.target.value.replace(/\D/g, '')); setState({ status: 'idle', message: '' }); }}
          placeholder="Enter 6-digit pincode"
          aria-invalid={state.status === 'invalid' || undefined}
          aria-describedby={state.message ? 'pincode-result' : undefined}
          className="h-11 min-w-0 flex-1 rounded-[8px] border border-fv-border px-3 text-[15px]
                     focus:border-fv-primary focus:outline-none focus:ring-2 focus:ring-fv-primary"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-[50px] bg-fv-primary px-5 text-[14px] font-semibold text-white
                     hover:bg-fv-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary
                     focus-visible:ring-offset-2"
        >
          {state.status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Check'}
        </button>
      </form>
      {state.message && (
        <p id="pincode-result" role="status" className={`mt-2 text-[14px] ${tone}`}>{state.message}</p>
      )}
    </section>
  );
};

export default DeliveryCheck;
