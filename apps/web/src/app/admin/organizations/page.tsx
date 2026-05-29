'use client';

import { useEffect, useState } from 'react';
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
import type { OrgApplication } from '@/components/admin/types';
import { Building2, Check, X, Search } from 'lucide-react';

export default function AdminOrganizationsPage() {
  const [rawApps, setRawApps] = useState<OrgApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [approveTarget, setApproveTarget] = useState<OrgApplication | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<OrgApplication | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchApps = async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/organizations/applications', {
          params: { status: statusFilter === 'ALL' ? undefined : statusFilter },
        });
        const data = res.data.data ?? res.data ?? [];
        setRawApps(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Tashkilot arizalarini yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproveLoading(true);
    try {
      await api.post(`/admin/organizations/applications/${approveTarget.id}/approve`);
      setRawApps((prev) => prev.map((a) => (a.id === approveTarget.id ? { ...a, status: 'APPROVED' } : a)));
      toast.success('Tasdiqlandi');
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setApproveLoading(false);
      setApproveTarget(null);
    }
  };

  const handleReject = async (note: string) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await api.post(`/admin/organizations/applications/${rejectTarget.id}/reject`, { rejection_note: note });
      setRawApps((prev) => prev.map((a) => (a.id === rejectTarget.id ? { ...a, status: 'REJECTED' } : a)));
      toast.success('Rad etildi');
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setRejectLoading(false);
      setRejectTarget(null);
    }
  };

  const filteredApps = search
    ? rawApps.filter(
        (app) =>
          app.organizationName?.toLowerCase().includes(search.toLowerCase()) ||
          app.user?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : rawApps;

  return (
    <div className="fade-in">
      <PageHeader title="Tashkilotlar" description="Tashkilot arizalarini boshqarish" />

      {/* Status filter */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
          >
            {s === 'ALL' ? 'Barchasi' : s === 'PENDING' ? 'Kutilmoqda' : s === 'APPROVED' ? 'Tasdiqlangan' : 'Rad etilgan'}
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

      {loading ? (
        <SkeletonRow cols={5} rows={5} />
      ) : filteredApps.length === 0 ? (
        <EmptyState icon={Building2} title="Tashkilot arizalari topilmadi" />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto glass-card rounded-2xl">
            <table className="w-full">
              <thead>
                <tr>
                  {['Tashkilot', 'Ariza beruvchi', 'Tavsif', 'Sana', 'Holat', 'Amallar'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
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
                          <button onClick={() => setApproveTarget(app)} className="btn-ghost p-2 rounded-lg" style={{ color: '#22c55e' }}><Check size={16} /></button>
                          <button onClick={() => setRejectTarget(app)} className="btn-ghost p-2 rounded-lg" style={{ color: '#ef4444' }}><X size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filteredApps.map((app) => (
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
                      <button onClick={() => setApproveTarget(app)} className="btn-ghost p-2 rounded-lg" style={{ color: '#22c55e' }}><Check size={14} /></button>
                      <button onClick={() => setRejectTarget(app)} className="btn-ghost p-2 rounded-lg" style={{ color: '#ef4444' }}><X size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog open={!!approveTarget} onClose={() => setApproveTarget(null)} onConfirm={handleApprove} title="Tasdiqlash" description={`"${approveTarget?.organizationName}" tashkilotini tasdiqlashni xohlaysizmi?`} confirmText="Tasdiqlash" loading={approveLoading} />
      <TextInputDialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject} title="Rad etish" description="Rad etish sababini kiriting" placeholder="Sabab..." required confirmText="Rad etish" loading={rejectLoading} />
    </div>
  );
}
