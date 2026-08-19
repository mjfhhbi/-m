import React from 'react';
import { Glasses, Sparkles, ShieldCheck, Truck, Headphones, Award, Sun, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { StoreSettings } from '../types';

interface StoreHeroProps {
  settings?: StoreSettings;
}

export const StoreHero: React.FC<StoreHeroProps> = ({ settings }) => {
  const badgeText = settings?.heroBadgeText || '✨ کالکشن جدید ۲۰۲۶ - کیفیت اورجینال';
  const headline = settings?.heroTitle || settings?.welcomeText || 'تجربه‌ای متفاوت از کیفیت و استایل با عینک استوک جهانی';
  const subtext = settings?.heroSubtitle || settings?.welcomeSubtext || 'مجموعه کامل عینک‌های آفتابی و طبی اورجینال، فریم‌های استوک کائوچویی و فلزی ساخت اروپا با عدسی‌های پلاریزه و استاندارد کامل UV400.';

  const feature1Title = settings?.feature1Title || 'ضمانت اصالت و سلامت';
  const feature1Desc = settings?.feature1Desc || 'تمام عینک‌ها استوک دست‌چین اورجینال اروپایی هستند';

  const feature2Title = settings?.feature2Title || 'محافظت کامل UV400';
  const feature2Desc = settings?.feature2Desc || 'عدسی‌های استاندارد و پلاریزه تست شده ضد اشعه';

  const feature3Title = settings?.feature3Title || 'ارسال سریع پیشتاز';
  const feature3Desc = settings?.feature3Desc || 'تحویل با بسته‌بندی ایمن و کد پیگیری ۲۴ رقمی پست';

  const feature4Title = settings?.feature4Title || 'پشتیبانی اختصاصی';
  const feature4Desc = settings?.feature4Desc || 'مشاوره آنلاین و پاسخگویی سریع در دایرکت و تلگرام';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-zinc-950 border border-zinc-800/80 p-6 sm:p-10 mb-8 text-right shadow-2xl">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl space-y-5">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/40 text-amber-300 text-xs font-bold px-4 py-1.5 rounded-full shadow-inner"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>{badgeText}</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight sm:leading-snug"
        >
          {headline}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-xs sm:text-sm md:text-base text-zinc-300 leading-relaxed max-w-3xl font-normal"
        >
          {subtext}
        </motion.p>

        {/* 4 Features Grid with interactive animations */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-right"
        >
          {/* Feature 1 */}
          <motion.div
            whileHover={{ scale: 1.03, y: -3 }}
            className="flex items-start gap-3 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800/80 shadow-md transition-all hover:border-amber-500/40 group"
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-amber-300 transition-colors">
                {feature1Title}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                {feature1Desc}
              </p>
            </div>
          </motion.div>

          {/* Feature 2 */}
          <motion.div
            whileHover={{ scale: 1.03, y: -3 }}
            className="flex items-start gap-3 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800/80 shadow-md transition-all hover:border-amber-500/40 group"
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors shrink-0">
              <Sun className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-amber-300 transition-colors">
                {feature2Title}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                {feature2Desc}
              </p>
            </div>
          </motion.div>

          {/* Feature 3 */}
          <motion.div
            whileHover={{ scale: 1.03, y: -3 }}
            className="flex items-start gap-3 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800/80 shadow-md transition-all hover:border-amber-500/40 group"
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors shrink-0">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-amber-300 transition-colors">
                {feature3Title}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                {feature3Desc}
              </p>
            </div>
          </motion.div>

          {/* Feature 4 */}
          <motion.div
            whileHover={{ scale: 1.03, y: -3 }}
            className="flex items-start gap-3 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800/80 shadow-md transition-all hover:border-amber-500/40 group"
          >
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-zinc-950 transition-colors shrink-0">
              <Headphones className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block group-hover:text-amber-300 transition-colors">
                {feature4Title}
              </span>
              <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed line-clamp-2">
                {feature4Desc}
              </p>
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
};
