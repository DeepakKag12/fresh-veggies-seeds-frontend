import React from 'react';
import { Star, BadgeCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const TESTIMONIALS = [
  {
    id: 1,
    author: 'Pooja Sharma',
    city: 'Pune, Maharashtra',
    product: 'All Time Vegetable Seeds Kit',
    rating: 5,
    date: '2 days ago',
    comment: 'The germination rate is truly impressive. Within 4 days, my spinach and cherry tomato seeds sprouted. Packed very neatly in moisture-resistant foil packets. Best seeds for balcony growers!'
  },
  {
    id: 2,
    author: 'Vikram Sengupta',
    city: 'Bengaluru, Karnataka',
    product: 'Kitchen Garden Seed Kit',
    rating: 5,
    date: '1 week ago',
    comment: 'I have tried many seed brands online, but these had 90%+ germination. The WhatsApp support helped me get the right potting mix ratio. Now harvesting fresh coriander and mint weekly.'
  },
  {
    id: 3,
    author: 'Dr. Ananya Iyer',
    city: 'Chennai, Tamil Nadu',
    product: 'Organic Tomato Seeds (Hybrid)',
    rating: 5,
    date: '2 weeks ago',
    comment: 'Planted these in 12-inch grow bags on my terrace. Strong, disease-resistant plants that yielded heavy clusters of tomatoes. The packet size options (50 vs 100 seeds) are very practical.'
  }
];

const COMMUNITY_PHOTOS = [
  {
    id: 1,
    image: '/sandbox-assets/community/comm_1.webp',
    caption: 'Lush terrace harvest by Rajesh K.',
    tag: '#TerraceGarden'
  },
  {
    id: 2,
    image: '/sandbox-assets/community/comm_2.webp',
    caption: 'Healthy seedlings sprouting by Neha P.',
    tag: '#SeedSprouts'
  },
  {
    id: 3,
    image: '/sandbox-assets/community/comm_3.webp',
    caption: 'Fresh organic greens by Sunita M.',
    tag: '#KitchenHarvest'
  },
  {
    id: 4,
    image: '/sandbox-assets/community/comm_4.webp',
    caption: 'Balcony container garden by Amit V.',
    tag: '#BalconyGrower'
  }
];

const CustomerTestimonials = () => {
  return (
    <section className="bg-white py-16 px-4 sm:px-6 lg:px-10 border-t border-fv-border" aria-label="Customer Reviews and Community">
      <div className="mx-auto max-w-[1500px]">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-[#0A4D3C] text-xs font-bold mb-3 uppercase tracking-wider">
            <BadgeCheck className="w-3.5 h-3.5 text-[#00A93D]" />
            <span>Verified Customer Stories</span>
          </div>
          <h2 className="font-sans text-[28px] sm:text-[38px] lg:text-[44px] font-extrabold text-[#1C1C1C] leading-tight tracking-tight">
            1,00,000+ <span className="text-[#0A4D3C]">plant parents</span> and counting.
          </h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#00A93D] text-[#00A93D]" />
              ))}
            </div>
            <span className="text-sm font-bold text-[#1C1C1C]">4.8 out of 5</span>
            <span className="text-xs text-gray-500">based on 10,000+ verified customer reviews</span>
          </div>
        </div>

        {/* Testimonials 3-Col Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-16">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-[20px] p-7 border border-[#CADFD4]/70 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:border-[#0A4D3C]/50"
            >
              <div>
                {/* Rating + Verified Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex">
                    {[...Array(item.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#00A93D] text-[#00A93D]" />
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FED02F] text-[#0A4D3C] text-[11px] font-extrabold px-2.5 py-0.5 shadow-xs">
                    <BadgeCheck className="w-3.5 h-3.5 text-[#0A4D3C]" />
                    <span>Verified Buyer</span>
                  </span>
                </div>

                {/* Comment */}
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-6 font-normal">
                  &ldquo;{item.comment}&rdquo;
                </p>
              </div>

              {/* Author & Product */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-[#0A4D3C]">
                  Review for: <span className="font-bold underline">{item.product}</span>
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span className="font-bold text-gray-900">{item.author}</span>
                  <span>{item.city}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Community Showcase: "Made by us, Shared by you" */}
        <div className="bg-fv-page rounded-[24px] p-8 sm:p-12 border border-fv-border">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-fv-primary bg-emerald-50 px-3 py-1 rounded-md mb-2 inline-block">
                Community Harvests
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-fv-heading">
                Made by us, Shared by you
              </h3>
              <p className="text-xs sm:text-sm text-fv-muted mt-1">
                Real harvests, sprouting trays, and lush green spaces grown with our seeds across India.
              </p>
            </div>
            <Link
              to="/about"
              className="mt-4 md:mt-0 inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-fv-primary hover:text-fv-primary-dark group"
            >
              <span>Explore our growing family</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {COMMUNITY_PHOTOS.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-[18px] overflow-hidden border border-fv-border shadow-xs bg-gray-100"
              >
                <img
                  src={photo.image}
                  alt={photo.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end text-white">
                  <span className="text-[11px] font-bold text-fv-yellow">{photo.tag}</span>
                  <p className="text-xs font-medium leading-tight mt-0.5">{photo.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default CustomerTestimonials;
