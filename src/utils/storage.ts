import { Product, Order, OrderStatus, StoreSettings, CategoryItem, CouponCode, VisitorStats, VisitLog, AuditLogEntry } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, writeBatch, onSnapshot, query, orderBy, limit, runTransaction } from 'firebase/firestore';

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

// Secure Admin session token helpers
export function getAdminToken(): string {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('admin_auth_token') || '';
  }
  return '';
}

export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('admin_auth_token');
    sessionStorage.removeItem('admin_session_auth');
    sessionStorage.removeItem('adminAuthorized');
    sessionStorage.removeItem('admin');
    localStorage.removeItem('admin_auth_token');
    localStorage.removeItem('admin_session_auth');
    localStorage.removeItem('adminAuthorized');
    localStorage.removeItem('admin');
  }
}

export async function checkServerAdminSession(): Promise<boolean> {
  const token = getAdminToken();
  if (!token) {
    clearAdminSession();
    return false;
  }
  try {
    const res = await fetch('/api/admin/verify-session', {
      headers: getAdminAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.authenticated === true) {
        return true;
      }
    }
  } catch (e) {
    // Network or server issue
  }
  clearAdminSession();
  return false;
}

export function getAdminAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-admin-token'] = token;
  }
  return headers;
}

// In-memory runtime state for zero-latency UI reactivity; Firestore remains 100% authoritative
let inMemoryProducts: Product[] = [];
const SETTINGS_KEY = 'stock_jahani_settings_v1';

export function getProductTimestamp(item: any): number {
  if (!item) return 0;
  const t = item.updatedAt || item.createdAt;
  if (!t) return 0;
  const parsed = new Date(t).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

export function mergeTwoProducts(p1: Product, p2: Product): Product {
  const t1 = getProductTimestamp(p1);
  const t2 = getProductTimestamp(p2);
  if (t2 > t1) {
    return { ...p1, ...p2 };
  } else if (t1 > t2) {
    return { ...p2, ...p1 };
  } else {
    return { ...p1, ...p2 };
  }
}

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
  cardNumber: '6037-9975-1234-5678',
  cardHolderName: 'بهنام جهانی',
  bankName: 'بانک ملی ایران',
  accountNumber: '0102030405006',
  shebaNumber: 'IR120170000000102030405006',
  paymentLink: '',
  ntfyEnabled: true,
  ntfyTopic: 'stock_jahani_orders',
  ntfyServerUrl: 'https://ntfy.sh',
};

