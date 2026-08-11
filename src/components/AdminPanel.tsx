import React, { useState } from 'react';
import { Product, Order, StoreSettings, OrderStatus, CategoryType, CategoryItem, CouponCode } from '../types';
import { formatToman, fileToBase64, DEMO_PRODUCTS, exportBackupData, importBackupData, DEFAULT_CATEGORIES, DEFAULT_COUPONS, testTelegramNotification } from '../utils/storage';
import { getSupabaseCredentials, SUPABASE_SQL_SCRIPT, resetSupabaseClient } from '../lib/supabase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  Glasses, 
  ShoppingBag, 
  Copy, 
  Check, 
  Search, 
  X, 
  Upload, 
  Download,
  ShieldCheck, 
  Store, 
  Settings, 
  CheckCircle2, 
  Clock, 
  Truck, 
  Package, 
  Sparkles,
  RefreshCw,
  Phone,
  Instagram,
  Send,
  Eye,
  TrendingUp,
  BarChart3,
  Printer,
  MessageSquare,
  Database,
  Globe,
  ExternalLink,
  Tag,
  Percent,
  Award
} from 'lucide-react';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import { motion, AnimatePresence } from 'motion/react';
import { ImageLazyLoader } from './ImageLazyLoader';

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  settings: StoreSettings;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, postalTrackingCode?: string, adminNote?: string) => void;
  onDeleteOrder?: (orderId: string) => void;
  onSaveSettings: (settings: StoreSettings) => void;
  onShowToast: (msg: string) => void;
  onLoadDemoProducts?: () => void;
  onOpenInvoice?: (order: Order) => void;
  onRefreshData?: () => Promise<void> | void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  orders,
  settings,
  onSaveProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSaveSettings,
  onShowToast,
  onLoadDemoProducts,
  onOpenInvoice,
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings' | 'analytics' | 'coupons' | 'seo'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (onRefreshData) {
        await onRefreshData();
      }
      onShowToast('اطلاعات و سفارشات جدید با موفقیت همگام‌سازی شدند');
    } catch (e) {
      onShowToast('خطا در به‌روزرسانی اطلاعات');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // Top Sold Glasses Calculation for Recharts
  const topSoldProductsData = React.useMemo(() => {
    const productStats: { [id: string]: { id: string; title: string; code: string; frameType: string; soldCount: number; totalRevenue: number } } = {};

    (orders || []).forEach((order) => {
      if (!order || order.status === 'cancelled') return;
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item) => {
        if (!item || !item.product || !item.product.id) return;
        const pId = item.product.id;
        const rawTitle = item.product.title || 'عینک';
        if (!productStats[pId]) {
          productStats[pId] = {
            id: pId,
            title: rawTitle.length > 20 ? rawTitle.slice(0, 20) + '...' : rawTitle,
            code: item.product.code || 'STK',
            frameType: item.product.frameType || 'سایر',
            soldCount: 0,
            totalRevenue: 0,
          };
        }
        productStats[pId].soldCount += Number(item.quantity) || 1;
        productStats[pId].totalRevenue += (Number(item.product.price) || 0) * (Number(item.quantity) || 1);
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.soldCount - a.soldCount)
      .slice(0, 8);
  }, [orders]);

  // Sales by Frame Type for Recharts Pie Chart
  const frameTypeDistributionData = React.useMemo(() => {
    const typeMap: { [key: string]: number } = {};
    (orders || []).forEach((order) => {
      if (!order || order.status === 'cancelled') return;
      const items = Array.isArray(order.items) ? order.items : [];
      items.forEach((item) => {
        if (!item || !item.product) return;
        const type = item.product.frameType || 'سایر فریم‌ها';
        typeMap[type] = (typeMap[type] || 0) + (Number(item.quantity) || 1);
      });
    });

    const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#64748b'];

    return Object.entries(typeMap).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    }));
  }, [orders]);

  // Monthly Sales Calculations
  const monthlySalesData = React.useMemo(() => {
    const monthlyMap: { [key: string]: { monthName: string; totalRevenue: number; count: number } } = {};
    const persianMonths = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];

    (orders || []).forEach((order) => {
      if (!order || order.status === 'cancelled') return;
      const createdAt = order.createdAt || new Date().toISOString();
      const d = new Date(createdAt);
      if (isNaN(d.getTime())) return;

      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthIndex = (d.getMonth() + 3) % 12; // Persian month approximation
      const label = `${persianMonths[monthIndex]} ${d.getFullYear()}`;

      if (!monthlyMap[yearMonth]) {
        monthlyMap[yearMonth] = {
          monthName: label,
          totalRevenue: 0,
          count: 0,
        };
      }
      monthlyMap[yearMonth].totalRevenue += Number(order.finalAmount || order.totalAmount) || 0;
      monthlyMap[yearMonth].count += 1;
    });

    return Object.entries(monthlyMap)
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [orders]);

  // Tracking codes & notes state per order
  const [trackingCodesMap, setTrackingCodesMap] = useState<{ [id: string]: string }>({});
  const [adminNotesMap, setAdminNotesMap] = useState<{ [id: string]: string }>({});

  // Add / Edit Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingReceiptUrl, setViewingReceiptUrl] = useState<string | null>(null);

  // Form Fields for Product Modal
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState<string>('sunglasses');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(0);
  const [formFrameType, setFormFrameType] = useState('کائوچویی');
  const [formLensColor, setFormLensColor] = useState('دودی (UV400)');
  const [formUvProtection, setFormUvProtection] = useState('UV400 + Polarized');
  const [formGender, setFormGender] = useState<'مردانه' | 'زنانه' | 'اسپرت (یونی‌سکس)'>('اسپرت (یونی‌سکس)');
  const [formDescription, setFormDescription] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formStock, setFormStock] = useState<number>(5);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');

  // Settings local state
  const [tempSettings, setTempSettings] = useState<StoreSettings>({ ...settings });
  const [copiedType, setCopiedType] = useState<'store' | 'admin' | null>(null);

  // Supabase state
  const initialSb = getSupabaseCredentials();
  const [supabaseUrlInput, setSupabaseUrlInput] = useState(initialSb.url);
  const [supabaseKeyInput, setSupabaseKeyInput] = useState(initialSb.key);
  const [sqlCopied, setSqlCopied] = useState(false);


  // Coupon management state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPercent, setNewCouponPercent] = useState<number>(10);
  const [newCouponMinAmount, setNewCouponMinAmount] = useState<number>(500000);

  const activeCoupons = tempSettings.coupons || DEFAULT_COUPONS;

  const handleAddCoupon = () => {
    if (!newCouponCode.trim()) {
      onShowToast('لطفاً کد تخفیف را وارد کنید');
      return;
    }
    const cleanCode = newCouponCode.trim().toUpperCase();
    if (activeCoupons.some((c) => c.code.toUpperCase() === cleanCode)) {
      onShowToast('این کد تخفیف قبلاً تعریف شده است');
      return;
    }

    const newCoupon: CouponCode = {
      id: `coupon-${Date.now()}`,
      code: cleanCode,
      discountPercent: Number(newCouponPercent),
      minOrderAmount: Number(newCouponMinAmount),
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updatedCoupons = [...activeCoupons, newCoupon];
    const updatedSettings = { ...tempSettings, coupons: updatedCoupons };
    setTempSettings(updatedSettings);
    onSaveSettings(updatedSettings);

    setNewCouponCode('');
    onShowToast(`کد تخفیف «${cleanCode}» با موفقیت اضافه شد`);
  };

  const handleToggleCouponStatus = (id: string) => {
    const updatedCoupons = activeCoupons.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    const updatedSettings = { ...tempSettings, coupons: updatedCoupons };
    setTempSettings(updatedSettings);
    onSaveSettings(updatedSettings);
    onShowToast('وضعیت کد تخفیف تغییر یافت');
  };

  const handleDeleteCoupon = (id: string) => {
    const updatedCoupons = activeCoupons.filter((c) => c.id !== id);
    const updatedSettings = { ...tempSettings, coupons: updatedCoupons };
    setTempSettings(updatedSettings);
    onSaveSettings(updatedSettings);
    onShowToast('کد تخفیف حذف شد');
  };
  // Category management state
  const [newCatLabel, setNewCatLabel] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatLabel, setEditingCatLabel] = useState('');

  const activeCategories = tempSettings.categories && tempSettings.categories.length > 0
    ? tempSettings.categories
    : DEFAULT_CATEGORIES;

  const handleAddCategory = () => {
    if (!newCatLabel.trim()) return;
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      label: newCatLabel.trim(),
    };
    const updated = [...activeCategories, newCat];
    setTempSettings({
      ...tempSettings,
      categories: updated,
    });
    setNewCatLabel('');
    onShowToast(`دسته‌بندی «${newCat.label}» اضافه شد`);
  };

  const handleUpdateCategory = (id: string, label: string) => {
    if (!label.trim()) return;
    const updated = activeCategories.map((c) => (c.id === id ? { ...c, label: label.trim() } : c));
    setTempSettings({
      ...tempSettings,
      categories: updated,
    });
    setEditingCatId(null);
    onShowToast('نام دسته‌بندی به‌روزرسانی شد');
  };

  const handleDeleteCategory = (id: string, label: string) => {
    if (activeCategories.length <= 1) {
      onShowToast('حداقل یک دسته‌بندی باید در فروشگاه باقی بماند');
      return;
    }
    const updated = activeCategories.filter((c) => c.id !== id);
    setTempSettings({
      ...tempSettings,
      categories: updated,
    });
    onShowToast(`دسته‌بندی «${label}» حذف شد`);
  };

  // Stats Calculations
  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.finalAmount, 0);

  const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;

  // Open modal to create brand new product
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormTitle('');
    setFormCode(`STK-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory('sunglasses');
    setFormPrice(0);
    setFormOriginalPrice(0);
    setFormFrameType('کائوچویی استوک');
    setFormLensColor('دودی');
    setFormUvProtection('UV400');
    setFormGender('اسپرت (یونی‌سکس)');
    setFormDescription('');
    setFormFeatures('عدسی با کیفیت، فریم مقاوم، همراه هارد کیس');
    setFormStock(3);
    setFormImages([]);
    setImageUrlInput('');
    setIsModalOpen(true);
  };

  // Open modal to edit existing product
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormTitle(prod.title);
    setFormCode(prod.code || '');
    setFormCategory(prod.category);
    setFormPrice(prod.price);
    setFormOriginalPrice(prod.originalPrice || 0);
    setFormFrameType(prod.frameType || '');
    setFormLensColor(prod.lensColor || '');
    setFormUvProtection(prod.uvProtection || '');
    setFormGender(prod.gender || 'اسپرت (یونی‌سکس)');
    setFormDescription(prod.description || '');
    setFormFeatures(prod.features ? prod.features.join('، ') : '');
    setFormStock(prod.stock);
    setFormImages(prod.images || []);
    setImageUrlInput('');
    setIsModalOpen(true);
  };

  // Upload image from file input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        try {
          const base64 = await fileToBase64(files[i]);
          newImages.push(base64);
        } catch (err) {
          console.error('Error uploading file:', err);
        }
      }
      setFormImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setFormImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onShowToast('لطفاً عنوان عینک را وارد کنید');
      return;
    }

    const featureList = formFeatures
      .split('،')
      .flatMap((f) => f.split(','))
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const productData: Product = {
      id: editingProduct ? editingProduct.id : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: formTitle,
      code: formCode || 'STK-100',
      category: formCategory,
      price: Number(formPrice),
      originalPrice: formOriginalPrice > 0 ? Number(formOriginalPrice) : undefined,
      frameType: formFrameType,
      lensColor: formLensColor,
      uvProtection: formUvProtection,
      gender: formGender,
      images: formImages,
      description: formDescription,
      features: featureList,
      stock: Number(formStock),
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
    };

    onSaveProduct(productData);
    setIsModalOpen(false);
    onShowToast(editingProduct ? 'عینک با موفقیت ویرایش شد' : 'عینک جدید به ویترین اضافه شد');
  };

  const copyUrl = (type: 'store' | 'admin') => {
    const origin = window.location.origin + window.location.pathname;
    const url = `${origin}?view=${type}`;
    navigator.clipboard.writeText(url);
    setCopiedType(type);
    onShowToast(type === 'store' ? 'لینک عمومی فروشگاه کپی شد' : 'لینک پنل مدیریت کپی شد');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.title.includes(searchQuery) ||
      p.code.includes(searchQuery) ||
      p.frameType?.includes(searchQuery)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-right dir-rtl">
      
      {/* Top Banner & Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">کل عینک‌ها در ویترین</span>
            <span className="text-2xl font-black text-white">{products.length} عدد</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Glasses className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">سفارشات جدید (در انتظار)</span>
            <span className="text-2xl font-black text-amber-400">{pendingOrdersCount} سفارش</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <Clock className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">کل سفارشات ثبت شده</span>
            <span className="text-2xl font-black text-white">{orders.length} سفارش</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 block">درآمد کل فروش</span>
            <span className="text-lg font-black text-emerald-400">{formatToman(totalRevenue)}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Sparkles className="w-6 h-6 stroke-[1.8]" />
          </div>
        </div>
      </div>

      {/* Share / Copy Links Quick Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">مدیریت لینک‌های اختصاصی فروشگاه stock_jahani</h3>
            <p className="text-xs text-zinc-400">
              لینک عمومی را به مشتریان بدهید تا عینک‌ها را ببینند و سفارش ثبت کنند.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={() => copyUrl('store')}
            className="flex-1 md:flex-none bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {copiedType === 'store' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>کپی لینک عمومی مشتریان</span>
          </button>

          <button
            onClick={() => copyUrl('admin')}
            className="flex-1 md:flex-none bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            {copiedType === 'admin' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>کپی لینک پنل مدیریت</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs Navigation */}
      <div className="flex items-center border-b border-zinc-800 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Glasses className="w-4 h-4" />
          <span>مدیریت عینک‌ها ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap relative ${
            activeTab === 'orders'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>مدیریت سفارشات ({orders.length})</span>
          {pendingOrdersCount > 0 && (
            <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
              {pendingOrdersCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-400" />
          <span>آمار فروش و محصولات پرفروش</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'coupons'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Tag className="w-4 h-4 text-emerald-400" />
          <span>کدهای تخفیف ({activeCoupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'seo'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-400" />
          <span>ابزارهای وب‌مستر و سئو (SEO)</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>تنظیمات فروشگاه</span>
        </button>

        <div className="mr-auto pb-2 shrink-0">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="به‌روزرسانی و دریافت آخرین سفارشات ثبت‌شده از سایر گوشی‌ها"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی سفارشات</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
            <div className="relative w-full sm:w-80">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو در عینک‌ها بر اساس نام یا کد..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-10 pl-4 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onLoadDemoProducts && products.length === 0 && (
                <button
                  onClick={onLoadDemoProducts}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>بارگذاری چند نمونه تست</span>
                </button>
              )}

              <button
                onClick={handleOpenAddModal}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>افزودن عینک جدید</span>
              </button>
            </div>
          </div>

          {/* Empty State when no products exist */}
          {filteredProducts.length === 0 ? (
            <div className="bg-zinc-900/40 border-2 border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-4 my-6">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 text-amber-400 flex items-center justify-center mx-auto">
                <Glasses className="w-8 h-8 stroke-[1.5]" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-base font-bold text-white">هنوز عینک ثبت نشده است</h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  ویترین شما آماده است! بر روی دکمه «افزودن عینک جدید» کلیک کنید و عکس‌ها، قیمت و مشخصات عینک‌های خود را وارد نمایید.
                </p>
              </div>
              <button
                onClick={handleOpenAddModal}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 transition-all shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن اولین عینک</span>
              </button>
            </div>
          ) : (
            /* Products Table / Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 relative group"
                >
                  <div className="aspect-[4/3] rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden relative flex items-center justify-center">
                    {prod.images && prod.images[0] ? (
                      <ImageLazyLoader src={prod.images[0]} alt={prod.title} className="w-full h-full" />
                    ) : (
                      <Glasses className="w-8 h-8 text-zinc-700" />
                    )}
                    <span className="absolute top-2 right-2 bg-zinc-900/90 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                      {prod.code}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white truncate">{prod.title}</h4>
                    <div className="text-[11px] text-zinc-400 flex items-center justify-between">
                      <span>{prod.frameType || 'عینک استوک'}</span>
                      <span className="text-amber-400 font-bold">{formatToman(prod.price)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-zinc-500 text-[10px]">موجودی: {prod.stock} عدد</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 p-1.5 rounded-lg transition-colors"
                        title="ویرایش عینک"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('آیا از حذف این عینک مطمئن هستید؟')) {
                            onDeleteProduct(prod.id);
                          }
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 text-rose-400 p-1.5 rounded-lg transition-colors"
                        title="حذف عینک"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900/60 p-3.5 rounded-2xl border border-zinc-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>لیست سفارشات ثبت شده ({orders.length})</span>
            </h3>
          </div>

          {orders.length === 0 ? (
            <div className="bg-zinc-900/40 border-2 border-dashed border-zinc-800 rounded-2xl p-10 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-sm font-bold text-zinc-300">هنوز سفارشی ثبت نشده است</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(orders || []).map((ord) => {
                if (!ord) return null;
                const cust = ord.customer || ({} as any);
                const itemsList = Array.isArray(ord.items) ? ord.items : [];
                const orderCodeStr = ord.orderCode || ord.id || 'کد_نامشخص';
                const createdDateStr = ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('fa-IR') : 'نامشخص';
                const custName = cust.fullName || 'مشتری (بی‌نام)';
                const custPhone = cust.phone || 'ثبت نشده';
                const custAddr = `${cust.province || ''} ${cust.city || ''} ${cust.address || ''}`.trim() || 'ثبت نشده';

                return (
                  <div
                    key={ord.id || Math.random()}
                    className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-3 text-xs"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-extrabold text-amber-400 text-sm bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                          {orderCodeStr}
                        </span>
                        <span className="text-zinc-400">
                          ثبت: {createdDateStr}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-zinc-400">وضعیت سفارش:</span>
                        <select
                          value={ord.status || 'pending'}
                          onChange={(e) => {
                            onUpdateOrderStatus(ord.id, e.target.value as OrderStatus);
                            onShowToast('وضعیت سفارش بروزرسانی شد');
                          }}
                          className="bg-zinc-950 border border-zinc-800 text-amber-400 font-bold px-3 py-1 rounded-xl text-xs focus:outline-none"
                        >
                          <option value="pending">در انتظار تایید</option>
                          <option value="confirmed">تایید شده</option>
                          <option value="shipping">در حال ارسال (پست)</option>
                          <option value="delivered">تحویل داده شده</option>
                          <option value="cancelled">لغو شده</option>
                        </select>
                      </div>
                    </div>

                    {/* Customer Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/60">
                      <div>
                        <span className="text-zinc-500 block">خریدار:</span>
                        <span className="font-bold text-white">{custName}</span>
                      </div>

                      <div>
                        <span className="text-zinc-500 block">شماره تماس:</span>
                        <span className="font-mono text-amber-400 font-bold dir-ltr">{custPhone}</span>
                      </div>

                      <div>
                        <span className="text-zinc-500 block">آدرس ارسال:</span>
                        <span className="text-zinc-300 leading-snug">{custAddr}</span>
                      </div>
                    </div>

                    {/* Items Ordered List */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-zinc-400 font-bold">اقلام خریداری شده:</span>
                      <div className="flex flex-wrap gap-2">
                        {itemsList.map((it, idx) => {
                          if (!it) return null;
                          const pTitle = it.product?.title || 'عینک';
                          return (
                            <span
                              key={idx}
                              className="bg-zinc-950 text-zinc-300 px-2.5 py-1 rounded-lg border border-zinc-800 text-[11px] flex items-center gap-1.5"
                            >
                              <Glasses className="w-3.5 h-3.5 text-amber-400" />
                              <span>{pTitle}</span>
                              <span className="text-amber-400 font-bold">({it.quantity || 1} عدد)</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Postal Tracking Code & Admin Note Input Section */}
                    <div className="bg-zinc-950 p-3.5 rounded-xl border border-amber-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <Truck className="w-4 h-4" />
                          <span>ثبت و ویرایش کد رهگیری پستی و پیام برای خریدار:</span>
                        </span>
                        {ord.postalTrackingCode && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono dir-ltr font-bold">
                            کد فعلی: {ord.postalTrackingCode}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">کد ۲۴ رقمی رهگیری پست پیشتاز:</label>
                          <input
                            type="text"
                            placeholder="مثلاً: 241234567890123456789012"
                            value={trackingCodesMap[ord.id] ?? ord.postalTrackingCode ?? ''}
                            onChange={(e) =>
                              setTrackingCodesMap({ ...trackingCodesMap, [ord.id]: e.target.value })
                            }
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-mono tracking-wider text-right dir-ltr focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">توضیحات اختصاصی برای خریدار (اختیاری):</label>
                          <input
                            type="text"
                            placeholder="مثلاً: مرسوله تحویل پست شد"
                            value={adminNotesMap[ord.id] ?? ord.adminNote ?? ''}
                            onChange={(e) =>
                              setAdminNotesMap({ ...adminNotesMap, [ord.id]: e.target.value })
                            }
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const code = trackingCodesMap[ord.id] ?? ord.postalTrackingCode ?? '';
                            const note = adminNotesMap[ord.id] ?? ord.adminNote ?? '';
                            if (!code) {
                              onShowToast('لطفاً کد ۲۴ رقمی پستی را وارد کنید');
                              return;
                            }
                            onUpdateOrderStatus(ord.id, 'shipping', code, note);
                            onShowToast('کد رهگیری پستی با موفقیت ثبت شد و وضعیت به "ارسال شده" تغییر کرد');
                          }}
                          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-colors"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>ثبت کد پستی و تغییر وضعیت به ارسال شده</span>
                        </button>
                      </div>
                    </div>

                    {/* Payment Info & Receipt Preview */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="text-zinc-400 text-xs">
                          <span>روش پرداخت: </span>
                          <span className="text-amber-400 font-bold">
                            {ord.paymentMethod === 'card_to_card' ? 'کارت به کارت' : ord.paymentMethod === 'online_gateway' ? 'درگاه آنلاین (زرین‌پال)' : 'پرداخت هنگام تحویل'}
                          </span>
                        </div>

                        {ord.paymentMethod === 'online_gateway' ? (
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-emerald-400 font-bold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>پرداخت آنلاین موفق شاپرک</span>
                            {ord.paymentRefId && (
                              <span className="font-mono text-[10px] text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded dir-ltr">
                                کد پیگیری: {ord.paymentRefId}
                              </span>
                            )}
                          </div>
                        ) : ord.paymentReceipt ? (
                          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
                            <img
                              src={ord.paymentReceipt}
                              alt="فیش واریزی"
                              className="w-7 h-7 rounded-lg object-cover cursor-pointer border border-zinc-700"
                              onClick={() => setViewingReceiptUrl(ord.paymentReceipt || null)}
                            />
                            <button
                              type="button"
                              onClick={() => setViewingReceiptUrl(ord.paymentReceipt || null)}
                              className="text-amber-400 font-bold text-[11px] hover:underline flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>مشاهده فیش واریزی</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-rose-400 text-[10px] bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                            فیش واریزی ارسال نشده
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                        {onOpenInvoice && (
                          <button
                            type="button"
                            onClick={() => onOpenInvoice(ord)}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>صدور فاکتور PDF</span>
                          </button>
                        )}

                        {ord.status === 'pending' && (
                          <button
                            onClick={() => {
                              onUpdateOrderStatus(ord.id, 'confirmed');
                              onShowToast('فیش واریزی تایید شد. برای اطلاع مشتری، پیامش رو از طریق تلگرام/تماس پیگیری کنید');
                            }}
                            className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تایید واریزی</span>
                          </button>
                        )}

                        {onDeleteOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`آیا از حذف سفارش ${orderCodeStr} مربوط به ${custName} اطمینان دارید؟`)) {
                                onDeleteOrder(ord.id);
                              }
                            }}
                            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                            title="حذف کامل این سفارش از لیست"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف سفارش</span>
                          </button>
                        )}

                        <div className="text-sm font-black text-amber-400 mr-2">
                          مبلغ کل: {formatToman(Number(ord.finalAmount || ord.totalAmount) || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB: MONTHLY SALES ANALYTICS & REPORT */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <span className="text-xs text-zinc-400 block">جمع کل درآمد ثبت شده</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {formatToman(orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.finalAmount || o.totalAmount), 0))}
              </span>
              <span className="text-[10px] text-zinc-500 block">سفارشات فعال و تایید شده</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <span className="text-xs text-zinc-400 block">تعداد کل سفارشات</span>
              <span className="text-xl font-black text-white font-mono">
                {orders.filter(o => o.status !== 'cancelled').length} عدد
              </span>
              <span className="text-[10px] text-emerald-400 block">
                {orders.filter(o => o.status === 'delivered' || o.status === 'shipping').length} ارسال شده به مشتری
              </span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <span className="text-xs text-zinc-400 block">میانگین مبلغ هر سبد خرید</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {orders.filter(o => o.status !== 'cancelled').length > 0
                  ? formatToman(
                      Math.round(
                        orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.finalAmount || o.totalAmount), 0) /
                          orders.filter(o => o.status !== 'cancelled').length
                      )
                    )
                  : '۰ تومان'}
              </span>
              <span className="text-[10px] text-zinc-500 block">میزان خریدهای هر مشتری</span>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl space-y-2">
              <span className="text-xs text-zinc-400 block">تعداد عینک‌های موجود</span>
              <span className="text-xl font-black text-white font-mono">
                {products.length} مدل
              </span>
              <span className="text-[10px] text-zinc-500 block">تنوع عینک در ویترین</span>
            </div>
          </div>

          {/* Monthly Sales Breakdown Table & Bars */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <span>گزارش تفکیکی فروش ماهانه</span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">آمار درآمد و تعداد سفارشات بر اساس ماه‌های سال</p>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ گزارش ماهانه</span>
              </button>
            </div>

            {monthlySalesData.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">هنوز داده فروش برای محاسبه ماه‌ها ثبت نشده است.</p>
            ) : (
              <div className="space-y-3">
                {monthlySalesData.map((data) => {
                  const maxRevenue = Math.max(...monthlySalesData.map(m => m.totalRevenue), 1);
                  const percentage = Math.round((data.totalRevenue / maxRevenue) * 100);

                  return (
                    <div key={data.key} className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">{data.monthName}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-zinc-400 font-mono">{data.count} سفارش</span>
                          <span className="font-black text-amber-400 font-mono text-sm">{formatToman(data.totalRevenue)}</span>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-l from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 5)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recharts Analytics Section: Top Sold Glasses & Frame Types */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            {/* Bar Chart: Most Sold Glasses */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div>
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    <span>پرفروش‌ترین عینک‌های ویترین (Recharts)</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5">بررسی تعداد فروش و تحلیل محبوب‌ترین مدل‌ها</p>
                </div>
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg font-bold">
                  تعداد فروش
                </span>
              </div>

              {topSoldProductsData.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  هنوز هیچ سفارشی برای تحلیل محصولات پرفروش ثبت نشده است.
                </div>
              ) : (
                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topSoldProductsData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis
                        dataKey="title"
                        stroke="#a1a1aa"
                        fontSize={10}
                        tickLine={false}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#3f3f46',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          textAlign: 'right'
                        }}
                        formatter={(value: any, name: any) => {
                          if (name === 'soldCount') return [`${value} عدد`, 'تعداد فروخته شده'];
                          return [formatToman(Number(value)), 'مجموع درآمد'];
                        }}
                        labelFormatter={(label, items) => {
                          const item = items?.[0]?.payload;
                          return item ? `${item.title} (کد: ${item.code})` : label;
                        }}
                      />
                      <Bar dataKey="soldCount" name="soldCount" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Pie Chart: Sales by Frame Type */}
            <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  <span>تفکیک جنس فریم عینک‌ها</span>
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">درصد محبوبیت جنس فریم‌ها (کائوچویی، فلزی و...)</p>
              </div>

              {frameTypeDistributionData.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  داده‌ای برای تفکیک فریم‌ها موجود نیست.
                </div>
              ) : (
                <div className="h-64 w-full flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={frameTypeDistributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {frameTypeDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#3f3f46',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                          textAlign: 'right'
                        }}
                        formatter={(val: any) => [`${val} عدد`, 'تعداد فروش']}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                    {frameTypeDistributionData.map((item) => (
                      <div key={item.name} className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                        <span>{item.name}:</span>
                        <span className="font-bold text-white">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: COUPONS & DISCOUNT CODES */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Tag className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">سیستم کدهای تخفیف و کوپن‌های درصدی</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  کدهای تخفیف را تعریف کنید تا خریداران هنگام ثبت سفارش در مرحله پرداخت استفاده نمایند.
                </p>
              </div>
            </div>
          </div>

          {/* Create New Coupon Box */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>ساخت کد تخفیف جدید</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">کد اختصاصی (انگلیسی) *</label>
                <input
                  type="text"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  placeholder="مثال: YALDA20 یا JAHANI10"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono uppercase dir-ltr text-right focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">درصد تخفیف (%) *</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newCouponPercent}
                  onChange={(e) => setNewCouponPercent(Number(e.target.value))}
                  placeholder="15"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">حداقل مبلغ سفارش (تومان)</label>
                <input
                  type="number"
                  value={newCouponMinAmount}
                  onChange={(e) => setNewCouponMinAmount(Number(e.target.value))}
                  placeholder="500000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={handleAddCoupon}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-colors shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>ایجاد و فعال‌سازی کد تخفیف</span>
            </button>
          </div>

          {/* Coupons List */}
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Percent className="w-4 h-4 text-amber-400" />
              <span>لیست کدهای تخفیف تعریف‌شده ({activeCoupons.length})</span>
            </h4>

            {activeCoupons.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">هنوز کد تخفیفی ایجاد نشده است.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 p-4 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                          {coupon.code}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          %{coupon.discountPercent} تخفیف
                        </span>
                      </div>

                      {coupon.minOrderAmount && coupon.minOrderAmount > 0 && (
                        <p className="text-[11px] text-zinc-400 mt-2">
                          مخصوص سفارش‌های بالای {formatToman(coupon.minOrderAmount)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleCouponStatus(coupon.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          coupon.isActive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                        }`}
                      >
                        {coupon.isActive ? 'فعال' : 'غیرفعال'}
                      </button>

                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="حذف کوپن"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: STORE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl max-w-2xl space-y-4">
          <h3 className="text-base font-bold text-white mb-2">مدیریت تمام متن‌ها و اطلاعات فروشگاه stock_jahani</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">نام فروشگاه</label>
              <input
                type="text"
                value={tempSettings.storeName}
                onChange={(e) => setTempSettings({ ...tempSettings, storeName: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">شعار هدر بالای سایت</label>
              <input
                type="text"
                value={tempSettings.tagline}
                onChange={(e) => setTempSettings({ ...tempSettings, tagline: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Site Announcement & Hero Section Texts */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>ویرایش متن‌های بنر اصلی و اعلان بالای فروشگاه</span>
            </h4>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">متن نوار متحرک بالای سایت (Announcement Bar)</label>
              <input
                type="text"
                value={tempSettings.bannerMessage || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, bannerMessage: e.target.value })}
                placeholder="✨ ارسال با پست پیشتاز به سراسر کشور..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">تیتر بزرگ بنر اصلی صفحه اول (Welcome Headline)</label>
              <input
                type="text"
                value={tempSettings.welcomeText || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, welcomeText: e.target.value })}
                placeholder="تجربه‌ای متفاوت از کیفیت و استایل با عینک استوک جهانی"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">توضیحات زیر تیتر اصلی (Welcome Subtext)</label>
              <textarea
                rows={2}
                value={tempSettings.welcomeSubtext || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, welcomeSubtext: e.target.value })}
                placeholder="مجموعه کامل عینک‌های آفتابی و طبی اورجینال..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">متن اطلاعیه ویژه خریداران (در بخش پیگیری سفارشات)</label>
              <textarea
                rows={2}
                value={tempSettings.noticeText || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, noticeText: e.target.value })}
                placeholder="💡 خریداران گرامی: پس از ثبت سفارش..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">متن درباره فروشگاه (aboutText) / فوتر</label>
              <textarea
                rows={2}
                value={tempSettings.aboutText || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, aboutText: e.target.value })}
                placeholder="فروشگاه عینک استوک جهانی عرضه کننده مستقیم..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">متن قوانین و شرایط ارسال (rulesText)</label>
              <textarea
                rows={2}
                value={tempSettings.rulesText || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, rulesText: e.target.value })}
                placeholder="تمامی بسته‌ها با پُست پیشتاز ارسال می‌شوند..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Category Management Section */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-amber-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                  <Glasses className="w-4 h-4 text-amber-400" />
                  <span>مدیریت دسته‌بندی‌های محصولات (عینک آفتابی، طبی، اسپرت و...)</span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1">
                  می‌توانید نام دسته‌بندی‌ها را ویرایش کنید، دسته‌بندی جدید اضافه کرده یا موارد دلخواه را حذف نمایید.
                </p>
              </div>
            </div>

            {/* Add New Category Form */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newCatLabel}
                onChange={(e) => setNewCatLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } }}
                placeholder="عنوان دسته‌بندی جدید (مثلا: عینک آفتابی، عینک طبی...)"
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-colors shrink-0 shadow-md"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>افزودن دسته‌بندی</span>
              </button>
            </div>

            {/* Categories List */}
            <div className="space-y-2 pt-1">
              <span className="text-xs text-zinc-400 block font-medium">دسته‌بندی‌های فعلی نمایش داده شده در منوی سایت:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-xl flex items-center justify-between gap-2"
                  >
                    {editingCatId === cat.id ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          value={editingCatLabel}
                          onChange={(e) => setEditingCatLabel(e.target.value)}
                          className="w-full bg-zinc-950 border border-amber-500/50 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateCategory(cat.id, editingCatLabel)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shrink-0"
                        >
                          ثبت
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCatId(null)}
                          className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded-lg text-xs shrink-0"
                        >
                          انصراف
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span className="text-xs font-bold text-white">{cat.label}</span>
                          <span className="text-[10px] text-zinc-500 font-mono dir-ltr">({cat.id})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCatId(cat.id);
                              setEditingCatLabel(cat.label);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded-lg transition-colors"
                            title="ویرایش نام"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id, cat.label)}
                            className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                            title="حذف دسته‌بندی"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span>🤖</span> تنظیمات ربات تلگرام (ارسال لحظه‌ای سفارشات و فیش واریزی)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">توکن ربات تلگرام (Bot Token)</label>
                <input
                  type="text"
                  value={tempSettings.telegramBotToken || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, telegramBotToken: e.target.value })}
                  placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-mono dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">چت آیدی گروه/کانال تلگرام (Chat ID)</label>
                <input
                  type="text"
                  value={tempSettings.telegramChatId || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, telegramChatId: e.target.value })}
                  placeholder="-1001234567890"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-emerald-400 font-mono dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">آدرس وب‌هوک / Cloudflare Worker (اختیاری)</label>
                <input
                  type="text"
                  value={tempSettings.telegramWebhookUrl || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, telegramWebhookUrl: e.target.value })}
                  placeholder="https://my-worker.subdomain.workers.dev"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-cyan-400 font-mono dir-ltr text-right"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-[11px] text-zinc-400 leading-relaxed flex-1">
                با وارد کردن توکن ربات و چت آیدی، سفارش‌های ثبت شده به همراه تصویر فیش واریزی و دکمه‌های شیشه‌ای «تایید» و «لغو» به گروه تلگرام یا وب‌هوک شما ارسال می‌شوند.
              </p>

              <button
                type="button"
                onClick={async () => {
                  onShowToast('در حال ارسال پیام تست به تلگرام / وب‌هوک Cloudflare...');
                  const result = await testTelegramNotification(tempSettings);
                  onShowToast(result.message);
                }}
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <span>⚡ تست اتصال ربات تلگرام / Cloudflare</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">آیدی تلگرام پشتیبانی</label>
              <input
                type="text"
                value={tempSettings.telegram || 'stock_jahani'}
                onChange={(e) => setTempSettings({ ...tempSettings, telegram: e.target.value })}
                placeholder="stock_jahani"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-mono dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">آیدی اینستاگرام</label>
              <input
                type="text"
                value={tempSettings.instagram}
                onChange={(e) => setTempSettings({ ...tempSettings, instagram: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">شماره تلفن تماس پشتیبانی</label>
              <input
                type="text"
                value={tempSettings.phone}
                onChange={(e) => setTempSettings({ ...tempSettings, phone: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono dir-ltr text-right"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">سقف خرید ارسال رایگان (تومان)</label>
              <input
                type="number"
                value={tempSettings.freeShippingThreshold}
                onChange={(e) => setTempSettings({ ...tempSettings, freeShippingThreshold: Number(e.target.value) })}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white"
              />
            </div>
          </div>

          {/* Card & Payment Settings Section */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-amber-500/30 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>اطلاعات حساب و کارت جهت واریز/پرداخت آنلاین مشتریان</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">شماره کارت ۱۶ رقمی</label>
                <input
                  type="text"
                  value={tempSettings.cardNumber || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, cardNumber: e.target.value })}
                  placeholder="6037-9975-1234-5678"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-mono tracking-wider dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">نام و نام خانوادگی صاحب حساب/کارت</label>
                <input
                  type="text"
                  value={tempSettings.cardHolderName || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, cardHolderName: e.target.value })}
                  placeholder="بهنام جهانی"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">نام بانک</label>
                <input
                  type="text"
                  value={tempSettings.bankName || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, bankName: e.target.value })}
                  placeholder="بانک ملی ایران"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">شماره حساب بانکی (اختیاری)</label>
                <input
                  type="text"
                  value={tempSettings.accountNumber || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, accountNumber: e.target.value })}
                  placeholder="0102030405006"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-mono dir-ltr text-right"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-300 mb-1">شماره شبا (IBAN - با IR)</label>
                <input
                  type="text"
                  value={tempSettings.shebaNumber || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, shebaNumber: e.target.value })}
                  placeholder="IR120170000000102030405006"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-amber-400 font-mono dir-ltr text-right"
                />
              </div>
            </div>

            {/* ZarinPal Gateway Settings */}
            <div className="border-t border-zinc-800 pt-3.5 space-y-2">
              <label className="block text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>کد مرچنت درگاه پرداخت آنلاین زرین‌پال (ZarinPal Merchant ID) - اختیاری</span>
              </label>
              <input
                type="text"
                value={tempSettings.zarinpalMerchantId || ''}
                onChange={(e) => setTempSettings({ ...tempSettings, zarinpalMerchantId: e.target.value.trim() })}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-emerald-300 font-mono dir-ltr text-left focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                در صورت وارد کردن کد مرچنت زرین‌پال، مشتریان می‌توانند مستقیماً از طریق درگاه پرداخت آنلاین شاپرک تسویه‌حساب نمایند. در صورت خالی بودن، سیستم پرداخت آنلاین شتابی را به‌صورت هوشمند همراه با کد پیگیری معتبر بانک ثبت خواهد کرد.
              </p>
            </div>
          </div>

          {/* Admin Security Passcode Section */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>رمز عبور اختصاصی پنل مدیریت</span>
            </h4>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">رمز عبور ورود به پنل مدیریت (پیش‌فرض: 1383)</label>
              <input
                type="text"
                value={tempSettings.adminPasscode || '1383'}
                onChange={(e) => setTempSettings({ ...tempSettings, adminPasscode: e.target.value })}
                placeholder="1383"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono dir-ltr text-right"
              />
            </div>
          </div>

          {/* Backup & Data Export / Restore Section */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Download className="w-4 h-4" />
              <span>پشتیبان‌گیری کامل از اطلاعات (محصولات، سفارشات، تصاویر)</span>
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              تمام تصاویر و عکس‌های آپلود شده به صورت مستقیم درون حافظه برنامه (Base64) ذخیره می‌شوند و به هیچ عنوان خراب یا حذف نخواهند شد. برای اطمینان می‌توانید فایل پشتیبان دیتابیس را دانلود نمایید.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const backupStr = exportBackupData();
                  const blob = new Blob([backupStr], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `stock-jahani-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  onShowToast('فایل پشتیبان کامل فروشگاه با موفقیت دانلود شد');
                }}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>دانلود نسخه پشتیبان کامل (JSON)</span>
              </button>

              <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-zinc-700">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>بازیابی اطلاعات از فایل پشتیبان</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const content = event.target?.result as string;
                      if (content && importBackupData(content)) {
                        onShowToast('اطلاعات با موفقیت بازیابی شد. صفحه را رفرش کنید.');
                        setTimeout(() => window.location.reload(), 1500);
                      } else {
                        onShowToast('فایل پشتیبان معتبر نمی‌باشد');
                      }
                    };
                    reader.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Explanation Box for Iran VPN & GitHub Pages deployment */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-200 leading-relaxed space-y-1">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>💡 دلیل نیاز به فیلترشکن در لینک پیش‌نمایش و راهکار اجرای بدون فیلترشکن:</span>
            </div>
            <p>
              <strong>۱. لینک پیش‌نمایش فعلی:</strong> دامنه این صفحه مربوط به سرور ابری Google Cloud Run (پسوند <code className="text-amber-300">*.run.app</code>) است که توسط اپراتورهای ایران (همراه اول، ایرانسل و...) فیلتر شده است؛ به همین دلیل باز کردن این محیط پیش‌نمایش نیاز به فیلترشکن دارد.
            </p>
            <p>
              <strong>۲. اجرای ۱۰۰٪ بدون فیلترشکن روی GitHub Pages:</strong> وقتی پروژه را روی GitHub Pages (دامنه <code className="text-emerald-300">*.github.io</code>) یا Vercel یا دامنه خودتان قرار دهید، سایت <strong>بدون نیاز به هیچ‌گونه فیلترشکنی روی تمام گوشی‌ها و اپراتورهای ایران باز می‌شود</strong> و اطلاعات محصولات و سفارشات را بدون فیلترشکن با Supabase همگام‌سازی می‌کند.
            </p>
          </div>

          {/* Supabase Integration Section for Unblocked GitHub Pages / Vercel deployment */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>دیتابیس آنلاین بدون تحریم سوپابیس (Supabase) برای GitHub Pages و گوشی‌ها</span>
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                supabaseUrlInput && supabaseKeyInput 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                  : 'bg-zinc-800 text-zinc-400'
              }`}>
                {supabaseUrlInput && supabaseKeyInput ? '⚡ فعال در سوپابیس' : 'غیرفعال (استفاده از حافظه داخلی)'}
              </span>
            </div>

            <p className="text-[11px] text-zinc-300 leading-relaxed">
              سوپابیس (Supabase) بر روی تمام اپراتورهای موبایل و اینترنت ایران (همراه اول، ایرانسل، مخابرات و...) <strong>بدون نیاز به فیلترشکن</strong> کاملاً باز است و با GitHub Pages و Vercel سازگار می‌باشد.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                  آدرس پروژه Supabase URL
                </label>
                <input
                  type="text"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value.trim())}
                  placeholder="https://xyz.supabase.co"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono dir-ltr text-left focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                  کلید عمومی Supabase Anon Key
                </label>
                <input
                  type="password"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value.trim())}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono dir-ltr text-left focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (!supabaseUrlInput || !supabaseKeyInput) {
                    onShowToast('لطفاً آدرس و کلید Anon Key سوپابیس را وارد کنید');
                    return;
                  }
                  localStorage.setItem('supabase_url', supabaseUrlInput);
                  localStorage.setItem('supabase_key', supabaseKeyInput);
                  resetSupabaseClient();
                  onShowToast('تنظیمات اتصال به سوپابیس ذخیره گردید. دیتابیس آنلاین فعال است!');
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ذخیره و فعال‌سازی اتصال سوپابیس</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
                  setSqlCopied(true);
                  onShowToast('کد اسکریپت ساخت جداول دیتابیس کپی شد!');
                  setTimeout(() => setSqlCopied(false), 2500);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                {sqlCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                <span>کپی کد SQL ساخت جداول سوپابیس</span>
              </button>

              {supabaseUrlInput && (
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('supabase_url');
                    localStorage.removeItem('supabase_key');
                    setSupabaseUrlInput('');
                    setSupabaseKeyInput('');
                    resetSupabaseClient();
                    onShowToast('اتصال سوپابیس حذف شد');
                  }}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  حذف تنظیمات
                </button>
              )}
            </div>

            <div className="bg-zinc-900/90 p-3 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <span className="font-bold text-amber-400 block">💡 راهنمای اتصال سریع به Supabase (رایگان):</span>
              <p>۱. در وب‌سایت <code className="text-emerald-400">supabase.com</code> یک پروژه جدید رایگان بسازید.</p>
              <p>۲. از بخش Project Settings &gt; API آدرس Project URL و کلید anon/public key را کپی و در کادرهای بالا وارد کنید.</p>
              <p>۳. از منوی سمت چپ به بخش SQL Editor بروید و دکمه «کپی کد SQL ساخت جداول» بالا را بزنید، کد کپی شده را آنجا Paste و دکمه Run را بزنید.</p>
            </div>
          </div>

          <button
            onClick={() => {
              onSaveSettings(tempSettings);
              if (supabaseUrlInput && supabaseKeyInput) {
                localStorage.setItem('supabase_url', supabaseUrlInput);
                localStorage.setItem('supabase_key', supabaseKeyInput);
                resetSupabaseClient();
              }
              onShowToast('تنظیمات فروشگاه و دیتابیس با موفقیت ذخیره شد');
            }}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg"
          >
            ذخیره تغییرات تنظیمات
          </button>

        </div>
      )}

      {/* SEO & WEBMASTER TOOLS TAB (Rank Math Style) */}
      {activeTab === 'seo' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-zinc-900 to-amber-950/20 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/30">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-white">پیشخوان سئو و ابزارهای وب‌مستر (Rank Math SEO)</h3>
                  <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-500/30">
                    فعال
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  تنظیمات کامل متاتگ‌ها، گوگل سرچ کنسول، نقشه سایت، robots.txt و فید موتورهای مقایسه قیمت (ترب و ایمالز)
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onSaveSettings(tempSettings);
                onShowToast('تنظیمات سئو و ابزارهای وب‌مستر با موفقیت ذخیره شد');
              }}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold px-4 py-2.5 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-1.5 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ذخیره کلی تنظیمات سئو</span>
            </button>
          </div>

          {/* Grid Layout for SEO Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Section 1: Titles & Meta Tags + Live Google Preview */}
            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-4">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Search className="w-4 h-4" />
                <span>عنوان‌ها و متاتگ‌های سئو (SEO Titles & Meta)</span>
              </h4>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">عنوان سئو برگه اصلی (SEO Title)</label>
                <input
                  type="text"
                  value={tempSettings.seoTitle || tempSettings.storeName}
                  onChange={(e) => setTempSettings({ ...tempSettings, seoTitle: e.target.value })}
                  placeholder="فروشگاه عینک استوک جهانی | عینک آفتابی و طبی اورجینال"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">توضیحات متای سئو (Meta Description)</label>
                <textarea
                  rows={3}
                  value={tempSettings.seoDescription || tempSettings.tagline}
                  onChange={(e) => setTempSettings({ ...tempSettings, seoDescription: e.target.value })}
                  placeholder="فروشگاه آنلاین عینک‌های استوک اورجینال، عینک آفتابی خلبانی، طبی کائوچویی و ورزشی ساخت اروپا با ضمانت و ارسال پستی..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">کلمات کلیدی اصلی (SEO Keywords)</label>
                <input
                  type="text"
                  value={tempSettings.seoKeywords || 'عینک استوک, عینک آفتابی, عینک طبی, عینک خلبانی, خرید عینک'}
                  onChange={(e) => setTempSettings({ ...tempSettings, seoKeywords: e.target.value })}
                  placeholder="عینک استوک, عینک آفتابی, عینک طبی, خرید آنلاین عینک"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Live Google Search Snippet Preview */}
              <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800/80 space-y-1.5">
                <span className="text-[10px] text-zinc-400 font-bold block">پیش‌نمایش در نتایج جستجوی گوگل (Google Snippet Preview):</span>
                <div className="font-sans text-right dir-rtl space-y-0.5 pt-1">
                  <div className="text-xs text-emerald-400 font-mono dir-ltr text-right truncate">
                    {window.location.origin}
                  </div>
                  <div className="text-sm font-bold text-blue-400 hover:underline cursor-pointer truncate">
                    {tempSettings.seoTitle || tempSettings.storeName || 'فروشگاه عینک استوک جهانی'}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-snug">
                    {tempSettings.seoDescription || tempSettings.tagline || 'خرید انواع عینک‌های آفتابی و طبی اورجینال با بهترین قیمت'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 2: Webmaster Tools Verification Tags */}
            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-4">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Award className="w-4 h-4" />
                <span>ابزارهای وب‌مستر (Google & Bing Verification)</span>
              </h4>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">کد تایید گوگل سرچ کنسول (Google Search Console)</label>
                <input
                  type="text"
                  value={tempSettings.googleSiteVerification || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, googleSiteVerification: e.target.value })}
                  placeholder="کد یا متاتگ google-site-verification..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono dir-ltr text-right focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-zinc-500 block mt-1">
                  کدی که در گوگل سرچ کنسول هنگام افزودن سایت دریافت می‌کنید را اینجا وارد کنید.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">کد تایید بینگ و یاندکس (Bing/Yandex Verification)</label>
                <input
                  type="text"
                  value={tempSettings.bingSiteVerification || ''}
                  onChange={(e) => setTempSettings({ ...tempSettings, bingSiteVerification: e.target.value })}
                  placeholder="کد tification بینگ یا یاندکس..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono dir-ltr text-right focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Analytics IDs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">گوگل آنالیتیکس (GA4 Measurement ID)</label>
                  <input
                    type="text"
                    value={tempSettings.googleAnalyticsId || ''}
                    onChange={(e) => setTempSettings({ ...tempSettings, googleAnalyticsId: e.target.value })}
                    placeholder="G-XXXXXXXXXX"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1">ماکروسافت کلاریتی (Microsoft Clarity ID)</label>
                  <input
                    type="text"
                    value={tempSettings.clarityProjectId || ''}
                    onChange={(e) => setTempSettings({ ...tempSettings, clarityProjectId: e.target.value })}
                    placeholder="کد پروژه clarity..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono dir-ltr text-right"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: XML Sitemap & Robots.txt Editor */}
            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-4">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Globe className="w-4 h-4" />
                <span>نقشه سایت و ویرایش robots.txt</span>
              </h4>

              <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">نقشه سایت آنلاین (XML Sitemap)</span>
                  <span className="text-[10px] text-zinc-400 font-mono dir-ltr block text-right">/sitemap.xml</span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`${window.location.origin}/sitemap.xml`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <span>مشاهده</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/sitemap.xml`);
                      onShowToast('لینک نقشه سایت برای گوگل کپی شد');
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-1.5 rounded-lg transition-colors"
                    title="کپی آدرس sitemap.xml"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">ویرایش فایل robots.txt</label>
                <textarea
                  rows={4}
                  value={
                    tempSettings.robotsTxtContent !== undefined
                      ? tempSettings.robotsTxtContent
                      : `User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${window.location.origin}/sitemap.xml`
                  }
                  onChange={(e) => setTempSettings({ ...tempSettings, robotsTxtContent: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 font-mono dir-ltr focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Section 4: Price Comparison Engines (Torob & Emalls) */}
            <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl space-y-4">
              <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2 border-b border-zinc-800 pb-2">
                <Sparkles className="w-4 h-4" />
                <span>اتصال به موتورهای ترب (Torob) و ایمالز (Emalls)</span>
              </h4>

              <div className="space-y-3">
                {/* Torob Feed */}
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-rose-400 block">فید اختصاصی محصولات برای ترب (Torob Feed)</span>
                    <span className="text-[10px] text-zinc-400 font-mono dir-ltr block text-right">/api/feed/torob</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/feed/torob`);
                      onShowToast('لینک فید ترب کپی شد');
                    }}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی فید ترب</span>
                  </button>
                </div>

                {/* Emalls Feed */}
                <div className="bg-zinc-900 p-3 rounded-xl border border-zinc-800 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-amber-400 block">فید اختصاصی محصولات برای ایمالز (Emalls Feed)</span>
                    <span className="text-[10px] text-zinc-400 font-mono dir-ltr block text-right">/api/feed/emalls</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/feed/emalls`);
                      onShowToast('لینک فید ایمالز کپی شد');
                    }}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>کپی فید ایمالز</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/60 text-[11px] text-zinc-400 space-y-1">
                <span className="font-bold text-amber-400 block">💡 راهنمای اتصال به ترب و ایمالز:</span>
                <p>در پنل فروشندگان ترب یا ایمالز ثبت‌نام کنید و لینک‌های فید بالا را در بخش «لینک دریافت خودکار محصولات» قرار دهید تا تمام عینک‌های شما خودکار در ترب نمایش داده شوند.</p>
              </div>
            </div>

          </div>

          <button
            onClick={() => {
              onSaveSettings(tempSettings);
              onShowToast('تنظیمات سئو و ابزارهای وب‌مستر با موفقیت ذخیره شد');
            }}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>ذخیره کلیه تنظیمات سئو و وب‌مستر</span>
          </button>
        </div>
      )}

      {/* ADD / EDIT EYEWEAR PRODUCT MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl overflow-hidden my-auto text-right"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Glasses className="w-5 h-5 text-amber-400" />
                  <span>{editingProduct ? 'ویرایش مشخصات عینک' : 'افزودن عینک جدید به ویترین'}</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProductSubmit} className="space-y-4">
                {/* Title & Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-zinc-300 mb-1">عنوان کامل عینک *</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="مثال: عینک آفتابی ری‌بن فریم خلبانی"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">کد محصول</label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="STK-101"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono dir-ltr text-right focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Category & Prices */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">دسته‌بندی</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      {activeCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">قیمت فروش (تومان) *</label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      placeholder="1850000"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">قیمت اصلی/قبل تخفیف</label>
                    <input
                      type="number"
                      value={formOriginalPrice}
                      onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                      placeholder="اختیاری"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Specs: Frame Type, Lens Color, Protection, Gender */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">جنس/نوع فریم</label>
                    <input
                      type="text"
                      value={formFrameType}
                      onChange={(e) => setFormFrameType(e.target.value)}
                      placeholder="کائوچویی، فلزی..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">رنگ عدسی</label>
                    <input
                      type="text"
                      value={formLensColor}
                      onChange={(e) => setFormLensColor(e.target.value)}
                      placeholder="دودی، قهوه‌ای..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">سطح محافظت</label>
                    <input
                      type="text"
                      value={formUvProtection}
                      onChange={(e) => setFormUvProtection(e.target.value)}
                      placeholder="UV400"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">موجودی انبار</label>
                    <input
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Description & Features */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">توضیحات عینک</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="توضیحات درباره کیفیت، اصالت، ویژگی‌ها..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                {/* Image Upload Area */}
                <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl space-y-3">
                  <label className="block text-xs font-bold text-amber-400">تصاویر عینک (آپلود عکس از سیستم یا لینک):</label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <label className="w-full sm:w-auto cursor-pointer bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>انتخاب عکس از حافظه گوشی/کامپیوتر</span>
                      <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <div className="flex items-center gap-2 flex-1 w-full">
                      <input
                        type="url"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="یا جایگذاری لینک اینترنتی عکس..."
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono dir-ltr text-right"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 rounded-xl text-xs font-bold shrink-0"
                      >
                        افزودن لینک
                      </button>
                    </div>
                  </div>

                  {/* Uploaded Images Thumbnails */}
                  {formImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formImages.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-zinc-700 group">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute inset-0 bg-black/60 text-rose-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl text-xs shadow-lg transition-colors"
                >
                  ذخیره و انتشار عینک
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* FULL RESOLUTION RECEIPT VIEWER MODAL */}
      <AnimatePresence>
        {viewingReceiptUrl && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 max-w-lg w-full max-h-[90vh] flex flex-col items-center gap-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between w-full border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>تصویر کامل فیش واریزی واریز شده</span>
                </span>
                <button
                  onClick={() => setViewingReceiptUrl(null)}
                  className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 w-full overflow-auto rounded-xl bg-zinc-950 p-2 flex items-center justify-center">
                <img
                  src={viewingReceiptUrl}
                  alt="تصویر بزرگ فیش واریزی"
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>

              <button
                onClick={() => setViewingReceiptUrl(null)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                بستن پنجره
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
