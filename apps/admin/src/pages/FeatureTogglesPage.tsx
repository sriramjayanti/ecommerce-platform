import React, { useState, useEffect } from 'react';
import { StoreSettings, FeatureFlags, DEFAULT_STORE_SETTINGS } from '@ecommerce/shared';
import { Sliders, Save, CheckCircle2, ShieldAlert } from 'lucide-react';

export const FeatureTogglesPage: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setSettings(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: keyof FeatureFlags) => {
    setSettings((prev) => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        [key]: !prev.featureFlags[key],
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch {}
  };

  const toggleItems: { key: keyof FeatureFlags; label: string; desc: string }[] = [
    {
      key: 'wholesalePricing',
      label: 'Wholesale Tier Pricing Engine',
      desc: 'Enables automatic quantity breakpoint discounts (e.g. 5+, 10+, 25+ slabs).',
    },
    {
      key: 'onlinePayment',
      label: 'PhonePe Online Payments',
      desc: 'Enables UPI, cards, and digital gateway checkout on storefront and app.',
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp Support & Product Enquiries',
      desc: 'Displays direct WhatsApp pre-filled chat links on product pages & orders.',
    },
    {
      key: 'reviews',
      label: 'Customer Reviews Module',
      desc: 'Allows verified buyers to post star ratings & product reviews.',
    },
    {
      key: 'ratings',
      label: 'Storefront Rating Stars',
      desc: 'Shows rating numbers and stars on product cards.',
    },
    {
      key: 'wishlist',
      label: 'Customer Wishlist',
      desc: 'Enables favorite product bookmarks for logged-in and guest users.',
    },
    {
      key: 'coupons',
      label: 'Promotional Coupons & Vouchers',
      desc: 'Architecture ready for coupon discount codes at checkout.',
    },
    {
      key: 'invoices',
      label: 'Printable GST & Order Invoices',
      desc: 'Allows customers and staff to generate formatted receipts.',
    },
    {
      key: 'maintenanceMode',
      label: 'Storefront Maintenance Mode',
      desc: 'Pauses checkout and shows maintenance notice during inventory audits.',
    },
  ];

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Central Feature Flags & Store Settings</h1>
          <p className="text-xs text-slate-400">
            Control all business features dynamically without redeploying code.
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-950 border border-emerald-800 px-4 py-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Dynamic Feature Flags Grid */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Feature Flag Toggles (Admin Controlled)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {toggleItems.map((item) => {
              const isChecked = settings.featureFlags[item.key];

              return (
                <div
                  key={item.key}
                  className={`flex items-start justify-between rounded-2xl border p-4 transition ${
                    isChecked
                      ? 'border-emerald-800 bg-emerald-950/20'
                      : 'border-slate-800 bg-slate-900/40 opacity-70'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <span className="font-bold text-white text-xs block">{item.label}</span>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isChecked ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isChecked ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Store Business & Delivery Rules */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Store & Delivery Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-300 mb-1">Store Display Name</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">WhatsApp Helpline Number</label>
              <input
                type="text"
                value={settings.whatsappNumber}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Standard Delivery Fee (₹)</label>
              <input
                type="number"
                value={settings.deliveryCharge}
                onChange={(e) => setSettings({ ...settings, deliveryCharge: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">Free Delivery Min. Order (₹)</label>
              <input
                type="number"
                value={settings.freeDeliveryThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-300 mb-1">Storefront Header Notice</label>
              <input
                type="text"
                value={settings.deliveryAreaNotice}
                onChange={(e) => setSettings({ ...settings, deliveryAreaNotice: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
          >
            <Save className="h-4 w-4" />
            <span>Save & Apply Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
