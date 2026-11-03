import { Category, Product, Banner } from './types';

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'banner-sale-1',
    title: 'DailyFresh Mart & Wholesale Superstore',
    subtitle: 'Quality products at retail & bulk mandi rates with fast doorstep delivery',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
    linkUrl: '/',
    tag: '⚡ WELCOME DEALS',
    dealTimer: 'Fresh Daily Arrivals',
    sortOrder: 1,
    isActive: true,
  },
];

export const INITIAL_PRODUCTS: Product[] = [];
