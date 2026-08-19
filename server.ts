import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// CORS middleware for all devices & webviews
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
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
    { id: 'accessories', label: 'لوازم جانبی' },
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

let inMemoryStore: { products: any[]; orders: any[]; settings: any; analytics?: any; dataVersion?: number } | null = null;
const liveSessions = new Map<string, { lastSeen: number; page: string; device: string; ip?: string }>();
const todayVisitorSet = new Set<string>();

function readData() {
  if (inMemoryStore) {
    return inMemoryStore;
  }
  const filePath = getWritableDataFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(content);
      inMemoryStore = {
        products: Array.isArray(parsed.products) ? parsed.products : [],
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
        analytics: { ...DEFAULT_ANALYTICS, ...(parsed.analytics || {}) },
      };
      return inMemoryStore;
    }
  } catch (err) {
    console.error("Error reading store file:", err);
  }
  inMemoryStore = { products: [], orders: [], settings: DEFAULT_SETTINGS, analytics: DEFAULT_ANALYTICS };
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

// API Endpoints
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

  sseClients.add(res);

  req.on("close", () => {
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
  current.products = products.filter((p: any) => p && p.id);
  writeData(current);
  res.json({ success: true, count: current.products.length });
});

app.post("/api/orders", (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) {
    return res.status(400).json({ error: "Invalid orders" });
  }
  const current = readData();
  current.orders = orders.filter((o: any) => o && o.id).sort((a: any, b: any) => 
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  writeData(current);
  res.json({ success: true, count: current.orders.length });
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

  res.json({ success: true, order });
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
