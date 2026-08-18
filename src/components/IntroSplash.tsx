import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Glasses, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';
import { StoreSettings } from '../types';

interface IntroSplashProps {
  settings: StoreSettings;
  onFinish: () => void;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ settings, onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 2.1 seconds for a snappy, luxurious entrance
    const timer = setTimeout(() => {
      handleClose();
    }, 2100);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onFinish();
    }, 450);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="intro-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(10px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 text-white overflow-hidden dir-rtl select-none"
        >
          {/* Ambient Background Glows */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.15, 0.35, 0.15],
              }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/20 rounded-full blur-[100px]"
            />
            <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-amber-600/10 rounded-full blur-[80px]" />
          </div>

          {/* Core Content Container */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-md space-y-6">
            
            {/* Animated Logo Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -25, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-2xl shadow-amber-500/25 flex items-center justify-center"
            >
              <div className="w-full h-full bg-zinc-950/90 rounded-[22px] flex items-center justify-center relative overflow-hidden">
                {/* Glass Light Reflection Sweep */}
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
                />

                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  className="text-amber-400"
                >
                  <Glasses className="w-12 h-12 sm:w-14 sm:h-14 stroke-[1.8]" />
                </motion.div>
              </div>

              {/* Sparkle Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-4 h-4 fill-zinc-950" />
              </motion.div>
            </motion.div>

            {/* Brand Titles */}
            <div className="space-y-2">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold px-3 py-1 rounded-full"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>عینک‌های اورجینال استوک اروپا</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.45 }}
                className="text-2xl sm:text-3xl font-black text-white tracking-tight"
              >
                {settings.storeName || 'فروشگاه عینک استوک جهانی'}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.45 }}
                className="text-xs sm:text-sm text-zinc-400 font-light max-w-xs mx-auto leading-relaxed"
              >
                {settings.tagline || 'تضمین اصالت فریم، عدسی‌های پلاریزه و UV400 با ارسال فوری'}
              </motion.p>
            </div>

            {/* Progress / Loading Bar */}
            <motion.div
              initial={{ opacity: 0, width: '0%' }}
              animate={{ opacity: 1, width: '100%' }}
              transition={{ delay: 0.5, duration: 1.4, ease: 'easeInOut' }}
              className="h-1 max-w-[200px] bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500 rounded-full mx-auto shadow-sm shadow-amber-400/30"
            />

            {/* Skip / Enter Action */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              onClick={handleClose}
              className="inline-flex items-center gap-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white px-4 py-2 rounded-xl text-xs font-bold border border-zinc-800 transition-all active:scale-95 group"
            >
              <span>ورود به ویترین فروشگاه</span>
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            </motion.button>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
