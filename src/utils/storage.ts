import { Product, Order, StoreSettings, CategoryItem, CouponCode, VisitorStats, VisitLog } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

const PRODUCTS_KEY = 'stock_jahani_products_v1';
const ORDERS_KEY = 'stock_jahani_orders_v1';
const SETTINGS_KEY = 'stock_jahani_settings_v1';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'sunglasses', label: 'عینک آفتابی' },
  { id: 'optical', label: 'عینک طبی' },
  { id: 'sport', label: 'ورزشی و اسپرت' },
  { id: 'unisex', label: 'یونی‌سکس' },
];

export const DEFAULT_COUPONS: CouponCode[] = [
  {
    id: 'coupon-welcome',
    code: 'JAHANI10',
    discountPercent: 10,
    minOrderAmount: 500000,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'coupon-special',
    code: 'STK15',
    discountPercent: 15,
    minOrderAmount: 1000000,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_FAQS: { id: string; question: string; answer: string; iconType?: string }[] = [
  {
    id: 'faq-1',
    question: 'عینک استوک چیست و چه تفاوتی با عینک‌های فیک و های‌کپی دارد؟',
    answer: 'عینک‌های استوک (Stock Eyewear) محصولات اورجینال مازاد تولید کمپانی‌های معتبر اروپایی و بین‌المللی هستند که به دلیل تغییر کالکشن فصلی با قیمتی بسیار مناسب‌تر از نمایندگی‌های اصلی عرضه می‌شوند. برخلاف مدل‌های فیک یا های‌کپی که از پلاستیک بازیافتی و طلق‌های بی‌کیفیت ساخته می‌شوند، این عینک‌ها دارای فریم‌های مرغوب کائوچویی (استات)، لولاهای فلزی فنردار بادوام و عدسی‌های استاندارد جهانی هستند.',
  },
  {
    id: 'faq-2',
    question: 'چگونه از استاندارد UV400 و پلاریزه بودن عدسی عینک‌ها مطمئن شوم؟',
    answer: 'تمامی عینک‌های فروشگاه stock_jahani قبل از بارگذاری و ارسال توسط دستگاه‌های تخصصی UVسنج اپتومتری بررسی می‌شوند و تضمین ۱۰۰٪ فیلتراسیون امواج مضر UVA و UVB تا ۴۰۰ نانومتر را دارند. همچنین برای عینک‌های پلاریزه، به همراه سفارش کارت مخصوص تست پلاریزه ارسال می‌گردد که با نگاه کردن از پشت عینک تصویر مخفی نمایان می‌شود.',
  },
  {
    id: 'faq-3',
    question: 'شرایط بسته‌بندی و ارسال به شهرستان‌ها چگونه است؟',
    answer: 'همه عینک‌ها درون یک هاردکیس (قاب ضدضربه مقاوم) به همراه دستمال مایکروفایبر نانو بسته‌بندی شده و با پُست پیشتاز سریع به سراسر ایران ارسال می‌شوند. بسته شما بیمه کامل پستی دارد و کد رهگیری ۲۴ رقمی پستی در بخش «پیگیری سفارشات» و از طریق پیامک در اختیار شما قرار خواهد گرفت.',
  },
  {
    id: 'faq-4',
    question: 'مهلت تست و ضمانت بازگشت کالا (گارانتی ۷ روزه) چگونه است؟',
    answer: 'شما تا ۷ روز پس از دریافت بسته مهلت دارید عینک را روی صورت خود تست کنید و در صورت وجود هرگونه عدم تطابق با مشخصات، عدم رضایت از سایز یا ایراد فنی در فریم و عدسی، بدون هیچ قید و شرطی کالا را مرجوع نموده و وجه خود را فوراً دریافت نمایید.',
  },
  {
    id: 'faq-5',
    question: 'آیا امکان تعویض عدسی با نمره طبی شخصی وجود دارد؟',
    answer: 'بله، تمامی فریم‌های طبی و اکثر فریم‌های کائوچویی آفتابی استاندارد دارای پیچ شیاردار یا ساختار استاندارد هستند و شما می‌توانید در هر مرکز بینایی‌سنجی و عینک‌سازی، عدسی طبی مورد نظر خود را روی فریم سوار کنید.',
  },
];

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'stock_jahani',
  tagline: 'فروشگاه تخصصی عینک‌های آفتابی و طبی استوک اورجینال',
  bannerMessage: '✨ ارسال با پست پیشتاز به سراسر کشور | تضمین سلامت فریم و عدسی',
  welcomeText: 'تجربه‌ای متفاوت از کیفیت و استایل با عینک استوک جهانی',
  welcomeSubtext: 'مجموعه کامل عینک‌های آفتابی و طبی اورجینال، فریم‌های استوک کائوچویی و فلزی ساخت اروپا با عدسی‌های پلاریزه و استاندارد کامل UV400.',
  heroTitle: 'کالکشن جدید عینک‌های استوک و اورجینال اروپایی',
  heroSubtitle: 'تضمین ۱۰۰٪ اصالت فریم و عدسی UV400، ارسال سریع و رایگان با پست پیشتاز به سراسر کشور',
  heroBadgeText: '✨ کالکشن جدید ۲۰۲۶ - کیفیت اورجینال',
  announcementText: '🚀 ارسال رایگان به سراسر کشور برای تمامی سفارش‌ها با بسته‌بندی هاردکیس ضدضربه',
  showAnnouncement: true,
  feature1Title: 'ضمانت اصالت و سلامت',
  feature1Desc: 'تمام عینک‌ها استوک دست‌چین اورجینال اروپایی هستند',
  feature2Title: 'محافظت کامل UV400',
  feature2Desc: 'عدسی‌های استاندارد و پلاریزه تست شده ضد اشعه',
  feature3Title: 'ارسال سریع پیشتاز',
  feature3Desc: 'تحویل با بسته‌بندی ایمن و کد پیگیری ۲۴ رقمی پست',
  feature4Title: 'پشتیبانی اختصاصی',
  feature4Desc: 'مشاوره آنلاین و پاسخگویی سریع در دایرکت و تلگرام',
  noticeText: '💡 خریداران گرامی: پس از ثبت سفارش، کد ۲۴ رقمی رهگیری پستی به همراه وضعیت خریدهای شما در بخش «پیگیری سفارشات» قرار خواهد گرفت.',
  aboutText: 'فروشگاه عینک استوک جهانی عرضه کننده مستقیم جدیدترین فریم‌های طبی و آفتابی استوک اورجینال اروپا با بالاترین کیفیت و نازل‌ترین قیمت.',
  rulesText: 'تمامی بسته‌ها در هاردکیس مقاوم ضدضربه با پُست پیشتاز ارسال شده و کد رهگیری مرسوله پستی پس از ارسال در همین سایت نمایش داده می‌شود.',
  footerAboutText: 'فروشگاه تخصصی stock_jahani واردکننده و ارائه‌دهنده فریم‌های باکیفیت و خاص با مناسب‌ترین قیمت.',
  categories: DEFAULT_CATEGORIES,
  coupons: DEFAULT_COUPONS,
  faqs: DEFAULT_FAQS,
  managerEmail: 'matinjahanbani2024@gmail.com',
  showIntroSplash: true,
  splashBadgeText: 'عینک‌های اورجینال استوک اروپا',
  splashTitle: 'فروشگاه عینک استوک جهانی',
  splashSubtitle: 'تضمین اصالت فریم، عدسی‌های پلاریزه و UV400 با ارسال فوری و بسته‌بندی هاردکیس',
  splashButtonText: 'ورود به ویترین فروشگاه',
  splashDurationMs: 2200,
  whatsappNumber: '09120000000',
  supportTelegram: 'stock_jahani',
  enableSoundEffects: true,
  instagram: 'stock_jahani',
  phone: '09120000000',
  address: 'تهران، خیابان ولیعصر، مرکز خرید عینک استوک جهانی',
  freeShippingThreshold: 0,
  adminPasscode: '1383',
  cardNumber: '6037-9975-1234-5678',
  cardHolderName: 'بهنام جهانی',
  bankName: 'بانک ملی ایران',
  accountNumber: '0102030405006',
  shebaNumber: 'IR120170000000102030405006',
  telegramBotToken: '8880696062:AAEqF5r7ZillJV8njxUGrbPyT9nQpAPES3M',
  telegramChatId: '8574668861',
  ntfyEnabled: true,
  ntfyTopic: 'stock_jahani_orders',
  ntfyServerUrl: 'https://ntfy.sh',
};

// Ready sample products if user requests demo items
export const DEMO_PRODUCTS: Product[] = [];

// Curated high quality glasses preset images for quick selection
export const GLASSES_IMAGE_PRESETS = [
  {
    name: 'خلبانی کلاسیک Ray-Ban Aviator',
    url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
    category: 'sunglasses'
  },
  {
    name: 'ویفرر مشکی مات Wayfarer',
    url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
    category: 'sunglasses'
  },
  {
    name: 'کلاب مستر طلایی مشکی Clubmaster',
    url: 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80',
    category: 'sunglasses'
  },
  {
    name: 'فریم طبی گرد وینتیج Vintage Round',
    url: 'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&auto=format&fit=crop&q=80',
    category: 'optical'
  },
  {
    name: 'فریم طبی مستطیلی کائوچویی Square Acetate',
    url: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&auto=format&fit=crop&q=80',
    category: 'optical'
  },
  {
    name: 'عینک اسپرت و ورزشی پلی‌کربنات Sport Shield',
    url: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop&q=80',
    category: 'sport'
  }
];

/**
 * Robustly parses any Persian, Arabic, or English numeric input with or without commas.
 */
export function parseNumberInput(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, Math.floor(val));
  
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let clean = String(val);
  for (let i = 0; i < 10; i++) {
    clean = clean.replaceAll(persianDigits[i], String(i));
    clean = clean.replaceAll(arabicDigits[i], String(i));
  }
  // Strip out commas, persian commas, spaces, currency symbols, and non-digits
  clean = clean.replace(/[^0-9]/g, '');
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : Math.max(0, num);
}

