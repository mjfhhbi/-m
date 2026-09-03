import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ShoppingBag, Truck, Sparkles, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from '../utils/audio';

interface SocialProofTickerProps {
  products: Product[];
  onSelectProduct?: (product: Product) => void;
}

const CITIES = ['تهران', 'اصفهان', 'مشهد', 'شیراز', 'تبریز', 'اهواز', 'کرج', 'رشت', 'یزد', 'کرمان', 'قم', 'ساری'];

export const SocialProofTicker: React.FC<SocialProofTickerProps> = ({
  products,
  onSelectProduct,
}) => {
  const [currentNotification, setCurrentNotification] = useState<{
    id: string;
    product: Product;
    city: string;
    timeAgo: string;
  } | null>(null);

  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (products.length === 0 || dismissed) return;

    // Show initial proof after 6 seconds, then rotate every 22 seconds
    const showRandomNotification = () => {
      const randomProd = products[Math.floor(Math.random() * products.length)];
      const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
      const times = ['۱ دقیقه پیش', '۲ دقیقه پیش', '۴ دقیقه پیش', 'همین حالا'];
      const randomTime = times[Math.floor(Math.random() * times.length)];

      setCurrentNotification({
        id: Math.random().toString(),
        product: randomProd,
        city: randomCity,
        timeAgo: randomTime,
      });

      // Auto hide after 6.5 seconds
      setTimeout(() => {
        setCurrentNotification(null);
      }, 6500);
    };

    const initialTimer = setTimeout(showRandomNotification, 5500);
    const interval = setInterval(showRandomNotification, 24000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [products, dismissed]);

  if (!currentNotification || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={currentNotification.id}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 max-w-sm bg-zinc-950/95 border border-amber-500/30 p-3 rounded-2xl shadow-2xl backdrop-blur-md text-right dir-rtl select-none"
      >
        <div className="flex items-center gap-3">
          
          {/* Product Thumbnail */}
          <div 
            onClick={() => {
              if (onSelectProduct) {
                sound.playPop();
                onSelectProduct(currentNotification.product);
              }
            }}
            className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center shrink-0 cursor-pointer overflow-hidden group"
          >
            <img
              src={currentNotification.product.images?.[0]}
              alt={currentNotification.product.title}
              className="w-full h-full object-contain group-hover:scale-110 transition-transform"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold mb-0.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>خرید موفق از {currentNotification.city}</span>
              <span className="text-zinc-500 font-normal mr-auto">{currentNotification.timeAgo}</span>
            </div>

            <p 
              onClick={() => {
                if (onSelectProduct) {
                  sound.playPop();
                  onSelectProduct(currentNotification.product);
                }
              }}
              className="text-xs font-bold text-zinc-100 truncate cursor-pointer hover:text-amber-400 transition-colors"
            >
              {currentNotification.product.title}
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => setDismissed(true)}
            className="text-zinc-500 hover:text-zinc-300 p-1 transition-colors"
            title="بستن اعلان"
          >
            <X className="w-3.5 h-3.5" />
          </button>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
