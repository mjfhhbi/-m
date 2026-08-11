import React from 'react';
import { Product } from '../types';
import { formatToman } from '../utils/storage';
import {
  X,
  Trash2,
  ShoppingBag,
  Glasses,
  Check,
  Shield,
  Sparkles,
  Layers,
  Award,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageLazyLoader } from './ImageLazyLoader';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparedProducts: Product[];
  onRemoveFromCompare: (id: string) => void;
  onClearAll: () => void;
  onAddToCart: (product: Product) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  comparedProducts,
  onRemoveFromCompare,
  onClearAll,
  onAddToCart,
}) => {
  // Find lowest price among compared items for visual highlight
  const lowestPrice = comparedProducts.length > 0
    ? Math.min(...comparedProducts.map((p) => p.price))
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="compare-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[110] overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
        >
          <motion.div
            key="compare-modal"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                    مقایسه تخصصی عینک‌ها
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-normal">
                      {comparedProducts.length} کالا
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    بررسی و مقایسه فنی ویژگی‌ها، جنس فریم، لنز و قیمت محصولات انتخاب‌شده
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {comparedProducts.length > 0 && (
                  <button
                    onClick={onClearAll}
                    className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">پاک‌سازی همه</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6">
              {comparedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 gap-3">
                  <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-600 mb-2">
                    <Glasses className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-300">
                    هیچ محصولی برای مقایسه انتخاب نشده است
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    روی آیکون مقایسه روی کارت هر عینک کلیک کنید تا تا ۴ محصول را کنار هم بررسی نمایید.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-3 bg-amber-500 text-zinc-950 font-bold px-5 py-2.5 rounded-xl hover:bg-amber-400 transition-colors text-xs"
                  >
                    بازگشت به فروشگاه
                  </button>
                </div>
              ) : (
                <div className="min-w-[650px] grid grid-cols-1 divide-y divide-zinc-800/80">
                  {/* Top Cards Grid */}
                  <div className="grid gap-4 pb-6" style={{ gridTemplateColumns: `repeat(${comparedProducts.length}, minmax(0, 1fr))` }}>
                    {comparedProducts.map((product) => {
                      const isLowest = comparedProducts.length > 1 && product.price === lowestPrice;

                      return (
                        <div
                          key={product.id}
                          className="bg-zinc-950 border border-zinc-800/80 hover:border-amber-500/40 rounded-2xl p-4 flex flex-col justify-between relative transition-all group"
                        >
                          <button
                            onClick={() => onRemoveFromCompare(product.id)}
                            className="absolute top-3 left-3 z-10 w-7 h-7 rounded-full bg-zinc-900/80 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 border border-zinc-700/60 flex items-center justify-center transition-colors"
                            title="حذف از مقایسه"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>

                          {isLowest && (
                            <div className="absolute top-3 right-3 z-10 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              ارزان‌ترین
                            </div>
                          )}

                          <div>
                            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 mb-3 border border-zinc-800">
                              <ImageLazyLoader
                                src={product.images?.[0] || ''}
                                alt={product.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <span className="text-[10px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                              کد: {product.code}
                            </span>

                            <h3 className="font-bold text-white text-sm mt-2 line-clamp-2 leading-snug">
                              {product.title}
                            </h3>

                            <div className="mt-3">
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-xs text-zinc-500 line-through block">
                                  {formatToman(product.originalPrice)}
                                </span>
                              )}
                              <span className="text-base font-extrabold text-amber-400">
                                {formatToman(product.price)}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => onAddToCart(product)}
                            disabled={product.stock <= 0}
                            className={`mt-4 w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors ${
                              product.stock > 0
                                ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
                                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingBag className="w-4 h-4" />
                            {product.stock > 0 ? 'افزودن به سبد' : 'ناموجود'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Specifications Table */}
                  <div className="pt-6 space-y-4">
                    <h4 className="text-xs font-bold text-amber-400 tracking-wider uppercase flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      جدول مقایسه مشخصات فنی
                    </h4>

                    {/* Frame Type */}
                    <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                      <span className="text-xs text-zinc-400 font-semibold mb-2 block">
                        نوع و جنس فریم
                      </span>
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${comparedProducts.length}, minmax(0, 1fr))` }}>
                        {comparedProducts.map((p) => (
                          <div key={p.id} className="text-xs text-zinc-200 font-medium">
                            {p.frameType || 'نامشخص'}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lens Color */}
                    <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                      <span className="text-xs text-zinc-400 font-semibold mb-2 block">
                        رنگ و پوشش عدسی
                      </span>
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${comparedProducts.length}, minmax(0, 1fr))` }}>
                        {comparedProducts.map((p) => (
                          <div key={p.id} className="text-xs text-zinc-200 font-medium">
                            {p.lensColor || 'نامشخص'}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* UV Protection */}
                    <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                      <span className="text-xs text-zinc-400 font-semibold mb-2 block">
                        استاندارد محافظت چشم
                      </span>
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${comparedProducts.length}, minmax(0, 1fr))` }}>
                        {comparedProducts.map((p) => (
                          <div key={p.id} className="text-xs text-amber-300 font-medium flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            {p.uvProtection || 'UV400'}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                      <span className="text-xs text-zinc-400 font-semibold mb-2 block">
                        مناسب برای (جنسیت)
                      </span>
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${comparedProducts.length}, minmax(0, 1fr))` }}>
                        {comparedProducts.map((p) => (
                          <div key={p.id} className="text-xs text-zinc-200 font-medium">
                            {p.gender}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Features comparison */}
                    <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60">
                      <span className="text-xs text-zinc-400 font-semibold mb-2 block">
                        ویژگی‌های برجسته
                      </span>
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${comparedProducts.length}, minmax(0, 1fr))` }}>
                        {comparedProducts.map((p) => (
                          <ul key={p.id} className="space-y-1">
                            {p.features && p.features.length > 0 ? (
                              p.features.map((feat, idx) => (
                                <li key={idx} className="text-[11px] text-zinc-300 flex items-start gap-1">
                                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <span>{feat}</span>
                                </li>
                              ))
                            ) : (
                              <li className="text-[11px] text-zinc-500">ویژگی خاصی ثبت نشده</li>
                            )}
                          </ul>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
