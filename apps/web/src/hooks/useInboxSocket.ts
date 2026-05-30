"use client";

import { useEffect } from "react";
import { useSocket } from "@/components/SocketProvider";

export interface InboxUpdatePayload {
  orderId: string;
  lastMessage: {
    content: string;
    type: string;
    createdAt: string;
    senderId: string;
  };
  senderId: string;
}

interface UseInboxSocketProps {
  onInboxUpdate: (payload: InboxUpdatePayload) => void;
  activeOrderId?: string;
}

export function useInboxSocket({ onInboxUpdate, activeOrderId }: UseInboxSocketProps) {
  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleInboxUpdate = (payload: InboxUpdatePayload) => {
      onInboxUpdate(payload);
    };

    socket.on("inbox_update", handleInboxUpdate);

    return () => {
      socket.off("inbox_update", handleInboxUpdate);
    };
  }, [socket, onInboxUpdate]);
}
