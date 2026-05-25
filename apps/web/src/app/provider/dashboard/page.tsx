"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { useAuthStore } from "../../../lib/store";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Briefcase, MessageSquare, CheckCircle, XCircle, Clock, Search, ShieldAlert,
  Building, MapPin, User, ChevronRight, Calendar
} from "lucide-react";
import Avatar from "../../../components/Avatar";

export default function ProviderDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [orders, setOrders] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Profile state
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [bio, setBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);

  // Status state
  const [status, setStatus] = useState("AVAILABLE");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Schedule state
  const [schedules, setSchedules] = useState<Record<string, any>[]>([]);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  // Modal state — Accept / Reject
  const [acceptModal, setAcceptModal] = useState<{ orderId: string } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ orderId: string } | null>(null);
  const [acceptMessage, setAcceptMessage] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "PROVIDER") {
      router.push("/");
      return;
    }
    fetchOrders();
    fetchProfile();
  }, [isAuthenticated, user, router]);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/provider/profile");
      if (res.data.success) {
        const p = res.data.data;
        setProfile(p);
        setBio(p.bio || "");
        setStatus(p.availabilityStatus || "AVAILABLE");
      }

      const schedRes = await api.get("/provider/schedule");
      if (schedRes.data.success) {
        setSchedules(schedRes.data.data);
      }
    } catch (error) {
      console.error("Profile fetch error", error);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await api.patch("/provider/availability", { status: newStatus });
      if (res.data.success) {
        setStatus(newStatus);
        toast.success("Status yangilandi");
      }
    } catch (err) {
      toast.error("Xatolik");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateBio = async () => {
    try {
      const res = await api.patch("/provider/bio", { bio });
      if (res.data.success) {
        toast.success("Bio yangilandi");
        setIsEditingBio(false);
        setProfile({ ...profile, bio });
      }
    } catch (err) {
      toast.error("Xatolik");
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const res = await api.post("/provider/schedule", { schedules });
      if (res.data.success) {
        toast.success("Jadval saqlandi");
        setIsEditingSchedule(false);
        setSchedules(res.data.data);
      }
    } catch (err) {
      toast.error("Xatolik");
    }
  };

  const handleScheduleChange = (dayIndex: number, field: string, value: any) => {
    setSchedules(prev => {
      const newS = [...prev];
      const existingIdx = newS.findIndex(s => s.dayOfWeek === dayIndex);
      if (existingIdx >= 0) {
        newS[existingIdx] = { ...newS[existingIdx], [field]: value };
      } else {
        newS.push({ dayOfWeek: dayIndex, openTime: "09:00", closeTime: "18:00", isActive: true, [field]: value });
      }
      return newS;
    });
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/orders");
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      toast.error(error.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleOrderAction = async (orderId: string, action: string, body: Record<string, any> = {}) => {
    setActionLoading(true);
    try {
      const res = await api.patch(`/orders/${orderId}/${action}`, body);
      if (res.data.success) {
        toast.success(`Buyurtma holati o'zgardi!`);
        fetchOrders();
        if (action === 'chat') {
          router.push(`/orders/${orderId}`);
        }
      }
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAdminChat = async () => {
    try {
      const res = await api.post("/my/admin-chat");
      if (res.data.success) {
        router.push("/admin-chat");
      }
    } catch (error) {
      toast.error("Admin chat ochishda xatolik");
    }
  };

  const handleAcceptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptModal) return;
    await handleOrderAction(acceptModal.orderId, 'accept', { message: acceptMessage });
    setAcceptModal(null);
    setAcceptMessage("");
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal) return;
    await handleOrderAction(rejectModal.orderId, 'reject', { reason: rejectReason });
    setRejectModal(null);
    setRejectReason("");
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "pending": return orders.filter(o => o.status === "PENDING");
      case "active": return orders.filter(o => ["ACCEPTED", "CHATTING", "AWAITING_CONFIRMATION"].includes(o.status));
      case "completed": return orders.filter(o => o.status === "COMPLETED");
      case "cancelled": return orders.filter(o => ["REJECTED", "CANCELLED", "DISPUTED"].includes(o.status));
      default: return orders;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full text-xs font-bold">Kutilmoqda</span>;
      case 'ACCEPTED': return <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-xs font-bold">Qabul qilingan</span>;
      case 'CHATTING': return <span className="bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full text-xs font-bold">Jarayonda (Chat)</span>;
      case 'AWAITING_CONFIRMATION': return <span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-xs font-bold">Tasdiq kutilmoqda</span>;
      case 'COMPLETED': return <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-xs font-bold">Yakunlangan</span>;
      case 'REJECTED': return <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold">Rad etilgan</span>;
      case 'CANCELLED': return <span className="bg-gray-500/10 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">Bekor qilingan</span>;
      case 'DISPUTED': return <span className="bg-red-500/10 text-red-500 px-3 py-1 rounded-full text-xs font-bold">Nizoli</span>;
      default: return <span className="bg-gray-500/10 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  const filteredOrders = getFilteredOrders();

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 p-8 rounded-3xl text-white shadow-lg">
        <div>
          <h1 className="text-3xl font-bold mb-2">Provayder Dashboard</h1>
          <p className="text-emerald-100">Buyurtmalaringiz va faoliyatingizni boshqaring</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleOpenAdminChat} className="bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all backdrop-blur-sm border border-white/20">
            <MessageSquare size={18} /> Yordam
          </button>
          <Link href="/profile" className="bg-white/20 hover:bg-white/30 px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all backdrop-blur-sm border border-white/20">
            <User size={18} /> Profil
          </Link>
          <Link href="/organizations" className="bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm">
            <Building size={18} /> Tashkilotlar
          </Link>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar */}
        <div className="w-full md:w-80 flex-shrink-0 space-y-4">
          <div className="glass-card p-6 mb-6">
            <h3 className="font-bold mb-4 text-lg" style={{ color: "var(--text)" }}>Mening Holatim</h3>
            <div className="flex gap-2 mb-6">
              {(['AVAILABLE', 'BUSY'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => handleUpdateStatus(s)}
                  disabled={updatingStatus}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    status === s
                      ? (s === 'AVAILABLE' ? 'bg-emerald-600 text-white' : 'bg-yellow-500 text-white')
                      : ''
                  }`}
                  style={status !== s ? { backgroundColor: "var(--sidebar-hover)", color: "var(--text-secondary)" } : undefined}
                >
                  {s === 'AVAILABLE' ? "Bo'sh" : 'Band'}
                </button>
              ))}
            </div>

            {profile?.status === 'APPROVED' && (
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold" style={{ color: "var(--text)" }}>Bio</h4>
                  <button onClick={() => setIsEditingBio(!isEditingBio)} className="text-xs text-blue-500 font-bold">
                    {isEditingBio ? "Bekor qilish" : "Tahrirlash"}
                  </button>
                </div>
                {isEditingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bio} onChange={e => setBio(e.target.value)}
                      className="glass-textarea"
                      rows={3}
                    ></textarea>
                    <button onClick={handleUpdateBio} className="w-full btn-primary rounded-xl py-2 text-sm font-bold">Saqlash</button>
                  </div>
                ) : (
                  <p className="text-sm p-3 rounded-xl" style={{ color: "var(--text-secondary)", backgroundColor: "var(--sidebar-hover)" }}>{profile?.bio || "Bio kiritilmagan"}</p>
                )}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold" style={{ color: "var(--text)" }}>Ish jadvali</h4>
                <button onClick={() => setIsEditingSchedule(!isEditingSchedule)} className="text-xs text-blue-500 font-bold">
                  {isEditingSchedule ? "Bekor qilish" : "Tahrirlash"}
                </button>
              </div>

              {isEditingSchedule ? (
                <div className="space-y-3">
                  {DAYS.map((day, i) => {
                    const s = schedules.find(x => x.dayOfWeek === i) || { isActive: false, openTime: "09:00", closeTime: "18:00" };
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm p-2 rounded-xl" style={{ backgroundColor: "var(--sidebar-hover)" }}>
                        <input type="checkbox" checked={s.isActive} onChange={e => handleScheduleChange(i, 'isActive', e.target.checked)} className="rounded text-blue-500" />
                        <span className="w-20 font-medium" style={{ color: "var(--text)" }}>{day.substring(0,3)}</span>
                        <input type="time" value={s.openTime} disabled={!s.isActive} onChange={e => handleScheduleChange(i, 'openTime', e.target.value)} className="w-20 px-1 border rounded text-xs" style={{ borderColor: "var(--border-strong)", backgroundColor: "var(--bg)" }} />
                        <span style={{ color: "var(--text-secondary)" }}>-</span>
                        <input type="time" value={s.closeTime} disabled={!s.isActive} onChange={e => handleScheduleChange(i, 'closeTime', e.target.value)} className="w-20 px-1 border rounded text-xs" style={{ borderColor: "var(--border-strong)", backgroundColor: "var(--bg)" }} />
                      </div>
                    )
                  })}
                  <button onClick={handleSaveSchedule} className="w-full btn-primary rounded-xl py-2 text-sm font-bold mt-2">Jadvalni saqlash</button>
                </div>
              ) : (
                <div className="space-y-1 text-sm p-3 rounded-xl" style={{ backgroundColor: "var(--sidebar-hover)" }}>
                  {schedules.length === 0 ? <span className="italic" style={{ color: "var(--muted)" }}>Jadval kiritilmagan</span> : DAYS.map((day, i) => {
                    const s = schedules.find(x => x.dayOfWeek === i);
                    if (!s || !s.isActive) return null;
                    return <div key={i} className="flex justify-between"><span className="font-medium" style={{ color: "var(--text-secondary)" }}>{day}:</span> <span style={{ color: "var(--text)" }}>{s.openTime} - {s.closeTime}</span></div>
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-4">
            <nav className="space-y-1">
              {[
                { id: "all", label: "Barcha buyurtmalar", count: orders.length, icon: <Briefcase size={18} /> },
                { id: "pending", label: "Yangi so'rovlar", count: orders.filter(o => o.status === "PENDING").length, icon: <Clock size={18} /> },
                { id: "active", label: "Faol buyurtmalar", count: orders.filter(o => ["ACCEPTED", "CHATTING", "AWAITING_CONFIRMATION"].includes(o.status)).length, icon: <MessageSquare size={18} /> },
                { id: "completed", label: "Bajarilgan", count: orders.filter(o => o.status === "COMPLETED").length, icon: <CheckCircle size={18} /> },
                { id: "cancelled", label: "Bekor qilingan", count: orders.filter(o => ["REJECTED", "CANCELLED", "DISPUTED"].includes(o.status)).length, icon: <XCircle size={18} /> },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all font-medium ${activeTab === tab.id ? "bg-emerald-500/10 text-emerald-500" : ""}`}
                  style={activeTab !== tab.id ? { color: "var(--text-secondary)" } : undefined}
                >
                  <span className="flex items-center gap-3">{tab.icon} {tab.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? "bg-emerald-500/20 text-emerald-500 font-bold" : "bg-gray-500/10"}`} style={activeTab !== tab.id ? { color: "var(--muted)" } : undefined}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "var(--sidebar-hover)" }}>
                <Search size={32} style={{ color: "var(--muted)" }} />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>Buyurtmalar topilmadi</h3>
              <p style={{ color: "var(--text-secondary)" }}>Ushbu bo'limda hozircha hech qanday buyurtma yo'q.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="glass-card p-6 hover:shadow-md transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    {/* Status + Meta */}
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusBadge(order.status)}
                      {order.organization && (
                        <span className="bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                          <Building size={12} /> {order.organization.name} orqali
                        </span>
                      )}
                      <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted)" }}>
                        <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
                      </span>
                    </div>

                    {/* Skill + Description */}
                    <h3 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}>{order.skill?.name || "Noma'lum xizmat"}</h3>
                    <p className="mb-4" style={{ color: "var(--text-secondary)" }}>{order.description}</p>

                    {/* Info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl mb-4 text-sm" style={{ backgroundColor: "var(--sidebar-hover)" }}>
                      {/* Mijoz */}
                      <div>
                        <span className="block mb-1 text-xs" style={{ color: "var(--muted)" }}>Mijoz:</span>
                        <a
                          href={`/users/${order.user?.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-500 hover:underline flex items-center gap-2"
                        >
                          <Avatar name={order.user?.name} avatar={order.user?.avatar} size="xs" />
                          {order.user?.name}
                        </a>
                      </div>
                      {/* Manzil */}
                      <div>
                        <span className="block mb-1 text-xs" style={{ color: "var(--muted)" }}>Manzil:</span>
                        <div className="font-semibold flex items-center gap-1" style={{ color: "var(--text)" }}>
                          <MapPin size={14} className="text-red-500" /> {order.address}
                        </div>
                      </div>
                      {/* Qulay vaqt */}
                      {order.preferredDate && (
                        <div className="sm:col-span-2">
                          <span className="block mb-1 text-xs" style={{ color: "var(--muted)" }}>Qulay vaqt:</span>
                          <div className="font-semibold flex items-center gap-1" style={{ color: "var(--text)" }}>
                            <Calendar size={14} className="text-blue-500" />
                            {new Date(order.preferredDate).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[150px] mt-4 md:mt-0 pt-4 md:pt-0" style={{ borderTop: "none" }}>
                    {order.status === "PENDING" && (
                      <>
                        <button
                          disabled={actionLoading}
                          onClick={() => setAcceptModal({ orderId: order.id })}
                          className="w-full btn-success px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <CheckCircle size={16} /> Qabul qilish
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleOrderAction(order.id, 'chat')}
                          className="w-full btn-primary px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <MessageSquare size={16} /> Chat ochish
                        </button>
                        <button
                          disabled={actionLoading}
                          onClick={() => setRejectModal({ orderId: order.id })}
                          className="w-full btn-danger px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          <XCircle size={16} /> Rad etish
                        </button>
                      </>
                    )}

                    {order.status === "ACCEPTED" && (
                      <button onClick={() => handleOrderAction(order.id, "chat")} disabled={actionLoading} className="w-full btn-primary px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                        <MessageSquare size={16} /> Chat ochish
                      </button>
                    )}

                    {order.status === "CHATTING" && (
                      <button onClick={() => router.push(`/orders/${order.id}`)} disabled={actionLoading} className="w-full btn-success px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                        <CheckCircle size={16} /> Buyurtma sahifasiga o'tish
                      </button>
                    )}

                    {["ACCEPTED", "CHATTING"].includes(order.status) && (
                      <Link href={`/orders/${order.id}`} className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-center">
                        <MessageSquare size={16} /> Buyurtma sahifasi
                      </Link>
                    )}

                    {["COMPLETED", "CANCELLED", "REJECTED", "AWAITING_CONFIRMATION", "DISPUTED"].includes(order.status) && (
                      <Link href={`/orders/${order.id}`} className="w-full btn-ghost px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-center">
                        Tafsilotlar <ChevronRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ───── Accept Modal ───── */}
      {acceptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal fade-in p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}><CheckCircle size={20} className="inline text-emerald-500 mr-1" />Buyurtmani qabul qilish</h2>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Mijozga yuboriladi</p>
            <form onSubmit={handleAcceptSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Qabul qilish xabari</label>
                <textarea
                  required
                  rows={3}
                  value={acceptMessage}
                  onChange={e => setAcceptMessage(e.target.value)}
                  placeholder="Masalan: Qabul qildim, tez orada bog'lanaman!"
                  className="glass-textarea"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setAcceptModal(null); setAcceptMessage(""); }}
                  className="btn-ghost px-4 py-2 rounded-xl font-medium"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-success px-5 py-2 rounded-xl font-bold disabled:opacity-60"
                >
                  {actionLoading ? "Yuborilmoqda..." : "Yuborish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Reject Modal ───── */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal fade-in p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-1" style={{ color: "var(--text)" }}><XCircle size={20} className="inline text-red-500 mr-1" />Buyurtmani rad etish</h2>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Sabab mijozga yuboriladi</p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Rad etish sababi</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Masalan: Ushbu kunda bandman..."
                  className="glass-textarea"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setRejectModal(null); setRejectReason(""); }}
                  className="btn-ghost px-4 py-2 rounded-xl font-medium"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-danger px-5 py-2 rounded-xl font-bold disabled:opacity-60"
                >
                  {actionLoading ? "Yuborilmoqda..." : "Rad etish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
