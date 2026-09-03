import React, { useState } from 'react';
import { CategoryType } from '../types';
import { 
  Filter, 
  SlidersHorizontal, 
  Search, 
  X, 
  Check, 
  Sparkles, 
  ArrowUpDown, 
  Flame, 
  Percent, 
  ShieldCheck, 
  RotateCcw,
  Glasses
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatToman } from '../utils/storage';
import { sound } from '../utils/audio';

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'discount';

export interface FilterState {
  category: CategoryType;
  search: string;
  sortBy: SortOption;
  minPrice: number;
  maxPrice: number;
  onlyInStock: boolean;
  onlyDiscounted: boolean;
  onlyPolarized: boolean;
  onlyUV400: boolean;
  gender: string;
  frameMaterial: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
  totalProductsCount: number;
  filteredProductsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  totalProductsCount,
  filteredProductsCount,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const activeFiltersCount = [
    filters.category !== 'all',
    filters.search !== '',
    filters.sortBy !== 'newest',
    filters.onlyInStock,
    filters.onlyDiscounted,
    filters.onlyPolarized,
    filters.onlyUV400,
    filters.gender !== 'all',
    filters.frameMaterial !== 'all',
    filters.minPrice > 0 || filters.maxPrice < 5000000,
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    sound.playRemove();
    onChange({
      category: 'all',
      search: '',
      sortBy: 'newest',
      minPrice: 0,
      maxPrice: 5000000,
      onlyInStock: false,
      onlyDiscounted: false,
      onlyPolarized: false,
      onlyUV400: false,
      gender: 'all',
      frameMaterial: 'all',
    });
  };

  return (
    <div className="bg-zinc-950/90 border border-zinc-800/80 rounded-3xl p-4 sm:p-5 shadow-xl space-y-4 text-right dir-rtl">
      
      {/* Top Main Row: Search, Category Quick Pills, Sort Dropdown & Advanced Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Input Box */}
        <div className="relative flex-1">
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="جستجوی مدل عینک، کد، جنس فریم (ری‌بن، گوچی، خلبانی، کائوچو...)"
            className="w-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 focus:border-amber-500 rounded-2xl py-2.5 pr-10 pl-10 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white absolute left-3 top-1/2 -translate-y-1/2 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={filters.sortBy}
              onChange={(e) => {
                sound.playPop();
                onChange({ ...filters, sortBy: e.target.value as SortOption });
              }}
              className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl px-3 py-2.5 text-xs text-zinc-200 font-medium focus:outline-none focus:border-amber-500 appearance-none pl-8 cursor-pointer"
            >
              <option value="newest">✨ جدیدترین کالکشن</option>
              <option value="popular">🔥 محبوب‌ترین و پرفروش</option>
              <option value="discount">🏷️ بیشترین تخفیف</option>
              <option value="price-asc">🔽 ارزان‌ترین قیمت</option>
              <option value="price-desc">🔼 گران‌ترین قیمت</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Advanced Filter Toggle Button */}
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              setIsAdvancedOpen(!isAdvancedOpen);
            }}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all border shrink-0 ${
              isAdvancedOpen || activeFiltersCount > 0
                ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border-zinc-800'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>فیلترهای پیشرفته</span>
            {activeFiltersCount > 0 && (
              <span className="bg-zinc-950 text-amber-400 w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Quick Category Tab Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'همه عینک‌ها' },
          { id: 'sunglasses', label: 'عینک آفتابی 🕶️' },
          { id: 'optical', label: 'عینک طبی 👓' },
          { id: 'sport', label: 'ورزشی و کوهنوردی 🚴' },
          { id: 'unisex', label: 'یونی‌سکس (اسپرت)' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              sound.playPop();
              onChange({ ...filters, category: cat.id as CategoryType });
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              filters.category === cat.id
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Quick Feature Toggles Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/60 text-xs">
        <button
          onClick={() => {
            sound.playPop();
            onChange({ ...filters, onlyInStock: !filters.onlyInStock });
          }}
          className={`px-3 py-1 rounded-xl font-medium transition-all border flex items-center gap-1.5 ${
            filters.onlyInStock
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-300'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${filters.onlyInStock ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          <span>فقط موجود در انبار</span>
        </button>

        <button
          onClick={() => {
            sound.playPop();
            onChange({ ...filters, onlyDiscounted: !filters.onlyDiscounted });
          }}
          className={`px-3 py-1 rounded-xl font-medium transition-all border flex items-center gap-1.5 ${
            filters.onlyDiscounted
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-300'
          }`}
        >
          <Percent className="w-3.5 h-3.5 text-rose-400" />
          <span>تخفیف‌دار و ویژه</span>
        </button>

        <button
          onClick={() => {
            sound.playPop();
            onChange({ ...filters, onlyPolarized: !filters.onlyPolarized });
          }}
          className={`px-3 py-1 rounded-xl font-medium transition-all border flex items-center gap-1.5 ${
            filters.onlyPolarized
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>عدسی پلاریزه (Polarized)</span>
        </button>

        <button
          onClick={() => {
            sound.playPop();
            onChange({ ...filters, onlyUV400: !filters.onlyUV400 });
          }}
          className={`px-3 py-1 rounded-xl font-medium transition-all border flex items-center gap-1.5 ${
            filters.onlyUV400
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-300'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>استاندارد UV400</span>
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={handleResetFilters}
            className="text-[11px] text-zinc-400 hover:text-rose-400 mr-auto flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>حذف همه فیلترها</span>
          </button>
        )}
      </div>

      {/* Expandable Advanced Filter Drawer */}
      <AnimatePresence>
        {isAdvancedOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pt-3 border-t border-zinc-800/80 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              
              {/* Gender Selector */}
              <div>
                <label className="block text-zinc-400 mb-1.5 font-bold">دسته‌بندی جنسیتی:</label>
                <select
                  value={filters.gender}
                  onChange={(e) => onChange({ ...filters, gender: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">همه مدل‌ها</option>
                  <option value="مردانه">مردانه</option>
                  <option value="زنانه">زنانه</option>
                  <option value="یونی‌سکس">یونی‌سکس / اسپرت</option>
                </select>
              </div>

              {/* Frame Material */}
              <div>
                <label className="block text-zinc-400 mb-1.5 font-bold">جنس و متریال فریم:</label>
                <select
                  value={filters.frameMaterial}
                  onChange={(e) => onChange({ ...filters, frameMaterial: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="all">همه متریال‌ها</option>
                  <option value="کائوچو">کائوچویی استات (Acetate)</option>
                  <option value="فلزی">فلزی و تیتانیوم</option>
                  <option value="ترکیبی">ترکیب فلز و استات</option>
                  <option value="TR90">پلیمری سبک و نشکن TR90</option>
                </select>
              </div>

              {/* Price Range Slider */}
              <div>
                <div className="flex justify-between text-zinc-400 mb-1.5 font-bold">
                  <span>سقف قیمت:</span>
                  <span className="font-mono text-amber-400">{formatToman(filters.maxPrice)}</span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="5000000"
                  step="100000"
                  value={filters.maxPrice}
                  onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
                  className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count Footnote */}
      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
        <span>نمایش {filteredProductsCount} از {totalProductsCount} عینک استوک</span>
        {activeFiltersCount > 0 && (
          <span className="text-amber-400 font-medium">فیلترهای انتخابی اعمال شده‌اند</span>
        )}
      </div>

    </div>
  );
};
