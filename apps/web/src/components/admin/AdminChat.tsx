"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminChat() {
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await api.get("/admin/chats");
      setChats(res.data.data);
    } catch (e) {
      toast.error("Chatlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const openChat = async (chatId: string) => {
    setActiveChat(chatId);
    try {
      const res = await api.get(`/admin/chats/${chatId}/messages`);
      setMessages(res.data.data);
    } catch (e) {
      toast.error("Xabarlarni yuklashda xatolik");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !newMessage.trim()) return;
    try {
      const res = await api.post(`/admin/chats/${activeChat}/messages`, { content: newMessage });
      setMessages([...messages, res.data.data]);
      setNewMessage("");
    } catch (e) {
      toast.error("Xatolik");
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex h-[600px] overflow-hidden">
      {/* Sidebar - Chats list */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-100 font-bold bg-white">
          Suhbatlar
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <p className="p-4 text-center text-gray-500">Suhbatlar yo'q</p>
          ) : (
            chats.map(chat => (
              <button 
                key={chat.id} 
                onClick={() => openChat(chat.id)}
                className={`w-full text-left p-4 border-b border-gray-100 hover:bg-indigo-50 transition-colors ${activeChat === chat.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
              >
                <div className="font-bold text-gray-900">{chat.targetUser?.name || 'Foydalanuvchi'}</div>
                <div className="text-xs text-gray-500 truncate">@{chat.targetUser?.username}</div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main - Chat window */}
      <div className="w-2/3 flex flex-col">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-gray-100 font-bold bg-white shadow-sm z-10">
              Suhbat (ID: {activeChat.slice(0, 8)})
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.senderId !== chats.find(c => c.id === activeChat)?.targetUserId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl ${m.senderId !== chats.find(c => c.id === activeChat)?.targetUserId ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Xabar yozing..." 
                className="flex-1 border rounded-xl px-4 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">Yuborish</button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 bg-slate-50">
            Suhbatni tanlang
          </div>
        )}
      </div>
    </div>
  );
}
