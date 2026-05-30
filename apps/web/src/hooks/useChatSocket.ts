"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "@/components/SocketProvider";
import { useAuthStore } from "@/lib/store";
import api from "@/lib/api";

interface Message {
  id?: string;
  _temp?: boolean;
  senderId: string;
  content: string;
  type: string;
  createdAt: string;
  sender?: { name: string; avatar: string | null };
}

export function useChatSocket(orderId: string, chatActive: boolean) {
  const { socket } = useSocket();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const joinedRef = useRef(false);

  // join_order va new_message tinglash
  useEffect(() => {
    if (!socket || !chatActive || !orderId) return;

    const joinRoom = () => {
      socket.emit("join_order", { order_id: orderId });
      joinedRef.current = true;
    };

    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    const handleNewMessage = (msg: any) => {
      setMessages((prev) => {
        // ID bo'yicha dedup
        if (msg.id && prev.some((m) => m.id === msg.id)) return prev;
        // Temp xabar bilan match
        const hasTempDuplicate = prev.some(
          (m) =>
            m._temp && m.content === msg.content && m.senderId === msg.senderId
        );
        if (hasTempDuplicate) {
          return prev.map((m) =>
            m._temp && m.content === msg.content && m.senderId === msg.senderId
              ? msg
              : m
          );
        }
        return [...prev, msg];
      });
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("new_message", handleNewMessage);
      joinedRef.current = false;
    };
  }, [socket, chatActive, orderId]);

  // 8s polling fallback (socket uzilganda)
  useEffect(() => {
    if (!chatActive || !orderId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        if (res.data.success) {
          const serverMessages: Message[] = res.data.data.messages || [];
          setMessages((prev) => {
            const realMessages = prev.filter((m) => !m._temp);
            const realIds = new Set(realMessages.map((m) => m.id));
            const newOnes = serverMessages.filter((m) => !realIds.has(m.id));
            if (newOnes.length === 0) return prev;
            return [...serverMessages].sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            );
          });
        }
      } catch {}
    }, 8000);

    return () => clearInterval(pollInterval);
  }, [chatActive, orderId]);

  // sendMessage — optimistic UI
  const sendMessage = useCallback(
    (content: string, type: string = "TEXT") => {
      if (!content.trim() || !socket) return;
      const tempMsg: Message = {
        _temp: true,
        senderId: user?.id || "",
        content: content.trim(),
        createdAt: new Date().toISOString(),
        type,
      };
      setMessages((prev) => [...prev, tempMsg]);
      socket.emit("send_message", {
        order_id: orderId,
        content: content.trim(),
        type,
      });
    },
    [socket, orderId, user?.id]
  );

  // markRead
  const markRead = useCallback(() => {
    if (!socket || !orderId) return;
    socket.emit("read_messages", { order_id: orderId });
  }, [socket, orderId]);

  return { messages, sendMessage, markRead, setMessages };
}
