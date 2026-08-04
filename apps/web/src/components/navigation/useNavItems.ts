import {
  User, Package, MessageCircle, Bookmark, Settings,
  LayoutDashboard, Building2, Sliders, Home, Sparkles, HelpCircle, Wallet, Grid
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
    { key: "home", icon: Home, label: "Bosh sahifa", href: "/home" },
    { key: "ai-search", icon: Sparkles, label: "AI Qidiruv", href: "/ai-search" },
    { key: "catalog", icon: Grid, label: "Katalog", href: "/catalog" },
    { key: "orders", icon: Package, label: "Buyurtmalar", href: "/orders" },
    { key: "chats", icon: MessageCircle, label: "Chatlar", href: "/chat" },
  ];

  if (role === "PROVIDER") {
    sidebarItems.push(
      { key: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/provider/dashboard" },
      { key: "wallet", icon: Wallet, label: "Hamyon", href: "/provider/wallet" },
      { key: "tashkilot", icon: Building2, label: "Tashkilot", href: "/provider/organization" },
      { key: "provider_profile", icon: User, label: "Usta Profili", href: "/provider/profile" },
      { key: "provider_settings", icon: Settings, label: "Usta Sozlamalari", href: "/provider/settings" }
    );
  } else {
    // Normal users have profile and settings here, providers have their own
    sidebarItems.push(
      { key: "profile", icon: User, label: "Profil", href: "/profile" },
      { key: "settings", icon: Settings, label: "Sozlamalar", href: "/settings" }
    );
  }

  // Everyone gets support at the bottom
  sidebarItems.push({ key: "support", icon: HelpCircle, label: "Yordam", href: "/support" });

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
      { key: "ai-search", icon: Sparkles, label: "AI", href: "/ai-search" },
      { key: "wallet", icon: Wallet, label: "Hamyon", href: "/provider/wallet" },
    ];
    moreItems = [
      { key: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/provider/dashboard" },
      { key: "chats", icon: MessageCircle, label: "Chatlar", href: "/chat" },
      { key: "catalog", icon: Grid, label: "Katalog", href: "/catalog" },
      { key: "tashkilot", icon: Building2, label: "Tashkilot", href: "/provider/organization" },
      { key: "provider_profile", icon: User, label: "Usta Profili", href: "/provider/profile" },
      { key: "provider_settings", icon: Settings, label: "Sozlamalar", href: "/provider/settings" },
      { key: "support", icon: HelpCircle, label: "Yordam", href: "/support" }
    ];
  } else if (role === "SUPER_ADMIN") {
    bottomItems = [
      { key: "home", icon: Home, label: "Bosh sahifa", href: "/home" },
      { key: "orders", icon: Package, label: "Buyurtmalar", href: "/orders" },
      { key: "ai-search", icon: Sparkles, label: "AI", href: "/ai-search" },
      { key: "admin", icon: Sliders, label: "Boshqaruv", href: "/admin" },
      { key: "settings", icon: Settings, label: "Sozlamalar", href: "/settings" },
    ];
  } else {
    // USER
    bottomItems = [
      { key: "home", icon: Home, label: "Bosh", href: "/home" },
      { key: "catalog", icon: Grid, label: "Katalog", href: "/catalog" },
      { key: "ai-search", icon: Sparkles, label: "AI", href: "/ai-search" },
      { key: "chats", icon: MessageCircle, label: "Chatlar", href: "/chat" },
    ];
  }

  /* ─── Mobile Top-Right ─────────────────────────────────────────────── */
  const topRightItems: NavItem[] = [
    { key: "profile", icon: User, label: "Profil", href: "/profile" },
    { key: "saveds", icon: Bookmark, label: "Saqlanganlar", href: "/saveds" },
  ];

  return { sidebarItems, bottomItems, topRightItems, moreItems };
}
