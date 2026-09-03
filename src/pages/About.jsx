import React from 'react';
import { Leaf, ShieldCheck, Truck, Headphones } from 'lucide-react';

const features = [
  {
    icon: Leaf,
    title: '100% Organic',
    desc: 'All our seeds are organic and non-GMO, perfect for healthy home gardening.',
    color: 'text-fv-primary bg-fv-cream',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Assured',
    desc: 'High germination rate guaranteed with proper growing instructions.',
    color: 'text-fv-primary bg-fv-cream',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    desc: 'Quick and safe delivery across India to your doorstep.',
    color: 'text-fv-primary bg-fv-cream',
  },
  {
    icon: Headphones,
    title: 'Expert Support',
    desc: 'WhatsApp support for all your gardening queries and doubts.',
    color: 'text-fv-primary bg-fv-cream',
  },
];

const gardenTypes = [
  { emoji: '🌱', title: 'Beginners', desc: 'Easy-to-grow seeds with detailed growing instructions.' },
  { emoji: '🏠', title: 'Terrace Gardeners', desc: 'Specially curated combos for terrace and balcony gardens.' },
  { emoji: '👨‍🍳', title: 'Kitchen Gardens', desc: 'Fresh herbs and vegetables for your cooking needs.' },
];

const About = () => {
  return (
    <div className="min-h-screen bg-fv-page py-10">
      <div className="max-w-5xl mx-auto px-4">

        {/* Hero Banner */}
        <div className="bg-fv-primary rounded-[18px] p-6 md:p-10 mb-8 text-white">
          <h1 className="font-serif text-[30px] md:text-[42px] font-semibold mb-3"><span aria-hidden="true">🌱</span> Treat Your Self Organic</h1>
          <p className="text-white/80 text-sm md:text-base leading-relaxed max-w-3xl">
            Welcome to Fresh Veggies — your trusted partner in organic home gardening. We specialise in providing
            premium quality organic seeds, combo packs, and complete gardening solutions for beginners and
            enthusiasts alike.
          </p>
        </div>

        {/* Mission + Why Us */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-[12px] p-6 border border-fv-border ">
            <h2 className="font-serif text-[20px] font-semibold text-fv-heading  mb-3">Our Mission</h2>
            <p className="text-fv-muted  text-sm leading-relaxed">
              To make organic home gardening accessible and easy for everyone. We believe that growing your own
              vegetables is not just a hobby, but a step towards a healthier lifestyle and a sustainable future.
            </p>
          </div>
          <div className="bg-white rounded-[12px] p-6 border border-fv-border ">
            <h2 className="font-serif text-[20px] font-semibold text-fv-heading  mb-3">Why Choose Us?</h2>
            <p className="text-fv-muted  text-sm leading-relaxed">
              We carefully select and test all our seeds to ensure high germination rates. Our combo packs are
              designed specifically for Indian homes — whether you have a terrace, balcony, or kitchen garden.
            </p>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
             className="bg-white rounded-[12px] p-4 border border-fv-border  flex flex-col items-center text-center"
            >
              <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-fv-heading  mb-1">{title}</h3>
              <p className="text-xs text-fv-muted  leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Perfect For */}
        <div className="bg-white rounded-[12px] p-6 border border-fv-border ">
          <h2 className="font-serif text-[20px] font-semibold text-fv-heading  mb-4">Perfect For</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {gardenTypes.map(({ emoji, title, desc }) => (
              <div key={title} className="flex gap-3">
                <span className="text-2xl flex-shrink-0">{emoji}</span>
                <div>
                  <h3 className="text-sm font-semibold text-fv-heading  mb-1">{title}</h3>
                  <p className="text-xs text-fv-muted ">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
