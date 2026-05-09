"use client";

import Link from "next/link";
import { useAuthStore } from "../lib/store";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Search, Package, Briefcase, Bell, Settings, LogOut, User, Sun, Moon } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import api from "../lib/api";
import Avatar from "./Avatar";

export default function Navbar() {
  const { user, isAuthenticated, logout, setTheme } = useAuthStore();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // Tashqi click da dropdown yopilsin
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hozirgi theme ni aniqlash
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    setIsDark(current === 'dark');

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const t = localStorage.getItem('theme') || 'system';
      if (t === 'system') setIsDark(mq.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Notification count va socket
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

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    router.push("/auth/login");
  };

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    setTheme(newTheme);
    if (isAuthenticated) {
      api.patch('/user/me/settings', { theme: newTheme }).catch(() => {});
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass w-full px-6 py-4 flex items-center justify-between transition-all">
      {/* Logo */}
      <Link
        href="/"
        className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
      >
        HalQil
      </Link>

      <div className="flex items-center gap-4">
        {/* Qidiruv */}
        <Link
          href="/providers"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <Search size={20} />
          <span className="hidden md:inline font-medium">Qidiruv</span>
        </Link>

        {/* Theme toggle ☀️/🌙 */}
        <button
          onClick={handleThemeToggle}
          className="p-2 text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-all"
          title={isDark ? "Yorug' rejim" : "Qorong'u rejim"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            {/* Bildirishnomalar */}
            <Link
              href="/notifications"
              className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
              onClick={() => setUnreadCount(0)}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Buyurtmalar */}
            <Link
              href="/orders"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <Package size={20} />
              <span className="hidden md:inline font-medium">Buyurtmalar</span>
            </Link>

            {/* Provayder */}
            {user?.role === "PROVIDER" && (
              <Link
                href="/provider/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors"
              >
                <Briefcase size={20} />
                <span className="hidden md:inline font-medium">Provayder</span>
              </Link>
            )}

            {/* Admin panel */}
            {user?.role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors"
              >
                <LayoutDashboard size={20} />
                <span className="hidden md:inline font-medium">Admin Panel</span>
              </Link>
            )}

            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 hover:opacity-90 transition-opacity rounded-xl px-2 py-1 hover:bg-gray-100"
              >
                <Avatar name={user?.name} avatar={user?.avatar} size="sm" />
                <span className="hidden md:inline font-medium text-gray-700 max-w-[100px] truncate text-sm">
                  {user?.name}
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50"
                  style={{ boxShadow: '0 20px 40px -12px rgba(0,0,0,0.15)' }}
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-400 truncate">@{user?.username || user?.id?.slice(0, 8)}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <User size={16} className="text-gray-400" />
                    Profilim
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" />
                    Sozlamalar
                  </Link>

                  <div className="h-px bg-gray-100 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
              className="px-4 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
            >
              Kirish
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
            >
              Ro'yxatdan o'tish
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
