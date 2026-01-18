import React from 'react';
import SeedLoader from './SeedLoader';
import './PageLoader.css';

/**
 * PageLoader - Uses the SeedLoader for page/section loading states
 * Can be used inline or centered in a container
 */
const PageLoader = ({ size = 48, text = 'Loading...', centered = true, fullHeight = false }) => {
  const containerClass = `page-loader ${centered ? 'page-loader--centered' : ''} ${fullHeight ? 'page-loader--full-height' : ''}`;
  
  return (
    <div className={containerClass}>
      <SeedLoader size={size} text={text} />
    </div>
  );
};

export default PageLoader;
