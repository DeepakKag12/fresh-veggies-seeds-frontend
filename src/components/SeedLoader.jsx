import React from 'react';
import './SeedLoader.css';

/**
 * SeedLoader - Watering & Growing Plant Animation
 * Theme: eco-friendly, organic, fresh produce
 */
const SeedLoader = ({ size = 48, text = '' }) => {
  return (
    <div className="seed-loader" style={{ '--loader-size': `${size}px` }}>
      <div className="seed-loader__scene">
        {/* Pot */}
        <div className="seed-loader__pot">
          <div className="seed-loader__pot-top"></div>
          <div className="seed-loader__pot-body"></div>
        </div>
        
        {/* Soil in pot */}
        <div className="seed-loader__soil"></div>
        
        {/* Water drops */}
        <div className="seed-loader__water">
          <div className="seed-loader__drop seed-loader__drop--1"></div>
          <div className="seed-loader__drop seed-loader__drop--2"></div>
          <div className="seed-loader__drop seed-loader__drop--3"></div>
        </div>
        
        {/* Plant stem */}
        <div className="seed-loader__stem"></div>
        
        {/* Leaves */}
        <div className="seed-loader__leaf seed-loader__leaf--1"></div>
        <div className="seed-loader__leaf seed-loader__leaf--2"></div>
        <div className="seed-loader__leaf seed-loader__leaf--3"></div>
        <div className="seed-loader__leaf seed-loader__leaf--4"></div>
        
        {/* Top sprout */}
        <div className="seed-loader__sprout"></div>
      </div>
      {text && <span className="seed-loader__text">{text}</span>}
    </div>
  );
};

export default SeedLoader;
