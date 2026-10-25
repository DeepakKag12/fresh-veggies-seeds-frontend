import React from 'react';
import { Check, X, Minus, Sparkles } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

/**
 * Ugaoo-Identical "Why Choose Us vs The Rest" Comparison Matrix
 * Reverse engineered from live Ugaoo comparison table.
 */
const ROWS = [
  {
    feature: 'Plant & Seed Quality',
    local: 'Poor health, no germination checks',
    us: 'Vibrant, bushy & 3-step quality tested',
    others: 'Inconsistent batch quality',
  },
  {
    feature: 'Nutrient-Rich Soil',
    local: 'Heavy garden mud that suffocates roots',
    us: '90-day pre-fertilized potting mix with active microbes',
    others: 'Unfertilized standard coir peat',
  },
  {
    feature: 'Transit Packaging',
    local: 'Flimsy black bags that crush in transit',
    us: 'Patented breathable survival packaging',
    others: 'Ordinary cardboard boxes',
  },
  {
    feature: 'Guaranteed Arrival',
    local: 'No replacement once taken away',
    us: '100% Arrives Alive or free replacement',
    others: 'Complicated dispute process',
  },
  {
    feature: 'Gardener Guidance',
    local: 'Zero post-sale guidance',
    us: 'Free lifetime WhatsApp plant care support',
    others: 'Generic bot responses',
  },
];

const ComparisonMatrix = () => {
  const { settings } = useSettings();
  const storeName = settings?.store?.name || 'Fresh Veggies';

  return (
    <section id="comparison-matrix" className="bg-[#FFF6F4] py-14 sm:py-20 px-4 sm:px-6 lg:px-10 border-b border-gray-100" aria-label="Comparison Table">
      <div className="mx-auto max-w-[1300px]">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-[#0A4D3C] text-xs font-bold uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>The Superior Choice</span>
          </div>
          <h2 className="font-sans text-[24px] sm:text-[36px] lg:text-[42px] font-extrabold text-[#1C1C1C] tracking-tight leading-tight">
            Why Choose {storeName} vs The Rest
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-gray-600 leading-relaxed">
            See why over 100,000+ urban gardeners trust us for their plants, seeds, and soil.
          </p>
        </div>

        {/* Mobile View: Vertical Stacked Cards (Zero horizontal scrolling) */}
        <div className="block md:hidden space-y-3.5">
          {ROWS.map((row, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-4 border border-[#CADFD4]/70 shadow-xs"
            >
              {/* Feature Header */}
              <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-gray-100">
                <h3 className="font-bold text-[14px] text-[#1C1C1C] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#00A93D]" />
                  {row.feature}
                </h3>
                <span className="text-[11px] font-semibold text-gray-400">
                  {idx + 1} of {ROWS.length}
                </span>
              </div>

              {/* Recommended: Fresh Veggies Winner Box */}
              <div className="bg-gradient-to-br from-[#0A4D3C] to-[#0E5C49] text-white rounded-xl p-3.5 shadow-xs mb-2.5">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-4 h-4 rounded-full bg-[#00A93D] text-white flex items-center justify-center p-0.5 shadow-xs shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                    <span className="text-[13px] font-extrabold text-white truncate">
                      {storeName}
                    </span>
                  </div>
                  <span className="text-[#FED02F] bg-white/10 px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase shrink-0">
                    Recommended
                  </span>
                </div>
                <p className="text-[12.5px] font-medium text-emerald-50 leading-snug">
                  {row.us}
                </p>
              </div>

              {/* Competitors 2-Column Comparison */}
              <div className="grid grid-cols-2 gap-2">
                {/* Local Nurseries */}
                <div className="bg-[#FFF8F7] border border-red-100/80 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1">
                    <X className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="text-[11px] font-bold text-gray-700 truncate">
                      Local Nurseries
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight">
                    {row.local}
                  </p>
                </div>

                {/* Other Online Sellers */}
                <div className="bg-[#FFFDF5] border border-amber-100/80 rounded-xl p-2.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Minus className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-[11px] font-bold text-gray-700 truncate">
                      Other Sellers
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight">
                    {row.others}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Full Comparison Table */}
        <div className="hidden md:block rounded-[20px] bg-white border border-[#CADFD4]/60 shadow-md overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="p-4 sm:p-6 text-sm sm:text-base font-bold text-gray-700 w-1/4">
                  Feature
                </th>
                <th className="p-4 sm:p-6 text-sm sm:text-base font-semibold text-gray-500 w-1/4 text-center">
                  Local Nurseries
                </th>
                <th className="p-4 sm:p-6 text-base sm:text-lg font-extrabold text-white bg-[#0A4D3C] w-1/4 text-center relative shadow-sm">
                  <div className="flex flex-col items-center">
                    <span className="text-[#FED02F] text-xs uppercase tracking-wider font-bold mb-0.5">Recommended</span>
                    <span>{storeName}</span>
                  </div>
                </th>
                <th className="p-4 sm:p-6 text-sm sm:text-base font-semibold text-gray-500 w-1/4 text-center">
                  Other Online Sellers
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`border-b border-gray-100/80 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF7F2]/40'
                  }`}
                >
                  <td className="p-4 sm:p-5 font-bold text-[14px] sm:text-[15px] text-gray-800">
                    {row.feature}
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[13px] sm:text-[14px] text-gray-500">
                    <div className="flex flex-col items-center gap-1">
                      <X className="w-5 h-5 text-red-500 shrink-0" />
                      <span>{row.local}</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[13px] sm:text-[14px] text-[#0A4D3C] font-semibold bg-emerald-50/60 border-x border-[#0A4D3C]/10">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-6 h-6 rounded-full bg-[#00A93D] flex items-center justify-center text-white shrink-0 shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-[#042018] font-bold">{row.us}</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-center text-[13px] sm:text-[14px] text-gray-500">
                    <div className="flex flex-col items-center gap-1">
                      <Minus className="w-5 h-5 text-amber-500 shrink-0" />
                      <span>{row.others}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ComparisonMatrix;
