import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, Sprout, HeartHandshake } from 'lucide-react';

const SPOTLIGHTS = [
  {
    tag: 'Beginner Friendly',
    title: 'Grow Your Own Kitchen Garden',
    description: 'Heirloom vegetable, fragrant herb, and nutrient-dense microgreen seeds paired with biodegradable starter pots and organic coco peat.',
    cta: 'Explore Seed Kits',
    to: '/combos',
    image: '/sandbox-assets/spotlight/spotlight_kitchen_garden.webp',
    fallbackImage: '/sandbox-assets/spotlight/spotlight_kitchen_garden.jpg',
    icon: Sprout,
  },
  {
    tag: '100% Chemical-Free',
    title: 'Pure Organic Nutrition & Plant Care',
    description: 'Cold-pressed neem oil shield, organic vermicompost, and liquid seaweed concentrate to build vigorous roots and natural pest resistance.',
    cta: 'Shop Plant Care',
    to: '/?category=fertilizers',
    image: '/sandbox-assets/spotlight/spotlight_soil_care.webp',
    fallbackImage: '/sandbox-assets/banners/organic_fertilizer_promo.webp',
    icon: HeartHandshake,
  },
];

const FeatureSpotlight = () => {
  return (
    <section className="bg-fv-cream/70 py-12 px-4 sm:px-6 lg:px-10 border-y border-fv-border/60" aria-label="Gardening Collections Spotlight">
      <div className="mx-auto max-w-[1500px]">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-fv-primary text-xs font-semibold uppercase tracking-wider mb-2.5">
            <Leaf className="w-3.5 h-3.5 text-[#00A93D]" />
            <span>Curated For Your Home</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-fv-heading">
            Everything You Need For A Flourishing Garden
          </h2>
          <p className="mt-2 text-sm sm:text-base text-fv-muted">
            From high-germination heirloom seeds to certified organic soil care, explore our hand-crafted gardener essentials.
          </p>
        </div>

        {/* Dual Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {SPOTLIGHTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-[20px] bg-white border border-fv-border/80 shadow-xs transition-all duration-500 hover:shadow-xl hover:border-emerald-300"
              >
                {/* Visual Image Container */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-emerald-950/20">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = item.fallbackImage || '/sandbox-assets/hero/slide_4.webp';
                    }}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

                  {/* Floating Tag */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-[#fed02f] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#0a4c36] shadow-md">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.tag}</span>
                  </div>

                  {/* Overlaid Title on Image */}
                  <div className="absolute bottom-4 left-4 right-4 z-10">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white drop-shadow-sm leading-tight">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Card Description & CTA Footer */}
                <div className="p-5 sm:p-6 bg-white flex flex-col justify-between">
                  <p className="text-sm text-gray-600 leading-relaxed mb-6">
                    {item.description}
                  </p>
                  <div>
                    <Link
                      to={item.to}
                      className="inline-flex items-center gap-2 rounded-full bg-fv-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:bg-fv-primary-dark hover:gap-3 hover:shadow-md cursor-pointer"
                    >
                      <span>{item.cta}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeatureSpotlight;
