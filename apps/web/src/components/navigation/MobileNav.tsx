"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Bell, Sun, Moon, Monitor, Menu,
} from "lucide-react";
import NavIcon from "./NavIcon";
import { getNavItems } from "./useNavItems";
import type { User } from "../../lib/store";

type ThemeMode = "light" | "dark" | "system";

interface MobileNavProps {
  user: User;
  notificationCount: number;
  chatUnreadCount: number;
  themeMode: ThemeMode;
  onThemeCycle: () => void;
  onNotificationClick: () => void;
}

export default function MobileNav({
  user,
  notificationCount,
  chatUnreadCount,
  themeMode,
  onThemeCycle,
  onNotificationClick,
}: MobileNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const { bottomItems, topRightItems, moreItems } = getNavItems(user.role);

  /* close popup on outside click */
  useEffect(() => {
    if (!moreOpen) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [moreOpen]);

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

  return (
    <>
      {/* ──────────── Top Bar ──────────── */}
      <header className="mobile-top mobile-only">
        <div className="mobile-top__left">
          <NavIcon
            icon={<Bell size={20} />}
            href="/notifications"
            badge={notificationCount}
            isActive={isActive("/notifications")}
            ariaLabel="Xabarlar"
            onClick={onNotificationClick}
          />
        </div>

        <div className="mobile-top__right">
          {/* Theme toggle */}
          <NavIcon
            icon={themeIcon()}
            onClick={onThemeCycle}
            ariaLabel="Tema"
          />

          {/* Top-right items (Profile + Saveds) */}
          {topRightItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavIcon
                key={item.key}
                icon={<Icon size={20} />}
                href={item.href}
                isActive={isActive(item.href)}
                ariaLabel={item.label}
              />
            );
          })}
        </div>
      </header>

      {/* ──────────── Bottom Bar ──────────── */}
      <nav className="mobile-bottom mobile-only">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`mobile-bottom__item ${
                active ? "mobile-bottom__item--active" : ""
              }`}
            >
              <NavIcon
                icon={<Icon size={20} />}
                badge={item.key === "chats" ? chatUnreadCount : undefined}
                isActive={active}
                ariaLabel={item.label}
              />
              <span className="mobile-bottom__label">{item.label}</span>
            </Link>
          );
        })}

        {/* "Yana" (More) — faqat PROVIDER */}
        {moreItems && (
          <div className="more-trigger" ref={moreRef}>
            <div
              className={`mobile-bottom__item ${moreOpen ? "mobile-bottom__item--active" : ""}`}
              onClick={() => setMoreOpen((p) => !p)}
              role="button"
              tabIndex={0}
              aria-label="Yana"
            >
              <span
                className={`nav-icon ${moreOpen ? "more-icon-open" : ""}`}
                style={{ width: 34, height: 34, transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)" }}
              >
                <Menu size={20} />
              </span>
              <span className="mobile-bottom__label">Yana</span>
            </div>

            {moreOpen && (
              <>
                <div
                  className="more-overlay"
                  onClick={() => setMoreOpen(false)}
                />
                <div className="more-popup">
                  {moreItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        className={`more-popup__item ${
                          active ? "more-popup__item--active" : ""
                        }`}
                        onClick={() => setMoreOpen(false)}
                      >
                        <NavIcon
                          icon={<Icon size={20} />}
                          isActive={active}
                          ariaLabel={item.label}
                        />
                        <span className="more-popup__label">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
