import {
  Product,
  Category,
  Order,
  PaymentRecord,
  StoreSettings,
  Banner,
  InventoryLog,
  Review,
  UserProfile,
  AuditLog,
  DEFAULT_STORE_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_BANNERS,
} from '@ecommerce/shared';

/**
 * In-Memory & Production Data Store
 */
class DataStore {
  public products: Product[] = [];
  public categories: Category[] = [];
  public orders: Order[] = [];
  public payments: PaymentRecord[] = [];
  public settings: StoreSettings = { ...DEFAULT_STORE_SETTINGS };
  public banners: Banner[] = [];
  public inventoryLogs: InventoryLog[] = [];
  public reviews: Review[] = [];
  public users: UserProfile[] = [];
  public auditLogs: AuditLog[] = [];

  constructor() {
    this.resetDemoData();
  }

  public resetDemoData() {
    // ------------------- 1. CATEGORIES & PRODUCTS -------------------
    this.categories = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
    this.banners = JSON.parse(JSON.stringify(INITIAL_BANNERS));
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));

    // ------------------- 2. USERS -------------------
    this.users = [
      {
        id: 'user-admin-1',
        email: 'admin@dailyfreshmart.com',
        phone: '+919876543210',
        displayName: 'Super Admin',
        role: 'super_admin',
        isBlocked: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
    ];

    // ------------------- 3. ORDERS & REVIEWS -------------------
    this.orders = [];
    this.reviews = [];
    this.inventoryLogs = [];
    this.payments = [];
  }
}

export const db = new DataStore();
