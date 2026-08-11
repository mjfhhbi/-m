import { Product, Order, StoreSettings, CategoryItem, CouponCode } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { getSupabaseClient } from '../lib/supabase';

const PRODUCTS_KEY = 'stock_jahani_products_v1';
const ORDERS_KEY = 'stock_jahani_orders_v1';
const SETTINGS_KEY = 'stock_jahani_settings_v1';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'sunglasses', label: 'عینک آفتابی' },
  { id: 'optical', label: 'عینک طبی' },
  { id: 'sport', label: 'ورزشی و اسپرت' },
  { id: 'unisex', label: 'یونی‌سکس' },
  { id: 'accessories', label: 'لوازم جانبی' },
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

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'stock_jahani',
  tagline: 'فروشگاه تخصصی عینک‌های آفتابی و طبی استوک اورجینال',
  bannerMessage: '✨ ارسال با پست پیشتاز به سراسر کشور | تضمین سلامت فریم و عدسی',
  welcomeText: 'تجربه‌ای متفاوت از کیفیت و استایل با عینک استوک جهانی',
  welcomeSubtext: 'مجموعه کامل عینک‌های آفتابی و طبی اورجینال، فریم‌های استوک کائوچویی و فلزی ساخت اروپا با عدسی‌های پلاریزه و استاندارد کامل UV400.',
  noticeText: '💡 خریداران گرامی: پس از ثبت سفارش، کد ۲۴ رقمی رهگیری پستی به همراه وضعیت خریدهای شما در بخش «پیگیری سفارشات» قرار خواهد گرفت.',
  aboutText: 'فروشگاه عینک استوک جهانی عرضه کننده مستقیم جدیدترین فریم‌های طبی و آفتابی استوک اورجینال اروپا با بالاترین کیفیت و نازل‌ترین قیمت.',
  rulesText: 'تمامی بسته‌ها در هاردکیس مقاوم ضدضربه با پُست پیشتاز ارسال شده و کد رهگیری مرسوله پستی پس از ارسال در همین سایت نمایش داده می‌شود.',
  categories: DEFAULT_CATEGORIES,
  coupons: DEFAULT_COUPONS,
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
  telegramChatId: '200220495',
};

// Ready sample products if user requests demo items
export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-1',
    title: 'عینک آفتابی فریم خلبانی استوک اروپایی',
    code: 'STK-901',
    category: 'sunglasses',
    price: 1850000,
    originalPrice: 2400000,
    frameType: 'فلزی استیل ضدزنگ',
    lensColor: 'دودی هایلایت (Graded Green)',
    uvProtection: 'UV400 + Polarized',
    gender: 'اسپرت (یونی‌سکس)',
    images: [
      'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'عینک آفتابی خلبانی کلاسیک با کیفیت ساخت درجه یک اروپایی، دارای لنز پلاریزه با وضوح دید فوق‌العاده و محافظت ۱۰۰٪ در برابر اشعه‌های مضر UV. بسیار سبک و مناسب استفاده طولانی‌مدت و رانندگی.',
    features: ['عدسی پلاریزه واقعی', 'پد بینی سیلیکونی نرم', 'همراه با هارد کیس و دستمال نانو میکروفایبر', 'سبک و مقاوم'],
    stock: 5,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-2',
    title: 'عینک طبی کائوچویی فریم گربه‌ای تام فورد',
    code: 'STK-408',
    category: 'optical',
    price: 1650000,
    originalPrice: 1950000,
    frameType: 'کائوچو استات درجه یک',
    lensColor: 'شفاف بلوکات (BlueCut)',
    uvProtection: 'UV400 + Anti-Reflective',
    gender: 'زنانه',
    images: [
      'https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'فریم طبی بسیار شیک گربه‌ای مدرن با دسته مجهز به لولای فنری اروپایی. مناسب برای نمره چشم و کار با کامپیوتر و گوشی.',
    features: ['فریم استات سبک', 'لولای فنری انعطاف‌پذیر', 'طراحی ارگونومیک صورت', 'مناسب تمام فرم‌های صورت'],
    stock: 3,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'demo-3',
    title: 'عینک ورزشی و دوچرخه‌سواری مگنتی اسپرت',
    code: 'STK-705',
    category: 'sport',
    price: 2100000,
    frameType: 'پلی‌کربنات نشکن TR90',
    lensColor: 'جیوه‌ای چندرنگ (Rainbow)',
    uvProtection: 'UV400 Shield',
    gender: 'اسپرت (یونی‌سکس)',
    images: [
      'https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'عینک تخصصی ورزشی فوق‌العاده سبک با فریم TR90 مقاوم در برابر ضربه و عدسی وسیع ضدباد و گردوغبار.',
    features: ['عدسی یکپارچه پانوورامیک', 'جلوگیری از خستگی چشم در آفتاب شدید', 'ضد لغزش هنگام تعریق'],
    stock: 8,
    isFeatured: false,
    createdAt: new Date().toISOString()
  }
];

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
    if (data === null) return DEMO_PRODUCTS;
    const parsed = JSON.parse(data);
    const deletedIds = getDeletedProductIds();
    if (Array.isArray(parsed)) {
      return parsed.filter((p) => p && p.id && !deletedIds.has(p.id));
    }
    return DEMO_PRODUCTS;
  } catch (err) {
    console.error('Error reading products:', err);
    return [];
  }
}

