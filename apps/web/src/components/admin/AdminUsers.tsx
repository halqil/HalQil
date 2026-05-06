"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import {
  Search, ChevronLeft, ChevronRight, Eye, Send,
  Lock, Trash2, X, Users, Wrench,
  ArrowUpDown, CheckCircle, MessageSquare
} from "lucide-react";

type User = {
  id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  username?: string;
  email: string;
  role: string;
  status: string;
  walletId?: string;
  reliability?: number;
  successfulOrders?: number;
  cancelledOrders?: number;
  isOnline: boolean;
  lastSeenAt?: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE:  { label: "Faol",       color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  FROZEN:  { label: "Muzlatilgan", color: "bg-blue-100 text-blue-700 border-blue-200" },
  BLOCKED: { label: "Bloklangan", color: "bg-red-100 text-red-700 border-red-200" },
};

const SORT_OPTIONS = [
  { value: "createdAt|desc", label: "Yangi ro'yxatdan o'tganlar" },
  { value: "createdAt|asc",  label: "Eski ro'yxatdan o'tganlar" },
  { value: "username|asc",   label: "Username (A→Z)" },
  { value: "username|desc",  label: "Username (Z→A)" },
  { value: "email|asc",      label: "Email (A→Z)" },
  { value: "email|desc",     label: "Email (Z→A)" },
  { value: "walletId|asc",   label: "ID raqami (o'sish)" },
  { value: "walletId|desc",  label: "ID raqami (kamayish)" },
];

export default function AdminUsers() {
  const [activeRole, setActiveRole] = useState<"USER" | "PROVIDER">("USER");
  const [users, setUsers]           = useState<User[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]       = useState(false);

  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort]           = useState("createdAt|desc");

  // Modals
  const [viewUser, setViewUser]   = useState<User | null>(null);
  const [notifUser, setNotifUser] = useState<User | null>(null);
  const [notifTitle, setNotifTitle]   = useState("");
  const [notifMsg, setNotifMsg]       = useState("");
  const [notifType, setNotifType]     = useState("SYSTEM");
  const [notifLoading, setNotifLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Chat modal
  const [chatUser, setChatUser]     = useState<User | null>(null);
  const [chatMsg, setChatMsg]       = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [openedChatId, setOpenedChatId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [sortBy, sortOrder] = sort.split("|");
      const res = await api.get("/admin/users", {
        params: { role: activeRole, search: search || undefined, sortBy, sortOrder, page, limit: 20 }
      });
      const d = res.data.data;
      setUsers(d.users);
      setTotal(d.total);
      setTotalPages(d.totalPages);
    } catch {
      toast.error("Foydalanuvchilarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  }, [activeRole, search, sort, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Tab o'zgarganda page reset
  useEffect(() => { setPage(1); setSearchInput(""); setSearch(""); }, [activeRole]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoading(id + "-status");
    try {
      await api.patch(`/admin/users/${id}/status`, { status: newStatus });
      toast.success("Status o'zgartirildi");
      fetchUsers();
    } catch (e) {
      toast.error("Xatolik");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`"${u.name}" ni o'chirasizmi? (Qaytarib bo'lmaydi!)`)) return;
    setActionLoading(u.id + "-del");
    try {
      await api.delete(`/admin/users/${u.id}`);
      toast.success("Foydalanuvchi o'chirildi");
      fetchUsers();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Xatolik");
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatUser || !chatMsg.trim()) return;
    setChatLoading(true);
    try {
      const res = await api.post("/admin/chats", {
        targetUserId: chatUser.id,
        initialMessage: chatMsg.trim()
      });
      toast.success("Chat ochildi!");
      setOpenedChatId(res.data.data.id);
      setChatUser(null);
      setChatMsg("");
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendNotif = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifUser) return;
    setNotifLoading(true);
    try {
      await api.post("/admin/notifications/send", {
        userId: notifUser.id,
        title: notifTitle,
        message: notifMsg,
        type: notifType
      });
      toast.success("Xabar yuborildi!");
      setNotifUser(null);
      setNotifTitle("");
      setNotifMsg("");
      setNotifType("SYSTEM");
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    } finally {
      setNotifLoading(false);
    }
  };

  const pageRange = () => {
    const range: number[] = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Foydalanuvchilarni boshqarish</h2>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            Jami: {total} ta
          </span>
        </div>

        {/* Role tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-5 w-fit">
          <button
            onClick={() => setActiveRole("USER")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeRole === "USER"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Users size={15} /> Foydalanuvchilar
          </button>
          <button
            onClick={() => setActiveRole("PROVIDER")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeRole === "PROVIDER"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Wrench size={15} /> Provayderlar
          </button>
        </div>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="ID, username yoki email bo'yicha qidiring..."
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <ArrowUpDown size={15} className="text-gray-400 flex-shrink-0" />
            <select
              value={sort}
              onChange={e => { setSort(e.target.value); setPage(1); }}
              className="bg-gray-50 border border-gray-200 rounded-xl text-sm px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>Foydalanuvchilar topilmadi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3.5 font-semibold text-gray-600">ID raqami</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600">Username</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600">Ism Familya</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600">Email</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600">Status</th>
                  <th className="px-5 py-3.5 font-semibold text-gray-600">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => {
                  const statusInfo = STATUS_LABELS[u.status] || { label: u.status, color: "bg-gray-100 text-gray-600 border-gray-200" };
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* walletId */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${u.isOnline ? "bg-green-500" : "bg-gray-300"}`}
                            title={u.isOnline ? "Online" : "Offline"}
                          />
                          <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                            {u.walletId || u.id.slice(0, 8) + "…"}
                          </span>
                        </div>
                      </td>

                      {/* username */}
                      <td className="px-5 py-3.5">
                        <span className="text-blue-600 font-semibold">
                          {u.username ? `@${u.username}` : "—"}
                        </span>
                      </td>

                      {/* name */}
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-800">{u.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(u.createdAt).toLocaleDateString("uz-UZ")}
                        </div>
                      </td>

                      {/* email */}
                      <td className="px-5 py-3.5 text-gray-600 max-w-[200px] truncate">
                        {u.email}
                      </td>

                      {/* status */}
                      <td className="px-5 py-3.5">
                        <select
                          value={u.status}
                          onChange={e => handleStatusChange(u.id, e.target.value)}
                          disabled={actionLoading === u.id + "-status"}
                          className={`border rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer focus:outline-none ${statusInfo.color}`}
                        >
                          <option value="ACTIVE">Faol</option>
                          <option value="FROZEN">Muzlatilgan</option>
                          <option value="BLOCKED">Bloklangan</option>
                        </select>
                      </td>

                      {/* actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* Ko'rish */}
                          <button
                            onClick={() => setViewUser(u)}
                            title="Ko'rish"
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                          >
                            <Eye size={15} />
                          </button>

                      {/* Chat ochish */}
                          <button
                            onClick={() => { setChatUser(u); setChatMsg(""); }}
                            title="Chat ochish"
                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                          >
                            <MessageSquare size={15} />
                          </button>

                          {/* Xabar yuborish */}
                          <button
                            onClick={() => { setNotifUser(u); setNotifTitle(""); setNotifMsg(""); setNotifType("SYSTEM"); }}
                            title="Xabar yuborish"
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                          >
                            <Send size={15} />
                          </button>

                          {/* Muzlatish */}
                          {u.status === "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(u.id, "FROZEN")}
                              disabled={actionLoading === u.id + "-status"}
                              title="Muzlatish"
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            >
                              <Lock size={15} />
                            </button>
                          )}

                          {/* Blok ochish */}
                          {u.status !== "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(u.id, "ACTIVE")}
                              disabled={actionLoading === u.id + "-status"}
                              title="Faollashtirish"
                              className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                            >
                              <CheckCircle size={15} />
                            </button>
                          )}

                          {/* O'chirish */}
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={actionLoading === u.id + "-del"}
                            title="O'chirish"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} / {total} ta
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {page > 3 && (
                <>
                  <button onClick={() => setPage(1)} className="w-8 h-8 rounded-lg text-sm hover:bg-gray-100 transition-colors">1</button>
                  {page > 4 && <span className="text-gray-400 px-1">…</span>}
                </>
              )}

              {pageRange().map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  {p}
                </button>
              ))}

              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && <span className="text-gray-400 px-1">…</span>}
                  <button onClick={() => setPage(totalPages)} className="w-8 h-8 rounded-lg text-sm hover:bg-gray-100 transition-colors">{totalPages}</button>
                </>
              )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── View Modal ─── */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-5">
              <h3 className="text-xl font-bold">Profil ma'lumotlari</h3>
              <button onClick={() => setViewUser(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Ism</span>
                <span className="font-semibold">{viewUser.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Username</span>
                <span className="font-semibold text-blue-600">@{viewUser.username || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Email</span>
                <span className="font-semibold">{viewUser.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">ID raqami</span>
                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{viewUser.walletId || "—"}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Rol</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${viewUser.role === "PROVIDER" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : viewUser.role === "SUPER_ADMIN" ? "bg-red-100 text-red-700 border-red-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>{viewUser.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${(STATUS_LABELS[viewUser.status] || { color: "" }).color}`}>{STATUS_LABELS[viewUser.status]?.label || viewUser.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Ishonchlilik</span>
                <span className="font-bold text-blue-600">{Math.round(viewUser.reliability || 100)}%</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Muvaffaqiyatli / Bekor</span>
                <span><span className="text-green-600 font-bold">{viewUser.successfulOrders ?? 0}</span> / <span className="text-red-500 font-bold">{viewUser.cancelledOrders ?? 0}</span></span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Online</span>
                <span className={`flex items-center gap-1 font-semibold ${viewUser.isOnline ? "text-green-600" : "text-gray-400"}`}>
                  <span className={`w-2 h-2 rounded-full ${viewUser.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                  {viewUser.isOnline ? "Online" : "Offline"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">A'zo bo'lgan</span>
                <span className="font-semibold">{new Date(viewUser.createdAt).toLocaleDateString("uz-UZ", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            </div>
            <div className="mt-5 flex justify-between gap-2">
              <a
                href={`/users/${viewUser.id}`}
                target="_blank"
                className="text-sm text-blue-600 hover:underline"
              >
                Ommaviy profilni ko'rish →
              </a>
              <button onClick={() => setViewUser(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium">
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Send Notification Modal ─── */}
      {notifUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-xl font-bold">Xabar yuborish</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  → <span className="font-semibold text-gray-700">{notifUser.name}</span>
                  {notifUser.username && <span className="text-blue-600 ml-1">@{notifUser.username}</span>}
                </p>
              </div>
              <button onClick={() => setNotifUser(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSendNotif} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sarlavha *</label>
                <input
                  type="text"
                  required
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  placeholder="Bildirishnoma sarlavhasi..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xabar *</label>
                <textarea
                  required
                  rows={3}
                  value={notifMsg}
                  onChange={e => setNotifMsg(e.target.value)}
                  placeholder="Xabar matni..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turi</label>
                <select
                  value={notifType}
                  onChange={e => setNotifType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                >
                  <option value="SYSTEM">System</option>
                  <option value="WARNING">Warning</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setNotifUser(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={notifLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <Send size={14} />
                  {notifLoading ? "Yuborilmoqda..." : "Yuborish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Chat Modal ─── */}
      {chatUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h3 className="text-xl font-bold">Chat ochish</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  → <span className="font-semibold text-gray-700">{chatUser.name}</span>
                  {chatUser.username && <span className="text-indigo-600 ml-1">@{chatUser.username}</span>}
                </p>
              </div>
              <button onClick={() => setChatUser(null)} className="text-gray-400 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleOpenChat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Birinchi xabar *</label>
                <textarea
                  required
                  rows={4}
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  placeholder="Foydalanuvchiga birinchi xabarni yozing..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50"
                />
              </div>
              {openedChatId && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm text-emerald-700 flex items-center gap-2">
                  ✅ Chat muvaffaqiyatli ochildi
                </div>
              )}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setChatUser(null); setOpenedChatId(null); }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-medium"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={chatLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <MessageSquare size={14} />
                  {chatLoading ? "Ochilmoqda..." : "Chat ochish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
