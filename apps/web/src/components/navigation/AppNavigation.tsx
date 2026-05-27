"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/store";
import api from "../../lib/api";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import "./navigation.css";

type ThemeMode = "light" | "dark" | "system";

export default function AppNavigation() {
  const { user, isAuthenticated, setTheme, logout } = useAuthStore();
  const router = useRouter();

  /* ─── Media query ──────────────────────────────────────────────────── */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* ─── Theme ────────────────────────────────────────────────────────── */
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") || "system") as ThemeMode;
    setThemeMode(stored);
  }, []);

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

  /* ─── Notification count + socket ──────────────────────────────────── */
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    api
      .get("/notifications")
      .then((res) => {
        if (res.data.success) setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => {});

    const token = localStorage.getItem("accessToken");
    if (token) {
      import("socket.io-client").then(({ io }) => {
        const socket = io(
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
          { auth: { token } }
        );
        socketRef.current = socket;
        socket.on("new_notification", () =>
          setUnreadCount((prev) => prev + 1)
        );
      });
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  const handleNotificationClick = () => setUnreadCount(0);

  /* ─── Body data attribute for content spacing ──────────────────────── */
  useEffect(() => {
    if (isAuthenticated) {
      document.body.setAttribute("data-nav", "auth");
    } else {
      document.body.removeAttribute("data-nav");
    }
    return () => {
      document.body.removeAttribute("data-nav");
    };
  }, [isAuthenticated]);

  /* ─── Guest nav ────────────────────────────────────────────────────── */
  if (!isAuthenticated) {
    return (
      <nav className="guest-nav">
        <Link href="/" className="guest-nav__logo">
          HalQil
        </Link>
        <div className="guest-nav__actions">
          <Link href="/auth/login" className="btn-ghost text-sm">
            Kirish
          </Link>
          <Link href="/auth/register" className="btn-primary text-sm">
            Ro'yxatdan o'tish
          </Link>
        </div>
      </nav>
    );
  }

  /* ─── Authenticated nav ────────────────────────────────────────────── */
  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const sharedProps = {
    user,
    notificationCount: unreadCount,
    themeMode,
    onThemeCycle: handleThemeCycle,
    onNotificationClick: handleNotificationClick,
    onLogout: handleLogout,
  };

  return isMobile ? (
    <MobileNav {...sharedProps} />
  ) : (
    <DesktopNav {...sharedProps} />
  );
}
