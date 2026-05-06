"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/store";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { Send, ArrowLeft, Loader2, ShieldCheck, User as UserIcon } from "lucide-react";

type AdminChatMessage = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
};

export default function AdminChatPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchChat();
  }, [isAuthenticated, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Polling as a fallback if real-time socket isn't specifically set up for AdminChat yet
  useEffect(() => {
    if (!chatInfo) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [chatInfo]);

  const fetchChat = async () => {
    try {
      const res = await api.get("/my/admin-chat");
      if (res.data.success && res.data.data) {
        setChatInfo(res.data.data);
        await fetchMessages();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await api.get("/my/admin-chat/messages");
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setSending(true);
    try {
      const res = await api.post("/my/admin-chat", { message: newMessage.trim() });
      if (res.data.success) {
        setNewMessage("");
        await fetchChat(); // this will set chatInfo and fetch messages
      }
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatInfo) return;

    setSending(true);
    try {
      const res = await api.post(`/my/admin-chat/messages`, { content: newMessage.trim() });
      if (res.data.success) {
        setMessages(prev => [...prev, res.data.data]);
        setNewMessage("");
      }
    } catch (error) {
      toast.error("Xabar yuborishda xatolik");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (chatInfo) {
        handleSendMessage(e as any);
      } else {
        handleStartChat(e as any);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 h-[calc(100vh-200px)]">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 leading-tight">Mijozlarni qo'llab-quvvatlash</h2>
            <p className="text-xs text-gray-500">HalQil Admin</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      {!chatInfo ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50/50">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mb-4">
            <ShieldCheck size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Hali muloqot yo'q</h3>
          <p className="text-gray-500 text-center max-w-sm mb-8">
            Admin bilan bog'lanish uchun pastdagi maydonga xabaringizni yozing. Biz tez orada sizga javob beramiz.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg, i) => {
            const isMe = msg.senderId === user?.id;
            const showAvatar = i === messages.length - 1 || messages[i + 1]?.senderId !== msg.senderId;
            
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 group`}>
                {!isMe && (
                  <div className="w-8 h-8 flex-shrink-0 flex items-end">
                    {showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                        {msg.sender?.avatar ? (
                          <img src={`http://localhost:5000${msg.sender.avatar}`} alt="Admin" className="w-full h-full object-cover" />
                        ) : (
                          <ShieldCheck size={16} />
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && showAvatar && (
                    <span className="text-xs text-gray-400 mb-1 ml-1">{msg.sender.name || 'Admin'}</span>
                  )}
                  <div 
                    className={`px-4 py-2.5 rounded-2xl relative ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <span className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'mr-1' : 'ml-1'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100 shrink-0">
        <form 
          onSubmit={chatInfo ? handleSendMessage : handleStartChat} 
          className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
        >
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Xabar yozing..."
            className="flex-1 max-h-32 min-h-[44px] bg-transparent resize-none border-none focus:ring-0 text-sm py-3 px-3 outline-none"
            rows={1}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-1" />}
          </button>
        </form>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Enter - yuborish, Shift+Enter - yangi qator
        </p>
      </div>
    </div>
  );
}