/**
 * Converts a Toman number into readable Persian verbal words.
 */
export function tomanToWords(amount: number): string {
  if (!amount || amount <= 0) return 'صفر تومان';
  
  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
  const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
  const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
  
  function convertGroup(n: number): string {
    const parts: string[] = [];
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    
    if (h > 0) parts.push(hundreds[h]);
    
    if (remainder >= 10 && remainder < 20) {
      parts.push(teens[remainder - 10]);
    } else {
      const t = Math.floor(remainder / 10);
      const o = remainder % 10;
      if (t > 0) parts.push(tens[t]);
      if (o > 0) parts.push(ones[o]);
    }
    
    return parts.join(' و ');
  }
  
  const billions = Math.floor(amount / 1000000000);
  const millions = Math.floor((amount % 1000000000) / 1000000);
  const thousands = Math.floor((amount % 1000000) / 1000);
  const units = amount % 1000;
  
  const sections: string[] = [];
  if (billions > 0) sections.push(`${convertGroup(billions)} میلیارد`);
  if (millions > 0) sections.push(`${convertGroup(millions)} میلیون`);
  if (thousands > 0) sections.push(`${convertGroup(thousands)} هزار`);
  if (units > 0) sections.push(convertGroup(units));
  
  return (sections.join(' و ') || 'صفر') + ' تومان';
}

