import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sun, ShieldCheck, Sparkles, Eye, CheckCircle2, Zap } from 'lucide-react';

interface LensSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type LensMode = 'none' | 'tinted' | 'polarized';

export const LensSimulatorModal: React.FC<LensSimulatorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [lensMode, setLensMode] = useState<LensMode>('polarized');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto text-right dir-rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto p-5 sm:p-7 space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-zinc-800/80 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>شبیه‌ساز و آزمایشگاه عدسی UV400 و Polarized</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                تفاوت عدسی‌های استوک اورجینال با عینک‌های معمولی
              </h2>
              <p className="text-xs text-zinc-400">
                حالت‌های مختلف را انتخاب کرده و تفاوت وضوح دید، حذف بازتاب نور کورکننده و فیلتراسیون اشعه ماوراء بنفش را به صورت زنده تجربه کنید:
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setLensMode('none')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                lensMode === 'none'
                  ? 'bg-rose-500/15 border-rose-500 text-rose-300 font-extrabold'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-xs">دید بدون عینک</span>
              <span className="text-[10px] text-zinc-500">نور کورکننده و اشعه UV</span>
            </button>

            <button
              onClick={() => setLensMode('tinted')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                lensMode === 'tinted'
                  ? 'bg-zinc-700/50 border-zinc-500 text-zinc-200 font-extrabold'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Eye className="w-5 h-5" />
              <span className="text-xs">عینک تیره معمولی</span>
              <span className="text-[10px] text-zinc-500">فقط تاریک، بدون حذف تابش</span>
            </button>

            <button
              onClick={() => setLensMode('polarized')}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 ${
                lensMode === 'polarized'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold shadow-lg shadow-amber-500/10 scale-105'
                  : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-xs">پلاریزه اورجینال UV400</span>
              <span className="text-[10px] text-amber-400">کنتراست کریستالی استوک</span>
            </button>
          </div>

          {/* Interactive Simulation Viewport */}
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
            {/* Background Driving/Beach Scene */}
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80"
              alt="Road Scene"
              className={`w-full h-full object-cover transition-all duration-700 ${
                lensMode === 'none'
                  ? 'brightness-125 contrast-90 saturate-75 blur-[0.4px]'
                  : lensMode === 'tinted'
                  ? 'brightness-75 contrast-95 saturate-90'
                  : 'brightness-95 contrast-125 saturate-110'
              }`}
            />

            {/* Glare Overlays for "None" or "Tinted" */}
            {lensMode === 'none' && (
              <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-amber-200/25 to-white/30 mix-blend-screen pointer-events-none animate-pulse">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 bg-white/60 rounded-full blur-2xl" />
                <div className="absolute bottom-4 right-4 bg-rose-950/90 text-rose-300 border border-rose-500/40 text-[11px] font-bold px-3 py-1.5 rounded-xl">
                  ⚠️ بازتاب مستقیم نور خورشید و آسیب اشعه به شبکیه چشم
                </div>
              </div>
            )}

            {lensMode === 'tinted' && (
              <div className="absolute inset-0 bg-black/40 mix-blend-multiply pointer-events-none">
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-48 h-48 bg-white/30 rounded-full blur-xl" />
                <div className="absolute bottom-4 right-4 bg-zinc-900/90 text-zinc-300 border border-zinc-700 text-[11px] font-medium px-3 py-1.5 rounded-xl">
                  محیط تاریک شده اما بازتاب‌های کورکننده آسفالت و شیشه خودرو همچنان دید را مختل می‌کند.
                </div>
              </div>
            )}

            {lensMode === 'polarized' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Visual Glass Edge Framing */}
                <div className="absolute inset-0 ring-4 ring-amber-500/30 rounded-2xl pointer-events-none" />
                <div className="absolute bottom-4 right-4 bg-zinc-950/90 text-amber-300 border border-amber-500/50 text-[11px] font-black px-3.5 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>۱۰۰٪ حذف بازتاب‌های نور + مسدودسازی کامل اشعه ماوراء بنفش (UV400)</span>
                </div>
              </div>
            )}
          </div>

          {/* Educational Comparison Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
            <div className="space-y-1">
              <span className="text-zinc-400 font-bold block">استاندارد UV400:</span>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                جلوگیری از عبور امواج فرابنفش تا طول موج ۴۰۰ نانومتر (UVA و UVB) برای محافظت از عدسی چشم.
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-zinc-400 font-bold block">فناوری پلاریزه (Polarized):</span>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                فیلتر عمودی امواج نوری که بازتاب‌های افقی آزاردهنده روی آسفالت، برف، آب و شیشه را کاملاً خنثی می‌کند.
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-amber-400 font-bold block">تضمین استوک جهانی:</span>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                کلیه عینک‌های موجود با دستگاه UV متر و تستر پلاریزه قبل از ارسال بررسی و با هاردکیس ارسال می‌شوند.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
