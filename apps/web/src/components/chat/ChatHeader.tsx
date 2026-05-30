"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";

interface ChatHeaderProps {
  otherParty: {
    id: string;
    name: string;
    avatar: string | null;
    isOnline?: boolean;
  } | null;
  topic: string;
  isMobile?: boolean;
}

export default function ChatHeader({
  otherParty,
  topic,
  isMobile = false,
}: ChatHeaderProps) {
  const router = useRouter();

  return (
    <div
      className="p-4 flex items-center gap-3 flex-shrink-0"
      style={{ borderBottom: "1px solid var(--border-strong)" }}
    >
      {/* Mobilda orqaga tugma */}
      {isMobile && (
        <button
          onClick={() => router.push("/chats")}
          className="flex-shrink-0 p-1 rounded-lg transition-colors hover:bg-blue-500/10"
          style={{ color: "var(--text)" }}
        >
          <ChevronLeft size={20} />
        </button>
      )}

      {otherParty && (
        <Avatar name={otherParty.name} avatar={otherParty.avatar} size="sm" />
      )}

      <div className="flex-1 min-w-0">
        <div
          className="font-semibold text-sm truncate"
          style={{ color: "var(--text)" }}
        >
          {otherParty?.name || "—"}
        </div>
        <div className="flex items-center gap-1.5">
          {otherParty?.isOnline !== undefined && (
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                otherParty.isOnline ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />
          )}
          <span className="text-xs truncate" style={{ color: "var(--muted)" }}>
            {topic}
          </span>
        </div>
      </div>
    </div>
  );
}