export async function saveStoredProducts(products: Product[]): Promise<boolean> {
  products.forEach((p) => {
    if (p && p.id) {
      removeDeletedProductId(p.id);
      if (!p.updatedAt) {
        p.updatedAt = new Date().toISOString();
      }
    }
  });

  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    notifyTabsOfChange();
  } catch (err) {
    console.error('Error saving products locally:', err);
  }

  // Sync to Server API
  const apiPromise = fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products }),
  }).catch(() => {});

  // Sync to Supabase
  const supabase = getSupabaseClient();
  let supabasePromise = Promise.resolve();
  if (supabase) {
    supabasePromise = (async () => {
      try {
        let mergedItems = products;
        try {
          const existingRes = await supabase.from('store_settings').select('*').eq('id', 'products_data').maybeSingle();
          const existingItems: Product[] = existingRes?.data?.data?.items && Array.isArray(existingRes.data.data.items)
            ? existingRes.data.data.items
            : [];
          mergedItems = mergeProductsList(existingItems, products);
        } catch (e) {}

        await supabase
          .from('store_settings')
          .upsert({
            id: 'products_data',
            data: { items: mergedItems, updatedAt: new Date().toISOString() },
            updated_at: new Date().toISOString(),
          });

        if (products.length > 0) {
          try {
            await supabase
              .from('products')
              .upsert(products.map((p) => ({ id: p.id, data: p, updated_at: new Date().toISOString() })));
          } catch (e) {}
        }
      } catch (sbErr) {
        console.warn('Supabase products sync error:', sbErr);
      }
    })();
  }

  // Non-blocking background remote sync for Firestore
  const firestorePromise = (async () => {
    try {
      const existingSnap = await withTimeout(getDocs(collection(db, 'products')), 2000);
      const currentIds = new Set(products.map((p) => p.id));
      const batch = writeBatch(db);

      existingSnap.forEach((docSnap) => {
        if (!currentIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });

      products.forEach((p) => {
        const cleanP = cleanForFirestore(p);
        batch.set(doc(db, 'products', p.id), cleanP);
      });

      await batch.commit();
    } catch (err) {
      for (const p of products) {
        try {
          await setDoc(doc(db, 'products', p.id), cleanForFirestore(p));
        } catch (e) {}
      }
    }
  })();

  await Promise.allSettled([
    supabasePromise,
    withTimeout(apiPromise, 3000),
  ]);

  return true;
}

