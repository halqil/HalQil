'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { timeAgo } from '@/lib/timeAgo';
import Avatar from '@/components/Avatar';
import { SkeletonRow } from '@/components/admin/shared/SkeletonRow';
import { EmptyState } from '@/components/admin/shared/EmptyState';
import { PageHeader } from '@/components/admin/shared/PageHeader';
import { Pagination } from '@/components/admin/shared/Pagination';
import type { DisputedOrder } from '@/components/admin/types';
import { AlertTriangle, Search, X, Loader2, Eye, Gavel } from 'lucide-react';

const LIMIT = 20;

// ─── Helpers ─────────────────────────────────────────────────────
function extractData(res: { data: Record<string, unknown> }) {
  const d = res.data;
  const inner = (d.data && typeof d.data === 'object' ? d.data : d) as Record<string, unknown>;
  const items = (Array.isArray(inner.data) ? inner.data : Array.isArray(inner) ? inner : []) as DisputedOrder[];
  const total = typeof inner.total === 'number' ? inner.total : 0;
  const totalPages = typeof inner.totalPages === 'number' ? inner.totalPages : 1;
  return { items, total, totalPages };
}

function getId(item: DisputedOrder): string {
  return ((item as unknown as Record<string, unknown>)._id as string) || item.id || '';
}

