export type UserRole = 'customer' | 'super_admin' | 'order_manager' | 'inventory_manager' | 'content_staff';

export interface UserProfile {
  id: string;
  email?: string;
  phone?: string;
  displayName?: string;
  role: UserRole;
  isBlocked: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType: 'home' | 'work' | 'other';
  isDefault: boolean;
}

export interface PriceTier {
  id: string;
  minQty: number;
  maxQty?: number | null; // null means unbounded (e.g. 25+)
  unitPrice: number;
  label?: string; // e.g. "Retail (1-4)", "Wholesale (25+)"
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "500g", "1kg", "Pack of 6", "128GB Blue"
  sku: string;
  barcode?: string;
  weightOrSize: string;
  mrp: number;
  basePrice: number; // Single unit regular price
  stock: number;
  lowStockThreshold: number;
  pricingTiers: PriceTier[];
  isDefault?: boolean;
  images?: string[];
  color?: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  brand?: string;
  images: string[];
  variants: ProductVariant[];
  isWholesaleEnabled: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  badge?: 'Deal of the Day' | 'Bestseller' | 'Prime' | 'Flipkart Assured' | 'Trending' | 'Top Rated';
  deliveryTag?: string; // e.g. "FREE Delivery by Tomorrow 8 PM"
  highlights?: string[];
  specs?: Record<string, string>;
  bankOffers?: string[];
  frequentlyBoughtTogetherIds?: string[];
  discountPercent?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  rating?: number;
  reviewCount?: number;
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  imageUrl?: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isVisible?: boolean;
  isActive?: boolean;
  subcategories?: { id: string; name: string; slug: string }[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  title: string;
  variantName: string;
  image: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
  mrp: number;
  lineTotal: number;
  savings: number;
  maxStock: number;
  appliedTierId?: string;
  appliedTierLabel?: string;
  pricingTiers?: PriceTier[];
  isWholesaleEnabled?: boolean;
}

export interface CartTotals {
  subtotal: number;
  totalMrp: number;
  totalSavings: number;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  taxAmount: number;
  finalTotal: number;
  itemCount: number;
}

export type PaymentStatus =
  | 'initiated'
  | 'pending'
  | 'successful'
  | 'failed'
  | 'cancelled'
  | 'reconciliation_needed';

export interface PaymentRecord {
  id: string;
  orderId: string;
  merchantTransactionId: string;
  amount: number;
  currency: 'INR';
  status: PaymentStatus;
  provider: 'phonepe' | 'cod' | 'mock';
  phonepeTransactionId?: string;
  responseCode?: string;
  checksum?: string;
  rawResponse?: any;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'Placed'
  | 'Confirmed'
  | 'Processing'
  | 'Packed'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderItemSnapshot {
  productId: string;
  variantId: string;
  title: string;
  variantName: string;
  sku: string;
  image: string;
  quantity: number;
  unitPrice: number;
  basePrice: number;
  mrp: number;
  lineTotal: number;
  savings: number;
  appliedTierLabel?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export type PaymentMethod = 'upi' | 'credit_card' | 'debit_card' | 'cod' | 'online';

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItemSnapshot[];
  shippingAddress?: Address;
  deliveryAddress?: any;
  subtotal: number;
  totalMrp?: number;
  totalSavings?: number;
  deliveryCharge: number;
  taxAmount?: number;
  discountAmount?: number;
  finalTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  fulfillmentMethod?: 'home_delivery' | 'takeaway';
  stockDeducted?: boolean;
  orderStatus: OrderStatus;
  statusHistory?: OrderStatusHistoryItem[];
  staffNotes?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlags {
  reviews: boolean;
  ratings: boolean;
  coupons: boolean;
  wishlist: boolean;
  wholesalePricing: boolean;
  whatsapp: boolean;
  onlinePayment: boolean;
  invoices: boolean;
  recommendations: boolean;
  maintenanceMode: boolean;
  newRegistrations: boolean;
}

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  whatsappNumber: string;
  supportEmail: string;
  deliveryCharge: number;
  freeDeliveryThreshold: number;
  taxPercentage: number;
  currency: string;
  deliveryAreaNotice: string;
  featureFlags: FeatureFlags;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  categoryId?: string;
  sortOrder: number;
  isActive: boolean;
  tag?: string;
  dealTimer?: string; // e.g. "Ends in 05h : 22m"
  startDate?: string;
  endDate?: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  previousStock: number;
  change: number;
  newStock: number;
  reason: 'order_sale' | 'manual_adjustment' | 'restock' | 'return_restock' | 'audit_correction';
  referenceId?: string;
  createdBy: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  status: 'approved' | 'pending' | 'rejected';
  verifiedPurchase?: boolean;
  helpfulCount?: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  userRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details?: any;
  timestamp: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  code: string;
  template: string;
}
