import React from 'react';
import { CartItem, StoreSettings } from '../types';
import { formatToman } from '../utils/storage';
import { 
  X, 
  Trash2, 
  ShoppingBag, 
  ArrowLeft, 
  Truck, 
  Sparkles, 
  ShieldCheck,
  Glasses
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageLazyLoader } from './ImageLazyLoader';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: () => void;
  settings: StoreSettings;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  settings,
}) => {
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  
  const freeShippingThreshold = settings.freeShippingThreshold || 2000000;
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const shippingFee = 0;
  const finalTotal = subtotal;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden text-right">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xs"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 360, mass: 0.8 }}
            className="absolute inset-y-0 left-0 max-w-md w-full bg-zinc-950 border-r border-zinc-800 shadow-2xl flex flex-col justify-between"
          >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">سبد خرید شما</h2>
                <p className="text-[11px] text-zinc-400 font-light">
                  {totalItemsCount > 0 ? `${totalItemsCount} عینک در سبد خرید` : 'سبد خرید خالی است'}
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Shipping Notice Banner */}
          {items.length > 0 && (
            <div className="bg-zinc-900/90 px-4 py-3 border-b border-zinc-800 text-xs">
              <div className="flex items-center gap-2 text-amber-300 font-medium">
                <Truck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>هزینه ارسال: <strong className="text-white">پس‌کرایه</strong> (پرداخت موقع تحویل توسط خریدار)</span>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-700">
                  <Glasses className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-300">سبد خرید شما خالی است</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    عینک‌های استوک و آفتابی مجموعه را مشاهده کنید و محصول مورد نظر خود را اضافه کنید.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  مشاهده ویترین عینک‌ها
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-2xl flex items-center gap-3 relative group"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.product.images && item.product.images[0] ? (
                      <ImageLazyLoader
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-full h-full"
                      />
                    ) : (
                      <Glasses className="w-6 h-6 text-zinc-700" />
                    )}
                  </div>

                  {/* Title & Specs */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.product.title}</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {item.product.frameType || 'عینک استوک'} | {item.product.uvProtection || 'UV400'}
                    </p>
                    <div className="text-xs font-bold text-amber-400 mt-1">
                      {formatToman(item.product.price)}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.15, rotate: -10 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="حذف از سبد"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>

                    <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg p-0.5">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold transition-colors"
                      >
                        -
                      </motion.button>
                      <span className="w-5 text-center text-xs font-bold text-white">{item.quantity}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-bold transition-colors"
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Summary & Checkout Footer */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-900/90 space-y-3">
              <div className="space-y-1.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>جمع محصولات:</span>
                  <span className="text-zinc-200 font-medium">{formatToman(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>هزینه پست پیشتاز:</span>
                  <span className="text-amber-400 font-bold">پس‌کرایه (پرداخت موقع تحویل)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-extrabold text-white">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-amber-400">{formatToman(finalTotal)}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onProceedToCheckout}
                className="group w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <span>تکمیل و ثبت سفارش</span>
                <ArrowLeft className="w-4 h-4 stroke-[2.5] group-hover:-translate-x-1 transition-transform duration-300" />
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
