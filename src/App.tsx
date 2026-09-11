import React, { useState, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  Order, 
  OrderCustomer,
  StoreSettings, 
  CategoryType, 
  OrderStatus,
  VisitorStats
} from './types';
import { 
  getStoredProducts, 
  saveStoredProducts, 
  saveSingleProduct,
  getStoredOrders, 
  saveStoredOrders, 
  getStoredSettings, 
  saveStoredSettings,
  fetchServerData,
  subscribeToFirestore,
  deleteProductFromFirestore,
  deleteOrderFromFirestore,
  updateOrderStatusRemote,
  mergeProductsList,
  mergeOrdersList,
  DEMO_PRODUCTS,
  trackPageVisit,
  sendHeartbeat,
  fetchVisitorStats,
  toPersianDigits,
  getWishlistIds,
  toggleWishlistId,
  clearAllProductsRemote,
  loadDemoProductsRemote
} from './utils/storage';

import { Header } from './components/Header';
import { StoreHero } from './components/StoreHero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { QuickViewModal } from './components/QuickViewModal';
import { CompareModal } from './components/CompareModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { FaceShapeGuideModal } from './components/FaceShapeGuideModal';
import { LensSimulatorModal } from './components/LensSimulatorModal';
import { StoreFaq } from './components/StoreFaq';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminPanel } from './components/AdminPanel';
import { CustomerOrderTrackerModal } from './components/CustomerOrderTrackerModal';
import { InvoiceModal } from './components/InvoiceModal';
import { SupportModal } from './components/SupportModal';
import { IntroSplash } from './components/IntroSplash';
import { SeoHead } from './components/SeoHead';
import { Toast } from './components/Toast';
import { MobileBottomNav } from './components/MobileBottomNav';
import { FilterBar, FilterState } from './components/FilterBar';
import { sound } from './utils/audio';
import { IncomingOrderModal } from './components/IncomingOrderModal';

