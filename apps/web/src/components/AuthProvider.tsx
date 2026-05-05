"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "../lib/store";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    checkAuth();
    setMounted(true);
  }, [checkAuth]);

  if (!mounted) return null;

  return <>{children}</>;
}
