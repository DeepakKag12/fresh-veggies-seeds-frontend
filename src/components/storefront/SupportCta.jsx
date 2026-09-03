import React from 'react';
import { Link } from 'react-router-dom';

/** Full-width green panel closing the page with one clear action. */
const SupportCta = () => (
  <section className="bg-fv-primary px-4 pt-12 sm:px-6 lg:px-10" aria-labelledby="support-heading">
    <div className="mx-auto max-w-[1500px] rounded-[18px] bg-fv-leaf px-6 py-12 text-center sm:py-16">
      <h2 id="support-heading" className="font-serif text-[28px] font-semibold leading-tight text-white sm:text-[44px]">
        Not sure what to grow?
        <span className="block">We&apos;re here to help</span>
      </h2>
      <Link
        to="/contact"
        className="mt-8 inline-flex h-12 items-center rounded-[50px] bg-fv-primary px-8 text-[15px]
                   font-semibold text-white transition-colors duration-200 hover:bg-fv-primary-dark
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
                   focus-visible:ring-offset-2 focus-visible:ring-offset-fv-leaf motion-reduce:transition-none"
      >
        Talk to us
      </Link>
    </div>
  </section>
);

export default SupportCta;