// Ready sample products if user requests demo items or initial launch
export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'stk-rb3025-aviator',
    title: 'عینک آفتابی خلبانی ری‌بن Aviator طلایی استوک اورجینال',
    code: 'STK-RB3025',
    category: 'sunglasses',
    price: 1850000,
    originalPrice: 2400000,
    frameType: 'فلزی آبکاری طلا ۲۴ عیار',
    lensColor: 'دودی سبز G-15 ضد انعکاس',
    uvProtection: 'استاندارد UV400 پولاریزه',
    gender: 'اسپرت (یونی‌سکس)',
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'عینک خلبانی نمادین ری‌بن استوک وارداتی سفارش اروپا. فریم طلایی مقاوم با دسته‌های ارگونومیک، عدسی شیشه‌ای G-15 با فیلتر کامل اشعه فرابنفش، مناسب رانندگی و استفاده روزمره.',
    features: ['عدسی شیشه‌ای ضدخش کریستال', 'فیلتر کامل UV400 و پولاریزه', 'پدهای بینی سیلیکونی نرم ضد حساسیت', 'جعبه و دستمال نانو اورجینال'],
    stock: 4,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'stk-rb2140-wayfarer',
    title: 'عینک ویفرر کلاسیک مشکی مات Wayfarer ایتالیا',
    code: 'STK-RB2140',
    category: 'sunglasses',
    price: 1680000,
    originalPrice: 2100000,
    frameType: 'کائوچو استات دست‌ساز ایتالیا',
    lensColor: 'مشکی دودی گرادینت UV400',
    uvProtection: 'استاندارد UV400 محافظ کامل',
    gender: 'اسپرت (یونی‌سکس)',
    images: [
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'مدل افسانه‌ای ویفرر با بدنه استات مشکی مات فوق‌العاده باکیفیت. لولاهای ۷ پین فلزی ضد شکستگی و عدسی‌های فیلترکننده نورهای مزاحم محیطی.',
    features: ['بدنه کائوچویی فوق‌العاده مقاوم', 'لولاهای فولادی ضدزنگ ۷ خار', 'طراحی رترو و وینتیج ماندگار', 'مناسب تمام فرم‌های صورت'],
    stock: 5,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'stk-rb3016-clubmaster',
    title: 'عینک کلاب‌مستر کلاسیک Clubmaster مشکی و طلایی',
    code: 'STK-RB3016',
    category: 'sunglasses',
    price: 1920000,
    originalPrice: 2500000,
    frameType: 'ترکیب استات استوک و آلیاژ برنجی',
    lensColor: 'قهوه‌ای هایلایت UV400',
    uvProtection: 'UV400 + Polarized',
    gender: 'مردانه',
    images: [
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'طراحی نیم‌فریم ابرویی بی‌نظیر کلاب‌مستر با جزییات طلایی چشم‌نواز. انتخابی اصیل برای استایل‌های کلاسیک و رسمی مردانه.',
    features: ['فریم نیمه نیم‌کائوچویی با زهوار طلایی', 'عدسی محافظت کامل در برابر بازتاب نور', 'حک لیزری برند روی عدسی', 'قاب چرمی محافظ'],
    stock: 3,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'opt-vintage-round-501',
    title: 'فریم طبی گرد وینتیج Vintage Round ترند روز',
    code: 'OPT-VR501',
    category: 'optical',
    price: 1290000,
    originalPrice: 1600000,
    frameType: 'تیتانیوم سبک ضد حساسیت',
    lensColor: 'بلوکات آنتی رفلکس (شفاف)',
    uvProtection: 'محافظ نور آبی مانیتور (Blue Control)',
    gender: 'اسپرت (یونی‌سکس)',
    images: [
      'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'فریم طبی بسیار سبک و خوش‌ساخت برای استفاده پشت سیستم و مطالعه طولانی. قابلیت تعویض عدسی با نمره چشم شما در هر بینایی‌سنجی.',
    features: ['وزن بسیار کم کمتر از ۱۶ گرم', 'جلوگیری از خستگی چشم پشت کامپیوتر', 'آلیاژ تیتانیوم انعطاف‌پذیر', 'قابلیت نصب تمام نمرات طبی'],
    stock: 6,
    isFeatured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'stk-cartier-panthere',
    title: 'عینک آفتابی لوکس کارتیه مدل پانتر نگین‌دار استوک',
    code: 'STK-CT908',
    category: 'luxury',
    price: 2450000,
    originalPrice: 3200000,
    frameType: 'تمام فلزی آبکاری رودیوم نگین‌دار',
    lensColor: 'شیب‌رنگ بنفش دودی الماسه',
    uvProtection: 'استاندارد UV400 کامل',
    gender: 'زنانه',
    images: [
      'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'عینک بدون فریم لوکس کارتیه با دسته‌های تراش‌خورده و ظرافت شاهکار. مناسب مهمانی‌ها، مجالس و استایل‌های خاص زنانه.',
    features: ['عدسی‌های تراش‌خورده الماسه چندضلعی', 'بدنه لوکس بدون تغییر رنگ', 'حک شماره سریال کارتیه روی بازو', 'جعبه هاردکیس مخملی کارتیه'],
    stock: 2,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'opt-tomford-acetate',
    title: 'فریم طبی مستطیلی کائوچویی تام فورد Tom Ford',
    code: 'OPT-TF540',
    category: 'optical',
    price: 1750000,
    originalPrice: 2200000,
    frameType: 'استات کائوچویی چندلایه مات',
    lensColor: 'عدسی دموی شفاف قابل تعویض',
    uvProtection: 'UV400 بلوکات',
    gender: 'مردانه',
    images: [
      'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'فریم طبی مستطیلی با نشان فلزی معروف T شکل تام فورد روی لولاها. طراحی شیک و باوقار، مناسب استایل مدیران و محیط‌های اداری.',
    features: ['طراحی انحصاری T Logo تام فورد', 'پوشش مات ضد لک و ضد تعریق', 'مناسب برای نمرات ضعیف و آستیگمات', 'استقامت بسیار بالای بدنه'],
    stock: 3,
    isFeatured: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'spt-oakley-sportshield',
    title: 'عینک ورزشی و دوچرخه‌سواری ضد ضربه اوکلی',
    code: 'SPT-OK800',
    category: 'sport',
    price: 1420000,
    originalPrice: 1800000,
    frameType: 'پلیمر فشرده TR90 نشکن و منعطف',
    lensColor: 'جیوه‌ای هفت‌رنگ ضد بخار',
    uvProtection: 'UV400 + Polarized ورزش حرفه‌ای',
    gender: 'اسپرت (یونی‌سکس)',
    images: [
      'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'عینک مخصوص دویدن، کوهنوردی، دوچرخه‌سواری و اسکی با پوشش پانورامای کامل چشم. دارای منافذ هدایت باد جهت جلوگیری از بخار گرفتگی عدسی.',
    features: ['مقاومت بالا در برابر ضربه و سقوط', 'دید سراسری و بدون مانع میدان دید', 'روکش آب‌گریز نانو روی عدسی', 'بند مهار ورزشی ضمیمه'],
    stock: 4,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'stk-chanel-cateye',
    title: 'عینک آفتابی زنانه گربه‌ای استوک شنل Chanel',
    code: 'STK-CH302',
    category: 'sunglasses',
    price: 2150000,
    originalPrice: 2800000,
    frameType: 'کائوچویی براق مشکی پیانو',
    lensColor: 'دودی سایه‌روشن UV400',
    uvProtection: 'استاندارد UV400 محافظ کامل چشم',
    gender: 'زنانه',
    images: [
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&auto=format&fit=crop&q=80'
    ],
    description: 'فریم چشم‌گربه‌ای زنانه برند شنل با لوگوی نقره‌ای CC برجسته روی دسته‌ها. طراحی خیره‌کننده که فرم صورت را کشیده و جذاب‌تر نشان می‌دهد.',
    features: ['فریم صیقلی پیانویی بدون خط و خش', 'عدسی محافظ در برابر اشعه‌های UVA و UVB', 'ارگونومی استاندارد زنانه', 'دستمال ابریشمی و جلد اختصاصی'],
    stock: 3,
    isFeatured: true,
    createdAt: new Date().toISOString()
  }
];

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
  return [...inMemoryProducts];
}

export async function clearAllProductsRemote(): Promise<boolean> {
  console.log('[CLEAR_ALL_PRODUCTS_START]');
  try {
    const res = await fetch('/api/admin/clear-all-products', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
    });
    if (!res.ok) {
      const snap = await getDocs(collection(db, 'products'));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    console.log('[CLEAR_ALL_PRODUCTS_SUCCESS]');
  } catch (e) {
    console.error('Error clearing products in Firestore:', e);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (fsErr) {}
  }
  inMemoryProducts = [];
  notifyTabsOfChange();
  return true;
}

export async function loadDemoProductsRemote(): Promise<Product[]> {
  console.log('[LOAD_DEMO_PRODUCTS_START]');
  try {
    const res = await fetch('/api/admin/load-demo-products', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ products: DEMO_PRODUCTS }),
    });
    if (!res.ok) {
      const batch = writeBatch(db);
      DEMO_PRODUCTS.forEach((p) => {
        if (p && p.id) {
          batch.set(doc(db, 'products', p.id), cleanForFirestore(p));
        }
      });
      await batch.commit();
    }
    console.log(`[LOAD_DEMO_PRODUCTS_SUCCESS] Loaded ${DEMO_PRODUCTS.length} demo products to Firestore`);
  } catch (e) {
    console.error('Error loading demo products to Firestore:', e);
    try {
      const batch = writeBatch(db);
      DEMO_PRODUCTS.forEach((p) => {
        if (p && p.id) {
          batch.set(doc(db, 'products', p.id), cleanForFirestore(p));
        }
      });
      await batch.commit();
    } catch (fsErr) {}
  }
  inMemoryProducts = [...DEMO_PRODUCTS];
  notifyTabsOfChange();
  return DEMO_PRODUCTS;
}

