"use client";

import React, { useState, useRef, useEffect } from "react";
import api from "@/lib/api";
import { Send, Bot, Sparkles, User, Loader2, ArrowRight, Mic, Camera } from "lucide-react";
import Link from "next/link";
import { ProviderCard } from "@/components/catalog/ProviderCard";
import { OrganizationCard } from "@/components/catalog/OrganizationCard";

interface Message {
  id: string;
  role: "user" | "bot";
  content: string;
  results?: {
    providers: any[];
    organizations: any[];
  };
}

export default function AiSearchPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      content: "Salom! Men HalQil sun'iy intellekt yordamchisiman. Sizga qanday xizmat kerak? Masalan: 'Uyni tozalash kerak', yoki 'Santexnik qidiryapman' deb yozishingiz mumkin.",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    // Add user message
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.get(`/search/unified?q=${encodeURIComponent(query)}`);
      
      let botContent = "";
      if (res.data.success) {
        const { providers, organizations } = res.data.data;
        const total = (providers?.length || 0) + (organizations?.length || 0);
        
        if (total > 0) {
          botContent = `Qidiruv natijasida ${total} ta mutaxassis va tashkilotlar topildi. Marhamat, quyida tanishib chiqing:`;
        } else {
          botContent = "Kechirasiz, so'rovingiz bo'yicha hech qanday natija topilmadi. Boshqacha so'zlar bilan qidirib ko'ring.";
        }

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "bot",
          content: botContent,
          results: {
            providers: providers || [],
            organizations: organizations || []
          }
        };

        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: "Kechirasiz, tizimda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Santexnik qidiryapman",
    "Uyni to'liq tozalash kerak",
    "Konditsioner o'rnatish",
    "Mebel yig'uvchi usta kerak",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-screen bg-gray-50 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Qidiruv</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-500">Aqlli qidiruv yordamchisi</p>
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">15/15 qoldi</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
              ${msg.role === "user" ? "bg-gray-100 text-gray-600" : "bg-gradient-to-tr from-primary-500 to-indigo-500 text-white"}`}>
              {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
            </div>

            {/* Content */}
            <div className={`flex flex-col gap-3 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-5 py-3.5 rounded-2xl text-[15px] leading-relaxed shadow-sm
                ${msg.role === "user" 
                  ? "bg-primary-600 text-white rounded-tr-sm" 
                  : "bg-white text-gray-800 rounded-tl-sm border border-gray-100"}`}>
                {msg.content}
              </div>

              {/* Results */}
              {msg.results && (msg.results.providers.length > 0 || msg.results.organizations.length > 0) && (
                <div className="w-full mt-2 flex flex-col gap-6">
                  {/* Providers */}
                  {msg.results.providers.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h3 className="text-sm font-bold text-gray-900 px-1">Ustalar</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {msg.results.providers.map(p => (
                          <ProviderCard key={p.id} provider={p} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Organizations */}
                  {msg.results.organizations.length > 0 && (
                    <div className="flex flex-col gap-3">
                      <h3 className="text-sm font-bold text-gray-900 px-1">Tashkilotlar</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {msg.results.organizations.map(org => (
                          <OrganizationCard key={org.id} organization={org} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
              <Bot size={20} />
            </div>
            <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-sm border border-gray-100 shadow-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-100 pb-safe">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => handleSearch(s)}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full text-sm font-medium text-gray-600 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 1000))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSearch(input);
                }
              }}
              placeholder="O'zingizga kerakli xizmatni yozing..."
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none max-h-32 text-gray-900"
              rows={1}
            />
            <button className="absolute left-3 bottom-3 p-1 text-gray-400 hover:text-primary-500 transition-colors">
              <Camera size={20} />
            </button>
            <button className="absolute left-10 bottom-3 p-1 text-gray-400 hover:text-primary-500 transition-colors">
              <Mic size={20} />
            </button>
            <div className="absolute right-3 bottom-4 text-xs text-gray-400 font-medium">
              {input.length}/1000
            </div>
          </div>
          <button
            onClick={() => handleSearch(input)}
            disabled={!input.trim() || loading}
            className="w-14 h-14 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-2xl flex items-center justify-center transition-colors shadow-sm flex-shrink-0"
          >
            {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="ml-1" />}
          </button>
        </div>
      </div>
    </div>
  );
}
