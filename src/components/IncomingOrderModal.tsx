import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  Phone, 
  ExternalLink, 
  FileText, 
  ShoppingBag, 
  MapPin, 
  User, 
  Volume2,
  CheckCircle2
} from 'lucide-react';
import { Order } from '../types';
import { toPersianDigits, formatToman } from '../utils/storage';
import { sound } from '../utils/audio';

interface IncomingOrderModalProps {
  order: Order | null;
  onClose: () => void;
  onViewInAdmin: (order: Order) => void;
}

export const IncomingOrderModal: React.FC<IncomingOrderModalProps> = ({
  order,
  onClose,
  onViewInAdmin
}) => {
  if (!order) return null;

  const handlePlaySoundAgain = () => {
    sound.playOrderAlert();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-zinc-900 border-2 border-amber-500/70 shadow-2xl shadow-amber-500/30 rounded-3xl w-full max-w-lg overflow-hidden text-white"
        >
          {/* Header with animated bell and alarm header */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-4 text-zinc-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
                <div className="w-10 h-10 rounded-2xl bg-zinc-950 text-amber-400 flex items-center justify-center shadow-lg">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">سفارش جدید دریافت شد!</h3>
                <p className="text-xs font-semibold text-zinc-900/90">
                  کد سفارش: {toPersianDigits(order.orderCode || order.id.slice(-6))}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePlaySoundAgain}
                className="p-2 rounded-xl bg-zinc-950/20 hover:bg-zinc-950/30 text-zinc-950 transition-colors"
                title="پخش مجدد صدای زنگ"
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-950/20 hover:bg-zinc-950/30 text-zinc-950 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Customer Summary Card */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-300 font-bold">
                  <User className="w-4 h-4 text-amber-400" />
                  <span>خریدار: {order.customer?.fullName || 'ثبت نشده'}</span>
                </div>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  سفارش زنده
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/80">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Phone className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono text-zinc-200 dir-ltr">{toPersianDigits(order.customer?.phone || '')}</span>
                </div>
                {order.customer?.phone && (
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="text-amber-400 hover:text-amber-300 text-xs font-bold flex items-center gap-1 hover:underline"
                  >
                    <span>تماس فوری</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {order.customer?.address && (
                <div className="flex items-start gap-2 text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    {order.customer.city ? `${order.customer.city} - ` : ''}
                    {order.customer.address}
                  </span>
                </div>
              )}
            </div>

            {/* Ordered Items List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>عینک‌های ثبت‌شده ({toPersianDigits(order.items.length)} قلم):</span>
                </span>
                <span className="text-amber-400 font-black">
                  مبلغ: {formatToman(order.finalAmount || order.totalAmount || 0)} تومان
                </span>
              </div>

              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-11 h-11 object-cover rounded-lg bg-zinc-900 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-600 shrink-0">
                          👓
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{item.product.title}</h4>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>کد: {item.product.code}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-bold">تعداد: {toPersianDigits(item.quantity)} عدد</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-zinc-200">
                        {formatToman(item.product.price * item.quantity)} تومان
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification summary text */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-300 leading-relaxed space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>نوتیفیکیشن لحظه‌ای به گوشی و پنل شما ارسال شد.</span>
              </div>
              <p className="text-zinc-300 text-[10px]">
                شما می‌توانید در پنل مدیریت سفارش را تایید نموده، فاکتور چاپ کنید و پس از ارسال با پست، کد رهگیری را برای مشتری ثبت کنید.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
            >
              متوجه شدم و بستن
            </button>

            <button
              type="button"
              onClick={() => {
                onViewInAdmin(order);
                onClose();
              }}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/20"
            >
              <FileText className="w-4 h-4 stroke-[2.5]" />
              <span>مشاهده فاکتور و مدیریت سفارش</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
