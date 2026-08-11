import React, { useState, useEffect } from 'react';
import { Order, OrderCustomer, StoreSettings } from '../types';
import { formatToman } from '../utils/storage';
import { 
  X, 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ExternalLink, 
  User, 
  Phone, 
  MapPin, 
  Glasses, 
  ShieldCheck,
  AlertCircle,
  LogOut,
  Edit3,
  Save,
  Printer,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerOrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  settings?: StoreSettings;
  onUpdateOrderCustomer?: (orderId: string, updatedCustomer: OrderCustomer) => void;
  onOpenInvoice?: (order: Order) => void;
}

export const CustomerOrderTrackerModal: React.FC<CustomerOrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
  settings,
  onUpdateOrderCustomer,
  onOpenInvoice,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Editing Customer details state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<OrderCustomer>({
    fullName: '',
    phone: '',
    province: '',
    city: '',
    address: '',
    postalCode: '',
    notes: '',
  });
  const [editFormError, setEditFormError] = useState('');

  // Load remembered phone from localStorage on open
  useEffect(() => {
    if (isOpen) {
      const savedPhone = localStorage.getItem('customer_tracker_phone');
      if (savedPhone) {
        setActivePhone(savedPhone);
        setSearchInput(savedPhone);
      }
    }
  }, [isOpen]);

  // Standardize digits (convert Persian numbers to English for searching)
  const normalizeDigits = (str: string) => {
    return str
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .trim();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = normalizeDigits(searchInput);
    if (!query || query.length < 3) {
      setErrorMsg('لطفاً شماره موبایل یا کد سفارش (مثلاً SJ-1234) را وارد کنید');
      return;
    }

    setErrorMsg('');
    setActivePhone(query);
    localStorage.setItem('customer_tracker_phone', query);
  };

  const handleLogoutPhone = () => {
    setActivePhone(null);
    setSearchInput('');
    localStorage.removeItem('customer_tracker_phone');
  };

  // Filter orders matching search input or active phone
  const matchedOrders = activePhone
    ? orders.filter((o) => {
        if (!o) return false;
        const query = normalizeDigits(activePhone).toLowerCase();
        const phoneNorm = normalizeDigits(o.customer?.phone || '').toLowerCase();
        const codeNorm = (o.orderCode || '').toLowerCase();
        const idNorm = (o.id || '').toLowerCase();
        return (
          phoneNorm.includes(query) ||
          codeNorm.includes(query) ||
          idNorm.includes(query)
        );
      })
    : [];

  const copyPostalCode = (code: string, orderId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(orderId);
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>در انتظار بررسی و تأیید واریز</span>
          </span>
        );
      case 'confirmed':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>تأیید شده - در حال آماده‌سازی</span>
          </span>
        );
      case 'shipping':
        return (
          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
            <Truck className="w-3.5 h-3.5" />
            <span>ارسال شده با پست پیشتاز</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            <span>تحویل داده شده</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>لغو شده</span>
          </span>
        );
      default:
        return null;
    }
  };

  const customerName = matchedOrders.length > 0 ? (matchedOrders[0].customer?.fullName || 'خریدار') : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto text-right dir-rtl"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl overflow-hidden my-auto space-y-5"
          >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Truck className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {customerName ? `ورود خریدار: ${customerName}` : 'پیگیری سفارشات و دریافت کد پستی'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {settings?.storeName || 'عینک استوک جهانی'} | بدون نیاز به ثبت‌نام پیچیده
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* If customer is NOT yet logged in via phone */}
          {!activePhone ? (
            <form onSubmit={handleSearch} className="space-y-4 py-2">
              <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-xs space-y-2">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ورود سریع با شماره موبایل</span>
                </span>
                <p className="text-zinc-400 leading-relaxed">
                  برای مشاهده آخرین وضعیت خریدها، اطلاع از تأیید سفارش و **دریافت کد ۲۴ رقمی رهگیری پستی**، شماره موبایلی که هنگام خرید وارد کرده‌اید را در زیر بنویسید:
                </p>
              </div>

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5">
                  شماره موبایل یا کد سفارش (مثلاً SJ-1234):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="09123456789 یا SJ-1000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pr-10 pl-4 py-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono text-right dir-ltr"
                  />
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 py-3 rounded-xl text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 stroke-[2.5]" />
                <span>مشاهده سفارشات و کد رهگیری</span>
              </button>
            </form>
          ) : (
            /* Active Customer Portal View */
            <div className="space-y-4">
              {/* Customer Account Switcher Bar */}
              <div className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      {customerName || 'خریدار محترم'}
                    </span>
                    <span className="text-zinc-400 font-mono text-[11px] dir-ltr">
                      تلفن: {activePhone}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogoutPhone}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-zinc-800 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>تغییر شماره</span>
                </button>
              </div>

              {/* Notice text from settings if available */}
              {settings?.noticeText && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-300 leading-relaxed">
                  {settings.noticeText}
                </div>
              )}

              {/* No Orders Found */}
              {matchedOrders.length === 0 ? (
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-8 text-center space-y-3">
                  <Package className="w-10 h-10 text-zinc-600 mx-auto" />
                  <h4 className="text-sm font-bold text-zinc-300">
                    هیچ سفارشی با این شماره پیدا نشد
                  </h4>
                  <p className="text-xs text-zinc-500 leading-relaxed max-w-sm mx-auto">
                    لطفاً دقت کنید شماره‌ای که هنگام خرید ثبت کرده‌اید وارد شده باشد یا در صورت ابهام با پشتیبانی تماس بگیرید.
                  </p>
                  <button
                    onClick={handleLogoutPhone}
                    className="bg-amber-500 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors"
                  >
                    امتحان شماره دیگر
                  </button>
                </div>
              ) : (
                /* Orders list for this customer */
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  {matchedOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl space-y-3 text-xs"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                            کد سفارش: {ord.orderCode}
                          </span>
                          <span className="text-zinc-500 text-[11px]">
                            {new Date(ord.createdAt).toLocaleDateString('fa-IR')}
                          </span>
                        </div>

                        {getStatusBadge(ord.status)}
                      </div>

                      {/* Highlighted Postal Tracking Code Section */}
                      {ord.postalTrackingCode ? (
                        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-2 border-amber-500/40 p-3.5 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                              <Truck className="w-4 h-4 text-amber-400" />
                              <span>کد رهگیری مرسوله پستی شما:</span>
                            </span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                              پُست پیشتاز
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-zinc-900 border border-amber-500/30 p-2.5 rounded-lg">
                            <span className="font-mono font-extrabold text-amber-300 text-sm tracking-widest dir-ltr">
                              {ord.postalTrackingCode}
                            </span>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => copyPostalCode(ord.postalTrackingCode!, ord.id)}
                                className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold px-3 py-1.5 rounded-lg text-[11px] flex items-center justify-center gap-1 transition-colors"
                              >
                                {copiedCodeId === ord.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>کپی شد</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>کپی کد پستی</span>
                                  </>
                                )}
                              </button>

                              <a
                                href={`https://tracking.post.ir/?id=${ord.postalTrackingCode}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 sm:flex-none bg-sky-600 hover:bg-sky-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-[11px] flex items-center justify-center gap-1 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>سامانه پیگیری پست</span>
                              </a>
                            </div>
                          </div>

                          {ord.adminNote && (
                            <div className="text-[11px] text-zinc-300 bg-zinc-900/80 p-2 rounded-lg border border-zinc-800 mt-1">
                              <span className="text-amber-400 font-bold">پیام مدیر فروشگاه: </span>
                              <span>{ord.adminNote}</span>
                            </div>
                          )}
                        </div>
                      ) : ord.status === 'confirmed' ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            سفارش شما تأیید شد و بسته‌بندی آن انجام شده است. به محض تحویل به پست، کد ۲۴ رقمی رهگیری در همین کادر قرار می‌گیرد.
                          </span>
                        </div>
                      ) : ord.status === 'pending' ? (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>
                            سفارش شما ثبت شد و در انتظار تأیید واریزی توسط مدیر است. پس از تأیید، بسته آماده ارسال می‌گردد.
                          </span>
                        </div>
                      ) : null}

                      {/* Items Ordered List */}
                      <div className="space-y-1">
                        <span className="text-zinc-400 text-[11px] block font-bold">اقلام سفارش:</span>
                        <div className="space-y-1.5">
                          {ord.items.map((it, idx) => (
                            <div
                              key={idx}
                              className="bg-zinc-900 p-2 rounded-xl border border-zinc-800 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <Glasses className="w-4 h-4 text-amber-400 shrink-0" />
                                <span className="font-bold text-white">{it.product.title}</span>
                                <span className="text-zinc-400">({it.quantity} عدد)</span>
                              </div>
                              <span className="text-amber-400 font-bold">
                                {formatToman(it.product.price * it.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Address & Buyer Info Section with Edit Capability */}
                      <div className="pt-2 border-t border-zinc-800 space-y-2 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-300 font-bold flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-400" />
                            <span>مشخصات تحویل‌گیرنده و آدرس ارسال:</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              if (editingOrderId === ord.id) {
                                setEditingOrderId(null);
                              } else {
                                setEditingOrderId(ord.id);
                                setEditForm({ ...ord.customer });
                                setEditFormError('');
                              }
                            }}
                            className="text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{editingOrderId === ord.id ? 'بستن فرم' : 'ویرایش مشخصات تحویل'}</span>
                          </button>
                        </div>

                        {editingOrderId === ord.id ? (
                          /* Inline Edit Form for Buyer */
                          <div className="bg-zinc-900 border border-amber-500/30 p-3.5 rounded-xl space-y-3 mt-2 text-xs">
                            <h5 className="font-bold text-amber-400 flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              <span>ویرایش نام، آدرس و کد پستی تحویل‌گیرنده</span>
                            </h5>

                            {editFormError && (
                              <p className="text-rose-400 font-medium text-[11px] bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                                {editFormError}
                              </p>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">نام و نام خانوادگی تحویل‌گیرنده *</label>
                                <input
                                  type="text"
                                  required
                                  value={editForm.fullName}
                                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">شماره موبایل تماس *</label>
                                <input
                                  type="tel"
                                  required
                                  value={editForm.phone}
                                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white dir-ltr text-right"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">استان</label>
                                <input
                                  type="text"
                                  value={editForm.province}
                                  onChange={(e) => setEditForm({ ...editForm, province: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">شهر</label>
                                <input
                                  type="text"
                                  value={editForm.city}
                                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[11px] text-zinc-400 mb-1">آدرس دقیق پستی *</label>
                                <textarea
                                  rows={2}
                                  required
                                  value={editForm.address}
                                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">کد پستی ۱۰ رقمی *</label>
                                <input
                                  type="text"
                                  required
                                  value={editForm.postalCode}
                                  onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono dir-ltr text-right"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] text-zinc-400 mb-1">یادداشت برای تحویل</label>
                                <input
                                  type="text"
                                  value={editForm.notes || ''}
                                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (!editForm.fullName.trim() || !editForm.phone.trim() || !editForm.address.trim() || !editForm.postalCode.trim()) {
                                    setEditFormError('لطفاً نام، شماره تماس، آدرس و کد پستی ۱۰ رقمی را وارد کنید');
                                    return;
                                  }
                                  if (onUpdateOrderCustomer) {
                                    onUpdateOrderCustomer(ord.id, editForm);
                                  }
                                  setEditingOrderId(null);
                                }}
                                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1 text-xs transition-colors"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>ذخیره تغییرات آدرس</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setEditingOrderId(null)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs transition-colors"
                              >
                                انصراف
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Normal View of Customer Info */
                          <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80 space-y-1 text-[11px] text-zinc-300">
                            <div>
                              <span className="text-zinc-500">تحویل گیرنده: </span>
                              <span className="font-bold text-white">{ord.customer?.fullName || 'نامشخص'}</span>
                              <span className="text-zinc-500 mr-3"> | تلفن: </span>
                              <span className="font-mono text-amber-400 dir-ltr inline-block">{ord.customer?.phone || 'ثبت نشده'}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500">آدرس پستی: </span>
                              <span>{ord.customer?.province || ''}، {ord.customer?.city || ''}، {ord.customer?.address || ''}</span>
                            </div>
                            <div>
                              <span className="text-zinc-500">کد پستی ۱۰ رقمی: </span>
                              <span className="font-mono text-amber-400 dir-ltr inline-block">{ord.customer?.postalCode || 'وارد نشده'}</span>
                              {ord.customer?.notes && (
                                <>
                                  <span className="text-zinc-500 mr-3"> | یادداشت: </span>
                                  <span className="text-zinc-400">{ord.customer.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs font-black text-amber-400 pt-1">
                          <span>مبلغ نهایی سفارش:</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-extrabold">{formatToman(ord.finalAmount)}</span>
                            {onOpenInvoice && (
                              <button
                                type="button"
                                onClick={() => onOpenInvoice(ord)}
                                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>مشاهده فاکتور و رسید خرید</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
            <span>پشتیبانی تلفنی: {settings?.phone || '09120000000'}</span>
            <button
              onClick={onClose}
              className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-1.5 rounded-lg font-bold transition-colors"
            >
              بستن
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
