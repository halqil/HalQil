'use client';

import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Avatar from '@/components/Avatar';
import { StatusBadge } from '@/components/admin/shared/StatusBadge';
import { PageHeader } from '@/components/admin/shared/PageHeader';
import type { AdminUser, NotificationType, TargetRole } from '@/components/admin/types';
import { Bell, Send, Search, Loader2, Megaphone, User } from 'lucide-react';

// ─── Notification Type Options ───────────────────────────────────
const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: 'ANNOUNCEMENT', label: "E'lon" },
  { value: 'WARNING', label: 'Ogohlantirish' },
  { value: 'NEWS', label: 'Yangilik' },
  { value: 'SYSTEM', label: 'Tizim' },
];

const TARGET_OPTIONS: { value: TargetRole; label: string }[] = [
  { value: 'ALL', label: 'Barchaga' },
  { value: 'USER', label: 'Faqat mijozlar' },
  { value: 'PROVIDER', label: 'Faqat provayderlar' },
];

export default function AdminNotificationsPage() {
  // ─── Broadcast State ───────────────────────────────────────────
  const [broadcastTarget, setBroadcastTarget] = useState<TargetRole>('ALL');
  const [broadcastType, setBroadcastType] = useState<NotificationType>('ANNOUNCEMENT');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // ─── Individual State ──────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUser, setFoundUser] = useState<AdminUser | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [individualType, setIndividualType] = useState<NotificationType>('ANNOUNCEMENT');
  const [individualTitle, setIndividualTitle] = useState('');
  const [individualMessage, setIndividualMessage] = useState('');
  const [individualLoading, setIndividualLoading] = useState(false);

  // ─── Broadcast Submit ──────────────────────────────────────────
  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      toast.error('Sarlavha va matn kiriting');
      return;
    }

    setBroadcastLoading(true);
    try {
      await api.post('/admin/notifications/broadcast', {
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        type: broadcastType,
        targetRole: broadcastTarget === 'ALL' ? undefined : broadcastTarget,
      });
      toast.success('Xabarnoma yuborildi');
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastType('ANNOUNCEMENT');
      setBroadcastTarget('ALL');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Xabarnoma yuborishda xatolik";
      toast.error(message);
    } finally {
      setBroadcastLoading(false);
    }
  };

  // ─── User Search ───────────────────────────────────────────────
  const handleUserSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setFoundUser(null);
    try {
      const res = await api.get('/admin/users', {
        params: { search: searchQuery.trim(), limit: 1 },
      });
      const users = res.data.data?.data ?? res.data.data ?? [];
      if (Array.isArray(users) && users.length > 0) {
        setFoundUser(users[0] as AdminUser);
      } else {
        toast.error('Foydalanuvchi topilmadi');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Qidirishda xatolik";
      toast.error(message);
    } finally {
      setSearchLoading(false);
    }
  };

  // ─── Individual Submit ─────────────────────────────────────────
  const handleIndividualSend = async () => {
    if (!foundUser) {
      toast.error('Avval foydalanuvchini toping');
      return;
    }
    if (!individualTitle.trim() || !individualMessage.trim()) {
      toast.error('Sarlavha va matn kiriting');
      return;
    }

    setIndividualLoading(true);
    try {
      await api.post('/admin/notifications/send', {
        userId: foundUser.id,
        title: individualTitle.trim(),
        message: individualMessage.trim(),
        type: individualType,
      });
      toast.success('Xabarnoma yuborildi');
      setIndividualTitle('');
      setIndividualMessage('');
      setIndividualType('ANNOUNCEMENT');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Xabarnoma yuborishda xatolik";
      toast.error(message);
    } finally {
      setIndividualLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Xabarnomalar"
        description="Foydalanuvchilarga xabarnoma yuborish"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Broadcast ─── */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Megaphone size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Ommaviy xabarnoma
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Bir nechta foydalanuvchilarga yuborish
              </p>
            </div>
          </div>

          {/* Target Role */}
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Kimga yuborilsin
          </label>
          <div className="flex gap-2 mb-4">
            {TARGET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setBroadcastTarget(opt.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  broadcastTarget === opt.value ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Type */}
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Xabar turi
          </label>
          <select
            value={broadcastType}
            onChange={(e) => setBroadcastType(e.target.value as NotificationType)}
            className="glass-input w-full px-4 py-2.5 text-sm mb-4"
            style={{ color: 'var(--text)' }}
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Title */}
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Sarlavha
          </label>
          <input
            value={broadcastTitle}
            onChange={(e) => setBroadcastTitle(e.target.value)}
            placeholder="Xabarnoma sarlavhasi"
            className="glass-input w-full px-4 py-2.5 text-sm mb-4"
            style={{ color: 'var(--text)' }}
          />

          {/* Message */}
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Matn
          </label>
          <textarea
            value={broadcastMessage}
            onChange={(e) => setBroadcastMessage(e.target.value)}
            placeholder="Xabarnoma matni"
            rows={4}
            className="glass-textarea w-full px-4 py-3 text-sm mb-4"
            style={{ color: 'var(--text)' }}
          />

          {/* Submit */}
          <button
            onClick={handleBroadcast}
            disabled={broadcastLoading || !broadcastTitle.trim() || !broadcastMessage.trim()}
            className="btn-primary w-full py-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {broadcastLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
            Yuborish
          </button>
        </div>

        {/* ─── Individual ─── */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Alohida xabarnoma
              </h2>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Bitta foydalanuvchiga yuborish
              </p>
            </div>
          </div>

          {/* User Search */}
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Foydalanuvchi ID yoki username
          </label>
          <div className="flex gap-2 mb-4">
            <div className="search-wrapper flex-1">
              <input
                className="glass-input"
                placeholder="Qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
              />
              <span className="search-icon">
                <Search size={15} />
              </span>
            </div>
            <button
              onClick={handleUserSearch}
              disabled={searchLoading || !searchQuery.trim()}
              className="btn-ghost px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium disabled:opacity-40"
            >
              {searchLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Topish'
              )}
            </button>
          </div>

          {/* Found User Card */}
          {foundUser && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-4 border"
              style={{
                backgroundColor: 'var(--sidebar-active)',
                borderColor: 'var(--border)',
              }}
            >
              <Avatar name={foundUser.name} avatar={foundUser.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                  {foundUser.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {foundUser.role}
                </p>
              </div>
              <StatusBadge status={foundUser.status} type="user" />
            </div>
          )}

          {/* Type */}
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Xabar turi
          </label>
          <select
            value={individualType}
            onChange={(e) => setIndividualType(e.target.value as NotificationType)}
            className="glass-input w-full px-4 py-2.5 text-sm mb-4"
            style={{ color: 'var(--text)' }}
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Title */}
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Sarlavha
          </label>
          <input
            value={individualTitle}
            onChange={(e) => setIndividualTitle(e.target.value)}
            placeholder="Xabarnoma sarlavhasi"
            className="glass-input w-full px-4 py-2.5 text-sm mb-4"
            style={{ color: 'var(--text)' }}
          />

          {/* Message */}
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            Matn
          </label>
          <textarea
            value={individualMessage}
            onChange={(e) => setIndividualMessage(e.target.value)}
            placeholder="Xabarnoma matni"
            rows={4}
            className="glass-textarea w-full px-4 py-3 text-sm mb-4"
            style={{ color: 'var(--text)' }}
          />

          {/* Submit */}
          <button
            onClick={handleIndividualSend}
            disabled={individualLoading || !foundUser || !individualTitle.trim() || !individualMessage.trim()}
            className="btn-primary w-full py-3 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {individualLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Bell size={18} />
            )}
            Yuborish
          </button>
        </div>
      </div>
    </div>
  );
}
