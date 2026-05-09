"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useRouter } from "next/navigation";
import { Bell, Check, ShieldAlert, CheckCircle, Info, Briefcase, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function NotificationsPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [notifications, setNotifications] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    fetchNotifications();
  }, [isAuthenticated, router]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      if (res.data.success) setNotifications(res.data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const markAsRead = async (id: string, link?: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      if (link) router.push(link);
    } catch (error) { console.error(error); }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success("Barchasi o'qildi");
    } catch (error) { console.error(error); }
  };

  const getIcon = (type: string, title: string) => {
    if (title === 'Yangi buyurtma!') return <Briefcase className="text-emerald-500" size={20} />;
    switch (type) {
      case "WARNING":              return <ShieldAlert className="text-red-500" size={20} />;
      case "APPLICATION_RESPONSE": return <CheckCircle className="text-emerald-500" size={20} />;
      case "SYSTEM":               return <Info className="text-blue-500" size={20} />;
      case "ANNOUNCEMENT":         return <Bell className="text-indigo-500" size={20} />;
      case "DIRECT_MESSAGE":       return <ShieldCheck className="text-indigo-600" size={20} />;
      default:                     return <Bell className="text-gray-500" size={20} />;
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      <div className="flex justify-between items-center glass-card p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
          <Bell className="text-blue-500" /> Bildirishnomalar
        </h1>
        {notifications.some(n => !n.isRead) && (
          <button onClick={markAllAsRead}
            className="btn-ghost text-sm flex items-center gap-2">
            <Check size={16} /> Barchasini o'qish
          </button>
        )}
      </div>

      <div className="glass-card overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={48} className="mx-auto mb-4" style={{ color: "var(--muted)" }} />
            <p className="text-lg" style={{ color: "var(--muted)" }}>Sizda hozircha bildirishnomalar yo'q</p>
          </div>
        ) : (
          <div>
            {notifications.map((n, idx) => {
              const navLink = n.title === 'Yangi buyurtma!' ? '/provider/dashboard' : (n.link || null);
              return (
                <div key={n.id}>
                  <div
                    onClick={() => markAsRead(n.id, navLink || undefined)}
                    className={`p-6 flex items-start gap-4 transition-colors ${navLink ? 'cursor-pointer' : ''} ${
                      !n.isRead ? 'hover:bg-blue-500/5' : 'hover:bg-[var(--sidebar-hover)]'
                    }`}
                    style={{ backgroundColor: !n.isRead ? 'var(--sidebar-active)' : 'transparent' }}
                  >
                    <div className="p-3 rounded-full flex-shrink-0" style={{
                      backgroundColor: !n.isRead ? 'var(--badge-bg)' : 'var(--sidebar-hover)'
                    }}>
                      {getIcon(n.type, n.title)}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className={`text-base ${!n.isRead ? 'font-bold' : 'font-medium'}`} style={{ color: "var(--text)" }}>
                          {n.title}
                        </h3>
                        <span className="text-xs whitespace-nowrap ml-4" style={{ color: "var(--muted)" }}>
                          {new Date(n.createdAt).toLocaleString("uz-UZ")}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: !n.isRead ? "var(--text-secondary)" : "var(--muted)" }}>
                        {n.message}
                      </p>
                      {navLink && !n.isRead && (
                        <span className="mt-2 inline-block text-xs text-blue-500 font-bold">Ko'rish</span>
                      )}
                    </div>

                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                    )}
                  </div>
                  {idx < notifications.length - 1 && <div className="glass-divider mx-4" />}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
