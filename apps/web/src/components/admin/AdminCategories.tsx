"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { timeAgo } from "@/lib/timeAgo";
import { ChevronDown, ChevronRight, Edit2, Power, PowerOff, Trash2, Plus, Search, Users, Package, CheckCircle, XCircle, AlertTriangle, X, Check } from "lucide-react";

type Skill = { id: string; name: string; description?: string; isActive: boolean; _count?: { providerSkills: number } };
type Category = { id: string; name: string; icon?: string; description?: string; isActive: boolean; skills: Skill[]; providersCount: number; ordersCount: number; _count: { skills: number } };
type Provider = { id: string; user: { id: string; firstName?: string; lastName?: string; username?: string; avatar?: string; isOnline?: boolean }; avgRating?: number; ordersCount?: number; experienceYears?: number; priceFrom?: number; priceTo?: number };

export default function AdminCategories() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Modals
  const [addCatModal, setAddCatModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [addSkillModal, setAddSkillModal] = useState<string | null>(null); // categoryId
  const [editSkill, setEditSkill] = useState<{ skill: Skill; catId: string } | null>(null);
  const [toggleConfirm, setToggleConfirm] = useState<{ type: "cat" | "skill"; id: string; name: string; isActive: boolean } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ type: "cat" | "skill"; id: string; name: string } | null>(null);
  const [deleteCheck, setDeleteCheck] = useState<{ canDelete: boolean; providersCount: number } | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [providersModal, setProvidersModal] = useState<{ id: string; name: string; type: "cat" | "skill" } | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [provPage, setProvPage] = useState(1);
  const [provTotal, setProvTotal] = useState(0);

  // Form states
  const [form, setForm] = useState({ name: "", description: "", icon: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/categories", { params: { status: statusFilter, search: search || undefined } });
      setCats(res.data.data);
    } catch { toast.error("Yuklashda xatolik"); }
    finally { setLoading(false); }
  }, [statusFilter, search]);

  useEffect(() => { fetchCats(); }, [fetchCats]);

  const fetchProviders = useCallback(async (id: string, type: "cat" | "skill", page = 1) => {
    try {
      const url = type === "cat" ? `/admin/categories/${id}/providers` : `/admin/skills/${id}/providers`;
      const res = await api.get(url, { params: { page, limit: 10 } });
      setProviders(res.data.data.providers);
      setProvTotal(res.data.data.total);
      setProvPage(page);
    } catch { toast.error("Xatolik"); }
  }, []);

  const openDelete = async (type: "cat" | "skill", id: string, name: string) => {
    setDeleteModal({ type, id, name });
    setDeleteCheck(null);
    setDeleteConfirmName("");
    try {
      const url = type === "cat" ? `/admin/categories/${id}/check-delete` : `/admin/skills/${id}/check-delete`;
      const res = await api.get(url);
      setDeleteCheck(res.data.data);
    } catch { toast.error("Xatolik"); }
  };

  const handleToggle = async () => {
    if (!toggleConfirm) return;
    setSaving(true);
    try {
      const url = toggleConfirm.type === "cat" ? `/admin/categories/${toggleConfirm.id}/toggle` : `/admin/skills/${toggleConfirm.id}/toggle`;
      await api.patch(url);
      toast.success(toggleConfirm.isActive ? "Deactivate qilindi" : "Aktivlashtirildi");
      setToggleConfirm(null);
      fetchCats();
    } catch (e: any) { toast.error(e?.response?.data?.error || "Xatolik"); }
    finally { setSaving(false); }
  };

  const handleSaveCat = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editCat) { await api.patch(`/admin/categories/${editCat.id}`, form); toast.success("Yangilandi"); setEditCat(null); }
      else { await api.post("/admin/categories", form); toast.success("Qo'shildi"); setAddCatModal(false); }
      setForm({ name: "", description: "", icon: "" });
      fetchCats();
    } catch (e: any) { toast.error(e?.response?.data?.error || "Xatolik"); }
    finally { setSaving(false); }
  };

  const handleSaveSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editSkill) { await api.patch(`/admin/skills/${editSkill.skill.id}`, { name: form.name, description: form.description }); toast.success("Yangilandi"); setEditSkill(null); }
      else { await api.post("/admin/skills", { categoryId: addSkillModal, name: form.name, description: form.description }); toast.success("Qo'shildi"); setAddSkillModal(null); }
      setForm({ name: "", description: "", icon: "" });
      fetchCats();
    } catch (e: any) { toast.error(e?.response?.data?.error || "Xatolik"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteModal || !deleteCheck?.canDelete || deleteConfirmName !== deleteModal.name) return;
    setDeleting(true);
    try {
      const url = deleteModal.type === "cat" ? `/admin/categories/${deleteModal.id}` : `/admin/skills/${deleteModal.id}`;
      await api.delete(url);
      toast.success("O'chirildi");
      setDeleteModal(null);
      fetchCats();
    } catch (e: any) { toast.error(e?.response?.data?.error || "Xatolik"); }
    finally { setDeleting(false); }
  };

  const openEditCat = (cat: Category) => { setEditCat(cat); setForm({ name: cat.name, description: cat.description || "", icon: cat.icon || "" }); };
  const openEditSkill = (skill: Skill, catId: string) => { setEditSkill({ skill, catId }); setForm({ name: skill.name, description: skill.description || "", icon: "" }); };
  const openAddCat = () => { setForm({ name: "", description: "", icon: "" }); setAddCatModal(true); };
  const openAddSkill = (catId: string) => { setForm({ name: "", description: "", icon: "" }); setAddSkillModal(catId); };

  const Modal = ({ title, onClose, onSubmit, children }: { title: string; onClose: () => void; onSubmit: (e: React.FormEvent) => void; children: React.ReactNode }) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="glass-modal w-full max-w-md p-6 space-y-4 fade-in">
        <div className="flex items-center justify-between"><h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>{title}</h3><button type="button" onClick={onClose}><X size={18} style={{ color: "var(--muted)" }} /></button></div>
        {children}
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm">Bekor</button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">{saving ? "..." : "Saqlash"}</button>
        </div>
      </form>
    </div>
  );

  const formFields = (withIcon = false) => (
    <>
      <div><label className="block text-sm mb-1" style={{ color: "var(--text)" }}>Nomi *</label><input required className="glass-input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
      <div><label className="block text-sm mb-1" style={{ color: "var(--text)" }}>Tavsif</label><textarea className="glass-input w-full resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
      {withIcon && <div><label className="block text-sm mb-1" style={{ color: "var(--text)" }}>Icon (emoji)</label><input className="glass-input w-full" value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="🔧" /></div>}
    </>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--sidebar-hover)" }}>
            {[["all","Barchasi"],["active","Aktiv"],["inactive","Nofaol"]].map(([k,l]) => (
              <button key={k} onClick={() => setStatusFilter(k)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter===k ? "shadow-sm" : "hover:opacity-80"}`}
                style={statusFilter===k ? { backgroundColor:"var(--card)", color:"var(--text)" } : { color:"var(--text-secondary)" }}>{l}</button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:"var(--muted)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Qidirish..." className="glass-input w-full pl-8 pr-3 py-2 text-sm" />
          </div>
        </div>
        <button onClick={openAddCat} className="btn-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"><Plus size={15} /> Kategoriya qo'shish</button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
      ) : cats.length === 0 ? (
        <div className="glass-card py-16 text-center" style={{ color:"var(--muted)" }}>Kategoriyalar yo'q</div>
      ) : (
        <div className="space-y-3">
          {cats.map(cat => (
            <div key={cat.id} className="glass-card overflow-hidden">
              {/* Category row */}
              <div className="p-4 flex items-center gap-3">
                <span className="text-2xl w-8 text-center">{cat.icon || "📁"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold" style={{ color:"var(--text)" }}>{cat.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                      {cat.isActive ? "Aktiv" : "Nofaol"}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-1 text-xs" style={{ color:"var(--muted)" }}>
                    <span className="flex items-center gap-1"><Users size={11} /> {cat.providersCount} provayder</span>
                    <span className="flex items-center gap-1"><Package size={11} /> {cat._count.skills} skill</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditCat(cat)} title="Tahrirlash" className="p-2 rounded-lg hover:bg-[var(--sidebar-hover)] text-indigo-500"><Edit2 size={15} /></button>
                  <button onClick={() => setToggleConfirm({ type:"cat", id:cat.id, name:cat.name, isActive:cat.isActive })} title={cat.isActive ? "Deactivate" : "Aktivlashtirish"}
                    className={`p-2 rounded-lg hover:bg-[var(--sidebar-hover)] ${cat.isActive ? "text-amber-500":"text-emerald-500"}`}>
                    {cat.isActive ? <PowerOff size={15}/> : <Power size={15}/>}
                  </button>
                  <button onClick={() => openDelete("cat", cat.id, cat.name)} title="O'chirish" className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                  <button onClick={() => setExpanded(expanded===cat.id ? null : cat.id)} className="p-2 rounded-lg hover:bg-[var(--sidebar-hover)]" style={{ color:"var(--muted)" }}>
                    {expanded===cat.id ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                  </button>
                </div>
              </div>

              {/* Skills accordion */}
              {expanded===cat.id && (
                <div style={{ borderTop:"1px solid var(--border-strong)" }}>
                  {cat.skills.length === 0 ? (
                    <div className="px-6 py-4 text-sm" style={{ color:"var(--muted)" }}>Skill yo'q</div>
                  ) : cat.skills.map(sk => (
                    <div key={sk.id} className="px-6 py-3 flex items-center gap-3 hover:bg-[var(--sidebar-hover)] transition-colors" style={{ borderBottom:"1px solid var(--border-strong)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color:"var(--text)" }}>{sk.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${sk.isActive ? "bg-emerald-500/10 text-emerald-500":"bg-red-500/10 text-red-500"}`}>
                            {sk.isActive ? "Aktiv":"Nofaol"}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color:"var(--muted)" }}>
                          <Users size={10}/> {sk._count?.providerSkills ?? 0} provayder
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditSkill(sk, cat.id)} className="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] text-indigo-500"><Edit2 size={13}/></button>
                        <button onClick={() => setToggleConfirm({ type:"skill", id:sk.id, name:sk.name, isActive:sk.isActive })}
                          className={`p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] ${sk.isActive ? "text-amber-500":"text-emerald-500"}`}>
                          {sk.isActive ? <PowerOff size={13}/> : <Power size={13}/>}
                        </button>
                        <button onClick={() => openDelete("skill", sk.id, sk.name)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={13}/></button>
                      </div>
                    </div>
                  ))}
                  <div className="px-6 py-3">
                    <button onClick={() => openAddSkill(cat.id)} className="text-sm text-indigo-600 hover:underline flex items-center gap-1 font-medium"><Plus size={13}/> Skill qo'shish</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {(addCatModal || editCat) && (
        <Modal title={editCat ? "Kategoriyani tahrirlash" : "Yangi kategoriya"} onClose={() => { setAddCatModal(false); setEditCat(null); }} onSubmit={handleSaveCat}>
          {formFields(true)}
        </Modal>
      )}

      {/* Add/Edit Skill Modal */}
      {(addSkillModal || editSkill) && (
        <Modal title={editSkill ? "Skillni tahrirlash" : "Yangi skill"} onClose={() => { setAddSkillModal(null); setEditSkill(null); }} onSubmit={handleSaveSkill}>
          {formFields(false)}
        </Modal>
      )}

      {/* Toggle Confirm Modal */}
      {toggleConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-modal w-full max-w-sm p-6 space-y-4 fade-in">
            <h3 className="font-bold text-lg" style={{ color:"var(--text)" }}>Tasdiqlash</h3>
            <p className="text-sm" style={{ color:"var(--text-secondary)" }}>
              {toggleConfirm.type==="cat"
                ? toggleConfirm.isActive
                  ? `"${toggleConfirm.name}" kategoriyasi va barcha skilllarini deactivate qilasizmi?`
                  : `"${toggleConfirm.name}" kategoriyasi va barcha skilllarini aktivlashtirasizmi?`
                : toggleConfirm.isActive
                  ? `"${toggleConfirm.name}" skillini deactivate qilasizmi?`
                  : `"${toggleConfirm.name}" skillini aktivlashtirasizmi?`}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setToggleConfirm(null)} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm">Bekor</button>
              <button onClick={handleToggle} disabled={saving} className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-1.5">
                <Check size={14}/> {saving ? "..." : "Tasdiqlash"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-modal w-full max-w-sm p-6 space-y-4 fade-in">
            {deleteCheck === null ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"/></div>
            ) : !deleteCheck.canDelete ? (
              <>
                <div className="flex items-center gap-2"><AlertTriangle className="text-amber-500" size={22}/><h3 className="font-bold text-lg" style={{ color:"var(--text)" }}>O'chirib bo'lmaydi</h3></div>
                <p className="text-sm" style={{ color:"var(--text-secondary)" }}>Bu {deleteModal.type==="cat"?"kategoriyada":"skillda"} <strong>{deleteCheck.providersCount}</strong> ta aktiv provayder bor.</p>
                <div className="flex gap-2">
                  <button onClick={() => { setProvidersModal({ id:deleteModal.id, name:deleteModal.name, type:deleteModal.type }); fetchProviders(deleteModal.id, deleteModal.type); }} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm">Provayderlarni ko'rish</button>
                  <button onClick={() => setDeleteModal(null)} className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-bold">Yopish</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2"><Trash2 className="text-red-500" size={22}/><h3 className="font-bold text-lg" style={{ color:"var(--text)" }}>Rostdan o'chirasizmi?</h3></div>
                <p className="text-sm" style={{ color:"var(--text-secondary)" }}>Bu amalni qaytarib bo'lmaydi!</p>
                <div><label className="block text-xs mb-1" style={{ color:"var(--text-secondary)" }}>Tasdiqlash uchun nomni yozing: <strong>{deleteModal.name}</strong></label>
                  <input className="glass-input w-full" value={deleteConfirmName} onChange={e => setDeleteConfirmName(e.target.value)} placeholder={deleteModal.name}/>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteModal(null)} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm">Bekor</button>
                  <button onClick={handleDelete} disabled={deleting || deleteConfirmName!==deleteModal.name}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 transition-colors">{deleting ? "..." : "O'chirish"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Providers Modal */}
      {providersModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="glass-modal w-full max-w-lg p-6 space-y-4 fade-in max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-lg" style={{ color:"var(--text)" }}>{providersModal.name} — Provayderlar</h3>
              <button onClick={() => setProvidersModal(null)}><X size={18} style={{ color:"var(--muted)" }}/></button>
            </div>
            <div className="overflow-y-auto flex-1 space-y-2">
              {providers.length === 0 ? <p className="text-center py-8" style={{ color:"var(--muted)" }}>Provayderlar yo'q</p> :
                providers.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor:"var(--sidebar-hover)" }}>
                    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 flex-shrink-0">
                      {(p.user.firstName || p.user.username || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color:"var(--text)" }}>{p.user.firstName} {p.user.lastName}</div>
                      <div className="flex items-center gap-2 text-xs" style={{ color:"var(--muted)" }}>
                        <span className={`w-1.5 h-1.5 rounded-full ${p.user.isOnline ? "bg-green-500":"bg-gray-300"}`}/>
                        {p.user.isOnline?"Online":"Offline"}
                        {p.user.username && <span>· @{p.user.username}</span>}
                        {p.avgRating !== undefined && <span>· ⭐ {p.avgRating.toFixed(1)}</span>}
                      </div>
                    </div>
                    <a href={`/providers/${p.id}`} target="_blank" className="text-xs text-indigo-600 hover:underline flex-shrink-0">Profil</a>
                  </div>
                ))
              }
            </div>
            {provTotal > 10 && (
              <div className="flex items-center justify-between pt-2 flex-shrink-0 border-t" style={{ borderColor:"var(--border-strong)" }}>
                <button disabled={provPage===1} onClick={() => fetchProviders(providersModal.id, providersModal.type, provPage-1)} className="btn-ghost text-sm px-3 py-1.5 rounded-lg disabled:opacity-40">← Oldingi</button>
                <span className="text-xs" style={{ color:"var(--text-secondary)" }}>Jami: {provTotal}</span>
                <button disabled={provPage*10>=provTotal} onClick={() => fetchProviders(providersModal.id, providersModal.type, provPage+1)} className="btn-ghost text-sm px-3 py-1.5 rounded-lg disabled:opacity-40">Keyingi →</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
