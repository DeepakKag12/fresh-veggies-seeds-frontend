import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sprout, Search, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * 404. Previously an unknown URL rendered the header and footer with an empty
 * space between them, which reads as a broken page rather than a wrong address.
 */
const NotFound = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || pathname.startsWith('/admin');

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
        <button
          type="button"
          onClick={() => {
            if (window.history.state && window.history.state.idx > 0) {
              navigate(-1);
            } else {
              navigate(isAdmin ? '/admin/dashboard' : '/');
            }
          }}
          className="inline-flex h-12 items-center gap-2 rounded-[50px] border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 text-[15px] font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Go Back
        </button>

        {isAdmin ? (
          <Link
            to="/admin/dashboard"
            className="inline-flex h-12 items-center gap-2 rounded-[50px] bg-fv-primary px-6 text-[15px] font-semibold text-white hover:bg-fv-primary-dark transition-colors shadow-xs"
          >
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Open Admin Dashboard
          </Link>
        ) : (
          <Link
            to="/"
            className="inline-flex h-12 items-center gap-2 rounded-[50px] bg-fv-primary px-6 text-[15px] font-semibold text-white hover:bg-fv-primary-dark transition-colors shadow-xs"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Browse the shop
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotFound;