export async function saveSingleProduct(product: Product, actor?: string): Promise<boolean> {
  if (!product || !product.id) {
    console.error('[PRODUCT_CREATE_ERROR] Invalid product object or missing ID', product);
    return false;
  }
  
  console.log('[PRODUCT_CREATE_START]', {
    id: product.id,
    title: product.title,
    code: product.code,
    price: product.price,
    stock: product.stock,
    category: product.category,
  });

  const now = new Date().toISOString();
  const cleanP: Product = { 
    ...product, 
    createdAt: product.createdAt || now,
    updatedAt: now,
  };
  
  const payload = cleanForFirestore(cleanP);

  // 1. Authoritative write through server API proxy or Firestore
  try {
    const res = await fetch('/api/products/save', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ product: cleanP, actor: actor || 'مدیریت (Admin Panel)' }),
    });
    if (res.ok) {
      console.log('[API_PRODUCT_WRITE_SUCCESS]', { id: cleanP.id, title: cleanP.title });
    } else {
      await setDoc(doc(db, 'products', cleanP.id), payload);
      console.log('[FIRESTORE_WRITE_SUCCESS]', { id: cleanP.id, title: cleanP.title });
    }
  } catch (err: any) {
    try {
      await setDoc(doc(db, 'products', cleanP.id), payload);
      console.log('[FIRESTORE_FALLBACK_WRITE_SUCCESS]', { id: cleanP.id, title: cleanP.title });
    } catch (fsErr: any) {
      console.error('[PRODUCT_CREATE_ERROR] Firestore write failed:', fsErr);
      throw new Error(fsErr?.message || 'خطا در برقراری ارتباط و ذخیره در دیتابیس Firestore');
    }
  }

  // 2. In-memory runtime state update
  inMemoryProducts = [cleanP, ...inMemoryProducts.filter((p) => p && p.id !== product.id)];
  notifyTabsOfChange();
  
  return true;
}

