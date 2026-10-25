import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

const FAQS = [
  {
    category: 'Seeds & Germination',
    items: [
      {
        q: 'How do I ensure a high germination rate for my seeds?',
        a: 'Every seed batch is lab-tested to guarantee 85%+ germination viability. For optimal results, use a light, well-draining seed-starting mix (e.g. 70% cocopeat + 30% vermicompost). Keep the soil uniformly moist without waterlogging, provide filtered warmth/sunlight, and never sow seeds deeper than 2–3 times their thickness.'
      },
      {
        q: 'Are your seeds open-pollinated, non-GMO, and natural?',
        a: 'Yes, 100%. All our vegetable, herb, and flower seeds are naturally open-pollinated, non-GMO, and free of synthetic chemical coatings. They produce nutrient-dense, flavorful produce and can be harvested for future seed saving.'
      },
      {
        q: 'How long do seeds stay fresh in the packet?',
        a: 'Our seeds are packed inside multi-layered, moisture-barrier foil packets that protect them from air, humidity, and heat. Unopened packets stay viable for up to 24 months when stored in a cool, dark, dry place.'
      }
    ]
  },
  {
    category: 'Shipping & Delivery',
    items: [
      {
        q: 'How long does delivery take across India?',
        a: 'Orders are processed and dispatched within 24 to 48 business hours. Depending on your location, express courier delivery typically takes 2 to 4 business days for metro cities and 4 to 6 business days for rest of India.'
      },
      {
        q: 'What is the free shipping threshold?',
        a: 'We offer Free Standard Delivery on all orders above ₹499. For orders below ₹499, a nominal flat shipping fee applies at checkout.'
      },
      {
        q: 'How can I track my shipment?',
        a: 'As soon as your package is dispatched, you will receive an SMS and email notification with your tracking ID. You can also track your live shipment anytime from the "My Orders" tab on your account.'
      }
    ]
  },
  {
    category: 'Growing & Care Support',
    items: [
      {
        q: 'Can beginners grow these seeds in balcony pots and containers?',
        a: 'Yes! Our seeds are specially selected for container resilience, kitchen gardens, and terrace setups. Detailed, step-by-step sowing instructions and care guides are provided on every product page and packet.'
      },
      {
        q: 'Do you offer horticulturist consultation?',
        a: 'Yes, our gardening team is available via WhatsApp to answer your potting, pest control, and watering questions. Tap our live WhatsApp support button on the bottom corner to chat directly with a plant expert.'
      }
    ]
  }
];

const FAQAccordion = () => {
  const { settings } = useSettings();
  const storePhone = settings?.store?.phone || '919876543210';
  const cleanPhone = storePhone.replace(/[^0-9]/g, '');
  const [activeCategory, setActiveCategory] = useState(FAQS[0].category);
  const [openIndex, setOpenIndex] = useState(0);

  const currentCategoryData = FAQS.find((c) => c.category === activeCategory) || FAQS[0];

  const handleToggle = (idx) => {
    setOpenIndex((prev) => (prev === idx ? -1 : idx));
  };

  return (
    <section className="bg-fv-cream/60 py-16 px-4 sm:px-6 lg:px-10 border-t border-fv-border/60" aria-label="Frequently Asked Questions">
      <div className="mx-auto max-w-[1100px]">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 text-fv-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Got Questions?</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-fv-heading">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm sm:text-base text-fv-muted">
            Everything you need to know about seed viability, safe foil packaging, doorstep shipping, and growing your garden.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {FAQS.map((cat) => {
            const isActive = cat.category === activeCategory;
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.category);
                  setOpenIndex(0);
                }}
                className={`rounded-full px-5 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-fv-primary text-white shadow-xs'
                    : 'bg-white text-gray-700 border border-fv-border hover:border-fv-primary hover:text-fv-primary'
                }`}
              >
                {cat.category}
              </button>
            );
          })}
        </div>

        {/* Accordion Items */}
        <div className="space-y-3.5">
          {currentCategoryData.items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="overflow-hidden rounded-2xl border border-fv-border/80 bg-white transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => handleToggle(idx)}
                  className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition-colors hover:bg-fv-page/50 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span className="font-sans text-sm sm:text-base font-semibold text-gray-900 pr-4">
                    {item.q}
                  </span>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fv-cream transition-transform duration-300 ${
                    isOpen ? 'rotate-180 bg-fv-primary text-white' : 'text-fv-primary'
                  }`}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 pt-0">
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Expert Help Card */}
        <div className="mt-10 rounded-2xl bg-gradient-to-r from-[#0A4C36] to-[#083B2A] p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="font-serif text-lg font-bold">Have more questions about planting?</h3>
            <p className="text-xs sm:text-sm text-white/80 mt-1">
              Our gardening team is on WhatsApp every day to help your garden thrive.
            </p>
          </div>
          <a
            href={`https://wa.me/${cleanPhone}?text=Hi%2C%20I%20have%20a%20question%20about%20seeds%20and%20gardening`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#fed02f] px-5 py-2.5 text-xs sm:text-sm font-bold text-[#0a4c36] hover:bg-[#ffe169] transition-all hover:scale-105 shrink-0 shadow-xs"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat with Expert</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQAccordion;
