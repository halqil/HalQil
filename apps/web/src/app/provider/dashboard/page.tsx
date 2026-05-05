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
      // By default it should return orders where the provider is assigned.
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

  const handleOrderAction = async (orderId: string, action: string) => {
    try {
      let body = {};
      if (action === 'reject') {
        const reason = prompt("Rad etish sababini kiriting:");
        if (!reason) return;
        body = { rejection_reason: reason };
      }
      
      const res = await api.patch(`/orders/${orderId}/${action}`, body);
      if (res.data.success) {
        toast.success(`Buyurtma holati o'zgardi!`);
        fetchOrders();
      }
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    }
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
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">Kutilmoqda</span>;
      case 'ACCEPTED': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">Qabul qilingan</span>;
      case 'CHATTING': return <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">Jarayonda (Chat)</span>;
      case 'AWAITING_CONFIRMATION': return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold border border-orange-200">Tasdiq kutilmoqda</span>;
      case 'COMPLETED': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Yakunlangan</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Rad etilgan</span>;
      case 'CANCELLED': return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">Bekor qilingan</span>;
      case 'DISPUTED': return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Nizoli</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  const filteredOrders = getFilteredOrders();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-emerald-600 to-teal-700 p-8 rounded-3xl text-white shadow-lg">
        <div>
          <h1 className="text-3xl font-bold mb-2">Provayder Dashboard</h1>
          <p className="text-emerald-100">Buyurtmalaringiz va faoliyatingizni boshqaring</p>
        </div>
        <div className="flex gap-3">
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
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
            <h3 className="font-bold text-gray-900 mb-4 text-lg">Mening Holatim</h3>
            <div className="flex gap-2 mb-6">
              {['AVAILABLE', 'BUSY', 'OFFLINE'].map(s => (
                <button
                  key={s}
                  onClick={() => handleUpdateStatus(s)}
                  disabled={updatingStatus}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    status === s 
                      ? (s === 'AVAILABLE' ? 'bg-emerald-600 text-white' : s === 'BUSY' ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-white')
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {s === 'AVAILABLE' ? 'Bo\'sh' : s === 'BUSY' ? 'Band' : 'Offline'}
                </button>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-900">Bio</h4>
                <button onClick={() => setIsEditingBio(!isEditingBio)} className="text-xs text-blue-600 font-bold">
                  {isEditingBio ? "Bekor qilish" : "Tahrirlash"}
                </button>
              </div>
              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea 
                    value={bio} onChange={e => setBio(e.target.value)} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    rows={3}
                  ></textarea>
                  <button onClick={handleUpdateBio} className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-bold">Saqlash</button>
                </div>
              ) : (
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">{profile?.bio || "Bio kiritilmagan"}</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-900">Ish jadvali</h4>
                <button onClick={() => setIsEditingSchedule(!isEditingSchedule)} className="text-xs text-blue-600 font-bold">
                  {isEditingSchedule ? "Bekor qilish" : "Tahrirlash"}
                </button>
              </div>
              
              {isEditingSchedule ? (
                <div className="space-y-3">
                  {DAYS.map((day, i) => {
                    const s = schedules.find(x => x.dayOfWeek === i) || { isActive: false, openTime: "09:00", closeTime: "18:00" };
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-xl">
                        <input type="checkbox" checked={s.isActive} onChange={e => handleScheduleChange(i, 'isActive', e.target.checked)} className="rounded text-blue-600" />
                        <span className="w-20 font-medium">{day.substring(0,3)}</span>
                        <input type="time" value={s.openTime} disabled={!s.isActive} onChange={e => handleScheduleChange(i, 'openTime', e.target.value)} className="w-20 px-1 border rounded bg-white text-xs" />
                        <span>-</span>
                        <input type="time" value={s.closeTime} disabled={!s.isActive} onChange={e => handleScheduleChange(i, 'closeTime', e.target.value)} className="w-20 px-1 border rounded bg-white text-xs" />
                      </div>
                    )
                  })}
                  <button onClick={handleSaveSchedule} className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-bold mt-2">Jadvalni saqlash</button>
                </div>
              ) : (
                <div className="space-y-1 text-sm bg-gray-50 p-3 rounded-xl">
                  {schedules.length === 0 ? <span className="text-gray-500 italic">Jadval kiritilmagan</span> : DAYS.map((day, i) => {
                    const s = schedules.find(x => x.dayOfWeek === i);
                    if (!s || !s.isActive) return null;
                    return <div key={i} className="flex justify-between"><span className="font-medium text-gray-700">{day}:</span> <span className="text-gray-900">{s.openTime} - {s.closeTime}</span></div>
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
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
                  className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all font-medium ${activeTab === tab.id ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <span className="flex items-center gap-3">{tab.icon} {tab.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? "bg-emerald-200 text-emerald-800 font-bold" : "bg-gray-100 text-gray-500"}`}>
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
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-gray-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Buyurtmalar topilmadi</h3>
              <p className="text-gray-500">Ushbu bo'limda hozircha hech qanday buyurtma yo'q.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusBadge(order.status)}
                      {order.organization && (
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-medium border border-indigo-100 flex items-center gap-1">
                          <Building size={12} /> {order.organization.name} orqali
                        </span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} /> {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-1">{order.skill?.name || "Noma'lum xizmat"}</h3>
                    <p className="text-gray-600 mb-4">{order.description}</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl mb-4 text-sm">
                      <div>
                        <span className="text-gray-500 block mb-1 text-xs">Mijoz:</span>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {order.user?.name}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 block mb-1 text-xs text-xs">Manzil:</span>
                        <div className="font-semibold text-gray-900 flex items-center gap-1">
                          <MapPin size={14} className="text-red-500" /> {order.address}
                        </div>
                      </div>
                      {order.preferredTime && (
                         <div className="sm:col-span-2">
                            <span className="text-gray-500 block mb-1 text-xs">Qulay vaqt:</span>
                            <div className="font-semibold text-gray-900 flex items-center gap-1">
                               <Calendar size={14} className="text-blue-500" /> {order.preferredTime}
                            </div>
                         </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[140px] mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0">
                    {order.status === "PENDING" && (
                      <>
                        <button onClick={() => handleOrderAction(order.id, "accept")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                          <CheckCircle size={16} /> Qabul qilish
                        </button>
                        <button onClick={() => handleOrderAction(order.id, "reject")} className="w-full bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                          <XCircle size={16} /> Rad etish
                        </button>
                      </>
                    )}

                    {order.status === "ACCEPTED" && (
                      <button onClick={() => handleOrderAction(order.id, "open-chat")} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                        <MessageSquare size={16} /> Chat ochish
                      </button>
                    )}

                    {order.status === "CHATTING" && (
                      <button onClick={() => handleOrderAction(order.id, "complete")} className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                        <CheckCircle size={16} /> Ishni yakunlash
                      </button>
                    )}

                    {["ACCEPTED", "CHATTING"].includes(order.status) && (
                      <Link href={`/orders/${order.id}`} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-center">
                        <MessageSquare size={16} /> Buyurtma sahifasi
                      </Link>
                    )}

                    {["COMPLETED", "CANCELLED", "REJECTED", "AWAITING_CONFIRMATION", "DISPUTED"].includes(order.status) && (
                      <Link href={`/orders/${order.id}`} className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-center">
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
    </div>
  );
}