export async function saveStoredProducts(products: Product[]): Promise<boolean> {
  const validProducts = (products || []).filter((p) => p && p.id).map((p) => ({
    ...p,
    updatedAt: p.updatedAt || new Date().toISOString(),
  }));

  inMemoryProducts = validProducts;
  notifyTabsOfChange();
  return true;
}

export function getStoredOrders(): Order[] {
  return [];
}

export async function resetAllStoreData(): Promise<boolean> {
  try {
    inMemoryProducts = [];
    notifyTabsOfChange();

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
  notifyTabsOfChange();
  return true;
}

export async function saveSingleOrder(order: Order, actor?: string): Promise<{ success: boolean; error?: string }> {
  const cleanOrder: Order = {
    ...cleanForFirestore(order),
    customerUid: auth.currentUser?.uid || order.customerUid || order.customerId || '',
    customerId: auth.currentUser?.uid || order.customerId || order.customerUid || '',
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString(),
  };

  try {
    // 1. Strict Atomic Transaction on Firestore: guarantees atomic stock decrement & race-free order creation
    await runTransaction(db, async (transaction) => {
      // Step A: Read current stock for all items
      const productUpdates: { ref: any; newStock: number; title: string }[] = [];

      for (const item of cleanOrder.items) {
        if (!item.product || !item.product.id) continue;
        const pRef = doc(db, 'products', item.product.id);
        const pDoc = await transaction.get(pRef);

        if (!pDoc.exists()) {
          throw new Error(`عینک «${item.product.title || item.product.id}» در فروشگاه یافت نشد.`);
        }

        const pData = pDoc.data() as Product;
        const currentStock = typeof pData.stock === 'number' ? pData.stock : 0;

        if (currentStock < item.quantity) {
          throw new Error(
            `متأسفانه موجودی عینک «${pData.title}» کافی نیست (موجودی فعلی: ${currentStock} عدد، درخواستی: ${item.quantity} عدد).`
          );
        }

        productUpdates.push({
          ref: pRef,
          newStock: currentStock - item.quantity,
          title: pData.title,
        });
      }

      // Step B: Atomically decrement stock
      for (const update of productUpdates) {
        transaction.update(update.ref, {
          stock: update.newStock,
          updatedAt: new Date().toISOString(),
        });
      }

      // Step C: Atomically write order document
      const orderRef = doc(db, 'orders', cleanOrder.id);
      transaction.set(orderRef, cleanOrder);

      // Step D: Write audit log
      const auditRef = doc(db, 'audit_logs', `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);
      transaction.set(auditRef, {
        id: auditRef.id,
        timestamp: new Date().toISOString(),
        action: 'ثبت سفارش جدید',
        details: `سفارش #${cleanOrder.orderCode} توسط ${cleanOrder.customer?.fullName || 'مشتری'} به مبلغ ${cleanOrder.finalAmount.toLocaleString('fa-IR')} تومان ثبت شد.`,
        actor: actor || (cleanOrder.customer?.fullName ? `مشتری: ${cleanOrder.customer.fullName}` : 'مشتری آنلاین'),
        orderId: cleanOrder.id,
      });
    });

    console.log('[FIRESTORE_ORDER_TRANSACTION_SUCCESS]', cleanOrder.id);
    notifyTabsOfChange();

    return { success: true };
  } catch (err: any) {
    console.error('[FIRESTORE_ORDER_TRANSACTION_ERROR]', err);
    handleFirestoreError(err, OperationType.WRITE, `orders/${cleanOrder.id}`);
    return {
      success: false,
      error: err?.message || 'خطا در ثبت سفارش در پایگاه داده ابری فایراستور',
    };
  }
}

