import React from 'react';
import { Sprout } from 'lucide-react';

/**
 * Ugaoo-Identical "From Our Farm to Your Home" 4-Card Section
 * Reverse engineered from live Ugaoo section: template--...__farm_to_home_RHbLUe
 */
const FARM_PILLARS = [
  {
    image: '/sandbox-assets/farm/farm_1.webp',
    title: 'Grown at our farm',
    text: 'Nurtured in our greenhouse farm for 4–8 weeks before reaching you.',
  },
  {
    image: '/sandbox-assets/farm/farm_2.webp',
    title: '3-step quality check',
    text: 'Only the healthiest make it to you. Inspected for roots, leaves, and zero pests.',
  },
  {
    image: '/sandbox-assets/farm/farm_3.webp',
    title: 'Survival packaging',
    text: 'Ventilated, recyclable boxes crafted to survive rough transit without damage.',
  },
  {
    image: '/sandbox-assets/farm/farm_4.webp',
    title: 'Arrives alive guarantee',
    text: 'Guaranteed healthy delivery or we replace it for free. No questions asked.',
  },
];

const FarmToHome = () => {
  return (
    <section className="bg-white py-14 sm:py-20 px-4 sm:px-6 lg:px-10 border-b border-gray-100" aria-label="Farm to Home Guarantee">
      <div className="mx-auto max-w-[1500px]">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-[#0A4D3C] text-xs font-bold uppercase tracking-wider mb-2.5">
            <Sprout className="w-3.5 h-3.5 text-[#00A93D]" />
            <span>Farm to Doorstep</span>
          </div>
          <h2 className="font-sans text-[28px] sm:text-[38px] lg:text-[42px] font-extrabold text-[#1C1C1C] tracking-tight">
            From Our Farm to Your Home
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Every plant is nursed in our farms, hand-picked, and packed to survive the journey — not just reach your doorstep.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FARM_PILLARS.map((card, idx) => (
            <div
              key={idx}
              className="group flex flex-col rounded-[20px] bg-[#FAF7F2] overflow-hidden border border-[#CADFD4]/50 shadow-xs hover:shadow-lg transition-all duration-300 hover:border-[#0A4D3C]/40"
            >
              <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/sandbox-assets/farm/farm_1.webp';
                  }}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-sans text-[17px] sm:text-[18px] font-bold text-[#1C1C1C] group-hover:text-[#0A4D3C] transition-colors mb-1.5">
                  {card.title}
                </h3>
                <p className="text-[13px] sm:text-[14px] text-gray-600 leading-relaxed">
                  {card.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FarmToHome;
