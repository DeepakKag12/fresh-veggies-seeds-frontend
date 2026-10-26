import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, AlertCircle, RefreshCw, X } from 'lucide-react';

/**
 * Enterprise Admin Confirmation Modal
 * Replaces disruptive, unstyled browser `window.confirm` dialogs with a
 * polished, accessible, animated confirmation drawer across the Admin Suite.
 */
export const AdminConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action may not be reversible.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  confirmVariant = 'danger', // 'danger' | 'warning' | 'primary'
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const variantStyles = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400',
      button: 'bg-red-600 hover:bg-red-700 text-white shadow-xs focus:ring-red-500',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs focus:ring-amber-500',
    },
    primary: {
      icon: AlertCircle,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
      button: 'bg-fv-primary hover:bg-fv-primary-dark text-white shadow-xs focus:ring-emerald-500',
    },
  };

  const currentVariant = variantStyles[confirmVariant] || variantStyles.danger;
  const Icon = currentVariant.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with modern glassmorphism blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-fv-border p-6 space-y-4 z-10 overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Top close button */}
            {!isLoading && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-fv-muted hover:text-fv-heading hover:bg-fv-surface dark:hover:bg-gray-700 transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Header: Icon + Title */}
            <div className="flex items-start gap-3.5 pr-6">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${currentVariant.iconBg}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-fv-heading dark:text-white leading-tight">
                  {title}
                </h3>
                <p className="text-[11px] font-semibold text-fv-muted uppercase tracking-wider">
                  Admin Confirmation Required
                </p>
              </div>
            </div>

            {/* Description / Content */}
            <div className="text-xs text-fv-muted dark:text-gray-300 leading-relaxed pl-0.5">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-fv-border/70">
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-fv-border bg-white dark:bg-gray-700 hover:bg-fv-surface dark:hover:bg-gray-600 text-xs font-semibold text-fv-heading dark:text-gray-200 transition-colors disabled:opacity-50 min-h-[42px]"
              >
                {cancelText}
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={onConfirm}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[42px] disabled:opacity-50 ${currentVariant.button}`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{confirmText}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AdminConfirmModal;
