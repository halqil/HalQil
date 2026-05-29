'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { timeAgo } from '@/lib/timeAgo';
import Avatar from '@/components/Avatar';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import { ConfirmDialog } from '@/components/admin/shared/ConfirmDialog';
import { TextInputDialog } from '@/components/admin/shared/TextInputDialog';
import { SkeletonRow } from '@/components/admin/shared/SkeletonRow';
import { EmptyState } from '@/components/admin/shared/EmptyState';
import { PageHeader } from '@/components/admin/shared/PageHeader';
import { Pagination } from '@/components/admin/shared/Pagination';
import type { Application, OrgApplication, Category } from '@/components/admin/types';
import {
  Search, ClipboardList, Eye, Check, X, Loader2, Building2, ChevronRight,
} from 'lucide-react';

const LIMIT = 20;

// ─── Helper ──────────────────────────────────────────────────────
function extractData<T>(res: { data: Record<string, unknown> }): {
  items: T[];
  total: number;
  totalPages: number;
} {
  const d = res.data;
  const inner = (d.data && typeof d.data === 'object' ? d.data : d) as Record<string, unknown>;
  const items = (Array.isArray(inner.data) ? inner.data : Array.isArray(inner) ? inner : []) as T[];
  const total = (typeof inner.total === 'number' ? inner.total : 0);
  const totalPages = (typeof inner.totalPages === 'number' ? inner.totalPages : 1);
  return { items, total, totalPages };
}

