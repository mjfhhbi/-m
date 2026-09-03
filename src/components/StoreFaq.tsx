import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, ShieldCheck, Truck, RotateCcw, Glasses, Sun, Sparkles, Award } from 'lucide-react';
import { FaqItemSetting } from '../types';
import { DEFAULT_FAQS } from '../utils/storage';

interface StoreFaqProps {
  faqs?: FaqItemSetting[];
}

export const StoreFaq: React.FC<StoreFaqProps> = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const activeFaqs = Array.isArray(faqs) && faqs.length > 0 ? faqs : DEFAULT_FAQS;

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const getFaqIcon = (index: number) => {
    const icons = [
      <Glasses key="1" className="w-4 h-4 text-amber-400" />,
      <Sun key="2" className="w-4 h-4 text-amber-400" />,
      <Truck key="3" className="w-4 h-4 text-amber-400" />,
      <RotateCcw key="4" className="w-4 h-4 text-amber-400" />,
      <ShieldCheck key="5" className="w-4 h-4 text-amber-400" />,
      <Sparkles key="6" className="w-4 h-4 text-amber-400" />,
      <Award key="7" className="w-4 h-4 text-amber-400" />,
    ];
    return icons[index % icons.length];
  };

  return (
    <div className="rounded-3xl bg-zinc-950/80 border border-zinc-800/80 p-6 sm:p-8 my-8 text-right dir-rtl shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>راهنمای خرید و سوالات متداول</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            پاسخ به سوالات پرتکرار خریداران عینک استوک
          </h3>
        </div>
        <span className="text-xs text-zinc-400">
          پشتیبانی ۲۴ ساعته آنلاین
        </span>
      </div>

      <div className="space-y-3">
        {activeFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={faq.id || idx}
              className={`border rounded-2xl transition-all ${
                isOpen
                  ? 'bg-zinc-900/90 border-amber-500/40 shadow-lg'
                  : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full flex items-center justify-between p-4 text-right gap-3 focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700/50 shrink-0">
                    {getFaqIcon(idx)}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {faq.question}
                  </span>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-amber-400 transition-transform duration-300 shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 text-xs text-zinc-300 leading-relaxed border-t border-zinc-800/50 mr-12">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};
