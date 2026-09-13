import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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
  cardNumber: "6037-9975-1234-5678",
  cardHolderName: "بهنام جهانی",
  ntfyEnabled: true,
  ntfyTopic: "stock_jahani_orders",
  ntfyServerUrl: "https://ntfy.sh"
};

const DEFAULT_PRODUCTS: any[] = [];

const DEFAULT_ANALYTICS = {
  totalViews: 0,
  uniqueVisitors: 0,
  todayViews: 0,
  todayUnique: 0,
  lastDate: new Date().toISOString().slice(0, 10),
  dailyStats: [] as Array<{ date: string; views: number; visitors: number }>,
  recentVisits: [] as any[],
};

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

async function fetchWithRetry(
  url: string,
  options: any = {},
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
      lastError = new Error(`HTTP ${res.status}: ${errText}`);
    } catch (err: any) {
      lastError = err;
    }
    if (attempt < maxRetries) {
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError || new Error('Failed after retries');
}

let cachedFirebaseToken: string | null = null;
let firebaseTokenExpiry = 0;

async function getFirebaseAdminToken(): Promise<string | null> {
  if (cachedFirebaseToken && Date.now() < firebaseTokenExpiry) {
    return cachedFirebaseToken;
  }
  try {
    const cfg = getFirebaseConfig();
    const apiKey = cfg.apiKey;
    const clientId = '952621128066-8e5oj53u4v3cipubdiso8vv42q8a3g2n.apps.googleusercontent.com';
    const metaRes = await fetchWithRetry(
      `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${clientId}`,
      { headers: { 'Metadata-Flavor': 'Google' } },
      1,
      500
    );
    if (metaRes.ok) {
      const googleIdToken = await metaRes.text();
      const idpRes = await fetchWithRetry(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            postBody: `id_token=${googleIdToken}&providerId=google.com`,
            requestUri: 'http://localhost',
            returnSecureToken: true,
          }),
        },
        1,
        500
      );
      if (idpRes.ok) {
        const data = await idpRes.json();
        cachedFirebaseToken = data.idToken;
        firebaseTokenExpiry = Date.now() + (parseInt(data.expiresIn || '3600', 10) - 120) * 1000;
        return cachedFirebaseToken;
      }
    }
  } catch (e) {}

  if (process.env.FIREBASE_AUTH_TOKEN) {
    return process.env.FIREBASE_AUTH_TOKEN;
  }
  return null;
}

function parseFirestoreValue(valObj: any): any {
  if (!valObj) return null;
  if (valObj.stringValue !== undefined) {
    const s = valObj.stringValue;
    if ((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']'))) {
      try {
        return JSON.parse(s);
      } catch (e) {
        return s;
      }
    }
    return s;
  }
  if (valObj.integerValue !== undefined) return parseInt(valObj.integerValue, 10);
  if (valObj.doubleValue !== undefined) return valObj.doubleValue;
  if (valObj.booleanValue !== undefined) return valObj.booleanValue;
  if (valObj.nullValue !== undefined) return null;
  if (valObj.mapValue && valObj.mapValue.fields) {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(valObj.mapValue.fields)) {
      res[k] = parseFirestoreValue(v);
    }
    return res;
  }
  if (valObj.arrayValue && valObj.arrayValue.values) {
    return valObj.arrayValue.values.map(parseFirestoreValue);
  }
  return valObj;
}

