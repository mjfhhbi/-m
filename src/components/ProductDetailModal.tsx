import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { formatToman } from '../utils/storage';
import { 
  X, 
  ShoppingBag, 
  ShieldCheck, 
  Glasses, 
  Check, 
  Sparkles, 
  PackageCheck,
  ChevronRight,
  ChevronLeft,
  Share2,
  Truck,
  CheckCircle2,
  ZoomIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageLazyLoader } from './ImageLazyLoader';
import { ProductReviews } from './ProductReviews';
import { sound } from '../utils/audio';

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
  const [sharedToast, setSharedToast] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setSelectedImageIndex(0);
    setIsZoomed(false);
  }, [product?.id]);

  if (!product) return null;

  const images = product?.images && product.images.length > 0 ? product.images : [];

  const relatedProducts = product
    ? allProducts
        .filter((p) => p.id !== product.id && (p.category === product.category || p.isFeatured))
        .slice(0, 4)
    : [];

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    sound.playSuccess();
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  const handlePrevImage = () => {
    if (images.length <= 1) return;
    sound.playPop();
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = () => {
    if (images.length <= 1) return;
    sound.playPop();
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-zinc-900 border border-zinc-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto text-right"
        >
          {/* Close Button */}
          <button
            onClick={() => {
              sound.playPop();
              onClose();
            }}
            className="absolute top-4 left-4 z-20 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-300 p-2 rounded-full backdrop-blur-sm transition-colors border border-zinc-800"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left Column: High Quality Image Stage & Gallery */}
            <div className="bg-zinc-950 p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-l border-zinc-800/80 relative">
              
              {/* Main Image Stage with Navigation */}
              <div className="w-full aspect-[4/3] relative rounded-2xl overflow-hidden bg-zinc-900 flex items-center justify-center border border-zinc-800/80 group shadow-inner">
                {images.length > 0 ? (
                  <div 
                    className="w-full h-full cursor-zoom-in relative"
                    onClick={() => setIsZoomed(!isZoomed)}
                  >
                    <ImageLazyLoader
                      src={images[selectedImageIndex]}
                      alt={product.title}
                      priority
                      className={`w-full h-full transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                    />
                    
                    {/* Zoom icon helper */}
                    <div className="absolute bottom-2 left-2 bg-zinc-950/70 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] text-zinc-400 flex items-center gap-1 border border-zinc-800 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-3 h-3 text-amber-400" />
                      <span>{isZoomed ? 'کوچک‌نمایی' : 'بزرگ‌نمایی تصویر'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-zinc-600">
                    <Glasses className="w-16 h-16 stroke-[1.2]" />
                    <span className="text-xs">تصویر برای این عینک ثبت نشده است</span>
                  </div>
                )}

                {/* Left/Right Carousel Controls */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-200 p-1.5 rounded-full border border-zinc-700/80 transition-all opacity-80 hover:opacity-100 shadow-md"
                      title="تصویر قبلی"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-200 p-1.5 rounded-full border border-zinc-700/80 transition-all opacity-80 hover:opacity-100 shadow-md"
                      title="تصویر بعدی"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* UV Protection & Status Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end pointer-events-none">
                  {product.uvProtection && (
                    <span className="bg-amber-500/15 backdrop-blur-md border border-amber-500/30 text-amber-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>{product.uvProtection}</span>
                    </span>
                  )}
                  {product.stock > 0 ? (
                    <span className="bg-emerald-500/15 backdrop-blur-md border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>موجود در انبار</span>
                    </span>
                  ) : (
                    <span className="bg-rose-500/15 backdrop-blur-md border border-rose-500/30 text-rose-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                      ناموجود
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnail Gallery Navigation */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 mt-3 overflow-x-auto w-full pb-1 scrollbar-none justify-center">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        sound.playPop();
                        setSelectedImageIndex(idx);
                      }}
                      className={`relative w-14 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        selectedImageIndex === idx 
                          ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20' 
                          : 'border-zinc-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Delivery & Safe Packaging Guarantees */}
              <div className="mt-4 w-full pt-3 border-t border-zinc-800/80 grid grid-cols-2 gap-2.5 text-xs text-zinc-300">
                <div className="flex items-center gap-2 bg-zinc-900/70 p-2.5 rounded-xl border border-zinc-800/60">
                  <PackageCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>هاردکیس ضدضربه + دستمال</span>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900/70 p-2.5 rounded-xl border border-zinc-800/60">
                  <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>ارسال پستی فوری و مطمئن</span>
                </div>
              </div>
            </div>

            {/* Right Column: Eyewear Specifications & Actions */}
            <div className="p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                
                {/* Category & Product Code Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                    {product.gender || 'عینک استوک اورجینال'}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        sound.playPop();
                        const productUrl = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`;
                        const shareText = `👓 ${product.title}\n💰 قیمت: ${formatToman(product.price)}\n🛡️ محافظت: ${product.uvProtection || 'UV400'}\n\nمشاهده و سفارش آنلاین:`;
                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: product.seoTitle || product.title,
                              text: shareText,
                              url: productUrl,
                            });
                            return;
                          } catch (e) {}
                        }
                        try {
                          await navigator.clipboard.writeText(`${shareText}\n${productUrl}`);
                          setSharedToast(true);
                          setTimeout(() => setSharedToast(false), 2400);
                        } catch (e) {
                          setSharedToast(true);
                          setTimeout(() => setSharedToast(false), 2400);
                        }
                      }}
                      className="text-xs text-zinc-400 hover:text-amber-400 bg-zinc-800/80 hover:bg-zinc-800 px-2.5 py-1 rounded-lg border border-zinc-700/60 flex items-center gap-1 transition-colors"
                      title="اشتراک‌گذاری عینک"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>اشتراک‌گذاری</span>
                    </button>

                    <span className="text-xs font-mono text-zinc-400 bg-zinc-800/60 px-2.5 py-1 rounded-lg">
                      کد: {product.code || 'STK'}
                    </span>
                  </div>
                </div>

                {/* Share Toast */}
                <AnimatePresence>
                  {sharedToast && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs px-3 py-2 rounded-xl font-bold flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>لینک مستقیم محصول با موفقیت کپی شد.</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {product.title}
                </h2>

                {/* Pricing Box */}
                <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 flex items-center justify-between shadow-sm">
                  <div className="space-y-0.5">
                    <span className="text-xs text-zinc-400 block">قیمت محصول:</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 line-through">
                          {formatToman(product.originalPrice)}
                        </span>
                        <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-rose-500/30">
                          {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% تخفیف
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-left">
                    <span className="text-2xl font-black text-amber-400">
                      {formatToman(product.price * quantity)}
                    </span>
                  </div>
                </div>

                {/* Eyewear Spec Grid Table */}
                <div className="bg-zinc-950/70 rounded-2xl border border-zinc-800/70 p-4 space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2 border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-400">جنس و متریال فریم:</span>
                    <span className="text-zinc-200 font-bold">{product.frameType || 'استوک کائوچویی / فلزی'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-400">رنگ و نوع عدسی:</span>
                    <span className="text-zinc-200 font-bold">{product.lensColor || 'دودی / استاندارد'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-b border-zinc-800/50 pb-2">
                    <span className="text-zinc-400">سطح محافظت UV:</span>
                    <span className="text-amber-400 font-bold">{product.uvProtection || 'استاندارد UV400'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-zinc-400">وضعیت انبار:</span>
                    <span className={`font-black ${product.stock > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {product.stock > 0 ? `${product.stock} عدد در انبار آماده ارسال` : 'اتمام موجودی'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-zinc-300">توضیحات و مشخصات تکمیلی:</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/40">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Features List */}
                {product.features && product.features.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-zinc-300">ویژگی‌های برجسته:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.features.map((feat, i) => (
                        <span
                          key={i}
                          className="bg-zinc-800/80 text-zinc-300 text-[11px] px-3 py-1 rounded-xl border border-zinc-700/50 flex items-center gap-1.5"
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
                  <span className="text-xs font-bold text-zinc-400">تعداد درخواستی:</span>
                  <div className="flex items-center gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-1">
                    <button
                      onClick={() => {
                        sound.playPop();
                        setQuantity(Math.max(1, quantity - 1));
                      }}
                      className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-base transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-black text-white">{quantity}</span>
                    <button
                      onClick={() => {
                        sound.playPop();
                        setQuantity(Math.min(product.stock > 0 ? product.stock : 1, quantity + 1));
                      }}
                      className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center justify-center font-bold text-base transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98] ${
                    product.stock <= 0
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : added
                      ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 shadow-amber-500/20'
                  }`}
                >
                  {added ? (
                    <>
                      <Check className="w-5 h-5 stroke-[2.5]" />
                      <span>با موفقیت به سبد خرید افزوده شد</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                      <span>{product.stock <= 0 ? 'موجودی این محصول به پایان رسیده' : 'افزودن به سبد خرید'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="border-t border-zinc-800 p-6 bg-zinc-950/40">
            <ProductReviews productId={product.id} productTitle={product.title} />
          </div>

          {/* Suggested / Related Products Section */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-zinc-800 p-6 bg-zinc-950/70 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>محصولات پیشنهادی و مشابه</span>
                </h4>
                <span className="text-[11px] text-zinc-500">سایر عینک‌های پرطرفدار استوک</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {relatedProducts.map((relProd) => (
                  <div
                    key={relProd.id}
                    onClick={() => {
                      sound.playPop();
                      if (onSelectProduct) {
                        onSelectProduct(relProd);
                        setSelectedImageIndex(0);
                        setQuantity(1);
                      }
                    }}
                    className="group bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl p-2.5 cursor-pointer transition-all flex flex-col justify-between hover:shadow-lg"
                  >
                    <div className="aspect-[4/3] bg-zinc-950 rounded-xl overflow-hidden mb-2 relative">
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
                      <span className="text-xs font-black text-amber-400 block mt-1">
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
    </AnimatePresence>
  );
};
