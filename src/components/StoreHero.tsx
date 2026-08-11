import React from 'react';
import { Glasses, Sparkles, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { StoreSettings } from '../types';

interface StoreHeroProps {
  settings?: StoreSettings;
}

export const StoreHero: React.FC<StoreHeroProps> = ({ settings }) => {
  const headline = settings?.welcomeText || 'تجربه‌ای متفاوت از کیفیت و استایل با عینک استوک جهانی';
  const subtext = settings?.welcomeSubtext || 'مجموعه کامل عینک‌های آفتابی و طبی اورجینال، فریم‌های استوک کائوچویی و فلزی ساخت اروپا با عدسی‌های پلاریزه و استاندارد کامل UV400.';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 border border-zinc-800/80 p-6 sm:p-10 mb-8 text-right">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-60 h-60 bg-amber-600/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl space-y-4">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold px-3.5 py-1.5 rounded-full"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>عینک‌های اورجینال و استوک اروپایی | {settings?.storeName || 'stock_jahani'}</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight"
        >
          {headline}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl font-light"
        >
          {subtext}
        </motion.p>

        {/* Features Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-zinc-300 font-medium"
        >
          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/60 shadow-xs transition-colors hover:border-amber-500/30"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>محافظت ۱۰۰٪ UV400</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/60 shadow-xs transition-colors hover:border-amber-500/30"
          >
            <Truck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>ارسال با پست پیشتاز به سراسر ایران</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.04, y: -2 }}
            className="flex items-center gap-2 bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800/60 col-span-2 sm:col-span-1 shadow-xs transition-colors hover:border-amber-500/30"
          >
            <Glasses className="w-4 h-4 text-amber-400 shrink-0" />
            <span>تضمین سلامت فریم و عدسی</span>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};