function cleanForFirestore<T>(data: T): T {
  if (data === undefined || data === null) return data;
  return JSON.parse(JSON.stringify(data));
}

function withTimeout<T>(promise: Promise<T>, ms: number = 2500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function getStoredProducts(): Product[] {
  try {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (data === null) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      return parsed.filter((p) => p && p.id);
    }
    return [];
  } catch (err) {
    console.error('Error reading products:', err);
    return [];
  }
}

export async function saveSingleProduct(product: Product): Promise<boolean> {
  if (!product || !product.id) return false;
  
  const cleanP = { ...product, updatedAt: new Date().toISOString() };
  
  // 1. Update local storage
  try {
    const current = getStoredProducts();
    const idx = current.findIndex((p) => p.id === product.id);
    let updated: Product[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = cleanP;
    } else {
      updated = [cleanP, ...current];
    }
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updated));
    notifyTabsOfChange();
  } catch (e) {
    console.error('Error updating localStorage for product:', e);
  }
  
  // 2. Send to Express API
  const apiPromise = fetch('/api/products/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product: cleanP }),
  }).catch(() => {});
  
  // 3. Send to Firestore
  const fsPromise = (async () => {
    try {
      await setDoc(doc(db, 'products', cleanP.id), cleanForFirestore(cleanP));
    } catch (e) {
      console.warn('Firestore single setDoc notice:', e);
    }
  })();
  
  await Promise.allSettled([apiPromise, fsPromise]);
  return true;
}

export async function saveStoredProducts(products: Product[]): Promise<boolean> {
  const validProducts = (products || []).filter((p) => p && p.id).map((p) => ({
    ...p,
    updatedAt: p.updatedAt || new Date().toISOString(),
  }));

  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(validProducts));
    notifyTabsOfChange();
  } catch (err) {
    console.error('Error saving products locally:', err);
  }

  // 1. Send authoritative list to Express Server API
  const apiPromise = fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: validProducts }),
  }).catch(() => {});

  // 2. Sync to Firestore
  const firestorePromise = (async () => {
    try {
      const existingSnap = await withTimeout(getDocs(collection(db, 'products')), 3000);
      const currentIds = new Set(validProducts.map((p) => p.id));
      const batch = writeBatch(db);

      if (existingSnap) {
        existingSnap.forEach((docSnap) => {
          if (!currentIds.has(docSnap.id)) {
            batch.delete(docSnap.ref);
          }
        });
      }

      validProducts.forEach((p) => {
        const cleanP = cleanForFirestore(p);
        batch.set(doc(db, 'products', p.id), cleanP);
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
      for (const p of validProducts) {
        try {
          await setDoc(doc(db, 'products', p.id), cleanForFirestore(p));
        } catch (e) {}
      }
    }
  })();

  await Promise.allSettled([firestorePromise, withTimeout(apiPromise, 3000)]);
  return true;
}

export function getStoredOrders(): Order[] {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed.filter((o) => o && o.id) : [];
  } catch (err) {
    console.error('Error reading orders:', err);
    return [];
  }
}

export async function resetAllStoreData(): Promise<boolean> {
  try {
    localStorage.removeItem(PRODUCTS_KEY);
    localStorage.removeItem(ORDERS_KEY);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify([]));
    localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
    notifyTabsOfChange();

    await fetch('/api/reset-all', { method: 'POST' }).catch(() => {});

    try {
      const pSnap = await withTimeout(getDocs(collection(db, 'products')), 3000);
      const oSnap = await withTimeout(getDocs(collection(db, 'orders')), 3000);
      const batch = writeBatch(db);
      pSnap?.forEach((d) => batch.delete(d.ref));
      oSnap?.forEach((d) => batch.delete(d.ref));
      await batch.commit().catch(() => {});
    } catch (e) {}

    return true;
  } catch (e) {
    console.error('Error in resetAllStoreData:', e);
    return false;
  }
}

function parseTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  return isNaN(t) ? 0 : t;
}

export function mergeSettingsObjects(...settingsList: (StoreSettings | null | undefined)[]): StoreSettings {
  let result: StoreSettings = { ...DEFAULT_SETTINGS };

  for (const s of settingsList) {
    if (!s || typeof s !== 'object') continue;
    result = {
      ...result,
      ...s,
      // If the incoming settings object has explicit categories, use them directly
      categories: Array.isArray(s.categories) && s.categories.length > 0 ? s.categories : result.categories,
      coupons: Array.isArray(s.coupons) ? s.coupons : result.coupons,
      faqs: Array.isArray(s.faqs) && s.faqs.length > 0 ? s.faqs : result.faqs,
    };
  }

  return result;
}

