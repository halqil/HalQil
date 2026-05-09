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
  MessageSquare, Bell, AlertTriangle, User, Scale
} from "lucide-react";
import AdminUsers from "../../components/admin/AdminUsers";
import AdminNotifications from "../../components/admin/AdminNotifications";
import AdminChat from "../../components/admin/AdminChat";
import AdminApplications from "../../components/admin/AdminApplications";

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [disputes, setDisputes] = useState<Record<string, any>[]>([]);
  const [resolveNote, setResolveNote] = useState<string>("");
  const [resolveOrderId, setResolveOrderId] = useState<string | null>(null);

  const [showCatModal, setShowCatModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [catLoading, setCatLoading] = useState(false);

  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillCategoryId, setSkillCategoryId] = useState("");
  const [skillCategoryName, setSkillCategoryName] = useState("");
  const [skillName, setSkillName] = useState("");
  const [skillDesc, setSkillDesc] = useState("");
  const [skillLoading, setSkillLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    if (user?.role !== "SUPER_ADMIN") { toast.error("Ruxsat etilmagan"); router.push("/"); return; }
    fetchAll();
  }, [isAuthenticated, user, router]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [catsRes, orgAppsRes, disputesRes] = await Promise.all([
        api.get("/admin/categories"),
        api.get("/admin/organizations/applications"),
        api.get("/admin/orders/disputed")
      ]);
      setCategories(catsRes.data.data);
      setOrgApplications(orgAppsRes.data.data);
      setDisputes(disputesRes.data.data || []);
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
    } catch { toast.error("Xatolik yuz berdi"); }
    finally { setActionLoading(null); }
  };

  const openSkillModal = (cat: Category) => {
    setSkillCategoryId(cat.id);
    setSkillCategoryName(cat.name);
    setSkillName(""); setSkillDesc("");
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
          c.id === catId ? { ...c, skills: c.skills.map(s => s.id === skillId ? { ...s, isActive: res.data.data.isActive } : s) } : c
        ));
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

  const handleResolveDispute = async (orderId: string, decision: string) => {
    setActionLoading(orderId);
    try {
      const note = resolveNote || (decision === 'PROVIDER_FAULT' ? 'Shikoyat asosli topildi' : 'Shikoyat asossiz topildi');
      await api.patch(`/admin/orders/${orderId}/resolve`, { decision, note });
      toast.success("Qaror qabul qilindi");
      setResolveOrderId(null);
      setResolveNote("");
      fetchAll();
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      toast.error(error.response?.data?.error || "Xatolik");
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
    { key: "categories", label: "Kategoriyalar", icon: <LayoutList size={16} /> },
    { key: "applications", label: "Provayder arizalari", icon: <Users size={16} /> },
    { key: "org_applications", label: `Tashkilot (${orgApplications.filter(a => a.status === "PENDING").length})`, icon: <Building size={16} /> },
    { key: "disputes", label: `Shikoyatlar (${disputes.length})`, icon: <AlertTriangle size={16} /> },
    { key: "users", label: "Foydalanuvchilar", icon: <User size={16} /> },
    { key: "chat", label: "Chatlar", icon: <MessageSquare size={16} /> },
    { key: "notifications", label: "Xabarnoma", icon: <Bell size={16} /> },
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
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Kategoriyalar & Xizmat turlari</h2>
            <button onClick={() => setShowCatModal(true)} className="btn-primary text-sm">
              <Plus size={16} /> Kategoriya qo'sh
            </button>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-16 glass-card">
              <Folder className="mx-auto mb-3" size={40} style={{ color: "var(--muted)" }} />
              <p style={{ color: "var(--muted)" }}>Hali kategoriya yo'q</p>
            </div>
          )}

          {categories.map(cat => {
            const isExpanded = expandedCats.has(cat.id);
            const isToggling = actionLoading === cat.id;
            return (
              <div key={cat.id} className="glass-card overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <button onClick={() => toggleExpand(cat.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${cat.isActive ? "bg-indigo-500/10" : ""}`}
                      style={{ backgroundColor: cat.isActive ? undefined : "var(--sidebar-hover)" }}>
                      {cat.icon || <Folder size={18} style={{ color: "var(--muted)" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold" style={{ color: "var(--text)" }}>{cat.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--muted)" }}>
                          {cat.skills.length} xizmat
                        </span>
                        {!cat.isActive && (
                          <span className="text-xs text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Nofaol</span>
                        )}
                      </div>
                    </div>
                    <span style={{ color: "var(--muted)" }}>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => openSkillModal(cat)}
                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 px-3 py-1.5 rounded-lg flex items-center gap-1 text-xs font-semibold transition-colors">
                      <Plus size={13} /> Xizmat
                    </button>
                    <button onClick={() => handleToggleCategory(cat.id)} disabled={isToggling}
                      className={`p-1.5 rounded-lg transition-colors ${cat.isActive ? "text-green-500 hover:bg-green-500/10" : "hover:bg-[var(--sidebar-hover)]"}`}
                      style={{ color: cat.isActive ? undefined : "var(--muted)" }}>
                      {isToggling ? <Loader2 size={20} className="animate-spin" /> :
                        cat.isActive ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border-strong)", backgroundColor: "var(--sidebar-hover)" }}>
                    {cat.skills.length === 0 ? (
                      <div className="py-5 text-center">
                        <p className="text-sm" style={{ color: "var(--muted)" }}>Bu kategoriyada xizmat turlari yo'q</p>
                        <button onClick={() => openSkillModal(cat)} className="mt-2 text-indigo-500 text-sm font-medium hover:underline">
                          + Birinchisini qo'shing
                        </button>
                      </div>
                    ) : (
                      <ul>
                        {cat.skills.map((skill, idx) => {
                          const isSkillToggling = actionLoading === skill.id;
                          return (
                            <li key={skill.id}>
                              <div className="flex items-center gap-3 px-5 py-3 hover:bg-[var(--card-hover)] transition-colors">
                                <Wrench size={14} className={skill.isActive ? "text-emerald-500" : ""} style={{ color: skill.isActive ? undefined : "var(--muted)" }} />
                                <span className={`flex-1 text-sm font-medium ${!skill.isActive ? "line-through" : ""}`}
                                  style={{ color: skill.isActive ? "var(--text)" : "var(--muted)" }}>
                                  {skill.name}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  skill.isActive ? "bg-green-500/10 text-green-500" : "bg-gray-500/10"
                                }`} style={{ color: skill.isActive ? undefined : "var(--muted)" }}>
                                  {skill.isActive ? "Faol" : "Nofaol"}
                                </span>
                                <button onClick={() => handleToggleSkill(skill.id, cat.id)} disabled={isSkillToggling}
                                  className={`p-1 rounded-lg transition-colors ${skill.isActive ? "text-green-500 hover:bg-green-500/10" : "hover:bg-[var(--sidebar-hover)]"}`}
                                  style={{ color: skill.isActive ? undefined : "var(--muted)" }}>
                                  {isSkillToggling ? <Loader2 size={18} className="animate-spin" /> :
                                    skill.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                </button>
                              </div>
                              {idx < cat.skills.length - 1 && <div className="glass-divider mx-4" />}
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

      {/* DISPUTES TAB */}
      {activeTab === "disputes" && (
        <div className="glass-card p-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2" style={{ color: "var(--text)" }}>
            <AlertTriangle className="text-orange-500" size={22} />
            Shikoyatlar ({disputes.length})
          </h2>
          {disputes.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="mx-auto text-green-500/40 mb-3" size={48} />
              <p style={{ color: "var(--muted)" }}>Hozircha shikoyatlar yo'q</p>
            </div>
          ) : (
            <div className="space-y-5">
              {disputes.map(order => (
                <div key={order.id} className="glass-card p-5 space-y-4 bg-orange-500/5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold" style={{ color: "var(--text)" }}>{order.skill?.name}</span>
                        <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-bold">DISPUTED</span>
                      </div>
                      <div className="text-sm" style={{ color: "var(--muted)" }}>{new Date(order.createdAt).toLocaleDateString("uz-UZ")}</div>
                    </div>
                    <a href={`/orders/${order.id}`} target="_blank" className="text-xs text-blue-500 hover:underline flex-shrink-0">Chat tarixi</a>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-card p-3 bg-blue-500/5 !rounded-xl">
                      <div className="text-xs text-blue-500 font-medium mb-1 flex items-center gap-1"><User size={12} /> Mijoz</div>
                      <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{order.user?.name}</div>
                    </div>
                    <div className="glass-card p-3 bg-emerald-500/5 !rounded-xl">
                      <div className="text-xs text-emerald-500 font-medium mb-1 flex items-center gap-1"><Wrench size={12} /> Provayder</div>
                      <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{order.provider?.user?.name}</div>
                    </div>
                  </div>

                  {(order.unsuccessReason || order.finishType === 'UNSUCCESSFUL') && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                      <div className="text-xs font-bold text-orange-500 mb-1">Provayder sababi ({order.unsuccessCategory})</div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{order.unsuccessReason || '-'}</p>
                    </div>
                  )}

                  {order.disputeReason && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                      <div className="text-xs font-bold text-red-500 mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Mijoz shikoyati</div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{order.disputeReason}</p>
                    </div>
                  )}

                  {resolveOrderId === order.id ? (
                    <div className="space-y-2">
                      <input type="text" placeholder="Admin eslatmasi (ixtiyoriy)" value={resolveNote}
                        onChange={e => setResolveNote(e.target.value)} className="glass-input" />
                      <div className="flex gap-2">
                        <button onClick={() => handleResolveDispute(order.id, 'PROVIDER_FAULT')}
                          disabled={actionLoading === order.id} className="btn-danger flex-1 text-sm py-2">
                          Provayder aybdor
                        </button>
                        <button onClick={() => handleResolveDispute(order.id, 'USER_FAULT')}
                          disabled={actionLoading === order.id} className="btn-primary flex-1 text-sm py-2">
                          User aybdor
                        </button>
                        <button onClick={() => { setResolveOrderId(null); setResolveNote(""); }}
                          className="btn-ghost text-sm px-3">Bekor</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setResolveOrderId(order.id)}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                      <Scale size={16} /> Qaror chiqarish
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: New Category */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal p-7 w-full max-w-md fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>Yangi kategoriya</h3>
              <button onClick={() => setShowCatModal(false)} className="hover:bg-[var(--sidebar-hover)] p-1.5 rounded-lg transition-colors" style={{ color: "var(--muted)" }}>
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nomi *</label>
                <input type="text" value={catName} onChange={e => setCatName(e.target.value)}
                  placeholder="Masalan: Santexnika" className="glass-input" required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Ikonka (ixtiyoriy)</label>
                <input type="text" value={catIcon} onChange={e => setCatIcon(e.target.value)}
                  placeholder="Emoji yoki matn" className="glass-input" />
              </div>
              <button type="submit" disabled={catLoading} className="btn-primary w-full py-3">
                {catLoading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Qo'shish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: New Skill */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal p-7 w-full max-w-md fade-in">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold" style={{ color: "var(--text)" }}>Yangi xizmat turi</h3>
              <button onClick={() => setShowSkillModal(false)} className="hover:bg-[var(--sidebar-hover)] p-1.5 rounded-lg transition-colors" style={{ color: "var(--muted)" }}>
                <X size={22} />
              </button>
            </div>
            <p className="text-sm text-indigo-500 font-medium mb-5 bg-indigo-500/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5">
              <Folder size={14} /> {skillCategoryName}
            </p>
            <form onSubmit={handleCreateSkill} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Xizmat nomi *</label>
                <input type="text" value={skillName} onChange={e => setSkillName(e.target.value)}
                  placeholder="Masalan: Kran ta'mirlash" className="glass-input" required autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tavsif (ixtiyoriy)</label>
                <textarea value={skillDesc} onChange={e => setSkillDesc(e.target.value)}
                  placeholder="Qisqacha izoh..." rows={2} className="glass-textarea" />
              </div>
              <button type="submit" disabled={skillLoading} className="btn-success w-full py-3">
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
