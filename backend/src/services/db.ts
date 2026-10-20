import fs from 'fs';
import path from 'path';
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

const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

/**
 * In-Memory & Production Data Store with Disk Persistence
 * Seeded with full-scale multi-department marketplace catalog (Mobiles, Electronics, Fashion, Home, Groceries, Appliances & Wholesale).
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
    this.loadFromDisk();
  }

  public saveToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const data = {
        products: this.products,
        categories: this.categories,
        orders: this.orders,
        payments: this.payments,
        settings: this.settings,
        banners: this.banners,
        inventoryLogs: this.inventoryLogs,
        reviews: this.reviews,
        users: this.users,
        auditLogs: this.auditLogs,
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving data to disk:', err);
    }
  }

  public loadFromDisk() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const data = JSON.parse(raw);
        this.products = data.products || [];
        this.categories = data.categories || [];
        this.orders = data.orders || [];
        this.payments = data.payments || [];
        this.settings = data.settings || { ...DEFAULT_STORE_SETTINGS };
        this.banners = data.banners || [];
        this.inventoryLogs = data.inventoryLogs || [];
        this.reviews = data.reviews || [];
        this.users = data.users || [];
        this.auditLogs = data.auditLogs || [];
        return;
      }
    } catch (err) {
      console.error('Error loading data from disk, re-seeding:', err);
    }
    this.resetDemoData();
  }

  public resetDemoData() {
    // ------------------- 1. CATEGORIES (Multi-Department Marketplace) -------------------
    this.categories = JSON.parse(JSON.stringify(INITIAL_CATEGORIES));
    this.banners = JSON.parse(JSON.stringify(INITIAL_BANNERS));
    this.products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));

    // ------------------- 4. CUSTOMERS & ADMINS -------------------
    this.users = [
      {
        id: 'user-admin-1',
        email: 'admin@dailyfreshmart.com',
        phone: '+919876543210',
        displayName: 'Super Admin',
        role: 'super_admin',
        isBlocked: false,
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      {
        id: 'user-customer-1',
        email: 'rahul.sharma@example.com',
        phone: '+919812345678',
        displayName: 'Rahul Sharma',
        role: 'customer',
        isBlocked: false,
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: 'user-customer-2',
        email: 'amit.verma@example.com',
        phone: '+919834567890',
        displayName: 'Amit Verma (Wholesale Buyer)',
        role: 'customer',
        isBlocked: false,
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
    ];

    // ------------------- 5. RECENT ORDERS -------------------
    this.orders = [
      {
        id: 'ord-1001',
        orderNumber: 'AMZ-2026-9021',
        userId: 'user-customer-2',
        customerName: 'Amit Verma',
        customerPhone: '+919834567890',
        customerEmail: 'amit.verma@example.com',
        items: [
          {
            productId: 'prod-anc-headphones',
            variantId: 'var-anc-black',
            title: 'SonicPro Pulse Hybrid ANC Wireless Headphones',
            variantName: 'Midnight Matte Black',
            sku: 'SP-ANC-BLK',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700',
            quantity: 3,
            unitPrice: 2299,
            basePrice: 2499,
            mrp: 6999,
            lineTotal: 6897,
            savings: 14100,
            appliedTierLabel: 'Small Pack (3–5 units)',
          },
        ],
        shippingAddress: {
          id: 'addr-1',
          userId: 'user-customer-2',
          fullName: 'Amit Verma',
          phone: '+919834567890',
          line1: 'B-402, Prestige Tower, MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          addressType: 'work',
          isDefault: true,
        },
        subtotal: 6897,
        totalMrp: 20997,
        totalSavings: 14100,
        deliveryCharge: 0,
        taxAmount: 0,
        discountAmount: 0,
        finalTotal: 6897,
        paymentMethod: 'online',
        paymentStatus: 'successful',
        paymentId: 'T260910889922',
        orderStatus: 'Delivered',
        statusHistory: [
          { status: 'Placed', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
          { status: 'Confirmed', timestamp: new Date(Date.now() - 1.8 * 86400000).toISOString() },
          { status: 'Packed', timestamp: new Date(Date.now() - 1.5 * 86400000).toISOString() },
          { status: 'Out for Delivery', timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
          { status: 'Delivered', timestamp: new Date(Date.now() - 0.5 * 86400000).toISOString() },
        ],
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 0.5 * 86400000).toISOString(),
      },
    ];

    // ------------------- 6. REVIEWS -------------------
    this.reviews = [
      {
        id: 'rev-1',
        productId: 'prod-anc-headphones',
        userId: 'user-customer-1',
        userName: 'Rahul Sharma',
        rating: 5,
        title: 'Incredible Active Noise Cancellation & Build Quality',
        comment: 'The 45dB ANC completely cuts out airplane and office noise. Sound clarity is punchy and battery easily lasts all week. Amazon level delivery speed!',
        status: 'approved',
        verifiedPurchase: true,
        helpfulCount: 48,
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      },
      {
        id: 'rev-2',
        productId: 'prod-flagship-phone',
        userId: 'user-customer-2',
        userName: 'Priya Patel',
        rating: 5,
        title: 'Super fast charging and crystal clear 120Hz display',
        comment: 'Charges from 0 to 100% in just 20 minutes! The camera takes DSLR-like portraits in low light. Highly recommended.',
        status: 'approved',
        verifiedPurchase: true,
        helpfulCount: 35,
        createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ];

    this.saveToDisk();
  }
}

export const db = new DataStore();
