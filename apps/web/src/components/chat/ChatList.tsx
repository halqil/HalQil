"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";
import { useInboxSocket, InboxUpdatePayload } from "@/hooks/useInboxSocket";
import { ChatListItem, ChatListItemType } from "./ChatListItem";
import { ChatFilters } from "./ChatFilters";
import { MessageSquare } from "lucide-react";

interface ChatListProps {
  activeOrderId?: string;
}

function ChatListSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-full bg-[var(--sidebar-hover)] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <div className="h-3 bg-[var(--sidebar-hover)] rounded w-1/3" />
              <div className="h-2 bg-[var(--sidebar-hover)] rounded w-8" />
            </div>
            <div className="h-2 bg-[var(--sidebar-hover)] rounded w-1/4" />
            <div className="h-3 bg-[var(--sidebar-hover)] rounded w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center py-16">
      <div className="w-12 h-12 rounded-full bg-[var(--sidebar-hover)] flex items-center justify-center text-[var(--muted)] mb-3">
        <MessageSquare size={20} />
      </div>
      <p className="text-sm font-medium text-[var(--text)]">Hali suhbatlar yo'q</p>
      <p className="text-xs text-[var(--muted)] mt-1">
        Siz boshlagan suhbatlar bu yerda ko'rinadi.
      </p>
    </div>
  );
}

export function ChatList({ activeOrderId }: ChatListProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [chats, setChats] = useState<ChatListItemType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryId, setCategoryId] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // GET chats with filter
  const fetchChats = useCallback(async (catId: string) => {
    try {
      setLoading(true);
      const url = catId ? `/chats?categoryId=${catId}` : "/chats";
      const res = await api.get(url);
      if (res.data.success) {
        setChats(res.data.data);
      }
    } catch (err) {
      console.error("Suhbatlarni yuklashda xato:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats(categoryId);
  }, [categoryId, fetchChats]);

  // Reset active order's unread count to 0 locally
  useEffect(() => {
    if (activeOrderId) {
      setChats((prev) =>
        prev.map((c) =>
          c.orderId === activeOrderId && c.unreadCount > 0
            ? { ...c, unreadCount: 0 }
            : c
        )
      );
    }
  }, [activeOrderId]);

  // Real-time inbox update handler
  const handleInboxUpdate = useCallback(
    (payload: InboxUpdatePayload) => {
      setChats((prevChats) => {
        const chatIndex = prevChats.findIndex(
          (c) => c.orderId === payload.orderId
        );

        // If not found in the current list, trigger a fresh fetch
        if (chatIndex === -1) {
          fetchChats(categoryId);
          return prevChats;
        }

        const updatedChats = [...prevChats];
        const existingChat = updatedChats[chatIndex];

        const isChatActive = activeOrderId === payload.orderId;
        const isFromMe = payload.senderId === user?.id;

        const newUnreadCount =
          !isChatActive && !isFromMe
            ? existingChat.unreadCount + 1
            : existingChat.unreadCount;

        updatedChats[chatIndex] = {
          ...existingChat,
          lastMessage: payload.lastMessage,
          lastMessageAt: payload.lastMessage.createdAt,
          unreadCount: newUnreadCount,
        };

        // Sort by lastMessageAt desc
        return updatedChats.sort((a, b) => {
          const aTime = a.lastMessageAt
            ? new Date(a.lastMessageAt).getTime()
            : 0;
          const bTime = b.lastMessageAt
            ? new Date(b.lastMessageAt).getTime()
            : 0;
          return bTime - aTime;
        });
      });
    },
    [activeOrderId, user?.id, categoryId, fetchChats]
  );

  // Bind inbox update socket event
  useInboxSocket({
    onInboxUpdate: handleInboxUpdate,
    activeOrderId,
  });

  const handleCategoryChange = (catId: string) => {
    setCategoryId(catId);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
  };

  // Local filter based on search query
  const filteredChats = chats.filter((c) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const matchesName = c.otherParty.name.toLowerCase().includes(query);
    const matchesTopic = c.topic.toLowerCase().includes(query);
    return matchesName || matchesTopic;
  });

  return (
    <div className="flex flex-col h-full bg-[var(--bg)] border-r border-[var(--border)]">
      <ChatFilters
        onCategoryChange={handleCategoryChange}
        onSearchChange={handleSearchChange}
      />

      <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {loading ? (
          <ChatListSkeleton />
        ) : filteredChats.length === 0 ? (
          <EmptyState />
        ) : (
          filteredChats.map((chat) => (
            <ChatListItem
              key={chat.orderId}
              chat={chat}
              isActive={activeOrderId === chat.orderId}
              onClick={() => router.push(`/chats/${chat.orderId}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
