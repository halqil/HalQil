"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useRouter } from "next/navigation";
import { Bell, Check, Trash2, ShieldAlert, CheckCircle, Info } from "lucide-react";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchNotifications();
  }, [isAuthenticated, router]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("Barchasi o'qildi");
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "WARNING": return <ShieldAlert className="text-red-500" />;
      case "APPLICATION_RESPONSE": return <CheckCircle className="text-emerald-500" />;
      case "SYSTEM": return <Info className="text-blue-500" />;
      case "ANNOUNCEMENT": return <Bell className="text-indigo-500" />;
      default: return <Bell className="text-gray-500" />;
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Bell className="text-blue-600" /> Bildirishnomalar
        </h1>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={markAllAsRead}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Check size={16} /> Barchasini o'qish
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Bell size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg">Sizda hozircha bildirishnomalar yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <div 
                key={n.id} 
                className={`p-6 flex items-start gap-4 transition-colors ${!n.isRead ? 'bg-blue-50/30' : 'bg-white hover:bg-gray-50'}`}
              >
                <div className={`p-3 rounded-full ${!n.isRead ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {getIcon(n.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-base font-bold ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {n.title}
                    </h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {new Date(n.createdAt).toLocaleString("uz-UZ")}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${!n.isRead ? 'text-gray-800' : 'text-gray-500'}`}>
                    {n.message}
                  </p>
                  
                  {!n.isRead && (
                    <button 
                      onClick={() => markAsRead(n.id)}
                      className="mt-3 text-xs text-blue-600 font-bold hover:text-blue-800"
                    >
                      O'qildi deb belgilash
                    </button>
                  )}
                </div>
                
                {!n.isRead && (
                  <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
