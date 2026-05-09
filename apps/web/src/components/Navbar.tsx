"use client";

import Link from "next/link";
import { useAuthStore } from "../lib/store";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Search, Package, Briefcase, Bell,
  Settings, LogOut, User, Sun, Moon, Monitor, MessageCircle
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import api from "../lib/api";
import toast from "react-hot-toast";
import Avatar from "./Avatar";

type ThemeMode = "light" | "dark" | "system";

export default function Navbar() {
  const { user, isAuthenticated, logout, setTheme } = useAuthStore();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [supportLoading, setSupportLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Init theme mode from localStorage
  useEffect(() => {
    const stored = (localStorage.getItem("theme") || "system") as ThemeMode;
    setThemeMode(stored);
  }, []);

  // Notification count + socket
  useEffect(() => {
    if (!isAuthenticated) return;

    api.get("/notifications").then(res => {
      if (res.data.success) setUnreadCount(res.data.unreadCount || 0);
    }).catch(() => {});

    const token = localStorage.getItem("accessToken");
    if (token) {
      import("socket.io-client").then(({ io }) => {
        const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
          auth: { token },
        });
        socketRef.current = socket;
        socket.on("new_notification", () => setUnreadCount(prev => prev + 1));
      });
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  const handleSupportClick = async () => {
    if (supportLoading) return;
    setSupportLoading(true);
    try {
      const res = await api.get("/my/admin-chat");
      if (res.data.success && res.data.data) {
        setDropdownOpen(false);
        router.push("/admin-chat");
        return;
      }
    } catch {
      // chat yo'q, yangi yaratamiz
    }
    try {
      await api.post("/my/admin-chat");
      setDropdownOpen(false);
      router.push("/admin-chat");
    } catch {
      toast.error("Qo'llab-quvvatlash chat ochishda xatolik");
    } finally {
      setSupportLoading(false);
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    router.push("/auth/login");
  };

  // Cycling theme: light -> dark -> system -> light
  const handleThemeCycle = () => {
    const cycle: ThemeMode[] = ["light", "dark", "system"];
    const idx = cycle.indexOf(themeMode);
    const next = cycle[(idx + 1) % 3];
    setThemeMode(next);
    setTheme(next);
    if (isAuthenticated) {
      api.patch("/user/me/settings", { theme: next }).catch(() => {});
    }
  };

  const getThemeIcon = () => {
    switch (themeMode) {
      case "light": return <Sun size={20} />;
      case "dark": return <Moon size={20} />;
      case "system": return <Monitor size={20} />;
    }
  };

  const getThemeLabel = () => {
    switch (themeMode) {
      case "light": return "Yorug' rejim";
      case "dark": return "Qorong'u rejim";
      case "system": return "Tizim rejimi";
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass w-full px-6 py-3 flex items-center justify-between">
      {/* Logo */}
      <Link
        href="/"
        className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent"
      >
        HalQil
      </Link>

      <div className="flex items-center gap-3">
        {/* Search */}
        <Link
          href="/providers"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--sidebar-hover)] transition-all"
        >
          <Search size={20} />
          <span className="hidden md:inline font-medium text-sm">Qidiruv</span>
        </Link>

        {/* Theme cycle */}
        <button
          onClick={handleThemeCycle}
          className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--sidebar-hover)] transition-all"
          title={getThemeLabel()}
        >
          {getThemeIcon()}
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--sidebar-hover)] transition-all"
              onClick={() => setUnreadCount(0)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Orders */}
            <Link
              href="/orders"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--sidebar-hover)] transition-all"
            >
              <Package size={20} />
              <span className="hidden md:inline font-medium text-sm">Buyurtmalar</span>
            </Link>

            {/* Provider dashboard */}
            {user?.role === "PROVIDER" && (
              <Link
                href="/provider/dashboard"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-[var(--sidebar-hover)] transition-all"
              >
                <Briefcase size={20} />
                <span className="hidden md:inline font-medium text-sm">Provayder</span>
              </Link>
            )}

            {/* Admin panel */}
            {user?.role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--text-secondary)] hover:text-indigo-500 hover:bg-[var(--sidebar-hover)] transition-all"
              >
                <LayoutDashboard size={20} />
                <span className="hidden md:inline font-medium text-sm">Admin</span>
              </Link>
            )}

            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[var(--sidebar-hover)] transition-all"
              >
                <Avatar name={user?.name} avatar={user?.avatar} size="sm" />
                <span className="hidden md:inline font-medium text-sm max-w-[100px] truncate" style={{ color: "var(--text)" }}>
                  {user?.name}
                </span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                  style={{ color: "var(--muted)" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 glass-dropdown z-50 fade-in">
                  {/* User info */}
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-strong)" }}>
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{user?.name}</p>
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>@{user?.username || user?.id?.slice(0, 8)}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--sidebar-hover)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <User size={16} />
                    Profilim
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--sidebar-hover)]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Settings size={16} />
                    Sozlamalar
                  </Link>

                  <div className="glass-divider mx-2" />

                  <button
                    onClick={handleSupportClick}
                    disabled={supportLoading}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--sidebar-hover)] disabled:opacity-60"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <MessageCircle size={16} />
                    {supportLoading ? "Yuklanmoqda..." : "Qo'llab-quvvatlash"}
                  </button>

                  <div className="glass-divider mx-2" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Chiqish
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="btn-ghost text-sm"
            >
              Kirish
            </Link>
            <Link
              href="/auth/register"
              className="btn-primary text-sm"
            >
              Ro'yxatdan o'tish
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
