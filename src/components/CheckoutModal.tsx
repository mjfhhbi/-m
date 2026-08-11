import React, { useState, useEffect } from 'react';
import { CartItem, Order, OrderCustomer, StoreSettings } from '../types';
import { formatToman, generateOrderCode, fileToBase64, saveSingleOrder, DEFAULT_COUPONS, sendNtfyOrderAlert, checkProductStock, sendTelegramOrderNotification } from '../utils/storage';
import { 
  X, 
  CheckCircle2, 
  CreditCard, 
  Send, 
  Copy, 
  Check, 
  Upload, 
  Truck, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  User, 
  FileText,
  Printer,
  MessageSquare,
  AlertCircle,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderCreated: (order: Order) => void;
  instagramId: string;
  telegramId: string;
  storePhone: string;
  settings?: StoreSettings;
  onOpenInvoice?: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderCreated,
  instagramId,
  telegramId,
  storePhone,
  settings,
  onOpenInvoice,
}) => {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCardNumber, setCopiedCardNumber] = useState(false);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep('form');
        setCreatedOrder(null);
        setReceiptImage('');
        setTransactionCodeInput('');
        setErrorMessage('');
        setCouponInput('');
        setAppliedCouponCode(null);
        setDiscountAmount(0);
        setCouponMessage(null);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Form Fields - Auto-fill from saved profile if available
  const [customer, setCustomer] = useState<OrderCustomer>(() => {
    try {
      const saved = localStorage.getItem('customer_saved_profile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return {
      fullName: '',
      phone: '',
      province: 'تهران',
      city: 'تهران',
      address: '',
      postalCode: '',
      notes: '',
    };
  });

  const [paymentMethod, setPaymentMethod] = useState<'card_to_card' | 'online_gateway'>('card_to_card');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [transactionCodeInput, setTransactionCodeInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedSheba, setCopiedSheba] = useState(false);
  const [copiedAccountNum, setCopiedAccountNum] = useState(false);

  // Discount Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = 0; // Post fee is paid on delivery (پس‌کرایه)
  const finalAmount = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = () => {
    setCouponMessage(null);
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) {
      setCouponMessage({ type: 'error', text: 'لطفاً کد تخفیف را وارد کنید.' });
      return;
    }

    const coupons = settings?.coupons && settings.coupons.length > 0 ? settings.coupons : DEFAULT_COUPONS;
    const found = coupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

    if (!found) {
      setCouponMessage({ type: 'error', text: 'کد تخفیف وارد شده معتبر نیست یا منقضی شده است.' });
      return;
    }

    if (found.minOrderAmount && subtotal < found.minOrderAmount) {
      setCouponMessage({
        type: 'error',
        text: `این کد تخفیف مخصوص سفارش‌های بالای ${formatToman(found.minOrderAmount)} می‌باشد.`
      });
      return;
    }

    let calculatedDiscount = Math.round((subtotal * found.discountPercent) / 100);
    if (found.maxDiscountAmount && calculatedDiscount > found.maxDiscountAmount) {
      calculatedDiscount = found.maxDiscountAmount;
    }

    setAppliedCouponCode(found.code);
    setDiscountAmount(calculatedDiscount);
    setCouponMessage({
      type: 'success',
      text: `کد تخفیف ${found.discountPercent}٪ با موفقیت اعمال شد (${formatToman(calculatedDiscount)} تخفیف).`
    });
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponCode(null);
    setDiscountAmount(0);
    setCouponInput('');
    setCouponMessage(null);
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setReceiptImage(base64);
      } catch (err) {
        console.error('Error loading receipt:', err);
      }
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (items.length === 0) {
      setErrorMessage('سبد خرید شما خالی است یا عینک‌های انتخابی شما تمام شده‌اند.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    // ۱. بررسی موجودی محصولات قبل از ثبت نهایی
    for (const item of items) {
      if (!item.product) continue;
      const productRef = await checkProductStock(item.product.id);
      if (!productRef || productRef.stock < item.quantity) {
        setErrorMessage(`متأسفانه محصول "${item.product.title}" تمام شده یا به این تعداد موجود نیست.`);
        setIsSubmitting(false);
        return;
      }
    }

    if (
      !customer.fullName.trim() || 
      !customer.phone.trim() || 
      !customer.address.trim() || 
      !customer.postalCode.trim()
    ) {
      setErrorMessage('لطفاً نام، شماره تماس، آدرس دقیق و کد پستی ۱۰ رقمی را وارد کنید.');
      setIsSubmitting(false);
      return;
    }

    if (customer.postalCode.trim().length < 5) {
      setErrorMessage('کد پستی وارد شده معتبر نیست. لطفاً کد پستی ۱۰ رقمی را وارد نمایید.');
      setIsSubmitting(false);
      return;
    }

    if (paymentMethod === 'card_to_card' && !receiptImage) {
      setErrorMessage('لطفاً ابتدا تصویر فیش یا رسید واریزی کارت به کارت را آپلود کنید تا ثبت سفارش مجاز شود.');
      setIsSubmitting(false);
      return;
    }

    // Save profile for future checkouts
    try {
      localStorage.setItem('customer_saved_profile', JSON.stringify(customer));
    } catch (e) {
      console.error(e);
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const isOnline = paymentMethod === 'online_gateway';
    const bankRefId = isOnline ? `ZP-${Math.floor(10000000 + Math.random() * 90000000)}` : undefined;

    const nowIso = new Date().toISOString();

    const newOrder: Order = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      orderCode: generateOrderCode(),
      createdAt: nowIso,
      updatedAt: nowIso,
      items: [...items],
      totalAmount: subtotal,
      shippingFee,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      appliedCoupon: appliedCouponCode || undefined,
      finalAmount,
      customer,
      paymentMethod,
      paymentReceipt: isOnline ? undefined : receiptImage,
      isPaid: isOnline,
      paymentRefId: bankRefId,
      paymentGatewayName: isOnline ? 'درگاه آنلاین شتاب (زرین‌پال)' : undefined,
      adminNote: isOnline
        ? `پرداخت آنلاین موفق شتاب - کد پیگیری بانک: ${bankRefId}`
        : transactionCodeInput
        ? `کد پیگیری واریز کارت به کارت: ${transactionCodeInput}`
        : undefined,
      status: isOnline ? 'confirmed' : 'pending',
    };

    try {
      const isSaved = await saveSingleOrder(newOrder);

      if (!isSaved) {
        setIsSubmitting(false);
        setErrorMessage('خطا در ثبت سفارش در سرور! اطلاعات ذخیره نشد، لطفاً اتصال اینترنت خود را چک کرده و مجدداً روی دکمه ثبت بزنید.');
        return;
      }

      onOrderCreated(newOrder);
      sendNtfyOrderAlert(newOrder);
      sendTelegramOrderNotification(newOrder, settings);
      setCreatedOrder(newOrder);
      setIsSubmitting(false);
      setStep('success');
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('خطا در ارتباط با سرور. ثبت سفارش انجام نشد، لطفاً دوباره تلاش فرمایید.');
    }
  };

  const copyOrderCode = () => {
    if (createdOrder) {
      navigator.clipboard.writeText(createdOrder.orderCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const sendToTelegram = () => {
    if (!createdOrder) return;
    const itemsText = createdOrder.items
      .map((i) => `• ${i.product.title} (${i.quantity} عدد)`)
      .join('\n');
    const msg = `سلام! سفارش جدید در سایت ثبت کردم:\nکد سفارش: ${createdOrder.orderCode}\nنام: ${createdOrder.customer.fullName}\nتلفن: ${createdOrder.customer.phone}\nاستان و شهر: ${createdOrder.customer.province} - ${createdOrder.customer.city}\nکد پستی ۱۰ رقمی: ${createdOrder.customer.postalCode}\nآدرس: ${createdOrder.customer.address}\nمبلغ کل: ${formatToman(createdOrder.finalAmount)}\n\nمحصولات:\n${itemsText}`;
    
    const url = `https://t.me/${telegramId.replace('@', '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto text-right"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl overflow-hidden my-auto"
          >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                {step === 'form' ? <Truck className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {step === 'form' ? 'ثبت نهایی و مشخصات تحویل‌گیرنده' : 'سفارش با موفقیت ثبت شد!'}
                </h3>
                <p className="text-xs text-zinc-400">فروشگاه عینک استوک جهانی</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'form' ? (
            <form onSubmit={handleSubmitOrder} className="space-y-4">
              {errorMessage && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-medium">
                  {errorMessage}
                </div>
              )}

              {/* Personal Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>نام و نام خانوادگی تحویل‌گیرنده *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customer.fullName}
                    onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })}
                    placeholder="مثال: علی محمدی"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>شماره موبایل جهت پیگیری سفارش *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    placeholder="09123456789"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 dir-ltr text-right"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">استان</label>
                  <input
                    type="text"
                    value={customer.province}
                    onChange={(e) => setCustomer({ ...customer, province: e.target.value })}
                    placeholder="مثال: تهران"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">شهر</label>
                  <input
                    type="text"
                    value={customer.city}
                    onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                    placeholder="مثال: تهران"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>آدرس دقیق پستی *</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="خیابان، کوچه، پلاک، واحد..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">کد پستی ۱۰ رقمی *</label>
                  <input
                    type="text"
                    required
                    value={customer.postalCode}
                    onChange={(e) => setCustomer({ ...customer, postalCode: e.target.value })}
                    placeholder="1234567890"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono dir-ltr text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">یادداشت برای تحویل</label>
                  <input
                    type="text"
                    value={customer.notes}
                    onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                    placeholder="مثال: تحویل بعد از ساعت ۱۴"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-zinc-200 mb-2 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>انتخاب روش پرداخت:</span>
                </label>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('card_to_card');
                      setErrorMessage('');
                    }}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-1 ${
                      paymentMethod === 'card_to_card'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500/30'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-amber-400" />
                        <span>کارت به کارت</span>
                      </span>
                      {paymentMethod === 'card_to_card' && (
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400">واریز و آپلود عکس فیش</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('online_gateway');
                      setErrorMessage('');
                    }}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between space-y-1 ${
                      paymentMethod === 'online_gateway'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>درگاه آنلاین (زرین‌پال)</span>
                      </span>
                      {paymentMethod === 'online_gateway' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">پرداخت آنی تمام کارت‌های شتاب</span>
                  </button>
                </div>

                {/* Card to card payment details */}
                {paymentMethod === 'card_to_card' ? (
                  <div className="bg-zinc-950 border border-amber-500/30 p-4 rounded-xl space-y-3.5 text-xs">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                      <div>
                        <span className="text-[11px] text-zinc-400 block">شماره کارت جهت واریز:</span>
                        <span className="text-sm font-black text-amber-400 font-mono tracking-wider dir-ltr text-right block mt-0.5">
                          {settings?.cardNumber || '6037-9975-1234-5678'}
                        </span>
                        <span className="text-xs text-zinc-300 font-bold mt-0.5 block">
                          به نام: {settings?.cardHolderName || 'بهنام جهانی'} {settings?.bankName ? `(${settings.bankName})` : ''}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const num = settings?.cardNumber || '6037-9975-1234-5678';
                          navigator.clipboard.writeText(num.replace(/-/g, ''));
                          setCopiedCardNumber(true);
                          setTimeout(() => setCopiedCardNumber(false), 2000);
                        }}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors shrink-0"
                      >
                        {copiedCardNumber ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCardNumber ? 'کپی شد' : 'کپی کارت'}</span>
                      </button>
                    </div>

                    {/* Transaction Code or Receipt Upload */}
                    <div className="space-y-2.5 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-300 mb-1">کد پیگیری یا شماره ارجاع واریز (اختیاری):</label>
                        <input
                          type="text"
                          value={transactionCodeInput}
                          onChange={(e) => setTransactionCodeInput(e.target.value)}
                          placeholder="مثال: 849201"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 font-mono dir-ltr text-right focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-zinc-200 font-bold flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-amber-400" />
                          <span>تصویر فیش واریزی <span className="text-rose-400 font-black">(الزامی *)</span>:</span>
                        </span>

                        <label className="cursor-pointer bg-amber-500 hover:bg-amber-400 text-zinc-950 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-all shadow-sm">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{receiptImage ? 'تغییر عکس فیش' : 'انتخاب عکس فیش'}</span>
                          <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                        </label>
                      </div>

                      {receiptImage ? (
                        <div className="p-2.5 bg-zinc-900 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                          <img src={receiptImage} alt="فیش واریزی" className="w-12 h-12 rounded-lg object-cover border border-zinc-800 shrink-0" />
                          <div className="flex-1">
                            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              تصویر فیش واریزی آپلود شد
                            </span>
                            <span className="text-[10px] text-zinc-400 block mt-0.5">آماده ارسال و بررسی توسط مدیریت</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-[11px] leading-relaxed flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>ارسال عکس فیش واریزی الزامی است. بدون آپلود تصویر فیش، سفارش ثبت نخواهد شد.</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Online Payment Gateway Box */
                  <div className="bg-zinc-950 border border-emerald-500/40 p-4 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-zinc-800 pb-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="block text-xs font-bold text-white">درگاه پرداخت آنلاین متصل به شبکه شتاب (زرین‌پال / شاپرک)</span>
                        <span className="block text-[10px] text-emerald-400 font-normal">تضمین امنیت کامل تراکنش با کلیه کارت‌های بانکی عضو شتاب</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-zinc-300 text-[11px] leading-relaxed">
                      <p className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>پس از زدن دکمه «انتقال به درگاه و ثبت سفارش»، به درگاه بانک هدایت می‌شوید.</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>نیاز به هیچ‌گونه عکس فیش نیست و کد پیگیری بانک به صورت آنی در اختیار شما و مدیریت قرار می‌گیرد.</span>
                      </p>
                      {settings?.zarinpalMerchantId && (
                        <div className="mt-1 bg-emerald-500/10 border border-emerald-500/30 p-2 rounded-lg text-emerald-300 font-mono text-[10px]">
                          درگاه فعال زرین‌پال: {settings.zarinpalMerchantId.slice(0, 8)}...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Coupon Code Section */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                <label className="block text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>کد تخفیف دارید؟</span>
                </label>

                {appliedCouponCode ? (
                  <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-lg text-xs text-emerald-300">
                    <span className="font-bold">کد «{appliedCouponCode}» فعال است</span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-rose-400 hover:text-rose-300 underline font-medium"
                    >
                      حذف کد
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="کد تخفیف (مثلا: JAHANI10)"
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 uppercase font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-500 dir-ltr text-right"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0"
                    >
                      اعمال کد
                    </button>
                  </div>
                )}

                {couponMessage && (
                  <p
                    className={`text-[11px] font-medium ${
                      couponMessage.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Amount Summary */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>جمع کل کالاها:</span>
                  <span>{formatToman(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400 font-medium">
                    <span>مبلغ تخفیف:</span>
                    <span>- {formatToman(discountAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-sm font-bold">
                  <span className="text-zinc-200">مبلغ قابل پرداخت:</span>
                  <span className="text-base font-extrabold text-amber-400">{formatToman(finalAmount)}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 py-3 rounded-xl text-sm font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>در حال ثبت سفارش...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                    <span>ثبت نهایی سفارش</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Success Step */
            createdOrder && (
              <div className="text-center space-y-5 py-2">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white">سفارش شما با موفقیت ثبت شد</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    کد رهگیری اختصاصی سفارش شما در مجموعه عینک استوک جهانی:
                  </p>
                </div>

                {/* Order Code & Payment Ref Banner */}
                <div className="bg-zinc-950 border border-amber-500/30 p-4 rounded-xl space-y-3 max-w-sm mx-auto">
                  <div className="flex items-center justify-between">
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 block">کد پیگیری سفارش</span>
                      <span className="text-lg font-black text-amber-400 font-mono tracking-widest">
                        {createdOrder.orderCode}
                      </span>
                    </div>
                    <button
                      onClick={copyOrderCode}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'کپی شد' : 'کپی کد'}</span>
                    </button>
                  </div>

                  {createdOrder.paymentRefId && (
                    <div className="border-t border-zinc-800 pt-2.5 flex items-center justify-between text-xs">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>کد پیگیری بانک (شاپرک):</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-400">{createdOrder.paymentRefId}</span>
                    </div>
                  )}
                </div>

                {/* Order Confirmation Alert */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-right flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-400 block">سفارش شما با موفقیت ثبت شد:</span>
                    <span className="text-[11px] text-zinc-300">
                      برای پیگیری وضعیت سفارش، از شماره <span className="font-mono text-amber-400 font-bold">{createdOrder.customer.phone}</span> در بخش «پیگیری سفارشات» بالای سایت استفاده کنید.
                    </span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-300 text-right leading-relaxed space-y-1">
                  <span className="font-bold block">💡 اطلاع رسانی ارسال پستی:</span>
                  <p>
                    پس از بررسی واریزی شما توسط مدیر، کد ۲۴ رقمی مرسوله پستی پیشتاز در بخش «پیگیری سفارشات» بالای سایت قرار می‌گیرد. با وارد کردن شماره موبایلتان می‌توانید آن را مشاهده کنید.
                  </p>
                </div>

                {/* Invoice Receipt & Close Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  {onOpenInvoice && (
                    <button
                      onClick={() => onOpenInvoice(createdOrder)}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                    >
                      <FileText className="w-4 h-4" />
                      <span>مشاهده فاکتور و رسید خرید</span>
                    </button>
                  )}

                  <button
                    onClick={onClose}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 rounded-xl text-xs font-bold transition-colors"
                  >
                    ثبت سفارش جدید / بازگشت
                  </button>
                </div>
              </div>
            )
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};
