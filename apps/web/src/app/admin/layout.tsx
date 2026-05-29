'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Building2,
  FolderOpen,
  AlertTriangle,
  Bell,
  MessageSquare,
  LogOut,
  Loader2,
  Shield,
  Home,
  Menu,
  Settings,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import type { NavItem } from '@/components/admin/types';

// ─── Sidebar Section ────────────────────────────────────────────
function SidebarSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-2">
      <p
        className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--muted)' }}
      >
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

// ─── Sidebar Link ────────────────────────────────────────────────
function SidebarLink({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-sm font-medium transition-all"
      style={{
        backgroundColor: isActive ? 'var(--sidebar-active)' : 'transparent',
        color: isActive ? 'var(--text)' : 'var(--text-secondary)',
        fontWeight: isActive ? 600 : 400,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <Icon size={20} />
      <span className="flex-1">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-full text-[11px] font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </Link>
  );
}

// ─── Mobile Tab ──────────────────────────────────────────────────
function MobileTab({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 flex-1"
      style={{ color: isActive ? 'var(--text)' : 'var(--muted)' }}
    >
      <div className="relative">
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        {item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white">
            {item.badge > 9 ? '9+' : item.badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{item.label}</span>
      {isActive && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
      )}
    </Link>
  );
}

// ─── Default pinned IDs ──────────────────────────────────────────
const DEFAULT_PINNED = ['users', 'applications', 'disputes'];

// ─── Admin Layout ────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const [pendingApps, setPendingApps] = useState(0);
  const [disputedCount, setDisputedCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_PINNED;
    try {
      const saved = localStorage.getItem('admin_nav_pinned');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PINNED;
  });

  // Persist pinned IDs
  useEffect(() => {
    localStorage.setItem('admin_nav_pinned', JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  // Auth check
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.replace('/auth/login');
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.role !== 'SUPER_ADMIN') {
        toast.error("Ruxsat yo'q");
        router.replace('/');
        return;
      }
    } catch {
      router.replace('/auth/login');
      return;
    }

    if (isAuthenticated && user) {
      if (user.role !== 'SUPER_ADMIN') {
        toast.error("Ruxsat yo'q");
        router.replace('/');
        return;
      }
      setIsReady(true);
    }
  }, [isAuthenticated, user, router]);

  // Set data-admin-panel attribute to body
  useEffect(() => {
    document.body.setAttribute('data-admin-panel', 'true');
    return () => document.body.removeAttribute('data-admin-panel');
  }, []);

  // Badge counts
  useEffect(() => {
    if (!isReady) return;

    const fetchBadges = async () => {
      try {
        const [appsRes, disputesRes] = await Promise.all([
          api.get('/admin/applications', { params: { status: 'PENDING', limit: 1 } }),
          api.get('/admin/orders/disputed', { params: { status: 'DISPUTED', limit: 1 } }),
        ]);
        setPendingApps(appsRes.data.data?.total ?? appsRes.data.total ?? 0);
        setDisputedCount(disputesRes.data.data?.total ?? disputesRes.data.total ?? 0);
      } catch {
        // Badge fetch failed silently
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, [isReady]);

  // ─── All nav items (single source of truth) ──────────────────
  const ALL_NAV_ITEMS = [
    { id: 'dashboard',     href: '/admin',                icon: LayoutDashboard, label: 'Bosh',             badge: 0,             exact: true },
    { id: 'users',         href: '/admin/users',          icon: Users,           label: 'Foydalanuvchilar', badge: 0 },
    { id: 'applications',  href: '/admin/applications',   icon: ClipboardList,   label: 'Arizalar',         badge: pendingApps },
    { id: 'disputes',      href: '/admin/disputes',       icon: AlertTriangle,   label: 'Shikoyatlar',      badge: disputedCount },
    { id: 'categories',    href: '/admin/categories',     icon: FolderOpen,      label: 'Kategoriyalar',    badge: 0 },
    { id: 'notifications', href: '/admin/notifications',  icon: Bell,            label: 'Xabarnomalar',     badge: 0 },
    { id: 'organizations', href: '/admin/organizations',  icon: Building2,       label: 'Tashkilotlar',     badge: 0 },
    { id: 'chats',         href: '/admin/chats',          icon: MessageSquare,   label: 'Chatlar',          badge: 0 },
  ];

  // Dashboard is always first and always pinned
  const tabItems = [
    ALL_NAV_ITEMS[0],
    ...pinnedIds
      .map((id) => ALL_NAV_ITEMS.find((x) => x.id === id))
      .filter(Boolean) as typeof ALL_NAV_ITEMS,
  ];

  const drawerItems = ALL_NAV_ITEMS.filter(
    (x) => x.id !== 'dashboard' && !pinnedIds.includes(x.id)
  );

  // Desktop sidebar arrays (unchanged behaviour)
  const mainItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard',         href: '/admin',                 exact: true },
    { icon: Users,           label: 'Foydalanuvchilar',  href: '/admin/users' },
    { icon: ClipboardList,   label: 'Arizalar',          href: '/admin/applications',    badge: pendingApps },
    { icon: Building2,       label: 'Tashkilotlar',      href: '/admin/organizations' },
  ];

  const systemItems: NavItem[] = [
    { icon: FolderOpen,      label: 'Kategoriyalar',     href: '/admin/categories' },
    { icon: AlertTriangle,   label: 'Shikoyatlar',       href: '/admin/disputes',        badge: disputedCount },
    { icon: Bell,            label: 'Xabarnomalar',      href: '/admin/notifications' },
    { icon: MessageSquare,   label: 'Chatlar',           href: '/admin/chats' },
  ];

  const isLinkActive = (item: { href: string; exact?: boolean }): boolean => {
    if (!pathname) return false;
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  if (!isReady) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Yuklanmoqda...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* ─── Desktop Sidebar ─── */}
      <aside
        className="hidden md:flex flex-col w-[240px] fixed inset-y-0 left-0 z-30 border-r"
        style={{
          backgroundColor: 'var(--card-solid)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-3 px-5 h-16 border-b flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              HalQil
            </p>
            <p className="text-[10px] font-medium" style={{ color: 'var(--muted)' }}>
              Admin Panel
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <SidebarSection title="Asosiy">
            {mainItems.map((item) => (
              <SidebarLink key={item.href} item={item} isActive={isLinkActive(item)} />
            ))}
          </SidebarSection>

          <div className="mx-4 my-2 border-t" style={{ borderColor: 'var(--border)' }} />

          <SidebarSection title="Tizim">
            {systemItems.map((item) => (
              <SidebarLink key={item.href} item={item} isActive={isLinkActive(item)} />
            ))}
          </SidebarSection>
        </nav>

        {/* Home Redirect */}
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 8px' }}>
          <Link
            href="/home"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              borderRadius: '8px',
              fontSize: '13px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'var(--sidebar-hover)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            <Home size={16} />
            Asosiy saytga qaytish
          </Link>
        </div>

        {/* User & Logout */}
        <div
          className="p-4 border-t flex-shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: 'var(--text)' }}
              >
                {user?.name || 'Admin'}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                Super Admin
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="btn-ghost p-2 rounded-lg"
              title="Chiqish"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="flex-1 md:ml-[240px] min-h-screen pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>

      {/* ─── Mobile Bottom Tab Bar ─── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 flex items-center"
        style={{
          zIndex: 30,
          backgroundColor: 'var(--card-solid)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {tabItems.map((item) => (
          <MobileTab
            key={item.href}
            item={item as NavItem}
            isActive={isLinkActive(item)}
          />
        ))}

        {/* Ko'proq tugmasi */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 flex-1"
          style={{ color: 'var(--muted)', background: 'transparent', border: 'none' }}
        >
          <Menu size={22} strokeWidth={2} />
          <span className="text-[10px] font-medium">Ko&apos;proq</span>
        </button>
      </nav>

      {/* ─── Bottom Drawer Overlay + Content ─── */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 md:hidden"
            style={{
              zIndex: 40,
              background: 'rgba(0,0,0,0.4)',
            }}
            onClick={() => setDrawerOpen(false)}
          />

          <div
            className="fixed left-0 right-0 md:hidden"
            style={{
              zIndex: 50,
              bottom: 56,
              background: 'var(--card-solid)',
              borderTop: '1px solid var(--border)',
              borderRadius: '16px 16px 0 0',
              padding: '12px 16px 32px',
            }}
          >
        {/* Handle */}
        <div style={{
          width: 36, height: 4,
          background: 'var(--border-strong)',
          borderRadius: 2,
          margin: '0 auto 16px',
        }} />

        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Boshqa bo&apos;limlar
        </p>

        {drawerItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setDrawerOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 8px',
              borderBottom: '0.5px solid var(--border)',
              color: 'var(--text)', textDecoration: 'none',
              fontSize: 14,
            }}
          >
            <item.icon size={18} style={{ color: 'var(--text-secondary)' }} />
            {item.label}
          </Link>
        ))}

        {/* Asosiy saytga qaytish */}
        <Link
          href="/home"
          onClick={() => setDrawerOpen(false)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 8px',
            borderBottom: '0.5px solid var(--border)',
            color: 'var(--text)', textDecoration: 'none',
            fontSize: 14,
          }}
        >
          <Home size={18} style={{ color: 'var(--text-secondary)' }} />
          Asosiy saytga qaytish
        </Link>

        {/* Navigatsiyani sozlash */}
        <button
          onClick={() => { setCustomizeOpen(true); setDrawerOpen(false); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            width: '100%', padding: '12px 8px',
            marginTop: 4,
            borderTop: '0.5px solid var(--border)',
            background: 'transparent', border: 'none',
            color: 'var(--text-secondary)', fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <Settings size={18} />
          Navigatsiyani sozlash
        </button>
      </div>
        </>
      )}

      {/* ─── Customize Modal ─── */}
      {customizeOpen && (
        <div
          className="fixed inset-0 z-[60] md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              zIndex: 70,
              background: 'var(--card)',
              borderRadius: '16px 16px 0 0',
              padding: '16px 16px 40px',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            {/* Handle */}
            <div style={{
              width: 36, height: 4,
              background: 'var(--border-strong)',
              borderRadius: 2, margin: '0 auto 16px',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 16,
            }}>
              <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>
                Navigatsiyani sozlash
              </span>
              <button
                onClick={() => setCustomizeOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>

            {/* Izoh */}
            <p style={{
              fontSize: 12, color: 'var(--text-secondary)',
              marginBottom: 12, lineHeight: 1.5,
            }}>
              Tab-bar da ko&apos;rinadigan bo&apos;limlarni tanlang.
              Maksimal 3 ta (Dashboard doim birinchi).
            </p>

            {/* Items list */}
            {ALL_NAV_ITEMS.filter((x) => x.id !== 'dashboard').map((item) => {
              const isPinned = pinnedIds.includes(item.id);
              const pinnedIndex = pinnedIds.indexOf(item.id);
              const canPin = pinnedIds.length < 3;

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 4px',
                    borderBottom: '0.5px solid var(--border)',
                    opacity: !isPinned && !canPin ? 0.45 : 1,
                  }}
                >
                  <item.icon
                    size={18}
                    style={{ color: 'var(--text-secondary)', flexShrink: 0 }}
                  />

                  <span style={{ flex: 1, fontSize: 14, color: 'var(--text)' }}>
                    {item.label}
                  </span>

                  {/* Yuqori/past tugmalar — faqat pinlangan uchun */}
                  {isPinned && (
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button
                        disabled={pinnedIndex === 0}
                        onClick={() => {
                          const next = [...pinnedIds];
                          [next[pinnedIndex - 1], next[pinnedIndex]] =
                            [next[pinnedIndex], next[pinnedIndex - 1]];
                          setPinnedIds(next);
                        }}
                        style={{
                          background: 'none', border: 'none',
                          cursor: pinnedIndex === 0 ? 'default' : 'pointer',
                          padding: '2px 6px',
                          color: pinnedIndex === 0
                            ? 'var(--border-strong)'
                            : 'var(--text-secondary)',
                        }}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        disabled={pinnedIndex === pinnedIds.length - 1}
                        onClick={() => {
                          const next = [...pinnedIds];
                          [next[pinnedIndex], next[pinnedIndex + 1]] =
                            [next[pinnedIndex + 1], next[pinnedIndex]];
                          setPinnedIds(next);
                        }}
                        style={{
                          background: 'none', border: 'none',
                          cursor: pinnedIndex === pinnedIds.length - 1
                            ? 'default' : 'pointer',
                          padding: '2px 6px',
                          color: pinnedIndex === pinnedIds.length - 1
                            ? 'var(--border-strong)'
                            : 'var(--text-secondary)',
                        }}
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  )}

                  {/* Toggle switch */}
                  <button
                    onClick={() => {
                      if (isPinned) {
                        setPinnedIds(pinnedIds.filter((id) => id !== item.id));
                      } else if (canPin) {
                        setPinnedIds([...pinnedIds, item.id]);
                      }
                    }}
                    style={{
                      width: 36, height: 20, borderRadius: 10,
                      border: 'none',
                      cursor: !isPinned && !canPin ? 'default' : 'pointer',
                      background: isPinned ? 'var(--text)' : 'var(--border-strong)',
                      position: 'relative', transition: 'background .2s',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute', top: 2,
                      left: isPinned ? 18 : 2,
                      width: 16, height: 16, borderRadius: '50%',
                      background: 'white',
                      transition: 'left .2s',
                    }} />
                  </button>
                </div>
              );
            })}

            {/* Tab-bar to'ldi xabari */}
            {pinnedIds.length >= 3 && (
              <p style={{
                fontSize: 11, color: 'var(--text-secondary)',
                textAlign: 'center', marginTop: 12,
              }}>
                Tab-bar to&apos;ldi. Yangi qo&apos;shish uchun birini olib tashlang.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
