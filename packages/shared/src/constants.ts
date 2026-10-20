import { StoreSettings, FeatureFlags } from './types';

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  reviews: true,
  ratings: true,
  coupons: false, // built now, disabled at launch per §3/§9
  wishlist: true,
  wholesalePricing: true,
  whatsapp: true,
  onlinePayment: true,
  invoices: true,
  recommendations: true,
  maintenanceMode: false,
  newRegistrations: true,
};

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: "DailyFresh & Wholesale Mart",
  storePhone: "+91 98765 43210",
  whatsappNumber: "+91 98765 43210",
  supportEmail: "support@dailyfreshmart.com",
  deliveryCharge: 40,
  freeDeliveryThreshold: 499,
  taxPercentage: 5,
  currency: "₹",
  deliveryAreaNotice: "Delivering to your neighborhood within 2 hours • Bulk Wholesale Orders Welcome!",
  featureFlags: DEFAULT_FEATURE_FLAGS,
};

export const ORDER_STATUS_STEPS = [
  'Placed',
  'Confirmed',
  'Processing',
  'Packed',
  'Out for Delivery',
  'Delivered',
] as const;

export const ALL_ORDER_STATUSES = [
  'Placed',
  'Confirmed',
  'Processing',
  'Packed',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
] as const;
