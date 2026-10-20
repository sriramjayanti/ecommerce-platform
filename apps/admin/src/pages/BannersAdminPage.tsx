import React, { useState, useEffect } from 'react';
import { Banner, safeApiFetch } from '@ecommerce/shared';
import { BackButton } from '../components/BackButton';
import { CloudinaryImageUploader } from '../components/CloudinaryImageUploader';
import { Plus, Trash2, Edit2, X, Power } from 'lucide-react';

const BANNER_PRESETS = [
  {
    title: 'Daily Staples & Wholesale Grains',
    subtitle: 'Save up to 25% on 10+ and 25+ bulk packs',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
    link: '/category/atta-rice-dals',
  },
  {
    title: 'Snack Fest & Munchies Carton Deals',
    subtitle: 'Direct wholesale rates on Namkeen & Biscuits',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=1200&auto=format&fit=crop&q=80',
    link: '/category/snacks-namkeen-biscuits',
  },
  {
    title: 'Pure Desi Cow Ghee & Cold Pressed Oils',
    subtitle: 'Curd churned A2 Bilona ghee at bulk rates',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1200&auto=format&fit=crop&q=80',
    link: '/category/cooking-oils-ghee',
  },
  {
    title: 'California Almonds & Goan Cashews',
    subtitle: 'Jumbo grade hand-sorted dry fruits',
    image: 'https://images.unsplash.com/photo-1596591606975-97ee5cef3a1e?w=1200&auto=format&fit=crop&q=80',
    link: '/category/dry-fruits-nuts-seeds',
  },
];

export const BannersAdminPage: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);

  const fetchBanners = () => {
    setLoading(true);
    safeApiFetch<Banner[]>('/api/admin/banners')
      .then((d) => {
        if (d.success && d.data) setBanners(d.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreateModal = () => {
    setEditingBannerId(null);
    setTitle('');
    setSubtitle('');
    setImageUrl(BANNER_PRESETS[0].image);
    setLinkUrl(BANNER_PRESETS[0].link);
    setSortOrder(banners.length + 1);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (b: Banner) => {
    setEditingBannerId(b.id);
    setTitle(b.title);
    setSubtitle(b.subtitle || '');
    setImageUrl(b.imageUrl);
    setLinkUrl(b.linkUrl || '/');
    setSortOrder(b.sortOrder || 1);
    setIsActive(b.isActive);
    setIsModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    try {
      const payload = {
        title,
        subtitle,
        imageUrl,
        linkUrl: linkUrl || '/',
        sortOrder: Number(sortOrder) || 1,
        isActive,
      };

      const url = editingBannerId ? `/api/banners/${editingBannerId}` : '/api/banners';
      const method = editingBannerId ? 'PUT' : 'POST';

      const res = await safeApiFetch<{ success: boolean }>(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setIsModalOpen(false);
        fetchBanners();
      }
    } catch {}
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await safeApiFetch<{ success: boolean }>(`/api/banners/${id}`, { method: 'DELETE' });
      if (res.success) {
        fetchBanners();
      }
    } catch {}
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      const res = await safeApiFetch<{ success: boolean }>(`/api/banners/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !b.isActive }),
      });
      if (res.success) {
        fetchBanners();
      }
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <BackButton fallback="/" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Promotional Hero Banners</h1>
          <p className="text-xs text-slate-500">
            Manage storefront carousel promotions, festival banners, and deals.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Promo Banner</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((b) => (
          <div
            key={b.id}
            className={`relative overflow-hidden rounded-3xl border p-6 flex flex-col justify-between min-h-[240px] transition shadow-xs ${
              b.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-70'
            }`}
          >
            <img
              src={b.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
            
            {/* Top Bar: Sort order & Active Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-lg bg-white/90 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-xs">
                Order #{b.sortOrder}
              </span>

              <button
                onClick={() => handleToggleActive(b)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition ${
                  b.isActive
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Power className="h-3 w-3" />
                <span>{b.isActive ? 'Active' : 'Inactive'}</span>
              </button>
            </div>

            {/* Content & Actions */}
            <div className="relative z-10 space-y-2 mt-8">
              <h3 className="text-lg font-black text-slate-900 leading-snug">{b.title}</h3>
              <p className="text-xs text-slate-600 line-clamp-2">{b.subtitle}</p>
              
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700 font-mono truncate max-w-[200px]">
                  {b.linkUrl}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(b)}
                    className="rounded-lg bg-white/90 border border-slate-200 p-2 text-slate-600 hover:text-slate-900 shadow-xs"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBanner(b.id)}
                    className="rounded-lg bg-white/90 border border-slate-200 p-2 text-slate-400 hover:text-rose-600 shadow-xs"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingBannerId ? 'Edit Promo Banner' : 'Add New Promo Banner'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Snack Fest & Wholesale Deals"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle / Deal Summary</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Save up to 25% on 10+ packs"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div>
                <CloudinaryImageUploader
                  value={imageUrl}
                  onChange={setImageUrl}
                  folder="dailyfresh/banners"
                  label="Promo Banner Image (Cloudinary Drag & Drop or Presets)"
                  presets={BANNER_PRESETS.map((p) => ({ name: p.title.split(' ')[0], url: p.image }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Link Target URL</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="/category/snacks-namkeen-biscuits"
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Display Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600"
                />
                <label htmlFor="activeCheck" className="text-slate-700 font-bold cursor-pointer">
                  Display active on customer homepage carousel
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl bg-slate-100 border border-slate-200 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  Save Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
