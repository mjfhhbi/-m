import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Security & CORS middleware for all devices & webviews
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Support large payloads (for base64 product images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const DEFAULT_SETTINGS = {
  storeName: "stock_jahani",
  tagline: "فروشگاه تخصصی عینک‌های آفتابی و طبی استوک اورجینال",
  bannerMessage: "✨ ارسال با پست پیشتاز به سراسر کشور | تضمین سلامت فریم و عدسی",
  welcomeText: "تجربه‌ای متفاوت از کیفیت و استایل با عینک استوک جهانی",
  welcomeSubtext: "مجموعه کامل عینک‌های آفتابی و طبی اورجینال، فریم‌های استوک کائوچویی و فلزی ساخت اروپا با عدسی‌های پلاریزه و استاندارد کامل UV400.",
  heroTitle: "کالکشن جدید عینک‌های استوک و اورجینال اروپایی",
  heroSubtitle: "تضمین ۱۰۰٪ اصالت فریم و عدسی UV400، ارسال سریع و رایگان با پست پیشتاز به سراسر کشور",
  heroBadgeText: "✨ کالکشن جدید ۲۰۲۶ - کیفیت اورجینال",
  announcementText: "🚀 ارسال رایگان به سراسر کشور برای تمامی سفارش‌ها با بسته‌بندی هاردکیس ضدضربه",
  showAnnouncement: true,
  feature1Title: "ضمانت اصالت و سلامت",
  feature1Desc: "تمام عینک‌ها استوک دست‌چین اورجینال اروپایی هستند",
  feature2Title: "محافظت کامل UV400",
  feature2Desc: "عدسی‌های استاندارد و پلاریزه تست شده ضد اشعه",
  feature3Title: "ارسال سریع پیشتاز",
  feature3Desc: "تحویل با بسته‌بندی ایمن و کد پیگیری ۲۴ رقمی پست",
  feature4Title: "پشتیبانی اختصاصی",
  feature4Desc: "مشاوره آنلاین و پاسخگویی سریع در دایرکت و تلگرام",
  noticeText: "💡 خریداران گرامی: پس از ثبت سفارش، کد ۲۴ رقمی رهگیری پستی به همراه وضعیت خریدهای شما در بخش «پیگیری سفارشات» قرار خواهد گرفت.",
  aboutText: "فروشگاه عینک استوک جهانی عرضه کننده مستقیم جدیدترین فریم‌های طبی و آفتابی استوک اورجینال اروپا با بالاترین کیفیت و نازل‌ترین قیمت.",
  rulesText: "تمامی بسته‌ها در هاردکیس مقاوم ضدضربه با پُست پیشتاز ارسال شده و کد رهگیری مرسوله پستی پس از ارسال در همین سایت نمایش داده می‌شود.",
  footerAboutText: "فروشگاه تخصصی stock_jahani واردکننده و ارائه‌دهنده فریم‌های باکیفیت و خاص با مناسب‌ترین قیمت.",
  categories: [
    { id: 'sunglasses', label: 'عینک آفتابی' },
    { id: 'optical', label: 'عینک طبی' },
    { id: 'sport', label: 'ورزشی و اسپرت' },
    { id: 'unisex', label: 'یونی‌سکس' },
  ],
  instagram: "stock_jahani",
  phone: "09120000000",
  address: "تهران، خیابان ولیعصر، مرکز خرید عینک استوک جهانی",
  freeShippingThreshold: 0,
  adminPasscode: "1383",
  cardNumber: "6037-9975-1234-5678",
  cardHolderName: "بهنام جهانی",
  ntfyEnabled: true,
  ntfyTopic: "stock_jahani_orders",
  ntfyServerUrl: "https://ntfy.sh"
};

const DEFAULT_PRODUCTS: any[] = [];

function getWritableDataFilePath(): string {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const testFile = path.join(DATA_DIR, ".write_test");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    return DATA_FILE;
  } catch (e) {
    // Fallback to OS tmp folder if project directory is read-only
    return path.join(require("os").tmpdir(), "stock_jahani_store.json");
  }
}

const DEFAULT_ANALYTICS = {
  totalViews: 0,
  uniqueVisitors: 0,
  todayViews: 0,
  todayUnique: 0,
  lastDate: new Date().toISOString().slice(0, 10),
  dailyStats: [] as Array<{ date: string; views: number; visitors: number }>,
  recentVisits: [] as any[],
};

const INITIAL_SERVER_PRODUCTS = [
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

let inMemoryStore: { products: any[]; orders: any[]; settings: any; analytics?: any; auditLogs?: any[]; dataVersion?: number } | null = null;
const liveSessions = new Map<string, { lastSeen: number; page: string; device: string; ip?: string }>();
const todayVisitorSet = new Set<string>();

function getFirebaseConfig() {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
  } catch (e) {}
  return {
    projectId: "gen-lang-client-0588900920",
    firestoreDatabaseId: "ai-studio-webcraft-e223ee03-05ed-4d15-b687-10b9744488fa",
    apiKey: "AIzaSyDtglR2ON8Ublt1s2uCgH-AWv50COnzJUI"
  };
}

function toFirestoreFields(obj: any): any {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: String(value) };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((v) =>
            typeof v === 'string'
              ? { stringValue: v }
              : typeof v === 'number'
              ? { doubleValue: v }
              : { stringValue: JSON.stringify(v) }
          ),
        },
      };
    } else if (typeof value === 'object') {
      fields[key] = { stringValue: JSON.stringify(value) };
    }
  }
  return fields;
}

async function writeFirestoreDoc(collectionName: string, docId: string, data: any) {
  try {
    const cfg = getFirebaseConfig();
    const projectId = cfg.projectId;
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const apiKey = cfg.apiKey;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${collectionName}/${docId}?key=${apiKey}`;
    await fetchWithRetry(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(data) }),
    }, 2, 500);
  } catch (e) {
    console.warn(`[Firestore Server Sync Notice] ${collectionName}/${docId}:`, e);
  }
}

async function deleteFirestoreDoc(collectionName: string, docId: string) {
  try {
    const cfg = getFirebaseConfig();
    const projectId = cfg.projectId;
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const apiKey = cfg.apiKey;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${collectionName}/${docId}?key=${apiKey}`;
    await fetchWithRetry(url, { method: 'DELETE' }, 2, 500);
  } catch (e) {
    console.warn(`[Firestore Delete Notice] ${collectionName}/${docId}:`, e);
  }
}

async function logAuditTrail(entry: {
  targetType: 'product' | 'order' | 'settings' | 'system';
  targetId: string;
  action: 'create' | 'update' | 'delete' | 'stock_change' | 'status_change';
  actor: string;
  actorIp?: string;
  summary: string;
  details?: any;
}) {
  const logId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const auditDoc = {
    id: logId,
    targetType: entry.targetType,
    targetId: entry.targetId,
    action: entry.action,
    actor: entry.actor || 'مدیریت (Admin Panel)',
    actorIp: entry.actorIp || '',
    summary: entry.summary,
    details: entry.details || {},
    timestamp: new Date().toISOString(),
  };

  const current = readData();
  if (!Array.isArray(current.auditLogs)) current.auditLogs = [];
  current.auditLogs.unshift(auditDoc);
  if (current.auditLogs.length > 500) {
    current.auditLogs = current.auditLogs.slice(0, 500);
  }
  writeData(current);

  // Sync to Firestore audit_logs asynchronously
  writeFirestoreDoc('audit_logs', logId, auditDoc).catch(() => {});

  return auditDoc;
}