export function mergeProductsList(...lists: Product[][]): Product[] {
  // If the primary server list exists and is non-empty or explicitly set, respect it
  const map = new Map<string, Product>();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const prod of list) {
      if (!prod || !prod.id) continue;
      const existing = map.get(prod.id);
      if (!existing) {
        map.set(prod.id, prod);
      } else {
        const existingTime = parseTimestamp(existing.updatedAt || existing.createdAt);
        const newTime = parseTimestamp(prod.updatedAt || prod.createdAt);
        if (newTime >= existingTime) {
          map.set(prod.id, { ...existing, ...prod });
        }
      }
    }
  }
  return Array.from(map.values());
}

export function mergeOrdersList(...lists: Order[][]): Order[] {
  const map = new Map<string, Order>();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const order of list) {
      if (!order || !order.id) continue;
      const existing = map.get(order.id);
      if (!existing) {
        map.set(order.id, order);
      } else {
        const existingTime = parseTimestamp(existing.updatedAt || existing.createdAt);
        const newTime = parseTimestamp(order.updatedAt || order.createdAt);
        if (newTime >= existingTime) {
          map.set(order.id, { ...existing, ...order });
        } else {
          map.set(order.id, { ...order, ...existing });
        }
      }
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt)
  );
}

export async function saveStoredOrders(orders: Order[]): Promise<boolean> {
  const validOrders = (orders || []).filter((o) => o && o.id);

  // 1. Immediate local storage update
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(validOrders));
    notifyTabsOfChange();
  } catch (err) {
    console.error('Error saving orders locally:', err);
  }

  const cleanOrders = validOrders.map(cleanForFirestore);

  // 2. Immediate Server API sync (/api/orders)
  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders: cleanOrders }),
  }).catch(() => {});

  // 3. Persistent Firestore sync
  (async () => {
    try {
      const existingSnap = await withTimeout(getDocs(collection(db, 'orders')), 3000);
      const currentIds = new Set(validOrders.map((o) => o.id));
      const batch = writeBatch(db);

      if (existingSnap) {
        existingSnap.forEach((docSnap) => {
          if (!currentIds.has(docSnap.id)) {
            batch.delete(docSnap.ref);
          }
        });
      }

      cleanOrders.forEach((o) => {
        batch.set(doc(db, 'orders', o.id), o);
      });

      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
      for (const o of cleanOrders) {
        try {
          await setDoc(doc(db, 'orders', o.id), o);
        } catch (e) {}
      }
    }
  })();

  return true;
}

export async function saveSingleOrder(order: Order): Promise<boolean> {
  const cleanOrder: Order = {
    ...cleanForFirestore(order),
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString(),
  };

  // Decrement product stock locally and sync updated products
  try {
    const currentProducts = getStoredProducts();
    let stockChanged = false;
    const updatedProducts = currentProducts.map((p) => {
      const itemInOrder = order.items.find((i) => i.product && i.product.id === p.id);
      if (itemInOrder) {
        stockChanged = true;
        const newStock = Math.max(0, p.stock - itemInOrder.quantity);
        return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
      }
      return p;
    });
    if (stockChanged) {
      saveStoredProducts(updatedProducts);
    }
  } catch (e) {
    console.error('Error updating stock after order placement:', e);
  }

  let savedLocal = false;

  // 1. Save to local storage instantly (0ms)
  try {
    const existing = getStoredOrders();
    const updated = [cleanOrder, ...existing.filter((o) => o.id !== cleanOrder.id)];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    notifyTabsOfChange();
    savedLocal = true;
  } catch (err) {
    console.error('Error saving order to localStorage:', err);
  }

  // 2. Fire Server API and Firestore in parallel
  const apiPromise = fetch('/api/orders/new', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: cleanOrder }),
  })
    .then((res) => res.ok)
    .catch(() => false);

  const firestorePromise = setDoc(doc(db, 'orders', cleanOrder.id), cleanOrder)
    .then(() => true)
    .catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `orders/${cleanOrder.id}`);
      return false;
    });

  let savedRemote = false;
  try {
    const apiResult = await withTimeout(apiPromise, 4000).catch(() => false);
    if (apiResult === true) savedRemote = true;
  } catch (e) {
    console.warn('Express order sync notice:', e);
  }

  return savedLocal || savedRemote;
}

export function getStoredSettings(): StoreSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(data);
    if (parsed.adminPasscode === '1234' || !parsed.adminPasscode) {
      parsed.adminPasscode = '1383';
    }
    if (parsed.telegramChatId === '200220495' || !parsed.telegramChatId) {
      parsed.telegramChatId = '8574668861';
    }
    if (!parsed.telegramBotToken) {
      parsed.telegramBotToken = '8880696062:AAEqF5r7ZillJV8njxUGrbPyT9nQpAPES3M';
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export async function saveStoredSettings(settings: StoreSettings): Promise<boolean> {
  const updatedSettings: StoreSettings = {
    ...settings,
    updatedAt: settings.updatedAt || new Date().toISOString(),
  };

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
    notifyTabsOfChange();
  } catch (err) {
    console.error('Error saving settings locally:', err);
  }

  // Sync to Server API
  fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings: updatedSettings }),
  }).catch(() => {});

  // Primary Firestore settings sync
  setDoc(doc(db, 'settings', 'store_settings'), cleanForFirestore(updatedSettings)).catch((err) => {
    handleFirestoreError(err, OperationType.WRITE, 'settings/store_settings');
  });

  return true;
}

