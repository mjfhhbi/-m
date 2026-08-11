import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key="toast-popup"
          initial={{ opacity: 0, y: 40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 25, scale: 0.92 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-[150] bg-zinc-900/95 border border-amber-500/40 text-zinc-100 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md"
        >
          <div className="p-1.5 bg-amber-500/15 text-amber-400 rounded-xl border border-amber-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-white leading-relaxed">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