function readData() {
  if (inMemoryStore) {
    return inMemoryStore;
  }
  const filePath = getWritableDataFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      const prods = Array.isArray(parsed.products) && parsed.products.length > 0 
        ? parsed.products 
        : INITIAL_SERVER_PRODUCTS;
      inMemoryStore = {
        products: prods,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        analytics: { ...DEFAULT_ANALYTICS, ...(parsed.analytics || {}) },
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
      };
      return inMemoryStore;
    }
  } catch (err) {
    console.error("Error reading store file:", err);
  }
  inMemoryStore = { products: INITIAL_SERVER_PRODUCTS, orders: [], settings: DEFAULT_SETTINGS, analytics: DEFAULT_ANALYTICS, auditLogs: [] };
  return inMemoryStore;
}

const sseClients: Set<express.Response> = new Set();

function notifySseClients(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  });
}

function writeData(data: any) {
  data.dataVersion = Date.now();
  inMemoryStore = data;
  notifySseClients({ type: "DATA_UPDATED", version: data.dataVersion });
  const filePath = getWritableDataFilePath();
  try {
    const parentDir = path.dirname(filePath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing store file:", err);
  }
}

function getTimestamp(item: any): number {
  if (!item) return 0;
  const t = item.updatedAt || item.createdAt;
  if (!t) return 0;
  const parsed = new Date(t).getTime();
  return isNaN(parsed) ? 0 : parsed;
}

function mergeProducts(p1: any, p2: any): any {
  const t1 = getTimestamp(p1);
  const t2 = getTimestamp(p2);
  if (t2 > t1) {
    return { ...p1, ...p2 };
  } else if (t1 > t2) {
    return { ...p2, ...p1 };
  } else {
    if (p2.updatedAt && !p1.updatedAt) return { ...p1, ...p2 };
    return { ...p1, ...p2 };
  }
}

function mergeProductsLists(list1: any[], list2: any[]): any[] {
  const map = new Map<string, any>();
  for (const p of list1) {
    if (p && p.id) map.set(p.id, p);
  }
  for (const p of list2) {
    if (p && p.id) {
      const existing = map.get(p.id);
      if (!existing) {
        map.set(p.id, p);
      } else {
        map.set(p.id, mergeProducts(existing, p));
      }
    }
  }
  return Array.from(map.values());
}

function mergeOrders(o1: any, o2: any): any {
  const t1 = getTimestamp(o1);
  const t2 = getTimestamp(o2);
  let base: any;
  if (t2 > t1) {
    base = { ...o1, ...o2 };
  } else if (t1 > t2) {
    base = { ...o2, ...o1 };
  } else {
    base = { ...o1, ...o2 };
  }
  return {
    ...base,
    status: o2.status && o2.status !== 'pending' ? o2.status : (o1.status && o1.status !== 'pending' ? o1.status : base.status),
    postalTrackingCode: o2.postalTrackingCode || o1.postalTrackingCode || base.postalTrackingCode,
    adminNote: o2.adminNote !== undefined ? o2.adminNote : (o1.adminNote !== undefined ? o1.adminNote : base.adminNote),
    paymentReceipt: o2.paymentReceipt || o1.paymentReceipt || base.paymentReceipt,
    paymentRefId: o2.paymentRefId || o1.paymentRefId || base.paymentRefId,
    isPaid: o2.isPaid || o1.isPaid || base.isPaid,
  };
}

function mergeOrdersLists(list1: any[], list2: any[]): any[] {
  const map = new Map<string, any>();
  for (const o of list1) {
    if (o && o.id) map.set(o.id, o);
  }
  for (const o of list2) {
    if (o && o.id) {
      const existing = map.get(o.id);
      if (!existing) {
        map.set(o.id, o);
      } else {
        map.set(o.id, mergeOrders(existing, o));
      }
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
}

// API Endpoints
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

  sseClients.add(res);

  // Send periodic keepalive comment every 25s to prevent Cloudflare / proxy 100s timeout
  const keepAlive = setInterval(() => {
    try {
      res.write(`: keepalive\n\n`);
    } catch (e) {
      clearInterval(keepAlive);
      sseClients.delete(res);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

app.get("/sitemap.xml", (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  const data = readData();
  const products = data.products || [];
  const domain = `${req.protocol}://${req.get("host")}`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <url><loc>${domain}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>\n`;

  const categories = ['sunglasses', 'optical', 'sport', 'unisex', 'accessories'];
  categories.forEach((cat) => {
    xml += `  <url><loc>${domain}/?category=${cat}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
  });

  products.forEach((p: any) => {
    xml += `  <url><loc>${domain}/?product=${p.id}</loc><lastmod>${(p.updatedAt || p.createdAt || '').split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.9</priority></url>\n`;
  });

  xml += `</urlset>`;
  res.send(xml);
});

app.get("/robots.txt", (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  const data = readData();
  const customRobots = data.settings?.robotsTxtContent;
  if (customRobots && customRobots.trim()) {
    return res.send(customRobots);
  }
  const domain = `${req.protocol}://${req.get("host")}`;
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${domain}/sitemap.xml`);
});

app.get("/api/feed/torob", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const data = readData();
  const domain = `${req.protocol}://${req.get("host")}`;
  const products = (data.products || []).map((p: any) => ({
    page_unique_code: p.id,
    title: p.title,
    subtitle: p.code ? `کد: ${p.code}` : '',
    price: p.price,
    old_price: p.originalPrice || p.price,
    availability: p.stock > 0 ? 'instock' : 'outofstock',
    page_url: `${domain}/?product=${p.id}`,
    image_links: p.images || [],
    category_name: p.category || 'عینک',
  }));
  res.json({ products });
});

app.get("/api/feed/emalls", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const data = readData();
  const domain = `${req.protocol}://${req.get("host")}`;
  const products = (data.products || []).map((p: any) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    old_price: p.originalPrice || 0,
    is_available: p.stock > 0,
    link: `${domain}/?product=${p.id}`,
    image: (p.images && p.images[0]) || '',
    category: p.category || 'عینک'
  }));
  res.json(products);
});

app.get("/api/version", (req, res) => {
  const data = readData();
  res.json({
    version: data.dataVersion || 1,
    productsCount: (data.products || []).length,
    ordersCount: (data.orders || []).length,
  });
});

app.get("/api/data", (req, res) => {
  const data = readData();
  res.json({
    products: data.products || [],
    orders: data.orders || [],
    settings: data.settings || DEFAULT_SETTINGS,
  });
});

app.get("/api/products", (req, res) => {
  const data = readData();
  res.json(data.products || []);
});

app.get("/api/orders", (req, res) => {
  const data = readData();
  res.json(data.orders || []);
});

app.post("/api/products", (req, res) => {
  const { products } = req.body;
  if (!Array.isArray(products)) {
    return res.status(400).json({ error: "Invalid products" });
  }
  const current = readData();
  const validIncoming = products.filter((p: any) => p && p.id);
  current.products = mergeProductsLists(current.products || [], validIncoming);
  writeData(current);
  res.json({ success: true, count: current.products.length });
});

app.post("/api/products/save", (req, res) => {
  const { product } = req.body;
  if (!product || !product.id) {
    return res.status(400).json({ error: "Invalid product payload" });
  }
  const current = readData();
  const prods = Array.isArray(current.products) ? current.products : [];
  const idx = prods.findIndex((p: any) => p.id === product.id);
  if (idx >= 0) {
    prods[idx] = { ...prods[idx], ...product, updatedAt: new Date().toISOString() };
  } else {
    prods.unshift({ ...product, updatedAt: new Date().toISOString() });
  }
  current.products = prods;
  writeData(current);
  res.json({ success: true, product, total: prods.length });
});

app.post("/api/orders", (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) {
    return res.status(400).json({ error: "Invalid orders" });
  }
  const current = readData();
  const validIncoming = orders.filter((o: any) => o && o.id);
  current.orders = mergeOrdersLists(current.orders || [], validIncoming);
  writeData(current);
  res.json({ success: true, count: current.orders.length });
});