export default function AdminApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── Main tab ──────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<'provider' | 'org'>('provider');

  // ─── Provider Applications State ──────────────────────────────
  const statusParam = searchParams.get('status') || 'ALL';
  const searchParam = searchParams.get('search') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);

  const [apps, setApps] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParam);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusCounts, setStatusCounts] = useState({ ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 });

  // Detail modal
  const [detailApp, setDetailApp] = useState<Application | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  // Approve/Reject
  const [approveTarget, setApproveTarget] = useState<Application | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Application | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  // ─── Organization Applications State ──────────────────────────
  const [orgApps, setOrgApps] = useState<OrgApplication[]>([]);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgApproveTarget, setOrgApproveTarget] = useState<OrgApplication | null>(null);
  const [orgApproveLoading, setOrgApproveLoading] = useState(false);
  const [orgRejectTarget, setOrgRejectTarget] = useState<OrgApplication | null>(null);
  const [orgRejectLoading, setOrgRejectLoading] = useState(false);

  // ─── URL helpers ───────────────────────────────────────────────
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      router.replace(`/admin/applications?${params.toString()}`);
    },
    [searchParams, router]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchParam) {
        updateParams({ search: searchInput, page: '1' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, searchParam, updateParams]);

  // ─── Fetch categories ─────────────────────────────────────────
  useEffect(() => {
    api.get('/admin/categories').then((res) => {
      const cats = res.data.data ?? res.data ?? [];
      setCategories(Array.isArray(cats) ? cats : []);
    }).catch(() => {/* silent */});
  }, []);

  // ─── Fetch provider apps ──────────────────────────────────────
  useEffect(() => {
    if (mainTab !== 'provider') return;
    const fetchApps = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/applications', {
          params: {
            status: statusParam === 'ALL' ? undefined : statusParam,
            search: searchParam || undefined,
            page: pageParam,
            limit: LIMIT,
          },
        });
        const { items, total: t, totalPages: tp } = extractData<Application>(res);
        setApps(items);
        setTotal(t);
        setTotalPages(tp);
      } catch {
        toast.error('Arizalarni yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [mainTab, statusParam, searchParam, pageParam]);

  // ─── Fetch status counts ──────────────────────────────────────
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [allRes, pendRes, appRes, rejRes] = await Promise.all([
          api.get('/admin/applications', { params: { limit: 1 } }),
          api.get('/admin/applications', { params: { status: 'PENDING', limit: 1 } }),
          api.get('/admin/applications', { params: { status: 'APPROVED', limit: 1 } }),
          api.get('/admin/applications', { params: { status: 'REJECTED', limit: 1 } }),
        ]);
        const getTotal = (r: { data: Record<string, unknown> }) => {
          const d = r.data;
          const inner = (d.data && typeof d.data === 'object' ? d.data : d) as Record<string, unknown>;
          return typeof inner.total === 'number' ? inner.total : 0;
        };
        setStatusCounts({
          ALL: getTotal(allRes),
          PENDING: getTotal(pendRes),
          APPROVED: getTotal(appRes),
          REJECTED: getTotal(rejRes),
        });
      } catch {/* silent */}
    };
    fetchCounts();
  }, []);

  // ─── Fetch org apps ────────────────────────────────────────────
  useEffect(() => {
    if (mainTab !== 'org') return;
    const fetchOrgApps = async () => {
      setOrgLoading(true);
      try {
        const res = await api.get('/admin/organizations/applications');
        const items = res.data.data ?? res.data ?? [];
        setOrgApps(Array.isArray(items) ? items : []);
      } catch {
        toast.error('Tashkilot arizalarini yuklashda xatolik');
      } finally {
        setOrgLoading(false);
      }
    };
    fetchOrgApps();
  }, [mainTab]);

  // ─── Detail ────────────────────────────────────────────────────
  const handleViewDetail = async (appId: string) => {
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const res = await api.get(`/admin/applications/${appId}`);
      setDetailApp(res.data.data ?? res.data);
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Approve ───────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproveLoading(true);
    try {
      await api.patch(`/admin/applications/${approveTarget.id}/approve`);
      setApps((prev) => prev.map((a) => (a.id === approveTarget.id ? { ...a, status: 'APPROVED' } : a)));
      toast.success('Ariza tasdiqlandi');
      setShowDetail(false);
    } catch {
      toast.error('Tasdiqlashda xatolik');
    } finally {
      setApproveLoading(false);
      setApproveTarget(null);
    }
  };

  // ─── Reject ────────────────────────────────────────────────────
  const handleReject = async (note: string) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await api.patch(`/admin/applications/${rejectTarget.id}/reject`, { rejection_note: note });
      setApps((prev) => prev.map((a) => (a.id === rejectTarget.id ? { ...a, status: 'REJECTED' } : a)));
      toast.success('Ariza rad etildi');
      setShowDetail(false);
    } catch {
      toast.error('Rad etishda xatolik');
    } finally {
      setRejectLoading(false);
      setRejectTarget(null);
    }
  };

  // ─── Org Approve/Reject ────────────────────────────────────────
  const handleOrgApprove = async () => {
    if (!orgApproveTarget) return;
    setOrgApproveLoading(true);
    try {
      await api.post(`/admin/organizations/applications/${orgApproveTarget.id}/approve`);
      setOrgApps((prev) => prev.map((a) => (a.id === orgApproveTarget.id ? { ...a, status: 'APPROVED' } : a)));
      toast.success('Tashkilot arizasi tasdiqlandi');
    } catch {
      toast.error('Tasdiqlashda xatolik');
    } finally {
      setOrgApproveLoading(false);
      setOrgApproveTarget(null);
    }
  };

  const handleOrgReject = async (note: string) => {
    if (!orgRejectTarget) return;
    setOrgRejectLoading(true);
    try {
      await api.post(`/admin/organizations/applications/${orgRejectTarget.id}/reject`, { rejection_note: note });
      setOrgApps((prev) => prev.map((a) => (a.id === orgRejectTarget.id ? { ...a, status: 'REJECTED' } : a)));
      toast.success('Tashkilot arizasi rad etildi');
    } catch {
      toast.error('Rad etishda xatolik');
    } finally {
      setOrgRejectLoading(false);
      setOrgRejectTarget(null);
    }
  };

  // ─── Status Tabs ───────────────────────────────────────────────
  const statusTabs = [
    { value: 'ALL', label: 'Barchasi', count: statusCounts.ALL },
    { value: 'PENDING', label: 'Kutilmoqda', count: statusCounts.PENDING },
    { value: 'APPROVED', label: 'Tasdiqlangan', count: statusCounts.APPROVED },
    { value: 'REJECTED', label: 'Rad etilgan', count: statusCounts.REJECTED },
  ];

  const filteredApps = categoryFilter
    ? apps.filter((a) => a.categoryId === categoryFilter || a.category?.id === categoryFilter)
    : apps;

  return (
    <div className="fade-in">
      <PageHeader title="Arizalar" description="Provayder va tashkilot arizalarini boshqarish" />

      {/* ─── Main Tabs ─── */}
      <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '1px solid var(--border)' }}>
        {[
          { key: 'provider' as const, label: 'Provayder arizalari', icon: ClipboardList },
          { key: 'org' as const, label: 'Tashkilot arizalari', icon: Building2 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setMainTab(tab.key)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative"
            style={{ color: mainTab === tab.key ? 'var(--text)' : 'var(--muted)' }}
          >
            <tab.icon size={16} />
            {tab.label}
            {mainTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {mainTab === 'provider' ? (
        <>
          {/* ─── Status Sub-tabs ─── */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => updateParams({ status: tab.value, page: '1' })}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  statusParam === tab.value ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                {tab.label}
                <span
                  className="min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[11px] font-bold"
                  style={{
                    backgroundColor: statusParam === tab.value ? 'rgba(255,255,255,0.2)' : 'var(--sidebar-hover)',
                    color: statusParam === tab.value ? 'white' : 'var(--muted)',
                  }}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ─── Filters ─── */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="search-wrapper flex-1 min-w-[200px] max-w-sm">
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
            {categories.length > 0 && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="glass-input px-4 py-2.5 text-sm"
                style={{ color: 'var(--text)' }}
              >
                <option value="">Barcha kategoriyalar</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* ─── Provider Apps Table ─── */}
          {loading ? (
            <SkeletonRow cols={7} rows={5} />
          ) : filteredApps.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Arizalar topilmadi" />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto glass-card rounded-2xl">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Ariza beruvchi', 'Kategoriya', 'Skilllar', 'Hudud', 'Sana', 'Holat', 'Amallar'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app) => (
                      <tr
                        key={app.id}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid var(--border)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={app.user?.name || ''} avatar={app.user?.avatar} size="sm" />
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                                {app.user?.name || [app.user?.firstName, app.user?.lastName].filter(Boolean).join(' ')}
                              </p>
                              <p className="text-xs" style={{ color: 'var(--muted)' }}>{app.user?.walletId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {app.category?.name || '\u2014'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="glass-badge text-xs px-2 py-1 rounded-lg">
                            {app.skills?.length ?? 0} ta skill
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {app.districts?.length > 0 ? (
                            <>
                              {app.districts.slice(0, 2).join(', ')}
                              {app.districts.length > 2 && (
                                <span style={{ color: 'var(--muted)' }}> +{app.districts.length - 2}</span>
                              )}
                            </>
                          ) : '\u2014'}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>
                          {timeAgo(app.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} type="application" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleViewDetail(app.id)} className="btn-ghost p-2 rounded-lg" title="Batafsil">
                              <Eye size={16} />
                            </button>
                            {app.status === 'PENDING' && (
                              <>
                                <button onClick={() => setApproveTarget(app)} className="btn-ghost p-2 rounded-lg" title="Tasdiqlash" style={{ color: '#22c55e' }}>
                                  <Check size={16} />
                                </button>
                                <button onClick={() => setRejectTarget(app)} className="btn-ghost p-2 rounded-lg" title="Rad etish" style={{ color: '#ef4444' }}>
                                  <X size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-3">
                {filteredApps.map((app) => (
                  <div key={app.id} className="glass-card p-4 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={app.user?.name || ''} avatar={app.user?.avatar} size="sm" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                            {app.user?.name || [app.user?.firstName, app.user?.lastName].filter(Boolean).join(' ')}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{app.category?.name}</p>
                        </div>
                      </div>
                      <StatusBadge status={app.status} type="application" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{timeAgo(app.createdAt)}</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleViewDetail(app.id)} className="btn-ghost p-2 rounded-lg">
                          <Eye size={16} />
                        </button>
                        {app.status === 'PENDING' && (
                          <>
                            <button onClick={() => setApproveTarget(app)} className="btn-ghost p-2 rounded-lg" style={{ color: '#22c55e' }}>
                              <Check size={16} />
                            </button>
                            <button onClick={() => setRejectTarget(app)} className="btn-ghost p-2 rounded-lg" style={{ color: '#ef4444' }}>
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination page={pageParam} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={(p) => updateParams({ page: p.toString() })} />
            </>
          )}
        </>
      ) : (
        /* ─── Organization Applications ─── */
        <div>
          {orgLoading ? (
            <SkeletonRow cols={5} rows={5} />
          ) : orgApps.length === 0 ? (
            <EmptyState icon={Building2} title="Tashkilot arizalari topilmadi" />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto glass-card rounded-2xl">
                <table className="w-full">
                  <thead>
                    <tr>
                      {['Tashkilot nomi', 'Ariza beruvchi', 'Tavsif', 'Sana', 'Holat', 'Amallar'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orgApps.map((app) => (
                      <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--text)' }}>{app.organizationName}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={app.user?.name || ''} avatar={app.user?.avatar} size="xs" />
                            <div>
                              <p className="text-sm" style={{ color: 'var(--text)' }}>{app.user?.name}</p>
                              <p className="text-xs" style={{ color: 'var(--muted)' }}>{app.user?.walletId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm max-w-[200px] truncate" style={{ color: 'var(--text-secondary)' }}>{app.description}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>{timeAgo(app.createdAt)}</td>
                        <td className="px-4 py-3"><StatusBadge status={app.status} type="application" /></td>
                        <td className="px-4 py-3">
                          {app.status === 'PENDING' && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => setOrgApproveTarget(app)} className="btn-ghost p-2 rounded-lg" style={{ color: '#22c55e' }}>
                                <Check size={16} />
                              </button>
                              <button onClick={() => setOrgRejectTarget(app)} className="btn-ghost p-2 rounded-lg" style={{ color: '#ef4444' }}>
                                <X size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile org */}
              <div className="md:hidden space-y-3">
                {orgApps.map((app) => (
                  <div key={app.id} className="glass-card p-4 rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{app.organizationName}</p>
                      <StatusBadge status={app.status} type="application" />
                    </div>
                    <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{app.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{timeAgo(app.createdAt)}</p>
                      {app.status === 'PENDING' && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => setOrgApproveTarget(app)} className="btn-ghost p-2 rounded-lg" style={{ color: '#22c55e' }}>
                            <Check size={14} />
                          </button>
                          <button onClick={() => setOrgRejectTarget(app)} className="btn-ghost p-2 rounded-lg" style={{ color: '#ef4444' }}>
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── Application Detail Modal ─── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="glass-modal fade-in relative w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl">
            <button onClick={() => setShowDetail(false)} className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg z-10">
              <X size={18} />
            </button>

            {detailLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--muted)' }} />
              </div>
            ) : detailApp ? (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <Avatar name={detailApp.user?.name || ''} avatar={detailApp.user?.avatar} size="lg" />
                  <div>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                      {detailApp.user?.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{detailApp.user?.walletId}</p>
                    <StatusBadge status={detailApp.status} type="application" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Kategoriya</p>
                      <p className="text-sm" style={{ color: 'var(--text)' }}>{detailApp.category?.name}</p>
                    </div>
                    {detailApp.motivation && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Nima uchun qo&apos;shilmoqchi</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{detailApp.motivation}</p>
                      </div>
                    )}
                    {detailApp.districts && detailApp.districts.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>Hududlar</p>
                        <div className="flex flex-wrap gap-1">
                          {detailApp.districts.map((d) => (
                            <span key={d} className="glass-badge text-xs px-2 py-1 rounded-lg">{d}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right — Skills */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Skilllar</p>
                    {detailApp.skills?.map((skill) => (
                      <div key={skill.id} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--sidebar-hover)' }}>
                        <div className="flex items-center gap-2 mb-1">
                          <ChevronRight size={14} style={{ color: 'var(--muted)' }} />
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{skill.name}</p>
                        </div>
                        <div className="pl-5 space-y-1">
                          {skill.serviceType && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tur: {skill.serviceType}</p>}
                          {skill.experience > 0 && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tajriba: {skill.experience} yil</p>}
                          {(skill.priceMin > 0 || skill.priceMax > 0) && (
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              Narx: {skill.priceMin?.toLocaleString()} - {skill.priceMax?.toLocaleString()} so&apos;m
                            </p>
                          )}
                          {skill.description && <p className="text-xs" style={{ color: 'var(--muted)' }}>{skill.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {detailApp.status === 'PENDING' && (
                  <div className="flex items-center justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={() => { setShowDetail(false); setRejectTarget(detailApp); }}
                      className="btn-danger px-5 py-2.5 text-sm font-medium"
                    >
                      Rad etish
                    </button>
                    <button
                      onClick={() => { setShowDetail(false); setApproveTarget(detailApp); }}
                      className="btn-success px-5 py-2.5 text-sm font-medium"
                    >
                      Tasdiqlash
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Dialogs ─── */}
      <ConfirmDialog open={!!approveTarget} onClose={() => setApproveTarget(null)} onConfirm={handleApprove} title="Arizani tasdiqlash" description={`"${approveTarget?.user?.name}" arizasini tasdiqlashni xohlaysizmi?`} confirmText="Tasdiqlash" variant="default" loading={approveLoading} />
      <TextInputDialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject} title="Arizani rad etish" description="Rad etish sababini kiriting" placeholder="Sabab..." required confirmText="Rad etish" loading={rejectLoading} />
      <ConfirmDialog open={!!orgApproveTarget} onClose={() => setOrgApproveTarget(null)} onConfirm={handleOrgApprove} title="Tashkilot arizasini tasdiqlash" description={`"${orgApproveTarget?.organizationName}" tashkilotini tasdiqlashni xohlaysizmi?`} confirmText="Tasdiqlash" loading={orgApproveLoading} />
      <TextInputDialog open={!!orgRejectTarget} onClose={() => setOrgRejectTarget(null)} onConfirm={handleOrgReject} title="Tashkilot arizasini rad etish" description="Rad etish sababini kiriting" placeholder="Sabab..." required confirmText="Rad etish" loading={orgRejectLoading} />
    </div>
  );
}
