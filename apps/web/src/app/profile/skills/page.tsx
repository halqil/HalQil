"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../../../lib/api";
import { useAuthStore } from "../../../lib/store";
import toast from "react-hot-toast";
import {
  Briefcase, Trash2, Pencil, Plus, Check, X, ShieldAlert,
  Award, ArrowLeft, Loader2, DollarSign, Clock, HelpCircle,
  AlertCircle
} from "lucide-react";
import { AxiosError } from "axios";

type Skill = {
  id: string;
  name: string;
  categoryId: string;
  description: string | null;
  category?: {
    id: string;
    name: string;
  };
};

type ProviderSkill = {
  id: string;
  skillId: string;
  priceFrom: number | null;
  priceTo: number | null;
  priceNote: string | null;
  experienceYears: number;
  description: string | null;
  isActive: boolean;
  skill: Skill;
};

export default function SkillManagement() {
  const { isAuthenticated, user: authUser } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [application, setApplication] = useState<Record<string, any> | null>(null);
  
  // Available skills in the approved category
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSkill, setEditingSkill] = useState<ProviderSkill | null>(null);

  // Form State
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [experienceYears, setExperienceYears] = useState("1");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    fetchData();
  }, [isAuthenticated, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user & provider profile
      const userRes = await api.get("/user/me");
      if (userRes.data.success) {
        const userProfile = userRes.data.data;
        setProfile(userProfile);
        
        if (userProfile.role !== "PROVIDER") {
          toast.error("Ushbu sahifa faqat provayderlar uchun!");
          router.push("/profile");
          return;
        }

        // 2. Fetch application to get approved categoryId
        const appRes = await api.get("/provider/my-application");
        if (appRes.data.success) {
          const app = appRes.data.data;
          setApplication(app);

          if (app.categoryId) {
            // 3. Fetch all skills under this category
            const skillsRes = await api.get("/catalog/skills", {
              params: { category_id: app.categoryId, is_active: "true" }
            });
            if (skillsRes.data.success) {
              setAvailableSkills(skillsRes.data.data || []);
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    // Reset form for addition
    setSelectedSkillId("");
    setExperienceYears("1");
    setPriceFrom("");
    setPriceTo("");
    setPriceNote("");
    setDescription("");
    setIsActive(true);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (ps: ProviderSkill) => {
    setEditingSkill(ps);
    setSelectedSkillId(ps.skillId);
    setExperienceYears(String(ps.experienceYears));
    setPriceFrom(ps.priceFrom ? String(ps.priceFrom) : "");
    setPriceTo(ps.priceTo ? String(ps.priceTo) : "");
    setPriceNote(ps.priceNote || "");
    setDescription(ps.description || "");
    setIsActive(ps.isActive);
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillId) {
      toast.error("Xizmatni tanlang");
      return;
    }
    if (description.trim().length < 20) {
      toast.error("Tavsif kamida 20 belgi bo'lishi kerak");
      return;
    }
    if (priceFrom && priceTo && Number(priceTo) <= Number(priceFrom)) {
      toast.error("Maksimal narx minimal narxdan katta bo'lishi kerak");
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post("/provider/skills", {
        skill_id: selectedSkillId,
        experience_years: Number(experienceYears),
        price_from: priceFrom ? Number(priceFrom) : undefined,
        price_to: priceTo ? Number(priceTo) : undefined,
        price_note: priceNote.trim() || undefined,
        description: description.trim()
      });

      if (res.data.success) {
        toast.success("Xizmat muvaffaqiyatli qo'shildi!");
        setShowAddModal(false);
        fetchData();
      }
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSkill) return;
    if (description.trim().length < 20) {
      toast.error("Tavsif kamida 20 belgi bo'lishi kerak");
      return;
    }
    if (priceFrom && priceTo && Number(priceTo) <= Number(priceFrom)) {
      toast.error("Maksimal narx minimal narxdan katta bo'lishi kerak");
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.patch(`/provider/skills/${editingSkill.skillId}`, {
        experience_years: Number(experienceYears),
        price_from: priceFrom ? Number(priceFrom) : null,
        price_to: priceTo ? Number(priceTo) : null,
        price_note: priceNote.trim() || null,
        description: description.trim(),
        isActive
      });

      if (res.data.success) {
        toast.success("Xizmat muvaffaqiyatli yangilandi!");
        setEditingSkill(null);
        fetchData();
      }
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSkill = async (skillId: string) => {
    if (!window.confirm("Haqiqatan ham bu xizmatni o'chirmoqchimisiz?")) return;
    
    setActionLoading(true);
    try {
      const res = await api.delete(`/provider/skills/${skillId}`);
      if (res.data.success) {
        toast.success("Xizmat muvaffaqiyatli o'chirildi");
        fetchData();
      }
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 flex-col gap-3">
        <Loader2 size={36} className="animate-spin text-blue-500" />
        <p className="text-sm font-medium" style={{ color: "var(--muted)" }}>Yuklanmoqda...</p>
      </div>
    );
  }

  const providerProfile = profile?.providerProfile;
  const currentSkills: ProviderSkill[] = providerProfile?.providerSkills || [];
  
  // Filter out available skills that are already added
  const addedSkillIds = new Set(currentSkills.map(cs => cs.skillId));
  const addableSkills = availableSkills.filter(as => !addedSkillIds.has(as.id));

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in px-4">
      {/* Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="p-2 rounded-xl border hover:bg-[var(--sidebar-hover)] transition-colors text-[var(--text-secondary)]" style={{ borderColor: "var(--border-strong)" }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold" style={{ color: "var(--text)" }}>Skill Boshqaruvi</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Aktiv yo'nalish: <strong className="text-blue-500">{application?.category?.name || "Kategoriya topilmadi"}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn-primary py-3 px-5 font-bold flex items-center justify-center gap-2 rounded-xl text-sm self-start sm:self-auto"
        >
          <Plus size={16} /> Yangi xizmat qo'shish
        </button>
      </div>

      {/* Main List */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Award className="text-blue-500" size={22} />
            Mening xizmatlarim ({currentSkills.length} ta)
          </h2>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--muted)" }}>
            Ushbu xizmatlar sizning profilingizda mijozlarga ko'rinadi. Har biriga o'zingizning shaxsiy tajribangiz, narxlaringiz va batafsil tavsifingizni bera olasiz.
          </p>
        </div>

        {currentSkills.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4" style={{ borderColor: "var(--border-strong)" }}>
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Briefcase size={28} />
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>Xizmatlar topilmadi</h3>
              <p className="text-sm max-w-sm mt-1 mx-auto" style={{ color: "var(--text-secondary)" }}>
                Sizda hali hech qanday faol xizmat turi yo'q. Tasdiqlangan yo'nalishingiz bo'yicha ko'nikmalarni qo'shing.
              </p>
            </div>
            <button onClick={handleOpenAddModal} className="btn-primary py-2.5 px-4 text-xs font-bold rounded-xl mt-2">
              Birinchi xizmatni qo'shish
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {currentSkills.map((ps) => (
              <div
                key={ps.id}
                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-4 hover:bg-[var(--sidebar-hover)] ${
                  !ps.isActive ? "opacity-60 grayscale border-dashed" : "hover:border-blue-500/20"
                }`}
                style={{ border: "1px solid var(--border-strong)" }}
              >
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg" style={{ color: "var(--text)" }}>{ps.skill?.name}</h4>
                      {!ps.isActive && (
                        <span className="text-[10px] bg-gray-500/10 text-gray-500 px-2 py-0.5 rounded font-bold border border-gray-500/20">
                          Nofaol
                        </span>
                      )}
                    </div>
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {ps.skill?.category?.name || application?.category?.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <div className="font-extrabold text-lg text-blue-500">
                      {ps.priceFrom ? `${ps.priceFrom.toLocaleString()} so'm` : "Kelishuv"}
                      {ps.priceTo ? ` - ${ps.priceTo.toLocaleString()} so'm` : ""}
                    </div>
                    {ps.priceNote && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{ps.priceNote}</p>
                    )}
                  </div>
                </div>

                {ps.description && (
                  <p className="text-sm border-l-2 pl-3 py-0.5 leading-relaxed" style={{ color: "var(--text-secondary)", borderColor: "var(--border-strong)" }}>
                    {ps.description}
                  </p>
                )}

                <div className="flex justify-between items-center pt-3 border-t flex-wrap gap-3" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                    <Clock size={12} className="text-blue-500" />
                    <span>Tajriba: <strong className="font-bold" style={{ color: "var(--text)" }}>{ps.experienceYears} yil</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(ps)}
                      disabled={actionLoading}
                      className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl transition-colors border border-blue-500/20 text-xs font-bold flex items-center gap-1"
                    >
                      <Pencil size={12} /> Tahrirlash
                    </button>
                    <button
                      onClick={() => handleDeleteSkill(ps.skillId)}
                      disabled={actionLoading}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-colors border border-red-500/20 text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 size={12} /> O'chirish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Skill Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors text-[var(--muted)]"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Plus className="text-blue-500" size={24} />
              Xizmat qo'shish
            </h2>
            <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
              Kategoriya: <strong className="text-blue-500">{application?.category?.name}</strong>
            </p>

            <form onSubmit={handleAddSkill} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                  Xizmat turi *
                </label>
                <select
                  required
                  value={selectedSkillId}
                  onChange={(e) => setSelectedSkillId(e.target.value)}
                  className="glass-input text-sm"
                >
                  <option value="">Tanlang...</option>
                  {addableSkills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {addableSkills.length === 0 && (
                  <p className="text-xs text-yellow-600 font-medium flex items-center gap-1 mt-1">
                    <AlertCircle size={12} /> Ushbu kategoriyadagi barcha xizmatlar qo'shilgan
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Minimal narx (so'm)
                  </label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3.5" style={{ color: "var(--muted)" }} />
                    <input
                      type="number"
                      min={0}
                      value={priceFrom}
                      onChange={(e) => setPriceFrom(e.target.value)}
                      placeholder="0"
                      className="glass-input pl-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Maksimal narx (so'm)
                  </label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3.5" style={{ color: "var(--muted)" }} />
                    <input
                      type="number"
                      min={0}
                      value={priceTo}
                      onChange={(e) => setPriceTo(e.target.value)}
                      placeholder="Masalan: 500,000"
                      className="glass-input pl-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Narx bo'yicha izoh
                  </label>
                  <input
                    type="text"
                    value={priceNote}
                    onChange={(e) => setPriceNote(e.target.value)}
                    placeholder="Masalan: kelishuv asosida, soatbay"
                    className="glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Tajriba staji (yil) *
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Shaxsiy xizmat tavsifi *
                  </label>
                  <span className="text-[10px]" style={{ color: description.trim().length >= 20 ? "var(--muted)" : "var(--muted)" }}>
                    Kamida 20 belgi ({description.trim().length}/500)
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ushbu xizmatni qanday bajarishingiz, ishlatadigan materiallaringiz va o'ziga xosliklaringiz haqida yozing..."
                  className="glass-textarea text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost py-2.5 px-4 font-bold text-xs"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || addableSkills.length === 0}
                  className="btn-primary py-2.5 px-5 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Xizmatni qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Skill Modal */}
      {editingSkill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto fade-in relative">
            <button
              onClick={() => setEditingSkill(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors text-[var(--muted)]"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-1 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Pencil className="text-blue-500" size={20} />
              Xizmatni tahrirlash
            </h2>
            <p className="text-xs mb-5" style={{ color: "var(--muted)" }}>
              Nomi: <strong className="text-blue-500">{editingSkill.skill?.name}</strong>
            </p>

            <form onSubmit={handleUpdateSkill} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Minimal narx (so'm)
                  </label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3.5" style={{ color: "var(--muted)" }} />
                    <input
                      type="number"
                      min={0}
                      value={priceFrom}
                      onChange={(e) => setPriceFrom(e.target.value)}
                      placeholder="0"
                      className="glass-input pl-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Maksimal narx (so'm)
                  </label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-3.5" style={{ color: "var(--muted)" }} />
                    <input
                      type="number"
                      min={0}
                      value={priceTo}
                      onChange={(e) => setPriceTo(e.target.value)}
                      placeholder="Masalan: 500,000"
                      className="glass-input pl-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Narx bo'yicha izoh
                  </label>
                  <input
                    type="text"
                    value={priceNote}
                    onChange={(e) => setPriceNote(e.target.value)}
                    placeholder="Masalan: kelishuv asosida, soatbay"
                    className="glass-input text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Tajriba staji (yil) *
                  </label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    required
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                    Shaxsiy xizmat tavsifi *
                  </label>
                  <span className="text-[10px]" style={{ color: description.trim().length >= 20 ? "var(--muted)" : "var(--muted)" }}>
                    Kamida 20 belgi ({description.trim().length}/500)
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ushbu xizmatni qanday bajarishingiz, ishlatadigan materiallaringiz va o'ziga xosliklaringiz haqida yozing..."
                  className="glass-textarea text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-semibold cursor-pointer select-none" style={{ color: "var(--text)" }}>
                  Ushbu xizmat hozirda faol va mijozlarga ko'rinsin
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setEditingSkill(null)}
                  className="btn-ghost py-2.5 px-4 font-bold text-xs"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary py-2.5 px-5 font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Yangilash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