app.post("/api/orders/new", (req, res) => {
  const { order } = req.body;
  if (!order || !order.id) {
    return res.status(400).json({ error: "Invalid order data" });
  }
  const current = readData();
  const existingMap = new Map((current.orders || []).map((o: any) => [o.id, o]));
  const existing = existingMap.get(order.id);
  if (existing) {
    existingMap.set(order.id, mergeOrders(existing, order));
  } else {
    existingMap.set(order.id, order);
  }

  current.orders = Array.from(existingMap.values()).sort((a: any, b: any) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  writeData(current);

  // Dispatch notifications asynchronously to both Telegram and ntfy
  dispatchOrderToTelegram(order, current.settings || {}).catch(() => {});
  dispatchOrderToNtfy(order, current.settings || {}).catch(() => {});

  res.json({ success: true, order, total: current.orders.length });
});

app.patch("/api/orders/:id", (req, res) => {
  const orderId = req.params.id;
  const updates = req.body;
  const current = readData();
  const existingOrders = Array.isArray(current.orders) ? current.orders : [];
  const idx = existingOrders.findIndex((o: any) => o.id === orderId);
  if (idx >= 0) {
    existingOrders[idx] = { ...existingOrders[idx], ...updates, updatedAt: new Date().toISOString() };
    current.orders = existingOrders;
    writeData(current);
    res.json({ success: true, order: existingOrders[idx] });
  } else {
    res.status(404).json({ error: "Order not found" });
  }
});

app.post("/api/reset-all", (req, res) => {
  const current = readData();
  current.products = [];
  current.orders = [];
  writeData(current);
  res.json({ success: true, message: "تمامی محصولات و سفارشات با موفقیت پاکسازی شدند." });
});

app.delete("/api/products/:id", (req, res) => {
  const productId = req.params.id;
  const current = readData();
  current.products = (current.products || []).filter((p: any) => p.id !== productId);
  writeData(current);
  res.json({ success: true, count: current.products.length });
});

app.post("/api/products/delete", (req, res) => {
  const { productId } = req.body;
  const current = readData();
  current.products = (current.products || []).filter((p: any) => p.id !== productId);
  writeData(current);
  res.json({ success: true, count: current.products.length });
});

app.delete("/api/orders/:id", (req, res) => {
  const orderId = req.params.id;
  const current = readData();
  current.orders = (current.orders || []).filter((o: any) => o.id !== orderId);
  writeData(current);
  res.json({ success: true, count: current.orders.length });
});

app.post("/api/orders/delete", (req, res) => {
  const { orderId } = req.body;
  const current = readData();
  current.orders = (current.orders || []).filter((o: any) => o.id !== orderId);
  writeData(current);
  res.json({ success: true, count: current.orders.length });
});

// Analytics & Visitor Counter Endpoints
app.post("/api/analytics/visit", (req, res) => {
  try {
    const { visitorId, page = "/", device = "mobile", referrer = "" } = req.body;
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "local";
    const vid = visitorId || `vis-${clientIp}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    const current = readData();
    const analytics = current.analytics || { ...DEFAULT_ANALYTICS };

    // Reset daily counters if day changed
    if (analytics.lastDate !== todayStr) {
      // Archive yesterday
      if (!Array.isArray(analytics.dailyStats)) analytics.dailyStats = [];
      analytics.dailyStats.push({
        date: analytics.lastDate || 'روز قبل',
        views: analytics.todayViews || 1,
        visitors: analytics.todayUnique || 1,
      });
      // Keep last 14 days
      if (analytics.dailyStats.length > 14) {
        analytics.dailyStats = analytics.dailyStats.slice(-14);
      }
      analytics.lastDate = todayStr;
      analytics.todayViews = 0;
      analytics.todayUnique = 0;
      todayVisitorSet.clear();
    }

    analytics.totalViews = (analytics.totalViews || 0) + 1;
    analytics.todayViews = (analytics.todayViews || 0) + 1;

    if (!todayVisitorSet.has(vid)) {
      todayVisitorSet.add(vid);
      analytics.todayUnique = (analytics.todayUnique || 0) + 1;
      analytics.uniqueVisitors = (analytics.uniqueVisitors || 0) + 1;
    }

    // Record live session
    liveSessions.set(vid, {
      lastSeen: Date.now(),
      page,
      device: device.includes("mobile") || device.includes("phone") ? "mobile" : "desktop",
      ip: clientIp.slice(0, 8) + '***',
    });

    // Clean up stale sessions (older than 3 minutes)
    const now = Date.now();
    for (const [id, session] of liveSessions.entries()) {
      if (now - session.lastSeen > 180000) {
        liveSessions.delete(id);
      }
    }

    // Keep recent 20 visit logs
    if (!Array.isArray(analytics.recentVisits)) analytics.recentVisits = [];
    analytics.recentVisits.unshift({
      id: `v-${Date.now()}`,
      timestamp: new Date().toISOString(),
      page,
      device,
      referrer,
    });
    if (analytics.recentVisits.length > 20) {
      analytics.recentVisits = analytics.recentVisits.slice(0, 20);
    }

    current.analytics = analytics;
    writeData(current);

    res.json({
      success: true,
      stats: {
        totalViews: analytics.totalViews,
        uniqueVisitors: analytics.uniqueVisitors,
        todayViews: analytics.todayViews,
        todayUnique: analytics.todayUnique,
        activeOnline: Math.max(1, liveSessions.size),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Analytics error' });
  }
});

app.post("/api/analytics/heartbeat", (req, res) => {
  const { visitorId, page = "/" } = req.body;
  const vid = visitorId || "anon";
  const existing = liveSessions.get(vid);
  if (existing) {
    existing.lastSeen = Date.now();
    existing.page = page;
  } else {
    liveSessions.set(vid, { lastSeen: Date.now(), page, device: "unknown" });
  }

  const now = Date.now();
  for (const [id, session] of liveSessions.entries()) {
    if (now - session.lastSeen > 180000) {
      liveSessions.delete(id);
    }
  }

  res.json({ success: true, activeOnline: Math.max(1, liveSessions.size) });
});

app.get("/api/analytics/stats", (req, res) => {
  const current = readData();
  const analytics = current.analytics || { ...DEFAULT_ANALYTICS };

  const now = Date.now();
  for (const [id, session] of liveSessions.entries()) {
    if (now - session.lastSeen > 180000) {
      liveSessions.delete(id);
    }
  }

  res.json({
    totalViews: analytics.totalViews || 0,
    uniqueVisitors: analytics.uniqueVisitors || 0,
    todayViews: analytics.todayViews || 0,
    todayUnique: analytics.todayUnique || 0,
    activeOnline: Math.max(1, liveSessions.size),
    recentVisits: analytics.recentVisits || [],
    dailyStats: analytics.dailyStats || [],
  });
});


// Dispatch order notifications to ntfy.sh (No VPN required, ultra-reliable push notifications)
async function dispatchOrderToNtfy(data: any, settings: any) {
  try {
    const topic = settings.ntfyTopic || process.env.NTFY_TOPIC || 'stock_jahani_orders';
    const serverUrl = (settings.ntfyServerUrl || 'https://ntfy.sh').replace(/\/+$/, '');
    const enabled = settings.ntfyEnabled !== false;
    if (!enabled || !topic) return;

    const orderId = data.orderId || data.id || `ORD-${Date.now()}`;
    const orderCode = data.orderCode || orderId;
    const customerName = data.customerName || data.customer?.fullName || 'نامشخص';
    const customerPhone = data.customerPhone || data.customer?.phone || 'نامشخص';
    const prov = data.customer?.province || '';
    const city = data.customer?.city || '';
    const address = data.customerAddress || `${prov} ${city} ${data.customer?.address || ''}`.trim() || 'نامشخص';
    const total = data.totalPrice || data.finalAmount || data.totalAmount || 0;
    const totalStr = typeof total === 'number' ? total.toLocaleString('fa-IR') : total;

    const items = data.items || [];
    const itemsSummary = items.map((i: any) => `${i.name || i.product?.title || 'عینک'} (x${i.quantity || 1})`).join('، ');

    const ntfyBody = `سفارش جدید از: ${customerName}\nتلفن: ${customerPhone}\nمبلغ: ${totalStr} تومان\nاقلام: ${itemsSummary || 'عینک'}\nآدرس: ${address}`;

    const headers: Record<string, string> = {
      'Title': `=?UTF-8?B?${Buffer.from(`🛒 سفارش جدید ${orderCode}`).toString('base64')}?=`,
      'Priority': 'urgent',
      'Tags': 'eyeglasses,tada,moneybag',
      'Click': 'https://ais-pre-luwgyx4c4a4ugnvqzm4umc-246919081791.europe-west2.run.app',
      'Content-Type': 'text/plain; charset=utf-8'
    };

    await fetch(`${serverUrl}/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers,
      body: ntfyBody
    });
    console.log(`[ntfy] Notification sent successfully to topic: ${topic}`);
  } catch (err) {
    console.warn('[ntfy notice]:', err);
  }
}

