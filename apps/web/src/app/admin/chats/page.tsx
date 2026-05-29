'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { timeAgo } from '@/lib/timeAgo';
import Avatar from '@/components/Avatar';
import { EmptyState } from '@/components/admin/shared/EmptyState';
import { PageHeader } from '@/components/admin/shared/PageHeader';
import type { AdminChatItem, ChatMessage } from '@/components/admin/types';
import { MessageSquare, Send, Plus, Search, ArrowLeft, Loader2, X } from 'lucide-react';

export default function AdminChatsPage() {
  const { user } = useAuthStore();
  const [chats, setChats] = useState<AdminChatItem[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  const [activeChat, setActiveChat] = useState<AdminChatItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);

  // New chat modal
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatUserId, setNewChatUserId] = useState('');
  const [newChatLoading, setNewChatLoading] = useState(false);

  // Mobile view
  const [showChatView, setShowChatView] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // ─── Scroll to bottom ──────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ─── Fetch chats ───────────────────────────────────────────────
  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get('/admin/chats');
      const data = res.data.data ?? res.data ?? [];
      setChats(Array.isArray(data) ? data : []);
    } catch {
      // Silent
    } finally {
      setChatsLoading(false);
    }
  }, []);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  // ─── Chat list polling ─────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  // ─── Fetch messages ────────────────────────────────────────────
  const fetchMessages = useCallback(async (chatId: string) => {
    try {
      const res = await api.get(`/admin/chats/${chatId}/messages`);
      const data = res.data.data ?? res.data ?? [];
      setMessages(Array.isArray(data) ? data : []);
      setTimeout(scrollToBottom, 100);
    } catch {
      toast.error('Xabarlarni yuklashda xatolik');
    }
  }, [scrollToBottom]);

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat) return;
    setMessagesLoading(true);
    fetchMessages(activeChat.id).finally(() => setMessagesLoading(false));
  }, [activeChat, fetchMessages]);

  // ─── Message polling ───────────────────────────────────────────
  useEffect(() => {
    if (!activeChat) return;
    const interval = setInterval(() => fetchMessages(activeChat.id), 3000);
    return () => clearInterval(interval);
  }, [activeChat, fetchMessages]);

  // ─── Send message ──────────────────────────────────────────────
  const handleSend = async () => {
    if (!activeChat || !messageInput.trim()) return;
    setSending(true);
    try {
      await api.post(`/admin/chats/${activeChat.id}/messages`, { content: messageInput.trim() });
      setMessageInput('');
      await fetchMessages(activeChat.id);
      fetchChats();
    } catch {
      toast.error('Xabar yuborishda xatolik');
    } finally {
      setSending(false);
    }
  };

  // ─── Create new chat ──────────────────────────────────────────
  const handleNewChat = async () => {
    if (!newChatUserId.trim()) return;
    setNewChatLoading(true);
    try {
      const res = await api.post('/admin/chats', { targetUserId: newChatUserId.trim() });
      const newChat = res.data.data ?? res.data;
      setShowNewChat(false);
      setNewChatUserId('');
      await fetchChats();
      if (newChat?.id) {
        const chatItem = { ...newChat } as AdminChatItem;
        setActiveChat(chatItem);
        setShowChatView(true);
      }
    } catch {
      toast.error('Chat yaratishda xatolik');
    } finally {
      setNewChatLoading(false);
    }
  };

  // ─── Select chat ──────────────────────────────────────────────
  const selectChat = (chat: AdminChatItem) => {
    setActiveChat(chat);
    setShowChatView(true);
  };

  // ─── Filtered chats ────────────────────────────────────────────
  const filteredChats = searchInput
    ? chats.filter((c) => c.user?.name?.toLowerCase().includes(searchInput.toLowerCase()))
    : chats;

  // ─── Chat List Panel ──────────────────────────────────────────
  const ChatListPanel = () => (
    <div
      className="flex flex-col h-full border-r"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Chatlar</h2>
        <button
          onClick={() => setShowNewChat(true)}
          className="btn-primary p-2 rounded-xl"
          title="Yangi chat"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted)' }} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Qidirish..."
            className="glass-input w-full pl-8 pr-3 py-2 text-sm"
            style={{ color: 'var(--text)' }}
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {chatsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--muted)' }} />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Chatlar topilmadi</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => selectChat(chat)}
              className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left"
              style={{
                backgroundColor: activeChat?.id === chat.id ? 'var(--sidebar-active)' : 'transparent',
                borderBottom: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                if (activeChat?.id !== chat.id) e.currentTarget.style.backgroundColor = 'var(--sidebar-hover)';
              }}
              onMouseLeave={(e) => {
                if (activeChat?.id !== chat.id) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Avatar name={chat.user?.name || ''} avatar={chat.user?.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {chat.user?.name}
                  </p>
                  {chat.lastMessageAt && (
                    <span className="text-[11px] flex-shrink-0 ml-2" style={{ color: 'var(--muted)' }}>
                      {timeAgo(chat.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                    {chat.lastMessage || 'Xabar yo\'q'}
                  </p>
                  {chat.unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex-shrink-0 ml-2">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'var(--sidebar-hover)', color: 'var(--muted)' }}>
                  {chat.user?.role}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  // ─── Chat Window Panel ─────────────────────────────────────────
  const ChatWindowPanel = () => (
    <div className="flex flex-col h-full">
      {!activeChat ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState icon={MessageSquare} title="Chat tanlang" description="Chap paneldan chatni tanlang" />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => { setShowChatView(false); }}
              className="md:hidden btn-ghost p-2 rounded-lg"
            >
              <ArrowLeft size={18} />
            </button>
            <Avatar name={activeChat.user?.name || ''} avatar={activeChat.user?.avatar} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                {activeChat.user?.name}
              </p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'var(--sidebar-hover)', color: 'var(--muted)' }}>
                {activeChat.user?.role}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin" style={{ color: 'var(--muted)' }} />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Hali xabar yo&apos;q</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isAdmin = msg.senderRole === 'SUPER_ADMIN' || msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isAdmin ? 'rounded-br-md' : 'rounded-bl-md'}`}
                      style={{
                        background: isAdmin
                          ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                          : 'var(--card)',
                        color: isAdmin ? 'white' : 'var(--text)',
                        border: isAdmin ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                      <p
                        className="text-[10px] mt-1 text-right"
                        style={{ opacity: 0.7 }}
                      >
                        {timeAgo(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Xabar yozing..."
              className="glass-input flex-1 px-4 py-2.5 text-sm"
              style={{ color: 'var(--text)' }}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !messageInput.trim()}
              className="btn-primary p-2.5 rounded-xl disabled:opacity-40"
            >
              {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="fade-in">
      <div className="md:hidden">
        <PageHeader title="Chatlar" />
      </div>

      <div
        className="glass-card rounded-2xl overflow-hidden"
        style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}
      >
        {/* Desktop: side by side */}
        <div className="hidden md:flex h-full">
          <div className="w-[320px] flex-shrink-0">
            <ChatListPanel />
          </div>
          <div className="flex-1">
            <ChatWindowPanel />
          </div>
        </div>

        {/* Mobile: full screen panels */}
        <div className="md:hidden h-full">
          {showChatView ? (
            <ChatWindowPanel />
          ) : (
            <ChatListPanel />
          )}
        </div>
      </div>

      {/* ─── New Chat Modal ─── */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !newChatLoading && setShowNewChat(false)} />
          <div className="glass-modal fade-in relative w-full max-w-sm p-6 rounded-2xl">
            <button onClick={() => setShowNewChat(false)} disabled={newChatLoading} className="absolute top-4 right-4 btn-ghost p-1.5 rounded-lg disabled:opacity-40">
              <X size={18} />
            </button>

            <h3 className="text-lg font-semibold mb-4 pr-8" style={{ color: 'var(--text)' }}>Yangi chat</h3>

            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Foydalanuvchi ID
            </label>
            <input
              value={newChatUserId}
              onChange={(e) => setNewChatUserId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNewChat()}
              placeholder="Foydalanuvchi ID kiriting"
              className="glass-input w-full px-4 py-2.5 text-sm mb-4"
              style={{ color: 'var(--text)' }}
            />

            <button
              onClick={handleNewChat}
              disabled={newChatLoading || !newChatUserId.trim()}
              className="btn-primary w-full py-2.5 text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {newChatLoading && <Loader2 size={16} className="animate-spin" />}
              Yaratish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
