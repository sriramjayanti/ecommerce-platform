import { Category, Product, Banner } from './types';

export const INITIAL_CATEGORIES: Category[] = [];

export const INITIAL_BANNERS: Banner[] = [
  {
    id: 'banner-sale-1',
    title: 'VS Wholesale — Quality Wholesale Groceries & Bulk Savings',
    subtitle: 'Varshitha Sudarshan Agencies • Opp Shadikhana, Main Road, Amalapuram • Ph: 7799448865',
    imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
    linkUrl: '/',
    tag: '⚡ WELCOME TO VS WHOLESALE',
    dealTimer: 'Fresh Daily Arrivals',
    sortOrder: 1,
    isActive: true,
  },
];

export const INITIAL_PRODUCTS: Product[] = [];
