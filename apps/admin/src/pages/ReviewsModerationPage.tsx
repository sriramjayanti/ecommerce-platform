import React, { useState, useEffect } from 'react';
import { Review, safeApiFetch } from '@ecommerce/shared';
import { BackButton } from '../components/BackButton';
import { Check, X, Star, Trash2, Filter } from 'lucide-react';

export const ReviewsModerationPage: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    setLoading(true);
    safeApiFetch<Review[]>('/api/reviews')
      .then((d) => {
        if (d.success && d.data) setReviews(d.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await safeApiFetch<{ success: boolean }>(`/api/reviews/${id}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.success) {
        fetchReviews();
      }
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await safeApiFetch<{ success: boolean }>(`/api/reviews/${id}`, { method: 'DELETE' });
      if (res.success) {
        fetchReviews();
      }
    } catch {}
  };

  const filtered = reviews.filter((r) => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <BackButton fallback="/" label="Back to Dashboard" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Customer Reviews Moderation</h1>
          <p className="text-xs text-slate-500">
            Review customer ratings & feedback across products, and approve/hide ratings displayed on storefront.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
          >
            <option value="all">All Reviews ({reviews.length})</option>
            <option value="pending">Pending ({reviews.filter((r) => r.status === 'pending').length})</option>
            <option value="approved">Approved ({reviews.filter((r) => r.status === 'approved').length})</option>
            <option value="rejected">Rejected ({reviews.filter((r) => r.status === 'rejected').length})</option>
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs overflow-hidden">
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-xs text-slate-400 py-8">Loading reviews...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No customer reviews matching filter.</p>
          ) : (
            filtered.map((rev) => (
              <div
                key={rev.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="space-y-1.5 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{rev.userName}</span>
                    <div className="flex text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3.5 w-3.5 ${s <= rev.rating ? 'fill-amber-400' : 'text-slate-300'}`}
                        />
                      ))}
                    </div>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                        rev.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rev.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs">{rev.title}</h4>
                  <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Product ID: {rev.productId} • {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
                  {rev.status !== 'approved' && (
                    <button
                      onClick={() => handleModerate(rev.id, 'approved')}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs transition"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </button>
                  )}
                  {rev.status !== 'rejected' && (
                    <button
                      onClick={() => handleModerate(rev.id, 'rejected')}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="rounded-xl bg-white border border-slate-200 p-2 text-slate-400 hover:text-rose-600 transition"
                    title="Delete review"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
