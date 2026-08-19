export interface CategoryItem {
  id: string;
  label: string;
}

export type CategoryType = string;

export interface Product {
  id: string;
  title: string;
  code: string;
  category: string;
  price: number;
  originalPrice?: number;
  frameType: string; // e.g. کائوچویی, فلزی, مگنتی, خلبانی
  lensColor: string; // e.g. دودی, جیوه‌ای, قهوه‌ای
  uvProtection: string; // e.g. UV400, Polarized
  gender: 'مردانه' | 'زنانه' | 'اسپرت (یونی‌سکس)';
  images: string[];
  description: string;
  features: string[];
  stock: number;
  isFeatured?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';

export interface OrderCustomer {
  fullName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  notes?: string;
}

export interface CouponCode {
  id: string;
  code: string;
  discountPercent: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface Order {
  id: string;
  orderCode: string;
  createdAt: string;
  items: CartItem[];
  totalAmount: number;
  shippingFee: number;
  discountAmount?: number;
  appliedCoupon?: string;
  finalAmount: number;
  customer: OrderCustomer;
  paymentMethod: 'card_to_card' | 'online_gateway' | 'cash_on_delivery';
  paymentReceipt?: string;
  isPaid?: boolean;
  paymentAuthority?: string;
  paymentRefId?: string;
  paymentGatewayName?: string;
  status: OrderStatus;
  postalTrackingCode?: string;
  adminNote?: string;
  updatedAt?: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  bannerMessage?: string;
  welcomeText?: string;
  welcomeSubtext?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBadgeText?: string;
  announcementText?: string;
  showAnnouncement?: boolean;
  feature1Title?: string;
  feature1Desc?: string;
  feature2Title?: string;
  feature2Desc?: string;
  feature3Title?: string;
  feature3Desc?: string;
  feature4Title?: string;
  feature4Desc?: string;
  noticeText?: string;
  aboutText?: string;
  rulesText?: string;
  footerAboutText?: string;
  categories?: CategoryItem[];
  coupons?: CouponCode[];
  instagram: string;
  telegram?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  telegramWebhookUrl?: string;
  ntfyEnabled?: boolean;
  ntfyTopic?: string;
  ntfyServerUrl?: string;
  phone: string;
  address: string;
  freeShippingThreshold: number;
  adminPasscode: string;
  cardNumber: string;
  cardHolderName: string;
  bankName?: string;
  accountNumber?: string;
  shebaNumber?: string;
  enableOnlineGateway?: boolean;
  zarinpalMerchantId?: string;
  zarinpalSandbox?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  googleSiteVerification?: string;
  bingSiteVerification?: string;
  torobFeedEnabled?: boolean;
  emallsFeedEnabled?: boolean;
  robotsTxtContent?: string;
  googleAnalyticsId?: string;
  clarityProjectId?: string;
  showVisitorCounterInFooter?: boolean;
  updatedAt?: string;
}

export interface VisitLog {
  id: string;
  timestamp: string;
  page: string;
  device: 'mobile' | 'desktop' | 'tablet';
  browser?: string;
  referrer?: string;
}

export interface DailyStat {
  date: string;
  views: number;
  visitors: number;
}

export interface VisitorStats {
  totalViews: number;
  uniqueVisitors: number;
  todayViews: number;
  todayUnique: number;
  activeOnline: number;
  recentVisits: VisitLog[];
  dailyStats: DailyStat[];
}
