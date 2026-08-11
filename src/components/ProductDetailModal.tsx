import React, { useState } from 'react';
import { Product } from '../types';
import { formatToman } from '../utils/storage';
import { 
  X, 
  ShoppingBag, 
  ShieldCheck, 
  Glasses, 
  Check, 
  Tag, 
  Sparkles, 
  PackageCheck,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageLazyLoader } from './ImageLazyLoader';

interface ProductDetailModalProps {
  product: Product | null;
  allProducts?: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onSelectProduct?: (product: Product) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  allProducts = [],
  onClose,
  onAddToCart,
  onSelectProduct,
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  React.useEffect(() => {
    setQuantity(1);
    setSelectedImageIndex(0);
  }, [product?.id]);

  // Filter suggested products (same category or featured, excluding current product)
  const relatedProducts = product
    ? allProducts
        .filter((p) => p.id !== product.id && (p.category === product.category || p.isFeatured))
        .slice(0, 4)
    : [];

  const images = product?.images && product.images.length > 0 ? product.images : [];

  const handleAddToCart = () => {
    if (!product) return;
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto text-right"
          >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-20 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 p-2 rounded-full backdrop-blur-sm transition-colors border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Column: Image Gallery */}
            <div className="bg-zinc-950 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-l border-zinc-800/80 relative">
              <div className="w-full aspect-[4/3] relative rounded-xl overflow-hidden bg-zinc-900 flex items-center justify-center border border-zinc-800">
                {images.length > 0 ? (
                  <ImageLazyLoader
                    src={images[selectedImageIndex]}
                    alt={product.title}
                    priority
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-600">
                    <Glasses className="w-16 h-16 stroke-[1.2]" />
                    <span className="text-xs">تصویر عینک اضافه نشده است</span>
                  </div>
                )}

                {/* Badge Overlay */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                  {product.uvProtection && (
                    <span className="bg-amber-500/10 backdrop-blur-md border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{product.uvProtection}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail Gallery Navigation */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 mt-4 overflow-x-auto w-full pb-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                        selectedImageIndex === idx ? 'border-amber-400 scale-105' : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Guarantees bar */}
              <div className="mt-6 w-full pt-4 border-t border-zinc-800/80 grid grid-cols-2 gap-3 text-xs text-zinc-400">
                <div className="flex items-center gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/50">
                  <PackageCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ارسال ایمن در هارد‌کیس</span>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/50">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>تضمین اصالت و کیفیت</span>
                </div>
              </div>
            </div>

            {/* Right Column: Eyewear Specifications & Actions */}
            <div className="p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Category & Product Code Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                    {product.gender || 'عینک استوک'}
                  </span>
                  <span className="text-xs font-mono text-zinc-500 bg-zinc-800/60 px-2.5 py-1 rounded-md">
                    کد: {product.code || 'STK'}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white leading-snug">
                  {product.title}
                </h2>

                {/* Pricing Display */}
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800/80 flex items-center justify-between">
                  <span className="text-xs text-zinc-400">قیمت نهایی:</span>
                  <div className="text-left">
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="block text-xs text-zinc-500 line-through">
                        {formatToman(product.originalPrice)}
                      </span>
                    )}
                    <span className="text-xl font-extrabold text-amber-400">
                      {formatToman(product.price * quantity)}
                    </span>
                  </div>
                </div>

                {/* Eyewear Spec Grid Table */}
                <div className="bg-zinc-950/60 rounded-xl border border-zinc-800/70 p-3.5 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-500">جنس فریم:</span>
                    <span className="text-zinc-200 font-medium">{product.frameType || 'مشخص نشده'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-500">رنگ عدسی:</span>
                    <span className="text-zinc-200 font-medium">{product.lensColor || 'مشخص نشده'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-500">سطح محافظت:</span>
                    <span className="text-amber-400 font-medium">{product.uvProtection || 'UV400'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-zinc-500">موجودی در انبار:</span>
                    <span className={`font-bold ${product.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {product.stock > 0 ? `${product.stock} عدد موجود` : 'اتمام موجودی'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300 mb-1.5">توضیحات عینک:</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Features List */}
                {product.features && product.features.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300 mb-2">ویژگی‌های برجسته:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.features.map((feat, i) => (
                        <span
                          key={i}
                          className="bg-zinc-800/80 text-zinc-300 text-[11px] px-2.5 py-1 rounded-lg border border-zinc-700/50 flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity Selector & Add to Cart Button */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">تعداد سفارش:</span>
                  <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-xl p-1">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-sm"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock > 0 ? product.stock : 1, quantity + 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`w-full py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg ${
                    product.stock <= 0
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : added
                      ? 'bg-emerald-500 text-zinc-950'
                      : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      <span>با موفقیت به سبد خرید اضافه شد</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                      <span>{product.stock <= 0 ? 'ناموجود می باشد' : 'افزودن به سبد خرید'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Suggested / Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-zinc-800 p-5 bg-zinc-950/60 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>محصولات پیشنهادی و مرتبط</span>
                </h4>
                <span className="text-[11px] text-zinc-500">عینک‌های مشابه و پرطرفدار</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedProducts.map((relProd) => (
                  <div
                    key={relProd.id}
                    onClick={() => {
                      if (onSelectProduct) {
                        onSelectProduct(relProd);
                        setSelectedImageIndex(0);
                        setQuantity(1);
                      }
                    }}
                    className="group bg-zinc-900 border border-zinc-800 hover:border-amber-500/40 rounded-xl p-2 cursor-pointer transition-all flex flex-col justify-between"
                  >
                    <div className="aspect-[4/3] bg-zinc-950 rounded-lg overflow-hidden mb-2 relative">
                      <ImageLazyLoader
                        src={relProd.images?.[0] || 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'}
                        alt={relProd.title}
                        zoomOnHover
                        className="w-full h-full"
                      />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-zinc-200 line-clamp-1 group-hover:text-amber-400 transition-colors">
                        {relProd.title}
                      </h5>
                      <span className="text-[11px] font-extrabold text-amber-400 block mt-1 font-mono">
                        {formatToman(relProd.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
