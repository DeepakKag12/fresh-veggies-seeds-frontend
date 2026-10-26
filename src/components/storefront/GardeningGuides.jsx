import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Clock, Sprout, X, CheckCircle2 } from 'lucide-react';

const GUIDES = [
  {
    id: 1,
    title: 'Beginner Balcony Garden: 5 Seeds That Never Fail',
    summary: 'Discover easy-to-grow vegetables and herbs that thrive in container pots and give high harvest yields in 45 days.',
    category: 'Balcony Gardening',
    readTime: '4 min read',
    image: '/sandbox-assets/guides/guide_1.webp',
    link: '/?category=vegetable-seeds',
    content: [
      'Container Selection: Use 8-12 inch pots with drainage holes at the bottom.',
      'Potting Mix: Blend 50% coco peat, 30% vermicompost, and 20% garden soil for light aeration.',
      'Top 5 Easy Seeds: Cherry Tomatoes, Coriander, Spinach (Palak), Green Chili, and Basil.',
      'Sunlight: Ensure at least 4 to 5 hours of morning or filtered afternoon sun.',
      'Watering Rule: Only water when top inch of soil feels dry to the touch.'
    ]
  },
  {
    id: 2,
    title: 'How to Sow Seeds for 90%+ Germination',
    summary: 'Master soil depth, moisture balance, and temperature tricks used by commercial nurseries to sprout every single seed.',
    category: 'Sowing Secrets',
    readTime: '6 min read',
    image: '/sandbox-assets/guides/guide_2.webp',
    link: '/?category=vegetable-seeds',
    content: [
      'The 2X Depth Rule: Never bury a seed deeper than twice its diameter (small seeds need only 0.5 cm).',
      'Pre-Soak Trick: Soak hard seeds (Okra, Bitter Gourd) in lukewarm water for 6-8 hours before sowing.',
      'Consistent Moisture: Spray with a fine misting bottle to avoid washing away tiny seeds.',
      'Warmth & Darkness: Keep seed trays in a warm, sheltered spot until first sprouts emerge.',
      'Hardening Off: Gradually introduce tender sprouts to outdoor sunlight over 3-4 days.'
    ]
  },
  {
    id: 3,
    title: 'Complete Kitchen Garden Kit: Fresh Salad Greens Daily',
    summary: 'Everything you need to know about growing Spinach, Lettuce, Coriander, and Microgreens on sunny windowsills.',
    category: 'Kitchen Greens',
    readTime: '5 min read',
    image: '/sandbox-assets/guides/guide_3.webp',
    link: '/combos',
    content: [
      'Continuous Sowing: Plant small batches every 10 days for an unbroken harvest cycle.',
      'Cut-and-Come-Again: Snip outer leaves of spinach and lettuce; the center keeps growing.',
      'Organic Feeding: Add a handful of vermicompost or seaweed tonic every 15 days.',
      'Microgreen Bonus: Harvest dense nutrient shoots in just 10-14 days on kitchen windowsills.',
      'Pest Shield: Spray organic neem oil diluted in water every fortnight to ward off pests naturally.'
    ]
  }
];

const GardeningGuides = () => {
  const navigate = useNavigate();
  const [selectedGuide, setSelectedGuide] = useState(null);

  const handleAction = (e, targetUrl) => {
    e.preventDefault();
    e.stopPropagation();

    if (!targetUrl) return;

    if (targetUrl === '/combos' || targetUrl.startsWith('/combos')) {
      navigate('/combos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    navigate(targetUrl);
    setTimeout(() => {
      const el = document.getElementById('catalogue-heading');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 500, behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <section className="bg-[#FFF6F4] py-16 px-4 sm:px-6 lg:px-10 border-t border-b border-[#CADFD4]/50" aria-label="Plant Care Guides">
      <div className="mx-auto max-w-[1500px]">
        {/* Header matching Ugaoo's 'Plant care, simplified' */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/90 text-[#0A4D3C] text-xs font-bold mb-3 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5 text-[#0A4D3C]" />
              <span>Plant Care & Knowledge</span>
            </div>
            <h2 className="font-sans text-[28px] sm:text-[38px] lg:text-[42px] font-extrabold text-[#1C1C1C] leading-tight tracking-tight">
              Plant care, simplified
            </h2>
            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl">
              Free expert guides, seasonal sowing tips, and step-by-step planting tutorials to help your home garden flourish.
            </p>
          </div>
          <Link
            to="/about"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-bold text-[#0A4D3C] hover:text-[#083B2A] group"
          >
            <span>Learn our gardening story</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {GUIDES.map((guide) => (
            <article
              key={guide.id}
              onClick={() => setSelectedGuide(guide)}
              className="bg-white rounded-[20px] overflow-hidden border border-[#CADFD4]/70 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group cursor-pointer hover:border-[#0A4D3C]/60"
            >
              <div className="relative h-48 sm:h-52 overflow-hidden bg-gray-100">
                <img
                  src={guide.image}
                  alt={guide.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  decoding="async"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/sandbox-assets/guides/guide_1.jpg';
                  }}
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-bold bg-white/95 backdrop-blur-xs text-[#0A4D3C] shadow-xs">
                  {guide.category}
                </span>
                <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-medium bg-black/65 text-white backdrop-blur-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {guide.readTime}
                </span>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-sans text-[18px] sm:text-[20px] font-bold text-[#1C1C1C] group-hover:text-[#0A4D3C] transition-colors line-clamp-2">
                    {guide.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {guide.summary}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">
                    Click to read full guide
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleAction(e, guide.link)}
                    className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#0A4D3C] hover:text-[#083B2A] cursor-pointer group-hover:gap-1.5 transition-all"
                  >
                    <span>Shop Seeds</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Guide Reading Modal */}
      {selectedGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleUp">
            {/* Modal Header Image */}
            <div className="relative h-48 sm:h-56 w-full shrink-0">
              <img
                src={selectedGuide.image}
                alt={selectedGuide.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/sandbox-assets/guides/guide_1.jpg';
                }}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <button
                type="button"
                onClick={() => setSelectedGuide(null)}
                aria-label="Close guide"
                className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-md hover:bg-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-5 right-5 text-white">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#fed02f] text-[10px] font-bold uppercase tracking-wider text-[#0a4c36] mb-1.5">
                  {selectedGuide.category} · {selectedGuide.readTime}
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold leading-tight">
                  {selectedGuide.title}
                </h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed font-medium">
                {selectedGuide.summary}
              </p>
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-fv-primary flex items-center gap-1.5">
                  <Sprout className="w-4 h-4" />
                  <span>Key Growing Steps</span>
                </h4>
                <ul className="space-y-2.5">
                  {selectedGuide.content.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 bg-fv-cream/50 p-3 rounded-xl border border-fv-border/50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedGuide(null)}
                className="rounded-full px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const target = selectedGuide.link;
                  setSelectedGuide(null);
                  handleAction(e, target);
                }}
                className="inline-flex items-center gap-2 rounded-full bg-fv-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-fv-primary-dark transition-all cursor-pointer"
              >
                <span>Shop Recommended Seeds</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default GardeningGuides;
