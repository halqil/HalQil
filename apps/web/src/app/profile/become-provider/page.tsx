"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { useAuthStore } from "../../../lib/store";
import toast from "react-hot-toast";
import { ChevronRight, ChevronLeft, Plus, Trash2, Check, X, Building, Home, RefreshCw, Pencil, PartyPopper } from "lucide-react";

type SkillItem = {
  skillId: string; skillName: string; categoryName: string;
  serviceType: "ORGANIZED" | "UNORGANIZED" | "BOTH";
  experienceYears: number; priceFrom: string; priceTo: string;
  description: string; portfolioImages: string[];
};

type DistrictInfo = { id: string; name: string; city: string; };

const SERVICE_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  ORGANIZED: { label: "Tashkilotli — Mijoz mening joyimga keladi", icon: <Building size={14} className="text-indigo-500" /> },
  UNORGANIZED: { label: "Tashkilotsiz — Men mijozning uyiga boraman", icon: <Home size={14} className="text-emerald-500" /> },
  BOTH: { label: "Ikkalasi ham", icon: <RefreshCw size={14} className="text-blue-500" /> },
};

export default function BecomeProviderPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Step 1
  const [aboutMe, setAboutMe] = useState("");
  const [whyJoin, setWhyJoin] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");

  // Step 2
  const [districts, setDistricts] = useState<string[]>([]);
  const [allDistricts, setAllDistricts] = useState<DistrictInfo[]>([]);
  const [dailyLimit, setDailyLimit] = useState("");

  // Step 3
  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Skill modal state
  const [selCat, setSelCat] = useState("");
  const [selSkill, setSelSkill] = useState("");
  const [selSkillName, setSelSkillName] = useState("");
  const [serviceType, setServiceType] = useState<"ORGANIZED"|"UNORGANIZED"|"BOTH">("UNORGANIZED");
  const [expYears, setExpYears] = useState("1");
  const [priceFrom, setPriceFrom] = useState("");
  const [priceTo, setPriceTo] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    api.get("/catalog/districts").then(r => setAllDistricts(r.data.data || [])).catch(() => {});
    api.get("/catalog/categories").then(r => setCategories(r.data.data || [])).catch(() => {});
  }, [isAuthenticated, router]);

  const groupedDistricts = allDistricts.reduce((acc, d) => {
    if (!acc[d.city]) acc[d.city] = [];
    acc[d.city].push(d);
    return acc;
  }, {} as Record<string, DistrictInfo[]>);

  const catSkills = categories.find(c => c.id === selCat)?.skills?.filter((s: any) => s.isActive) || [];

  const toggleDistrict = (d: string) =>
    setDistricts(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d]);

  const resetSkillModal = () => {
    setSelCat(""); setSelSkill(""); setSelSkillName(""); setServiceType("UNORGANIZED");
    setExpYears("1"); setPriceFrom(""); setPriceTo(""); setDesc(""); setEditingIdx(null);
  };

  const openEditSkill = (idx: number) => {
    const s = skills[idx];
    const cat = categories.find(c => c.skills?.some((sk: any) => sk.id === s.skillId));
    setSelCat(cat?.id || ""); setSelSkill(s.skillId); setSelSkillName(s.skillName);
    setServiceType(s.serviceType); setExpYears(String(s.experienceYears));
    setPriceFrom(s.priceFrom); setPriceTo(s.priceTo); setDesc(s.description);
    setEditingIdx(idx); setShowSkillModal(true);
  };

  const addSkill = () => {
    if (!selSkill) return toast.error("Skill tanlang");
    if (desc.trim().length < 20) return toast.error("Tavsif kamida 20 belgi");
    if (priceFrom && priceTo && Number(priceTo) <= Number(priceFrom)) return toast.error("priceTo > priceFrom bo'lishi kerak");
    const item: SkillItem = {
      skillId: selSkill, skillName: selSkillName,
      categoryName: categories.find(c => c.id === selCat)?.name || "",
      serviceType, experienceYears: Number(expYears),
      priceFrom, priceTo, description: desc.trim(), portfolioImages: []
    };
    if (editingIdx !== null) {
      setSkills(p => p.map((s, i) => i === editingIdx ? item : s));
    } else {
      setSkills(p => [...p, item]);
    }
    resetSkillModal(); setShowSkillModal(false);
  };

  const step1Valid = aboutMe.trim().length >= 50 && whyJoin.trim().length >= 30;
  const step2Valid = districts.length > 0;
  const step3Valid = skills.length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post("/provider/apply", {
        aboutMe: aboutMe.trim(), whyJoin: whyJoin.trim(),
        portfolioLink: portfolioLink.trim() || undefined,
        workDistricts: districts,
        dailyLimit: dailyLimit ? Number(dailyLimit) : undefined,
        skills: skills.map(s => ({
          skillId: s.skillId, serviceType: s.serviceType,
          experienceYears: s.experienceYears,
          priceFrom: s.priceFrom ? Number(s.priceFrom) : undefined,
          priceTo: s.priceTo ? Number(s.priceTo) : undefined,
          description: s.description, portfolioImages: []
        }))
      });
      setDone(true); setShowSummary(false);
      setTimeout(() => router.push("/profile"), 3000);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return (
    <div className="max-w-lg mx-auto py-20 text-center px-4 fade-in">
      <div className="text-6xl mb-4"><PartyPopper size={64} className="mx-auto text-yellow-500" /></div>
      <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>Ariza qabul qilindi!</h1>
      <p style={{ color: "var(--text-secondary)" }}>Admin ko'rib chiqadi. Natija haqida xabar olasiz.</p>
      <p className="text-sm mt-3" style={{ color: "var(--muted)" }}>Profil sahifasiga yo'naltirilmoqda...</p>
    </div>
  );

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-8">
      {[1,2,3].map(n => (
        <div key={n} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step > n ? "bg-emerald-500 text-white" : step === n ? "bg-indigo-600 text-white" : ""
          }`} style={step <= n && step !== n ? { backgroundColor: "var(--sidebar-hover)", color: "var(--muted)" } : undefined}>
            {step > n ? <Check size={14} /> : n}
          </div>
          <span className={`text-sm font-medium hidden sm:block ${step === n ? "text-indigo-500" : ""}`} style={step !== n ? { color: "var(--muted)" } : undefined}>
            {n === 1 ? "O'zim haqimda" : n === 2 ? "Ish joyi" : "Xizmatlarim"}
          </span>
          {n < 3 && <div className={`w-8 h-0.5 ${step > n ? "bg-emerald-400" : ""}`} style={step <= n ? { backgroundColor: "var(--sidebar-hover)" } : undefined} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Provayder bo'lish</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Arizangizni to'ldiring — admin ko'rib chiqadi</p>
      </div>
      <StepIndicator />

      {/* ─── STEP 1 ─── */}
      {step === 1 && (
        <div className="glass-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>O'zingiz haqingizda *</label>
            <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Kamida 50 belgi</p>
            <textarea rows={5} value={aboutMe} onChange={e => setAboutMe(e.target.value)}
              placeholder="Men 5 yillik tajribaga ega santexnikman. Toshkentning barcha tumanlarida xizmat ko'rsataman..."
              className="glass-textarea" />
            <div className="text-right text-xs mt-1" style={{ color: "var(--muted)" }}>{aboutMe.length}/500</div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Nega HalQil'da ishlashni xohlaysiz? *</label>
            <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>Kamida 30 belgi</p>
            <textarea rows={4} value={whyJoin} onChange={e => setWhyJoin(e.target.value)}
              placeholder="Yangi mijozlar topish va..."
              className="glass-textarea" />
            <div className="text-right text-xs mt-1" style={{ color: "var(--muted)" }}>{whyJoin.length}/300</div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Portfolio havolasi (ixtiyoriy)</label>
            <input type="url" value={portfolioLink} onChange={e => setPortfolioLink(e.target.value)}
              placeholder="https://instagram.com/..."
              className="glass-input" />
          </div>
          <button onClick={() => { if (!step1Valid) return toast.error("Barcha majburiy maydonlarni to'ldiring"); setStep(2); }}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${step1Valid ? "btn-primary" : "cursor-not-allowed"}`}
            style={!step1Valid ? { backgroundColor: "var(--sidebar-hover)", color: "var(--muted)" } : undefined}>
            Keyingi <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ─── STEP 2 ─── */}
      {step === 2 && (
        <div className="glass-card p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-3" style={{ color: "var(--text-secondary)" }}>Qaysi tumanlarda xizmat ko'rsatasiz? *</label>
            <div className="space-y-5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(groupedDistricts).map(([city, dists]) => (
                <div key={city}>
                  <h3 className="font-bold mb-2 flex items-center gap-1.5" style={{ color: "var(--text)" }}>
                    <Building size={14} className="text-indigo-500" /> {city}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {dists.map(d => (
                      <button key={d.id} onClick={() => toggleDistrict(d.name)}
                        className={`px-3 py-2.5 rounded-xl text-sm text-left border transition-all ${districts.includes(d.name) ? "bg-indigo-500/10 border-indigo-500 shadow-sm" : ""}`}
                        style={!districts.includes(d.name) ? { borderColor: "var(--border-strong)", backgroundColor: "var(--bg)" } : undefined}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex flex-shrink-0 items-center justify-center transition-colors ${districts.includes(d.name) ? "bg-indigo-600 border-indigo-600" : ""}`} style={!districts.includes(d.name) ? { borderColor: "var(--border-strong)" } : undefined}>
                            {districts.includes(d.name) && <Check size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className={`truncate ${districts.includes(d.name) ? "text-indigo-500 font-medium" : ""}`} style={!districts.includes(d.name) ? { color: "var(--text-secondary)" } : undefined}>{d.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {allDistricts.length === 0 && (
                <div className="text-center py-8 text-sm" style={{ color: "var(--muted)" }}>Tumanlar yuklanmoqda...</div>
              )}
            </div>

            {districts.length > 0 && (
              <div className="mt-4 pt-4 glass-divider">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted)" }}>Tanlangan: {districts.length} ta</p>
                <div className="flex flex-wrap gap-2">
                  {districts.map(d => (
                    <div key={d} className="flex items-center gap-1 bg-indigo-500/10 text-indigo-500 pl-3 pr-1 py-1 rounded-full text-xs font-semibold shadow-sm">
                      <span>{d}</span>
                      <button onClick={() => toggleDistrict(d)} className="hover:bg-indigo-500/20 p-1 rounded-full transition-colors ml-1">
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Kunlik max buyurtmalar (ixtiyoriy)</label>
            <input type="number" min={1} max={50} value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}
              placeholder="Masalan: 5"
              className="glass-input" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold text-sm btn-ghost flex items-center justify-center gap-2">
              <ChevronLeft size={16} /> Orqaga
            </button>
            <button onClick={() => { if (!step2Valid) return toast.error("Kamida 1 ta tuman tanlang"); setStep(3); }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${step2Valid ? "btn-primary" : "cursor-not-allowed"}`}
              style={!step2Valid ? { backgroundColor: "var(--sidebar-hover)", color: "var(--muted)" } : undefined}>
              Keyingi <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3 ─── */}
      {step === 3 && (
        <div className="glass-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Xizmatlarim ({skills.length} ta)</label>
            <button onClick={() => { resetSkillModal(); setShowSkillModal(true); }}
              className="flex items-center gap-1.5 btn-primary px-3 py-1.5 rounded-lg text-sm font-bold">
              <Plus size={14} /> Xizmat qo'shish
            </button>
          </div>
          {skills.length === 0 ? (
            <div className="py-10 text-center text-sm border-2 border-dashed rounded-xl" style={{ color: "var(--muted)", borderColor: "var(--border-strong)" }}>
              Hali xizmat qo'shilmagan
            </div>
          ) : (
            <div className="space-y-3">
              {skills.map((s, i) => (
                <div key={i} className="rounded-xl p-4" style={{ backgroundColor: "var(--sidebar-hover)", border: "1px solid var(--border-strong)" }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold" style={{ color: "var(--text)" }}>{s.skillName}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{s.categoryName} · {s.experienceYears} yil staj</div>
                      <div className="text-xs text-indigo-500 mt-1 flex items-center gap-1">{SERVICE_TYPE_LABELS[s.serviceType].icon} {SERVICE_TYPE_LABELS[s.serviceType].label}</div>
                      {(s.priceFrom || s.priceTo) && (
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {s.priceFrom && `${Number(s.priceFrom).toLocaleString()} so'm`}
                          {s.priceFrom && s.priceTo && " — "}
                          {s.priceTo && `${Number(s.priceTo).toLocaleString()} so'm`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => openEditSkill(i)} className="p-1.5 hover:bg-indigo-500/10 rounded-lg text-indigo-500 text-xs"><Pencil size={14} /></button>
                      <button onClick={() => setSkills(p => p.filter((_, idx) => idx !== i))} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold text-sm btn-ghost flex items-center justify-center gap-2">
              <ChevronLeft size={16} /> Orqaga
            </button>
            <button onClick={() => { if (!step3Valid) return toast.error("Kamida 1 ta xizmat qo'shing"); setShowSummary(true); }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${step3Valid ? "btn-primary" : "cursor-not-allowed"}`}
              style={!step3Valid ? { backgroundColor: "var(--sidebar-hover)", color: "var(--muted)" } : undefined}>
              Yuborish <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Skill Modal ─── */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal fade-in p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold" style={{ color: "var(--text)" }}>Xizmat {editingIdx !== null ? "tahrirlash" : "qo'shish"}</h3>
              <button onClick={() => { resetSkillModal(); setShowSkillModal(false); }}><X size={20} style={{ color: "var(--muted)" }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Kategoriya *</label>
                <select value={selCat} onChange={e => { setSelCat(e.target.value); setSelSkill(""); setSelSkillName(""); }}
                  className="glass-input">
                  <option value="">Tanlang...</option>
                  {categories.filter(c => c.isActive).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {selCat && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Xizmat turi *</label>
                  <select value={selSkill} onChange={e => { setSelSkill(e.target.value); setSelSkillName(catSkills.find((s: any) => s.id === e.target.value)?.name || ""); }}
                    className="glass-input">
                    <option value="">Tanlang...</option>
                    {catSkills.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>Xizmat uslubi *</label>
                <div className="space-y-2">
                  {(["ORGANIZED","UNORGANIZED","BOTH"] as const).map(t => (
                    <label key={t} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${serviceType === t ? "border-indigo-400 bg-indigo-500/10" : ""}`} style={serviceType !== t ? { borderColor: "var(--border-strong)" } : undefined}>
                      <input type="radio" name="serviceType" value={t} checked={serviceType === t} onChange={() => setServiceType(t)} className="accent-indigo-600" />
                      <span className="text-sm flex items-center gap-1.5" style={{ color: "var(--text)" }}>{SERVICE_TYPE_LABELS[t].icon} {SERVICE_TYPE_LABELS[t].label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Ish staji (yil) *</label>
                <input type="number" min={0.5} max={50} step={0.5} value={expYears} onChange={e => setExpYears(e.target.value)}
                  className="glass-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Narx (dan) so'm</label>
                  <input type="number" value={priceFrom} onChange={e => setPriceFrom(e.target.value)} placeholder="50000"
                    className="glass-input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Narx (gacha) so'm</label>
                  <input type="number" value={priceTo} onChange={e => setPriceTo(e.target.value)} placeholder="200000"
                    className="glass-input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tavsif * (kamida 20 belgi)</label>
                <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="Men bu sohada 3 yildan beri ishlayman..."
                  className="glass-textarea" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { resetSkillModal(); setShowSkillModal(false); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium btn-ghost">Bekor</button>
                <button onClick={addSkill} className="flex-1 py-2.5 btn-primary rounded-xl text-sm font-bold">
                  {editingIdx !== null ? "Saqlash" : "Qo'shish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Summary Modal ─── */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal fade-in p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>Ariza xulosasi</h3>
            <div className="space-y-3 text-sm">
              <div className="rounded-xl p-3" style={{ backgroundColor: "var(--sidebar-hover)" }}>
                <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>O'zingiz haqingizda</div>
                <p className="line-clamp-3" style={{ color: "var(--text)" }}>{aboutMe}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "var(--sidebar-hover)" }}>
                <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Tumanlar ({districts.length})</div>
                <p style={{ color: "var(--text)" }}>{districts.join(", ")}</p>
              </div>
              <div className="rounded-xl p-3" style={{ backgroundColor: "var(--sidebar-hover)" }}>
                <div className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Xizmatlar ({skills.length})</div>
                {skills.map((s, i) => <div key={i} style={{ color: "var(--text)" }}>&#8226; {s.skillName} — {s.experienceYears} yil</div>)}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowSummary(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium btn-ghost">Orqaga</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2.5 btn-success rounded-xl text-sm font-bold disabled:opacity-60">
                {submitting ? "Yuborilmoqda..." : "Tasdiqlash va yuborish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