export async function deleteProductFromFirestore(productId: string): Promise<boolean> {
  // Update local storage immediately
  const remaining = getStoredProducts().filter((p) => p.id !== productId);
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(remaining));
  } catch (e) {}

  notifyTabsOfChange();

  // Delete from backend server API and Firestore in parallel
  Promise.allSettled([
    fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    }),
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products: remaining }),
    }),
    deleteDoc(doc(db, 'products', productId)).catch((err) => {
      handleFirestoreError(err, OperationType.DELETE, `products/${productId}`);
    }),
  ]).catch(() => {});

  return true;
}

export async function deleteOrderFromFirestore(orderId: string): Promise<boolean> {
  // Update local storage immediately
  const remaining = getStoredOrders().filter((o) => o.id !== orderId);
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(remaining));
  } catch (e) {}

  notifyTabsOfChange();

  // Delete from backend server API
  fetch(`/api/orders/${orderId}`, {
    method: 'DELETE',
  }).catch(() => {});

  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders: remaining }),
  }).catch(() => {});

  // Also Firestore delete
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
  }
  return true;
}

// Fetch authoritative shared data from Express Server API and Firestore, with local storage cache fallback
export async function fetchServerData(): Promise<{ products: Product[]; orders: Order[]; settings: StoreSettings }> {
  let apiProducts: Product[] | null = null;
  let apiOrders: Order[] | null = null;
  let apiSettings: StoreSettings | null = null;

  let fsProducts: Product[] | null = null;
  let fsOrders: Order[] | null = null;
  let fsSettings: StoreSettings | null = null;

  // 1. Fetch from Express Server API (Primary ultra-fast source ~10ms)
  const apiFetchPromise = (async () => {
    try {
      const res = await fetch('/api/data?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (Array.isArray(data.products)) apiProducts = data.products;
          if (Array.isArray(data.orders)) apiOrders = data.orders;
          if (data.settings && typeof data.settings === 'object') apiSettings = data.settings;
        }
      }
    } catch (e) {
      console.warn('Express API fetch notice:', e);
    }
  })();

  // 2. Fetch from Firestore concurrently (non-blocking)
  const firestoreFetchPromise = (async () => {
    try {
      const [ordersSnap, productsSnap, settingsDoc] = await Promise.all([
        getDocs(collection(db, 'orders')).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'orders');
          return null;
        }),
        getDocs(collection(db, 'products')).catch((err) => {
          handleFirestoreError(err, OperationType.LIST, 'products');
          return null;
        }),
        getDoc(doc(db, 'settings', 'store_settings')).catch((err) => {
          handleFirestoreError(err, OperationType.GET, 'settings/store_settings');
          return null;
        }),
      ]);

      if (ordersSnap) {
        fsOrders = [];
        ordersSnap.forEach((d) => d.exists() && fsOrders!.push(d.data() as Order));
      }
      if (productsSnap) {
        fsProducts = [];
        productsSnap.forEach((d) => d.exists() && fsProducts!.push(d.data() as Product));
      }
      if (settingsDoc && settingsDoc.exists()) {
        fsSettings = settingsDoc.data() as StoreSettings;
      }
    } catch (e) {}
  })();

  // Wait for the fast API response first, or max 800ms for Firestore if API is unavailable
  await withTimeout(apiFetchPromise, 800).catch(() => {});
  if (apiProducts === null) {
    await withTimeout(firestoreFetchPromise, 800).catch(() => {});
  }

  const localProducts = getStoredProducts().filter((p) => p && p.id);
  const localOrders = getStoredOrders().filter((o) => o && o.id);
  const localSettings = getStoredSettings();

  // Authoritative remote selection
  let products: Product[];
  if (apiProducts !== null) {
    products = apiProducts;
  } else if (fsProducts !== null) {
    products = fsProducts;
  } else {
    products = localProducts;
  }

  let orders: Order[];
  if (apiOrders !== null) {
    orders = apiOrders;
  } else if (fsOrders !== null) {
    orders = fsOrders;
  } else {
    orders = localOrders;
  }

  let settings: StoreSettings;
  if (apiSettings !== null || fsSettings !== null) {
    settings = mergeSettingsObjects(DEFAULT_SETTINGS, fsSettings, apiSettings);
  } else {
    settings = mergeSettingsObjects(DEFAULT_SETTINGS, localSettings);
  }

  // Update local cache so it matches the authoritative state instantly
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}

  return { products, orders, settings };
}

