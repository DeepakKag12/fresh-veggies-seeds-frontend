import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ExternalLink } from 'lucide-react';

/**
 * WhatsApp-Style Fullscreen Image Lightbox Modal
 */
export const ChatImageLightbox = ({ imageUrl, caption, onClose }) => {
  useEffect(() => {
    if (!imageUrl) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageUrl, onClose]);

  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none"
        onClick={onClose}
      >
        {/* Top Floating Control Bar */}
        <div
          className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Open Original Image"
          >
            <ExternalLink className="w-5 h-5" />
          </a>

          <a
            href={imageUrl}
            download="fresh-veggies-chat-image.jpg"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Download Image"
          >
            <Download className="w-5 h-5" />
          </a>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Centered High-Res Image with Zoom Animation */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="max-w-[90vw] max-h-[85vh] flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt={caption || 'Chat photo attachment'}
            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
          />
          {caption && (
            <p className="mt-3 text-sm text-gray-200 text-center max-w-lg bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
              {caption}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatImageLightbox;
