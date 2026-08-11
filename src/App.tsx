import React, { useState, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  Order, 
  OrderCustomer,
  StoreSettings, 
  CategoryType, 
  OrderStatus 
} from './types';
import { 
  getStoredProducts, 
  saveStoredProducts, 
  getStoredOrders, 
  saveStoredOrders, 
  getStoredSettings, 
  saveStoredSettings,
  fetchServerData,
  subscribeToFirestore,
  deleteProductFromFirestore,
  deleteOrderFromFirestore,
  addDeletedProductId,
  removeDeletedProductId,
  addDeletedOrderId,
  removeDeletedOrderId,
  mergeProductsList,
  mergeOrdersList,
  DEMO_PRODUCTS
} from './utils/storage';

import { Header } from './components/Header';
import { StoreHero } from './components/StoreHero';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { QuickViewModal } from './components/QuickViewModal';
import { CompareModal } from './components/CompareModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AdminPanel } from './components/AdminPanel';
import { CustomerOrderTrackerModal } from './components/CustomerOrderTrackerModal';
import { InvoiceModal } from './components/InvoiceModal';
import { SupportModal } from './components/SupportModal';
import { SeoHead } from './components/SeoHead';
import { Toast } from './components/Toast';

import { Glasses, Plus, ShieldCheck, Sparkles, RefreshCw, ShoppingBag, Instagram, Phone, Send, Lock, X, KeyRound, Headphones, MessageSquare, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation & View Mode
  const [currentView, setCurrentView] = useState<'store' | 'admin'>('store');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Persistent State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(getStoredSettings());

  // Cart & Comparison State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin Security Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState<boolean>(false);
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');

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
    }
  };

  useEffect(() => {
    const loadedProducts = getStoredProducts();
    const loadedOrders = getStoredOrders();
    const loadedSettings = getStoredSettings();

    if (loadedProducts.length > 0) setProducts(loadedProducts);
    if (loadedOrders.length > 0) setOrders(loadedOrders);
    setSettings(loadedSettings);

    // Initial server sync
    syncWithServer();

    // Live subscription for instant updates across devices
    const unsubscribeSync = subscribeToFirestore(({ products, orders, settings, newOrders }) => {
      if (Array.isArray(products)) setProducts(products);
      if (Array.isArray(orders)) setOrders(orders);
      if (settings) setSettings(settings);

      // Trigger instant Toast notification in Admin/Store view when a new order arrives
      if (Array.isArray(newOrders) && newOrders.length > 0) {
        const latest = newOrders[0];
        const customerName = latest.customer?.fullName || 'مشتری';
        const code = latest.orderCode || latest.id.slice(-6);
        showToast(`🔔 سفارش جدید ثبت شد! کد سفارش: ${code} - مشتری: ${customerName}`);
      }
    });

    // Read view parameter or route path from URL
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const isPathAdmin = window.location.pathname.toLowerCase().includes('/admin');
    if (viewParam === 'admin' || isPathAdmin) {
      // Require passcode verification for admin access
      setIsPasscodeModalOpen(true);
    } else {
      setCurrentView('store');
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

    setCurrentView(view);
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.history.replaceState({}, '', url.toString());
  };

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = passcodeInput.trim();
    const targetPasscode = settings.adminPasscode || '1383';
    if (entered === targetPasscode) {
      setIsAdminAuthenticated(true);
      setIsPasscodeModalOpen(false);
      setCurrentView('admin');
      showToast('با موفقیت وارد پنل مدیریت شدید');
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'admin');
      window.history.replaceState({}, '', url.toString());
    } else {
      setPasscodeError('رمز عبور وارد شده اشتباه است.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setCurrentView('store');
    showToast('از پنل مدیریت خارج شدید');
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'store');
    window.history.replaceState({}, '', url.toString());
  };

  // Compare Handler
  const handleToggleCompare = (product: Product) => {
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
      showToast(`${product.title} به سبد خرید اضافه شد`);
    }
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
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
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('محصول از سبد خرید حذف شد');
  };

  // Admin Product Actions
  const handleSaveProduct = (product: Product) => {
    const updatedProd = { ...product, updatedAt: new Date().toISOString() };
    removeDeletedProductId(product.id);
    setProducts((prev) => {
      const index = prev.findIndex((p) => p.id === product.id);
      let updated: Product[];
      if (index >= 0) {
        updated = [...prev];
        updated[index] = updatedProd;
      } else {
        updated = [updatedProd, ...prev];
      }
      saveStoredProducts(updated);
      return updated;
    });
    showToast('عینک با موفقیت ذخیره شد');
  };

  const handleDeleteProduct = async (productId: string) => {
    addDeletedProductId(productId);
    deleteProductFromFirestore(productId);
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== productId);
      saveStoredProducts(updated);
      return updated;
    });
    showToast('عینک با موفقیت از سیستم حذف شد');
  };

  const handleLoadDemoProducts = () => {
    DEMO_PRODUCTS.forEach((p) => removeDeletedProductId(p.id));
    setProducts(DEMO_PRODUCTS);
    saveStoredProducts(DEMO_PRODUCTS);
    showToast('عینک‌های نمونه با موفقیت بارگذاری شدند');
  };

  // Order Actions & Automatic Stock Management
  const handleOrderCreated = (newOrder: Order) => {
    removeDeletedOrderId(newOrder.id);
    // 1. Deduct quantity from product stock
    setProducts((prevProducts) => {
      const updatedProducts = prevProducts.map((p) => {
        const itemInOrder = newOrder.items.find((item) => item.product.id === p.id);
        if (itemInOrder) {
          const newStock = Math.max(0, p.stock - itemInOrder.quantity);
          return { ...p, stock: newStock, updatedAt: new Date().toISOString() };
        }
        return p;
      });
      saveStoredProducts(updatedProducts);
      return updatedProducts;
    });

    // 2. Add to orders
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      saveStoredOrders(updated);
      return updated;
    });

    // 3. Clear cart after order creation
    setCartItems([]);
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
    addDeletedOrderId(orderId);
    deleteOrderFromFirestore(orderId);
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

  // Filter products for customer view
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.title.includes(searchQuery) ||
      p.code.includes(searchQuery) ||
      p.frameType?.includes(searchQuery) ||
      p.description?.includes(searchQuery);

    return matchesCategory && matchesSearch;
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
        comparedCount={comparedProducts.length}
        onOpenCompareModal={() => setIsCompareModalOpen(true)}
        onOpenTrackerModal={() => setIsTrackerModalOpen(true)}
        onOpenSupportModal={() => setIsSupportOpen(true)}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
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
                <StoreHero settings={settings} />

                {/* Products Grid Header */}
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 text-right dir-rtl">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Glasses className="w-5 h-5 text-amber-400" />
                      <span>
                        {selectedCategory === 'all'
                          ? 'ویترین کامل عینک‌ها'
                          : `عینک‌های دسته ${
                              selectedCategory === 'sunglasses'
                                ? 'آفتابی'
                                : selectedCategory === 'optical'
                                ? 'طبی'
                                : selectedCategory === 'sport'
                                ? 'ورزشی'
                                : 'یونی‌سکس'
                            }`}
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400 font-light mt-0.5">
                      نمایش {filteredProducts.length} محصول از مجموعه {settings.storeName}
                    </p>
                  </div>

                  {/* Quick Admin Access pill */}
                  <button
                    onClick={() => handleViewChange('admin')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-500/20 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>ورود به پنل مدیریت</span>
                  </button>
                </div>

                {/* Products Grid / Empty States */}
                {filteredProducts.length === 0 ? (
                  <div className="bg-zinc-900/40 border-2 border-dashed border-zinc-800 rounded-3xl p-10 text-center space-y-4 my-8 text-right dir-rtl">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-800/80 text-amber-400 flex items-center justify-center mx-auto">
                      <Glasses className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <div className="max-w-md mx-auto space-y-1">
                      <h3 className="text-base font-bold text-white">هنوز محصولی ثبت نشده است</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        اگر مدیر فروشگاه هستید، می‌توانید از طریق پنل مدیریت عکس‌ها، قیمت و مشخصات عینک‌های خود را وارد نمایید.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => handleViewChange('admin')}
                        className="bg-amber-500 hover:bg-amber-400 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>ورود به پنل مدیریت و افزودن عینک</span>
                      </button>

                      <button
                        onClick={handleLoadDemoProducts}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>مشاهده چند نمونه تست</span>
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
                          onQuickView={(p) => setQuickViewProduct(p)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}

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
      />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
        onOpenFullDetail={(prod) => setSelectedProduct(prod)}
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

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/80 py-8 px-4 sm:px-6 mt-12 text-right dir-rtl text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Glasses className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-zinc-300">فروشگاه عینک استوک جهانی ({settings.storeName})</span>
            <span>— کلیه حقوق محفوظ است.</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <a
              href={`https://instagram.com/${settings.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              <Instagram className="w-4 h-4" />
              <span>اینستاگرام: {settings.instagram}</span>
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
