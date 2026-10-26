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
  ArrowRight,
  Leaf,
  Award,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const About = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const storeName = settings?.store?.name || 'Fresh Veggies';
  const deliveryTime = settings?.delivery?.deliveryTime || '3–5 Days';
  const whatsappNumber = settings?.store?.whatsappNumber || '9876543210';

  const stats = [
    { value: '50,000+', label: 'Thriving Home Gardens' },
    { value: '85%+', label: 'Tested Germination Rate' },
    { value: '100%', label: 'Non-GMO & Open-Pollinated' },
    { value: '28', label: 'Indian States Served' },
  ];

  const pillars = [
    {
      icon: Sprout,
      title: 'Authentic Non-GMO Seeds',
      desc: 'Selected from traditional open-pollinated parent crops to ensure natural flavor, vigorous growth, and true-to-type harvesting in Indian conditions.',
      badge: 'Purity First'
    },
    {
      icon: ShieldCheck,
      title: 'Lab-Tested Germination',
      desc: 'Every single batch undergoes rigorous vitality testing so balcony and backyard growers achieve reliable, vigorous sprouting without guesswork.',
      badge: 'Quality Assured'
    },
    {
      icon: Truck,
      title: 'Moisture-Lock Packaging',
      desc: `Carefully sealed in multi-layer foil pouches that shield seeds from humidity and heat, dispatched safely across India within ${deliveryTime}.`,
      badge: 'Safe Transit'
    },
    {
      icon: Headphones,
      title: 'Expert Horticulturist Support',
      desc: 'Free WhatsApp and phone guidance on soil mix composition, seed depth, sunlight hours, and seasonal pest prevention from real gardeners.',
      badge: 'Lifelong Guidance'
    },
  ];

  const spaces = [
    {
      icon: Sprout,
      title: 'Beginner Gardeners',
      desc: 'Fast-germinating greens like spinach, coriander, microgreens, and radish that build gardening joy and confidence in under 40 days.'
    },
    {
      icon: Home,
      title: 'Balcony & Container Pots',
      desc: 'Space-efficient varieties of bush tomatoes, bird-eye chilies, and round brinjals specially bred for pots and grow bags.'
    },
    {
      icon: UtensilsCrossed,
      title: 'Kitchen Herb Gardens',
      desc: 'Fragrant herbs and essential cooking greens harvested fresh daily right beside your kitchen windowsill or terrace railing.'
    }
  ];

  const values = [
    {
      icon: Leaf,
      title: 'Botanical & Agricultural Integrity',
      desc: 'We never compromise on seed freshness or origin. Honest batch dates, true counts or weights, and transparent sowing instructions accompany every packet.'
    },
    {
      icon: Award,
      title: 'Nutritious, Chemical-Free Food',
      desc: 'Empowering everyday families to harvest 100% pesticide-free, nutrient-rich produce directly from their living spaces to their dinner tables.'
    },
    {
      icon: HeartHandshake,
      title: 'Grower-First Community',
      desc: 'Gardening is a shared learning experience. We celebrate your sprouts, troubleshoot your yellowing leaves, and guide you through to harvest.'
    }
  ];

  return (
    <div className="min-h-screen bg-fv-page py-10 md:py-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Breadcrumbs & Back Navigation */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-xs text-fv-muted">
              <li>
                <Link to="/" className="hover:text-fv-primary hover:underline font-medium">
                  Shop
                </Link>
              </li>
              <li aria-hidden="true"><ChevronRight className="h-3 w-3" /></li>
              <li aria-current="page" className="font-semibold text-fv-heading">
                About Us
              </li>
            </ol>
          </nav>
          <button
            type="button"
            onClick={() => {
              if (location.state?.from) {
                navigate(location.state.from);
              } else if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-fv-border bg-white dark:bg-gray-800 hover:bg-fv-surface text-xs font-semibold text-fv-heading transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-fv-primary" />
            <span>Back</span>
          </button>
        </div>

        {/* Botanical Hero Banner */}
        <div className="relative rounded-[28px] overflow-hidden bg-fv-primary text-white p-8 sm:p-14 md:p-20 mb-14 shadow-lg">
          <div className="absolute inset-0 opacity-15 pointer-events-none">
            <img
              src="/sandbox-assets/about/about_hero.webp"
              alt="Greenhouse seeds"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fv-yellow bg-white/10 px-4 py-1.5 rounded-full mb-6 backdrop-blur-xs">
              <Leaf className="w-3.5 h-3.5 text-fv-yellow" />
              <span>Plant Parenting & Natural Sowing Made Simple</span>
            </span>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              Pure Seeds for Thriving Home Gardens
            </h1>

            <p className="text-white/90 text-base sm:text-lg md:text-xl leading-relaxed mb-8 font-normal">
              Welcome to {storeName}. Inspired by India&apos;s rich agricultural tradition and modern urban green spaces, we make growing vegetables, flowers, and herbs accessible, delightful, and foolproof for everyone.
            </p>

            <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-emerald-100 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-fv-yellow" />
                <span>85%+ Tested Germination</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-fv-yellow" />
                <span>100% Non-GMO Native Varieties</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-fv-yellow" />
                <span>Moisture-Shield Packets</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Counter Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 text-center border border-fv-border shadow-xs hover:border-emerald-300 transition-colors"
            >
              <div className="font-serif text-3xl sm:text-4xl font-extrabold text-fv-primary">
                {stat.value}
              </div>
              <p className="mt-1.5 text-xs sm:text-sm font-medium text-fv-muted">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Brand Mission & Botanical Journey */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 items-center">
          <div className="bg-white rounded-[24px] p-8 sm:p-12 border border-fv-border shadow-xs">
            <span className="text-xs uppercase font-bold tracking-wider text-fv-primary bg-emerald-50 px-3 py-1 rounded-md mb-4 inline-block">
              Our Story & Mission
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-fv-heading font-serif mb-5 leading-snug">
              Every Great Garden Starts with an Honest Seed
            </h2>
            <div className="space-y-4 text-sm sm:text-base text-fv-ink leading-relaxed">
              <p>
                Urban living often disconnects us from nature. We believe that sinking your hands into rich, organic soil and watching a tiny seed sprout on your windowsill is deeply grounding, joyful, and transformative.
              </p>
              <p>
                Too often, home gardeners struggle with old seeds, poor germination, and zero growing guidance. We built {storeName} to change that — delivering freshly harvested, vitality-tested seeds, custom-blended organic potting media, and ongoing gardener support right to your door.
              </p>
              <p>
                Whether you are sowing cherry tomatoes in a sunny corner or cultivating fresh coriander on your balcony, we are with you at every stage from sprout to harvest.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-3 text-xs sm:text-sm font-semibold text-fv-primary">
              <SunMedium className="w-5 h-5 text-fv-accent" />
              <span>Specially acclimatized for Indian balconies, terraces & backyards</span>
            </div>
          </div>

          <div className="relative rounded-[24px] overflow-hidden border border-fv-border shadow-md h-full min-h-[380px]">
            <img
              src="/sandbox-assets/about/about_story.webp"
              alt="Hands holding organic seeds"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-8 text-white">
              <div>
                <p className="font-serif text-lg font-bold">100% Viability Tested</p>
                <p className="text-xs text-white/80 mt-1">Inspected in container garden test-beds before releasing to our customers.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seed Quality Standards */}
        <div className="mb-16">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase font-bold tracking-wider text-fv-primary bg-emerald-50 px-3 py-1 rounded-md mb-2 inline-block">
              Uncompromising Standards
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-fv-heading font-serif">
              Our 4 Pillars of Seed Vitality
            </h2>
            <p className="text-fv-muted text-sm sm:text-base mt-2">
              How we guarantee strong sprouts, resilient growth, and generous harvests for your home.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map(({ icon: Icon, title, desc, badge }) => (
              <div
                key={title}
                className="bg-white rounded-[20px] p-6 border border-fv-border shadow-xs flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition-all duration-300"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-fv-cream text-fv-primary border border-emerald-200/60 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-fv-primary" />
                  </div>
                  <span className="text-[11px] font-bold text-fv-primary uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                    {badge}
                  </span>
                  <h3 className="text-base font-bold text-fv-heading mt-2.5 mb-2 font-serif">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-fv-muted leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Solutions for Every Living Space */}
        <div className="bg-fv-cream rounded-[24px] p-8 sm:p-12 border border-fv-border mb-16">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-fv-heading font-serif">
              Gardening Solutions for Every Space
            </h2>
            <p className="text-sm text-fv-muted mt-2">
              From compact 4-foot balconies to open terrace gardens, we match seed varieties to your specific sunlight and container conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {spaces.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white p-6 rounded-2xl border border-fv-border shadow-xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-fv-cream text-fv-primary flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-fv-heading mb-1 font-serif">{title}</h3>
                  <p className="text-xs text-fv-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Our Commitments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white p-7 rounded-[20px] border border-fv-border shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-fv-primary flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-fv-primary" />
                </div>
                <h3 className="font-serif text-base font-bold text-fv-heading mb-2">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-fv-muted leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA to Shop or Get Support */}
        <div className="bg-fv-primary rounded-[24px] p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-md">
          <h2 className="font-serif text-2xl sm:text-4xl font-bold mb-3">
            Ready to Begin Your Home Harvest?
          </h2>
          <p className="text-white/80 text-sm sm:text-base max-w-lg mx-auto mb-8">
            Explore our tested vegetable seeds, herb kits, and all-in-one balcony combos with free expert guidance.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-fv-yellow text-fv-primary hover:brightness-95 font-bold text-sm px-7 py-3 rounded-full transition-all shadow-md"
            >
              <span>Explore Seeds Catalogue</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={`https://wa.me/91${whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent('Hi! I would like to get advice on gardening seeds.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm px-7 py-3 rounded-full border border-white/30 backdrop-blur-xs transition-all"
            >
              <Headphones className="w-4 h-4 text-fv-yellow" />
              <span>Talk to our Gardener (+91 {whatsappNumber})</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
