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
  storeName: "VS Wholesale",
  storePhone: "7799448865",
  whatsappNumber: "7799448865",
  supportEmail: "", // No email contact per user instructions; WhatsApp/Call only
  deliveryCharge: 40,
  freeDeliveryThreshold: 499,
  taxPercentage: 5,
  currency: "₹",
  deliveryAreaNotice: "Varshitha Sudarshan Agencies • Opp Shadikhana, Main Road, Amalapuram • Ph: 7799448865",
  featureFlags: DEFAULT_FEATURE_FLAGS,
};

export const ORDER_STATUS_STEPS = [
  'Placed',
  'Confirmed',
  'Processing',
  'Packed',
  'Dispatched',
  'Out for Delivery',
  'Delivered',
] as const;

export const DEFAULT_LOW_STOCK_THRESHOLD = 15;

export const SIMPLE_TRACKING_STEPS = [
  'Order Confirmed',
  'Dispatched',
  'Delivered',
] as const;

export type SimpleTrackingStep = (typeof SIMPLE_TRACKING_STEPS)[number];

export function mapToSimpleTrackingStep(status: string): {
  step: SimpleTrackingStep | 'Cancelled';
  stepIndex: number;
  label: string;
  description: string;
} {
  const s = (status || '').toLowerCase();
  if (s.includes('cancel')) {
    return {
      step: 'Cancelled',
      stepIndex: -1,
      label: 'Order Cancelled',
      description: 'Order was cancelled by store admin.',
    };
  }
  if (s.includes('deliver')) {
    return {
      step: 'Delivered',
      stepIndex: 2,
      label: 'Delivered',
      description: 'Package delivered to your doorstep. Updated by store admin.',
    };
  }
  if (s.includes('dispatch') || s.includes('out for delivery') || s.includes('pack')) {
    return {
      step: 'Dispatched',
      stepIndex: 1,
      label: 'Dispatched',
      description: 'Order packed and dispatched for delivery. Updated by store admin.',
    };
  }
  return {
    step: 'Order Confirmed',
    stepIndex: 0,
    label: 'Order Confirmed',
    description: 'Order verified and confirmed. Updated by store admin.',
  };
}

export const STOREFRONT_URL_PROD = 'https://vs-wholesale.web.app';
export const ADMIN_URL_PROD = 'https://vs-wholesale-admin.web.app';

export function getStorefrontUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5173';
    }
  }
  return STOREFRONT_URL_PROD;
}

export function getAdminUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5174';
    }
  }
  return ADMIN_URL_PROD;
}

