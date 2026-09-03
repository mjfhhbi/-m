import React from 'react';
import { Store, Search, ShoppingBag, Heart, Truck, Headphones } from 'lucide-react';
import { motion } from 'motion/react';
import { toPersianDigits } from '../utils/storage';

interface MobileBottomNavProps {
  currentView: 'store' | 'admin';
  onViewChange: (view: 'store' | 'admin') => void;
  cartCount: number;
  onOpenCart: () => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onOpenTracker: () => void;
  onOpenSupport: () => void;
  onFocusSearch?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onViewChange,
  cartCount,
  onOpenCart,
  wishlistCount,
  onOpenWishlist,
  onOpenTracker,
  onOpenSupport,
  onFocusSearch,
}) => {
  if (currentView === 'admin') return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 sm:hidden bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800/80 px-2 py-1.5 shadow-[0_-10px_25px_rgba(0,0,0,0.5)] dir-rtl select-none">
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        
        {/* Store / Home */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex flex-col items-center justify-center py-1 text-zinc-400 hover:text-amber-400 active:scale-95 transition-all group"
        >
          <div className="p-1 rounded-xl group-hover:bg-amber-500/10 transition-colors">
            <Store className="w-5 h-5 group-hover:text-amber-400" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 text-zinc-300">ویترین</span>
        </button>

        {/* Wishlist */}
        <button
          onClick={onOpenWishlist}
          className="flex flex-col items-center justify-center py-1 text-zinc-400 hover:text-rose-400 active:scale-95 transition-all relative group"
        >
          <div className="p-1 rounded-xl group-hover:bg-rose-500/10 transition-colors relative">
            <Heart className="w-5 h-5 group-hover:text-rose-400" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                {toPersianDigits(wishlistCount)}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold mt-0.5 text-zinc-300">نشان‌شده</span>
        </button>

        {/* Center Prominent Cart Button */}
        <div className="flex flex-col items-center justify-center -mt-5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={onOpenCart}
            className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-600 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center active:scale-95 transition-transform"
          >
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              {cartCount > 0 ? (
                <span className="absolute top-1 right-1 bg-amber-400 text-zinc-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {toPersianDigits(cartCount)}
                </span>
              ) : null}
            </div>
          </motion.button>
          <span className="text-[10px] font-black text-amber-400 mt-0.5">سبد خرید</span>
        </div>

        {/* Order Tracker */}
        <button
          onClick={onOpenTracker}
          className="flex flex-col items-center justify-center py-1 text-zinc-400 hover:text-amber-400 active:scale-95 transition-all group"
        >
          <div className="p-1 rounded-xl group-hover:bg-amber-500/10 transition-colors">
            <Truck className="w-5 h-5 group-hover:text-amber-400" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 text-zinc-300">پیگیری</span>
        </button>

        {/* Support Chat */}
        <button
          onClick={onOpenSupport}
          className="flex flex-col items-center justify-center py-1 text-zinc-400 hover:text-emerald-400 active:scale-95 transition-all group relative"
        >
          <div className="p-1 rounded-xl group-hover:bg-emerald-500/10 transition-colors relative">
            <Headphones className="w-5 h-5 group-hover:text-emerald-400" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <span className="text-[10px] font-bold mt-0.5 text-zinc-300">پشتیبانی</span>
        </button>

      </div>
    </div>
  );
};