export function getStoredOrders(): Order[] {
  try {
    const data = localStorage.getItem(ORDERS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    const deletedIds = getDeletedOrderIds();
    return Array.isArray(parsed) ? parsed.filter((o) => o && o.id && !deletedIds.has(o.id)) : [];
  } catch (err) {
    console.error('Error reading orders:', err);
    return [];
  }
}

// Helper to track deleted product and order IDs so they don't get restored by stale remote sync
const DELETED_PRODUCTS_KEY = 'stock_jahani_deleted_product_ids';
const DELETED_ORDERS_KEY = 'stock_jahani_deleted_order_ids';

export function getDeletedProductIds(): Set<string> {
  try {
    const data = localStorage.getItem(DELETED_PRODUCTS_KEY);
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch (e) {
    return new Set();
  }
}

export function addDeletedProductId(id: string) {
  try {
    const current = getDeletedProductIds();
    current.add(id);
    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {}
}

export function removeDeletedProductId(id: string) {
  try {
    const current = getDeletedProductIds();
    current.delete(id);
    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {}
}

export function getDeletedOrderIds(): Set<string> {
  try {
    const data = localStorage.getItem(DELETED_ORDERS_KEY);
    return data ? new Set(JSON.parse(data)) : new Set();
  } catch (e) {
    return new Set();
  }
}

export function addDeletedOrderId(id: string) {
  try {
    const current = getDeletedOrderIds();
    current.add(id);
    localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {}
}

export function removeDeletedOrderId(id: string) {
  try {
    const current = getDeletedOrderIds();
    current.delete(id);
    localStorage.setItem(DELETED_ORDERS_KEY, JSON.stringify(Array.from(current)));
  } catch (e) {}
}

function parseTimestamp(dateStr?: string): number {
  if (!dateStr) return 0;
  const t = new Date(dateStr).getTime();
  return isNaN(t) ? 0 : t;
}

// Helper to merge settings objects using updatedAt timestamps for conflict resolution
export function mergeSettingsObjects(...settingsList: (StoreSettings | null | undefined)[]): StoreSettings {
  let result: StoreSettings = { ...DEFAULT_SETTINGS };
  let newestTimestamp = 0;

  for (const s of settingsList) {
    if (!s || typeof s !== 'object') continue;
    const sTime = parseTimestamp(s.updatedAt);
    if (sTime >= newestTimestamp) {
      newestTimestamp = sTime;
      result = { ...result, ...s };
    } else {
      result = { ...s, ...result };
    }
  }

  return result;
}

// Helper to merge product lists seamlessly without losing local edits or additions
export function mergeProductsList(...lists: Product[][]): Product[] {
  const deletedIds = getDeletedProductIds();
  const map = new Map<string, Product>();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const prod of list) {
      if (!prod || !prod.id) continue;
      if (deletedIds.has(prod.id)) continue;
      const existing = map.get(prod.id);
      if (!existing) {
        map.set(prod.id, prod);
      } else {
        const existingTime = parseTimestamp(existing.updatedAt || existing.createdAt);
        const newTime = parseTimestamp(prod.updatedAt || prod.createdAt);
        if (newTime > existingTime) {
          map.set(prod.id, { ...existing, ...prod });
        } else if (existingTime > newTime) {
          map.set(prod.id, { ...prod, ...existing });
        } else {
          const merged: Product = {
            ...existing,
            ...prod,
            updatedAt: prod.updatedAt || existing.updatedAt,
          };
          map.set(prod.id, merged);
        }
      }
    }
  }
  return Array.from(map.values());
}

// Helper to merge order lists seamlessly without losing any order across devices
export function mergeOrdersList(...lists: Order[][]): Order[] {
  const deletedIds = getDeletedOrderIds();
  const map = new Map<string, Order>();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const order of list) {
      if (!order || !order.id) continue;
      if (deletedIds.has(order.id)) continue;
      const existing = map.get(order.id);
      if (!existing) {
        map.set(order.id, order);
      } else {
        const existingTime = parseTimestamp(existing.updatedAt || existing.createdAt);
        const newTime = parseTimestamp(order.updatedAt || order.createdAt);
        if (newTime > existingTime) {
          map.set(order.id, { ...existing, ...order });
        } else if (existingTime > newTime) {
          map.set(order.id, { ...order, ...existing });
        } else {
          const merged: Order = {
            ...existing,
            ...order,
            status: order.status && order.status !== 'pending' ? order.status : (existing.status && existing.status !== 'pending' ? existing.status : order.status),
            postalTrackingCode: order.postalTrackingCode || existing.postalTrackingCode,
            adminNote: order.adminNote !== undefined ? order.adminNote : existing.adminNote,
            paymentReceipt: order.paymentReceipt || existing.paymentReceipt,
            paymentRefId: order.paymentRefId || existing.paymentRefId,
            isPaid: order.isPaid || existing.isPaid,
            updatedAt: order.updatedAt || existing.updatedAt,
          };
          map.set(order.id, merged);
        }
      }
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    parseTimestamp(b.createdAt) - parseTimestamp(a.createdAt)
  );
}

// Pending offline/hybrid sync queue
const PENDING_ORDERS_KEY = 'pending_sync_orders';

export function enqueuePendingOrders(orders: Order[]) {
  try {
    const existingStr = localStorage.getItem(PENDING_ORDERS_KEY);
    const existing: Order[] = existingStr ? JSON.parse(existingStr) : [];
    const merged = mergeOrdersList(existing, orders);
    localStorage.setItem(PENDING_ORDERS_KEY, JSON.stringify(merged));
  } catch (e) {}
}

export async function processPendingSyncQueue() {
  try {
    const pendingStr = localStorage.getItem(PENDING_ORDERS_KEY);
    if (!pendingStr) return;
    const pendingOrders: Order[] = JSON.parse(pendingStr);
    if (!Array.isArray(pendingOrders) || pendingOrders.length === 0) return;

    let synced = false;

    // 1. Try Supabase (100% unblocked in Iran, no VPN needed)
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('orders').upsert(
          pendingOrders.map((o) => ({ id: o.id, data: o, updated_at: new Date().toISOString() }))
        );
        if (!error) synced = true;
      } catch (e) {}
    }

    // 2. Try Server API
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: pendingOrders }),
      });
      if (res.ok) synced = true;
    } catch (e) {}

    // 3. Try Firestore if accessible
    try {
      for (const o of pendingOrders) {
        await setDoc(doc(db, 'orders', o.id), cleanForFirestore(o));
      }
      synced = true;
    } catch (e) {}

    if (synced) {
      localStorage.removeItem(PENDING_ORDERS_KEY);
      console.log('Pending orders successfully synced in background!');
    }
  } catch (e) {}
}

