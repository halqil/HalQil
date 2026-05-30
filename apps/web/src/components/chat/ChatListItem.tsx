"use client";

import React from "react";
import Avatar from "@/components/Avatar";

export interface ChatListItemType {
  orderId: string;
  status: string;
  otherParty: {
    id: string;
    name: string;
    avatar: string | null;
    isOnline: boolean;
  };
  skill: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  topic: string;
  lastMessage: {
    content: string;
    type: string;
    createdAt: string;
    senderId: string;
  } | null;
  lastMessageAt: string;
  unreadCount: number;
}

interface ChatListItemProps {
  chat: ChatListItemType;
  isActive: boolean;
  onClick: () => void;
}

function formatTimeAgo(dateString?: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Hozirgina";
  if (diffMins < 60) return `${diffMins}m oldin`;
  if (diffHours < 24) return `${diffHours}s oldin`;
  if (diffDays === 1) return "Kecha";
  if (diffDays < 7) return `${diffDays}k oldin`;

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export const ChatListItem = React.memo(function ChatListItem({
  chat,
  isActive,
  onClick,
}: ChatListItemProps) {
  const { otherParty, topic, lastMessage, lastMessageAt, unreadCount } = chat;

  const displayMessage = lastMessage
    ? lastMessage.type === "IMAGE"
      ? "📷 Rasm"
      : lastMessage.content
    : "Hali xabar yo'q";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3.5 flex gap-3 items-center rounded-xl transition-all duration-200 cursor-pointer ${
        isActive
          ? "bg-[var(--sidebar-hover)] border-l-4 border-blue-500 pl-2.5 shadow-sm"
          : "hover:bg-[var(--sidebar-hover)] border-l-4 border-transparent"
      }`}
      style={{
        contentVisibility: "auto",
      }}
    >
      <div className="relative flex-shrink-0">
        <Avatar name={otherParty.name} avatar={otherParty.avatar} size="md" />
        {otherParty.isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[var(--bg)] rounded-full animate-pulse" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-1">
          <span className="font-semibold text-sm text-[var(--text)] truncate">
            {otherParty.name}
          </span>
          <span className="text-[10px] text-[var(--muted)] flex-shrink-0">
            {formatTimeAgo(lastMessageAt)}
          </span>
        </div>

        <div className="text-xs text-blue-500 font-medium truncate mb-0.5">
          {topic}
        </div>

        <div className="flex justify-between items-center gap-2">
          <p className={`text-xs truncate flex-1 ${unreadCount > 0 ? "text-[var(--text)] font-semibold font-bold" : "text-[var(--muted)]"}`}>
            {displayMessage}
          </p>
          {unreadCount > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 min-w-5 h-5 flex items-center justify-center shadow-sm">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

ChatListItem.displayName = "ChatListItem";
