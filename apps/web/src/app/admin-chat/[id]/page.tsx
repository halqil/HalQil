"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import { useAuthStore } from "../../../lib/store";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { Send, ArrowLeft, ShieldCheck } from "lucide-react";

type Message = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; name: string; avatar?: string; role: string };
};

type ChatInfo = {
  id: string;
  admin: { id: string; name: string; avatar?: string; role: string };
  createdAt: string;
};

export default function AdminChatPage() {
  const params = useParams();
  const chatId = params?.id as string;
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [chat, setChat] = useState<ChatInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchData();
  }, [chatId, isAuthenticated]);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/my/admin-chats/${chatId}/messages`);
      setMessages(res.data.data);
    } catch {}
  }, [chatId]);

  const fetchData = async () => {
    try {
      const [chatsRes, msgsRes] = await Promise.all([
        api.get("/my/admin-chats"),
        api.get(`/my/admin-chats/${chatId}/messages`),
      ]);
      const foundChat = chatsRes.data.data.find((c: any) => c.id === chatId);
      if (foundChat) setChat(foundChat);
      setMessages(msgsRes.data.data);
    } catch (e) {
      toast.error("Chat topilmadi");
      router.push("/notifications");
    } finally {
      setLoading(false);
    }
  };

  // Polling
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages, isAuthenticated]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/my/admin-chats/${chatId}/messages`, { content: input.trim() });
      setMessages((prev) => [...prev, res.data.data]);
      setInput("");
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
        <div className="px-5 py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900">
              {(chat as any)?.admin?.name || "Admin"}
            </div>
            <div className="text-xs text-indigo-600 font-medium flex items-center gap-1">
              <ShieldCheck size={11} />
              HalQil Administrator
            </div>
          </div>
        </div>
      </div>

      {/* Chat window */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 260px)", minHeight: 400 }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-slate-50/40">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <ShieldCheck size={40} className="mb-2 opacity-20" />
              <p className="text-sm">Admin hali xabar yozmagan</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
                  {/* Admin avatar */}
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 mb-1">
                      <ShieldCheck size={13} className="text-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-snug ${
                      isMe
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {!isMe && (
                      <div className="text-[10px] font-bold text-indigo-500 mb-0.5">
                        {msg.sender?.name || "Admin"}
                      </div>
                    )}
                    <p>{msg.content}</p>
                    <div className={`text-[10px] mt-1 text-right ${isMe ? "text-indigo-200" : "text-gray-400"}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Javob yozing..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 text-sm"
          >
            <Send size={14} />
            {sending ? "..." : "Yuborish"}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-gray-400 mt-3">
        Bu chat faqat admin bilan maxfiy muloqot uchun
      </p>
    </div>
  );
}
