import React, { useState } from 'react';
import { Product } from '../types';
import { formatToman } from '../utils/storage';
import { ShoppingBag, Eye, Edit, Trash2, Shield, Glasses, Check, Sparkles, Image as ImageIcon, ArrowRightLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageLazyLoader } from './ImageLazyLoader';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (p: Product) => void;
  onAddToCart: (p: Product) => void;
  isAdmin?: boolean;
  onEditProduct?: (p: Product) => void;
  onDeleteProduct?: (id: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (p: Product) => void;
  onQuickView?: (p: Product) => void;
  revealDelay?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onAddToCart,
  isAdmin = false,
  onEditProduct,
  onDeleteProduct,
  isCompared = false,
  onToggleCompare,
  onQuickView,
  revealDelay = 0,
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [added, setAdded] = useState(false);

  const hasImages = product.images && product.images.length > 0;
  const currentImg = hasImages ? product.images[currentImgIndex] : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const calculateDiscount = () => {
    if (product.originalPrice && product.originalPrice > product.price) {
      const diff = product.originalPrice - product.price;
      return Math.round((diff / product.originalPrice) * 100);
    }
    return 0;
  };

  const discountPercent = calculateDiscount();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1], delay: revealDelay }}
      onClick={() => onSelectProduct(product)}
      className="group relative bg-zinc-900/90 border border-zinc-800/90 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Top Image Preview Container */}
      <div className="relative aspect-[4/3] w-full bg-zinc-950 overflow-hidden flex items-center justify-center border-b border-zinc-800/60">
        {currentImg ? (
          <ImageLazyLoader
            src={currentImg}
            alt={product.title}
            zoomOnHover
            className="w-full h-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-600 gap-2">
            <Glasses className="w-10 h-10 stroke-[1.2] text-zinc-700" />
            <span className="text-xs">آماده قرارگیری عکس عینک</span>
          </div>
        )}

        {/* Badges Over Image */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
          {product.uvProtection && (
            <span className="inline-flex items-center gap-1 bg-zinc-950/80 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>{product.uvProtection}</span>
            </span>
          )}
          {discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md">
              <span>%{discountPercent} تخفیف</span>
            </span>
          )}
        </div>

        {/* Product Code Badge, Compare & Quick View Buttons */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="bg-zinc-900/90 backdrop-blur-md text-zinc-400 font-mono text-[10px] px-2 py-0.5 rounded-md border border-zinc-800">
            {product.code || 'STK'}
          </span>
          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(product);
              }}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all backdrop-blur-md border ${
                isCompared
                  ? 'bg-amber-500 text-zinc-950 font-bold border-amber-400 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-amber-400 border-zinc-800'
              }`}
              title={isCompared ? 'حذف از لیست مقایسه' : 'افزودن به مقایسه'}
            >
              <ArrowRightLeft className="w-3 h-3" />
              <span className="hidden sm:inline">{isCompared ? 'در مقایسه' : 'مقایسه'}</span>
            </button>
          )}
          {onQuickView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all backdrop-blur-md border bg-zinc-900/80 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 border-zinc-800"
              title="مشاهده سریع مشخصات"
            >
              <Eye className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">نگاه سریع</span>
            </button>
          )}
        </div>

        {/* Quick View Hover Overlay for Customers */}
        {!isAdmin && onQuickView && (
          <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center backdrop-blur-[2px] z-10 pointer-events-none group-hover:pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-xl flex items-center gap-1.5 transition-transform scale-90 group-hover:scale-100"
            >
              <Eye className="w-4 h-4" />
              <span>مشاهده سریع</span>
            </button>
          </div>
        )}

        {/* Multiple Images Dots Indicator */}
        {hasImages && product.images.length > 1 && (
          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
            {product.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImgIndex(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  currentImgIndex === idx ? 'w-5 bg-amber-400' : 'w-1.5 bg-zinc-600/70 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
        )}

        {/* Admin Quick Control Overlay */}
        {isAdmin && (
          <div className="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs">
            {onEditProduct && (
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditProduct(product);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span>ویرایش</span>
              </motion.button>
            )}
            {onDeleteProduct && (
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProduct(product.id);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف</span>
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Card Details Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3 text-right">
        <div>
          {/* Tags bar */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
            <span className="text-amber-400/90 font-medium">{product.frameType || 'فریم استوک'}</span>
            <span className="bg-zinc-800/80 px-2 py-0.5 rounded text-[10px] text-zinc-300">
              {product.gender || 'اسپرت'}
            </span>
          </div>

          <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">
            {product.title}
          </h3>

          {product.lensColor && (
            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>عدسی: {product.lensColor}</span>
            </p>
          )}
        </div>

        {/* Pricing & Stock Footer */}
        <div className="pt-2 border-t border-zinc-800/60 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] text-zinc-500 line-through">
                {formatToman(product.originalPrice)}
              </span>
            )}
            <span className="text-base font-extrabold text-amber-400 tracking-tight">
              {formatToman(product.price)}
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`group/btn flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              product.stock <= 0
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : added
                ? 'bg-emerald-500 text-zinc-950 scale-105'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 hover:shadow-amber-500/20'
            }`}
          >
            {added ? (
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                className="flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>اضافه شد</span>
              </motion.div>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5 group-hover/btn:-rotate-12 group-hover/btn:scale-110 transition-transform duration-300" />
                <span>{product.stock <= 0 ? 'ناموجود' : 'افزودن'}</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
