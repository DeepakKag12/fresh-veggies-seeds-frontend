import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SeedLoader from './SeedLoader';
import './PageTransitionLoader.css';

/**
 * PageTransitionLoader - Shows SeedLoader during route transitions
 */
const PageTransitionLoader = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Show loader on route change
    setIsLoading(true);
    setIsVisible(true);

    // Wait for full plant growth animation (1.5s) before fading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1300);

    // Fade out animation delay
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 1600);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [location.pathname]);

  if (!isVisible) return null;

  return (
    <div className={`page-transition-loader ${!isLoading ? 'page-transition-loader--fade-out' : ''}`}>
      <SeedLoader size={64} text="Loading..." />
    </div>
  );
};

export default PageTransitionLoader;
