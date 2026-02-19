import React from 'react';
import { Leaf, ShieldCheck, Truck, Headphones } from 'lucide-react';

const features = [
  {
    icon: Leaf,
    title: '100% Organic',
    desc: 'All our seeds are organic and non-GMO, perfect for healthy home gardening.',
    color: 'text-green-600 bg-green-100',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Assured',
    desc: 'High germination rate guaranteed with proper growing instructions.',
    color: 'text-blue-600 bg-blue-100',
  },
  {
    icon: Truck,
    title: 'Fast Delivery',
    desc: 'Quick and safe delivery across India to your doorstep.',
    color: 'text-indigo-600 bg-indigo-100',
  },
  {
    icon: Headphones,
    title: 'Expert Support',
    desc: 'WhatsApp support for all your gardening queries and doubts.',
    color: 'text-orange-600 bg-orange-100',
  },
];

const gardenTypes = [
  { emoji: '🌱', title: 'Beginners', desc: 'Easy-to-grow seeds with detailed growing instructions.' },
  { emoji: '🏠', title: 'Terrace Gardeners', desc: 'Specially curated combos for terrace and balcony gardens.' },
  { emoji: '👨‍🍳', title: 'Kitchen Gardens', desc: 'Fresh herbs and vegetables for your cooking needs.' },
];

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-24">
      <div className="max-w-5xl mx-auto px-4">

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 md:p-10 mb-8 text-white">
          <h1 className="text-2xl md:text-4xl font-bold mb-3">🌱 Treat Your Self Organic</h1>
          <p className="text-green-100 text-sm md:text-base leading-relaxed max-w-3xl">
            Welcome to Fresh Veggies — your trusted partner in organic home gardening. We specialise in providing
            premium quality organic seeds, combo packs, and complete gardening solutions for beginners and
            enthusiasts alike.
          </p>
        </div>

        {/* Mission + Why Us */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Our Mission</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              To make organic home gardening accessible and easy for everyone. We believe that growing your own
              vegetables is not just a hobby, but a step towards a healthier lifestyle and a sustainable future.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Why Choose Us?</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
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
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center"
            >
              <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Perfect For */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Perfect For</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {gardenTypes.map(({ emoji, title, desc }) => (
              <div key={title} className="flex gap-3">
                <span className="text-2xl flex-shrink-0">{emoji}</span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
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
