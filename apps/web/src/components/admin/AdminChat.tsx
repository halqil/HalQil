"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { MessageSquare, Send, X, Users, Wrench, Clock, ChevronRight } from "lucide-react";

type Message = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: { id: string; name: string; avatar?: string; role: string };
};

type Chat = {
  id: string;
  targetUserId: string;
  targetUser: {
    id: string;
    name: string;
    username?: string;
    walletId?: string;
    role: string;
    isOnline: boolean;
    avatar?: string;
  };
  messages: Message[];
  _count?: { messages: number };
  createdAt: string;
};

// Chat oynasi alohida komponent
function ChatWindow({
  chat,
  onClose,
}: {
  chat: Chat;
  onClose: () => void;
}) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/admin/chats/${chat.id}/messages`);
      setMessages(res.data.data);
    } catch {
      toast.error("Xabarlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [chat.id]);

  useEffect(() => {
    fetchMessages();
    // 5 soniyada bir yangilash (real-time simulation)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/admin/chats/${chat.id}/messages`, { content: input.trim() });
      setMessages((prev) => [...prev, res.data.data]);
      setInput("");
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm flex-shrink-0">
            {chat.targetUser.name?.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-gray-900 text-sm leading-tight">{chat.targetUser.name}</div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${chat.targetUser.isOnline ? "bg-green-500" : "bg-gray-300"}`}
              />
              {chat.targetUser.isOnline ? "Online" : "Offline"}
              {chat.targetUser.username && <span>· @{chat.targetUser.username}</span>}
              {chat.targetUser.walletId && (
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                  {chat.targetUser.walletId}
                </span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
            Hali xabar yo'q
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[72%] px-4 py-2.5 rounded-2xl text-sm ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
                  }`}
                >
                  {!isMe && (
                    <div className="text-[10px] font-semibold text-indigo-500 mb-0.5">
                      {msg.sender?.name}
                    </div>
                  )}
                  <p className="leading-snug">{msg.content}</p>
                  <div className={`text-[10px] mt-1 ${isMe ? "text-indigo-200" : "text-gray-400"}`}>
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
          placeholder="Xabar yozing..."
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
  );
}

export default function AdminChat() {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get("/admin/chats");
      const fetchedChats: Chat[] = res.data.data;
      
      // Sort by latest message
      const sortedChats = fetchedChats.sort((a, b) => {
        const timeA = a.messages?.[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : new Date(a.createdAt).getTime();
        const timeB = b.messages?.[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
      
      setChats(sortedChats);
    } catch {
      toast.error("Chatlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const openChat = async (chat: Chat) => {
    setActiveChat(chat);
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 620 }}>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col bg-gray-50/60">
          <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare size={18} className="text-indigo-500" />
              Admin chatlar
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Jami: {chats.length} ta chat</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center text-gray-400 py-10 text-sm px-4">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
                Hali chat yo'q
              </div>
            ) : (
              chats.map((chat) => {
                const lastMsg = chat.messages?.[0];
                const isActive = activeChat?.id === chat.id;
                // Bizda 'isRead' maydoni bo'lmagani uchun oxirgi xabar adminnikimas bo'lsa uni bold qilamiz
                const isUnreadByAdmin = lastMsg && lastMsg.senderId !== user?.id && !isActive;
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => openChat(chat)}
                    className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-indigo-50/60 transition-colors flex items-center gap-3 ${
                      isActive ? "bg-indigo-50 border-l-2 border-l-indigo-600" : ""
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                        {chat.targetUser?.name?.charAt(0)}
                      </div>
                      <span
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                          chat.targetUser?.isOnline ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800 text-sm truncate">
                          {chat.targetUser?.name}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">
                            {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {chat.targetUser?.role === "PROVIDER" ? (
                          <span className="text-emerald-600 font-medium">Provayder</span>
                        ) : (
                          <span className="text-blue-600 font-medium">User</span>
                        )}
                        {chat.targetUser?.username && ` · @${chat.targetUser.username}`}
                      </div>
                      {lastMsg && (
                        <div className={`text-xs truncate mt-0.5 ${isUnreadByAdmin ? 'font-bold text-gray-900' : 'text-gray-400'}`}>
                          {lastMsg.senderId === user?.id ? "Siz: " : ""}{lastMsg.content}
                        </div>
                      )}
                    </div>
                    {isUnreadByAdmin && <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />}
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0 ml-1" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat window */}
        <div className="flex-1 flex flex-col min-w-0">
          {activeChat ? (
            <ChatWindow
              chat={activeChat}
              onClose={() => setActiveChat(null)}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50/30">
              <MessageSquare size={48} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">Chatni tanlang</p>
              <p className="text-xs mt-1 text-gray-300">Chap paneldagi suhbatni bosing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