export default function AdminDisputesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get('status') || 'DISPUTED';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [disputes, setDisputes] = useState<DisputedOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Resolve modal
  const [resolveTarget, setResolveTarget] = useState<DisputedOrder | null>(null);
  const [resolveDecision, setResolveDecision] = useState<'PROVIDER_FAULT' | 'USER_FAULT' | ''>('');
  const [resolveNote, setResolveNote] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  // Detail modal
  const [detailTarget, setDetailTarget] = useState<DisputedOrder | null>(null);

  // URL helper
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      router.replace(`/admin/disputes?${params.toString()}`);
    },
    [searchParams, router]
  );

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch
  useEffect(() => {
    const fetchDisputes = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/orders/disputed', {
          params: {
            status: statusParam === 'ALL' ? undefined : statusParam,
            page: pageParam,
            limit: LIMIT,
          },
        });
        const { items, total: t, totalPages: tp } = extractData(res);
        const filtered = search
          ? items.filter((d) => getId(d).toLowerCase().includes(search.toLowerCase()))
          : items;
        setDisputes(filtered);
        setTotal(t);
        setTotalPages(tp);
      } catch {
        toast.error('Shikoyatlarni yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    };
    fetchDisputes();
  }, [statusParam, pageParam, search]);

  // Resolve
  const handleResolve = async () => {
    if (!resolveTarget || !resolveDecision) {
      toast.error('Qaror tanlang');
      return;
    }
    if (!resolveNote.trim()) {
      toast.error('Izoh kiriting');
      return;
    }
    setResolveLoading(true);
    try {
      const id = getId(resolveTarget);
      await api.patch(`/admin/orders/${id}/resolve`, {
        decision: resolveDecision,
        note: resolveNote.trim(),
      });
      setDisputes((prev) =>
        prev.map((d) =>
          getId(d) === id
            ? { ...d, status: 'RESOLVED', resolvedDecision: resolveDecision, resolvedNote: resolveNote }
            : d
        )
      );
      toast.success('Shikoyat hal etildi');
      setResolveTarget(null);
      setResolveDecision('');
      setResolveNote('');
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setResolveLoading(false);
    }
  };

  const statusTabs = [
    { value: 'DISPUTED', label: 'Hal etilmagan' },
    { value: 'RESOLVED', label: 'Hal etilgan' },
    { value: 'ALL', label: 'Barchasi' },
  ];

  return (
    <div className="fade-in">
      <PageHeader title="Shikoyatlar" description="Bahsli buyurtmalarni boshqarish" />

      {/* ─── Status Tabs ─── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateParams({ status: tab.value, page: '1' })}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              statusParam === tab.value ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Search ─── */}
      <div className="search-wrapper max-w-sm mb-6">
        <input
          className="glass-input"
          placeholder="Qidirish..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <span className="search-icon">
          <Search size={15} />
        </span>
      </div>

      {/* ─── Content ─── */}
      {loading ? (
        <SkeletonRow cols={7} rows={5} />
      ) : disputes.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="Shikoyatlar topilmadi" />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto glass-card rounded-2xl">
            <table className="w-full">
              <thead>
                <tr>
                  {['Buyurtma', 'Mijoz', 'Provayder', 'Shikoyat sababi', 'Sana', 'Holat', 'Amallar'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {disputes.map((d) => (
                  <tr
                    key={getId(d)}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>#{getId(d).slice(-8)}</p>
                      {d.skillName && <p className="text-xs" style={{ color: 'var(--muted)' }}>{d.skillName}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={d.user?.name || ''} avatar={d.user?.avatar} size="xs" />
                        <div>
                          <p className="text-sm" style={{ color: 'var(--text)' }}>{d.user?.name}</p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{d.user?.walletId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={d.provider?.name || ''} avatar={d.provider?.avatar} size="xs" />
                        <div>
                          <p className="text-sm" style={{ color: 'var(--text)' }}>{d.provider?.name}</p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{d.provider?.walletId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>
                        {d.disputeReason?.length > 60 ? `${d.disputeReason.slice(0, 60)}...` : d.disputeReason}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: 'var(--muted)' }}>
                      {timeAgo(d.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                        style={{
                          backgroundColor: d.status === 'DISPUTED' ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)',
                          color: d.status === 'DISPUTED' ? '#f97316' : '#10b981',
                        }}
                      >
                        {d.status === 'DISPUTED' ? 'Hal etilmagan' : 'Hal etilgan'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.status === 'DISPUTED' ? (
                        <button onClick={() => { setResolveTarget(d); setResolveDecision(''); setResolveNote(''); }} className="btn-ghost p-2 rounded-lg" title="Hal qilish">
                          <Gavel size={16} />
                        </button>
                      ) : (
                        <button onClick={() => setDetailTarget(d)} className="btn-ghost p-2 rounded-lg" title="Batafsil">
                          <Eye size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {disputes.map((d) => (
              <div key={getId(d)} className="glass-card p-4 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-mono font-medium" style={{ color: 'var(--text)' }}>#{getId(d).slice(-8)}</p>
                    {d.skillName && <p className="text-xs" style={{ color: 'var(--muted)' }}>{d.skillName}</p>}
                  </div>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                    style={{
                      backgroundColor: d.status === 'DISPUTED' ? 'rgba(249,115,22,0.1)' : 'rgba(16,185,129,0.1)',
                      color: d.status === 'DISPUTED' ? '#f97316' : '#10b981',
                    }}
                  >
                    {d.status === 'DISPUTED' ? 'Hal etilmagan' : 'Hal etilgan'}
                  </span>
                </div>
                <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{d.disputeReason}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{timeAgo(d.createdAt)}</p>
                  {d.status === 'DISPUTED' ? (
                    <button onClick={() => { setResolveTarget(d); setResolveDecision(''); setResolveNote(''); }} className="btn-ghost p-2 rounded-lg">
                      <Gavel size={14} />
                    </button>
                  ) : (
                    <button onClick={() => setDetailTarget(d)} className="btn-ghost p-2 rounded-lg">
                      <Eye size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination page={pageParam} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={(p) => updateParams({ page: p.toString() })} />
        </>
      )}

      {/* ─── Resolve Modal ─── */}
      {resolveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !resolveLoading && setResolveTarget(null)} />
          <div className="glass-modal fade-in relative w-full max-w-lg p-6 rounded-2xl">
            <button onClick={() => setResolveTarget(null)} disabled={resolveLoading} className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg disabled:opacity-40">
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-4 pr-8" style={{ color: 'var(--text)' }}>
              Shikoyatni hal qilish &mdash; #{getId(resolveTarget).slice(-8)}
            </h3>

            {/* Order info */}
            <div className="p-3 rounded-xl mb-4" style={{ backgroundColor: 'var(--sidebar-hover)' }}>
              {resolveTarget.skillName && <p className="text-sm" style={{ color: 'var(--text)' }}>Xizmat: {resolveTarget.skillName}</p>}
              <p className="text-xs" style={{ color: 'var(--muted)' }}>Sana: {timeAgo(resolveTarget.createdAt)}</p>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Mijoz</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{resolveTarget.user?.name}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{resolveTarget.disputeReason}</p>
              </div>
              <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)' }}>Provayder</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{resolveTarget.provider?.name}</p>
                {resolveTarget.unsuccessReason && <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{resolveTarget.unsuccessReason}</p>}
                {resolveTarget.unsuccessCategory && <p className="text-xs" style={{ color: 'var(--muted)' }}>Toifa: {resolveTarget.unsuccessCategory}</p>}
              </div>
            </div>

            {/* Decision */}
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Qaror</p>
            <div className="space-y-2 mb-4">
              {[
                { value: 'PROVIDER_FAULT' as const, label: 'Provayder aybdor' },
                { value: 'USER_FAULT' as const, label: 'Mijoz aybdor' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border"
                  style={{
                    borderColor: resolveDecision === opt.value ? 'rgba(59,130,246,0.5)' : 'var(--border)',
                    backgroundColor: resolveDecision === opt.value ? 'var(--sidebar-active)' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value={opt.value}
                    checked={resolveDecision === opt.value}
                    onChange={() => setResolveDecision(opt.value)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{opt.label}</span>
                </label>
              ))}
            </div>

            {/* Note */}
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Admin izohi</p>
            <textarea
              value={resolveNote}
              onChange={(e) => setResolveNote(e.target.value)}
              placeholder="Izoh kiriting..."
              rows={3}
              className="glass-textarea w-full px-4 py-3 text-sm mb-4"
              style={{ color: 'var(--text)' }}
            />

            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setResolveTarget(null)} disabled={resolveLoading} className="btn-ghost px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40">
                Bekor qilish
              </button>
              <button
                onClick={handleResolve}
                disabled={resolveLoading || !resolveDecision || !resolveNote.trim()}
                className="btn-primary px-5 py-2.5 text-sm font-medium flex items-center gap-2 disabled:opacity-60"
              >
                {resolveLoading && <Loader2 size={16} className="animate-spin" />}
                Hal qilish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail Modal (resolved) ─── */}
      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDetailTarget(null)} />
          <div className="glass-modal fade-in relative w-full max-w-lg p-6 rounded-2xl">
            <button onClick={() => setDetailTarget(null)} className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg">
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-4 pr-8" style={{ color: 'var(--text)' }}>
              Shikoyat tafsilotlari &mdash; #{getId(detailTarget).slice(-8)}
            </h3>

            <div className="space-y-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--sidebar-hover)' }}>
                {detailTarget.skillName && <p className="text-sm" style={{ color: 'var(--text)' }}>Xizmat: {detailTarget.skillName}</p>}
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Sana: {timeAgo(detailTarget.createdAt)}</p>
              </div>

              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Shikoyat sababi</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{detailTarget.disputeReason}</p>
              </div>

              {detailTarget.resolvedDecision && (
                <div className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--sidebar-active)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Qaror</p>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {detailTarget.resolvedDecision === 'PROVIDER_FAULT' ? 'Provayder aybdor' : 'Mijoz aybdor'}
                  </p>
                  {detailTarget.resolvedNote && <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{detailTarget.resolvedNote}</p>}
                  {detailTarget.resolver && <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>Hal etuvchi: {detailTarget.resolver.name}</p>}
                  {detailTarget.resolvedAt && <p className="text-xs" style={{ color: 'var(--muted)' }}>Sana: {timeAgo(detailTarget.resolvedAt)}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
