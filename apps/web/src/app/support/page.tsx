"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Send, User, Bot, PhoneCall, ShieldQuestion, HelpCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "admin";
  text: string;
  createdAt: string;
}

export default function SupportPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "admin",
      text: "Salom! HalQil qo'llab-quvvatlash xizmatiga xush kelibsiz. Sizga qanday yordam bera olamiz?",
      createdAt: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
    // TODO: Fetch admin chat messages from API
  }, [isAuthenticated, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: input,
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setSending(true);

    try {
      // TODO: POST /my/admin-chat/messages
      // await api.post("/my/admin-chat/messages", { text: newMsg.text });
      
      // Mock admin response
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: "admin",
          text: "Xabaringiz qabul qilindi. Operator tez orada javob beradi.",
          createdAt: new Date().toISOString()
        }]);
        setSending(false);
      }, 1000);
      
    } catch (error) {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50 max-w-4xl mx-auto border-x border-gray-100">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <ShieldQuestion size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Qo'llab-quvvatlash</h1>
            <p className="text-xs text-green-500 font-medium">Operator onlayn</p>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <PhoneCall size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
              ${msg.sender === "user" ? "bg-gray-200 text-gray-600" : "bg-blue-600 text-white"}`}>
              {msg.sender === "user" ? <User size={16} /> : <HelpCircle size={16} />}
            </div>

            {/* Content */}
            <div className={`flex flex-col max-w-[75%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-4 py-3 rounded-2xl text-[15px] leading-relaxed shadow-sm
                ${msg.sender === "user" 
                  ? "bg-blue-600 text-white rounded-tr-sm" 
                  : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"}`}>
                {msg.text}
              </div>
              <span className="text-xs text-gray-400 mt-1 px-1">
                {new Date(msg.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0 mt-1">
              <HelpCircle size={16} />
            </div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm">
              <Loader2 size={16} className="text-blue-600 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-4 border-t border-gray-100">
        <div className="flex gap-3 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Xabaringizni yozing..."
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 text-gray-900"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="absolute right-2 top-2 bottom-2 w-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm"
          >
            <Send size={20} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
