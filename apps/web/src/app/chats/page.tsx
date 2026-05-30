"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

export default function ChatsPage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-secondary)]">
      <div className="w-16 h-16 rounded-full bg-[var(--sidebar-hover)] flex items-center justify-center text-[var(--muted)] mb-4 shadow-sm">
        <MessageSquare size={28} className="opacity-40 text-[var(--muted)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text)]">Suhbatni tanlang</h3>
      <p className="text-xs text-[var(--muted)] mt-1.5 max-w-xs leading-relaxed">
        Chap tomondagi ro'yxatdan biror suhbatni tanlang yoki xabarlar almashish uchun suhbatga kiring.
      </p>
    </div>
  );
}
