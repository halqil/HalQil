"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuthStore } from "@/lib/store";
import type { Socket } from "socket.io-client";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
});

export function useSocket() {
  return useContext(SocketContext);
}

export default function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      // logout yoki auth o'zgarganda — disconnect
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Allaqachon ulanish mavjud bo'lsa, qayta ulanmaydi
    if (socketRef.current?.connected) return;

    import("socket.io-client").then(({ io }) => {
      // Eski ulanishni tozalash
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      const socket = io(
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
        {
          auth: { token },
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        }
      );

      socketRef.current = socket;

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
      socket.on("reconnect", () => setConnected(true));
      
      socket.on("reconnect_attempt", () => {
        const freshToken = localStorage.getItem("accessToken");
        if (freshToken) {
          if (socket.auth && typeof socket.auth === "object") {
            (socket.auth as any).token = freshToken;
          } else {
            socket.auth = { token: freshToken };
          }
        }
      });
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}
