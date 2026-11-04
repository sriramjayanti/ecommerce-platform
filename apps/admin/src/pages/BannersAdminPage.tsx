import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner, dataStore } from '@ecommerce/shared';
import { UniversalImageUploader } from '../components/UniversalImageUploader';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Power,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  Sliders,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Tv,
} from 'lucide-react';

const BANNER_PRESETS = [
  {
    title: 'Daily Groceries & Supermart Savings',
    subtitle: 'Direct wholesale rates on rice, atta, dals and pantry essentials',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
    link: '/category/groceries',
  },
  {
    title: 'Farm-Fresh Vegetables & Organic Greens',
    subtitle: 'Harvested daily at dawn, crisp and nutrient-rich',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&auto=format&fit=crop&q=80',
    link: '/category/vegetables',
  },
  {
    title: 'Seasonal Orchard Fruits & Berries',
    subtitle: 'Naturally ripened, fresh and juicy sweet fruits',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=1200&auto=format&fit=crop&q=80',
    link: '/category/fruits',
  },
  {
    title: 'Pure Desi Cow Ghee & Cold Pressed Oils',
    subtitle: 'Curd churned A2 Bilona ghee at bulk wholesale slabs',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1200&auto=format&fit=crop&q=80',
    link: '/category/cooking-oils-ghee',
  },
  {
    title: 'Fresh Milk, Malai Paneer & Dairy',
    subtitle: 'Pure country dairy products delivered fresh every day',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=1200&auto=format&fit=crop&q=80',
    link: '/category/dairy-eggs',
  },
  {
    title: 'Snack Fest, Namkeen & Biscuit Cartons',
    subtitle: 'Save up to 30% with bulk quantity wholesale discounts',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=1200&auto=format&fit=crop&q=80',
    link: '/category/snacks',
  },
];

