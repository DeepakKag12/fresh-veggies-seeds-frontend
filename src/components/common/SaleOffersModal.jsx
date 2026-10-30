import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  Sparkles,
  Truck,
  ShieldCheck,
  CreditCard,
  Banknote,
  Tag,
  Check,
  ArrowRight,
  MessageCircleQuestion,
  Gift
} from 'lucide-react';
import toast from 'react-hot-toast';

const SaleOffersModal = ({ isOpen, onClose, storeSettings }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [copiedCode, setCopiedCode] = useState(null);

  if (!isOpen) return null;

  const freeDeliveryThreshold = storeSettings?.delivery?.freeDeliveryThreshold || 499;

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCode(null), 2500);
  }

  const handleShopNow = () => {
    onClose();
    if (location.pathname === '/') {
      const el = document.getElementById('catalogue-heading') || document.getElementById('catalog');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 500, behavior: 'smooth' });
      }
    } else {
      navigate('/#catalogue-heading');
    }
  };

  const handleViewCombos = () => {
    onClose();
    navigate('/combos');
  };

  const handleOpenChat = () => {
    onClose();
    window.dispatchEvent(new CustomEvent('open-in-app-chat'));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sale-modal-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-emerald-100 dark:border-gray-800 animate-scaleUp">
        {/* Top Decorative Header */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-[#0A4D3C] via-[#0E5C49] to-[#0A4D3C] text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-bold tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Special Seasonal Event</span>
          </div>

          <h2 id="sale-modal-title" className="text-xl sm:text-2xl font-extrabold tracking-tight">
            🌱 Harvest Season Sale & Delivery Perks
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Everything you need for a thriving home garden with guaranteed viability and nationwide delivery.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Benefit 1: Free Delivery */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0 mt-0.5">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Free Express Delivery</h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">
                  Zero shipping fees on all orders above ₹{freeDeliveryThreshold} via DTDC courier.
                </p>
              </div>
            </div>

            {/* Benefit 2: Cash on Delivery */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-600 text-white shrink-0 mt-0.5">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Cash on Delivery (COD)</h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">
                  Pay with confidence at your doorstep. Zero advance payment pressure.
                </p>
              </div>
            </div>

            {/* Benefit 3: Prepaid Extra Discount */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Extra Prepaid Discount</h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">
                  Instant discount applied automatically on UPI, GPay, Card & Netbanking orders.
                </p>
              </div>
            </div>

            {/* Benefit 4: High Germination Guarantee */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white">Germination Guarantee</h4>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-snug">
                  100% Non-GMO fresh batch tested with &gt;85% high viability guarantee.
                </p>
              </div>
            </div>
          </div>

          {/* Active Promo Coupon Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border border-amber-300/60 dark:border-amber-700/50">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200">
                  Featured Coupon: HARVEST10
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyCode('HARVEST10')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
              >
                {copiedCode === 'HARVEST10' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Tag className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-amber-800/80 dark:text-amber-300/80">
              Get an extra 10% off on all Combo Kits, Soil Mixes and Vegetable Seed Packs!
            </p>
          </div>

          {/* Call to Actions */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={handleShopNow}
              className="w-full h-11 px-5 rounded-[50px] bg-[#0A4D3C] hover:bg-[#07382B] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-[1.01] cursor-pointer"
            >
              <span>Shop All Seeds & Plants</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleViewCombos}
                className="h-10 px-3 rounded-[50px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View Combos (30% Off)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenChat}
                className="h-10 px-3 rounded-[50px] bg-emerald-50 hover:bg-emerald-100 text-[#0A4D3C] border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircleQuestion className="w-3.5 h-3.5" />
                <span>Ask Plant Expert</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleOffersModal;
