"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Sun, Moon, Monitor } from "lucide-react";
import { useAuthStore } from "../../lib/store";
import api from "../../lib/api";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import { useSocket } from "@/components/SocketProvider";
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
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const pathname = usePathname();

  // Global socketdan foydalanamiz (SocketProvider orqali)
  const { socket } = useSocket();

  useEffect(() => {
    if (!isAuthenticated) return;

    api
      .get("/notifications")
      .then((res) => {
        if (res.data.success) setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    const handler = () => setUnreadCount((prev) => prev + 1);
    socket.on("new_notification", handler);

    return () => {
      socket.off("new_notification", handler);
    };
  }, [socket]);

  const handleNotificationClick = () => setUnreadCount(0);

  /* ─── Chat unread count logic ───────────────────────────────────────── */
  // Fetch total unread count from database on mount, auth change, or pathname transition
  useEffect(() => {
    if (!isAuthenticated) return;

    api
      .get("/chat")
      .then((res) => {
        if (res.data.success) {
          const totalUnread = res.data.data.reduce(
            (sum: number, chat: any) => sum + (chat.unreadCount || 0),
            0
          );
          setChatUnreadCount(totalUnread);
        }
      })
      .catch(() => {});
  }, [isAuthenticated, pathname]);

  // Listen to incoming real-time inbox updates to increment unread count dynamically
  useEffect(() => {
    if (!socket) return;

    const handleInboxUpdate = (payload: any) => {
      // Extract activeOrderId from current pathname
      const parts = pathname?.split("/") || [];
      const activeOrderId = parts.length > 2 && parts[1] === "chats" ? parts[2] : undefined;

      const isChatActive = activeOrderId === payload.orderId;
      const isFromMe = payload.senderId === user?.id;

      // Only increment if we aren't viewing the chat and it wasn't sent by us
      if (!isChatActive && !isFromMe) {
        setChatUnreadCount((prev) => prev + 1);
      }
    };

    socket.on("inbox_update", handleInboxUpdate);

    return () => {
      socket.off("inbox_update", handleInboxUpdate);
    };
  }, [socket, pathname, user?.id]);

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
    const guestThemeIcon = () => {
      switch (themeMode) {
        case "light": return <Sun size={18} />;
        case "dark": return <Moon size={18} />;
        case "system": return <Monitor size={18} />;
      }
    };

    const guestThemeLabel = () => {
      switch (themeMode) {
        case "light": return "Yorug' rejim";
        case "dark": return "Qorong'u rejim";
        case "system": return "Tizim rejimi";
      }
    };

    return (
      <nav className="guest-nav">
        <Link href="/" className="guest-nav__logo">
          HalQil
        </Link>
        <div className="guest-nav__actions">
          <button
            onClick={handleThemeCycle}
            className="guest-nav__theme-btn"
            aria-label={guestThemeLabel()}
            title={guestThemeLabel()}
          >
            {guestThemeIcon()}
          </button>
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
    chatUnreadCount,
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
