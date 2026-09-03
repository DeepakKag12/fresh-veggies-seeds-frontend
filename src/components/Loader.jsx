import React from 'react';
import { Sprout } from 'lucide-react';
import './Loader.css';

/**
 * The one loading indicator for the app.
 *
 * Announced via role="status" so screen readers hear the state change without
 * the spinner itself being described; the ring and sprout are decorative.
 */
const Loader = ({ size = 56, text = 'Loading…', className = '' }) => (
  <div className={`fv-loader ${className}`} style={{ '--fv-loader-size': `${size}px` }} role="status">
    <span className="fv-loader__ring">
      <span className="fv-loader__mark">
        <Sprout style={{ width: size * 0.4, height: size * 0.4 }} aria-hidden="true" />
      </span>
    </span>
    {text && <span className="fv-loader__text">{text}</span>}
    <span className="sr-only">{text || 'Loading'}</span>
  </div>
);

export default Loader;