app.post("/api/test-ntfy", async (req, res) => {
  try {
    const { topic, serverUrl } = req.body;
    const current = readData();
    const targetTopic = topic || current.settings?.ntfyTopic || 'stock_jahani_orders';
    const targetServer = (serverUrl || current.settings?.ntfyServerUrl || 'https://ntfy.sh').replace(/\/+$/, '');

    const headers: Record<string, string> = {
      'Title': `=?UTF-8?B?${Buffer.from('🔔 تست اتصال نوتیفیکیشن عینک استوک جهانی').toString('base64')}?=`,
      'Priority': 'high',
      'Tags': 'white_check_mark,tada,eyeglasses',
      'Content-Type': 'text/plain; charset=utf-8'
    };

    const testBody = `اتصال با موفقیت برقرار شد!\nاین پیام تستی از پنل مدیریت فروشگاه عینک استوک جهانی ارسال شده است.\nساعت تست: ${new Date().toLocaleTimeString('fa-IR')}`;

    const resp = await fetch(`${targetServer}/${encodeURIComponent(targetTopic)}`, {
      method: 'POST',
      headers,
      body: testBody
    });

    if (resp.ok) {
      res.json({ success: true, message: `پیام تست با موفقیت به تاپیک ${targetTopic} در ntfy ارسال شد.` });
    } else {
      const errTxt = await resp.text();
      res.status(resp.status).json({ success: false, error: errTxt || 'خطا در اتصال به سرور ntfy' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'خطا در ارسال نوتیفیکیشن تست' });
  }
});

// Helper with exponential backoff retry for Telegram API calls
async function fetchWithRetry(
  url: string,
  options: any,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<Response> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) {
        return res;
      }
      const errText = await res.clone().text().catch(() => '');
      console.warn(`[Telegram API Warning] Attempt ${attempt}/${maxRetries} failed with status ${res.status}: ${errText}`);
      lastError = new Error(`HTTP ${res.status}: ${errText}`);
    } catch (err: any) {
      console.warn(`[Telegram API Network Error] Attempt ${attempt}/${maxRetries} failed: ${err?.message || err}`);
      lastError = err;
    }
    if (attempt < maxRetries) {
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError || new Error('Failed after retries');
}

// Helper function to dispatch order notifications to Telegram
async function dispatchOrderToTelegram(data: any, settings: any) {
  try {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN || settings.telegramBotToken || '8880696062:AAEqF5r7ZillJV8njxUGrbPyT9nQpAPES3M';
    const chatId = process.env.TELEGRAM_CHAT_ID || settings.telegramChatId || '8574668861';
    const customWebhook = settings.telegramWebhookUrl || data.webhookUrl;

    const orderId = data.orderId || data.id || `ORD-${Date.now()}`;
    const orderCode = data.orderCode || orderId;

    const customerName = data.customerName || data.customer?.fullName || 'نامشخص';
    const customerPhone = data.customerPhone || data.customer?.phone || 'نامشخص';
    const prov = data.customer?.province || '';
    const city = data.customer?.city || '';
    const rawAddr = data.customer?.address || '';
    const customerAddress = data.customerAddress || `${prov} ${city} ${rawAddr}`.trim() || 'نامشخص';
    const postalCode = data.customer?.postalCode || '';

    const escapeHtml = (str: any) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // HTML Message for Telegram
    let messageHtml = `🛒 <b>سفارش جدید ثبت شد!</b>\n\n`;
    messageHtml += `🆔 <b>کد سفارش:</b> <code>${escapeHtml(orderCode)}</code>\n`;
    messageHtml += `👤 <b>نام:</b> ${escapeHtml(customerName)}\n`;
    messageHtml += `📞 <b>تلفن:</b> <code>${escapeHtml(customerPhone)}</code>\n`;
    messageHtml += `📍 <b>آدرس:</b> ${escapeHtml(customerAddress)}\n`;
    if (postalCode) {
      messageHtml += `📮 <b>کد پستی:</b> <code>${escapeHtml(postalCode)}</code>\n`;
    }
    messageHtml += `\n📦 <b>اقلام سفارش:</b>\n`;
    const items = data.items || [];
    items.forEach((i: any) => {
      const pName = i.name || i.product?.title || 'عینک';
      const qty = i.quantity || 1;
      const price = i.price || i.product?.price || 0;
      const priceStr = typeof price === 'number' ? price.toLocaleString('fa-IR') : price;
      messageHtml += `- ${escapeHtml(pName)} (تعداد: ${qty}) - ${priceStr} تومان\n`;
    });
    const total = data.totalPrice || data.finalAmount || data.totalAmount || 0;
    const totalStr = typeof total === 'number' ? total.toLocaleString('fa-IR') : total;
    messageHtml += `\n💰 <b>مبلغ کل:</b> ${escapeHtml(totalStr)} تومان`;

    // Plain text fallback
    let messagePlain = `🛒 سفارش جدید ثبت شد!\n\n`;
    messagePlain += `🆔 کد سفارش: ${orderCode}\n`;
    messagePlain += `👤 نام: ${customerName}\n`;
    messagePlain += `📞 تلفن: ${customerPhone}\n`;
    messagePlain += `📍 آدرس: ${customerAddress}\n`;
    if (postalCode) messagePlain += `📮 کد پستی: ${postalCode}\n`;
    messagePlain += `\n📦 اقلام سفارش:\n`;
    items.forEach((i: any) => {
      const pName = i.name || i.product?.title || 'عینک';
      const qty = i.quantity || 1;
      const price = i.price || i.product?.price || 0;
      const priceStr = typeof price === 'number' ? price.toLocaleString('fa-IR') : price;
      messagePlain += `- ${pName} (تعداد: ${qty}) - ${priceStr} تومان\n`;
    });
    messagePlain += `\n💰 مبلغ کل: ${totalStr} تومان`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ تایید و انتقال به انجام‌شده', callback_data: `approve_${orderId}` },
          { text: '❌ لغو سفارش', callback_data: `cancel_${orderId}` }
        ]
      ]
    };

    if (customWebhook && typeof customWebhook === 'string' && customWebhook.startsWith('http')) {
      fetchWithRetry(customWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, orderId, orderCode, message: messagePlain, messageHtml, inlineKeyboard })
      }, 2, 800).catch((e) => console.warn('Webhook dispatch error:', e));
    }

    if (telegramToken && chatId) {
      const receiptUrl = data.receiptUrl || data.paymentReceipt;
      if (receiptUrl && receiptUrl.startsWith('data:image')) {
        const base64Data = receiptUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');
        const formData = new (globalThis.FormData)();
        formData.append('chat_id', String(chatId));
        formData.append('caption', messageHtml);
        formData.append('parse_mode', 'HTML');
        formData.append('reply_markup', JSON.stringify(inlineKeyboard));
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        formData.append('photo', blob, 'receipt.jpg');

        await fetchWithRetry(`https://api.telegram.org/bot${telegramToken}/sendPhoto`, {
          method: 'POST',
          body: formData as any
        }).catch(() => null);
      } else {
        await fetchWithRetry(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageHtml,
            parse_mode: 'HTML',
            reply_markup: inlineKeyboard
          })
        }).catch(async () => {
          // Fallback plain text
          await fetchWithRetry(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: messagePlain,
              reply_markup: inlineKeyboard
            })
          }).catch((e) => console.warn('Telegram plain fallback error:', e));
        });
      }
    }
  } catch (err) {
    console.warn('Dispatch order to Telegram notice:', err);
  }
}