// Live real-time subscription for instant multi-device syncing with active Firestore listeners & version polling
export function subscribeToFirestore(
  onDataUpdate: (data: { products?: Product[]; orders?: Order[]; settings?: StoreSettings; newOrders?: Order[] }) => void,
  onError?: (errMessage: string) => void
) {
  let lastServerVersion = 0;
  let isPolling = false;

  // Active Firestore onSnapshot listeners for instant broadcasting across clients
  let unsubFsProducts: (() => void) | null = null;
  let unsubFsOrders: (() => void) | null = null;
  let unsubFsSettings: (() => void) | null = null;

  try {
    unsubFsProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const fsProds: Product[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Product;
            if (data && data.id) fsProds.push(data);
          }
        });

        try {
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(fsProds));
        } catch (e) {}
        onDataUpdate({ products: fsProds });
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
      }
    );
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'products');
  }

  try {
    unsubFsOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const fsOrds: Order[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as Order;
            if (data && data.id) fsOrds.push(data);
          }
        });

        const localOrds = getStoredOrders();
        const localIds = new Set(localOrds.map((o) => o.id));
        const newIncomingOrders = fsOrds.filter((o) => !localIds.has(o.id));

        try {
          localStorage.setItem(ORDERS_KEY, JSON.stringify(fsOrds));
        } catch (e) {}
        onDataUpdate({ orders: fsOrds, newOrders: newIncomingOrders });
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      }
    );
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'orders');
  }

  try {
    unsubFsSettings = onSnapshot(
      doc(db, 'settings', 'store_settings'),
      (docSnap) => {
        if (docSnap.exists()) {
          const fsSet = docSnap.data() as StoreSettings;
          if (fsSet) {
            const localSet = getStoredSettings();
            const mergedSet = mergeSettingsObjects(localSet, fsSet);
            try {
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSet));
            } catch (e) {}
            onDataUpdate({ settings: mergedSet });
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, 'settings/store_settings');
      }
    );
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'settings/store_settings');
  }

  // Fast light-weight version check (sub-10ms endpoint check)
  const pollServerVersion = async () => {
    if (isPolling) return;
    isPolling = true;
    try {
      const vRes = await fetch('/api/version?t=' + Date.now(), { cache: 'no-store' });
      if (vRes.ok) {
        const vData = await vRes.json();
        if (vData && vData.version && vData.version !== lastServerVersion) {
          lastServerVersion = vData.version;
          const freshData = await fetchServerData();
          if (freshData) {
            onDataUpdate(freshData);
          }
        }
      }
    } catch (e) {
    } finally {
      isPolling = false;
    }
  };

  // EventSource SSE real-time stream connection for instant sub-10ms server push
  let eventSource: EventSource | null = null;
  if (typeof window !== 'undefined' && 'EventSource' in window) {
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = async (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.type === 'DATA_UPDATED') {
            const fresh = await fetchServerData();
            if (fresh) onDataUpdate(fresh);
          }
        } catch (err) {}
      };
    } catch (e) {}
  }

  pollServerVersion();
  const intervalId = setInterval(pollServerVersion, 1000);

  const handleFocusOrVisible = () => {
    pollServerVersion();
  };

  const handleCrossTabSync = async () => {
    const freshData = await fetchServerData();
    if (freshData) {
      onDataUpdate(freshData);
    }
  };

  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'DATA_UPDATED') {
        handleCrossTabSync();
      }
    };
  }

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === PRODUCTS_KEY || e.key === ORDERS_KEY || e.key === SETTINGS_KEY) {
      handleCrossTabSync();
    }
  };

  window.addEventListener('focus', handleFocusOrVisible);
  document.addEventListener('visibilitychange', handleFocusOrVisible);
  window.addEventListener('storage', handleStorageChange);

  return () => {
    clearInterval(intervalId);
    if (eventSource) {
      try {
        eventSource.close();
      } catch (e) {}
    }
    window.removeEventListener('focus', handleFocusOrVisible);
    document.removeEventListener('visibilitychange', handleFocusOrVisible);
    window.removeEventListener('storage', handleStorageChange);
    if (syncChannel) {
      syncChannel.onmessage = null;
    }
    if (unsubFsProducts) unsubFsProducts();
    if (unsubFsOrders) unsubFsOrders();
    if (unsubFsSettings) unsubFsSettings();
  };
}

// Broadcast channel for zero-latency multi-tab sync
const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window ? new BroadcastChannel('stock_jahani_sync') : null;

export function notifyTabsOfChange() {
  if (syncChannel) {
    try {
      syncChannel.postMessage({ type: 'DATA_UPDATED', timestamp: Date.now() });
    } catch (e) {}
  }
}

export function fileToBase64(file: File, maxWidth = 2048, quality = 0.92): Promise<string> {
  return new Promise((resolve, reject) => {
    // If the file is already reasonably sized (< 2MB), keep original data url for 100% lossless clarity
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl || !file.type.startsWith('image/')) {
        resolve(dataUrl);
        return;
      }

      // If file is under 1.8MB, directly resolve original lossless image
      if (file.size <= 1.8 * 1024 * 1024) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width <= maxWidth && height <= maxWidth) {
          // No downscaling needed
          resolve(dataUrl);
          return;
        }

        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Enable high-quality smoothing for sharp textures and clean frames
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedBase64 = canvas.toDataURL(mimeType, quality);
        resolve(compressedBase64);
      };
      img.onerror = () => resolve(dataUrl);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Format numbers in Persian/Toman currency format
export function formatToman(amount: number): string {
  if (isNaN(amount)) return '۰ تومان';
  const formatted = amount.toLocaleString('fa-IR');
  return `${formatted} تومان`;
}

