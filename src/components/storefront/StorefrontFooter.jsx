import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Linkedin, ArrowRight } from 'lucide-react';
import BadgeMarquee from './BadgeMarquee';
import { useSettings } from '../../context/SettingsContext';

/**
 * Dark footer: link columns, newsletter, socials, legal row, then the spinning
 * badge strip. Every link points at a route that exists in App.jsx — no dead
 * placeholders.
 */
const COLUMNS = [
  {
    heading: 'Shop',
    links: [
      { label: 'All products', to: '/shop' },
      { label: 'Combo offers', to: '/combos' },
      { label: 'Your cart', to: '/cart' },
    ],
  },
  {
    heading: 'Your account',
    links: [
      { label: 'Sign in', to: '/login' },
      { label: 'Create account', to: '/register' },
      { label: 'Your orders', to: '/orders' },
      { label: 'Settings', to: '/settings' },
    ],
  },
  {
    heading: 'About us',
    links: [
      { label: 'Our story', to: '/about' },
      { label: 'Contact us', to: '/contact' },
    ],
  },
  {
    heading: 'Help',
    links: [
      { label: 'Track your order', to: '/orders' },
      { label: 'Terms & conditions', to: '/terms' },
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Shipping & returns', to: '/shipping' },
    ],
  },
];

const SOCIALS = [
  { Icon: Facebook, label: 'Facebook' },
  { Icon: Instagram, label: 'Instagram' },
  { Icon: Youtube, label: 'YouTube' },
  { Icon: Linkedin, label: 'LinkedIn' },
];

const StorefrontFooter = () => {
  const { settings } = useSettings();
  const freeDeliveryThreshold = settings?.delivery?.freeDeliveryThreshold ?? 300;

  return (
    <footer className="bg-fv-primary text-white">
      <div className="mx-auto max-w-[1500px] px-4 pt-12 pb-20 sm:py-14 sm:px-6 lg:px-10">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_2fr]">
          {/* Brand + newsletter */}
          <div>
            <p className="font-serif text-[32px] font-bold leading-none">Fresh Veggies</p>
            <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-white/70">
              Seeds, soil and tools for growing your own food at home.
            </p>

            <form className="mt-6 max-w-sm" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="footer-email" className="sr-only">Email address</label>
              <div className="relative">
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Enter email address"
                  className="h-12 w-full rounded-[8px] border border-white/25 bg-transparent pl-4 pr-12
                             text-[15px] text-white placeholder:text-white/50 focus:border-white
                             focus:outline-none focus:ring-2 focus:ring-fv-yellow"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to updates"
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center
                             rounded-[6px] text-white hover:bg-white/10 focus-visible:outline-none
                             focus-visible:ring-2 focus-visible:ring-fv-yellow"
                >
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </form>

            <ul className="mt-6 flex gap-3">
              {SOCIALS.map(({ Icon, label }) => (
                <li key={label}>
                  <a
                    href="/contact"
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-fv-yellow
                               text-fv-primary transition-transform duration-200 hover:scale-105
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
                               motion-reduce:transition-none motion-reduce:hover:scale-100"
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map(({ heading, links }) => (
              <nav key={heading} aria-label={heading}>
                <h2 className="font-serif text-[18px] font-semibold text-fv-yellow">{heading}</h2>
                <ul className="mt-4 space-y-2.5">
                  {links.map(({ label, to }) => (
                    <li key={label}>
                      <Link
                        to={to}
                        className="text-[14px] text-white/85 hover:text-white hover:underline
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-yellow"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/15">
        <p className="mx-auto max-w-[1500px] px-4 py-5 text-[13px] text-white/65 sm:px-6 lg:px-10">
          © {new Date().getFullYear()} Fresh Veggies · Free delivery on orders over ₹{freeDeliveryThreshold}
        </p>
      </div>

      <BadgeMarquee />
    </footer>
  );
};

export default StorefrontFooter;
