import React, { useState } from 'react';
import { Product } from '../types';
import { formatToman } from '../utils/storage';
import {
  X,
  ShoppingBag,
  Shield,
  Glasses,
  Check,
  Plus,
  Minus,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageLazyLoader } from './ImageLazyLoader';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenFullDetail?: (product: Product) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onOpenFullDetail,
}) => {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const images = product?.images && product.images.length > 0 ? product.images : [];
  const currentImg = images[selectedImgIndex] || null;

  const calculateDiscount = () => {
    if (product && product.originalPrice && product.originalPrice > product.price) {
      const diff = product.originalPrice - product.price;
      return Math.round((diff / product.originalPrice) * 100);
    }
    return 0;
  };

  const discountPercent = calculateDiscount();

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    onAddToCart(product, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          key="quickview-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 dir-rtl"
        >
          <motion.div
            key="quickview-modal"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
          >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 px-6 border-b border-zinc-800 bg-zinc-950/60">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-extrabold text-xs bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <Glasses className="w-4 h-4 text-amber-400" />
                مشاهده سریع عینک
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                کد: {product.code || 'STK'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content: Grid Layout */}
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left/Right Column: Image Gallery */}
            <div className="space-y-3">
              <div className="aspect-[4/3] rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden relative">
                {currentImg ? (
                  <ImageLazyLoader
                    src={currentImg}
                    alt={product.title}
                    zoomOnHover
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                    <Glasses className="w-12 h-12 stroke-[1]" />
                    <span className="text-xs">بدون تصویر</span>
                  </div>
                )}

                {discountPercent > 0 && (
                  <span className="absolute top-3 right-3 bg-rose-600 text-white text-[11px] font-black px-2.5 py-1 rounded-full shadow-lg">
                    %{discountPercent} تخفیف
                  </span>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImgIndex(idx)}
                      className={`w-14 h-11 rounded-xl border overflow-hidden shrink-0 transition-all ${
                        selectedImgIndex === idx
                          ? 'border-amber-400 ring-2 ring-amber-400/20'
                          : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right/Left Column: Specs & Purchase Controls */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {product.title}
                </h3>

                {/* Specs Pill List */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 block">جنس فریم</span>
                    <span className="text-xs font-semibold text-zinc-200">{product.frameType || 'نامشخص'}</span>
                  </div>

                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 block">رنگ عدسی</span>
                    <span className="text-xs font-semibold text-zinc-200">{product.lensColor || 'نامشخص'}</span>
                  </div>

                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 block">استاندارد یووی</span>
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                      <Shield className="w-3 h-3 text-amber-400" />
                      {product.uvProtection || 'UV400'}
                    </span>
                  </div>

                  <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 block">مناسب برای</span>
                    <span className="text-xs font-semibold text-zinc-200">{product.gender || 'اسپرت'}</span>
                  </div>
                </div>

                {/* Features List */}
                {product.features && product.features.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {product.features.slice(0, 3).map((feat, idx) => (
                      <div key={idx} className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Add to Cart Section */}
              <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">قیمت محصول:</span>
                  <div className="text-left">
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-zinc-500 line-through block">
                        {formatToman(product.originalPrice)}
                      </span>
                    )}
                    <span className="text-lg font-extrabold text-amber-400">
                      {formatToman(product.price)}
                    </span>
                  </div>
                </div>

                {/* Quantity & Button */}
                <div className="flex gap-2 items-center">
                  {/* Quantity selector */}
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center font-bold text-xs text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      disabled={quantity >= product.stock}
                      className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Cart button */}
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock <= 0}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                      product.stock <= 0
                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                        : addedSuccess
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-amber-500 hover:bg-amber-400 text-zinc-950'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {product.stock <= 0
                        ? 'ناموجود'
                        : addedSuccess
                        ? 'به سبد اضافه شد ✓'
                        : 'افزودن به سبد خرید'}
                    </span>
                  </button>
                </div>

                {onOpenFullDetail && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenFullDetail(product);
                    }}
                    className="w-full text-center text-[11px] text-amber-400 hover:text-amber-300 font-medium pt-1 flex items-center justify-center gap-1"
                  >
                    <span>مشاهده صفحه کامل و تصاویر بیشتر</span>
                    <ArrowRight className="w-3 h-3 rotate-180" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
