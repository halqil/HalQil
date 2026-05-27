"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell, Home, Sun, Moon, Monitor,
  PanelRightOpen, PanelRightClose, LogOut,
} from "lucide-react";
import NavIcon from "./NavIcon";
import { getNavItems } from "./useNavItems";
import type { User } from "../../lib/store";

type ThemeMode = "light" | "dark" | "system";

interface DesktopNavProps {
  user: User;
  notificationCount: number;
  themeMode: ThemeMode;
  onThemeCycle: () => void;
  onNotificationClick: () => void;
  onLogout: () => void;
}

export default function DesktopNav({
  user,
  notificationCount,
  themeMode,
  onThemeCycle,
  onNotificationClick,
  onLogout,
}: DesktopNavProps) {
  const pathname = usePathname();
  const [pinned, setPinned] = useState(false);
  const { sidebarItems } = getNavItems(user.role);

  /* restore pinned state */
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-pinned");
    if (stored === "true") setPinned(true);
  }, []);

  /* sync sidebar width CSS variable */
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      pinned ? "200px" : "60px"
    );
  }, [pinned]);

  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    localStorage.setItem("sidebar-pinned", String(next));
  };

  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home" || pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const themeIcon = () => {
    switch (themeMode) {
      case "light": return <Sun size={20} />;
      case "dark": return <Moon size={20} />;
      case "system": return <Monitor size={20} />;
    }
  };

  const themeLabel = () => {
    switch (themeMode) {
      case "light": return "Yorug' rejim";
      case "dark": return "Qorong'u rejim";
      case "system": return "Tizim rejimi";
    }
  };

  /** Hover label — dynamic for profile/orders/chats/notification */
  const hoverLabel = (key: string, label: string) => {
    switch (key) {
      case "profile": {
        const full = [user.firstName, user.lastName].filter(Boolean).join(" ");
        return full || user.name || label;
      }
      default:
        return label;
    }
  };

  return (
    <>
      {/* ──────────── Notification — top-left ──────────── */}
      <div className="desktop-notif desktop-only">
        <NavIcon
          icon={<Bell size={22} />}
          href="/notifications"
          badge={notificationCount}
          isActive={isActive("/notifications")}
          ariaLabel="Xabarlar"
          onClick={onNotificationClick}
        />
        <span className="desktop-notif__tooltip">
          Xabarlar{notificationCount > 0 ? ` (${notificationCount})` : ""}
        </span>
      </div>

      {/* ──────────── Sidebar — right ──────────── */}
      <aside
        className={`desktop-sidebar desktop-only ${
          pinned ? "desktop-sidebar--pinned" : ""
        }`}
      >
        {/* Tema */}
        <button
          className="desktop-sidebar__item desktop-sidebar__item--link"
          onClick={onThemeCycle}
          aria-label={themeLabel()}
          type="button"
        >
          <span className="nav-icon">
            {themeIcon()}
          </span>
          {pinned && (
            <span className="desktop-sidebar__label">{themeLabel()}</span>
          )}
          <span className="desktop-sidebar__tooltip">{themeLabel()}</span>
        </button>

        <div className="desktop-sidebar__sep" />

        {/* Nav items */}
        {sidebarItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`desktop-sidebar__item desktop-sidebar__item--link ${
                active ? "desktop-sidebar__item--active" : ""
              }`}
            >
              <span className={`nav-icon ${active ? "nav-icon--active" : ""}`}>
                <Icon size={22} />
              </span>
              {pinned && (
                <span className="desktop-sidebar__label">{item.label}</span>
              )}
              <span className="desktop-sidebar__tooltip">
                {hoverLabel(item.key, item.label)}
              </span>
            </Link>
          );
        })}

        <div className="desktop-sidebar__spacer" />

        {/* Logout — faqat pinned holatda */}
        {pinned && (
          <button
            className="desktop-sidebar__logout"
            onClick={onLogout}
            aria-label="Chiqish"
          >
            <LogOut size={18} />
            <span>Chiqish</span>
          </button>
        )}

        {/* Pin toggle */}
        <button
          className={`desktop-sidebar__pin ${pinned ? "desktop-sidebar__pin--end" : ""}`}
          onClick={togglePin}
          aria-label={pinned ? "Sidebarni yopish" : "Sidebarni ochish"}
          title={pinned ? "Sidebarni yopish" : "Sidebarni ochish"}
        >
          {pinned ? (
            <PanelRightClose size={18} />
          ) : (
            <PanelRightOpen size={18} />
          )}
        </button>
      </aside>

      {/* ──────────── Home — bottom-left ──────────── */}
      <Link
        href="/home"
        className={`desktop-home desktop-only ${
          isActive("/home") ? "desktop-home--active" : ""
        }`}
      >
        <span className="nav-icon" style={{ width: 36, height: 36 }}>
          <Home size={22} />
        </span>
        <span className="desktop-home__text">HalQil</span>
      </Link>
    </>
  );
}
