import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShoppingBag, Trash2, Glasses, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { formatToman } from '../utils/storage';
import { ImageLazyLoader } from './ImageLazyLoader';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistProductIds: string[];
  products: Product[];
  onRemoveFromWishlist: (productId: string) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  onClose,
  wishlistProductIds,
  products,
  onRemoveFromWishlist,
  onAddToCart,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  const savedProducts = products.filter((p) => wishlistProductIds.includes(p.id));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end text-right dir-rtl">
        {/* Overlay backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md bg-zinc-950 border-r border-zinc-800 h-full flex flex-col justify-between shadow-2xl z-10 p-5 sm:p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">عینک‌های نشان‌شده</h3>
                <span className="text-xs text-zinc-400 font-light">{savedProducts.length} محصول ذخیره شده</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List or Empty State */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {savedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3 text-zinc-500">
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-600 border border-zinc-800">
                  <Heart className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-zinc-300">لیست علاقه‌مندی‌های شما خالی است</h4>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
                  روی علامت قلب در کنار هر عینک کلیک کنید تا در این لیست ذخیره شود و بعداً راحت‌تر آنها را بیابید.
                </p>
              </div>
            ) : (
              savedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3 flex items-center gap-3 group hover:border-amber-500/40 transition-colors"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => {
                      onSelectProduct(prod);
                      onClose();
                    }}
                    className="w-16 h-16 rounded-xl bg-zinc-950 overflow-hidden border border-zinc-800 shrink-0 cursor-pointer"
                  >
                    <ImageLazyLoader
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=200'}
                      alt={prod.title}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h5
                      onClick={() => {
                        onSelectProduct(prod);
                        onClose();
                      }}
                      className="text-xs font-bold text-white truncate cursor-pointer hover:text-amber-400 transition-colors"
                    >
                      {prod.title}
                    </h5>
                    <span className="text-xs font-extrabold text-amber-400 font-mono block mt-1">
                      {formatToman(prod.price)}
                    </span>
                    <span className="text-[10px] text-zinc-500 block">
                      {prod.frameType || 'استوک'} | {prod.uvProtection || 'UV400'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => onAddToCart(prod)}
                      disabled={prod.stock <= 0}
                      className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-colors shadow-sm disabled:opacity-50"
                      title="افزودن به سبد خرید"
                    >
                      <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <button
                      onClick={() => onRemoveFromWishlist(prod.id)}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-950 hover:text-rose-400 text-zinc-400 transition-colors"
                      title="حذف از نشان‌شده‌ها"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer CTA */}
          <div className="border-t border-zinc-800 pt-4 space-y-2">
            <button
              onClick={onClose}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl text-xs transition-colors"
            >
              بازگشت به فروشگاه
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
