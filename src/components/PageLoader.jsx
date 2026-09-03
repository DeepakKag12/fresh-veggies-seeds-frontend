import React from 'react';
import Loader from './Loader';

/** Centred loading state for a page or a section. */
const PageLoader = ({ size = 56, text = 'Loading…', fullHeight = false }) => (
  <div className={`flex w-full items-center justify-center ${fullHeight ? 'min-h-[60vh]' : 'py-16'}`}>
    <Loader size={size} text={text} />
  </div>
);

export default PageLoader;
