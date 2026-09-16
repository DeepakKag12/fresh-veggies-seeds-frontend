import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { cachedGet } from '../utils/api';

const WhatsAppButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [phone, setPhone] = useState('919993248054');
  const message = 'Hello! I need help with Fresh Veggies products.';

  useEffect(() => {
    cachedGet('/settings')
      .then(res => {
        const num = res?.data?.data?.store?.whatsappNumber;
        if (num) {
          const clean = num.replace(/\D/g, '');
          setPhone(clean.startsWith('91') ? clean : `91${clean.slice(-10)}`);
        }
      })
      .catch(() => {});
  }, []);

  const handleClick = () => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-3.5 sm:right-6 z-40">
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative w-12 h-12 sm:w-14 sm:h-14 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
        
        {/* Tooltip */}
        {isHovered && (
          <div className="hidden sm:block absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap shadow-lg">
            Chat on WhatsApp
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-gray-900 rotate-45" />
          </div>
        )}
        
        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-60 pointer-events-none" />
      </button>
    </div>
  );
};

export default WhatsAppButton;