export const BannersAdminPage: React.FC = () => {
  const navigate = useNavigate();
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

  // Slide Animation Configuration
  const [animationEffect, setAnimationEffect] = useState<'slide-horizontal' | 'slide-fade' | 'slide-zoom'>(() => {
    try {
      const stored = localStorage.getItem('dailyfresh_slide_animation_settings');
      return stored ? JSON.parse(stored).effect || 'slide-horizontal' : 'slide-horizontal';
    } catch {
      return 'slide-horizontal';
    }
  });

  const [autoplayInterval, setAutoplayInterval] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('dailyfresh_slide_animation_settings');
      return stored ? Number(JSON.parse(stored).interval) || 5000 : 5000;
    } catch {
      return 5000;
    }
  });

  const [autoplayEnabled, setAutoplayEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('dailyfresh_slide_animation_settings');
      return stored ? JSON.parse(stored).autoplay !== false : true;
    } catch {
      return true;
    }
  });

  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(true);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await dataStore.getBanners();
      setBanners(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();

    const unsub = dataStore.subscribe((event) => {
      if (event.type === 'banners_updated') {
        fetchBanners();
      }
    });

    return () => unsub();
  }, []);

  // Save animation settings to localStorage for storefront
  const handleSaveAnimationSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const config = {
      effect: animationEffect,
      interval: autoplayInterval,
      autoplay: autoplayEnabled,
    };
    localStorage.setItem('dailyfresh_slide_animation_settings', JSON.stringify(config));
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3000);
  };

  // Live preview slider interval
  const activeBanners = banners.filter((b) => b.isActive);
  useEffect(() => {
    if (activeBanners.length <= 1 || !isPreviewPlaying) return;
    const interval = setInterval(() => {
      setPreviewSlideIdx((prev) => (prev + 1) % activeBanners.length);
    }, autoplayInterval);
    return () => clearInterval(interval);
  }, [activeBanners.length, isPreviewPlaying, autoplayInterval]);

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
      const payload: Partial<Banner> = {
        id: editingBannerId || undefined,
        title: title.trim(),
        subtitle: subtitle.trim(),
        imageUrl: imageUrl.trim(),
        linkUrl: linkUrl.trim() || '/',
        sortOrder: Number(sortOrder) || 1,
        isActive,
      };

      await dataStore.saveBanner(payload);
      setSuccessMsg(editingBannerId ? 'Promo banner updated successfully!' : 'Promo banner created successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
      setIsModalOpen(false);
      fetchBanners();
    } catch (err: any) {
      alert(err.message || 'Error saving banner');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await dataStore.deleteBanner(id);
      setSuccessMsg('Promo banner removed successfully');
      setTimeout(() => setSuccessMsg(null), 2500);
      fetchBanners();
    } catch {}
  };

  const handleToggleActive = async (b: Banner) => {
    try {
      await dataStore.saveBanner({ id: b.id, isActive: !b.isActive });
      fetchBanners();
    } catch {}
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-700 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>← Back to Dashboard Overview</span>
        </button>
        <span className="text-xs text-slate-500 font-semibold">{banners.length} Promo Banners</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-emerald-600" />
            <span>Promotional Banners & Slide Animation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload banner slides, control storefront carousel timing, and preview real-time slide transitions.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Add Promo Banner</span>
        </button>
      </div>

      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Slide Animation Settings & Live Simulator Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-emerald-600" />
              <span>Storefront Slide Animation Controls</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize how promotional banners animate on customer homepage
            </p>
          </div>

          <form onSubmit={handleSaveAnimationSettings} className="flex flex-wrap items-center gap-3">
            {/* Effect */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">Animation Style:</span>
              <select
                value={animationEffect}
                onChange={(e) => setAnimationEffect(e.target.value as any)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value="slide-horizontal">Horizontal Track Slide</option>
                <option value="slide-fade">Smooth Cross-Fade</option>
                <option value="slide-zoom">Ken Burns Zoom & Slide</option>
              </select>
            </div>

            {/* Speed */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600">Speed:</span>
              <select
                value={autoplayInterval}
                onChange={(e) => setAutoplayInterval(Number(e.target.value))}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500"
              >
                <option value={3000}>3 Seconds (Fast)</option>
                <option value={5000}>5 Seconds (Recommended)</option>
                <option value={8000}>8 Seconds (Relaxed)</option>
                <option value={10000}>10 Seconds (Slow)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="checkbox"
                id="autoCheck"
                checked={autoplayEnabled}
                onChange={(e) => setAutoplayEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="autoCheck" className="text-xs font-bold text-slate-700 cursor-pointer">
                Autoplay
              </label>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition"
            >
              Save Settings
            </button>
          </form>
        </div>

        {settingsSavedToast && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-2.5 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Slide animation settings saved & applied to customer storefront!</span>
          </div>
        )}

        {/* Live Slide Animation Simulator */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Tv className="h-4 w-4 text-slate-500" />
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Live Storefront Slide Simulator
              </span>
              <span className="rounded bg-slate-100 text-[10px] font-mono px-2 py-0.5 text-slate-600">
                Effect: {animationEffect} • Interval: {autoplayInterval / 1000}s
              </span>
            </div>

            {activeBanners.length > 1 && (
              <button
                type="button"
                onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-emerald-700"
              >
                {isPreviewPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                <span>{isPreviewPlaying ? 'Pause Simulator' : 'Play Simulator'}</span>
              </button>
            )}
          </div>

          {activeBanners.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center border border-dashed rounded-2xl">
              No active banners to preview. Add or activate banners below.
            </p>
          ) : (
            <div className="relative rounded-2xl overflow-hidden min-h-[180px] sm:min-h-[220px] bg-slate-950 border border-slate-800 flex items-center shadow-md">
              <div
                className={`w-full h-full flex ${
                  animationEffect === 'slide-horizontal'
                    ? 'transition-transform duration-700 ease-out'
                    : 'transition-opacity duration-700'
                }`}
                style={
                  animationEffect === 'slide-horizontal'
                    ? { transform: `translateX(-${previewSlideIdx * 100}%)` }
                    : undefined
                }
              >
                {activeBanners.map((banner, idx) => {
                  const isCurrent = previewSlideIdx === idx;
                  return (
                    <div
                      key={banner.id || idx}
                      className={`w-full flex-shrink-0 relative flex items-center min-h-[180px] sm:min-h-[220px] p-6 sm:p-8 ${
                        animationEffect !== 'slide-horizontal'
                          ? isCurrent
                            ? 'opacity-100 relative z-10'
                            : 'opacity-0 absolute inset-0 pointer-events-none'
                          : ''
                      }`}
                    >
                      <img
                        src={banner.imageUrl}
                        alt=""
                        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ${
                          animationEffect === 'slide-zoom' && isCurrent
                            ? 'scale-110 opacity-55'
                            : 'scale-100 opacity-40'
                        }`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10" />

                      <div className="relative z-20 max-w-md space-y-1.5">
                        <span className="inline-block rounded bg-amber-400 px-2 py-0.5 text-[9px] font-black text-slate-950 uppercase">
                          Slide #{idx + 1}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-white">{banner.title}</h3>
                        <p className="text-xs text-slate-300 line-clamp-1">{banner.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Prev / Next Buttons */}
              {activeBanners.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewSlideIdx((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1))
                    }
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center z-30 hover:bg-amber-400 hover:text-slate-950 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewSlideIdx((prev) => (prev + 1) % activeBanners.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-slate-900/80 text-white flex items-center justify-center z-30 hover:bg-amber-400 hover:text-slate-950 transition"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Banner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((b) => (
          <div
            key={b.id}
            className={`relative overflow-hidden rounded-3xl border p-6 flex flex-col justify-between min-h-[260px] shadow-xs transition ${
              b.isActive ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'
            }`}
          >
            <img
              src={b.imageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-transparent" />
            
            {/* Top Bar: Sort order & Active Badge */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-lg bg-white/95 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 shadow-2xs">
                Sort Order #{b.sortOrder}
              </span>

              <button
                type="button"
                onClick={() => handleToggleActive(b)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition border ${
                  b.isActive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
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
              
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-emerald-700 font-mono truncate max-w-[200px]">
                  {b.linkUrl}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(b)}
                    className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 transition border border-slate-200"
                    title="Edit Banner"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(b.id)}
                    className="rounded-xl bg-slate-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-slate-200"
                    title="Delete Banner"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Banner Modal with Universal Image Uploader */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingBannerId ? 'Edit Promo Banner' : 'Add New Promo Banner'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
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
                  placeholder="e.g. Mega Grains Wholesale Slabs"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subtitle / Deal Hook</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Save flat 20% on orders above 10 units"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Universal Image Uploader (Direct PC upload, URL, or Presets) */}
              <div>
                <UniversalImageUploader
                  value={imageUrl}
                  onChange={setImageUrl}
                  folder="dailyfresh/banners"
                  label="Promo Banner Slide Image (Upload from PC or Presets)"
                  presets={BANNER_PRESETS.map((p) => ({ name: p.title.split(' ')[0], url: p.image }))}
                  helperText="Upload a high-res banner image from your device or pick a preset deal."
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
                  <label className="block font-bold text-slate-700 mb-1">Slide Order (1 to 4)</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-slate-900 outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value={1}>Slide 1 (First)</option>
                    <option value={2}>Slide 2 (Second)</option>
                    <option value={3}>Slide 3 (Third)</option>
                    <option value={4}>Slide 4 (Fourth)</option>
                    <option value={5}>Slide 5</option>
                    <option value={6}>Slide 6</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="activeCheck" className="text-slate-700 font-bold cursor-pointer">
                  Display active on customer homepage carousel
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition"
                >
                  {editingBannerId ? 'Update Banner' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
