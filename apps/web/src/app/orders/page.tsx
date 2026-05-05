"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Clock, CheckCircle, XCircle, MessageSquare } from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

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
      REJECTED: "Rad etildi"
    };
    return labels[status] || status;
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
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

                <Link 
                  href={`/orders/${order.id}`}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare size={18} />
                  Batafsil & Chat
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