export async function checkProductStock(productId: string): Promise<Product | null> {
  const localProducts = getStoredProducts();
  const localProduct = localProducts.find((p) => p.id === productId) || null;

  try {
    const fetchApiPromise = fetch('/api/data?t=' + Date.now(), { cache: 'no-store' }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products)) {
          return data.products.find((p: Product) => p.id === productId) || null;
        }
      }
      return null;
    });

    const apiProduct = await withTimeout(fetchApiPromise, 1000).catch(() => null);
    if (apiProduct) {
      return apiProduct;
    }
  } catch (e) {}

  return localProduct;
}

export async function testTelegramNotification(settings: StoreSettings): Promise<{ success: boolean; message: string }> {
  try {
    const testPayload = {
      orderId: 'TEST-ORDER-123',
      orderCode: 'SJ-TEST',
      customerName: 'تست سیستم تلگرام',
      customerPhone: '09120000000',
      customerAddress: 'تهران - تست اتصال ربات تلگرام و Cloudflare',
      customer: {
        fullName: 'تست سیستم تلگرام',
        phone: '09120000000',
        province: 'تهران',
        city: 'تهران',
        address: 'تست اتصال ربات تلگرام و Cloudflare Worker',
        postalCode: '1234567890'
      },
      items: [
        { id: 'test-1', name: 'عینک آفتابی استوک آزمایشی', quantity: 1, price: 1500000 }
      ],
      totalPrice: formatToman(1500000),
      timestamp: new Date().toISOString(),
      telegramToken: settings.telegramBotToken || '8880696062:AAEqF5r7ZillJV8njxUGrbPyT9nQpAPES3M',
      chatId: settings.telegramChatId || '8574668861',
      webhookUrl: settings.telegramWebhookUrl
    };

    let webhookSuccess = false;
    if (settings.telegramWebhookUrl) {
      try {
        const whRes = await fetch(settings.telegramWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload),
        });
        webhookSuccess = whRes.ok || whRes.status < 400;
      } catch (whErr) {
        console.warn('Cloudflare Worker Test error:', whErr);
      }
    }

    const res = await fetch('/api/send-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    if (res.ok || webhookSuccess) {
      return { success: true, message: 'ارسال پیام تست به تلگرام / وب‌هوک با موفقیت انجام شد!' };
    } else {
      return { success: false, message: 'ارسال تست ناموفق بود. توکن ربات، چت آیدی یا آدرس Cloudflare Worker را بررسی کنید.' };
    }
  } catch (err: any) {
    return { success: false, message: `خطا در تست ارسال: ${err?.message || 'مشکل در شبکه'}` };
  }
}

export async function sendTelegramOrderNotification(order: Order, settings?: StoreSettings): Promise<boolean> {
  try {
    const payload = {
      orderId: order.id,
      orderCode: order.orderCode,
      customerName: order.customer.fullName,
      customerPhone: order.customer.phone,
      customerAddress: `${order.customer.province || ''} - ${order.customer.city || ''} - ${order.customer.address} (کد پستی: ${order.customer.postalCode || 'وارد نشده'})`,
      customer: order.customer,
      items: order.items.map((i) => ({
        id: i.product?.id || '',
        name: i.product?.title || 'عینک',
        quantity: i.quantity,
        price: i.product?.price || 0,
        product: i.product,
      })),
      totalPrice: formatToman(order.finalAmount),
      receiptUrl: order.paymentReceipt,
      timestamp: order.createdAt || new Date().toISOString(),
      telegramToken: settings?.telegramBotToken || '8880696062:AAEqF5r7ZillJV8njxUGrbPyT9nQpAPES3M',
      chatId: settings?.telegramChatId || '8574668861',
      webhookUrl: settings?.telegramWebhookUrl,
    };

    if (settings?.telegramWebhookUrl) {
      try {
        await fetch(settings.telegramWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (e) {}
    }

    const res = await fetch('/api/send-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.error('Telegram order notification error:', err);
    return false;
  }
}

export function sendNtfyOrderAlert(order: Order, settings?: StoreSettings): void {
  try {
    const currentSettings = settings || getStoredSettings();
    if (currentSettings.ntfyEnabled === false) return;

    const topic = currentSettings.ntfyTopic || 'stock_jahani_orders';
    const serverUrl = (currentSettings.ntfyServerUrl || 'https://ntfy.sh').replace(/\/+$/, '');
    const fullUrl = `${serverUrl}/${encodeURIComponent(topic)}`;

    const itemsSummary = order.items
      .map((i) => `${i.product.title} ×${i.quantity}`)
      .join('، ');

    fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Title': `New order - ${order.orderCode}`,
        'Priority': 'high',
        'Tags': 'bell,shopping_bags',
      },
      body: `سفارش جدید ثبت شد\n${order.customer.fullName} - ${order.customer.phone}\n${itemsSummary}\nمبلغ: ${formatToman(order.finalAmount)}`,
    }).catch(() => {});
  } catch (e) {}
}

// Convert English numbers to Persian digits for display
export function toPersianDigits(str: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(str).replace(/\d/g, (x) => persianDigits[parseInt(x)]);
}

// Generate human-readable short order IDs
export function generateOrderCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `SJ-${num}`;
}