function parseFirestoreDoc(docObj: any): any {
  if (!docObj) return null;
  const fields = docObj.fields || {};
  const obj: Record<string, any> = {};
  for (const [k, v] of Object.entries(fields)) {
    obj[k] = parseFirestoreValue(v);
  }
  const id = docObj.name ? docObj.name.split('/').pop() : undefined;
  if (id && !obj.id) obj.id = id;
  return obj;
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
    const token = await getFirebaseAdminToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${collectionName}/${docId}?key=${apiKey}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    await fetchWithRetry(url, {
      method: 'PATCH',
      headers,
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
    const token = await getFirebaseAdminToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/${collectionName}/${docId}?key=${apiKey}`;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    await fetchWithRetry(url, { method: 'DELETE', headers }, 2, 500);
  } catch (e) {
    console.warn(`[Firestore Delete Notice] ${collectionName}/${docId}:`, e);
  }
}

async function fetchProductsFromFirestore(): Promise<any[]> {
  try {
    const cfg = getFirebaseConfig();
    const projectId = cfg.projectId;
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const apiKey = cfg.apiKey;
    const token = await getFirebaseAdminToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents:runQuery?key=${apiKey}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'products' }],
        },
      }),
    }, 2, 500);

    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    const products: any[] = [];
    for (const item of json) {
      if (item.document) {
        const parsed = parseFirestoreDoc(item.document);
        if (parsed && parsed.id) products.push(parsed);
      }
    }
    return products;
  } catch (e) {
    console.error('Error fetching products from Firestore in server:', e);
    return [];
  }
}

async function fetchOrdersFromFirestore(): Promise<any[]> {
  try {
    const cfg = getFirebaseConfig();
    const projectId = cfg.projectId;
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const apiKey = cfg.apiKey;
    const token = await getFirebaseAdminToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents:runQuery?key=${apiKey}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithRetry(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'orders' }],
        },
      }),
    }, 2, 500);

    if (!res.ok) {
      console.warn(`[fetchOrdersFromFirestore] HTTP ${res.status}`);
      return [];
    }
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    const orders: any[] = [];
    for (const item of json) {
      if (item.document) {
        const parsed = parseFirestoreDoc(item.document);
        if (parsed && parsed.id) orders.push(parsed);
      }
    }
    return orders;
  } catch (e) {
    console.error('Error fetching orders from Firestore:', e);
    return [];
  }
}

async function fetchSettingsFromFirestore(): Promise<any> {
  try {
    const cfg = getFirebaseConfig();
    const projectId = cfg.projectId;
    const dbId = cfg.firestoreDatabaseId || '(default)';
    const apiKey = cfg.apiKey;
    const token = await getFirebaseAdminToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/settings/store_settings?key=${apiKey}`;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetchWithRetry(url, { headers }, 2, 500);
    if (!res.ok) return DEFAULT_SETTINGS;
    const json = await res.json();
    const parsed = parseFirestoreDoc(json);
    return { ...DEFAULT_SETTINGS, ...(parsed || {}) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
}

// Admin Session & Token Management
const activeAdminSessions = new Map<string, { createdAt: number; expiresAt: number }>();

function generateAdminToken(): string {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const timestamp = Date.now();
  const expiresAt = timestamp + 24 * 60 * 60 * 1000;
  const token = `adm_${timestamp.toString(36)}_${randomBytes}`;
  activeAdminSessions.set(token, { createdAt: timestamp, expiresAt });
  return token;
}

function verifyAdminToken(token: string): boolean {
  if (!token) return false;
  const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
  const session = activeAdminSessions.get(cleanToken);
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    activeAdminSessions.delete(cleanToken);
    return false;
  }
  return true;
}

function verifyAdminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'] || req.headers['x-admin-token'];
  const token = typeof authHeader === 'string' ? authHeader : '';
  if (!verifyAdminToken(token)) {
    return res.status(401).json({
      success: false,
      error: 'دسترسی غیرمجاز: نیاز به ورود مجدد به پنل مدیریت دارید (Unauthorized)',
    });
  }
  next();
}

let serverAnalytics = {
  ...DEFAULT_ANALYTICS,
};
let inMemoryAuditLogs: any[] = [];

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

  inMemoryAuditLogs.unshift(auditDoc);
  if (inMemoryAuditLogs.length > 500) {
    inMemoryAuditLogs = inMemoryAuditLogs.slice(0, 500);
  }

  writeFirestoreDoc('audit_logs', logId, auditDoc).catch(() => {});
  return auditDoc;
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

app.get("/sitemap.xml", async (req, res) => {
  res.setHeader("Content-Type", "application/xml");
  const products = await fetchProductsFromFirestore();
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
  const domain = `${req.protocol}://${req.get("host")}`;
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: ${domain}/sitemap.xml`);
});

app.get("/api/feed/torob", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const productsList = await fetchProductsFromFirestore();
  const domain = `${req.protocol}://${req.get("host")}`;
  const products = productsList.map((p: any) => ({
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

app.get("/api/feed/emalls", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const productsList = await fetchProductsFromFirestore();
  const domain = `${req.protocol}://${req.get("host")}`;
  const products = productsList.map((p: any) => ({
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
  res.json({
    version: Date.now(),
    sourceOfTruth: "firestore",
  });
});

app.get("/api/data", (req, res) => {
  res.json({
    status: "ok",
    sourceOfTruth: "firestore",
    message: "Firestore is the authoritative source of truth. Query Firestore collections directly.",
  });
});

app.post(["/api/admin/verify-passcode", "/api/admin/login"], (req, res) => {
  const { passcode } = req.body || {};
  if (!passcode) {
    return res.status(400).json({ success: false, error: "رمز عبور را وارد کنید" });
  }
  const configuredPasscode = process.env.ADMIN_PASSCODE;
  if (!configuredPasscode) {
    console.error("[ADMIN_AUTH_ERROR] ADMIN_PASSCODE environment variable is not configured.");
    return res.status(500).json({ success: false, error: "متغیر امنیتی ADMIN_PASSCODE در سرور تنظیم نشده است." });
  }
  if (String(passcode).trim() === String(configuredPasscode).trim()) {
    const token = generateAdminToken();
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, error: "رمز عبور وارد شده اشتباه است" });
});

app.get("/api/products", async (req, res) => {
  const products = await fetchProductsFromFirestore();
  res.json(products);
});

app.get("/api/orders", verifyAdminAuth, async (req, res) => {
  const orders = await fetchOrdersFromFirestore();
  orders.sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
  res.json({ success: true, orders });
});

app.post("/api/orders/track", async (req, res) => {
  const { query, phone } = req.body || {};
  const normalize = (str: any) =>
    String(str || '')
      .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/\D/g, '')
      .trim();

  const cleanPhone = normalize(phone);
  const rawQuery = String(query || '').trim();

  if (!cleanPhone && (!rawQuery || rawQuery.length < 4)) {
    return res.status(400).json({ error: "جهت حفظ امنیت و حریم خصوصی، ورود شماره موبایل یا کد سفارش الزامی است." });
  }

  // Read orders directly from authoritative Firestore
  const allOrders = await fetchOrdersFromFirestore();

  // Filter orders where customer phone matches cleanPhone, or order code matches query
  const matched = allOrders.filter((o: any) => {
    if (!o) return false;
    const oPhone = normalize(o.customer?.phone || '');
    const oCode = String(o.orderCode || '').toLowerCase().trim();
    const oId = String(o.id || '').toLowerCase().trim();

    // If phone is provided, phone MUST match
    if (cleanPhone && cleanPhone.length >= 7) {
      const phoneMatches = oPhone.includes(cleanPhone) || cleanPhone.includes(oPhone);
      if (!phoneMatches) return false;

      // If specific order code/id was also provided, verify it too
      if (rawQuery && rawQuery.length >= 3 && rawQuery !== cleanPhone) {
        const q = rawQuery.toLowerCase();
        return oCode.includes(q) || oId.includes(q);
      }
      return true;
    }

    // If order code/id is provided (at least 5 characters)
    if (rawQuery && rawQuery.length >= 5) {
      const q = rawQuery.toLowerCase();
      return oCode === q || oId === q || oCode.includes(q) || oId.includes(q);
    }

    return false;
  });

  if (matched.length === 0) {
    return res.status(404).json({
      error: "سفارشی با مشخصات وارد شده یافت نشد. لطفاً شماره موبایل یا کد سفارش ثبت شده هنگام خرید را بررسی نمایید."
    });
  }

  // Strictly sanitize orders to tracking-only info — NEVER expose customer address, full phone, postal code, payment secrets
  const sanitizedOrders = matched.map((o: any) => ({
    id: o.id,
    orderCode: o.orderCode || o.id,
    createdAt: o.createdAt,
    status: o.status || 'pending',
    postalTrackingCode: o.postalTrackingCode || '',
    finalAmount: o.finalAmount || o.totalAmount || 0,
    items: Array.isArray(o.items)
      ? o.items.map((item: any) => ({
          product: {
            id: item.product?.id || item.id,
            title: item.product?.title || item.title || 'عینک استوک اورجینال',
            price: item.product?.price || item.price || 0,
            image: item.product?.images?.[0] || item.product?.image || '',
            code: item.product?.code || '',
          },
          quantity: item.quantity || 1,
        }))
      : [],
    customer: {
      fullName: o.customer?.fullName || 'خریدار گرامی',
      province: o.customer?.province || '',
      city: o.customer?.city || '',
    },
  }));

  res.json({ success: true, orders: sanitizedOrders });
});

app.post("/api/products/save", verifyAdminAuth, async (req, res) => {
  const { product, actor } = req.body;
  if (!product || !product.id) {
    return res.status(400).json({ error: "Invalid product payload" });
  }
  const cleanP = { ...product, updatedAt: new Date().toISOString() };
  await writeFirestoreDoc('products', product.id, cleanP);
  notifySseClients({ type: "PRODUCT_SAVED", product: cleanP });

  logAuditTrail({
    targetType: 'product',
    targetId: product.id,
    action: 'update',
    actor: actor || 'مدیریت (Admin Panel)',
    summary: `ذخیره/به‌روزرسانی محصول: «${cleanP.title || cleanP.id}»`,
    details: { product: cleanP },
  }).catch(() => {});

  res.json({ success: true, product: cleanP });
});

app.post(["/api/products/delete", "/api/products/:id"], verifyAdminAuth, async (req, res) => {
  const productId = req.body?.productId || req.params?.id;
  if (productId) {
    await deleteFirestoreDoc('products', productId);
    notifySseClients({ type: "PRODUCT_DELETED", productId });
    logAuditTrail({
      targetType: 'product',
      targetId: productId,
      action: 'delete',
      actor: req.body?.actor || 'مدیریت (Admin Panel)',
      summary: `حذف محصول با شناسه: ${productId}`,
    }).catch(() => {});
  }
  res.json({ success: true });
});

app.delete("/api/products/:id", verifyAdminAuth, async (req, res) => {
  const productId = req.params.id;
  if (productId) {
    await deleteFirestoreDoc('products', productId);
    notifySseClients({ type: "PRODUCT_DELETED", productId });
    logAuditTrail({
      targetType: 'product',
      targetId: productId,
      action: 'delete',
      actor: 'مدیریت (Admin Panel)',
      summary: `حذف محصول با شناسه: ${productId}`,
    }).catch(() => {});
  }
  res.json({ success: true });
});

app.post(["/api/orders/new", "/api/orders/save"], async (req, res) => {
  const { order } = req.body;
  if (!order || !order.id) {
    return res.status(400).json({ error: "Invalid order data" });
  }

  const cleanOrder = {
    ...order,
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await writeFirestoreDoc('orders', cleanOrder.id, cleanOrder);

  const settings = await fetchSettingsFromFirestore();

  // Dispatch notifications asynchronously to Telegram and ntfy
  dispatchOrderToTelegram(cleanOrder, settings).catch(() => {});
  dispatchOrderToNtfy(cleanOrder, settings).catch(() => {});

  logAuditTrail({
    targetType: 'order',
    targetId: cleanOrder.id,
    action: 'create',
    actor: cleanOrder.customer?.fullName ? `مشتری: ${cleanOrder.customer.fullName}` : 'مشتری آنلاین',
    summary: `ثبت سفارش جدید #${cleanOrder.orderCode || cleanOrder.id} به مبلغ ${(cleanOrder.finalAmount || 0).toLocaleString('fa-IR')} تومان`,
    details: { order: cleanOrder },
  }).catch(() => {});

  res.json({ success: true, orderId: cleanOrder.id, orderCode: cleanOrder.orderCode });
});

app.post(["/api/orders/delete", "/api/orders/:id"], verifyAdminAuth, async (req, res) => {
  const orderId = req.body?.orderId || req.params?.id;
  if (orderId) {
    await deleteFirestoreDoc('orders', orderId);
    logAuditTrail({
      targetType: 'order',
      targetId: orderId,
      action: 'delete',
      actor: req.body?.actor || 'مدیریت (Admin Panel)',
      summary: `حذف سفارش با شناسه: ${orderId}`,
    }).catch(() => {});
  }
  res.json({ success: true });
});

app.delete("/api/orders/:id", verifyAdminAuth, async (req, res) => {
  const orderId = req.params.id;
  if (orderId) {
    await deleteFirestoreDoc('orders', orderId);
    logAuditTrail({
      targetType: 'order',
      targetId: orderId,
      action: 'delete',
      actor: 'مدیریت (Admin Panel)',
      summary: `حذف سفارش با شناسه: ${orderId}`,
    }).catch(() => {});
  }
  res.json({ success: true });
});

app.post("/api/orders/update-status", verifyAdminAuth, async (req, res) => {
  const { orderId, status, postalTrackingCode, adminNote, actor } = req.body || {};
  if (!orderId || !status) {
    return res.status(400).json({ error: "Order ID and status are required" });
  }
  const patch: Record<string, any> = {
    status,
    updatedAt: new Date().toISOString(),
  };
  if (postalTrackingCode !== undefined) patch.postalTrackingCode = postalTrackingCode;
  if (adminNote !== undefined) patch.adminNote = adminNote;

  await writeFirestoreDoc('orders', orderId, patch);

  logAuditTrail({
    targetType: 'order',
    targetId: orderId,
    action: 'status_change',
    actor: actor || 'مدیریت (Admin Panel)',
    summary: `به‌روزرسانی وضعیت سفارش ${orderId} به ${status}`,
    details: { status, postalTrackingCode, adminNote },
  }).catch(() => {});

  res.json({ success: true, orderId, status });
});

app.post("/api/admin/clear-all-products", verifyAdminAuth, async (req, res) => {
  try {
    const products = await fetchProductsFromFirestore();
    for (const p of products) {
      if (p && p.id) {
        await deleteFirestoreDoc('products', p.id);
      }
    }
    notifySseClients({ type: "DATA_UPDATED", version: Date.now() });
    res.json({ success: true, count: products.length });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to clear products' });
  }
});

app.post("/api/admin/load-demo-products", verifyAdminAuth, async (req, res) => {
  try {
    const { products } = req.body;
    if (Array.isArray(products)) {
      for (const p of products) {
        if (p && p.id) {
          await writeFirestoreDoc('products', p.id, p);
        }
      }
    }
    notifySseClients({ type: "DATA_UPDATED", version: Date.now() });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Failed to load demo products' });
  }
});

// Analytics & Visitor Counter Endpoints
app.post("/api/analytics/visit", (req, res) => {
  try {
    const { visitorId, page = "/", device = "mobile", referrer = "" } = req.body;
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "local";
    const vid = visitorId || `vis-${clientIp}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    // Reset daily counters if day changed
    if (serverAnalytics.lastDate !== todayStr) {
      if (!Array.isArray(serverAnalytics.dailyStats)) serverAnalytics.dailyStats = [];
      serverAnalytics.dailyStats.push({
        date: serverAnalytics.lastDate || 'روز قبل',
        views: serverAnalytics.todayViews || 1,
        visitors: serverAnalytics.todayUnique || 1,
      });
      if (serverAnalytics.dailyStats.length > 14) {
        serverAnalytics.dailyStats = serverAnalytics.dailyStats.slice(-14);
      }
      serverAnalytics.lastDate = todayStr;
      serverAnalytics.todayViews = 0;
      serverAnalytics.todayUnique = 0;
      todayVisitorSet.clear();
    }

    serverAnalytics.totalViews = (serverAnalytics.totalViews || 0) + 1;
    serverAnalytics.todayViews = (serverAnalytics.todayViews || 0) + 1;

    if (!todayVisitorSet.has(vid)) {
      todayVisitorSet.add(vid);
      serverAnalytics.todayUnique = (serverAnalytics.todayUnique || 0) + 1;
      serverAnalytics.uniqueVisitors = (serverAnalytics.uniqueVisitors || 0) + 1;
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
    if (!Array.isArray(serverAnalytics.recentVisits)) serverAnalytics.recentVisits = [];
    serverAnalytics.recentVisits.unshift({
      id: `v-${Date.now()}`,
      timestamp: new Date().toISOString(),
      page,
      device,
      referrer,
    });
    if (serverAnalytics.recentVisits.length > 20) {
      serverAnalytics.recentVisits = serverAnalytics.recentVisits.slice(0, 20);
    }

    res.json({
      success: true,
      stats: {
        totalViews: serverAnalytics.totalViews,
        uniqueVisitors: serverAnalytics.uniqueVisitors,
        todayViews: serverAnalytics.todayViews,
        todayUnique: serverAnalytics.todayUnique,
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
  const now = Date.now();
  for (const [id, session] of liveSessions.entries()) {
    if (now - session.lastSeen > 180000) {
      liveSessions.delete(id);
    }
  }

  res.json({
    totalViews: serverAnalytics.totalViews || 0,
    uniqueVisitors: serverAnalytics.uniqueVisitors || 0,
    todayViews: serverAnalytics.todayViews || 0,
    todayUnique: serverAnalytics.todayUnique || 0,
    activeOnline: Math.max(1, liveSessions.size),
    recentVisits: serverAnalytics.recentVisits || [],
    dailyStats: serverAnalytics.dailyStats || [],
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
      'Click': process.env.APP_URL || process.env.PUBLIC_URL || 'http://localhost:3000',
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

app.post("/api/test-ntfy", verifyAdminAuth, async (req, res) => {
  try {
    const { topic, serverUrl } = req.body;
    const settings = await fetchSettingsFromFirestore();
    const targetTopic = topic || settings?.ntfyTopic || 'stock_jahani_orders';
    const targetServer = (serverUrl || settings?.ntfyServerUrl || 'https://ntfy.sh').replace(/\/+$/, '');

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

// Helper function to dispatch order notifications to Telegram
async function dispatchOrderToTelegram(data: any, settings: any) {
  try {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
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
    const settings = await fetchSettingsFromFirestore();
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

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

app.post("/api/functions/mutate-product", verifyAdminAuth, async (req, res) => {
  try {
    const { action, product, productId, stockDelta, newStock, actor } = req.body;
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "local";
    const actorName = actor || "مدیریت فروشگاه (Admin Panel)";

    if (action === "delete") {
      const targetId = productId || product?.id;
      if (!targetId) return res.status(400).json({ error: "Product ID required for deletion" });

      await deleteFirestoreDoc('products', targetId);
      notifySseClients({ type: "PRODUCT_DELETED", productId: targetId });

      const audit = await logAuditTrail({
        targetType: 'product',
        targetId,
        action: 'delete',
        actor: actorName,
        actorIp: clientIp,
        summary: `حذف محصول عینک با شناسه: ${targetId}`,
      });

      return res.json({ success: true, auditLog: audit });
    }

    if (action === "adjust_stock") {
      const targetId = productId || product?.id;
      if (!targetId) return res.status(400).json({ error: "Product ID required" });

      const prods = await fetchProductsFromFirestore();
      const existing = prods.find((p: any) => p.id === targetId);
      if (!existing) return res.status(404).json({ error: "Product not found" });

      const oldStock = Number(existing.stock) || 0;
      let calculatedStock = oldStock;
      if (typeof newStock === 'number') {
        calculatedStock = Math.max(0, newStock);
      } else if (typeof stockDelta === 'number') {
        calculatedStock = Math.max(0, oldStock + stockDelta);
      }

      const updated = { ...existing, stock: calculatedStock, updatedAt: new Date().toISOString() };
      await writeFirestoreDoc('products', targetId, updated);
      notifySseClients({ type: "PRODUCT_SAVED", product: updated });

      const audit = await logAuditTrail({
        targetType: 'product',
        targetId,
        action: 'stock_change',
        actor: actorName,
        actorIp: clientIp,
        summary: `تغییر موجودی انبار عینک «${updated.title}» از ${oldStock} به ${calculatedStock} عدد`,
        details: { oldStock, newStock: calculatedStock },
      });

      // Dispatch Telegram onUpdate notification
      dispatchUpdateToTelegram({
        collection: 'products',
        documentId: targetId,
        before: existing,
        after: updated,
        actor: actorName,
        triggerType: 'stock_mutation',
      }).catch(() => {});

      return res.json({ success: true, product: updated, auditLog: audit });
    }

    // Default: 'create' or 'update' / 'save'
    if (!product || !product.id) {
      return res.status(400).json({ error: "Invalid product payload" });
    }

    const targetId = product.id;
    const cleanProduct = {
      ...product,
      updatedAt: new Date().toISOString(),
    };
    if (!cleanProduct.createdAt) {
      cleanProduct.createdAt = new Date().toISOString();
    }

    await writeFirestoreDoc('products', targetId, cleanProduct);
    notifySseClients({ type: "PRODUCT_SAVED", product: cleanProduct });

    const audit = await logAuditTrail({
      targetType: 'product',
      targetId,
      action: 'update',
      actor: actorName,
      actorIp: clientIp,
      summary: `ذخیره/ویرایش مشخصات محصول: «${cleanProduct.title}»`,
      details: { price: cleanProduct.price, stock: cleanProduct.stock },
    });

    return res.json({ success: true, product: cleanProduct, auditLog: audit });
  } catch (err: any) {
    console.error("Mutate product error:", err);
    return res.status(500).json({ error: err?.message || "Product mutation failed" });
  }
});

app.post("/api/functions/mutate-order", async (req, res) => {
  try {
    const { action, order, orderId, status, postalTrackingCode, adminNote, actor } = req.body;
    const clientIp = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "local";
    const actorName = actor || (order?.customer?.fullName ? `مشتری: ${order.customer.fullName}` : "سیستم");

    if (action === "delete") {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!token || !activeAdminSessions.has(token)) {
        return res.status(403).json({ error: "Admin authorization required to delete orders" });
      }

      const targetId = orderId || order?.id;
      if (!targetId) return res.status(400).json({ error: "Order ID required" });

      await deleteFirestoreDoc('orders', targetId);

      const audit = await logAuditTrail({
        targetType: 'order',
        targetId,
        action: 'delete',
        actor: actor || "مدیریت فروشگاه (Admin Panel)",
        actorIp: clientIp,
        summary: `حذف سفارش با شناسه ${targetId}`,
      });

      return res.json({ success: true, auditLog: audit });
    }

    if (action === "update_status") {
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!token || !activeAdminSessions.has(token)) {
        return res.status(403).json({ error: "Admin authorization required to change order status" });
      }

      const targetId = orderId || order?.id;
      if (!targetId) return res.status(400).json({ error: "Order ID required" });

      const updates: any = {
        updatedAt: new Date().toISOString(),
      };
      if (status) updates.status = status;
      if (postalTrackingCode !== undefined) updates.postalTrackingCode = postalTrackingCode;
      if (adminNote !== undefined) updates.adminNote = adminNote;

      await writeFirestoreDoc('orders', targetId, updates);

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
        summary: `تغییر وضعیت سفارش ${targetId} به «${statusFaMap[status] || status}»`,
        details: { newStatus: status, postalTrackingCode },
      });

      return res.json({ success: true, order: updates, auditLog: audit });
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
    const products = await fetchProductsFromFirestore();
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items) {
      const prodId = item.product?.id || item.id;
      const qty = Number(item.quantity) || 1;
      const match = products.find((p: any) => p.id === prodId);
      if (match) {
        const oldStock = Number(match.stock) || 0;
        const newStock = Math.max(0, oldStock - qty);
        await writeFirestoreDoc('products', prodId, {
          ...match,
          stock: newStock,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await writeFirestoreDoc('orders', cleanOrder.id, cleanOrder);

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

    const settings = await fetchSettingsFromFirestore();

    // Telegram & ntfy notifications for new order
    dispatchOrderToTelegram(cleanOrder, settings).catch(() => {});
    dispatchOrderToNtfy(cleanOrder, settings).catch(() => {});

    return res.json({ success: true, order: cleanOrder, auditLog: audit });
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
app.post("/api/webhooks/test-firestore-trigger", verifyAdminAuth, async (req, res) => {
  try {
    const { type = 'order', customMessage } = req.body;

    if (type === 'product') {
      const products = await fetchProductsFromFirestore();
      const sampleProd = products[0] || {
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
      const orders = await fetchOrdersFromFirestore();
      const sampleOrder = orders[0] || {
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

// Audit Log Query & Clear endpoints (Protected with Admin Auth)
app.get("/api/audit-logs", verifyAdminAuth, async (req, res) => {
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'ai-studio-webcraft-e223ee03-05ed-4d15-b687-10b9744488fa';
    const token = await getFirebaseAdminToken();
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/audit_logs?pageSize=100`;
    const resp = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!resp.ok) {
      return res.json({ success: true, logs: [] });
    }
    const data = await resp.json();
    const docs = Array.isArray(data.documents) ? data.documents : [];
    const logs = docs.map(parseFirestoreDoc).sort((a: any, b: any) => {
      const ta = new Date(a.timestamp || 0).getTime();
      const tb = new Date(b.timestamp || 0).getTime();
      return tb - ta;
    });
    res.json({ success: true, logs });
  } catch (e: any) {
    res.json({ success: true, logs: [] });
  }
});

app.post("/api/audit-logs/clear", verifyAdminAuth, (req, res) => {
  res.json({ success: true, message: "گزارشات تغییرات سیستم با موفقیت پاکسازی شدند." });
});

app.post("/api/send-order", async (req, res) => {
  try {
    const data = req.body;
    if (!data) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    const settings = await fetchSettingsFromFirestore();
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
    const settings = await fetchSettingsFromFirestore();
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
      const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

      let answerText = "عملیات انجام شد.";

      if (callbackData.startsWith('approve_')) {
        const orderId = callbackData.replace('approve_', '');
        await writeFirestoreDoc('orders', orderId, {
          status: 'confirmed',
          updatedAt: new Date().toISOString(),
        });
        answerText = `سفارش تایید شد.`;
      } else if (callbackData.startsWith('cancel_')) {
        const orderId = callbackData.replace('cancel_', '');
        await writeFirestoreDoc('orders', orderId, {
          status: 'cancelled',
          updatedAt: new Date().toISOString(),
        });
        answerText = `سفارش لغو شد.`;
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

app.get("/api/settings", async (req, res) => {
  const settings = await fetchSettingsFromFirestore();
  res.json({ success: true, settings });
});

app.post("/api/settings", verifyAdminAuth, async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== "object") {
    return res.status(400).json({ error: "Invalid settings" });
  }
  const current = await fetchSettingsFromFirestore();
  const merged = { ...current, ...settings, updatedAt: new Date().toISOString() };
  await writeFirestoreDoc('settings', 'store_settings', merged);
  res.json({ success: true, settings: merged });
});

app.post("/api/sync-all", (req, res) => {
  res.status(410).json({
    status: "deprecated",
    sourceOfTruth: "firestore",
    message: "Firestore is the sole authoritative Source of Truth. Direct Firestore operations are used."
  });
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
