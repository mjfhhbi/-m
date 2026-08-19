import React, { useState } from 'react';
import { Product } from '../types';
import { formatToman } from '../utils/storage';
import { ShoppingBag, Eye, Edit, Trash2, Shield, Glasses, Check, Sparkles, Image as ImageIcon, ArrowRightLeft, Share2, Send, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [sharedToast, setSharedToast] = useState(false);

  const hasImages = product.images && product.images.length > 0;
  const currentImg = hasImages ? product.images[currentImgIndex] : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const handleShareProduct = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const productUrl = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`;
    const shareTitle = product.seoTitle || product.title;
    const shareText = `👓 ${product.title}\n💰 قیمت: ${formatToman(product.price)}\n🛡️ محافظت: ${product.uvProtection || 'UV400'}\n✨ فریم: ${product.frameType || 'استوک'}\n\nمشاهده و سفارش آنلاین:`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: productUrl,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if user dismissed or unsupported
      }
    }

    // Fallback: Copy direct share link to clipboard
    try {
      await navigator.clipboard.writeText(`${shareText}\n${productUrl}`);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2400);
    } catch (err) {
      // Direct prompt fallback
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2400);
    }
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
      initial={{ opacity: 0, y: 22, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      whileHover={{
        y: -6,
        scale: 1.015,
        transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
      }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: revealDelay }}
      onClick={() => onSelectProduct(product)}
      className="group relative bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border border-zinc-800/80 hover:border-amber-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.18)] transition-all duration-300 flex flex-col cursor-pointer backdrop-blur-sm"
    >
      {/* Top Image Preview Container */}
      <div className="relative aspect-[4/3] w-full bg-zinc-950 overflow-hidden flex items-center justify-center border-b border-zinc-800/60">
        {currentImg ? (
          <ImageLazyLoader
            src={currentImg}
            alt={product.title}
            zoomOnHover
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center text-zinc-600 gap-2">
            <Glasses className="w-10 h-10 stroke-[1.2] text-zinc-700" />
            <span className="text-xs">آماده قرارگیری عکس عینک</span>
          </div>
        )}

        {/* Subtle Ambient Light Gradient on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity pointer-events-none" />

        {/* Badges Over Image */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end z-10">
          {product.uvProtection && (
            <span className="inline-flex items-center gap-1 bg-zinc-950/85 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30 shadow-md">
              <Shield className="w-3 h-3 text-amber-400" />
              <span>{product.uvProtection}</span>
            </span>
          )}
          {discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-rose-600 to-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-rose-600/30 animate-pulse">
              <span>%{discountPercent} تخفیف</span>
            </span>
          )}
        </div>

        {/* Product Code Badge, Compare, Share & Quick View Buttons */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="bg-zinc-900/90 backdrop-blur-md text-zinc-400 font-mono text-[10px] px-2 py-0.5 rounded-md border border-zinc-800 shadow-sm">
            {product.code || 'STK'}
          </span>
          
          {/* Share Button (Web Share API / Telegram / Instagram) */}
          <button
            onClick={handleShareProduct}
            className="p-1.5 rounded-md text-[10px] font-medium flex items-center justify-center transition-all backdrop-blur-md border bg-zinc-900/80 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 hover:bg-zinc-800 border-zinc-800 shadow-sm"
            title="اشتراک‌گذاری در تلگرام و اینستاگرام"
          >
            <Share2 className="w-3 h-3" />
          </button>

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
              className="px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all backdrop-blur-md border bg-zinc-900/80 text-zinc-300 hover:text-amber-400 hover:border-amber-500/40 border-zinc-800 shadow-sm"
              title="مشاهده سریع مشخصات"
            >
              <Eye className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">نگاه سریع</span>
            </button>
          )}
        </div>

        {/* Share Feedback Toast Overlay */}
        <AnimatePresence>
          {sharedToast && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              className="absolute inset-x-3 top-10 bg-emerald-500/95 text-zinc-950 text-xs font-bold py-1.5 px-2.5 rounded-xl shadow-xl flex items-center justify-center gap-1.5 z-20 backdrop-blur-md"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>متن و لینک محصول کپی شد! آماده ارسال در تلگرام/اینستا</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick View Hover Overlay for Customers (Digikala Style) */}
        {!isAdmin && onQuickView && (
          <div className="absolute inset-0 bg-zinc-950/50 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px] z-10 pointer-events-none group-hover:pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow-xl flex items-center gap-1.5 transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>مشاهده سریع مشخصات</span>
            </motion.button>
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
                  currentImgIndex === idx ? 'w-5 bg-amber-400 shadow-sm shadow-amber-400/50' : 'w-1.5 bg-zinc-600/70 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
        )}

        {/* Admin Quick Control Overlay */}
        {isAdmin && (
          <div className="absolute inset-0 bg-zinc-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-xs z-10">
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
            <p className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50"></span>
              <span>عدسی: {product.lensColor}</span>
            </p>
          )}
        </div>

        {/* Pricing & Stock Footer */}
        <div className="pt-2.5 border-t border-zinc-800/60 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[11px] text-zinc-500 line-through">
                {formatToman(product.originalPrice)}
              </span>
            )}
            <span className="text-base font-black text-amber-400 tracking-tight">
              {formatToman(product.price)}
            </span>
          </div>

          <motion.button
            whileTap={{ scale: 0.93 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`group/btn flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              product.stock <= 0
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : added
                ? 'bg-emerald-500 text-zinc-950 scale-105 shadow-emerald-500/20'
                : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 hover:shadow-amber-500/25 shadow-amber-500/10'
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
