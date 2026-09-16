import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, RefreshCw } from 'lucide-react';

export const DeleteHistoryModal = ({
  deleteModal,
  isDeletingHistory,
  onClose,
  onConfirm
}) => {
  return (
    <AnimatePresence>
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-fv-border space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-fv-heading">{deleteModal.title}</h3>
                <p className="text-xs text-fv-muted mt-0.5">Admin Security & Audit Control</p>
              </div>
            </div>

            <p className="text-xs text-fv-muted leading-relaxed">
              {deleteModal.message}
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingHistory}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-fv-border text-xs font-semibold text-fv-heading hover:bg-fv-surface min-h-[44px] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingHistory}
                onClick={onConfirm}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold min-h-[44px] shadow-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {isDeletingHistory ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Confirm Delete
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

export default DeleteHistoryModal;
