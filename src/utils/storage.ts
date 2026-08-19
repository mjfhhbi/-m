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

export function mergeProductsList(...lists: Product[][]): Product[] {
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
        } else {
          map.set(prod.id, { ...prod, ...existing });
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

// Fetch and merge all shared data from Express Server API, Firestore, and LocalStorage
export async function fetchServerData(): Promise<{ products: Product[]; orders: Order[]; settings: StoreSettings }> {
  let apiProducts: Product[] | null = null;
  let apiOrders: Order[] | null = null;
  let apiSettings: StoreSettings | null = null;

  let fsProducts: Product[] | null = null;
  let fsOrders: Order[] | null = null;
  let fsSettings: StoreSettings | null = null;

  // 1. Fetch from Express Server API (Primary fast source)
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

  // 2. Fetch from Firestore asynchronously
  const remoteSync = withTimeout(
    Promise.all([
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
    ]).then(([ordersSnap, productsSnap, settingsDoc]) => {
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
    }),
    3000
  ).catch(() => {});

  await withTimeout(remoteSync, 3000).catch(() => {});

  // Authoritative determination: server API > Firestore > LocalStorage
  let products: Product[] = [];
  if (apiProducts !== null) {
    products = apiProducts.filter((p) => p && p.id);
  } else if (fsProducts !== null) {
    products = fsProducts.filter((p) => p && p.id);
  } else {
    products = getStoredProducts().filter((p) => p && p.id);
  }

  let orders: Order[] = [];
  if (apiOrders !== null) {
    orders = apiOrders.filter((o) => o && o.id);
  } else if (fsOrders !== null) {
    orders = fsOrders.filter((o) => o && o.id);
  } else {
    orders = getStoredOrders().filter((o) => o && o.id);
  }

  const localSettings = getStoredSettings();
  const settings = mergeSettingsObjects(DEFAULT_SETTINGS, localSettings, fsSettings, apiSettings);

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

export function fileToBase64(file: File, maxWidth = 600, quality = 0.60): Promise<string> {
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

