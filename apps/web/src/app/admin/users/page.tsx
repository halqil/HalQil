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
import type { AdminUser, AdminUserDetail } from '@/components/admin/types';
import { Search, Eye, Snowflake, Ban, X, Users, Loader2 } from 'lucide-react';

const LIMIT = 20;

const SORT_OPTIONS = [
  { value: 'createdAt|desc', label: 'Yangi' },
  { value: 'createdAt|asc', label: 'Eski' },
  { value: 'name|asc', label: 'Ism A-Z' },
  { value: 'name|desc', label: 'Ism Z-A' },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── URL params ────────────────────────────────────────────────
  const role = searchParams.get('role') || 'USER';
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const sort = searchParams.get('sort') || 'createdAt|desc';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // ─── State ─────────────────────────────────────────────────────
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(search);

  // Modal states
  const [detailUser, setDetailUser] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [freezeTarget, setFreezeTarget] = useState<AdminUser | null>(null);
  const [freezeLoading, setFreezeLoading] = useState(false);

  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);
  const [blockLoading, setBlockLoading] = useState(false);
  const [showBlockInput, setShowBlockInput] = useState(false);

  // ─── URL update helper ─────────────────────────────────────────
  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      router.replace(`/admin/users?${params.toString()}`);
    },
    [searchParams, router]
  );

  // ─── Debounced search ──────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        updateParams({ search: searchInput, page: '1' });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput, search, updateParams]);

  // ─── Fetch users ───────────────────────────────────────────────
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const [sortField, sortDir] = sort.split('|');
        const res = await api.get('/admin/users', {
          params: {
            role,
            search: search || undefined,
            status: status || undefined,
            sort: `${sortField}|${sortDir}`,
            page,
            limit: LIMIT,
          },
        });
        const d = res.data.data ?? res.data;
        setUsers(d.users ?? d.data ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.totalPages ?? 1);
      } catch {
        toast.error('Foydalanuvchilarni yuklashda xatolik');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [role, search, status, sort, page]);

  // ─── View detail ───────────────────────────────────────────────
  const handleViewDetail = async (userId: string) => {
    setDetailLoading(true);
    setShowDetail(true);
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setDetailUser(res.data.data ?? res.data);
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
      setShowDetail(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Freeze/Unfreeze ──────────────────────────────────────────
  const handleFreeze = async () => {
    if (!freezeTarget) return;
    setFreezeLoading(true);
    const newStatus = freezeTarget.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
    try {
      await api.patch(`/admin/users/${freezeTarget.id}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === freezeTarget.id ? { ...u, status: newStatus } : u))
      );
      toast.success(newStatus === 'FROZEN' ? 'Foydalanuvchi muzlatildi' : 'Muzlatish bekor qilindi');
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setFreezeLoading(false);
      setFreezeTarget(null);
    }
  };

  // ─── Block/Unblock ─────────────────────────────────────────────
  const handleBlock = async (reason?: string) => {
    if (!blockTarget) return;
    setBlockLoading(true);
    const newStatus = blockTarget.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    try {
      await api.patch(`/admin/users/${blockTarget.id}/status`, {
        status: newStatus,
        ...(reason ? { reason } : {}),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === blockTarget.id ? { ...u, status: newStatus } : u))
      );
      toast.success(newStatus === 'BLOCKED' ? 'Foydalanuvchi bloklandi' : 'Blok olib tashlandi');
    } catch {
      toast.error('Xatolik yuz berdi');
    } finally {
      setBlockLoading(false);
      setBlockTarget(null);
      setShowBlockInput(false);
    }
  };

  const startBlock = (user: AdminUser) => {
    setBlockTarget(user);
    if (user.status === 'BLOCKED') {
      setShowBlockInput(false);
    } else {
      setShowBlockInput(true);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Foydalanuvchilar" description="Foydalanuvchi va provayderlarni boshqarish" />

      {/* ─── Role Tabs ─── */}
      <div className="flex items-center gap-1 mb-4" style={{ borderBottom: '1px solid var(--border)' }}>
        {[
          { value: 'USER', label: 'Mijozlar' },
          { value: 'PROVIDER', label: 'Provayderlar' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => updateParams({ role: tab.value, page: '1' })}
            className="px-4 py-3 text-sm font-medium transition-all relative"
            style={{ color: role === tab.value ? 'var(--text)' : 'var(--muted)' }}
          >
            {tab.label}
            {role === tab.value && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
            )}
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

        <select
          value={status}
          onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
          className="glass-input px-4 py-2.5 text-sm"
          style={{ color: 'var(--text)' }}
        >
          <option value="">Barchasi</option>
          <option value="ACTIVE">Faol</option>
          <option value="FROZEN">Muzlatilgan</option>
          <option value="BLOCKED">Bloklangan</option>
        </select>

        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value, page: '1' })}
          className="glass-input px-4 py-2.5 text-sm"
          style={{ color: 'var(--text)' }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* ─── Content ─── */}
      {loading ? (
        <SkeletonRow cols={6} rows={5} />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="Foydalanuvchilar topilmadi" description="Filtrlash shartlarini o'zgartiring" />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto glass-card rounded-2xl">
            <table className="w-full">
              <thead>
                <tr>
                  {['Foydalanuvchi', 'Telefon', 'Holat', 'Ishonchlilik', "Ro'yxat sanasi", 'Amallar'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold whitespace-nowrap"
                      style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.name} avatar={user.avatar} size="sm" />
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.name}</p>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {user.phone || '\u2014'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={user.status} type="user" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${user.trustScore ?? 0}%`,
                              background: (user.trustScore ?? 0) >= 70
                                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                : (user.trustScore ?? 0) >= 40
                                  ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                                  : 'linear-gradient(90deg, #ef4444, #dc2626)',
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                          {user.trustScore ?? 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>
                      {timeAgo(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetail(user.id)}
                          className="btn-ghost p-2 rounded-lg"
                          title="Ko'rish"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => setFreezeTarget(user)}
                          className="btn-ghost p-2 rounded-lg"
                          title={user.status === 'FROZEN' ? 'Muzdan chiqarish' : 'Muzlatish'}
                        >
                          <Snowflake size={16} style={{ color: user.status === 'FROZEN' ? '#3b82f6' : undefined }} />
                        </button>
                        <button
                          onClick={() => startBlock(user)}
                          className="btn-ghost p-2 rounded-lg"
                          title={user.status === 'BLOCKED' ? 'Blokdan chiqarish' : 'Bloklash'}
                        >
                          <Ban size={16} style={{ color: user.status === 'BLOCKED' ? '#ef4444' : undefined }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <div key={user.id} className="glass-card p-4 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={user.name} avatar={user.avatar} size="md" />
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{user.name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>@{user.username}</p>
                    </div>
                  </div>
                  <StatusBadge status={user.status} type="user" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{user.phone || '\u2014'}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{timeAgo(user.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleViewDetail(user.id)} className="btn-ghost p-2 rounded-lg">
                      <Eye size={16} />
                    </button>
                    <button onClick={() => setFreezeTarget(user)} className="btn-ghost p-2 rounded-lg">
                      <Snowflake size={16} />
                    </button>
                    <button onClick={() => startBlock(user)} className="btn-ghost p-2 rounded-lg">
                      <Ban size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            limit={LIMIT}
            onPageChange={(p) => updateParams({ page: p.toString() })}
          />
        </>
      )}

      {/* ─── User Detail Modal ─── */}
      {showDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetail(false)} />
          <div className="glass-modal fade-in relative w-full max-w-lg p-6 rounded-2xl">
            <button onClick={() => setShowDetail(false)} className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg">
              <X size={18} />
            </button>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin" style={{ color: 'var(--muted)' }} />
              </div>
            ) : detailUser ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar name={detailUser.name} avatar={detailUser.avatar} size="lg" />
                  <div>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{detailUser.name}</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>@{detailUser.username} | {detailUser.walletId}</p>
                    <StatusBadge status={detailUser.status} type="user" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Telefon', value: detailUser.phone || '\u2014' },
                    { label: 'Email', value: detailUser.email || '\u2014' },
                    { label: 'Rol', value: detailUser.role },
                    { label: 'Ishonchlilik', value: `${detailUser.trustScore}%` },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>{item.label}</p>
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div
                  className="grid grid-cols-3 gap-3 p-4 rounded-xl"
                  style={{ backgroundColor: 'var(--sidebar-hover)' }}
                >
                  <div className="text-center">
                    <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{detailUser.completedOrders ?? 0}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Muvaffaqiyatli</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{detailUser.cancelledOrders ?? 0}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Bekor qilingan</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold" style={{ color: 'var(--text)' }}>{detailUser.totalOrders ?? 0}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Jami</p>
                  </div>
                </div>

                {detailUser.lastActive && (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Oxirgi faollik: {timeAgo(detailUser.lastActive)}
                  </p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Freeze Dialog ─── */}
      <ConfirmDialog
        open={!!freezeTarget}
        onClose={() => setFreezeTarget(null)}
        onConfirm={handleFreeze}
        title={freezeTarget?.status === 'FROZEN' ? 'Muzdan chiqarish' : 'Muzlatish'}
        description={
          freezeTarget?.status === 'FROZEN'
            ? `"${freezeTarget?.name}" foydalanuvchisini muzdan chiqarishni xohlaysizmi?`
            : `"${freezeTarget?.name}" foydalanuvchisini muzlatishni xohlaysizmi?`
        }
        confirmText={freezeTarget?.status === 'FROZEN' ? 'Muzdan chiqarish' : 'Muzlatish'}
        variant="warning"
        loading={freezeLoading}
      />

      {/* ─── Block Dialog ─── */}
      {blockTarget && !showBlockInput && (
        <ConfirmDialog
          open={!!blockTarget}
          onClose={() => setBlockTarget(null)}
          onConfirm={() => handleBlock()}
          title="Blokdan chiqarish"
          description={`"${blockTarget.name}" foydalanuvchisini blokdan chiqarishni xohlaysizmi?`}
          confirmText="Blokdan chiqarish"
          variant="default"
          loading={blockLoading}
        />
      )}

      <TextInputDialog
        open={showBlockInput}
        onClose={() => {
          setShowBlockInput(false);
          setBlockTarget(null);
        }}
        onConfirm={(reason) => handleBlock(reason)}
        title="Foydalanuvchini bloklash"
        description={`"${blockTarget?.name}" foydalanuvchisini bloklash sababini kiriting`}
        placeholder="Bloklash sababi..."
        required
        confirmText="Bloklash"
        loading={blockLoading}
      />
    </div>
  );
}
