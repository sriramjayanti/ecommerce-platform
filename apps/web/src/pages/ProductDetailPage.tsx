import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, ProductVariant, Review, INITIAL_PRODUCTS, dataStore } from '@ecommerce/shared';
import { useCart } from '../context/CartContext';
import { WholesaleTierTable } from '../components/WholesaleTierTable';
import { FlipkartProductRow } from '../components/FlipkartProductRow';
import { ProductCard } from '../components/ProductCard';
import {
  Star,
  ShoppingBag,
  Zap,
  Truck,
  ShieldCheck,
  RotateCcw,
  Check,
  CreditCard,
  MapPin,
  Heart,
  Share2,
  ChevronRight,
  Sparkles,
  Info,
  Package,
  Plus,
  ArrowLeft,
  Tag,
  Filter,
} from 'lucide-react';

const SAMPLE_RECOMMENDED_PRODUCTS: Product[] = [
  {
    id: 'rec-atta-5kg',
    title: 'Shudh Golden Sharbati Whole Wheat Chakki Atta (5kg Pack)',
    slug: 'shudh-golden-sharbati-atta-5kg',
    description: '100% pure MP Sharbati wheat stone-ground flour. High dietary fiber and extra soft rotis.',
    categoryId: 'cat-staples',
    category: 'Grains & Atta',
    subcategoryId: 'sub-atta',
    brand: 'VS Wholesale',
    badge: 'Trending',
    images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80'],
    variants: [
      {
        id: 'var-rec-atta-5kg',
        name: '5 kg Pack',
        sku: 'VS-ATTA-5KG',
        weightOrSize: '5 kg',
        lowStockThreshold: 15,
        mrp: 299,
        basePrice: 245,
        stock: 150,
        pricingTiers: [
          { id: 'tier-1', minQty: 1, maxQty: 4, unitPrice: 245, label: 'Retail (1-4)' },
          { id: 'tier-2', minQty: 5, maxQty: null, unitPrice: 220, label: 'Wholesale (5+)' },
        ],
        isDefault: true,
      },
    ],
    isWholesaleEnabled: true,
    rating: 4.8,
    reviewCount: 340,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec-basmati-rice-5kg',
    title: 'Daawat Rozana Super Basmati Rice (5kg Bag - Aged 2 Years)',
    slug: 'daawat-rozana-super-basmati-rice-5kg',
    description: 'Long grain aromatic basmati rice aged for fluffy, non-sticky cooking.',
    categoryId: 'cat-staples',
    category: 'Rice & Grains',
    subcategoryId: 'sub-rice',
    brand: 'Daawat',
    badge: 'Bestseller',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'],
    variants: [
      {
        id: 'var-rec-rice-5kg',
        name: '5 kg Bag',
        sku: 'VS-RICE-5KG',
        weightOrSize: '5 kg',
        lowStockThreshold: 15,
        mrp: 480,
        basePrice: 385,
        stock: 200,
        pricingTiers: [
          { id: 'tier-1', minQty: 1, maxQty: 3, unitPrice: 385, label: 'Retail (1-3)' },
          { id: 'tier-2', minQty: 4, maxQty: null, unitPrice: 350, label: 'Wholesale (4+)' },
        ],
        isDefault: true,
      },
    ],
    isWholesaleEnabled: true,
    rating: 4.9,
    reviewCount: 520,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec-sunflower-oil-1l',
    title: 'Fortune Sunlite Refined Sunflower Oil Pouch (1 Litre)',
    slug: 'fortune-sunlite-sunflower-oil-1l',
    description: 'Light, healthy refined sunflower oil enriched with Vitamin A & D.',
    categoryId: 'cat-oils',
    category: 'Oils & Ghee',
    subcategoryId: 'sub-oil',
    brand: 'Fortune',
    badge: 'Deal of the Day',
    images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'],
    variants: [
      {
        id: 'var-rec-oil-1l',
        name: '1 Litre Pouch',
        sku: 'VS-OIL-1L',
        weightOrSize: '1 Litre',
        lowStockThreshold: 15,
        mrp: 165,
        basePrice: 132,
        stock: 350,
        pricingTiers: [
          { id: 'tier-1', minQty: 1, maxQty: 5, unitPrice: 132, label: 'Retail (1-5)' },
          { id: 'tier-2', minQty: 6, maxQty: null, unitPrice: 122, label: 'Carton (6+)' },
        ],
        isDefault: true,
      },
    ],
    isWholesaleEnabled: true,
    rating: 4.7,
    reviewCount: 410,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec-toor-dal-1kg',
    title: 'Tata Sampann Unpolished High-Protein Toor Dal (1kg Pouch)',
    slug: 'tata-sampann-unpolished-toor-dal-1kg',
    description: 'Unpolished pigeon peas rich in natural dietary protein without water or leather polishing.',
    categoryId: 'cat-staples',
    category: 'Dals & Pulses',
    subcategoryId: 'sub-dal',
    brand: 'Tata Sampann',
    badge: 'Flipkart Assured',
    images: ['https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'],
    variants: [
      {
        id: 'var-rec-dal-1kg',
        name: '1 kg Pouch',
        sku: 'VS-DAL-1KG',
        weightOrSize: '1 kg',
        lowStockThreshold: 15,
        mrp: 195,
        basePrice: 158,
        stock: 220,
        pricingTiers: [
          { id: 'tier-1', minQty: 1, maxQty: 4, unitPrice: 158, label: 'Retail (1-4)' },
          { id: 'tier-2', minQty: 5, maxQty: null, unitPrice: 142, label: 'Wholesale (5+)' },
        ],
        isDefault: true,
      },
    ],
    isWholesaleEnabled: true,
    rating: 4.8,
    reviewCount: 290,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec-pure-ghee-1l',
    title: 'Amul Pure Desi Cow Ghee (1 Litre Aroma Tin)',
    slug: 'amul-pure-cow-ghee-1l',
    description: 'Granular texture, rich aroma, and natural golden color made from fresh cow milk.',
    categoryId: 'cat-oils',
    category: 'Oils & Ghee',
    subcategoryId: 'sub-ghee',
    brand: 'Amul',
    badge: 'Bestseller',
    images: ['https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?w=600&auto=format&fit=crop&q=80'],
    variants: [
      {
        id: 'var-rec-ghee-1l',
        name: '1 Litre Tin',
        sku: 'VS-GHEE-1L',
        weightOrSize: '1 Litre',
        lowStockThreshold: 15,
        mrp: 695,
        basePrice: 585,
        stock: 110,
        pricingTiers: [
          { id: 'tier-1', minQty: 1, maxQty: 2, unitPrice: 585, label: 'Retail (1-2)' },
          { id: 'tier-2', minQty: 3, maxQty: null, unitPrice: 545, label: 'Wholesale (3+)' },
        ],
        isDefault: true,
      },
    ],
    isWholesaleEnabled: true,
    rating: 4.9,
    reviewCount: 680,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec-bhujia-sev-400g',
    title: "Haldiram's Nagpur Spicy Bhujia Sev Snack Pouch (400g)",
    slug: 'haldirams-nagpur-spicy-bhujia-sev-400g',
    description: 'Crispy gram and moth pulse savory noodles spiced with signature cloves and red chillies.',
    categoryId: 'cat-snacks',
    category: 'Snacks & Munchies',
    subcategoryId: 'sub-namkeen',
    brand: "Haldiram's",
    badge: 'Trending',
    images: ['https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80'],
    variants: [
      {
        id: 'var-rec-bhujia-400g',
        name: '400g Pouch',
        sku: 'VS-BHUJIA-400G',
        weightOrSize: '400g',
        lowStockThreshold: 15,
        mrp: 125,
        basePrice: 98,
        stock: 280,
        pricingTiers: [
          { id: 'tier-1', minQty: 1, maxQty: 5, unitPrice: 98, label: 'Retail (1-5)' },
          { id: 'tier-2', minQty: 6, maxQty: null, unitPrice: 86, label: 'Carton (6+)' },
        ],
        isDefault: true,
      },
    ],
    isWholesaleEnabled: true,
    rating: 4.7,
    reviewCount: 460,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec-tata-tea-gold-500g',
    title: 'Tata Tea Gold Premium Assam Long Leaf Black Tea (500g Pack)',
    slug: 'tata-tea-gold-premium-assam-tea-500g',
    description: 'Exquisite blend of CTC tea granules and gently rolled aromatic Assam long leaves.',
    categoryId: 'cat-beverages',
    category: 'Beverages & Tea',
    subcategoryId: 'sub-tea',
    brand: 'Tata Tea',
    badge: 'Top Rated',
    images: ['https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'],
    variants: [
      {
        id: 'var-rec-tea-500g',
        name: '500g Pack',
        sku: 'VS-TEA-500G',
        weightOrSize: '500g',
        lowStockThreshold: 15,
        mrp: 340,
        basePrice: 285,
        stock: 190,
        pricingTiers: [
          { id: 'tier-1', minQty: 1, maxQty: 3, unitPrice: 285, label: 'Retail (1-3)' },
          { id: 'tier-2', minQty: 4, maxQty: null, unitPrice: 260, label: 'Wholesale (4+)' },
        ],
        isDefault: true,
      },
    ],
    isWholesaleEnabled: true,
    rating: 4.8,
    reviewCount: 310,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rec-everest-masala-combo',
    title: 'Everest Pav Bhaji & Royal Garam Masala Twin Pack (100g + 100g)',
    slug: 'everest-pav-bhaji-garam-masala-combo-200g',
    description: 'Authentic Indian spice blends ground from whole spices for rich flavor and vibrant aroma.',
    categoryId: 'cat-spices',
    category: 'Spices & Masalas',
    subcategoryId: 'sub-masala',
    brand: 'Everest',
    badge: 'Trending',
    images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80'],
    variants: [
      {
        id: 'var-rec-masala-200g',
        name: 'Twin Pack 200g',
        sku: 'VS-MASALA-200G',
        weightOrSize: '200g',
        lowStockThreshold: 15,
        mrp: 170,
        basePrice: 135,
        stock: 240,
        pricingTiers: [
          { id: 'tier-1', minQty: 1, maxQty: 4, unitPrice: 135, label: 'Retail (1-4)' },
          { id: 'tier-2', minQty: 5, maxQty: null, unitPrice: 118, label: 'Wholesale (5+)' },
        ],
        isDefault: true,
      },
    ],
    isWholesaleEnabled: true,
    rating: 4.9,
    reviewCount: 540,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const ProductDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { addItem, toggleWishlist, isInWishlist } = useCart();

  const fallbackProduct = INITIAL_PRODUCTS.find(
    (p) => p.id === idOrSlug || p.slug === idOrSlug
  ) || SAMPLE_RECOMMENDED_PRODUCTS.find(
    (p) => p.id === idOrSlug || p.slug === idOrSlug
  ) || null;

  const [product, setProduct] = useState<Product | null>(fallbackProduct);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    fallbackProduct?.variants.find((v) => v.isDefault) || fallbackProduct?.variants[0] || null
  );
  const [selectedImage, setSelectedImage] = useState<string>(fallbackProduct?.images[0] || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(!fallbackProduct);
  const [pincode, setPincode] = useState<string>('');
  const [pincodeMessage, setPincodeMessage] = useState<string>('');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [allCatalogProducts, setAllCatalogProducts] = useState<Product[]>([]);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [frequentlyBought, setFrequentlyBought] = useState<Product[]>([]);
  const [bundleChecked, setBundleChecked] = useState<boolean>(true);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!idOrSlug) return;

    const foundLocal = INITIAL_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug) ||
      SAMPLE_RECOMMENDED_PRODUCTS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);

    if (foundLocal) {
      setProduct(foundLocal);
      setSelectedVariant(foundLocal.variants.find((v) => v.isDefault) || foundLocal.variants[0]);
      setSelectedImage(foundLocal.images[0] || '');
      setLoading(false);
    }

    const loadProductData = async () => {
      if (!idOrSlug) return;
      const found = await dataStore.getProductByIdOrSlug(idOrSlug);
      if (found) {
        setProduct(found);
        setSelectedVariant((prev) => {
          if (prev) {
            const matching = found.variants.find((v) => v.id === prev.id);
            if (matching) return matching;
          }
          return found.variants.find((v) => v.isDefault) || found.variants[0];
        });
        if (!selectedImage) {
          setSelectedImage(found.images[0] || '');
        }
      }

      // Load all catalog products for recommendations
      const allProds = await dataStore.getProducts();
      if (Array.isArray(allProds) && allProds.length > 0) {
        setAllCatalogProducts(allProds);
      }
      setLoading(false);
    };

    loadProductData();

    // Subscribe to real-time inventory and product updates
    const unsubscribe = dataStore.subscribe((event) => {
      if (event.type === 'inventory_updated' || event.type === 'products_updated') {
        loadProductData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [idOrSlug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square bg-slate-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-200 rounded-xl w-3/4" />
            <div className="h-4 bg-slate-200 rounded-xl w-1/2" />
            <div className="h-16 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product || !selectedVariant) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <Package className="h-12 w-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Product Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The item you are searching for might be out of stock.</p>
        <Link to="/" className="mt-4 inline-block rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-slate-950">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const price = selectedVariant.basePrice;
  const mrp = selectedVariant.mrp || price;
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem(product, selectedVariant, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleBuyNow = () => {
    addItem(product, selectedVariant, quantity);
    navigate('/checkout');
  };

  const handlePincodeCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setPincodeMessage(`✓ In Stock: Available for delivery to ${pincode}`);
    } else {
      setPincodeMessage('Please enter a valid 6-digit postal code.');
    }
  };

  const bundleItem = frequentlyBought[0];
  const bundleTotal = price + (bundleItem?.variants[0]?.basePrice || 0);
  const bundleDiscounted = Math.round(bundleTotal * 0.9);

  // Merge all catalog products with fallback recommended products (no duplicate IDs/titles)
  const combinedProducts = [
    ...allCatalogProducts,
    ...SAMPLE_RECOMMENDED_PRODUCTS.filter(
      (sp) => !allCatalogProducts.some((ap) => ap.id === sp.id || ap.title === sp.title)
    ),
  ];

  // Candidates excluding the active product
  const nonCurrentProducts = combinedProducts.filter(
    (p) => p.id !== product?.id && p.slug !== product?.slug
  );

  // 1. Similar Products: Prefer same category or related items
  const sameCategoryProducts = nonCurrentProducts.filter(
    (p) => ((p as any).category && (p as any).category === (product as any)?.category) || p.categoryId === product?.categoryId
  );
  const similarProducts = sameCategoryProducts.length >= 4
    ? sameCategoryProducts
    : [...sameCategoryProducts, ...nonCurrentProducts.filter((p) => !sameCategoryProducts.includes(p))].slice(0, 8);

  // 2. Bought Together / Customers Also Viewed
  const boughtTogetherProducts = nonCurrentProducts
    .filter((p) => !similarProducts.some((sp) => sp.id === p.id))
    .slice(0, 8);

  // 3. Unique categories for vertical grid filter tabs
  const availableCategories = Array.from(
    new Set(
      combinedProducts
        .map((p) => (p as any).category || (p.categoryId ? p.categoryId.replace('cat-', '') : ''))
        .filter(Boolean)
    )
  );

  // 4. Vertical Grid Products (Explore More)
  const verticalExploreProducts = nonCurrentProducts.filter((p) => {
    if (activeCategoryFilter !== 'all') {
      const catName = ((p as any).category || p.categoryId || '').toLowerCase();
      return catName.includes(activeCategoryFilter.toLowerCase());
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-6 font-sans">
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        
        {/* Simple Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-100 border border-slate-200 transition"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" />
            <span>← Back to Products</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">SKU: {selectedVariant?.sku}</span>
        </div>

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Link to="/" className="hover:text-amber-600">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/category/${product.categoryId}`} className="hover:text-amber-600">
            {product.categoryId.replace('cat-', '').replace('-', ' ').toUpperCase()}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-900 font-bold truncate max-w-xs">{product.title}</span>
        </nav>

        {/* 3-COLUMN AMAZON / FLIPKART PRODUCT SHOWCASE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMN 1: Image Gallery (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col-reverse sm:flex-row gap-4 sticky top-24">
            
            {/* Thumbnails Rail */}
            <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[460px] scrollbar-none">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`h-16 w-16 sm:h-20 sm:w-20 flex-shrink-0 rounded-2xl border-2 p-1 bg-white overflow-hidden transition ${
                    selectedImage === img ? 'border-amber-500 shadow-md scale-105' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover rounded-xl" />
                </button>
              ))}
            </div>

            {/* Main Active Image Box */}
            <div className="flex-1 relative aspect-square rounded-3xl bg-white border border-slate-200 p-4 shadow-xs overflow-hidden flex items-center justify-center group">
              {product.badge && (
                <span className="absolute top-4 left-4 z-10 rounded-md bg-rose-600 px-2.5 py-1 text-[10px] font-black text-white uppercase tracking-wider shadow-sm">
                  {product.badge}
                </span>
              )}
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs border border-slate-200 shadow-xs transition hover:scale-110 ${
                  isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-slate-400 hover:text-rose-500'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-rose-500' : ''}`} />
              </button>

              <img
                src={selectedImage || product.images[0]}
                alt={product.title}
                className="h-full w-full object-cover rounded-2xl group-hover:scale-105 transition duration-500"
              />
            </div>
          </div>

          {/* COLUMN 2: Center Details, Bank Offers & Specs (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            <div>
              {/* Brand & Verified Assured Pill */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black uppercase text-amber-600 tracking-wider">
                  Brand: {product.brand || 'VS Wholesale'}
                </span>
                <span className="flex items-center gap-1 font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Flipkart Assured / Prime
                </span>
              </div>

              {/* Title */}
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {product.title}
              </h1>

              {/* Ratings */}
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1 rounded-md bg-emerald-700 px-2 py-0.5 text-xs font-black text-white">
                  <span>{product.rating || 4.8}</span>
                  <Star className="h-3 w-3 fill-white" />
                </div>
                <span className="text-xs text-slate-500 font-bold">
                  {product.reviewCount || 142} Verified Ratings & {reviews.length} Reviews
                </span>
              </div>
            </div>

            {/* Price Snapshot */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-1">
              <div className="flex items-baseline gap-2.5">
                {discount > 0 && (
                  <span className="text-xl font-black text-emerald-600">
                    -{discount}%
                  </span>
                )}
                <span className="text-3xl font-black text-slate-950 font-sans">
                  ₹{price.toLocaleString('en-IN')}
                </span>
              </div>
              {mrp > price && (
                <p className="text-xs text-slate-500">
                  M.R.P.: <span className="line-through">₹{mrp.toLocaleString('en-IN')}</span> (Inclusive of all taxes)
                </p>
              )}

              {/* Quick Wholesale Offers Button */}
              {product.isWholesaleEnabled && selectedVariant.pricingTiers && selectedVariant.pricingTiers.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('wholesale-offers-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full mt-2 flex items-center justify-between rounded-xl bg-amber-100 hover:bg-amber-200 border border-amber-300 p-2.5 text-xs font-black text-amber-950 transition active:scale-98"
                >
                  <span className="flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-amber-600 fill-amber-500" />
                    <span>Special Wholesale Offers ({selectedVariant.pricingTiers.length} Slabs)</span>
                  </span>
                  <span className="text-amber-800 underline text-[11px] font-bold">Show Offers ↓</span>
                </button>
              )}
            </div>

            {/* Bank Offers Card */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-black text-blue-900">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>Available Bank Offers:</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 text-[11px] list-disc pl-4">
                <li>Flat 10% Instant Discount on HDFC & SBI Bank Credit Cards</li>
                <li>Flat ₹500 Cashback on PhonePe UPI Transactions above ₹1,999</li>
                <li>No Cost EMI available on major credit cards</li>
              </ul>
            </div>

            {/* Variant Selector */}
            {product.variants.length > 1 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-900">
                  Select Size / Variant: <span className="text-amber-600">{selectedVariant.name}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`rounded-xl border-2 px-3 py-2 text-xs font-bold transition text-left ${
                        selectedVariant.id === v.id
                          ? 'border-amber-500 bg-amber-50 text-slate-950 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{v.name}</span>
                      <span className="block text-[11px] font-black text-slate-950">₹{v.basePrice}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wholesale Tier Pricing Table */}
            {product.isWholesaleEnabled && selectedVariant.pricingTiers && selectedVariant.pricingTiers.length > 0 && (
              <div id="wholesale-offers-section" className="scroll-mt-24">
                <WholesaleTierTable
                  variant={selectedVariant}
                  currentQuantity={quantity}
                  onSelectQuantity={(q) => setQuantity(q)}
                />
              </div>
            )}

            {/* Highlights */}
            {product.highlights && product.highlights.length > 0 && (
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-900">Product Highlights:</h4>
                <ul className="space-y-1 text-slate-600 list-disc pl-4 text-[11px] leading-relaxed">
                  {product.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Specifications */}
            {product.specs && (
              <div className="space-y-2 text-xs border-t border-slate-200 pt-4">
                <h4 className="font-bold text-slate-900">Technical Specifications:</h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="grid grid-cols-2 p-2 text-[11px]">
                      <span className="text-slate-500 font-medium">{key}</span>
                      <span className="font-bold text-slate-900">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 3: Right Sticky Buy Box (3 Cols) */}
          <div className="lg:col-span-3 sticky top-24">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-md space-y-4 text-xs text-slate-800">
              
              {/* Buy Box Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-950 font-sans">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  {mrp > price && (
                    <span className="text-xs text-slate-400 line-through">
                      ₹{mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Delivery Pincode Checker */}
              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <span className="font-bold text-slate-700 text-[11px] block">Delivery Location:</span>
                <form onSubmit={handlePincodeCheck} className="flex gap-1.5">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Pincode"
                    className="flex-1 rounded-xl border border-slate-300 p-2 text-xs font-mono font-bold outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 text-xs font-bold transition"
                  >
                    Check
                  </button>
                </form>
                {pincodeMessage && (
                  <p className="text-[10px] font-semibold text-emerald-700 pt-0.5">
                    {pincodeMessage}
                  </p>
                )}
              </div>

              {/* In Stock & Quantity */}
              <div className="border-t border-slate-100 pt-3 space-y-3">
                {selectedVariant.stock <= 0 ? (
                  <span className="inline-block rounded-md bg-rose-100 text-rose-800 px-2.5 py-1 text-[11px] font-black uppercase">
                    Currently Out of Stock
                  </span>
                ) : selectedVariant.stock < 15 ? (
                  <span className="inline-block rounded-md bg-amber-100 text-amber-800 px-2.5 py-1 text-[11px] font-black">
                    Only {selectedVariant.stock} left in stock - order soon!
                  </span>
                ) : (
                  <span className="inline-block rounded-md bg-emerald-100 text-emerald-800 px-2.5 py-1 text-[11px] font-black uppercase">
                    In Stock
                  </span>
                )}

                {selectedVariant.stock > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Quantity:</label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 10, 15, 25, 50].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'unit' : 'units'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* CTAs: Add to Cart (Yellow) & Buy Now (Orange) */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={selectedVariant.stock <= 0}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black shadow-md transition ${
                    selectedVariant.stock <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-500 active:scale-95 text-slate-950'
                  }`}
                >
                  <ShoppingBag className="h-4 w-4" />
                  <span>{selectedVariant.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={selectedVariant.stock <= 0}
                  className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-black shadow-md transition ${
                    selectedVariant.stock <= 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed hidden'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white'
                  }`}
                >
                  <Zap className="h-4 w-4 fill-white" />
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Trust & Guarantee */}
              <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Secure 256-Bit Encrypted Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span>7-Day Replacement / Return Guarantee</span>
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Ships from Central Warehouse (Varshitha Sudarshan Agencies) • Sold by VS Wholesale
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FREQUENTLY BOUGHT TOGETHER BUNDLE */}
        {bundleItem && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900">Frequently Bought Together</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                <img src={selectedImage || product.images[0]} alt="" className="h-20 w-20 rounded-2xl object-cover border border-slate-200" />
                <Plus className="h-5 w-5 text-slate-400 flex-shrink-0" />
                <img src={bundleItem.images[0]} alt="" className="h-20 w-20 rounded-2xl object-cover border border-slate-200" />
                <div className="text-xs">
                  <p className="font-bold text-slate-900 line-clamp-1">{product.title} (₹{price})</p>
                  <p className="text-slate-500 line-clamp-1">+ {bundleItem.title} (₹{bundleItem.variants[0]?.basePrice})</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-slate-400 line-through block">₹{bundleTotal}</span>
                  <span className="text-lg font-black text-emerald-700 font-sans">₹{bundleDiscounted}</span>
                  <span className="text-[10px] text-emerald-600 font-bold block">Save 10% on Combo</span>
                </div>
                <button
                  onClick={() => {
                    addItem(product, selectedVariant, 1);
                    addItem(bundleItem, bundleItem.variants[0], 1);
                    navigate('/checkout');
                  }}
                  className="rounded-2xl bg-amber-400 hover:bg-amber-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-sm"
                >
                  Buy Both Items
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FLIPKART STYLE HORIZONTAL CAROUSEL 1: SIMILAR PRODUCTS */}
        <FlipkartProductRow
          title="Similar Products"
          subtitle="Explore top rated alternatives with direct wholesale volume slabs"
          badge="Trending"
          products={similarProducts}
          onProductClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />

        {/* FLIPKART STYLE HORIZONTAL CAROUSEL 2: BOUGHT TOGETHER / CUSTOMERS ALSO VIEWED */}
        <FlipkartProductRow
          title="Bought Together • Customers Also Viewed"
          subtitle="Frequently paired groceries, cooking essentials & wholesale packs"
          badge="Hot Deals"
          products={boughtTogetherProducts}
          onProductClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />

        {/* FLIPKART & AMAZON STYLE VERTICAL PRODUCTS GRID */}
        <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Explore More Products & Wholesale Deals
                </h3>
                <span className="rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
                  Mandi Wholesale Rates
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse our complete grocery catalog with quantity discount tiers & doorstep delivery
              </p>
            </div>

            {/* Category Filter Tabs */}
            {availableCategories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                <button
                  type="button"
                  onClick={() => setActiveCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeCategoryFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Deals
                </button>
                {availableCategories.slice(0, 6).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap capitalize ${
                      activeCategoryFilter === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Vertical Multi-Column Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4.5">
            {verticalExploreProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>

        {/* CUSTOMER REVIEWS & RATINGS SECTION */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">Verified Customer Reviews</h3>
              <p className="text-xs text-slate-500">Real feedback from verified buyers across India</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl bg-emerald-700 px-3 py-1.5 text-sm font-black text-white">
                <span>{product.rating || 4.8}</span>
                <Star className="h-4 w-4 fill-white" />
              </div>
              <span className="text-xs font-bold text-slate-700">Overall Rating ({product.reviewCount || 128})</span>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4 divide-y divide-slate-100">
            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No reviews written for this product yet.</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="pt-4 first:pt-0 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900">{r.userName}</span>
                    <span className="flex items-center gap-0.5 font-bold text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      <Check className="h-3 w-3" />
                      Verified Buyer
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <span className="font-bold text-slate-800">{r.title}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{r.comment}</p>
                  <span className="text-[10px] text-slate-400">Reviewed on {new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Added to cart toast */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-600 bg-slate-950 text-white p-4 shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5">
          <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>Added {quantity} unit(s) of {selectedVariant.name} to your Cart!</span>
        </div>
      )}
    </div>
  );
};
