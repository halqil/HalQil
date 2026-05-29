'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Briefcase,
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  FolderOpen,
  Bell,
  Building2,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { timeAgo } from '@/lib/timeAgo';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import { SkeletonRow } from '@/components/admin/shared/SkeletonRow';
import { EmptyState } from '@/components/admin/shared/EmptyState';
import { PageHeader } from '@/components/admin/shared/PageHeader';

// ─── Types ───────────────────────────────────────────────────────
interface StatCard {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}

interface RecentApp {
  _id?: string;
  id?: string;
  user?: { name?: string; firstName?: string; lastName?: string };
  category?: { name?: string };
  createdAt: string;
  status: string;
}

interface RecentDispute {
  _id?: string;
  id?: string;
  user?: { name?: string; firstName?: string; lastName?: string };
  provider?: { name?: string; firstName?: string; lastName?: string };
  skillName?: string;
  createdAt: string;
  status: string;
}

// ─── Helpers ─────────────────────────────────────────────────────
function getName(u?: { name?: string; firstName?: string; lastName?: string }): string {
  if (!u) return 'Noma`lum';
  if (u.name) return u.name;
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Noma`lum';
}

function getId(item: { _id?: string; id?: string }): string {
  return item._id || item.id || '';
}

function extractTotal(res: { data: Record<string, unknown> }): number {
  const d = res.data;
  if (d.data && typeof d.data === 'object' && d.data !== null) {
    const inner = d.data as Record<string, unknown>;
    if (typeof inner.total === 'number') return inner.total;
  }
  if (typeof d.total === 'number') return d.total;
  return 0;
}

function extractItems<T>(res: { data: Record<string, unknown> }): T[] {
  const d = res.data;
  if (d.data && typeof d.data === 'object' && d.data !== null) {
    const inner = d.data as Record<string, unknown>;
    if (Array.isArray(inner.data)) return inner.data as T[];
    if (Array.isArray(inner)) return inner as T[];
  }
  if (Array.isArray(d.data)) return d.data as T[];
  return [];
}

// ─── Component ───────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatCard[]>([
    { title: 'Foydalanuvchilar', value: 0, icon: Users, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { title: 'Provayderlar', value: 0, icon: Briefcase, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    { title: 'Kutilayotgan arizalar', value: 0, icon: ClipboardList, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { title: 'Bahsli buyurtmalar', value: 0, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  ]);

  const [applications, setApplications] = useState<RecentApp[]>([]);
  const [disputes, setDisputes] = useState<RecentDispute[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingDisputes, setLoadingDisputes] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersRes, providersRes, appsRes, disputesRes] = await Promise.all([
          api.get('/admin/users', { params: { role: 'USER', limit: 1 } }),
          api.get('/admin/users', { params: { role: 'PROVIDER', limit: 1 } }),
          api.get('/admin/applications', { params: { status: 'PENDING', limit: 1 } }),
          api.get('/admin/orders/disputed', { params: { status: 'DISPUTED', limit: 1 } }),
        ]);
        setStats((prev) =>
          prev.map((card, i) => ({
            ...card,
            value: extractTotal([usersRes, providersRes, appsRes, disputesRes][i]),
          }))
        );
      } catch {
        toast.error('Statistikani yuklashda xatolik');
      } finally {
        setLoadingStats(false);
      }
    };

    const loadApplications = async () => {
      try {
        const res = await api.get('/admin/applications', { params: { status: 'PENDING', limit: 5 } });
        setApplications(extractItems<RecentApp>(res));
      } catch {
        toast.error('Arizalarni yuklashda xatolik');
      } finally {
        setLoadingApps(false);
      }
    };

    const loadDisputes = async () => {
      try {
        const res = await api.get('/admin/orders/disputed', { params: { status: 'DISPUTED', limit: 5 } });
        setDisputes(extractItems<RecentDispute>(res));
      } catch {
        toast.error('Shikoyatlarni yuklashda xatolik');
      } finally {
        setLoadingDisputes(false);
      }
    };

    loadStats();
    loadApplications();
    loadDisputes();
  }, []);

  return (
    <div className="fade-in space-y-6">
      <PageHeader title="Boshqaruv paneli" />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((card) => (
          <div key={card.title} className="glass-card p-5">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: card.bg }}
              >
                <card.icon size={24} color={card.color} />
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{card.title}</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                  {loadingStats ? '\u2014' : card.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Quick Access */}
      <div className="md:hidden mt-6">
        <h2 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12, color: 'var(--text-secondary)' }}>
          Tezkor kirish
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { href: '/admin/categories',    icon: FolderOpen,    label: 'Kategoriyalar', sub: 'CRUD boshqaruv' },
            { href: '/admin/notifications', icon: Bell,          label: 'Xabarnoma',     sub: 'Yuborish'      },
            { href: '/admin/organizations', icon: Building2,     label: 'Tashkilotlar',  sub: 'Arizalar'      },
            { href: '/admin/chats',         icon: MessageSquare, label: 'Chatlar',       sub: 'Admin chatlar' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="glass-card"
              style={{
                display: 'flex', flexDirection: 'column',
                gap: 6, padding: '12px 14px',
                textDecoration: 'none', color: 'var(--text)',
              }}
            >
              <item.icon size={20} style={{ color: 'var(--text-secondary)' }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</p>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="glass-card p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Oxirgi arizalar
            </h2>
            <Link
              href="/admin/applications"
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: 'var(--muted)' }}
            >
              Barchasi <ArrowRight size={14} />
            </Link>
          </div>

          {loadingApps ? (
            <SkeletonRow cols={4} rows={3} />
          ) : applications.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Kutilayotgan arizalar topilmadi" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Ism', 'Kategoriya', 'Sana', 'Holat'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2.5 text-xs font-semibold whitespace-nowrap"
                        style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={getId(app)}>
                      <td className="px-3 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>
                        {getName(app.user)}
                      </td>
                      <td className="px-3 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        {app.category?.name ?? '\u2014'}
                      </td>
                      <td className="px-3 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                        {timeAgo(app.createdAt)}
                      </td>
                      <td className="px-3 py-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
                        <StatusBadge type="application" status={app.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Disputes */}
        <div className="glass-card p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
              Oxirgi shikoyatlar
            </h2>
            <Link
              href="/admin/disputes"
              className="flex items-center gap-1 text-sm hover:underline"
              style={{ color: 'var(--muted)' }}
            >
              Barchasi <ArrowRight size={14} />
            </Link>
          </div>

          {loadingDisputes ? (
            <SkeletonRow cols={4} rows={3} />
          ) : disputes.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Bahsli buyurtmalar topilmadi" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Buyurtma', 'Mijoz', 'Provayder', 'Sana'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2.5 text-xs font-semibold whitespace-nowrap"
                        style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {disputes.map((d) => (
                    <tr key={getId(d)}>
                      <td className="px-3 py-2.5 text-sm font-mono whitespace-nowrap" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>
                        #{getId(d).slice(-8)}
                      </td>
                      <td className="px-3 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--text)', borderBottom: '1px solid var(--border)' }}>
                        {getName(d.user)}
                      </td>
                      <td className="px-3 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                        {getName(d.provider)}
                      </td>
                      <td className="px-3 py-2.5 text-sm whitespace-nowrap" style={{ color: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                        {timeAgo(d.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
