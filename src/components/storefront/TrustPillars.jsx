import React from 'react';
import { Sprout, ShieldCheck, PackageCheck, Headphones } from 'lucide-react';

const PILLARS = [
  {
    icon: Sprout,
    title: '85%+ Tested Germination',
    description: 'Every seed batch is lab-tested for vigorous sprout viability and true-to-type genetics before dispatch.'
  },
  {
    icon: ShieldCheck,
    title: '100% Non-GMO & Organic',
    description: 'Naturally open-pollinated, untreated seeds grown for resilient immunity, rich flavor, and maximum harvest.'
  },
  {
    icon: PackageCheck,
    title: 'Moisture-Lock Foil Packaging',
    description: 'Multi-layer sealed packets safeguard seed viability from humidity and heat for up to 2 years of freshness.'
  },
  {
    icon: Headphones,
    title: 'Gardener Hotline Support',
    description: 'Have sowing questions? Message our expert horticulturists anytime for personal potting and care advice.'
  }
];

const TrustPillars = () => {
  return (
    <section className="bg-white py-12 px-4 sm:px-6 lg:px-10 border-b border-fv-border" aria-label="Why gardeners choose us">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-fv-cream/50 border border-fv-border/50 hover:bg-fv-cream transition-colors">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-fv-primary text-white shadow-xs">
                  <Icon className="h-6 w-6 text-fv-yellow" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-fv-heading">
                    {pillar.title}
                  </h3>
                  <p className="mt-1 text-xs text-fv-muted leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustPillars;