export function getStoredSettings(): StoreSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(data);
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

  // 1. Authoritative write through backend API proxy
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ settings: updatedSettings }),
    });
    if (!res.ok) {
      await setDoc(doc(db, 'settings', 'store_settings'), cleanForFirestore(updatedSettings));
    }
    console.log('[SETTINGS_SAVE_SUCCESS]');
  } catch (err) {
    try {
      await setDoc(doc(db, 'settings', 'store_settings'), cleanForFirestore(updatedSettings));
      console.log('[FIRESTORE_SETTINGS_SUCCESS]');
    } catch (fsErr) {
      console.error('[FIRESTORE_SETTINGS_ERROR]', fsErr);
      handleFirestoreError(fsErr, OperationType.WRITE, 'settings/store_settings');
    }
  }

  return true;
}

export async function deleteProductFromFirestore(productId: string, actor?: string): Promise<boolean> {
  if (!productId) return false;
  console.log('[PRODUCT_DELETE_START]', productId);

  // 1. Authoritative deletion through API proxy or direct Firestore
  try {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
    if (!res.ok) {
      await deleteDoc(doc(db, 'products', productId));
    }
    console.log('[PRODUCT_DELETE_SUCCESS]', productId);
  } catch (err: any) {
    try {
      await deleteDoc(doc(db, 'products', productId));
      console.log('[FIRESTORE_DELETE_SUCCESS]', productId);
    } catch (fsErr: any) {
      console.error('[PRODUCT_DELETE_ERROR]', fsErr);
      throw new Error(fsErr?.message || 'خطا در حذف محصول از دیتابیس Firestore');
    }
  }

  // 2. In-memory runtime state update
  inMemoryProducts = inMemoryProducts.filter((p) => p.id !== productId);
  notifyTabsOfChange();

  return true;
}

