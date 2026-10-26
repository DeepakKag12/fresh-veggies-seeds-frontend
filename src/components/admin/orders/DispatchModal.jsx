import React, { useState, useEffect } from 'react';
import { Truck, X, Send, AlertCircle, ExternalLink } from 'lucide-react';

export const DispatchModal = ({ isOpen, onClose, order, onConfirm, isSubmitting }) => {
  const [courierName, setCourierName] = useState('DTDC');
  const [customCourier, setCustomCourier] = useState('');
  const [awbNumber, setAwbNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [dispatchNote, setDispatchNote] = useState('');

  useEffect(() => {
    if (order?.shipping?.awbNumber) {
      setAwbNumber(order.shipping.awbNumber);
    }
    if (order?.shipping?.courierName) {
      setCourierName(order.shipping.courierName);
    }
    if (order?.shipping?.trackingUrl) {
      setTrackingUrl(order.shipping.trackingUrl);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const orderNum = order.orderNumber || order._id?.slice(-8)?.toUpperCase();

  const handleAwbChange = (val) => {
    setAwbNumber(val);
    const trimmed = val.trim();
    if (trimmed && (courierName === 'DTDC' || courierName.toUpperCase().includes('DTDC'))) {
      setTrackingUrl(`https://www.dtdc.in/tracking.asp?strCnno=${trimmed}`);
    }
  };

  const handleCourierChange = (val) => {
    setCourierName(val);
    const trimmed = awbNumber.trim();
    if (trimmed && val === 'DTDC') {
      setTrackingUrl(`https://www.dtdc.in/tracking.asp?strCnno=${trimmed}`);
    }
  };

  const handleDispatch = (e) => {
    e.preventDefault();
    const finalCourier = courierName === 'Other' ? (customCourier.trim() || 'DTDC') : courierName;
    const finalAwb = awbNumber.trim() || `DTDC-${Date.now().toString().slice(-6)}`;
    const finalUrl = trackingUrl.trim() || (finalCourier.includes('DTDC') ? `https://www.dtdc.in/tracking.asp?strCnno=${finalAwb}` : '');

    onConfirm({
      courierName: finalCourier,
      courier: finalCourier,
      awbNumber: finalAwb,
      trackingNumber: finalAwb,
      trackingUrl: finalUrl,
      note: dispatchNote.trim() || `Dispatched via ${finalCourier} (AWB: ${finalAwb})`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-fv-border overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-fv-border bg-fv-surface/40 dark:bg-gray-700/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-fv-heading dark:text-white">
                Dispatch Order #{orderNum}
              </h2>
              <p className="text-xs text-fv-muted">Assign DTDC courier & tracking consignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-fv-muted hover:text-fv-heading rounded-lg hover:bg-fv-surface transition-colors cursor-pointer"
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
              onChange={(e) => handleCourierChange(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-700 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading min-h-[42px]"
            >
              <option value="DTDC">DTDC Express Courier (Official Partner)</option>
              <option value="Delhivery">Delhivery Express</option>
              <option value="BlueDart">BlueDart Logistics</option>
              <option value="Local Express Delivery">Local Store Rider</option>
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
              Consignment Number / AWB Tracking #
            </label>
            <input
              type="text"
              value={awbNumber}
              onChange={(e) => handleAwbChange(e.target.value)}
              placeholder="e.g. DTDC12345678 or D83921029"
              required
              className="w-full px-3 py-2 text-xs md:text-sm font-mono bg-white dark:bg-gray-700 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading min-h-[42px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fv-muted mb-1.5 flex items-center justify-between">
              <span>Live Tracking URL</span>
              {trackingUrl && (
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-fv-primary hover:underline"
                >
                  <span>Preview</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </label>
            <input
              type="url"
              value={trackingUrl}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://www.dtdc.in/tracking.asp?strCnno=..."
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
              placeholder="e.g. Sealed in tamper-proof pouch #12, handed to DTDC agent"
              className="w-full px-3 py-2 text-xs md:text-sm bg-white dark:bg-gray-700 border border-fv-border rounded-xl focus:ring-2 focus:ring-fv-primary text-fv-heading min-h-[42px]"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>
              Assigning tracking will automatically update status to <strong>Shipped</strong> and dispatch an instant tracking email & SMS with live link to {order.shippingAddress?.name || 'the customer'}.
            </span>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-fv-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-fv-heading border border-fv-border rounded-xl hover:bg-fv-surface min-h-[42px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 min-h-[42px] disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Updating...' : 'Assign & Notify Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DispatchModal;
