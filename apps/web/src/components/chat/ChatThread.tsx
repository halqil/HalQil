"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { useChatSocket } from "@/hooks/useChatSocket";
import ChatHeader from "./ChatHeader";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { MessageSquare, ChevronDown } from "lucide-react";

const CHAT_ACTIVE_STATUSES = ["ACCEPTED", "CHATTING", "IN_PROGRESS"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Kutilmoqda",
  ACCEPTED: "Qabul qilindi",
  CHATTING: "Muloqotda",
  IN_PROGRESS: "Jarayonda",
  AWAITING_CONFIRMATION: "Tasdiq kutilmoqda",
  COMPLETED: "Yakunlandi",
  FAILED: "Muvaffaqiyatsiz",
  CANCELLED: "Bekor qilindi",
  REJECTED: "Rad etildi",
  DISPUTED: "Shikoyat",
};

interface ChatThreadProps {
  order: any;
}

export default function ChatThread({ order }: ChatThreadProps) {
  const { user } = useAuthStore();
  const chatActive = CHAT_ACTIVE_STATUSES.includes(order.status);

  const { messages, sendMessage, markRead, setMessages } = useChatSocket(
    order.id,
    chatActive
  );

  // Boshlang'ich xabarlarni yuklash
  useEffect(() => {
    if (order.messages) {
      setMessages(order.messages);
    }
  }, [order.id]);

  // ─── Auto-scroll logikasi ──────────────────────────────────
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasNewBelow, setHasNewBelow] = useState(false);
  const prevMsgCountRef = useRef(messages.length);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewBelow(false);
  }, []);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 80;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBottom);
    if (atBottom) setHasNewBelow(false);
  }, []);

  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      if (isAtBottom) {
        scrollToBottom();
      } else {
        setHasNewBelow(true);
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages.length, isAtBottom, scrollToBottom]);

  // Ilk yuklashda pastga scroll
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView();
    }, 100);
  }, [order.id]);

  // Mark read on mount
  useEffect(() => {
    if (chatActive) markRead();
  }, [chatActive, markRead]);

  const isProvider =
    user?.role === "PROVIDER" && order.provider?.userId === user?.id;
  const otherParty = isProvider ? order.user : order.provider?.user;
  const topic = order.skill?.name || "";

  // Mobil aniqlash
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-transparent border-none shadow-none">
      <ChatHeader
        otherParty={otherParty}
        topic={topic}
        isMobile={isMobile}
      />

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative"
      >
        {messages.length === 0 ? (
          <div
            className="flex-1 flex flex-col items-center justify-center gap-2"
            style={{ color: "var(--muted)" }}
          >
            <MessageSquare size={40} className="opacity-20" />
            <p className="text-sm">Xabarlar yo&apos;q</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg.id || `temp-${i}`}
              message={msg}
              isMine={msg.senderId === user?.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Yangi xabar tugmasi */}
      {hasNewBelow && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shadow-lg transition-all btn-primary"
        >
          <ChevronDown size={14} />
          Yangi xabar
        </button>
      )}

      <MessageInput
        onSend={sendMessage}
        disabled={!chatActive}
        disabledReason={STATUS_LABELS[order.status] || order.status}
      />
    </div>
  );
}
