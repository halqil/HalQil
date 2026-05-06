"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import toast from "react-hot-toast";

export default function Orders() {
  const [orders, setOrders] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  const [confirmModalData, setConfirmModalData] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // Bekor qilish modal
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders");
        if (res.data.success) {
          setOrders(res.data.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [isAuthenticated, router]);

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmModalData) return;
    try {
      const res = await api.patch(`/orders/${confirmModalData.id}/confirm`, {
        rating, comment
      });
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
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ACCEPTED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CHATTING': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': 
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "Kutilmoqda",
      ACCEPTED: "Qabul qilindi",
      CHATTING: "Suhbatda",
      IN_PROGRESS: "Jarayonda",
      COMPLETED: "Yakunlandi",
      CANCELLED: "Bekor qilindi",
      REJECTED: "Rad etildi",
      AWAITING_CONFIRMATION: "Tasdiq kutilmoqda",
      DISPUTED: "Nizoli",
      FAILED: "Muvaffaqiyatsiz"
    };
    return labels[status] || status;
  };

  const getStatusBadge = (order: Record<string, any>) => {
    const { status, finishType, autoCompleted } = order;

    if (status === 'AWAITING_CONFIRMATION') {
      if (finishType === 'UNSUCCESSFUL') {
        return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-orange-100 text-orange-800 border-orange-200">🟡 Tasdiqlash kutilmoqda (muvaffaqiyatsiz)</span>;
      }
      return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-yellow-100 text-yellow-800 border-yellow-200">🟡 Tasdiqlash kutilmoqda</span>;
    }
    if (status === 'DISPUTED') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-orange-100 text-orange-800 border-orange-200">⚠️ Ko'rib chiqilmoqda</span>;
    }
    if (status === 'FAILED') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-red-100 text-red-700 border-red-200">❌ Muvaffaqiyatsiz</span>;
    }
    if (status === 'COMPLETED') {
      if (autoCompleted) {
        return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-teal-100 text-teal-700 border-teal-200">✅ Avtomatik yakunlandi</span>;
      }
      return <span className="px-3 py-1 rounded-full text-xs font-bold border bg-emerald-100 text-emerald-700 border-emerald-200">✅ Yakunlandi</span>;
    }
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(status)}`}>
        {getStatusLabel(status)}
      </span>
    );
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold mb-2">Buyurtmalar</h1>
        <p className="text-gray-500">Barcha joriy va tugallangan buyurtmalar tarixi</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <Package className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-xl text-gray-500 mb-4">Hozircha buyurtmalar yo'q</p>
          {user?.role === 'USER' && (
             <Link href="/providers" className="text-blue-600 font-medium hover:underline">
               Mutaxassis izlash &rarr;
             </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
            const isProvider = user?.role === 'PROVIDER' && order.provider?.userId === user.id;
            const otherParty = isProvider ? order.user : order.provider?.user;

            return (
              <div key={order.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    {getStatusBadge(order)}
                    <span className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg mb-2">{order.skill?.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">{order.description}</p>
                  
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-6">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                       {otherParty?.avatar ? (
                         <img src={otherParty.avatar} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                         <span className="font-bold text-gray-500">{otherParty?.name?.charAt(0)}</span>
                       )}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{isProvider ? 'Mijoz' : 'Mutaxassis'}: {otherParty?.name}</div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Link 
                    href={`/orders/${order.id}`}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={18} />
                    Batafsil & Chat
                  </Link>

                  {/* PENDING → Bekor qilish */}
                  {!isProvider && order.status === 'PENDING' && (
                    <button
                      onClick={() => setCancelModalOrderId(order.id)}
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      Bekor qilish
                    </button>
                  )}

                  {!isProvider && order.status === 'AWAITING_CONFIRMATION' && (
                    <button 
                      onClick={() => { setConfirmModalData(order); setRating(5); setComment(""); }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={18} />
                      Tasdiqlash
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="text-emerald-500" />
              Buyurtmani tasdiqlash
            </h2>
            {confirmModalData.isSuccessful === false && (
              <div className="bg-red-50 text-red-700 p-3 rounded-xl mb-4 text-sm border border-red-200 font-medium">
                Ushbu buyurtma provayder tomonidan muvaffaqiyatsiz deb belgilangan. Tasdiqlaysizmi?
              </div>
            )}
            <form onSubmit={handleConfirmOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Baho (1-5)</label>
                <input 
                  type="number" min="1" max="5" required 
                  value={rating} onChange={e => setRating(parseInt(e.target.value))} 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Izoh (ixtiyoriy)</label>
                <textarea 
                  value={comment} onChange={e => setComment(e.target.value)} 
                  className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none" rows={3}
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setConfirmModalData(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Bekor</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium">Tasdiqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOrderId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <XCircle className="text-red-500" />
              Bekor qilish
            </h2>
            <p className="text-gray-600 text-sm mb-6">Buyurtmani bekor qilmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelModalOrderId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
              >
                Yo'q
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg font-medium"
              >
                {cancelLoading ? "Bekor qilinmoqda..." : "Ha, bekor qilish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
