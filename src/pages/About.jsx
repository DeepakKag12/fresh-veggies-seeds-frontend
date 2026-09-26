import React from 'react';
import {
  Sprout,
  ShieldCheck,
  Truck,
  Headphones,
  CheckCircle2,
  HeartHandshake,
  SunMedium,
  Home,
  UtensilsCrossed,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

/**
 * [CHG-012] & [CHG-015] Professional About Page.
 * Authentic agricultural brand story, mission, seed standards,
 * and garden solutions without fake stats or artificial claims.
 */
const About = () => {
  const { settings } = useSettings();
  const storeName = settings?.store?.name || 'Fresh Veggies';
  const deliveryTime = settings?.delivery?.deliveryTime || '3–5 Days';

  const pillars = [
    {
      icon: Sprout,
      title: 'Authentic Non-GMO Seeds',
      desc: 'Selected from traditional open-pollinated parent crops to ensure natural flavor, vigorous growth, and true-to-type harvesting.',
      badge: 'Purity First'
    },
    {
      icon: ShieldCheck,
      title: 'Germination Tested',
      desc: 'Every batch undergoes batch vitality checks before packaging so urban and backyard growers achieve reliable sprouting.',
      badge: 'Quality Assured'
    },
    {
      icon: Truck,
      title: 'Prompt India-Wide Dispatch',
      desc: `Carefully packed in moisture-resistant pouches and dispatched within ${deliveryTime} across all serviceable pin codes.`,
      badge: 'Safe Transit'
    },
    {
      icon: Headphones,
      title: 'Practical Sowing Support',
      desc: 'Direct WhatsApp and email guidance on soil mix composition, seasonal sowing calendars, and pest management.',
      badge: 'Grower Advice'
    },
  ];

  const spaces = [
    {
      icon: Sprout,
      title: 'Beginner Growers',
      desc: 'Fast-germinating greens like spinach, coriander, and radish that build gardening confidence with simple soil and water routines.'
    },
    {
      icon: Home,
      title: 'Balcony & Terrace Pots',
      desc: 'Space-efficient varieties of cherry tomatoes, chili, and brinjals tailored for grow bags and container aeration.'
    },
    {
      icon: UtensilsCrossed,
      title: 'Kitchen Herb Gardens',
      desc: 'Aromatic herbs and essential greens harvested fresh daily right beside your kitchen window or balcony railing.'
    }
  ];

  const values = [
    {
      title: 'Agricultural Integrity',
      desc: 'We never compromise on seed freshness or origin. Honest labeling and accurate sowing details accompany every package.'
    },
    {
      title: 'Sustainable Nutrition',
      desc: 'Empowering urban households to harvest chemical-free, pesticide-free greens and vegetables directly from their living spaces.'
    },
    {
      title: 'Grower-First Support',
      desc: 'Gardening is a learning journey. We stay available with practical advice from seed germination through flowering to fruit set.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 md:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-green-900 rounded-3xl p-8 sm:p-12 mb-10 text-white shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-200 bg-white/10 px-3 py-1 rounded-full mb-4 backdrop-blur-sm">
              <Sprout className="w-3.5 h-3.5 text-emerald-300" />
              Rooted in Natural Agriculture
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Pure Seeds for Thriving Home Gardens
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base md:text-lg leading-relaxed mb-6 font-normal">
              Welcome to {storeName}. We started with a straightforward purpose: to provide home gardeners and urban families across India with viable, high-quality vegetable seeds, tested combo packs, and trustworthy guidance.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-emerald-200">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Non-Hybrid Native Varieties
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Moisture-Barrier Packing
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Direct Customer Assistance
              </div>
            </div>
          </div>
        </div>

        {/* Mission & Purpose */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mb-3 inline-block">
                Our Mission
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif mb-3">
                Making Fresh Food Accessible at Home
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                We believe that growing food at home is one of the most rewarding steps toward family health and food independence. Our mission is to eliminate the frustration of low-germination seeds by providing thoroughly screened seeds suited to Indian weather conditions and container gardening.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <SunMedium className="w-4 h-4 text-emerald-600" /> Adapted for Indian balcony & terrace climates
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md mb-3 inline-block">
                Our Origin
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif mb-3">
                Built by Passionate Growers
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                Operating out of Madhya Pradesh, our team works closely with seed multipliers and local growers. We personally test seed germination and crop vigor in pots, raised beds, and grow bags before releasing varieties to our customers.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <Layers className="w-4 h-4 text-emerald-600" /> Rigorous batch testing on real container gardens
            </div>
          </div>
        </div>

        {/* Quality Pillars */}
        <div className="mb-10">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-serif">
              Our Seed Quality Standards
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              Every packet of seeds we distribute follows clear handling and storage standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {pillars.map(({ icon: Icon, title, desc, badge }) => (
              <div
                key={title}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition-colors"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center mb-3.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wide">
                    {badge}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1 mb-2">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Garden Spaces */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-10">
          <div className="max-w-xl mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
              Solutions for Every Living Space
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Whether you have a 4-foot balcony or an expansive open terrace, we curate seed assortments that fit your available sunlight and container depth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spaces.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-emerald-700">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Core Principles */}
        <div className="bg-emerald-50/50 rounded-2xl p-6 sm:p-8 border border-emerald-100 mb-10">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
              Our Commitments to You
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              What you can reliably count on with every interaction and order.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map(({ title, desc }) => (
              <div key={title} className="bg-white p-5 rounded-xl border border-emerald-100 shadow-xs">
                <div className="flex items-center gap-2 mb-2 text-emerald-700 font-bold text-sm">
                  <HeartHandshake className="w-4 h-4" />
                  <span>{title}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA to Explore Catalogue */}
        <div className="text-center py-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Ready to start your home harvest?</h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-5">
            Browse our freshly packaged seasonal seeds, all-in-one combos, and organic gardening essentials.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-sm"
          >
            <span>Explore Seeds Catalogue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
};

export default About;
