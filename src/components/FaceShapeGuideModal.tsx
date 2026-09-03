import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, ArrowLeft, Glasses, Smile, HelpCircle } from 'lucide-react';
import { FaceShapeType } from '../types';

interface FaceShapeInfo {
  id: FaceShapeType;
  title: string;
  subtitle: string;
  description: string;
  characteristics: string[];
  bestFrames: string[];
  avoidFrames: string[];
  recommendedCategoryKeywords: string[];
  iconSvg: string;
}

const FACE_SHAPES: FaceShapeInfo[] = [
  {
    id: 'oval',
    title: 'صورت بیضی (Oval)',
    subtitle: 'متعادل‌ترین فرم صورت',
    description: 'گونه‌های کمی پهن‌تر از پیشانی و فک با خطوط منحنی ملایم و تناسب طبیعی.',
    characteristics: ['طول صورت بیشتر از عرض گونه‌ها', 'فک و پیشانی دارای انحنای نرم', 'تعادل طبیعی در اجزای صورت'],
    bestFrames: ['خلبانی (Aviator)', 'ویفرر (Wayfarer)', 'مستطیلی کلاسیک', 'چندضلعی مدرن'],
    avoidFrames: ['فریم‌های فوق‌العاده بزرگ و نامتقارن که تعادل صورت را بر هم زنند'],
    recommendedCategoryKeywords: ['خلبانی', 'ویفرر', 'مستطیلی', 'فلزی'],
    iconSvg: '🥚',
  },
  {
    id: 'round',
    title: 'صورت گرد (Round)',
    subtitle: 'خطوط منحنی و گونه‌های برجسته',
    description: 'عرض و طول صورت تقریباً برابر است و زاویه‌های تیز در فک وجود ندارد.',
    characteristics: ['عرض و طول صورت یکسان', 'خط فک گرد و نرم', 'گونه‌های پر و برجسته'],
    bestFrames: ['مستطیلی و مربعی زاویه‌دار', 'گربه‌ای کشیده (Cat-Eye)', 'فریم‌های ضخیم کائوچویی'],
    avoidFrames: ['فریم‌های کاملاً گرد و کوچک که صورت را گردتر نشان می‌دهند'],
    recommendedCategoryKeywords: ['مستطیلی', 'کائوچویی', 'زاویه‌دار', 'گربه‌ای'],
    iconSvg: '⚪',
  },
  {
    id: 'square',
    title: 'صورت مربعی (Square)',
    subtitle: 'خط فک قوی و استخوانی',
    description: 'پیشانی، گونه‌ها و خط فک عرض تقریباً یکسانی دارند و زوایای فک مشخص است.',
    characteristics: ['پیشانی پهن و فک زاویه‌دار', 'خطوط فک مشخص و صاف', 'عرض پیشانی و فک متناسب'],
    bestFrames: ['گرد و بیضی کلاسیک (Round)', 'خلبانی با انحنای نرم', 'بدون فریم (Rimless)'],
    avoidFrames: ['فریم‌های مربعی و مستطیلی با زاویه‌های تیز'],
    recommendedCategoryKeywords: ['گرد', 'خلبانی', 'بیضی', 'فلزی'],
    iconSvg: '⬛',
  },
  {
    id: 'rectangle',
    title: 'صورت مستطیلی / کشیده (Oblong)',
    subtitle: 'طول صورت بیشتر از عرض آن',
    description: 'صورت کشیده با خطوط گونه و فک مستقیم که نیاز به فریم‌های پهن دارد.',
    characteristics: ['طول صورت به وضوح بلندتر از عرض', 'گونه‌ها کشیده و مستقیم', 'پیشانی و فک تقریباً هم‌عرض'],
    bestFrames: ['فریم‌های بزرگ اورسایز (Oversized)', 'کلاب‌مستر با پل برجسته', 'خلبانی عریض'],
    avoidFrames: ['فریم‌های بسیار باریک یا خیلی کوچک'],
    recommendedCategoryKeywords: ['اورسایز', 'کائوچویی', 'خلبانی', 'کلاب‌مستر'],
    iconSvg: '📱',
  },
  {
    id: 'heart',
    title: 'صورت قلبی / مثلث وارونه (Heart)',
    subtitle: 'پیشانی پهن و چانه باریک و نوک‌تیز',
    description: 'پیشانی پهن‌ترین بخش صورت است و به سمت چانه‌ای کشیده و باریک متمایل می‌شود.',
    characteristics: ['پیشانی پهن و گونه‌های برجسته', 'چانه باریک و زاویه‌دار', 'خط موی قلبی یا پهن'],
    bestFrames: ['فریم‌های خلبانی سبک', 'کلاب‌مستر (Clubmaster)', 'فریم‌های روشن یا بدون فریم پایین'],
    avoidFrames: ['فریم‌های بالایی سنگین و خیلی تزئین‌شده'],
    recommendedCategoryKeywords: ['خلبانی', 'کلاب‌مستر', 'فلزی', 'سبک'],
    iconSvg: '❤️',
  },
  {
    id: 'diamond',
    title: 'صورت لوزی / الماسی (Diamond)',
    subtitle: 'گونه‌های برجسته و پیشانی و چانه باریک',
    description: 'کمیاب‌ترین فرم صورت که در آن گونه‌ها عریض‌ترین بخش چهره هستند.',
    characteristics: ['گونه‌های پهن و استخوانی', 'پیشانی و چانه با عرض کمتر', 'خطوط چهره زاویه‌دار و شیک'],
    bestFrames: ['گربه‌ای (Cat-Eye)', 'بیضی با لبه برجسته', 'کلاب‌مستر'],
    avoidFrames: ['فریم‌های بسیار باریک یا خیلی مستطیلی'],
    recommendedCategoryKeywords: ['گربه‌ای', 'بیضی', 'کلاب‌مستر'],
    iconSvg: '💎',
  },
];