export async function deleteOrderFromFirestore(orderId: string, actor?: string): Promise<boolean> {
  if (!orderId) return false;

  // 1. Authoritative Firestore deletion with API proxy or direct fallback
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders(),
    });
    if (!res.ok) {
      await deleteDoc(doc(db, 'orders', orderId));
    }
    console.log('[ORDER_DELETE_SUCCESS]', orderId);
  } catch (err: any) {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      console.log('[FIRESTORE_ORDER_DELETE_SUCCESS]', orderId);
    } catch (fsErr: any) {
      console.error('[ORDER_DELETE_ERROR]', fsErr);
      handleFirestoreError(fsErr, OperationType.DELETE, `orders/${orderId}`);
      throw new Error(fsErr?.message || 'خطا در حذف سفارش از دیتابیس فایراستور');
    }
  }

  notifyTabsOfChange();

  return true;
}

export async function updateOrderStatusRemote(
  orderId: string,
  status: OrderStatus,
  postalTrackingCode?: string,
  adminNote?: string,
  actor?: string
): Promise<boolean> {
  if (!orderId) return false;

  const patch: Record<string, any> = {
    orderId,
    status,
    updatedAt: new Date().toISOString(),
  };
  if (postalTrackingCode !== undefined) patch.postalTrackingCode = postalTrackingCode;
  if (adminNote !== undefined) patch.adminNote = adminNote;
  if (actor) patch.actor = actor;

  // 1. Authoritative update through API proxy or direct Firestore
  try {
    const res = await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      await updateDoc(doc(db, 'orders', orderId), patch);
    }
    console.log('[ORDER_STATUS_SUCCESS]', orderId, status);
  } catch (err: any) {
    try {
      await updateDoc(doc(db, 'orders', orderId), patch);
      console.log('[FIRESTORE_ORDER_STATUS_SUCCESS]', orderId, status);
    } catch (fsErr: any) {
      console.error('[ORDER_STATUS_UPDATE_ERROR]', fsErr);
      handleFirestoreError(fsErr, OperationType.UPDATE, `orders/${orderId}`);
      throw new Error(fsErr?.message || 'خطا در به‌روزرسانی وضعیت سفارش در دیتابیس فایراستور');
    }
  }

  notifyTabsOfChange();

  return true;
}

