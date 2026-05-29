"use client";
import { usePathname } from "next/navigation";
import AppNavigation from "@/components/navigation/AppNavigation";

export default function NavWrapper() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <AppNavigation />;
}