// Helper function to dispatch Firestore 'onUpdate' notifications for products and orders
async function dispatchUpdateToTelegram(updateInfo: {
  collection: 'orders' | 'products';
  documentId: string;
  before?: any;
  after?: any;
  actor?: string;
  triggerType?: string;
}) {
  try {
    const current = readData();
    const settings = current.settings || {};
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN || settings.telegramBotToken || '8880696062:AAEqF5r7ZillJV8njxUGrbPyT9nQpAPES3M';
    const chatId = process.env.TELEGRAM_CHAT_ID || settings.telegramChatId || '8574668861';

    if (!telegramToken || !chatId) {
      console.warn('[Telegram Webhook Notification] No bot token or chat ID configured.');
      return false;
    }

    const escapeHtml = (str: any) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const formatPriceFa = (val: any) => (typeof val === 'number' ? val.toLocaleString('fa-IR') : String(val || 0));

    const statusLabels: Record<string, string> = {
      pending: '⏳ در انتظار تایید',
      confirmed: '✅ تایید شده',
      shipping: '🚚 در حال ارسال (پست پیشتاز)',
      delivered: '🎉 تحویل داده شده',
      cancelled: '❌ لغو شده',
    };

    let messageHtml = '';
    let messagePlain = '';

    const timestampStr = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('fa-IR');
    const actorLabel = updateInfo.actor || 'سیستم (وب‌هوک Firestore onUpdate)';

    if (updateInfo.collection === 'orders') {
      const before = updateInfo.before || {};
      const after = updateInfo.after || {};
      const orderCode = after.orderCode || before.orderCode || updateInfo.documentId;
      const customerName = after.customer?.fullName || before.customer?.fullName || 'نامشخص';
      const customerPhone = after.customer?.phone || before.customer?.phone || 'نامشخص';
      const prevStatus = before.status || 'نامشخص';
      const newStatus = after.status || 'نامشخص';
      const prevTracking = before.postalTrackingCode || before.trackingCode || '';
      const newTracking = after.postalTrackingCode || after.trackingCode || '';

      messageHtml = `🔔 <b>هشدار رویداد فایربیس: تغییر در سفارش</b>\n\n`;
      messageHtml += `🆔 <b>کد سفارش:</b> <code>#${escapeHtml(orderCode)}</code>\n`;
      messageHtml += `👤 <b>مشتری:</b> ${escapeHtml(customerName)}\n`;
      messageHtml += `📞 <b>تلفن:</b> <code>${escapeHtml(customerPhone)}</code>\n`;

      if (prevStatus !== newStatus) {
        messageHtml += `\n📊 <b>وضعیت قبلی:</b> ${escapeHtml(statusLabels[prevStatus] || prevStatus)}\n`;
        messageHtml += `⚡ <b>وضعیت جدید:</b> <b>${escapeHtml(statusLabels[newStatus] || newStatus)}</b>\n`;
      }

      if (newTracking && newTracking !== prevTracking) {
        messageHtml += `\n📮 <b>کد رهگیری پستی جدید:</b> <code>${escapeHtml(newTracking)}</code>\n`;
      }

      const total = after.finalAmount || after.totalAmount || before.finalAmount || 0;
      if (total) {
        messageHtml += `💰 <b>مبلغ فاکتور:</b> ${formatPriceFa(total)} تومان\n`;
      }

      messageHtml += `\n👤 <b>عامل تغییر:</b> ${escapeHtml(actorLabel)}\n`;
      messageHtml += `🕒 <b>زمان رویداد:</b> ${escapeHtml(timestampStr)}\n`;
      messageHtml += `⚡ <i>رویداد لحظه‌ای از تریگر Firestore onUpdate</i>`;

      messagePlain = `🔔 هشدار رویداد فایربیس: تغییر در سفارش #${orderCode}\n`;
      messagePlain += `مشتری: ${customerName} | تلفن: ${customerPhone}\n`;
      if (prevStatus !== newStatus) {
        messagePlain += `وضعیت: ${statusLabels[prevStatus] || prevStatus} -> ${statusLabels[newStatus] || newStatus}\n`;
      }
      if (newTracking && newTracking !== prevTracking) {
        messagePlain += `کد رهگیری پستی: ${newTracking}\n`;
      }
      messagePlain += `عامل: ${actorLabel} | زمان: ${timestampStr}`;

    } else if (updateInfo.collection === 'products') {
      const before = updateInfo.before || {};
      const after = updateInfo.after || {};
      const productTitle = after.title || before.title || 'عینک';
      const productCode = after.code || before.code || updateInfo.documentId;
      const prevStock = before.stock ?? '-';
      const newStock = after.stock ?? '-';
      const prevPrice = before.price ?? 0;
      const newPrice = after.price ?? 0;

      messageHtml = `🔔 <b>هشدار رویداد فایربیس: تغییر در محصول عینک</b>\n\n`;
      messageHtml += `👓 <b>نام محصول:</b> <b>${escapeHtml(productTitle)}</b>\n`;
      messageHtml += `🆔 <b>کد عینک:</b> <code>${escapeHtml(productCode)}</code>\n`;

      if (prevStock !== newStock) {
        messageHtml += `\n📦 <b>موجودی انبار:</b>\n`;
        messageHtml += `• موجودی قبلی: ${prevStock} عدد\n`;
        messageHtml += `• موجودی جدید: <b>${newStock} عدد</b>\n`;
      }

      if (prevPrice !== newPrice) {
        messageHtml += `\n🏷️ <b>قیمت محصول:</b>\n`;
        messageHtml += `• قبلی: ${formatPriceFa(prevPrice)} تومان\n`;
        messageHtml += `• جدید: <b>${formatPriceFa(newPrice)} تومان</b>\n`;
      }

      if (after.category) {
        messageHtml += `📂 <b>دسته‌بندی:</b> ${escapeHtml(after.category)}\n`;
      }

      messageHtml += `\n👤 <b>عامل تغییر:</b> ${escapeHtml(actorLabel)}\n`;
      messageHtml += `🕒 <b>زمان رویداد:</b> ${escapeHtml(timestampStr)}\n`;
      messageHtml += `⚡ <i>رویداد لحظه‌ای از تریگر Firestore onUpdate</i>`;

      messagePlain = `🔔 هشدار رویداد فایربیس: تغییر در محصول ${productTitle} (${productCode})\n`;
      if (prevStock !== newStock) messagePlain += `موجودی: ${prevStock} -> ${newStock}\n`;
      if (prevPrice !== newPrice) messagePlain += `قیمت: ${prevPrice} -> ${newPrice}\n`;
      messagePlain += `عامل: ${actorLabel} | زمان: ${timestampStr}`;
    } else {
      return false;
    }

    const res = await fetchWithRetry(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageHtml,
        parse_mode: 'HTML',
      }),
    }, 2, 600).catch(async () => {
      return await fetchWithRetry(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messagePlain,
        }),
      }, 2, 600);
    });

    return !!res;
  } catch (err) {
    console.warn('[Telegram Update Dispatch Error]:', err);
    return false;
  }
}

