import React, { useState } from 'react';
import { Truck, X, Send, AlertCircle } from 'lucide-react';

export const DispatchModal = ({ isOpen, onClose, order, onConfirm, isSubmitting }) => {
  const [courierName, setCourierName] = useState('Local Express Delivery');
  const [customCourier, setCustomCourier] = useState('');
  const [awbNumber, setAwbNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');

  if (!isOpen || !order) return null;

  const orderNum = order.orderNumber || order._id?.slice(-6)?.toUpperCase();

  const handleDispatch = (e) => {
    e.preventDefault();
    const finalCourier = courierName === 'Other' ? (customCourier.trim() || 'Courier') : courierName;
    onConfirm({
      courierName: finalCourier,
      awbNumber: awbNumber.trim() || `RIDER-${Date.now().toString().slice(-4)}`,
      trackingUrl: trackingUrl.trim(),
      note: dispatchNote.trim() || `Order dispatched via ${finalCourier}`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-fv-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fv-border bg-fv-surface/40 dark:bg-gray-700/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fv-heading dark:text-white">
                Dispatch Order #{orderNum}
              </h2>
              <p className="text-xs text-fv-muted">Assign courier partner & tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-fv-muted hover:text-fv-heading rounded-lg hover:bg-fv-surface"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleDispatch} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fv-muted mb-1.5">
              Courier / Delivery Carrier
            </label>
            <select
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-700 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading min-h-[42px]"
            >
              <option value="Local Express Delivery">Local Express Delivery (Store Rider)</option>
              <option value="Dunzo Express">Dunzo Express</option>
              <option value="Porter Logistics">Porter Logistics</option>
              <option value="DTDC Courier">DTDC Courier</option>
              <option value="Delhivery">Delhivery</option>
              <option value="BlueDart">BlueDart</option>
              <option value="Other">Custom Courier / Other</option>
            </select>
          </div>

          {courierName === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-fv-muted mb-1.5">
                Carrier Name
              </label>
              <input
                type="text"
                value={customCourier}
                onChange={(e) => setCustomCourier(e.target.value)}
                placeholder="e.g. Velocity Logistics, Rider Ramesh"
                required
                className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-700 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading min-h-[42px]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-fv-muted mb-1.5">
              AWB / Tracking Number or Rider Mobile
            </label>
            <input
              type="text"
              value={awbNumber}
              onChange={(e) => setAwbNumber(e.target.value)}
              placeholder="e.g. DTDC9823412 or Rider +91 98765 00000"
              className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-700 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fv-muted mb-1.5">
              Live Tracking URL (Optional)
            </label>
            <input
              type="url"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://track.courier.com/..."
              className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-700 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fv-muted mb-1.5">
              Fulfillment Audit Note (Optional)
            </label>
            <input
              type="text"
              value={dispatchNote}
              onChange={(e) => setDispatchNote(e.target.value)}
              placeholder="e.g. Packed in crate #4, sent with morning run"
              className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-700 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading min-h-[42px]"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs text-blue-900 dark:text-blue-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
            <span>
              Moving order to <strong>Shipped</strong> sends an instant SMS/email update with tracking details to {order.shippingAddress?.name || 'the customer'}.
            </span>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-fv-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-fv-heading border border-fv-border rounded-xl hover:bg-fv-surface min-h-[42px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 min-h-[42px] disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Dispatching...' : 'Confirm Shipment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispatchModal;
