import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, dataStore } from '@ecommerce/shared';
import { Layers, Plus, Trash2, Edit2, X, AlertTriangle, Image as ImageIcon, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { UniversalImageUploader } from '../components/UniversalImageUploader';

const CATEGORY_PRESETS = [
  { name: 'Atta & Dals', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80' },
  { name: 'Oils & Ghee', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80' },
  { name: 'Snacks & Biscuits', image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80' },
  { name: 'Spices & Masalas', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80' },
  { name: 'Tea & Coffee', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80' },
  { name: 'Dry Fruits & Nuts', image: 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=600&auto=format&fit=crop&q=80' },
  { name: 'Dairy & Paneer', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80' },
  { name: 'Household & Cleaning', image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80' },
];

export const CategoriesAdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [subcategories, setSubcategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    const data = await dataStore.getCategories();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();

    const unsub = dataStore.subscribe((event) => {
      if (event.type === 'categories_updated') {
        fetchCategories();
      }
    });

    return () => unsub();
  }, []);

  const openCreateModal = () => {
    setEditingCategoryId(null);
    setName('');
    setSlug('');
    setImageUrl(CATEGORY_PRESETS[0].image);
    setSortOrder(categories.length + 1);
    setSubcategories([]);
    setNewSubName('');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setName(cat.name);
    setSlug(cat.slug);
    setImageUrl(cat.image || '');
    setSortOrder(cat.sortOrder || 1);
    setSubcategories(cat.subcategories ? JSON.parse(JSON.stringify(cat.subcategories)) : []);
    setNewSubName('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleAddSubcategory = () => {
    if (!newSubName.trim()) return;
    const subSlug = newSubName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setSubcategories([
      ...subcategories,
      { id: `sub-${Date.now()}`, name: newSubName.trim(), slug: subSlug },
    ]);
    setNewSubName('');
  };

  const handleRemoveSubcategory = (index: number) => {
    const updated = [...subcategories];
    updated.splice(index, 1);
    setSubcategories(updated);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);

    const generatedSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const payload = {
      name,
      slug: generatedSlug,
      image: imageUrl,
      sortOrder: Number(sortOrder) || 1,
      isVisible: true,
      subcategories,
    };

    try {
      const result = await dataStore.saveCategory({
        id: editingCategoryId || undefined,
        ...payload,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save category');
      }

      setSuccessMsg(editingCategoryId ? 'Category updated successfully!' : 'New category created successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Error saving category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    setError(null);
    try {
      const res = await dataStore.deleteCategory(id);
      if (!res.success) {
        setError(res.error || 'Failed to delete category');
      } else {
        setSuccessMsg('Category removed successfully');
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchCategories();
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting category');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Simple Back Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 border border-slate-200 transition"
        >
          <ArrowLeft className="h-4 w-4 text-emerald-600" />
          <span>← Back to Dashboard</span>
        </button>
        <span className="text-xs text-slate-500 font-semibold">{categories.length} Categories Live</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Categories Management</h1>
          <p className="text-xs text-slate-500">
            Configure {categories.length} storefront departments, subcategories & catalog taxonomy.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-95 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="h-32 w-full rounded-2xl overflow-hidden bg-slate-100 mb-3 border border-slate-100">
                <img
                  src={cat.image || CATEGORY_PRESETS[0].image}
                  alt={cat.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">{cat.name}</h3>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">Order #{cat.sortOrder}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">slug: {cat.slug}</p>
              
              <div className="mt-3 flex flex-wrap gap-1">
                {cat.subcategories && cat.subcategories.length > 0 ? (
                  cat.subcategories.map((sub) => (
                    <span
                      key={sub.id}
                      className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] text-slate-700 font-medium"
                    >
                      {sub.name}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 italic">No subcategories</span>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => openEditModal(cat)}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                <Edit2 className="h-3 w-3" />
                <span>Edit Taxonomy</span>
              </button>
              <button
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-slate-400 hover:text-rose-600 p-1"
                title="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCategoryId ? 'Edit Category & Subcategories' : 'Add New Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spices & Masalas"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Slug (optional)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. spices-masalas"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <UniversalImageUploader
                  value={imageUrl}
                  onChange={setImageUrl}
                  folder="dailyfresh/categories"
                  label="Category Image (Upload from Device or URL)"
                  presets={CATEGORY_PRESETS.map((p) => ({ name: p.name, url: p.image }))}
                  helperText="Upload an image from your PC or pick from presets. Used in customer header and browse pills."
                />
              </div>

              {/* Subcategories Management */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <label className="block font-bold text-slate-900 text-xs">
                  Subcategories ({subcategories.length})
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="Subcategory name (e.g. Powder Spices)"
                    className="flex-1 rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {subcategories.map((sub, idx) => (
                    <div
                      key={sub.id || idx}
                      className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-200"
                    >
                      <span className="text-slate-800 font-medium">{sub.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSubcategory(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