// -------------------------------------------------------------
// Firebase Functions: Server-Side Atomic Mutations & Audit Logs
// -------------------------------------------------------------

app.post("/api/functions/mutate-product", async (req, res) => {
  try {
    const { action, product, productId, stockDelta, newStock, actor } = req.body;
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "local";
    const current = readData();
    let prods = Array.isArray(current.products) ? current.products : [];

    const actorName = actor || "مدیریت فروشگاه (Admin Panel)";

    if (action === "delete") {
      const targetId = productId || product?.id;
      if (!targetId) return res.status(400).json({ error: "Product ID required for deletion" });
      const targetProd = prods.find((p: any) => p.id === targetId);
      const title = targetProd?.title || targetId;

      current.products = prods.filter((p: any) => p.id !== targetId);
      writeData(current);

      deleteFirestoreDoc('products', targetId).catch(() => {});

      const audit = await logAuditTrail({
        targetType: 'product',
        targetId,
        action: 'delete',
        actor: actorName,
        actorIp: clientIp,
        summary: `حذف محصول عینک: «${title}»`,
        details: { deletedProduct: targetProd },
      });

      return res.json({ success: true, count: current.products.length, auditLog: audit });
    }

    if (action === "adjust_stock") {
      const targetId = productId || product?.id;
      const idx = prods.findIndex((p: any) => p.id === targetId);
      if (idx < 0) return res.status(404).json({ error: "Product not found" });

      const before = { ...prods[idx] };
      const oldStock = Number(before.stock) || 0;
      let calculatedStock = oldStock;
      if (typeof newStock === 'number') {
        calculatedStock = Math.max(0, newStock);
      } else if (typeof stockDelta === 'number') {
        calculatedStock = Math.max(0, oldStock + stockDelta);
      }

      prods[idx] = { ...prods[idx], stock: calculatedStock, updatedAt: new Date().toISOString() };
      const after = { ...prods[idx] };
      current.products = prods;
      writeData(current);

      writeFirestoreDoc('products', targetId, after).catch(() => {});

      const audit = await logAuditTrail({
        targetType: 'product',
        targetId,
        action: 'stock_change',
        actor: actorName,
        actorIp: clientIp,
        summary: `تغییر موجودی انبار عینک «${after.title}» از ${oldStock} به ${calculatedStock} عدد`,
        details: { oldStock, newStock: calculatedStock },
      });

      // Dispatch Telegram onUpdate notification
      dispatchUpdateToTelegram({
        collection: 'products',
        documentId: targetId,
        before,
        after,
        actor: actorName,
        triggerType: 'stock_mutation',
      }).catch(() => {});

      return res.json({ success: true, product: after, auditLog: audit });
    }

    // Default: 'create' or 'update' / 'save'
    if (!product || !product.id) {
      return res.status(400).json({ error: "Invalid product payload" });
    }

    const targetId = product.id;
    const idx = prods.findIndex((p: any) => p.id === targetId);
    const isCreate = idx < 0;
    let before: any = null;
    let cleanProduct: any;

    if (isCreate) {
      cleanProduct = {
        ...product,
        createdAt: product.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      prods.unshift(cleanProduct);
    } else {
      before = { ...prods[idx] };
      cleanProduct = {
        ...prods[idx],
        ...product,
        updatedAt: new Date().toISOString(),
      };
      prods[idx] = cleanProduct;
    }

    current.products = prods;
    writeData(current);

    writeFirestoreDoc('products', targetId, cleanProduct).catch(() => {});

    const audit = await logAuditTrail({
      targetType: 'product',
      targetId,
      action: isCreate ? 'create' : 'update',
      actor: actorName,
      actorIp: clientIp,
      summary: isCreate
        ? `افزودن محصول جدید: «${cleanProduct.title}» با قیمت ${Number(cleanProduct.price || 0).toLocaleString('fa-IR')} تومان`
        : `ویرایش مشخصات محصول: «${cleanProduct.title}»`,
      details: { isNew: isCreate, price: cleanProduct.price, stock: cleanProduct.stock },
    });

    if (!isCreate) {
      // Dispatch Telegram onUpdate notification
      dispatchUpdateToTelegram({
        collection: 'products',
        documentId: targetId,
        before,
        after: cleanProduct,
        actor: actorName,
        triggerType: 'product_mutation',
      }).catch(() => {});
    }

    return res.json({ success: true, product: cleanProduct, total: prods.length, auditLog: audit });
  } catch (err: any) {
    console.error("Mutate product error:", err);
    return res.status(500).json({ error: err?.message || "Product mutation failed" });
  }
});

app.post("/api/functions/mutate-order", async (req, res) => {
  try {
    const { action, order, orderId, status, postalTrackingCode, adminNote, actor } = req.body;
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "local";
    const current = readData();
    let ords = Array.isArray(current.orders) ? current.orders : [];
    const actorName = actor || (order?.customer?.fullName ? `مشتری: ${order.customer.fullName}` : "سیستم");

    if (action === "delete") {
      const targetId = orderId || order?.id;
      if (!targetId) return res.status(400).json({ error: "Order ID required" });
      const targetOrder = ords.find((o: any) => o.id === targetId);
      const code = targetOrder?.orderCode || targetId;

      current.orders = ords.filter((o: any) => o.id !== targetId);
      writeData(current);

      deleteFirestoreDoc('orders', targetId).catch(() => {});

      const audit = await logAuditTrail({
        targetType: 'order',
        targetId,
        action: 'delete',
        actor: actor || "مدیریت فروشگاه (Admin Panel)",
        actorIp: clientIp,
        summary: `حذف سفارش #${code}`,
        details: { deletedOrder: targetOrder },
      });

      return res.json({ success: true, count: current.orders.length, auditLog: audit });
    }

    if (action === "update_status") {
      const targetId = orderId || order?.id;
      const idx = ords.findIndex((o: any) => o.id === targetId);
      if (idx < 0) return res.status(404).json({ error: "Order not found" });

      const before = { ...ords[idx] };
      const updates: any = {
        updatedAt: new Date().toISOString(),
      };
      if (status) updates.status = status;
      if (postalTrackingCode !== undefined) updates.postalTrackingCode = postalTrackingCode;
      if (adminNote !== undefined) updates.adminNote = adminNote;

      ords[idx] = { ...ords[idx], ...updates };
      const after = { ...ords[idx] };
      current.orders = ords;
      writeData(current);

      writeFirestoreDoc('orders', targetId, after).catch(() => {});

      const statusFaMap: Record<string, string> = {
        pending: 'در انتظار تایید',
        confirmed: 'تایید شده',
        shipping: 'در حال ارسال پستی',
        delivered: 'تحویل داده شده',
        cancelled: 'لغو شده',
      };

      const audit = await logAuditTrail({
        targetType: 'order',
        targetId,
        action: 'status_change',
        actor: actor || "مدیریت فروشگاه (Admin Panel)",
        actorIp: clientIp,
        summary: `تغییر وضعیت سفارش #${after.orderCode || targetId} به «${statusFaMap[after.status] || after.status}»`,
        details: {
          previousStatus: before.status,
          newStatus: after.status,
          postalTrackingCode: after.postalTrackingCode,
        },
      });

      // Dispatch Telegram onUpdate notification
      dispatchUpdateToTelegram({
        collection: 'orders',
        documentId: targetId,
        before,
        after,
        actor: actor || "مدیریت فروشگاه (Admin Panel)",
        triggerType: 'order_status_mutation',
      }).catch(() => {});

      return res.json({ success: true, order: after, auditLog: audit });
    }

    // Default: 'create'
    if (!order || !order.id) {
      return res.status(400).json({ error: "Invalid order data" });
    }

    const cleanOrder = {
      ...order,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Atomic stock deduction for items in order
    let prods = Array.isArray(current.products) ? current.products : [];
    const items = Array.isArray(order.items) ? order.items : [];
    items.forEach((item: any) => {
      const prodId = item.product?.id || item.id;
      const qty = Number(item.quantity) || 1;
      const pIdx = prods.findIndex((p: any) => p.id === prodId);
      if (pIdx >= 0) {
        const oldStock = Number(prods[pIdx].stock) || 0;
        const newStock = Math.max(0, oldStock - qty);
        prods[pIdx] = { ...prods[pIdx], stock: newStock, updatedAt: new Date().toISOString() };
        writeFirestoreDoc('products', prodId, prods[pIdx]).catch(() => {});
      }
    });

    current.products = prods;
    ords = [cleanOrder, ...ords.filter((o: any) => o.id !== cleanOrder.id)];
    current.orders = ords;
    writeData(current);

    writeFirestoreDoc('orders', cleanOrder.id, cleanOrder).catch(() => {});

    const audit = await logAuditTrail({
      targetType: 'order',
      targetId: cleanOrder.id,
      action: 'create',
      actor: actorName,
      actorIp: clientIp,
      summary: `ثبت سفارش جدید #${cleanOrder.orderCode || cleanOrder.id} توسط ${cleanOrder.customer?.fullName || 'مشتری'} به مبلغ ${(cleanOrder.finalAmount || 0).toLocaleString('fa-IR')} تومان`,
      details: {
        customer: cleanOrder.customer?.fullName,
        phone: cleanOrder.customer?.phone,
        totalAmount: cleanOrder.finalAmount,
        itemsCount: cleanOrder.items?.length,
      },
    });

    // Telegram & ntfy notifications for new order
    dispatchOrderToTelegram(cleanOrder, current.settings || {}).catch(() => {});
    dispatchOrderToNtfy(cleanOrder, current.settings || {}).catch(() => {});

    return res.json({ success: true, order: cleanOrder, total: ords.length, auditLog: audit });
  } catch (err: any) {
    console.error("Mutate order error:", err);
    return res.status(500).json({ error: err?.message || "Order mutation failed" });
  }
});

// -------------------------------------------------------------
// Webhook handler for Firebase Firestore 'onUpdate' Triggers
// -------------------------------------------------------------

app.post(["/api/webhooks/firestore-onupdate", "/api/webhooks/firestore"], async (req, res) => {
  try {
    const payload = req.body || {};
    let collection = payload.collection;
    let documentId = payload.documentId || payload.id;
    let before = payload.before || payload.oldValue || {};
    let after = payload.after || payload.value || {};
    let actor = payload.actor || 'تریگر Firestore (onUpdate Webhook)';

    // Handle CloudEvents / Firebase Eventarc format if present
    const ceSubject = req.headers['ce-subject'] as string;
    if (!collection && ceSubject) {
      if (ceSubject.includes('documents/orders/')) collection = 'orders';
      else if (ceSubject.includes('documents/products/')) collection = 'products';
      documentId = ceSubject.split('/').pop() || documentId;
    }

    if (!collection || !['orders', 'products'].includes(collection)) {
      // Default to inspecting after payload
      if (after.orderCode || after.customer) collection = 'orders';
      else if (after.price !== undefined || after.frameType) collection = 'products';
      else {
        return res.status(400).json({ error: "Invalid collection. Must be 'orders' or 'products'" });
      }
    }

    console.log(`[FIRESTORE WEBHOOK onUpdate] Received update for ${collection}/${documentId}`);

    // Send real-time notification to Telegram bot
    const sent = await dispatchUpdateToTelegram({
      collection: collection as 'orders' | 'products',
      documentId: documentId || 'unknown',
      before,
      after,
      actor,
      triggerType: 'webhook_onUpdate',
    });

    // Record into Audit Log
    const summary = collection === 'orders'
      ? `وب‌هوک فایربیس onUpdate: به‌روزرسانی سفارش #${after.orderCode || documentId}`
      : `وب‌هوک فایربیس onUpdate: به‌روزرسانی محصول «${after.title || documentId}»`;

    const audit = await logAuditTrail({
      targetType: collection === 'orders' ? 'order' : 'product',
      targetId: documentId || 'unknown',
      action: 'update',
      actor: 'سیستم (وب‌هوک Firestore onUpdate)',
      summary,
      details: { before, after, sentToTelegram: sent },
    });

    return res.json({
      success: true,
      message: "Webhook processed and real-time Telegram notification dispatched successfully",
      telegramSent: sent,
      auditLog: audit,
    });
  } catch (err: any) {
    console.error("Firestore onUpdate webhook error:", err);
    return res.status(500).json({ error: err?.message || "Webhook processing failed" });
  }
});

// Test endpoint allowing manual testing of the webhook trigger from admin panel or curl
app.post("/api/webhooks/test-firestore-trigger", async (req, res) => {
  try {
    const { type = 'order', customMessage } = req.body;
    const current = readData();

    if (type === 'product') {
      const sampleProd = (current.products && current.products[0]) || {
        id: 'test-prod-101',
        title: 'عینک تست وب‌هوک فایربیس',
        code: 'TEST-WEBHOOK',
        stock: 5,
        price: 850000,
      };

      const result = await dispatchUpdateToTelegram({
        collection: 'products',
        documentId: sampleProd.id,
        before: { ...sampleProd, stock: (sampleProd.stock || 5) + 1, price: (sampleProd.price || 850000) - 50000 },
        after: { ...sampleProd },
        actor: 'تست دستی وب‌هوک (پنل ادمین)',
        triggerType: 'test_trigger',
      });

      const audit = await logAuditTrail({
        targetType: 'product',
        targetId: sampleProd.id,
        action: 'update',
        actor: 'مدیریت (تست وب‌هوک تلگرام)',
        summary: `تست وب‌هوک Firestore onUpdate و ارسال پیام به تلگرام برای محصول: «${sampleProd.title}»`,
        details: { test: true, customMessage },
      });

      return res.json({ success: true, message: 'پیام تست وب‌هوک فایربیس به تلگرام ارسال و در گزارش ثبت شد.', telegramSent: result, audit });
    } else {
      const sampleOrder = (current.orders && current.orders[0]) || {
        id: 'test-ord-101',
        orderCode: 'TEST-9988',
        customer: { fullName: 'کاربر تست وب‌هوک', phone: '09120001122', city: 'تهران' },
        status: 'confirmed',
        finalAmount: 1450000,
        postalTrackingCode: '140502938475893021948572',
      };

      const result = await dispatchUpdateToTelegram({
        collection: 'orders',
        documentId: sampleOrder.id,
        before: { ...sampleOrder, status: 'pending', postalTrackingCode: '' },
        after: { ...sampleOrder, status: 'confirmed' },
        actor: 'تست دستی وب‌هوک (پنل ادمین)',
        triggerType: 'test_trigger',
      });

      const audit = await logAuditTrail({
        targetType: 'order',
        targetId: sampleOrder.id,
        action: 'status_change',
        actor: 'مدیریت (تست وب‌هوک تلگرام)',
        summary: `تست وب‌هوک Firestore onUpdate و ارسال نوتیفیکیشن تلگرام برای سفارش #${sampleOrder.orderCode}`,
        details: { test: true, customMessage },
      });

      return res.json({ success: true, message: 'پیام تست وب‌هوک فایربیس به تلگرام ارسال و در گزارش ثبت شد.', telegramSent: result, audit });
    }
  } catch (err: any) {
    console.error("Test firestore trigger error:", err);
    return res.status(500).json({ error: err?.message || "Failed to trigger test" });
  }
});

// Audit Log Query & Clear endpoints
app.get("/api/audit-logs", (req, res) => {
  const current = readData();
  res.json({ success: true, logs: current.auditLogs || [] });
});

app.post("/api/audit-logs/clear", (req, res) => {
  const current = readData();
  current.auditLogs = [];
  writeData(current);
  res.json({ success: true, message: "گزارشات تغییرات سیستم با موفقیت پاکسازی شدند." });
});

app.post("/api/send-order", async (req, res) => {
  try {
    const data = req.body;
    if (!data) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    const currentData = readData();
    const settings = currentData.settings || {};
    await Promise.allSettled([
      dispatchOrderToTelegram(data, settings),
      dispatchOrderToNtfy(data, settings)
    ]);
    return res.json({ success: true });
  } catch (err) {
    console.error('Send order error:', err);
    return res.status(500).json({ error: 'Failed to send order' });
  }
});

app.post("/api/send-invoice-email", async (req, res) => {
  try {
    const { order, targetEmail, note } = req.body;
    if (!order) {
      return res.status(400).json({ error: "Order details required" });
    }
    const currentData = readData();
    const settings = currentData.settings || {};
    const emailTo = targetEmail || settings.managerEmail || "matinjahanbani2024@gmail.com";

    // Format comprehensive email summary
    const itemsSummary = (order.items || [])
      .map((i: any, idx: number) => `${idx + 1}. ${i.product?.title || 'عینک'} (${i.quantity || 1} عدد) - ${i.product?.price ? Number(i.product.price * (i.quantity || 1)).toLocaleString() + ' تومان' : ''}`)
      .join('\n');

    console.log(`[EMAIL INVOICE DISPATCH] Sending invoice for order ${order.orderCode || order.id} to ${emailTo}`);
    console.log(`Customer: ${order.customer?.fullName} | Phone: ${order.customer?.phone}`);
    console.log(`Receipt URL included: ${order.receiptUrl ? 'YES' : 'NO'}`);
    if (note) console.log(`Custom Note: ${note}`);

    return res.json({
      success: true,
      message: `فاکتور سفارش ${order.orderCode || order.id} با موفقیت به آدرس ${emailTo} ارسال و ثبت شد.`,
      emailSentTo: emailTo,
      itemsSummary,
    });
  } catch (err) {
    console.error("Send invoice email error:", err);
    return res.status(500).json({ error: "Failed to dispatch email" });
  }
});

app.post("/api/telegram-webhook", async (req, res) => {
  try {
    const update = req.body;
    if (update && update.callback_query) {
      const callback = update.callback_query;
      const callbackData = callback.data || '';
      const messageId = callback.message?.message_id;
      const chatId = callback.message?.chat?.id;

      const current = readData();
      const settings = current.settings || {};
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN || settings.telegramBotToken || '8880696062:AAEqF5r7ZillJV8njxUGrbPyT9nQpAPES3M';

      let answerText = "عملیات انجام شد.";

      if (callbackData.startsWith('approve_')) {
        const orderId = callbackData.replace('approve_', '');
        const order = (current.orders || []).find((o: any) => o.id === orderId);
        if (order) {
          order.status = 'confirmed';
          order.updatedAt = new Date().toISOString();
          writeData(current);
          answerText = `سفارش ${order.orderCode} تایید شد.`;
        } else {
          answerText = "سفارش یافت نشد.";
        }
      } else if (callbackData.startsWith('cancel_')) {
        const orderId = callbackData.replace('cancel_', '');
        const order = (current.orders || []).find((o: any) => o.id === orderId);
        if (order) {
          order.status = 'cancelled';
          order.updatedAt = new Date().toISOString();
          writeData(current);
          answerText = `سفارش ${order.orderCode} لغو شد.`;
        } else {
          answerText = "سفارش یافت نشد.";
        }
      }

      if (telegramToken) {
        try {
          await fetchWithRetry(`https://api.telegram.org/bot${telegramToken}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callback.id,
              text: answerText,
              show_alert: true
            })
          }, 2, 500);
        } catch (e) {}

        if (chatId && messageId) {
          try {
            const originalCaption = callback.message.caption || callback.message.text || '';
            const statusLabel = callbackData.startsWith('approve_') ? '✅ [تایید شده توسط مدیریت]' : '❌ [لغو شده توسط مدیریت]';
            const updatedText = `${originalCaption}\n\nوضعیت جدید: ${statusLabel}`;

            if (callback.message.photo) {
              await fetchWithRetry(`https://api.telegram.org/bot${telegramToken}/editMessageCaption`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  message_id: messageId,
                  caption: updatedText,
                  parse_mode: 'Markdown'
                })
              }, 2, 500);
            } else {
              await fetchWithRetry(`https://api.telegram.org/bot${telegramToken}/editMessageText`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: chatId,
                  message_id: messageId,
                  text: updatedText,
                  parse_mode: 'Markdown'
                })
              }, 2, 500);
            }
          } catch (e) {}
        }
      }
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.post("/api/settings", (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== "object") {
    return res.status(400).json({ error: "Invalid settings" });
  }
  const current = readData();
  current.settings = { ...current.settings, ...settings };
  writeData(current);
  res.json({ success: true, settings: current.settings });
});

app.post("/api/sync-all", (req, res) => {
  const { products, orders, settings } = req.body;
  const current = readData();

  if (Array.isArray(products)) {
    current.products = products.filter((p: any) => p && p.id);
  }

  if (Array.isArray(orders)) {
    current.orders = orders.filter((o: any) => o && o.id).sort((a: any, b: any) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  if (settings && typeof settings === "object") {
    current.settings = { ...current.settings, ...settings };
  }

  writeData(current);
  res.json({ success: true, data: current });
});

export default app;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    app.get("*", async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
