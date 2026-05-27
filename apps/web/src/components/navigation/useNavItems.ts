import {
  User, Package, MessageCircle, Bookmark, Settings,
  LayoutDashboard, Building2, Sliders, Home
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  key: string;
  icon: LucideIcon;
  label: string;
  href: string;
}

/**
 * Foydalanuvchi roliga qarab navigatsiya elementlarini qaytaradi.
 *
 * sidebarItems  — Desktop ong sidebar (yuqoridan pastga)
 * bottomItems   — Mobile pastki bar (chapdan o'ngga)
 * topRightItems — Mobile yuqori o'ng (chapdan o'ngga)
 * moreItems     — PROVIDER "Yana" popup (pastdan yuqoriga)
 */
export function getNavItems(role: string) {
  /* ─── Desktop Sidebar ──────────────────────────────────────────────── */
  const sidebarItems: NavItem[] = [
    { key: "profile", icon: User, label: "Profil", href: "/profile" },
    { key: "orders", icon: Package, label: "Buyurtmalar", href: "/orders" },
    { key: "chats", icon: MessageCircle, label: "Chatlar", href: "/chats" },
    { key: "saveds", icon: Bookmark, label: "Saqlanganlar", href: "/saveds" },
    { key: "settings", icon: Settings, label: "Sozlamalar", href: "/settings" },
  ];

  if (role === "PROVIDER") {
    sidebarItems.push(
      { key: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/provider/dashboard" },
      { key: "tashkilotim", icon: Building2, label: "Tashkilotim", href: "/tashkilotim" },
    );
  }

  if (role === "SUPER_ADMIN") {
    sidebarItems.push(
      { key: "admin", icon: Sliders, label: "Boshqaruv", href: "/admin" },
    );
  }

  /* ─── Mobile Bottom Bar ────────────────────────────────────────────── */
  let bottomItems: NavItem[];
  let moreItems: NavItem[] | null = null;

  if (role === "PROVIDER") {
    bottomItems = [
      { key: "home", icon: Home, label: "Bosh sahifa", href: "/home" },
      { key: "orders", icon: Package, label: "Buyurtmalar", href: "/orders" },
      { key: "chats", icon: MessageCircle, label: "Chatlar", href: "/chats" },
      { key: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/provider/dashboard" },
    ];
    moreItems = [
      { key: "settings", icon: Settings, label: "Sozlamalar", href: "/settings" },
      { key: "tashkilotim", icon: Building2, label: "Tashkilotim", href: "/tashkilotim" },
    ];
  } else if (role === "SUPER_ADMIN") {
    bottomItems = [
      { key: "home", icon: Home, label: "Bosh sahifa", href: "/home" },
      { key: "orders", icon: Package, label: "Buyurtmalar", href: "/orders" },
      { key: "chats", icon: MessageCircle, label: "Chatlar", href: "/chats" },
      { key: "admin", icon: Sliders, label: "Boshqaruv", href: "/admin" },
      { key: "settings", icon: Settings, label: "Sozlamalar", href: "/settings" },
    ];
  } else {
    // USER
    bottomItems = [
      { key: "home", icon: Home, label: "Bosh sahifa", href: "/home" },
      { key: "orders", icon: Package, label: "Buyurtmalar", href: "/orders" },
      { key: "chats", icon: MessageCircle, label: "Chatlar", href: "/chats" },
      { key: "settings", icon: Settings, label: "Sozlamalar", href: "/settings" },
    ];
  }

  /* ─── Mobile Top-Right ─────────────────────────────────────────────── */
  const topRightItems: NavItem[] = [
    { key: "profile", icon: User, label: "Profil", href: "/profile" },
    { key: "saveds", icon: Bookmark, label: "Saqlanganlar", href: "/saveds" },
  ];

  return { sidebarItems, bottomItems, topRightItems, moreItems };
}
