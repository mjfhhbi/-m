import React, { useState } from 'react';
import { StoreSettings } from '../types';
import { 
  X, 
  MessageSquare, 
  Send, 
  Phone, 
  Instagram, 
  MapPin, 
  Check, 
  Copy, 
  Headphones, 
  Sparkles,
  Truck,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onShowToast: (msg: string) => void;
  onOpenTracker?: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  settings,
  onShowToast,
  onOpenTracker
}) => {
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  const telegramId = settings.telegram || 'stock_jahani';
  const phone = settings.phone || '09120000000';
  const instagram = settings.instagram || 'stock_jahani';

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    onShowToast('شماره تماس پشتیبانی کپی شد');
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleSendTelegramQuery = (presetText?: string) => {
    const textToSend = presetText || customMessage || 'سلام، درباره سفارش عینک و موجودی سوال داشتم.';
    const url = `https://t.me/${telegramId.replace('@', '')}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          key="support-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto text-right dir-rtl"
          onClick={onClose}
        >
          <motion.div
            key="support-modal"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl overflow-hidden my-auto space-y-5"
          >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>پشتیبانی و ارتباط مستقیم با مدیریت</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">پاسخگویی آنلاین</span>
                </h3>
                <p className="text-[11px] text-zinc-400">راه ارتباطی تلگرام، مشاوره خرید و پیگیری سفارشات</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Support Direct Buttons */}
          <div className="space-y-3">
            {/* Telegram Direct Chat Button */}
            <button
              onClick={() => handleSendTelegramQuery()}
              className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-zinc-950 p-3.5 rounded-xl text-xs font-black flex items-center justify-between shadow-lg shadow-sky-500/15 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 shrink-0 group-hover:translate-x-1 transition-transform" />
                <span>چت مستقیم در تلگرام (@{telegramId.replace('@', '')})</span>
              </div>
              <ExternalLink className="w-4 h-4 opacity-80" />
            </button>

            {/* Quick Presets */}
            <div className="bg-zinc-950/80 border border-zinc-800/80 p-3.5 rounded-xl space-y-2">
              <span className="text-[11px] font-bold text-amber-400 block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                پرسش‌های سریع پیش‌فرض (کلیک کنید تا ارسال شود):
              </span>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                <button
                  onClick={() => handleSendTelegramQuery('سلام، می‌خواستم از موجودی و مشخصات فریم عینک مطلع بشم.')}
                  className="w-full text-right bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-2 rounded-lg border border-zinc-800 hover:border-amber-500/30 transition-colors text-[11px]"
                >
                  💬 استعلام موجودی عینک آفتابی یا طبی
                </button>
                <button
                  onClick={() => handleSendTelegramQuery('سلام، فیش واریزی رو پرداخت کردم. لطفاً سفارش من رو تایید بفرمایید.')}
                  className="w-full text-right bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-2 rounded-lg border border-zinc-800 hover:border-amber-500/30 transition-colors text-[11px]"
                >
                  💳 تایید فیش واریزی کارت به کارت
                </button>
                <button
                  onClick={() => handleSendTelegramQuery('سلام، کد رهگیری ۲۴ رقمی پست پیشتاز برای سفارش من صادر شده؟')}
                  className="w-full text-right bg-zinc-900 hover:bg-zinc-800 text-zinc-300 p-2 rounded-lg border border-zinc-800 hover:border-amber-500/30 transition-colors text-[11px]"
                >
                  📦 در خواست کد رهگیری مرسوله پستی
                </button>
              </div>
            </div>

            {/* Direct Phone Call & Copy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={`tel:${phone}`}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-3 rounded-xl flex items-center justify-between text-xs text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  <span>تماس تلفنی با فروشگاه</span>
                </div>
                <span className="font-mono text-[11px] text-zinc-400">{phone}</span>
              </a>

              <button
                onClick={handleCopyPhone}
                className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-3 rounded-xl flex items-center justify-between text-xs text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {copiedPhone ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                  <span>{copiedPhone ? 'کپی شد!' : 'کپی شماره تماس'}</span>
                </div>
                <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded text-zinc-400">حافظه</span>
              </button>
            </div>

            {/* Tracker Shortcut */}
            {onOpenTracker && (
              <button
                onClick={() => { onClose(); onOpenTracker(); }}
                className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>ورود به بخش پیگیری سفارشات و دریافت کد پستی</span>
                </div>
                <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-md">پیگیری آنلاین</span>
              </button>
            )}

            {/* Instagram Support */}
            <a
              href={`https://instagram.com/${instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-pink-500/20 p-3 rounded-xl flex items-center justify-between text-xs text-pink-300 hover:text-pink-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-pink-400" />
                <span>صفحه اینستاگرام رسمی ({instagram})</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="pt-2 border-t border-zinc-800 text-center">
            <button
              onClick={onClose}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 rounded-xl text-xs font-medium transition-colors"
            >
              بستن پنجره پشتیبانی
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
