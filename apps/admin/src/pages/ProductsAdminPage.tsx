import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, ProductVariant, PriceTier, Category, validatePriceTiers, dataStore } from '@ecommerce/shared';
import { CloudinaryImageUploader } from '../components/CloudinaryImageUploader';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Zap,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Sparkles,
  Search,
  Filter,
  Image as ImageIcon,
  ArrowLeft,
} from 'lucide-react';

const PRESET_IMAGES = [
  { name: 'Basmati Rice', url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' },
  { name: 'Chakki Atta', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80' },
  { name: 'Toor Dal', url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600&auto=format&fit=crop&q=80' },
  { name: 'Desi Cow Ghee', url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80' },
  { name: 'Mustard Oil', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80' },
  { name: 'Aloo Bhujia & Snacks', url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80' },
  { name: 'Assam Tea', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80' },
  { name: 'California Almonds', url: 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=600&auto=format&fit=crop&q=80' },
  { name: 'Kaju Cashews', url: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80' },
  { name: 'Garam Masala', url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80' },
  { name: 'Organic Honey', url: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80' },
  { name: 'Fresh Paneer', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
  { name: 'Kaju Katli Sweets', url: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=600&auto=format&fit=crop&q=80' },
];

export const ProductsAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterWholesale, setFilterWholesale] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Product Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isWholesaleEnabled, setIsWholesaleEnabled] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);

  // Variants in form
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchCatalog = async () => {
    setLoading(true);
    const [pList, cList] = await Promise.all([
      dataStore.getProducts(),
      dataStore.getCategories(),
    ]);
    setProducts(pList);
    setCategories(cList);
    if (cList[0] && !categoryId) setCategoryId(cList[0].id);
    setLoading(false);
  };

  useEffect(() => {
    fetchCatalog();

    const unsub = dataStore.subscribe((event) => {
      if (event.type === 'products_updated' || event.type === 'inventory_updated') {
        fetchCatalog();
      }
    });

    return () => unsub();
  }, []);

  const openCreateModal = () => {
    setEditingProductId(null);
    setTitle('');
    setDescription('');
    setBrand('');
    setCategoryId(categories[0]?.id || 'cat-staples');
    setSubcategoryId('');
    setImageUrl(PRESET_IMAGES[0].url);
    setIsWholesaleEnabled(true);
    setIsFeatured(false);
    setIsBestSeller(false);
    setVariants([
      {
        id: `var-${Date.now()}`,
        name: '1 kg Pack',
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        weightOrSize: '1 kg',
        mrp: 150,
        basePrice: 120,
        stock: 100,
        lowStockThreshold: 15,
        pricingTiers: [
          { id: 't1', minQty: 1, maxQty: 4, unitPrice: 120, label: 'Retail (1–4 units)' },
          { id: 't2', minQty: 5, maxQty: 9, unitPrice: 112, label: 'Bulk Pack (5–9 units)' },
          { id: 't3', minQty: 10, maxQty: null, unitPrice: 105, label: 'Wholesale Slab (10+ units)' },
        ],
        isDefault: true,
      },
    ]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setTitle(product.title);
    setDescription(product.description || '');
    setBrand(product.brand || '');
    setCategoryId(product.categoryId);
    setSubcategoryId(product.subcategoryId || '');
    setImageUrl(product.images[0] || PRESET_IMAGES[0].url);
    setIsWholesaleEnabled(product.isWholesaleEnabled);
    setIsFeatured(!!product.isFeatured);
    setIsBestSeller(!!product.isBestSeller);
    setVariants(JSON.parse(JSON.stringify(product.variants)));
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        id: `var-${Date.now()}`,
        name: '500g Pack',
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        weightOrSize: '500g',
        mrp: 90,
        basePrice: 75,
        stock: 50,
        lowStockThreshold: 10,
        pricingTiers: [
          { id: `t1-${Date.now()}`, minQty: 1, maxQty: 4, unitPrice: 75, label: 'Retail (1–4)' },
          { id: `t2-${Date.now()}`, minQty: 5, maxQty: null, unitPrice: 68, label: 'Wholesale (5+)' },
        ],
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      alert('A product must have at least one variant.');
      return;
    }
    const updated = [...variants];
    updated.splice(index, 1);
    setVariants(updated);
  };

  const handleAddTier = (variantIndex: number) => {
    const updated = [...variants];
    const v = updated[variantIndex];
    const tiers = v.pricingTiers || [];
    const lastTier = tiers[tiers.length - 1];
    const nextMin = lastTier ? (lastTier.maxQty ? lastTier.maxQty + 1 : lastTier.minQty + 5) : 1;
    const nextPrice = lastTier ? Math.max(1, lastTier.unitPrice - 5) : Math.max(1, v.basePrice - 10);

    if (lastTier && lastTier.maxQty === null) {
      lastTier.maxQty = nextMin - 1;
    }

    tiers.push({
      id: `tier-${Date.now()}`,
      minQty: nextMin,
      maxQty: null,
      unitPrice: nextPrice,
      label: `Wholesale Slab (${nextMin}+)`,
    });
    v.pricingTiers = tiers;
    setVariants(updated);
  };

  const handleRemoveTier = (variantIndex: number, tierIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].pricingTiers.splice(tierIndex, 1);
    setVariants(updated);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate tier pricing on all variants if wholesale enabled
    if (isWholesaleEnabled) {
      for (const v of variants) {
        if (v.pricingTiers && v.pricingTiers.length > 0) {
          const val = validatePriceTiers(v.pricingTiers);
          if (!val.isValid) {
            setFormError(`Pricing tier slab error on variant "${v.name}": ${val.error}`);
            return;
          }
        }
      }
    }

    const payload = {
      title,
      description,
      brand,
      categoryId,
      subcategoryId,
      images: imageUrl ? [imageUrl] : [PRESET_IMAGES[0].url],
      variants,
      isWholesaleEnabled,
      isFeatured,
      isBestSeller,
    };

    try {
      const result = await dataStore.saveProduct({
        id: editingProductId || undefined,
        ...payload,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save product');
      }

      setSuccessMsg(editingProductId ? 'Product updated successfully!' : 'New product created successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setIsModalOpen(false);
      fetchCatalog();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to archive this product?')) return;
    try {
      await dataStore.deleteProduct(id);
      setSuccessMsg('Product archived successfully');
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchCatalog();
    } catch {}
  };

  const filteredProducts = products.filter((p) => {
    if (filterCategory !== 'all' && p.categoryId !== filterCategory) return false;
    if (filterWholesale && !p.isWholesaleEnabled) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesTitle = p.title.toLowerCase().includes(q);
      const matchesBrand = p.brand?.toLowerCase().includes(q);
      const matchesSku = p.variants.some((v) => v.sku?.toLowerCase().includes(q));
      if (!matchesTitle && !matchesBrand && !matchesSku) return false;
    }
    return true;
  });

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 border border-slate-200 transition"
        >
          <ArrowLeft className="h-4 w-4 text-emerald-600" />
          <span>← Back to Dashboard</span>
        </button>
        <span className="text-xs text-slate-500 font-semibold">{products.length} Products Active</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product & Wholesale Pricing Manager</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure {products.length} grocery items, stock counts, and tiered wholesale pricing slabs.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Success and Error alerts */}
      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by title, brand, or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition"
          />
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilterWholesale(!filterWholesale)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition border ${
              filterWholesale
                ? 'border-amber-400 bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Zap className={`h-3.5 w-3.5 ${filterWholesale ? 'fill-slate-950' : 'text-amber-500'}`} />
            <span>Wholesale Only</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="pb-3">Product</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Variants</th>
                <th className="pb-3">Base Price</th>
                <th className="pb-3">Stock Level</th>
                <th className="pb-3">Wholesale Tiers</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No products matching filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const defaultVar = p.variants[0];
                  const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
                  const isLow = totalStock <= (defaultVar?.lowStockThreshold || 10);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 flex items-center gap-3">
                        <img
                          src={p.images[0] || PRESET_IMAGES[0].url}
                          alt=""
                          className="h-10 w-10 rounded-xl object-cover bg-slate-100 border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 text-xs line-clamp-1">{p.title}</span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {p.brand || 'No brand'} • {p.variants.length} variant(s)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-600 font-medium">
                        {categories.find((c) => c.id === p.categoryId)?.name || p.categoryId}
                      </td>
                      <td className="py-3.5 text-slate-600 font-medium">
                        {p.variants.map((v) => v.name).join(', ')}
                      </td>
                      <td className="py-3.5 font-black text-slate-900">₹{defaultVar?.basePrice}</td>
                      <td className="py-3.5">
                        <span
                          className={`font-black ${
                            totalStock === 0
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {totalStock} units
                        </span>
                      </td>
                      <td className="py-3.5">
                        {p.isWholesaleEnabled ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            <Zap className="h-3 w-3 fill-amber-500" />
                            {defaultVar?.pricingTiers?.length || 0} Slabs Active
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Retail Only</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition border border-slate-200"
                          title="Edit product"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200"
                          title="Archive product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProductId ? 'Edit Product & Wholesale Slabs' : 'Add New Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {formError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-6 text-xs">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Royal Feast Aged Basmati Rice"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Shudh Foods, Royal Feast"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500 font-bold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCategoryObj?.subcategories && selectedCategoryObj.subcategories.length > 0 && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subcategory</label>
                    <select
                      value={subcategoryId}
                      onChange={(e) => setSubcategoryId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500"
                    >
                      <option value="">None (Primary Category)</option>
                      {selectedCategoryObj.subcategories.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <CloudinaryImageUploader
                    value={imageUrl}
                    onChange={setImageUrl}
                    folder="dailyfresh/products"
                    label="Product Image (Upload or Presets)"
                    presets={PRESET_IMAGES.slice(0, 8)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Product Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed description, culinary usage and pack details..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Wholesale Toggle */}
              <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                <input
                  type="checkbox"
                  id="wholesaleCheck"
                  checked={isWholesaleEnabled}
                  onChange={(e) => setIsWholesaleEnabled(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="wholesaleCheck" className="cursor-pointer">
                  <span className="font-bold text-amber-900">Enable Wholesale Tier Pricing Engine</span>
                  <span className="block text-[11px] text-slate-600">
                    Allows customers to unlock discounted per-unit prices when purchasing above quantity breakpoints.
                  </span>
                </label>
              </div>

              {/* Variants and Wholesale Tiers Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Product Variants ({variants.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Variant</span>
                  </button>
                </div>

                {variants.map((v, vIdx) => (
                  <div
                    key={v.id || vIdx}
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-bold text-emerald-800 text-xs">
                        Variant #{vIdx + 1}: {v.name || 'Untitled'}
                      </span>
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(vIdx)}
                          className="text-slate-500 hover:text-rose-600 text-[10px] font-bold flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove Variant</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-600 font-bold mb-1">Variant Name</label>
                        <input
                          type="text"
                          required
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[vIdx].name = e.target.value;
                            setVariants(updated);
                          }}
                          placeholder="e.g. 1 kg Pouch"
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 font-bold mb-1">SKU</label>
                        <input
                          type="text"
                          value={v.sku}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[vIdx].sku = e.target.value;
                            setVariants(updated);
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 font-bold mb-1">MRP (₹)</label>
                        <input
                          type="number"
                          value={v.mrp}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[vIdx].mrp = Number(e.target.value);
                            setVariants(updated);
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 font-bold mb-1">Base Price (₹)</label>
                        <input
                          type="number"
                          value={v.basePrice}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[vIdx].basePrice = Number(e.target.value);
                            setVariants(updated);
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-emerald-700 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-600 font-bold mb-1">Stock Count</label>
                        <input
                          type="number"
                          value={v.stock}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[vIdx].stock = Number(e.target.value);
                            setVariants(updated);
                          }}
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 font-bold"
                        />
                      </div>
                    </div>

                    {/* Wholesale Tiers */}
                    {isWholesaleEnabled && (
                      <div className="border-t border-slate-200 pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                            <Zap className="h-3 w-3 fill-amber-500" />
                            Wholesale Tier Slabs ({v.pricingTiers?.length || 0})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAddTier(vIdx)}
                            className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Tier Slab</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {(v.pricingTiers || []).map((t, tIdx) => (
                            <div key={t.id || tIdx} className="flex items-center gap-2">
                              <input
                                type="number"
                                placeholder="Min"
                                value={t.minQty}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[vIdx].pricingTiers[tIdx].minQty = Number(e.target.value);
                                  setVariants(updated);
                                }}
                                className="w-16 rounded-lg border border-slate-300 bg-white p-1.5 text-slate-900 text-center font-bold"
                              />
                              <span className="text-slate-500">to</span>
                              <input
                                type="number"
                                placeholder="Max"
                                value={t.maxQty ?? ''}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  const val = e.target.value === '' ? null : Number(e.target.value);
                                  updated[vIdx].pricingTiers[tIdx].maxQty = val;
                                  setVariants(updated);
                                }}
                                className="w-20 rounded-lg border border-slate-300 bg-white p-1.5 text-slate-900 text-center"
                              />
                              <span className="text-slate-500">→ ₹</span>
                              <input
                                type="number"
                                placeholder="Price"
                                value={t.unitPrice}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[vIdx].pricingTiers[tIdx].unitPrice = Number(e.target.value);
                                  setVariants(updated);
                                }}
                                className="w-20 rounded-lg border border-slate-300 bg-white p-1.5 text-emerald-700 font-bold"
                              />
                              <input
                                type="text"
                                placeholder="Label (e.g. Wholesale 10+)"
                                value={t.label || ''}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[vIdx].pricingTiers[tIdx].label = e.target.value;
                                  setVariants(updated);
                                }}
                                className="flex-1 rounded-lg border border-slate-300 bg-white p-1.5 text-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveTier(vIdx, tIdx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 font-bold text-slate-700 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                >
                  Save Product & Slabs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