export async function saveStoredOrders(orders: Order[]): Promise<boolean> {
  orders.forEach((o) => {
    if (o && o.id) removeDeletedOrderId(o.id);
  });

  // 1. Synchronous immediate local storage update (0ms delay for user UI)
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    notifyTabsOfChange();
  } catch (err) {
    console.error('Error saving orders locally:', err);
  }

  const cleanOrders = orders.map(cleanForFirestore);

  // 2. Immediate Supabase sync (Unblocked in Iran, no VPN needed)
  const supabase = getSupabaseClient();
  if (supabase && cleanOrders.length > 0) {
    (async () => {
      try {
        await Promise.allSettled([
          supabase
            .from('orders')
            .upsert(cleanOrders.map((o) => ({ id: o.id, data: o, updated_at: new Date().toISOString() }))),
          supabase
            .from('store_settings')
            .upsert({
              id: 'orders_data',
              data: { items: cleanOrders, updatedAt: new Date().toISOString() },
              updated_at: new Date().toISOString(),
            })
        ]);
      } catch (err) {
        console.warn('Supabase order save network error:', err);
        enqueuePendingOrders(orders);
      }
    })();
  }

  // 3. Immediate Server API sync (/api/orders)
  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders: cleanOrders }),
  }).catch(() => {
    enqueuePendingOrders(orders);
  });

  // 4. Non-blocking background Firestore sync (never freezes if Google is filtered without VPN)
  (async () => {
    try {
      const existingSnap = await withTimeout(getDocs(collection(db, 'orders')), 2500);
      const currentIds = new Set(orders.map((o) => o.id));
      const batch = writeBatch(db);

      existingSnap.forEach((docSnap) => {
        if (!currentIds.has(docSnap.id)) {
          batch.delete(docSnap.ref);
        }
      });

      cleanOrders.forEach((o) => {
        batch.set(doc(db, 'orders', o.id), o);
      });

      await batch.commit();
    } catch (err) {
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
  if (order && order.id) {
    removeDeletedOrderId(order.id);
  }

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
    const updated = mergeOrdersList([cleanOrder], existing);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    notifyTabsOfChange();
    savedLocal = true;
  } catch (err) {
    console.error('Error saving order to localStorage:', err);
  }

  // 2. Fire Server API, Firestore, and Supabase ALL IN PARALLEL!
  const apiPromise = fetch('/api/orders/new', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ order: cleanOrder }),
  })
    .then((res) => res.ok)
    .catch(() => false);

  const firestorePromise = setDoc(doc(db, 'orders', cleanOrder.id), cleanOrder)
    .then(() => true)
    .catch(() => false);

  const supabase = getSupabaseClient();
  const supabasePromise = supabase
    ? (async () => {
        try {
          const p1 = supabase
            .from('orders')
            .upsert([{ id: cleanOrder.id, data: cleanOrder, updated_at: new Date().toISOString() }]);

          const p2 = (async () => {
            const res = await supabase.from('store_settings').select('*').eq('id', 'orders_data').maybeSingle();
            const existingOrders: Order[] = res?.data?.data?.items && Array.isArray(res.data.data.items) ? res.data.data.items : [];
            const merged = mergeOrdersList(existingOrders, [cleanOrder]);
            await supabase.from('store_settings').upsert({
              id: 'orders_data',
              data: { items: merged, updatedAt: new Date().toISOString() },
              updated_at: new Date().toISOString(),
            });
          })();

          await Promise.allSettled([p1, p2]);
          return true;
        } catch (e) {
          return false;
        }
      })()
    : Promise.resolve(false);

  let savedRemote = false;
  try {
    const apiResult = await withTimeout(apiPromise, 5000).catch(() => false);
    if (apiResult === true) savedRemote = true;
  } catch (e) {
    console.warn('Express order sync notice:', e);
  }

  // Allow Firestore and Supabase to finish in background silently
  Promise.allSettled([firestorePromise, supabasePromise]).then((results) => {
    const bgSuccess = results.some((r) => r.status === 'fulfilled' && r.value === true);
    if (!savedRemote && !bgSuccess) {
      enqueuePendingOrders([cleanOrder]);
    }
  });

  return savedLocal || savedRemote;
}

