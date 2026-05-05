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
  MessageSquare, Bell
} from "lucide-react";
import AdminUsers from "../../components/admin/AdminUsers";
import AdminNotifications from "../../components/admin/AdminNotifications";
import AdminChat from "../../components/admin/AdminChat";

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

interface Application {
  id: string;
  status: string;
  bio?: string;
  serviceType: string;
  user?: { name: string; email: string; avatar?: string };
}

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("categories");
  const [applications, setApplications] = useState<Application[]>([]);
  const [orgApplications, setOrgApplications] = useState<Record<string, any>[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New Category Modal
  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  // New Skill Modal
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillCategoryId, setSkillCategoryId] = useState("");
  const [skillCategoryName, setSkillCategoryName] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillDesc, setSkillDesc] = useState("");
  const [skillLoading, setSkillLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "SUPER_ADMIN") { toast.error("Ruxsat etilmagan"); router.push("/"); return; }
    fetchAll();
  }, [isAuthenticated, user, router]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [catsRes, appsRes, orgAppsRes] = await Promise.all([
        api.get("/admin/categories"),
        api.get("/admin/applications"),
        api.get("/admin/organizations/applications")
      ]);
      setCategories(catsRes.data.data);
      setApplications(appsRes.data.data);
      setOrgApplications(orgAppsRes.data.data);
    } catch (err) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (catId: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      next.has(catId) ? next.delete(catId) : next.add(catId);
      return next;
    });
  };

  // ---- Category actions ----
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setCatLoading(true);
    try {
      await api.post("/admin/categories", { name: catName.trim(), icon: catIcon.trim() || undefined });
      toast.success("Kategoriya qo'shildi!");
      setCatName(""); setCatIcon("");
      setShowCatModal(false);
      fetchAll();
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      toast.error(error.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setCatLoading(false);
    }
  };

  const handleToggleCategory = async (catId: string) => {
    setActionLoading(catId);
    try {
      const res = await api.patch(`/admin/categories/${catId}/toggle`);
      if (res.data.success) {
        setCategories(prev => prev.map(c =>
          c.id === catId ? { ...c, isActive: res.data.data.isActive, skills: c.skills.map(s => ({ ...s, isActive: res.data.data.isActive ? s.isActive : false })) } : c
        ));
      }
    } catch {
      toast.error("Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Skill actions ----
  const openSkillModal = (cat: Category) => {
    setSkillCategoryId(cat.id);
    setSkillCategoryName(cat.name);
    setSkillName("");
    setSkillDesc("");
    setShowSkillModal(true);
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;
    setSkillLoading(true);
    try {
      await api.post("/admin/skills", {
        categoryId: skillCategoryId,
        name: skillName.trim(),
        description: skillDesc.trim() || undefined,
      });
      toast.success("Xizmat turi qo'shildi!");
      setShowSkillModal(false);
      fetchAll();
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      toast.error(error.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setSkillLoading(false);
    }
  };

  const handleToggleSkill = async (skillId: string, catId: string) => {
    setActionLoading(skillId);
    try {
      const res = await api.patch(`/admin/skills/${skillId}/toggle`);
      if (res.data.success) {
        setCategories(prev => prev.map(c =>
          c.id === catId
            ? { ...c, skills: c.skills.map(s => s.id === skillId ? { ...s, isActive: res.data.data.isActive } : s) }
            : c
        ));
      }
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      toast.error(error.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
    }
  };

  // ---- Application actions ----
  const handleApplication = async (id: string, action: "approve" | "reject") => {
    setActionLoading(id);
    try {
      let body = {};
      if (action === "reject") {
        const reason = prompt("Rad etish sababini kiriting:");
        if (!reason) { setActionLoading(null); return; }
        body = { rejection_note: reason };
      }
      const res = await api.post(`/admin/applications/${id}/${action}`, body);
      if (res.data.success) {
        toast.success(`Ariza ${action === "approve" ? "tasdiqlandi" : "rad etildi"}`);
        fetchAll();
      }
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      toast.error(error.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setActionLoading(null);
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-indigo-900 text-white p-8 rounded-3xl shadow-lg">
        <h1 className="text-3xl font-bold mb-1">Boshqaruv Paneli</h1>
        <p className="text-indigo-200 text-sm">Kategoriyalar, xizmatlar va arizalar</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
        {[
          { key: "categories", label: "Kategoriyalar & Xizmatlar", icon: <LayoutList size={16} /> },
          { key: "applications", label: `Provayder arizalari (${applications.filter(a => a.status === "PENDING").length})`, icon: <Users size={16} /> },
          { key: "org_applications", label: `Tashkilot arizalari (${orgApplications.filter(a => a.status === "PENDING").length})`, icon: <Building size={16} /> },
          { key: "users", label: "Foydalanuvchilar", icon: <Users size={16} /> },
          { key: "chat", label: "Chatlar", icon: <MessageSquare size={16} /> },
          { key: "notifications", label: "Xabarnoma yuborish", icon: <Bell size={16} /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-xl font-medium text-xs sm:text-sm transition-all ${activeTab === tab.key ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-500 hover:bg-gray-50"}`}
          >
            {tab.icon} <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ======== CATEGORIES TAB ======== */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Kategoriyalar & Xizmat turlari</h2>
            <button
              onClick={() => setShowCatModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-md"
            >
              <Plus size={16} /> Kategoriya qo'sh
            </button>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <Folder className="mx-auto text-gray-300 mb-3" size={40} />
              <p className="text-gray-400">Hali kategoriya yo'q</p>
            </div>
          )}

          {categories.map(cat => {
            const isExpanded = expandedCats.has(cat.id);
            const isToggling = actionLoading === cat.id;
            return (
              <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Category Row */}
                <div className="flex items-center gap-3 p-4">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${cat.isActive ? "bg-indigo-50" : "bg-gray-100"}`}>
                      {cat.icon || "📁"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{cat.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {cat.skills.length} xizmat
                        </span>
                        {!cat.isActive && (
                          <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Nofaol</span>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-400 flex-shrink-0">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openSkillModal(cat)}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition-colors"
                      title="Xizmat qo'shish"
                    >
                      <Plus size={13} /> Xizmat
                    </button>
                    <button
                      onClick={() => handleToggleCategory(cat.id)}
                      disabled={isToggling}
                      className={`p-1.5 rounded-lg transition-colors ${cat.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                      title={cat.isActive ? "O'chirish" : "Yoqish"}
                    >
                      {isToggling
                        ? <Loader2 size={20} className="animate-spin" />
                        : cat.isActive
                        ? <ToggleRight size={22} />
                        : <ToggleLeft size={22} />}
                    </button>
                  </div>
                </div>

                {/* Skills Accordion */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50">
                    {cat.skills.length === 0 ? (
                      <div className="py-5 text-center">
                        <p className="text-sm text-gray-400">Bu kategoriyada xizmat turlari yo'q</p>
                        <button
                          onClick={() => openSkillModal(cat)}
                          className="mt-2 text-indigo-600 text-sm font-medium hover:underline"
                        >
                          + Birinchisini qo'shing
                        </button>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100">
                        {cat.skills.map(skill => {
                          const isSkillToggling = actionLoading === skill.id;
                          return (
                            <li key={skill.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white transition-colors">
                              <Wrench size={14} className={skill.isActive ? "text-emerald-500" : "text-gray-300"} />
                              <span className={`flex-1 text-sm font-medium ${skill.isActive ? "text-gray-800" : "text-gray-400 line-through"}`}>
                                {skill.name}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${skill.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                                {skill.isActive ? "Faol" : "Nofaol"}
                              </span>
                              <button
                                onClick={() => handleToggleSkill(skill.id, cat.id)}
                                disabled={isSkillToggling}
                                className={`p-1 rounded-lg transition-colors ${skill.isActive ? "text-green-500 hover:bg-green-50" : "text-gray-300 hover:bg-gray-100"}`}
                                title={skill.isActive ? "O'chirish" : "Yoqish"}
                              >
                                {isSkillToggling
                                  ? <Loader2 size={18} className="animate-spin" />
                                  : skill.isActive
                                  ? <ToggleRight size={20} />
                                  : <ToggleLeft size={20} />}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======== APPLICATIONS TAB ======== */}
      {activeTab === "applications" && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Provayderlik arizalari</h2>
          {applications.length === 0 ? (
            <p className="text-gray-400 text-center py-10">Arizalar yo'q</p>
          ) : (
            <div className="space-y-4">
              {applications.map(app => (
                <div key={app.id} className="border border-gray-100 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-100 transition-colors">
                  <div>
                    <h3 className="font-bold text-lg">{app.user?.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">{app.user?.email}</p>
                    {app.bio && <p className="text-sm text-gray-600 mb-2 max-w-lg">{app.bio}</p>}
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${app.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : app.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {app.status}
                      </span>
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{app.serviceType}</span>
                    </div>
                  </div>
                  {app.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApplication(app.id, "approve")}
                        disabled={actionLoading === app.id}
                        className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm transition-colors"
                      >
                        <CheckCircle size={16} /> Tasdiqlash
                      </button>
                      <button
                        onClick={() => handleApplication(app.id, "reject")}
                        disabled={actionLoading === app.id}
                        className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm transition-colors"
                      >
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

      {/* ======== ORG APPLICATIONS TAB ======== */}
      {activeTab === "org_applications" && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-6">Tashkilot yaratish arizalari</h2>
          {orgApplications.length === 0 ? (
            <p className="text-gray-400 text-center py-10">Arizalar yo'q</p>
          ) : (
            <div className="space-y-4">
              {orgApplications.map(app => (
                <div key={app.id} className="border border-gray-100 p-5 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-100 transition-colors">
                  <div>
                    <h3 className="font-bold text-lg">{app.name}</h3>
                    <p className="text-sm text-gray-500 mb-1">Ariza beruvchi: {app.provider?.user?.name} ({app.provider?.user?.email})</p>
                    {app.description && <p className="text-sm text-gray-600 mb-2 max-w-lg">{app.description}</p>}
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${app.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : app.status === "APPROVED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                  {app.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOrgApplication(app.id, "approve")}
                        disabled={actionLoading === app.id}
                        className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm transition-colors"
                      >
                        <CheckCircle size={16} /> Tasdiqlash
                      </button>
                      <button
                        onClick={() => handleOrgApplication(app.id, "reject")}
                        disabled={actionLoading === app.id}
                        className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-xl flex items-center gap-2 font-medium text-sm transition-colors"
                      >
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

      {/* ======== NEW TABS ======== */}
      {activeTab === "users" && <AdminUsers />}
      {activeTab === "chat" && <AdminChat />}
      {activeTab === "notifications" && <AdminNotifications />}

      {/* ======== MODAL: New Category ======== */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Yangi kategoriya</h3>
              <button onClick={() => setShowCatModal(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomi *</label>
                <input
                  type="text" value={catName} onChange={e => setCatName(e.target.value)}
                  placeholder="Masalan: Santexnika"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  required autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emoji ikonkasi (ixtiyoriy)</label>
                <input
                  type="text" value={catIcon} onChange={e => setCatIcon(e.target.value)}
                  placeholder="Masalan: 🔧"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <button
                type="submit" disabled={catLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {catLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Qo'shish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======== MODAL: New Skill ======== */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-7 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold">Yangi xizmat turi</h3>
              <button onClick={() => setShowSkillModal(false)} className="text-gray-400 hover:text-gray-700 transition-colors">
                <X size={22} />
              </button>
            </div>
            <p className="text-sm text-indigo-600 font-medium mb-5 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block">
              📁 {skillCategoryName}
            </p>
            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xizmat nomi *</label>
                <input
                  type="text" value={skillName} onChange={e => setSkillName(e.target.value)}
                  placeholder="Masalan: Kran ta'mirlash"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  required autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif (ixtiyoriy)</label>
                <textarea
                  value={skillDesc} onChange={e => setSkillDesc(e.target.value)}
                  placeholder="Qisqacha izoh..."
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-all"
                />
              </div>
              <button
                type="submit" disabled={skillLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {skillLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Qo'shish
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
