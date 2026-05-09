"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "../../components/Avatar";
import {
  Package, Clock, CheckCircle, XCircle, MessageSquare,
  AlertTriangle, Zap, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

export default function Orders() {
  const [orders, setOrders] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  const [confirmModalData, setConfirmModalData] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");
        if (res.data.success) setOrders(res.data.data);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchOrders();
  }, [isAuthenticated, router]);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmModalData) return;
    try {
      const res = await api.patch(`/orders/${confirmModalData.id}/confirm`, { rating, comment });
      if (res.data.success) {
        toast.success("Buyurtma tasdiqlandi!");
        setConfirmModalData(null);
        setOrders(orders.map(o => o.id === confirmModalData.id ? { ...o, status: 'COMPLETED' } : o));
      }
    } catch (error) {
      const err = error as any;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModalOrderId) return;
    setCancelLoading(true);
    try {
      const res = await api.patch(`/orders/${cancelModalOrderId}/cancel`);
      if (res.data.success) {
        toast.success("Buyurtma bekor qilindi");
        setCancelModalOrderId(null);
        setOrders(prev => prev.map(o => o.id === cancelModalOrderId ? { ...o, status: 'CANCELLED' } : o));
      }
    } catch (error) {
      const err = error as any;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'ACCEPTED': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'CHATTING': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      case 'IN_PROGRESS': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      case 'COMPLETED': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'CANCELLED':
      case 'REJECTED': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Kutilmoqda", ACCEPTED: "Qabul qilindi", CHATTING: "Suhbatda",
      IN_PROGRESS: "Jarayonda", COMPLETED: "Yakunlandi", CANCELLED: "Bekor qilindi",
      REJECTED: "Rad etildi", AWAITING_CONFIRMATION: "Tasdiq kutilmoqda",
      DISPUTED: "Nizoli", FAILED: "Muvaffaqiyatsiz"
    };
    return labels[status] || status;
  };

  const getStatusBadge = (order: Record<string, any>) => {
    const { status, finishType, autoCompleted } = order;
    const base = "px-3 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1.5";

    if (status === 'AWAITING_CONFIRMATION') {
      return <span className={`${base} bg-yellow-500/10 text-yellow-600 border-yellow-500/20`}><Clock size={12} /> Tasdiq kutilmoqda</span>;
    }
    if (status === 'DISPUTED') {
      return <span className={`${base} bg-orange-500/10 text-orange-600 border-orange-500/20`}><AlertTriangle size={12} /> Ko'rib chiqilmoqda</span>;
    }
    if (status === 'FAILED') {
      return <span className={`${base} bg-red-500/10 text-red-600 border-red-500/20`}><XCircle size={12} /> Muvaffaqiyatsiz</span>;
    }
    if (status === 'COMPLETED') {
      if (autoCompleted) {
        return <span className={`${base} bg-teal-500/10 text-teal-600 border-teal-500/20`}><Zap size={12} /> Avtomatik yakunlandi</span>;
      }
      return <span className={`${base} bg-emerald-500/10 text-emerald-600 border-emerald-500/20`}><CheckCircle size={12} /> Yakunlandi</span>;
    }
    return <span className={`${base} ${getStatusColor(status)}`}>{getStatusLabel(status)}</span>;
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>;

  return (
    <div className="space-y-8 fade-in">
      <div className="glass-card p-8">
        <h1 className="section-title">Buyurtmalar</h1>
        <p className="section-desc">Barcha joriy va tugallangan buyurtmalar tarixi</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 glass-card">
          <Package className="mx-auto mb-4" size={64} style={{ color: "var(--muted)" }} />
          <p className="text-xl mb-4" style={{ color: "var(--muted)" }}>Hozircha buyurtmalar yo'q</p>
          {user?.role === 'USER' && (
            <Link href="/providers" className="text-blue-500 font-medium hover:underline">Mutaxassis izlash &rarr;</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
            const isProvider = user?.role === 'PROVIDER' && order.provider?.userId === user.id;
            const otherParty = isProvider ? order.user : order.provider?.user;

            return (
              <div key={order.id} className="glass-card p-6 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    {getStatusBadge(order)}
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>{order.skill?.name}</h3>
                  <p className="text-sm line-clamp-2 mb-4" style={{ color: "var(--text-secondary)" }}>{order.description}</p>

                  <div className="flex items-center gap-3 p-3 rounded-xl mb-6" style={{ backgroundColor: "var(--sidebar-hover)" }}>
                    <Avatar name={otherParty?.name} avatar={otherParty?.avatar} size="sm" />
                    <div className="text-sm">
                      <div className="font-medium" style={{ color: "var(--text)" }}>{isProvider ? 'Mijoz' : 'Mutaxassis'}: {otherParty?.name}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link href={`/orders/${order.id}`} className="btn-ghost w-full py-3 font-semibold">
                    <MessageSquare size={18} /> Batafsil & Chat
                  </Link>

                  {!isProvider && order.status === 'PENDING' && (
                    <button onClick={() => setCancelModalOrderId(order.id)} className="btn-danger w-full py-3 font-semibold">
                      <XCircle size={18} /> Bekor qilish
                    </button>
                  )}

                  {!isProvider && order.status === 'AWAITING_CONFIRMATION' && (
                    <button onClick={() => { setConfirmModalData(order); setRating(5); setComment(""); }}
                      className="btn-success w-full py-3 font-semibold">
                      <CheckCircle size={18} /> Tasdiqlash
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModalData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal p-6 w-full max-w-md fade-in">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <CheckCircle className="text-emerald-500" /> Buyurtmani tasdiqlash
            </h2>
            {confirmModalData.isSuccessful === false && (
              <div className="bg-red-500/10 text-red-500 p-3 rounded-xl mb-4 text-sm border border-red-500/20 font-medium">
                Ushbu buyurtma provayder tomonidan muvaffaqiyatsiz deb belgilangan.
              </div>
            )}
            <form onSubmit={handleConfirmOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Baho (1-5)</label>
                <input type="number" min="1" max="5" required value={rating}
                  onChange={e => setRating(parseInt(e.target.value))} className="glass-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Izoh (ixtiyoriy)</label>
                <textarea value={comment} onChange={e => setComment(e.target.value)} className="glass-textarea" rows={3} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setConfirmModalData(null)} className="btn-ghost">Bekor</button>
                <button type="submit" className="btn-success">Tasdiqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal p-6 w-full max-w-sm fade-in">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <XCircle className="text-red-500" /> Bekor qilish
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Buyurtmani bekor qilmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setCancelModalOrderId(null)} className="btn-ghost">Yo'q</button>
              <button onClick={handleCancelOrder} disabled={cancelLoading} className="btn-danger">
                {cancelLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                {cancelLoading ? "Bekor qilinmoqda..." : "Ha, bekor qilish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