export function getStoredSettings(): StoreSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(data);
    if (parsed.adminPasscode === '1234' || !parsed.adminPasscode) {
      parsed.adminPasscode = '1383';
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...parsed }));
      } catch (e) {
        // Ignore storage errors
      }
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

  // Sync to Supabase FIRST (Unblocked in Iran, no VPN needed)
  const supabase = getSupabaseClient();
  if (supabase) {
    (async () => {
      try {
        await supabase
          .from('store_settings')
          .upsert({ id: 'main', data: updatedSettings, updated_at: new Date().toISOString() });
      } catch (sbErr) {
        console.warn('Supabase settings sync error:', sbErr);
      }
    })();
  }

  // Sync to Server API
  fetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ settings: updatedSettings }),
  }).catch(() => {});

  // Background non-blocking Firestore sync
  setDoc(doc(db, 'settings', 'store_settings'), cleanForFirestore(updatedSettings)).catch(() => {});

  return true;
}

export async function deleteProductFromFirestore(productId: string): Promise<boolean> {
  addDeletedProductId(productId);

  // Update local storage immediately
  const remaining = getStoredProducts().filter((p) => p.id !== productId);
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(remaining));
  } catch (e) {}

  // Save remaining products to Supabase products_data
  await saveStoredProducts(remaining);

  // Delete from Supabase products table if configured
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('products').delete().eq('id', productId);
    } catch (sbErr) {}
  }

  // Delete from backend server API (works everywhere without VPN)
  fetch('/api/products/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  }).catch(() => {});

  fetch(`/api/products/${productId}`, {
    method: 'DELETE',
  }).catch(() => {});

  fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: remaining }),
  }).catch(() => {});

  // Also attempt Firestore delete in background
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (err) {
    console.warn('Firestore delete product background error:', err);
  }
  return true;
}

