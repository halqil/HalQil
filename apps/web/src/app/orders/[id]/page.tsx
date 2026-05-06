"use client";

import { useEffect, useState, useRef } from "react";
import api from "../../../lib/api";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../../lib/store";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";
import { Send, MapPin, Clock, FileText, CheckCircle, XCircle, MessageSquare, AlertTriangle, Info } from "lucide-react";

// ─── Kategoriya labellari ─────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  MY_FAULT: "🔴 Men bajara olmadim",
  CLIENT_ABSENT: "🟡 Mijoz uyda yo'q edi",
  NO_MATERIAL: "🟡 Material/sharoit yo'q edi",
  OTHER: "🟡 Boshqa sabab",
};

export default function OrderDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [order, setOrder] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Record<string, any>[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Finish modal state (provayder uchun)
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishType, setFinishType] = useState<"SUCCESSFUL" | "UNSUCCESSFUL" | null>(null);
  const [unsuccessCategory, setUnsuccessCategory] = useState("MY_FAULT");
  const [unsuccessReason, setUnsuccessReason] = useState("");
  const [finishLoading, setFinishLoading] = useState(false);

  // Dispute modal state (user uchun)
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    fetchOrder();
  }, [id, isAuthenticated, router]);

  useEffect(() => {
    if (order && ["CHATTING", "IN_PROGRESS", "ACCEPTED"].includes(order.status)) {
      const token = localStorage.getItem("accessToken");
      socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", { auth: { token } });
      socketRef.current.emit("join_order", { order_id: id });
      socketRef.current.on("new_message", (msg) => setMessages((prev) => [...prev, msg]));
      return () => { socketRef.current?.disconnect(); };
    }
  }, [order, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
        setMessages(res.data.data.messages || []);
      }
    } catch {
      toast.error("Buyurtma topilmadi");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (action: string, body: Record<string, any> = {}) => {
    try {
      const res = await api.patch(`/orders/${id}/${action}`, body);
      if (res.data.success) {
        toast.success("Holat o'zgartirildi");
        fetchOrder();
      }
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    }
  };

  // Provayder: Finish submit
  const handleFinishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finishType) return;
    setFinishLoading(true);
    try {
      const body: Record<string, any> = { type: finishType };
      if (finishType === "UNSUCCESSFUL") {
        body.category = unsuccessCategory;
        body.reason = unsuccessReason;
      }
      await api.patch(`/orders/${id}/finish`, body);
      toast.success(finishType === "SUCCESSFUL" ? "Muvaffaqiyatli yakunlandi!" : "Muvaffaqiyatsiz yakunlandi");
      setShowFinishModal(false);
      setFinishType(null);
      setUnsuccessReason("");
      fetchOrder();
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    } finally {
      setFinishLoading(false);
    }
  };

  // User: Confirm
  const handleConfirm = async () => {
    setConfirmLoading(true);
    try {
      await api.patch(`/orders/${id}/confirm`, { action: "CONFIRM" });
      toast.success("Tasdiqlandi!");
      fetchOrder();
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    } finally {
      setConfirmLoading(false);
    }
  };

  // User: Dispute submit
  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setConfirmLoading(true);
    try {
      await api.patch(`/orders/${id}/confirm`, { action: "DISPUTE", reason: disputeReason });
      toast.success("Shikoyat yuborildi!");
      setShowDisputeModal(false);
      setDisputeReason("");
      fetchOrder();
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    } finally {
      setConfirmLoading(false);
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;
    socketRef.current.emit("send_message", { order_id: id, content: newMessage, type: "TEXT" });
    setNewMessage("");
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!order) return null;

  const isProvider = user?.role === "PROVIDER" && order.provider?.userId === user.id;

  // ─── Status Banner (user uchun) ──────────────────────────────────────────────
  const renderStatusBanner = () => {
    if (isProvider) return null;

    if (order.status === "AWAITING_CONFIRMATION") {
      if (order.finishType === "SUCCESSFUL") {
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="text-emerald-500" size={20} />
              <span className="font-bold text-emerald-800">Provayder xizmat ko'rsatildi deb belgiladi</span>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                disabled={confirmLoading}
                onClick={handleConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Tasdiqlash
              </button>
              <button
                disabled={confirmLoading}
                onClick={() => setShowDisputeModal(true)}
                className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 border border-red-200 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <AlertTriangle size={18} /> Shikoyat qilish
              </button>
            </div>
          </div>
        );
      }
      if (order.finishType === "UNSUCCESSFUL") {
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="text-orange-500" size={20} />
              <span className="font-bold text-orange-800">Provayder xizmat muvaffaqiyatsiz dedi</span>
            </div>
            {order.unsuccessCategory && (
              <div className="text-sm text-orange-700 mb-1">
                Sabab turi: <strong>{CATEGORY_LABELS[order.unsuccessCategory] || order.unsuccessCategory}</strong>
              </div>
            )}
            {order.unsuccessReason && (
              <div className="text-sm bg-orange-100 rounded-xl p-3 mb-3 text-orange-800">{order.unsuccessReason}</div>
            )}
            <div className="flex gap-2">
              <button
                disabled={confirmLoading}
                onClick={handleConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle size={18} /> Tasdiqlash
              </button>
              <button
                disabled={confirmLoading}
                onClick={() => setShowDisputeModal(true)}
                className="flex-1 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-600 border border-red-200 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2"
              >
                <AlertTriangle size={18} /> Shikoyat qilish
              </button>
            </div>
          </div>
        );
      }
    }

    if (order.status === "DISPUTED") {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-4 flex items-center gap-2">
          <AlertTriangle className="text-yellow-500" size={20} />
          <span className="font-medium text-yellow-800">Shikoyatingiz ko'rib chiqilmoqda. Admin qaror qiladi.</span>
        </div>
      );
    }

    if (order.status === "FAILED") {
      return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="text-red-500" size={20} />
            <span className="font-bold text-red-800">Buyurtma muvaffaqiyatsiz yakunlandi</span>
          </div>
          {order.unsuccessReason && <p className="text-sm text-red-700 mt-1">Sabab: {order.unsuccessReason}</p>}
        </div>
      );
    }

    if (order.status === "COMPLETED") {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 flex items-center gap-2">
          <CheckCircle className="text-emerald-500" size={20} />
          <span className="font-bold text-emerald-800">
            {order.autoCompleted
              ? "✅ Buyurtma avtomatik tasdiqlandi (24 soat javob berilmadi)"
              : "✅ Buyurtma muvaffaqiyatli yakunlandi"}
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Order Details */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Ma'lumotlar</h2>
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
              {order.status}
            </span>
          </div>

          {/* Status banner (user uchun) */}
          {renderStatusBanner()}

          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Xizmat turi</div>
              <div className="font-semibold">{order.skill?.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><FileText size={14} /> Muammo</div>
              <p className="text-sm bg-gray-50 p-3 rounded-lg">{order.description}</p>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><MapPin size={14} /> Manzil</div>
              <div className="text-sm font-medium">{order.address}</div>
            </div>
            {order.preferredDate && (
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Clock size={14} /> Qulay vaqt</div>
                <div className="text-sm font-medium">{new Date(order.preferredDate).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}</div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
            {order.status === "PENDING" && isProvider && (
              <>
                <button onClick={() => handleStatusChange("accept", { message: "Qabul qildim" })} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl">Qabul qilish</button>
                <button onClick={() => handleStatusChange("reject", { reason: "Rad etildi" })} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-xl">Rad etish</button>
              </>
            )}
            {order.status === "PENDING" && !isProvider && (
              <button onClick={() => handleStatusChange("cancel", {})} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-xl">Bekor qilish</button>
            )}
            {order.status === "ACCEPTED" && isProvider && (
              <button onClick={() => handleStatusChange("chat")} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-xl">Chatni boshlash</button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[70vh]">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl">
            <h2 className="text-lg font-bold">
              Chat: {isProvider ? order.user?.name : order.provider?.user?.name}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                <MessageSquare size={48} className="opacity-20" />
                <p>Xabarlar yo'q</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={i} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isMe ? "bg-blue-600 text-white rounded-tr-sm" : "bg-gray-100 text-gray-900 rounded-tl-sm"}`}>
                      <p className="text-sm">{msg.content}</p>
                      <div className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-100">
            {/* Provayder finish tugmalari */}
            {isProvider && ["ACCEPTED", "CHATTING", "IN_PROGRESS"].includes(order.status) && (
              <div className="mb-3">
                <button
                  onClick={() => { setFinishType(null); setShowFinishModal(true); }}
                  className="w-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Xizmat tugatildi
                </button>
              </div>
            )}

            {["PENDING", "COMPLETED", "CANCELLED", "REJECTED", "AWAITING_CONFIRMATION", "DISPUTED", "FAILED"].includes(order.status) ? (
              <div className="text-center text-gray-500 text-sm py-2 bg-gray-50 rounded-xl font-medium">
                Chat aktiv emas ({order.status})
              </div>
            ) : (
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Xabar yozing..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl">
                  <Send size={20} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ───── Provayder Finish Modal ───── */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            {finishType === null && (
              <>
                <h2 className="text-xl font-bold mb-2">Xizmat tugatildimi?</h2>
                <p className="text-gray-500 text-sm mb-6">Natijani tanlang:</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setFinishType("SUCCESSFUL")}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} /> Ha, muvaffaqiyatli ✅
                  </button>
                  <button
                    onClick={() => setFinishType("UNSUCCESSFUL")}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} /> Yo'q, muvaffaqiyatsiz ❌
                  </button>
                </div>
                <button onClick={() => setShowFinishModal(false)} className="w-full mt-3 text-gray-400 hover:text-gray-600 text-sm py-2">Bekor qilish</button>
              </>
            )}

            {finishType === "SUCCESSFUL" && (
              <form onSubmit={handleFinishSubmit}>
                <h2 className="text-xl font-bold mb-1">✅ Muvaffaqiyatli yakunlash</h2>
                <p className="text-sm text-gray-500 mb-5">Mijozga tasdiqlanishi uchun yuboriladi</p>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setFinishType(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Orqaga</button>
                  <button type="submit" disabled={finishLoading} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl font-bold">
                    {finishLoading ? "Yuborilmoqda..." : "Yuborish"}
                  </button>
                </div>
              </form>
            )}

            {finishType === "UNSUCCESSFUL" && (
              <form onSubmit={handleFinishSubmit} className="space-y-4">
                <h2 className="text-xl font-bold mb-1">❌ Muvaffaqiyatsiz yakunlash</h2>
                <p className="text-sm text-gray-500">Sabab va kategoriya kiritilsin</p>
                <div>
                  <label className="block text-sm font-medium mb-2">Sabab kategoriyasi</label>
                  <div className="space-y-2">
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <label key={val} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${unsuccessCategory === val ? "border-red-400 bg-red-50" : "border-gray-200 hover:bg-gray-50"}`}>
                        <input type="radio" name="category" value={val} checked={unsuccessCategory === val} onChange={() => setUnsuccessCategory(val)} className="accent-red-500" />
                        <span className="text-sm font-medium">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sabab matni (majburiy)</label>
                  <textarea
                    required rows={3} value={unsuccessReason} onChange={(e) => setUnsuccessReason(e.target.value)}
                    placeholder="Batafsil tushuntiring..."
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-400 outline-none bg-gray-50"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setFinishType(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Orqaga</button>
                  <button type="submit" disabled={finishLoading} className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl font-bold">
                    {finishLoading ? "Yuborilmoqda..." : "Yuborish"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ───── User Dispute Modal ───── */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-1">🚨 Shikoyat qilish</h2>
            <p className="text-sm text-gray-500 mb-4">Admin ko'rib chiqadi va qaror qiladi</p>
            <form onSubmit={handleDisputeSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Men rozi emasman, chunki...</label>
                <textarea
                  required rows={3} value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Shikoyat sababini batafsil yozing..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-400 outline-none bg-gray-50"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => { setShowDisputeModal(false); setDisputeReason(""); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">Bekor</button>
                <button type="submit" disabled={confirmLoading} className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white rounded-xl font-bold">
                  {confirmLoading ? "Yuborilmoqda..." : "Shikoyat yuborish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