interface FaceShapeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectKeywords: (keywords: string[], shapeName: string) => void;
}

export const FaceShapeGuideModal: React.FC<FaceShapeGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectKeywords,
}) => {
  const [selectedShape, setSelectedShape] = useState<FaceShapeType>('oval');

  if (!isOpen) return null;

  const currentInfo = FACE_SHAPES.find((s) => s.id === selectedShape) || FACE_SHAPES[0];

  const handleApplyFilter = () => {
    onSelectKeywords(currentInfo.recommendedCategoryKeywords, currentInfo.title);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto text-right dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto p-5 sm:p-7 space-y-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>مشاوره تخصصی استایل و فرم صورت</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                راهنمای هوشمند انتخاب عینک بر اساس فرم چهره
              </h2>
              <p className="text-xs text-zinc-400">
                فرم صورت خود را انتخاب نمایید تا بهترین مدل فریم‌های متناسب با چهره شما نمایش داده شود:
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Face Shape Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {FACE_SHAPES.map((shape) => {
              const isSelected = selectedShape === shape.id;
              return (
                <button
                  key={shape.id}
                  onClick={() => setSelectedShape(shape.id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10 scale-105'
                      : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  <span className="text-2xl">{shape.iconSvg}</span>
                  <span className="text-xs font-extrabold">{shape.title.split(' ')[1] || shape.title}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Shape Detail Card */}
          <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span>{currentInfo.iconSvg}</span>
                  <span>{currentInfo.title}</span>
                </h3>
                <span className="text-xs text-amber-400 font-medium">{currentInfo.subtitle}</span>
              </div>
              <span className="text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg">
                توصیه اپتومتریست
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {currentInfo.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Best Frames */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>بهترین فریم‌ها برای شما:</span>
                </span>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {currentInfo.bestFrames.map((bf, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{bf}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Frames to Avoid */}
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3.5 space-y-2">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>فریم‌هایی که توصیه نمی‌شود:</span>
                </span>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {currentInfo.avoidFrames.map((af, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      <span>{af}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-[11px] text-zinc-400 flex items-center gap-1">
              <Glasses className="w-4 h-4 text-amber-400" />
              <span>با کلیک روی دکمه زیر، عینک‌های متناسب با فرم صورت شما در فروشگاه فیلتر می‌شوند.</span>
            </p>

            <button
              onClick={handleApplyFilter}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-colors"
            >
              <span>مشاهده عینک‌های مناسب صورت من</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