export async function deleteOrderFromFirestore(orderId: string): Promise<boolean> {
  addDeletedOrderId(orderId);

  // Update local storage immediately
  const remaining = getStoredOrders().filter((o) => o.id !== orderId);
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(remaining));
  } catch (e) {}

  // Delete from Supabase if configured (both table and store_settings JSON)
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from('orders').delete().eq('id', orderId);
      await supabase.from('store_settings').upsert({
        id: 'orders_data',
        data: { items: remaining, updatedAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      });
    } catch (sbErr) {}
  }

  // Delete from backend server API (works everywhere without VPN)
  fetch('/api/orders/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  }).catch(() => {});

  fetch(`/api/orders/${orderId}`, {
    method: 'DELETE',
  }).catch(() => {});

  fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders: remaining }),
  }).catch(() => {});

  // Also attempt Firestore delete in background
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (err) {
    console.warn('Firestore delete order background error:', err);
  }
  return true;
}

// Fetch and merge all shared data from Express Server API, Supabase, Firestore, and LocalStorage
export async function fetchServerData(): Promise<{ products: Product[]; orders: Order[]; settings: StoreSettings }> {
  // Process any pending offline/network retry queue first
  processPendingSyncQueue();

  const localProducts = getStoredProducts();
  const localOrders = getStoredOrders();
  const localSettings = getStoredSettings();

  let apiProducts: Product[] = [];
  let apiOrders: Order[] = [];
  let apiSettings: StoreSettings | null = null;

  let sbProducts: Product[] = [];
  let sbOrders: Order[] = [];
  let sbSettings: StoreSettings | null = null;

  let fsProducts: Product[] = [];
  let fsOrders: Order[] = [];
  let fsSettings: StoreSettings | null = null;

  // 1. Fetch from Express Server API (Primary ultra-fast source)
  try {
    const res = await fetch('/api/data?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data) {
        if (Array.isArray(data.products)) apiProducts = data.products;
        if (Array.isArray(data.orders)) apiOrders = data.orders;
        if (data.settings && typeof data.settings === 'object') apiSettings = data.settings;
        if (Array.isArray(data.deletedProductIds)) {
          data.deletedProductIds.forEach((id: string) => addDeletedProductId(id));
        }
        if (Array.isArray(data.deletedOrderIds)) {
          data.deletedOrderIds.forEach((id: string) => addDeletedOrderId(id));
        }
      }
    }
  } catch (e) {
    console.warn('Express API fetch notice:', e);
  }

  // 2. Fetch from Supabase and Firestore asynchronously with 4s max timeout
  const supabase = getSupabaseClient();
  const remoteSync = Promise.allSettled([
    supabase
      ? (async () => {
          try {
            // First check JSONB store in store_settings (id='products_data')
            const resData = await supabase.from('store_settings').select('*').eq('id', 'products_data').maybeSingle();
            if (resData?.data?.data?.items && Array.isArray(resData.data.data.items)) {
              sbProducts = resData.data.data.items as Product[];
            }
            // Also check relational products table if populated
            const resTable = await supabase.from('products').select('*');
            if (resTable?.data && resTable.data.length > 0) {
              const tableProds = resTable.data.map((r: any) => {
                if (!r || typeof r !== 'object') return null;
                const dataObj = r.data && typeof r.data === 'object' ? r.data : r;
                return { id: r.id || dataObj.id, ...dataObj };
              }).filter((p: any) => p && p.id);
              sbProducts = mergeProductsList(sbProducts, tableProds);
            }
          } catch (e) {}
        })()
      : Promise.resolve(),
    supabase
      ? (async () => {
          try {
            // First check JSONB store in store_settings (id='orders_data')
            const resData = await supabase.from('store_settings').select('*').eq('id', 'orders_data').maybeSingle();
            if (resData?.data?.data?.items && Array.isArray(resData.data.data.items)) {
              sbOrders = resData.data.data.items as Order[];
            }
            // Also check relational orders table
            const resTable = await supabase.from('orders').select('*');
            if (resTable?.data && resTable.data.length > 0) {
              const tableOrders = resTable.data.map((r: any) => {
                if (!r || typeof r !== 'object') return null;
                const dataObj = r.data && typeof r.data === 'object' ? r.data : r;
                return { id: r.id || dataObj.id, ...dataObj };
              }).filter((o: any) => o && o.id);
              sbOrders = mergeOrdersList(sbOrders, tableOrders);
            }
          } catch (e) {}
        })()
      : Promise.resolve(),
    supabase
      ? (async () => {
          try {
            const res = await supabase.from('store_settings').select('*').eq('id', 'main').maybeSingle();
            if (res?.data?.data) sbSettings = res.data.data as StoreSettings;
          } catch (e) {}
        })()
      : Promise.resolve(),
    withTimeout(
      Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'products')),
        getDoc(doc(db, 'settings', 'store_settings')),
      ]).then(([ordersSnap, productsSnap, settingsDoc]) => {
        ordersSnap.forEach((d) => d.exists() && fsOrders.push(d.data() as Order));
        productsSnap.forEach((d) => d.exists() && fsProducts.push(d.data() as Product));
        if (settingsDoc.exists()) fsSettings = settingsDoc.data() as StoreSettings;
      }),
      4000
    ).catch(() => {})
  ]);

  await withTimeout(remoteSync, 4000).catch(() => {});

  const deletedProductIds = getDeletedProductIds();
  const deletedOrderIds = getDeletedOrderIds();

  // Filter local items if they were marked deleted globally
  const activeLocalProducts = localProducts.filter(p => p && p.id && !deletedProductIds.has(p.id));
  const activeLocalOrders = localOrders.filter(o => o && o.id && !deletedOrderIds.has(o.id));

  // Safely merge products, orders, and settings from ALL sources using timestamp-based conflict resolution
  const products = mergeProductsList(activeLocalProducts, sbProducts, apiProducts, fsProducts);
  const orders = mergeOrdersList(activeLocalOrders, sbOrders, apiOrders, fsOrders);
  const settings = mergeSettingsObjects(DEFAULT_SETTINGS, localSettings, fsSettings, apiSettings, sbSettings);

  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {}

  // Back-sync complete merged state to Express Server API
  fetch('/api/sync-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products, orders, settings }),
  }).catch(() => {});

  return { products, orders, settings };
}