// Export full backup of products, orders, and settings
export function exportBackupData(): string {
  const backup = {
    products: getStoredProducts(),
    orders: getStoredOrders(),
    settings: getStoredSettings(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(backup, null, 2);
}

// Import full backup
export function importBackupData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (data && Array.isArray(data.products)) {
      saveStoredProducts(data.products);
    }
    if (data && Array.isArray(data.orders)) {
      saveStoredOrders(data.orders);
    }
    if (data && data.settings && typeof data.settings === 'object') {
      saveStoredSettings(data.settings);
    }
    return true;
  } catch (err) {
    console.error('Failed to import backup:', err);
    return false;
  }
}

// Visitor Tracking & Live Analytics
const VISITOR_ID_KEY = 'stock_jahani_vid';

export function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch (e) {
    return `v_anon_${Date.now()}`;
  }
}

export async function trackPageVisit(page: string = '/'): Promise<VisitorStats | null> {
  try {
    const visitorId = getOrCreateVisitorId();
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent : ''
    );
    const device = isMobile ? 'mobile' : 'desktop';
    const referrer = typeof document !== 'undefined' ? document.referrer : '';

    const res = await fetch('/api/analytics/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, page, device, referrer }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.stats || null;
    }
  } catch (e) {}
  return null;
}

export async function fetchVisitorStats(): Promise<VisitorStats> {
  try {
    const res = await fetch('/api/analytics/stats?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {}

  return {
    totalViews: 0,
    uniqueVisitors: 0,
    todayViews: 0,
    todayUnique: 0,
    activeOnline: 1,
    recentVisits: [],
    dailyStats: [],
  };
}

export function sendHeartbeat(page: string = '/') {
  try {
    const visitorId = getOrCreateVisitorId();
    fetch('/api/analytics/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, page }),
    }).catch(() => {});
  } catch (e) {}
}

/**
 * Strips dangerous HTML tags and script injections for robust security.
 */
export function sanitizeTextInput(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

export const WISHLIST_KEY = 'stock_jahani_wishlist_v1';
export const REVIEWS_KEY = 'stock_jahani_reviews_v1';

export function getStoredWishlist(): string[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

export const getWishlistIds = getStoredWishlist;

export function saveStoredWishlist(ids: string[]) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids));
  } catch (e) {}
}

export const saveWishlistIds = saveStoredWishlist;

export function isProductInWishlist(productId: string): boolean {
  const list = getStoredWishlist();
  return list.includes(productId);
}

export function toggleWishlistId(productId: string): string[] {
  const current = getStoredWishlist();
  const exists = current.includes(productId);
  let updated: string[];
  if (exists) {
    updated = current.filter((id) => id !== productId);
  } else {
    updated = [...current, productId];
  }
  saveStoredWishlist(updated);
  return updated;
}

export function toggleWishlistProduct(productId: string): { inWishlist: boolean; total: number } {
  const current = getStoredWishlist();
  const exists = current.includes(productId);
  const updated = toggleWishlistId(productId);
  return { inWishlist: !exists, total: updated.length };
}

export const DEFAULT_CUSTOMER_REVIEWS: Array<{
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
}> = [
  {
    id: 'rev-1',
    productId: 'all',
    customerName: 'رضا کمالی (تهران)',
    rating: 5,
    comment: 'کیفیت فریم عینک واقعاً فوق‌العاده است. عدسی پلاریزه‌اش موقع رانندگی در آفتاب شدید عالی عمل کرد. بسته‌بندی هاردکیس هم کاملاً ضدضربه بود.',
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'rev-2',
    productId: 'all',
    customerName: 'مریم صالحی (اصفهان)',
    rating: 5,
    comment: 'عینک دستم رسید، دقیقاً مثل عکس و حتی تمیزتر و شیک‌تر. استاندارد UV400 رو پیش اپتومتریست تست کردم کاملاً تایید شد.',
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'rev-3',
    productId: 'all',
    customerName: 'حسام نوری (شیراز)',
    rating: 5,
    comment: 'ارسال با پست پیشتاز سریع بود و کد ۲۴ رقمی رهگیری پیامک شد. از راهنمای فرم صورت استفاده کردم و فریم دقیقاً مناسب صورتم بود.',
    isVerifiedPurchase: true,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  }
];

export function getStoredReviews(productId?: string): typeof DEFAULT_CUSTOMER_REVIEWS {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    let allReviews = DEFAULT_CUSTOMER_REVIEWS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        allReviews = parsed;
      }
    }
    if (!productId) return allReviews;
    return allReviews.filter((r) => r.productId === productId || r.productId === 'all');
  } catch (e) {
    return DEFAULT_CUSTOMER_REVIEWS;
  }
}

export function saveStoredReview(review: {
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
}): typeof DEFAULT_CUSTOMER_REVIEWS {
  try {
    const cleanReview = {
      id: `rev-${Date.now()}`,
      productId: review.productId || 'all',
      customerName: sanitizeTextInput(review.customerName) || 'خریدار محترم',
      rating: Math.min(5, Math.max(1, review.rating || 5)),
      comment: sanitizeTextInput(review.comment),
      isVerifiedPurchase: true,
      createdAt: new Date().toISOString(),
    };

    const current = getStoredReviews();
    const updated = [cleanReview, ...current];
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));

    // Send to backend API
    fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review: cleanReview }),
    }).catch(() => {});

    return updated;
  } catch (e) {
    return DEFAULT_CUSTOMER_REVIEWS;
  }
}