// Fetch authoritative shared data directly from Firestore or backend API
export async function fetchServerData(): Promise<{ products: Product[]; orders: Order[]; settings: StoreSettings }> {
  let fsProducts: Product[] | null = null;
  let fsOrders: Order[] | null = null;
  let fsSettings: StoreSettings | null = null;

  try {
    const [productsSnap, settingsDoc] = await Promise.all([
      withTimeout(getDocs(collection(db, 'products')), 4000).catch((err) => {
        handleFirestoreError(err, OperationType.LIST, 'products');
        return null;
      }),
      withTimeout(getDoc(doc(db, 'settings', 'store_settings')), 3000).catch((err) => {
        handleFirestoreError(err, OperationType.GET, 'settings/store_settings');
        return null;
      }),
    ]);

    if (productsSnap) {
      fsProducts = [];
      productsSnap.forEach((d) => {
        if (d.exists()) {
          const data = d.data() as Product;
          if (data && data.id) fsProducts!.push(data);
        }
      });
      inMemoryProducts = [...fsProducts];
    }

    if (settingsDoc && settingsDoc.exists()) {
      fsSettings = settingsDoc.data() as StoreSettings;
    }
  } catch (e) {
    console.warn('Firestore fetch notice in fetchServerData:', e);
  }

  // If products weren't fetched from client SDK, fallback to backend API
  if (!fsProducts || fsProducts.length === 0) {
    try {
      const pRes = await fetch('/api/products');
      if (pRes.ok) {
        const pJson = await pRes.json();
        if (Array.isArray(pJson) && pJson.length > 0) {
          fsProducts = pJson;
          inMemoryProducts = [...fsProducts];
        }
      }
    } catch (e) {}
  }

  // If settings weren't fetched from client SDK, fallback to backend API
  if (!fsSettings) {
    try {
      const sRes = await fetch('/api/settings');
      if (sRes.ok) {
        const sJson = await sRes.json();
        if (sJson.success && sJson.settings) {
          fsSettings = sJson.settings;
        }
      }
    } catch (e) {}
  }

  // Admin order fetching: if admin token present or admin session active, query orders
  if (getAdminToken()) {
    try {
      const ordRes = await fetch('/api/orders', {
        headers: getAdminAuthHeaders(),
      });
      if (ordRes.ok) {
        const ordJson = await ordRes.json();
        if (ordJson.success && Array.isArray(ordJson.orders)) {
          fsOrders = ordJson.orders;
        }
      }
    } catch (e) {
      console.warn('Failed to load admin orders from /api/orders:', e);
    }
  }

  const products = fsProducts || inMemoryProducts || [];
  products.sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const orders = fsOrders || [];
  orders.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  const localSettings = getStoredSettings();
  const settings = fsSettings ? mergeSettingsObjects(DEFAULT_SETTINGS, localSettings, fsSettings) : localSettings;

  return { products, orders, settings };
}

// Live real-time subscription for instant multi-device syncing with authoritative Firestore listeners
export function subscribeToFirestore(
  onDataUpdate: (data: { products?: Product[]; orders?: Order[]; settings?: StoreSettings; newOrders?: Order[]; auditLogs?: AuditLogEntry[] }) => void,
  onError?: (errMessage: string) => void
) {
  const ordersMap = new Map<string, Order>();
  let hasInitialOrdersLoaded = false;

  let unsubFsProducts: (() => void) | null = null;
  let unsubFsOrders: (() => void) | null = null;
  let unsubFsSettings: (() => void) | null = null;
  let unsubFsAuditLogs: (() => void) | null = null;

  try {
    unsubFsProducts = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const products: Product[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Product;
          if (data && data.id) {
            products.push(data);
          }
        });

        products.sort((a, b) => {
          const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return timeB - timeA;
        });

        inMemoryProducts = products;
        onDataUpdate({ products });
      },
      (err) => {
        console.error('[SNAPSHOT_ERROR]', err);
        handleFirestoreError(err, OperationType.LIST, 'products');
        if (onError) onError(err.message);
      }
    );
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'products');
  }

  try {
    unsubFsOrders = onSnapshot(
      collection(db, 'orders'),
      (snapshot) => {
        const newlyAddedOrders: Order[] = [];
        const seenIds = new Set<string>();

        snapshot.forEach((docSnap) => {
          const docData = docSnap.data() as Order;
          if (docData && docData.id) {
            seenIds.add(docData.id);
            if (hasInitialOrdersLoaded && !ordersMap.has(docData.id)) {
              newlyAddedOrders.push(docData);
            }
            ordersMap.set(docData.id, docData);
          }
        });

        for (const existingId of ordersMap.keys()) {
          if (!seenIds.has(existingId)) {
            ordersMap.delete(existingId);
          }
        }

        hasInitialOrdersLoaded = true;

        const fsOrds = Array.from(ordersMap.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        onDataUpdate({ orders: fsOrds, newOrders: newlyAddedOrders });
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'orders');
        if (onError) onError(err.message);
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

  try {
    const auditQuery = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
    unsubFsAuditLogs = onSnapshot(
      auditQuery,
      (snapshot) => {
        const logs: AuditLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            logs.push(docSnap.data() as AuditLogEntry);
          }
        });
        onDataUpdate({ auditLogs: logs });
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'audit_logs');
      }
    );
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'audit_logs');
  }

  const handleCrossTabSync = () => {
    onDataUpdate({ products: [...inMemoryProducts] });
  };

  if (syncChannel) {
    syncChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'DATA_UPDATED') {
        handleCrossTabSync();
      }
    };
  }

  return () => {
    if (syncChannel) {
      syncChannel.onmessage = null;
    }
    if (unsubFsProducts) unsubFsProducts();
    if (unsubFsOrders) unsubFsOrders();
    if (unsubFsSettings) unsubFsSettings();
    if (unsubFsAuditLogs) unsubFsAuditLogs();
  };
}