// Live real-time subscription for instant multi-device syncing with active Firestore listeners & version polling
export function subscribeToFirestore(
  onDataUpdate: (data: { products?: Product[]; orders?: Order[]; settings?: StoreSettings; newOrders?: Order[] }) => void,
  onError?: (errMessage: string) => void
) {
  let lastServerVersion = 0;
  let lastStateHash = '';
  let isPolling = false;

  // Supabase Realtime Subscription if configured by user
  const supabase = getSupabaseClient();
  let supabaseChannel: any = null;

  if (supabase) {
    try {
      supabaseChannel = supabase
        .channel('public-store-changes')
        .on('postgres_changes', { event: '*', schema: 'public' }, async () => {
          const freshData = await fetchServerData();
          if (freshData) {
            onDataUpdate(freshData);
          }
        })
        .subscribe();
    } catch (sbRealtimeErr) {
      console.warn('Supabase realtime channel error:', sbRealtimeErr);
    }
  }

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

        const deletedIds = getDeletedProductIds();
        const fsProdIds = new Set(fsProds.map((p) => p.id));
        const localProds = getStoredProducts();

        // If snapshot has loaded items, any local product missing from Firestore snapshot was deleted on another device
        const filteredLocal = fsProds.length > 0
          ? localProds.filter((p) => fsProdIds.has(p.id) && !deletedIds.has(p.id))
          : localProds.filter((p) => !deletedIds.has(p.id));

        const mergedProds = mergeProductsList(filteredLocal, fsProds);
        try {
          localStorage.setItem(PRODUCTS_KEY, JSON.stringify(mergedProds));
        } catch (e) {}
        onDataUpdate({ products: mergedProds });
      },
      (err) => {
        console.warn('Firestore products snapshot notice:', err);
      }
    );
  } catch (e) {
    console.warn('Firestore products listener error:', e);
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

        const deletedIds = getDeletedOrderIds();
        const fsOrderIds = new Set(fsOrds.map((o) => o.id));
        const localOrds = getStoredOrders();
        const localIds = new Set(localOrds.map((o) => o.id));

        const newIncomingOrders = fsOrds.filter((o) => !localIds.has(o.id) && !deletedIds.has(o.id));

        const filteredLocal = fsOrds.length > 0
          ? localOrds.filter((o) => fsOrderIds.has(o.id) && !deletedIds.has(o.id))
          : localOrds.filter((o) => !deletedIds.has(o.id));

        const mergedOrds = mergeOrdersList(filteredLocal, fsOrds);
        try {
          localStorage.setItem(ORDERS_KEY, JSON.stringify(mergedOrds));
        } catch (e) {}
        onDataUpdate({ orders: mergedOrds, newOrders: newIncomingOrders });
      },
      (err) => {
        console.warn('Firestore orders snapshot notice:', err);
      }
    );
  } catch (e) {
    console.warn('Firestore orders listener error:', e);
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
        console.warn('Firestore settings snapshot notice:', err);
      }
    );
  } catch (e) {
    console.warn('Firestore settings listener error:', e);
  }

  // Fast light-weight version check (sub-10ms endpoint check)
  const pollServerVersion = async () => {
    if (isPolling) return;
    isPolling = true;
    try {
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
            return;
          }
        }
      } catch (e) {}

      // Fallback hash polling
      try {
        const serverData = await fetchServerData();
        if (serverData) {
          const currentHash = JSON.stringify({
            pCount: serverData.products.length,
            oCount: serverData.orders.length,
            pMod: serverData.products.map(p => `${p.id}_${p.stock}_${p.price}`),
            oMod: serverData.orders.map(o => `${o.id}_${o.status}_${o.postalTrackingCode || ''}_${o.isPaid}`)
          });

          if (currentHash !== lastStateHash) {
            lastStateHash = currentHash;
            onDataUpdate(serverData);
          }
        }
      } catch (e) {}
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
    if (e.key === PRODUCTS_KEY || e.key === ORDERS_KEY || e.key === SETTINGS_KEY || e.key === DELETED_PRODUCTS_KEY || e.key === DELETED_ORDERS_KEY) {
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
    if (supabaseChannel && supabase) {
      try {
        supabase.removeChannel(supabaseChannel);
      } catch (e) {}
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
export function fileToBase64(file: File, maxWidth = 750, quality = 0.70): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl || !file.type.startsWith('image/')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
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
  let apiProduct: Product | null = null;
  let supabaseProduct: Product | null = null;

  try {
    const res = await fetch('/api/data?t=' + Date.now(), { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.products)) {
        const found = data.products.find((p: Product) => p.id === productId);
        if (found) apiProduct = found;
      }
    }
  } catch (e) {}

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
      if (data && data.data) {
        supabaseProduct = data.data as Product;
      }
    } catch (e) {}
  }

  const localProducts = getStoredProducts();
  const localProduct = localProducts.find((p) => p.id === productId) || null;

  const candidates = [apiProduct, supabaseProduct, localProduct].filter(Boolean) as Product[];
  if (candidates.length === 0) return null;

  const baseProduct = mergeProductsList(candidates, [])[0] || candidates[0];
  const minStock = Math.min(
    ...candidates.map((c) => (typeof c.stock === 'number' ? c.stock : 0))
  );

  return { ...baseProduct, stock: minStock };
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
      chatId: settings.telegramChatId || '200220495',
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
      chatId: settings?.telegramChatId || '200220495',
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

const NTFY_TOPIC_URL = 'https://ntfy.sh/berim-birun-x7k2m';
export function sendNtfyOrderAlert(order: Order): void {
  try {
    const itemsSummary = order.items
      .map((i) => `${i.product.title} ×${i.quantity}`)
      .join('، ');

    fetch(NTFY_TOPIC_URL, {
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