import { Glasses, Plus, ShieldCheck, Sparkles, RefreshCw, ShoppingBag, Instagram, Phone, Send, Lock, X, KeyRound, Headphones, MessageSquare, ArrowRightLeft, Users, Eye, Activity, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation & View Mode
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced Filters State
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    search: '',
    sortBy: 'newest',
    minPrice: 0,
    maxPrice: 5000000,
    onlyInStock: false,
    onlyDiscounted: false,
    onlyPolarized: false,
    onlyUV400: false,
    gender: 'all',
    frameMaterial: 'all',
  });

  // Persistent State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(getStoredSettings());
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);

  // Cart, Wishlist & Comparison State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stock_jahani_cart_v2');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => getWishlistIds());
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Auto-persist cart items across browser sessions & reloads
  useEffect(() => {
    try {
      localStorage.setItem('stock_jahani_cart_v2', JSON.stringify(cartItems));
    } catch (e) {}
  }, [cartItems]);

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isFaceGuideOpen, setIsFaceGuideOpen] = useState(false);
  const [isLensSimulatorOpen, setIsLensSimulatorOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [incomingOrderAlert, setIncomingOrderAlert] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showIntroSplash, setShowIntroSplash] = useState<boolean>(() => {
    // Show on initial session load
    if (typeof window !== 'undefined') {
      const isParam = new URLSearchParams(window.location.search).get('view') === 'admin';
      if (isParam) return false;
      return true;
    }
    return false;
  });

  // Admin Security Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin_session_auth') === 'true';
    }
    return false;
  });
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');

  // Live Visitor Analytics State
  const [visitorStats, setVisitorStats] = useState<VisitorStats | null>(null);

  useEffect(() => {
    const page = currentView === 'admin' ? '/admin' : '/';
    trackPageVisit(page).then((stats) => {
      if (stats) setVisitorStats(stats);
    });
    sendHeartbeat(page);

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat(page);
      fetchVisitorStats().then((s) => s && setVisitorStats(s));
    }, 40000);

    return () => clearInterval(heartbeatInterval);
  }, [currentView]);

  // Initialize data on mount & detect view from URL search query (?view=admin or ?view=store)
  // Sync with central backend server
  const isSyncingRef = React.useRef(false);
  const syncWithServer = async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const serverData = await fetchServerData();
      if (serverData) {
        if (Array.isArray(serverData.products)) {
          setProducts(serverData.products);
          setIsLoadingProducts(false);
        }
        if (Array.isArray(serverData.orders)) {
          setOrders(serverData.orders);
        }
        if (serverData.settings) {
          setSettings(serverData.settings);
        }
      }
    } catch (e) {
      console.warn('Sync error:', e);
    } finally {
      isSyncingRef.current = false;
      setIsLoadingProducts(false);
    }
  };

  const isAdminAuthenticatedRef = React.useRef(isAdminAuthenticated);
  const currentViewRef = React.useRef(currentView);

  useEffect(() => {
    isAdminAuthenticatedRef.current = isAdminAuthenticated;
  }, [isAdminAuthenticated]);

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    const loadedProducts = getStoredProducts();
    const loadedOrders = getStoredOrders();
    const loadedSettings = getStoredSettings();

    if (loadedProducts.length > 0) {
      setProducts(loadedProducts);
      setIsLoadingProducts(false);
    }
    if (loadedOrders.length > 0) setOrders(loadedOrders);
    setSettings(loadedSettings);

    // Initial server sync
    syncWithServer();

    // Live subscription for instant updates across devices
    const unsubscribeSync = subscribeToFirestore(({ products, orders, settings, newOrders }) => {
      if (Array.isArray(products)) {
        setProducts(products);
        setIsLoadingProducts(false);
      }
      if (Array.isArray(orders)) setOrders(orders);
      if (settings) setSettings(settings);

      // Trigger instant Alert & Sound notification for incoming orders
      if (Array.isArray(newOrders) && newOrders.length > 0) {
        const latest = newOrders[0];
        const customerName = latest.customer?.fullName || 'مشتری';
        const code = latest.orderCode || latest.id.slice(-6);
        const amount = latest.finalAmount || latest.totalAmount || 0;

        // 1. Play unmistakable loud alarm ringtone
        sound.playOrderAlert();

        // 2. Trigger native OS / browser notification
        try {
          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(`🔔 سفارش جدید در عینک جهانی!`, {
              body: `خریدار: ${customerName} | کد: #${code} | مبلغ: ${amount.toLocaleString('fa-IR')} تومان`,
              icon: '/favicon.ico'
            });
          }
        } catch (e) {}

        // 3. Display Toast banner
        showToast(`🔔 سفارش جدید ثبت شد! کد سفارش: ${code} - مشتری: ${customerName}`);

        // 4. Open high-priority incoming order modal
        setIncomingOrderAlert(latest);
      }
    });

    // Read view parameter or route path from URL
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const isPathAdmin = window.location.pathname.toLowerCase().includes('/admin');
    if (viewParam === 'admin' || isPathAdmin) {
      const isAlreadyAuthed = sessionStorage.getItem('admin_session_auth') === 'true';
      if (isAlreadyAuthed) {
        setIsAdminAuthenticated(true);
        setCurrentView('admin');
      } else {
        setIsPasscodeModalOpen(true);
      }
    } else {
      setCurrentView('store');
    }

    const prodParam = params.get('product');
    if (prodParam && loadedProducts.length > 0) {
      const match = loadedProducts.find(p => p.id === prodParam || p.code?.toLowerCase() === prodParam.toLowerCase());
      if (match) setSelectedProduct(match);
    }

    return () => {
      unsubscribeSync();
    };
  }, []);

  // Auto-sync cart items with real-time product stock and removals
  useEffect(() => {
    if (cartItems.length === 0) return;

    setCartItems((prevCart) => {
      let hasChanges = false;
      const updatedCart: CartItem[] = [];

      for (const item of prevCart) {
        const liveProduct = products.find((p) => p.id === item.product.id);

        // 1. If product was deleted from store completely
        if (!liveProduct) {
          hasChanges = true;
          showToast(`عینک "${item.product.title}" به علت حذف از فروشگاه از سبد شما برداشته شد.`);
          continue;
        }

        // 2. If product stock is now 0 (sold out)
        if (liveProduct.stock <= 0) {
          hasChanges = true;
          showToast(`عینک "${liveProduct.title}" متأسفانه همین الآن تمام شد و از سبد خرید برداشته شد.`);
          continue;
        }

        // 3. If quantity exceeds new available stock
        let newQty = item.quantity;
        if (newQty > liveProduct.stock) {
          newQty = liveProduct.stock;
          hasChanges = true;
          showToast(`موجودی عینک "${liveProduct.title}" تغییر کرد و تعداد آن به ${newQty} عدد تنظیم شد.`);
        }

        if (newQty !== item.quantity || item.product !== liveProduct) {
          hasChanges = true;
        }

        updatedCart.push({ product: liveProduct, quantity: newQty });
      }

      return hasChanges ? updatedCart : prevCart;
    });
  }, [products]);

  // Deep-link product handler from URL query params (e.g. ?product=STK-101 or ?id=...)
  useEffect(() => {
    if (products.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const productQuery = params.get('product') || params.get('id');
    if (productQuery && !selectedProduct) {
      const match = products.find(
        (p) => p.id === productQuery || p.code === productQuery || p.id.includes(productQuery)
      );
      if (match) {
        setSelectedProduct(match);
      }
    }
  }, [products]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleViewChange = (view: 'store' | 'admin') => {
    if (view === 'admin' && !isAdminAuthenticated) {
      setPasscodeInput('');
      setPasscodeError('');
      setIsPasscodeModalOpen(true);
      return;
    }

    // Safety check: ensure products in state if available in storage
    setProducts((prev) => {
      if (prev.length === 0) {
        const stored = getStoredProducts();
        if (stored.length > 0) return stored;
      }
      return prev;
    });

    setCurrentView(view);
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.history.replaceState({}, '', url.toString());
  };

  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    const entered = passcodeInput.trim();
    if (!entered) {
      setPasscodeError('لطفاً رمز عبور مدیریت را وارد کنید.');
      return;
    }

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: entered }),
      });
      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem('admin_session_auth', 'true');
        setIsAdminAuthenticated(true);
        setIsPasscodeModalOpen(false);
        setProducts((prev) => {
          if (prev.length === 0) {
            const stored = getStoredProducts();
            if (stored.length > 0) return stored;
          }
          return prev;
        });
        setCurrentView('admin');
        showToast('با موفقیت وارد پنل مدیریت شدید');
        const url = new URL(window.location.href);
        url.searchParams.set('view', 'admin');
        window.history.replaceState({}, '', url.toString());
        return;
      } else {
        setPasscodeError(data.error || 'رمز عبور وارد شده اشتباه است.');
        return;
      }
    } catch (err) {
      setPasscodeError('خطا در ارتباط با سرور جهت تایید هویت مدیر. لطفاً اتصال شبکه را بررسی کنید.');
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('admin_session_auth');
    setIsAdminAuthenticated(false);
    setProducts((prev) => {
      if (prev.length === 0) {
        const stored = getStoredProducts();
        if (stored.length > 0) return stored;
      }
      return prev;
    });
    setCurrentView('store');
    showToast('از پنل مدیریت خارج شدید');
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'store');
    window.history.replaceState({}, '', url.toString());
  };

  // Compare Handler
  const handleToggleCompare = (product: Product) => {
    sound.playPop();
    setComparedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`عینک "${product.title}" از لیست مقایسه حذف شد`);
        return prev.filter((p) => p.id !== product.id);
      } else {
        if (prev.length >= 4) {
          showToast('حداکثر ۴ عینک را می‌توانید به طور همزمان مقایسه نمایید');
          return prev;
        }
        showToast(`عینک "${product.title}" به لیست مقایسه اضافه شد`);
        return [...prev, product];
      }
    });
  };

  // Cart Logic
  const handleAddToCart = (product: Product, quantity = 1) => {
    let blocked = false;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const maxAllowed = Math.max(0, product.stock - currentQty);
      const qtyToAdd = Math.min(quantity, maxAllowed);
      if (qtyToAdd <= 0) {
        blocked = true;
        return prev;
      }
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prev, { product, quantity: qtyToAdd }];
    });
    if (blocked) {
      showToast(`موجودی «${product.title}» بیشتر از این نیست`);
    } else {
      sound.playCartAdd();
      showToast(`${product.title} به سبد خرید اضافه شد`);
    }
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    if (delta > 0) sound.playCartAdd();
    else sound.playCartRemove();
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = Math.min(item.quantity + delta, item.product.stock);
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    sound.playCartRemove();
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('محصول از سبد خرید حذف شد');
  };

  const handleToggleWishlist = (productOrId: Product | string) => {
    sound.playWishlist();
    const productId = typeof productOrId === 'string' ? productOrId : productOrId.id;
    const updated = toggleWishlistId(productId);
    setWishlistIds(updated);
    const isIn = updated.includes(productId);
    const prod = products.find((p) => p.id === productId);
    showToast(isIn ? `«${prod?.title || 'عینک'}» به نشان‌شده‌ها اضافه شد ❤️` : `از لیست نشان‌شده‌ها حذف شد`);
  };

  // Admin Product Actions
  const handleSaveProduct = async (product: Product): Promise<boolean> => {
    const updatedProd: Product = { 
      ...product, 
      updatedAt: new Date().toISOString() 
    };

    console.log('[PRODUCT_CREATE_START]', {
      id: updatedProd.id,
      title: updatedProd.title,
      price: updatedProd.price,
      stock: updatedProd.stock,
      category: updatedProd.category,
    });

    try {
      // 1. Strict await for Firestore write before state update (eliminating destructive optimistic updates)
      const saveSuccess = await saveSingleProduct(updatedProd);
      if (!saveSuccess) {
        throw new Error('عدم دریافت تأییدیه ذخیره‌سازی از دیتابیس ابری');
      }

      // 2. State update ONLY after database write succeeds
      setProducts((prev) => {
        const index = prev.findIndex((p) => p.id === updatedProd.id);
        let updated: Product[];
        if (index >= 0) {
          updated = [...prev];
          updated[index] = updatedProd;
        } else {
          updated = [updatedProd, ...prev];
        }
        return updated;
      });

      console.log('[STATE_UPDATE_SUCCESS]', updatedProd.id);
      return true;
    } catch (err: any) {
      console.error('[PRODUCT_CREATE_ERROR]', err);
      showToast(`خطا در ثبت عینک در دیتابیس: ${err?.message || 'مشکل در ارتباط با سرور'}`);
      return false;
    }
  };

  const handleDeleteProduct = async (productId: string): Promise<boolean> => {
    try {
      await deleteProductFromFirestore(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      showToast('عینک با موفقیت از سیستم و دیتابیس حذف شد');
      return true;
    } catch (err: any) {
      console.error('[PRODUCT_DELETE_ERROR]', err);
      showToast(`خطا در حذف عینک: ${err?.message || 'مشکل ارتباطی'}`);
      return false;
    }
  };

  const handleLoadDemoProducts = async () => {
    const demos = await loadDemoProductsRemote();
    setProducts(demos);
    showToast('عینک‌های نمونه با موفقیت در فایراستور بارگذاری شدند');
  };

  const handleClearAllProducts = async () => {
    await clearAllProductsRemote();
    setProducts([]);
    showToast('تمامی عینک‌ها از فایراستور و سیستم پاک شدند. اکنون می‌توانید عینک‌های واقعی خود را ثبت کنید.');
  };

  // Order Actions & Automatic Stock Management
  const handleOrderCreated = (newOrder: Order) => {
    // 1. Locally reflect deducted quantity from product stock
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        const itemInOrder = newOrder.items.find((item) => item.product.id === p.id);
        if (itemInOrder) {
          const newStock = Math.max(0, p.stock - itemInOrder.quantity);
          return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );

    // 2. Locally reflect newly created order
    setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);

    // 3. Clear cart after order creation
    setCartItems([]);

    // 4. Play alert sound & show alert modal immediately
    sound.playOrderAlert();
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const customerName = newOrder.customer?.fullName || 'مشتری';
        const code = newOrder.orderCode || newOrder.id.slice(-6);
        new Notification(`🔔 سفارش جدید ثبت شد! #${code}`, {
          body: `خریدار: ${customerName} | مبلغ: ${(newOrder.finalAmount || newOrder.totalAmount || 0).toLocaleString('fa-IR')} تومان`,
          icon: '/favicon.ico',
        });
      }
    } catch (e) {}
    setIncomingOrderAlert(newOrder);
  };

  const handleUpdateOrderStatus = (
    orderId: string, 
    status: OrderStatus,
    postalTrackingCode?: string,
    adminNote?: string
  ) => {
    setOrders((prev) => {
      const targetOrder = prev.find((o) => o.id === orderId);
      
      // If changing status to 'cancelled' from an active status, restore stock
      if (targetOrder && targetOrder.status !== 'cancelled' && status === 'cancelled') {
        setProducts((prevProducts) => {
          const restoredProducts = prevProducts.map((p) => {
            const itemInOrder = targetOrder.items.find((item) => item.product.id === p.id);
            if (itemInOrder) {
              return { ...p, stock: p.stock + itemInOrder.quantity, updatedAt: new Date().toISOString() };
            }
            return p;
          });
          saveStoredProducts(restoredProducts);
          return restoredProducts;
        });
      }

      const updated = prev.map((o) => (
        o.id === orderId 
          ? { 
              ...o, 
              status, 
              ...(postalTrackingCode ? { postalTrackingCode } : {}),
              ...(adminNote !== undefined ? { adminNote } : {}),
              updatedAt: new Date().toISOString()
            } 
          : o
      ));
      saveStoredOrders(updated);
      return updated;
    });

    // Atomic server-side mutation with audit logging & Telegram webhook notifications
    updateOrderStatusRemote(orderId, status, postalTrackingCode, adminNote, 'مدیریت (پنل ادمین)');
  };

  const handleUpdateOrderCustomer = (orderId: string, updatedCustomer: OrderCustomer) => {
    setOrders((prev) => {
      const updated = prev.map((o) => (o.id === orderId ? { ...o, customer: updatedCustomer, updatedAt: new Date().toISOString() } : o));
      saveStoredOrders(updated);
      return updated;
    });
    showToast('مشخصات و آدرس تحویل با موفقیت به‌روزرسانی شد');
  };

  const handleDeleteOrder = async (orderId: string) => {
    deleteOrderFromFirestore(orderId);
    fetch(`/api/orders/${orderId}`, { method: 'DELETE' }).catch(() => {});
    setOrders((prev) => {
      const updated = prev.filter((o) => o.id !== orderId);
      saveStoredOrders(updated);
      return updated;
    });
    showToast('سفارش با موفقیت حذف شد');
  };

  // Admin Settings Action
  const handleSaveSettings = (newSettings: StoreSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings).then(() => syncWithServer());
  };

  // Handle Category & Search sync with filters
  const handleSelectCategory = (cat: CategoryType) => {
    setSelectedCategory(cat);
    setFilters((prev) => ({ ...prev, category: cat }));
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setFilters((prev) => ({ ...prev, search: q }));
  };

  // Filter products for customer view with multi-criteria search and sorting
  const filteredProducts = products.filter((p) => {
    // 1. Category match
    const activeCat = filters.category || selectedCategory;
    const matchesCategory = activeCat === 'all' || p.category === activeCat;
    
    // 2. Search match
    const q = (filters.search || searchQuery).trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.frameType?.toLowerCase().includes(q) ||
      p.lensColor?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q);

    // 3. Price range
    const matchesPrice = p.price >= filters.minPrice && p.price <= filters.maxPrice;

    // 4. Stock status
    const matchesStock = !filters.onlyInStock || p.stock > 0;

    // 5. Discount status
    const matchesDiscount = !filters.onlyDiscounted || (!!p.originalPrice && p.originalPrice > p.price);

    // 6. Polarized status
    const matchesPolarized = !filters.onlyPolarized || (p.uvProtection?.includes('Polarized') || p.description?.includes('پلاریزه') || false);

    // 7. UV400 status
    const matchesUV400 = !filters.onlyUV400 || (p.uvProtection?.includes('UV400') || p.uvProtection?.includes('400') || false);

    // 8. Gender
    const matchesGender = filters.gender === 'all' || p.gender === filters.gender;

    // 9. Frame Material
    const matchesMaterial = filters.frameMaterial === 'all' || p.frameType?.includes(filters.frameMaterial);

    return (
      matchesCategory &&
      matchesSearch &&
      matchesPrice &&
      matchesStock &&
      matchesDiscount &&
      matchesPolarized &&
      matchesUV400 &&
      matchesGender &&
      matchesMaterial
    );
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'discount': {
        const discA = a.originalPrice && a.originalPrice > a.price ? (a.originalPrice - a.price) / a.originalPrice : 0;
        const discB = b.originalPrice && b.originalPrice > b.price ? (b.originalPrice - b.price) / b.originalPrice : 0;
        return discB - discA;
      }
      case 'popular':
        return (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0);
      case 'newest':
      default:
        return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    }
  });

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-zinc-950 text-zinc-100 flex flex-col font-['Vazirmatn',sans-serif]">
      <SeoHead settings={settings} selectedProduct={selectedProduct} />
      
      {/* Header Bar */}
      <Header
        currentView={currentView}
        onViewChange={handleViewChange}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlistIds.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        comparedCount={comparedProducts.length}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
        onOpenTrackerModal={() => setIsTrackerModalOpen(true)}
        onOpenSupportModal={() => setIsSupportOpen(true)}
        onOpenFaceGuide={() => setIsFaceGuideOpen(true)}
        onOpenLensSimulator={() => setIsLensSimulatorOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        settings={settings}
        onShowToast={showToast}
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={handleAdminLogout}
      />

      {/* Main Body Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {currentView === 'store' ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
                
                {/* Hero Section */}
                <StoreHero 
                  settings={settings} 
                  onOpenFaceGuide={() => setIsFaceGuideOpen(true)}
                  onOpenLensSimulator={() => setIsLensSimulatorOpen(true)}
                />

                {/* Advanced Filtering, Sorting and Search Bar */}
                <FilterBar
                  filters={filters}
                  onChange={setFilters}
                  totalProductsCount={products.length}
                  filteredProductsCount={filteredProducts.length}
                />

                {/* Products Grid Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-right dir-rtl">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Glasses className="w-5 h-5 text-amber-400" />
                      <span>
                        {filters.category === 'all'
                          ? 'ویترین کامل عینک‌ها'
                          : `عینک‌های دسته ${
                              filters.category === 'sunglasses'
                                ? 'آفتابی'
                                : filters.category === 'optical'
                                ? 'طبی'
                                : filters.category === 'sport'
                                ? 'ورزشی'
                                : 'یونی‌سکس'
                            }`}
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 font-light mt-0.5">
                      نمایش {filteredProducts.length} محصول از مجموع {products.length} عینک در فروشگاه {settings.storeName}
                    </p>
                  </div>
                </div>

                {/* Products Grid / Empty States */}
                {isLoadingProducts ? (
                  <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="w-12 h-12 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                    <p className="text-sm text-zinc-300 font-bold">در حال دریافت و همگام‌سازی عینک‌ها از پایگاه داده ابری...</p>
                    <p className="text-xs text-zinc-500">لطفاً چند لحظه شکیبا باشید</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="bg-zinc-900/40 border-2 border-dashed border-amber-500/30 rounded-3xl p-10 text-center space-y-4 my-8 text-right dir-rtl">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                      <Glasses className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <div className="max-w-md mx-auto space-y-2">
                      <h3 className="text-base font-bold text-white">ویترین آماده قرارگیری عینک‌های شماست</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        ویترین در حال حاضر خالی است. برای ثبت و انتشار عینک‌های جدید روی دکمه زیر کلیک فرمایید.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => handleViewChange('admin')}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                      >
                        <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                        <span>افزودن اولین محصول به ویترین</span>
                      </button>
                    </div>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="bg-zinc-900/40 border-2 border-dashed border-zinc-800 rounded-3xl p-10 text-center space-y-4 my-8 text-right dir-rtl">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 text-amber-400 flex items-center justify-center mx-auto">
                      <Glasses className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h3 className="text-base font-bold text-white">عینکی با این مشخصات یافت نشد</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        می‌توانید فیلترهای جستجو را بازنشانی کرده یا عبارت دیگری را جستجو فرمایید.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          setFilters({
                            category: 'all',
                            search: '',
                            sortBy: 'newest',
                            minPrice: 0,
                            maxPrice: 5000000,
                            onlyInStock: false,
                            onlyDiscounted: false,
                            onlyPolarized: false,
                            onlyUV400: false,
                            gender: 'all',
                            frameMaterial: 'all',
                          });
                          setSelectedCategory('all');
                          setSearchQuery('');
                        }}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                      >
                        <RefreshCw className="w-4 h-4 stroke-[2.5]" />
                        <span>پاک کردن همه فیلترها</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                  >
                    <AnimatePresence>
                      {filteredProducts.map((product, index) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          revealDelay={Math.min(index, 12) * 0.045}
                          onSelectProduct={(p) => setSelectedProduct(p)}
                          onAddToCart={(p) => handleAddToCart(p, 1)}
                          isCompared={comparedProducts.some((cp) => cp.id === product.id)}
                          onToggleCompare={handleToggleCompare}
                          isWishlisted={wishlistIds.includes(product.id)}
                          onToggleWishlist={handleToggleWishlist}
                          onQuickView={(p) => setQuickViewProduct(p)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}

                {/* FAQ & Buying Guide */}
                <StoreFaq faqs={settings.faqs} />

              </div>
            ) : (
              /* Admin Management Panel View */
              <AdminPanel
                products={products}
                orders={orders}
                settings={settings}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onDeleteOrder={handleDeleteOrder}
                onSaveSettings={handleSaveSettings}
                onShowToast={showToast}
                onLoadDemoProducts={handleLoadDemoProducts}
                onClearAllProducts={handleClearAllProducts}
                onOpenInvoice={(order) => setSelectedInvoiceOrder(order)}
                onRefreshData={syncWithServer}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
        allProducts={products}
        onSelectProduct={(p) => setSelectedProduct(p)}
        isWishlisted={selectedProduct ? wishlistIds.includes(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
        onOpenFullDetail={(prod) => setSelectedProduct(prod)}
        isWishlisted={quickViewProduct ? wishlistIds.includes(quickViewProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
      />

      {/* Product Compare Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        comparedProducts={comparedProducts}
        onRemoveFromCompare={(id) => setComparedProducts((prev) => prev.filter((p) => p.id !== id))}
        onAddToCart={(prod) => handleAddToCart(prod, 1)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      {/* Floating Compare Widget Bar */}
      <AnimatePresence>
        {comparedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-40 bg-zinc-900/95 border border-amber-500/40 p-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 dir-rtl"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">جدول مقایسه عینک‌ها</span>
                <span className="text-[10px] text-zinc-400">{comparedProducts.length} محصول انتخاب شده</span>
              </div>
            </div>

            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-extrabold px-3.5 py-2 rounded-xl transition-colors shadow-md"
            >
              مشاهده جدول
            </button>

            <button
              onClick={() => setComparedProducts([])}
              className="text-zinc-500 hover:text-rose-400 p-1.5 transition-colors"
              title="پاک کردن لیست مقایسه"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        settings={settings}
      />

      {/* Customer Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        products={products}
        wishlistIds={wishlistIds}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={(prod) => handleAddToCart(prod, 1)}
        onSelectProduct={(prod) => {
          setSelectedProduct(prod);
          setIsWishlistOpen(false);
        }}
      />

      {/* Smart Face Shape Eyewear Guide Modal */}
      <FaceShapeGuideModal
        isOpen={isFaceGuideOpen}
        onClose={() => setIsFaceGuideOpen(false)}
        allProducts={products}
        onSelectProduct={(prod) => {
          setSelectedProduct(prod);
          setIsFaceGuideOpen(false);
        }}
      />

      {/* Lens Tint & UV Simulator Modal */}
      <LensSimulatorModal
        isOpen={isLensSimulatorOpen}
        onClose={() => setIsLensSimulatorOpen(false)}
      />

      {/* Checkout & Order Registration Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onOrderCreated={handleOrderCreated}
        instagramId={settings.instagram}
        telegramId={settings.telegram || ''}
        storePhone={settings.phone}
        settings={settings}
        onOpenInvoice={(order) => setSelectedInvoiceOrder(order)}
      />

      {/* Customer Order Tracking & Login-less Portal Modal */}
      <CustomerOrderTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
        orders={orders}
        settings={settings}
        onUpdateOrderCustomer={handleUpdateOrderCustomer}
        onOpenInvoice={(order) => setSelectedInvoiceOrder(order)}
      />

      {/* Invoice PDF Print Modal */}
      <InvoiceModal
        order={selectedInvoiceOrder}
        onClose={() => setSelectedInvoiceOrder(null)}
        settings={settings}
      />

      {/* Real-Time Live Order Alert for Store Owner */}
      <IncomingOrderModal
        order={incomingOrderAlert}
        onClose={() => setIncomingOrderAlert(null)}
        onViewInAdmin={(order) => {
          setIsAdminAuthenticated(true);
          sessionStorage.setItem('admin_session_auth', 'true');
          setCurrentView('admin');
          setSelectedInvoiceOrder(order);
        }}
      />

      {/* Admin Passcode Modal */}
      <AnimatePresence>
        {isPasscodeModalOpen && (
          <motion.div
            key="passcode-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setIsPasscodeModalOpen(false);
              if (!isAdminAuthenticated) setCurrentView('store');
            }}
          >
            <motion.div
              key="passcode-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full space-y-5 text-right dir-rtl relative shadow-2xl"
            >
              <button
                onClick={() => {
                  setIsPasscodeModalOpen(false);
                  if (!isAdminAuthenticated) setCurrentView('store');
                }}
                className="absolute top-4 left-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white">ورود به پنل مدیریت</h3>
                  <p className="text-[11px] text-zinc-400">فروشگاه عینک {settings.storeName}</p>
                </div>
              </div>

              <form onSubmit={handleVerifyPasscode} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                    رمز عبور مدیر را وارد کنید:
                  </label>
                  <input
                    type="password"
                    autoFocus
                    value={passcodeInput}
                    onChange={(e) => {
                      setPasscodeInput(e.target.value);
                      setPasscodeError('');
                    }}
                    placeholder="رمز عبور مدیریت"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-amber-400 font-mono tracking-widest text-center focus:outline-none focus:border-amber-500"
                  />
                  {passcodeError && (
                    <p className="text-rose-400 text-xs mt-1.5 font-medium">{passcodeError}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold py-2.5 rounded-xl text-xs transition-colors shadow-lg"
                  >
                    ورود به پنل
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasscodeModalOpen(false);
                      if (!isAdminAuthenticated) setCurrentView('store');
                    }}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support Modal */}
      <SupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        settings={settings}
        onShowToast={(msg) => setToastMessage(msg)}
        onOpenTracker={() => setIsTrackerModalOpen(true)}
      />

      {/* Floating Chat & Support Button */}
      <div className="fixed bottom-5 left-5 z-40">
        <button
          onClick={() => setIsSupportOpen(true)}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black p-3.5 rounded-full shadow-2xl flex items-center gap-2 group transition-transform active:scale-95 border border-amber-400/30"
          title="چت و پشتیبانی مستقیم با مدیریت"
        >
          <Headphones className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="text-xs hidden sm:inline font-bold pl-1">پشتیبانی و چت</span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </button>
      </div>

      {/* Floating Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Intro Animated Entrance Screen */}
      {showIntroSplash && settings.showIntroSplash !== false && (
        <IntroSplash
          settings={settings}
          onFinish={() => setShowIntroSplash(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/80 pt-10 pb-28 sm:pb-24 px-4 sm:px-6 mt-16 text-right dir-rtl text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-zinc-800/80 pb-8">
            {/* Col 1: About */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Glasses className="w-5 h-5 text-amber-400" />
                <span>فروشگاه عینک استوک {settings.storeName}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {settings.footerAboutText || settings.aboutText || 'فروشگاه تخصصی استوک جهانی واردکننده مستقیم عینک‌های اورجینال، فریم‌های کائوچویی و فلزی اروپایی با تضمین ۱۰۰٪ کیفیت و عدسی‌های استاندارد UV400.'}
              </p>
            </div>

            {/* Col 2: Rules & Delivery */}
            <div className="space-y-3">
              <span className="text-white font-bold text-sm block">قوانین و ارسال سفارشات</span>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {settings.rulesText || 'تمامی سفارش‌ها با پست پیشتاز سریع به سراسر ایران ارسال شده و کد رهگیری پستی ۲۴ رقمی برای خریدار ثبت می‌گردد.'}
              </p>
            </div>

            {/* Col 3: Contact & Channels */}
            <div className="space-y-3">
              <span className="text-white font-bold text-sm block">ارتباط و پشتیبانی سریع</span>
              <div className="flex flex-col gap-2">
                {settings.phone && (
                  <a href={`tel:${settings.phone}`} className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>تلفن تماس: <strong className="text-zinc-200 font-mono">{settings.phone}</strong></span>
                  </a>
                )}
                {settings.instagram && (
                  <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span>اینستاگرام: <strong className="text-zinc-200 font-mono">@{settings.instagram}</strong></span>
                  </a>
                )}
                {settings.telegram && (
                  <a href={`https://t.me/${settings.telegram}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                    <Send className="w-4 h-4 text-sky-400" />
                    <span>تلگرام: <strong className="text-zinc-200 font-mono">@{settings.telegram}</strong></span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 pt-2 border-t border-zinc-800/60">
            <span>© کلیه حقوق مادی و معنوی برای {settings.storeName} محفوظ است.</span>
            <span className="text-zinc-600">طراحی شده برای فروش آنلاین عینک‌های استوک و اورجینال</span>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Navigation */}
      <MobileBottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        cartCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        wishlistCount={wishlistIds.length}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenTracker={() => setIsTrackerModalOpen(true)}
        onOpenSupport={() => setIsSupportOpen(true)}
      />

    </div>
  );
}