// Live real-time subscription specifically for Audit Logs directly from Firestore
export function subscribeToAuditLogs(
  onLogsUpdate: (logs: AuditLogEntry[]) => void,
  onError?: (err: unknown) => void
): () => void {
  let unsub: (() => void) | null = null;
  try {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
    unsub = onSnapshot(
      q,
      (snapshot) => {
        const logs: AuditLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          if (docSnap.exists()) {
            logs.push(docSnap.data() as AuditLogEntry);
          }
        });
        onLogsUpdate(logs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'audit_logs');
        if (onError) onError(err);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'audit_logs');
    if (onError) onError(err);
  }

  // Also initial fetch from backend API
  fetchAuditLogs().then((logs) => {
    if (logs && logs.length > 0) {
      onLogsUpdate(logs);
    }
  }).catch(() => {});

  return () => {
    if (unsub) unsub();
  };
}

// Fetch audit logs from server API
export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  try {
    const res = await fetch('/api/audit-logs', { 
      cache: 'no-store',
      headers: getAdminAuthHeaders(),
    });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data.logs) ? data.logs : (Array.isArray(data) ? data : []);
    }
  } catch (e) {
    console.warn('Failed to fetch audit logs from backend API:', e);
  }
  return [];
}

// Clear audit logs on server and Firestore
export async function clearAuditLogsRemote(): Promise<boolean> {
  try {
    const res = await fetch('/api/audit-logs/clear', { 
      method: 'POST',
      headers: getAdminAuthHeaders(),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Manually record an audit log entry
export async function recordAuditLog(entry: {
  action: 'create' | 'update' | 'delete' | 'webhook_trigger' | 'status_change';
  targetType: 'product' | 'order' | 'settings';
  targetId: string;
  targetTitle?: string;
  actor: string;
  details: string;
  diff?: Record<string, { old: any; new: any }>;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/audit-logs', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify(entry),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Test trigger Firestore onUpdate webhook handler
export async function triggerTestFirestoreWebhook(
  type: 'order' | 'product',
  customMessage?: string
): Promise<{ success: boolean; message: string; payload?: any }> {
  try {
    const res = await fetch('/api/webhooks/test-firestore-trigger', {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ type, customMessage }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error' };
  }
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
  if (localProduct) return localProduct;

  try {
    const snap = await getDoc(doc(db, 'products', productId));
    if (snap.exists()) {
      return snap.data() as Product;
    }
  } catch (e) {}

  return null;
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
}> = [];

export function getStoredReviews(productId?: string): typeof DEFAULT_CUSTOMER_REVIEWS {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    let allReviews: typeof DEFAULT_CUSTOMER_REVIEWS = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any hardcoded legacy fake reviews
        allReviews = parsed.filter(
          (r) => r && r.id && !['rev-1', 'rev-2', 'rev-3'].includes(r.id) && r.productId !== 'all'
        );
      }
    }
    if (!productId) return allReviews;
    return allReviews.filter((r) => r.productId === productId);
  } catch (e) {
    return [];
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



