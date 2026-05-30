"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { ChatList } from "@/components/chat/ChatList";

export default function ChatsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hasActiveChat = pathname !== "/chats";

  // Extract activeOrderId from pathname (e.g. /chats/some-id -> some-id)
  const parts = pathname.split("/");
  const activeOrderId = parts.length > 2 && parts[1] === "chats" ? parts[2] : undefined;

  return (
    <div className="w-full h-[calc(100vh-140px)] min-h-[500px] flex overflow-hidden glass-card rounded-2xl border border-[var(--border)] bg-[var(--bg)] shadow-md">
      {/* Desktop Layout */}
      <div className="hidden md:grid md:grid-cols-[340px_1fr] w-full h-full overflow-hidden">
        <div className="h-full overflow-hidden">
          <ChatList activeOrderId={activeOrderId} />
        </div>
        <div className="h-full overflow-hidden bg-[var(--bg-secondary)]">
          {children}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col w-full h-full overflow-hidden">
        {hasActiveChat ? (
          <div className="flex-1 h-full overflow-hidden bg-[var(--bg-secondary)]">
            {children}
          </div>
        ) : (
          <div className="flex-1 h-full overflow-hidden">
            <ChatList activeOrderId={activeOrderId} />
          </div>
        )}
      </div>
    </div>
  );
}
