import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, Search } from 'lucide-react';

/**
 * 404. Previously an unknown URL rendered the header and footer with an empty
 * space between them, which reads as a broken page rather than a wrong address.
 */
const NotFound = () => {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-fv-page px-4 py-20 text-center">
      <Sprout className="h-14 w-14 text-fv-primary/30" aria-hidden="true" />
      <h1 className="mt-6 font-serif text-[30px] font-semibold text-fv-heading sm:text-[38px]">
        This page doesn&apos;t exist
      </h1>
      <p className="mt-2 max-w-md text-[15px] text-fv-muted">
        We couldn&apos;t find <code className="rounded bg-white px-1.5 py-0.5 text-[14px]">{pathname}</code>.
        It may have been moved, or the link may be wrong.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex h-12 items-center gap-2 rounded-[50px] bg-fv-primary px-6 text-[15px] font-semibold
                     text-white hover:bg-fv-primary-dark focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-fv-primary focus-visible:ring-offset-2"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          Browse the shop
        </Link>
        <Link
          to="/contact"
          className="inline-flex h-12 items-center rounded-[50px] border border-fv-primary px-6 text-[15px]
                     font-semibold text-fv-primary hover:bg-fv-primary hover:text-white
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fv-primary"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
