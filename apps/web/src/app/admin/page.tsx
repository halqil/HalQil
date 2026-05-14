"use client";

import { useEffect, useState } from "react";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import {
  CheckCircle, XCircle, Users, LayoutList, Plus, ChevronDown,
  ChevronRight, ToggleLeft, ToggleRight, X, Folder, Wrench, Loader2, Building,
  MessageSquare, Bell, AlertTriangle, User
} from "lucide-react";

import AdminUsers from "../../components/admin/AdminUsers";
import AdminNotifications from "../../components/admin/AdminNotifications";
import AdminChat from "../../components/admin/AdminChat";
import AdminApplications from "../../components/admin/AdminApplications";
import AdminDisputes from "../../components/admin/AdminDisputes";
import AdminCategories from "../../components/admin/AdminCategories";


interface Skill {
  id: string;
  name: string;
  isActive: boolean;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  icon?: string;
  isActive: boolean;
  skills: Skill[];
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("categories");
  const [orgApplications, setOrgApplications] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<Record<string, any>[]>([]);


  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    if (user?.role !== "SUPER_ADMIN") { toast.error("Ruxsat etilmagan"); router.push("/"); return; }
    fetchAll();
  }, [isAuthenticated, user, router]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [orgAppsRes, disputesRes] = await Promise.all([
        api.get("/admin/organizations/applications"),
        api.get("/admin/orders/disputed", { params: { status: "DISPUTED" } })
      ]);
      setOrgApplications(orgAppsRes.data.data);
      const dData = disputesRes.data.data;
      setDisputes(dData.orders ?? dData ?? []);
    } catch (err) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };


  const handleOrgApplication = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      let body = {};
      if (action === "reject") {
        const reason = prompt("Rad etish sababini kiriting:");
        if (!reason) { setActionLoading(null); return; }
        body = { rejection_note: reason };
      }
      const res = await api.post(`/admin/organizations/applications/${id}/${action}`, body);
      if (res.data.success) {
        toast.success(`Tashkilot arizasi ${action === "approve" ? "tasdiqlandi" : "rad etildi"}`);
        fetchAll();
      }
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      toast.error(error.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };




  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
    </div>
  );

  const tabs = [
    { key: "categories",       label: "Kategoriyalar",      icon: <LayoutList size={16} /> },
    { key: "applications",     label: "Provayder arizalari", icon: <Users size={16} /> },
    { key: "org_applications", label: `Tashkilot (${orgApplications.filter(a => a.status === "PENDING").length})`, icon: <Building size={16} /> },
    { key: "disputes",         label: `Shikoyatlar (${disputes.length})`, icon: <AlertTriangle size={16} /> },
    { key: "users",            label: "Foydalanuvchilar",   icon: <User size={16} /> },
    { key: "chat",             label: "Chatlar",            icon: <MessageSquare size={16} /> },
    { key: "notifications",    label: "Xabarnoma",          icon: <Bell size={16} /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-indigo-900 text-white p-8 rounded-3xl shadow-lg">
        <h1 className="text-3xl font-bold mb-1">Boshqaruv Paneli</h1>
        <p className="text-indigo-200 text-sm">Kategoriyalar, xizmatlar va arizalar</p>
      </div>

      {/* Tabs */}
      <div className="glass-tabs flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`glass-tab ${activeTab === tab.key ? "active" : ""}`}
          >
            {tab.icon} <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CATEGORIES TAB */}
      {activeTab === "categories" && <AdminCategories />}

      {/* ORG APPLICATIONS TAB */}
      {activeTab === "org_applications" && (
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold mb-6" style={{ color: "var(--text)" }}>Tashkilot yaratish arizalari</h2>
          {orgApplications.length === 0 ? (
            <p className="text-center py-10" style={{ color: "var(--muted)" }}>Arizalar yo'q</p>
          ) : (
            <div className="space-y-4">
              {orgApplications.map(app => (
                <div key={app.id} className="glass-card p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>{app.name}</h3>
                    <p className="text-sm mb-1" style={{ color: "var(--muted)" }}>Ariza beruvchi: {app.provider?.user?.name} ({app.provider?.user?.email})</p>
                    {app.description && <p className="text-sm mb-2 max-w-lg" style={{ color: "var(--text-secondary)" }}>{app.description}</p>}
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      app.status === "PENDING" ? "bg-yellow-500/10 text-yellow-600" :
                      app.status === "APPROVED" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                    }`}>{app.status}</span>
                  </div>
                  {app.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button onClick={() => handleOrgApplication(app.id, "approve")} disabled={actionLoading === app.id}
                        className="btn-success text-sm py-2">
                        <CheckCircle size={16} /> Tasdiqlash
                      </button>
                      <button onClick={() => handleOrgApplication(app.id, "reject")} disabled={actionLoading === app.id}
                        className="btn-danger text-sm py-2">
                        <XCircle size={16} /> Rad etish
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "applications" && <AdminApplications />}
      {activeTab === "users" && <AdminUsers />}
      {activeTab === "chat" && <AdminChat />}
      {activeTab === "notifications" && <AdminNotifications />}
      {activeTab === "disputes" && <AdminDisputes />}


    </div>
  );
}
