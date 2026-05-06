"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "../../../lib/api";
import { useAuthStore } from "../../../lib/store";
import toast from "react-hot-toast";
import { ChevronRight, ChevronLeft, Plus, Trash2, Check, X } from "lucide-react";

type SkillItem = {
  skillId: string; skillName: string; categoryName: string;
  serviceType: "ORGANIZED" | "UNORGANIZED" | "BOTH";
  experienceYears: number; priceFrom: string; priceTo: string;
  description: string; portfolioImages: string[];
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  ORGANIZED: "🏢 Tashkilotli — Mijoz mening joyimga keladi",
  UNORGANIZED: "🏠 Tashkilotsiz — Men mijozning uyiga boraman",
  BOTH: "🔄 Ikkalasi ham",
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
  const [allDistricts, setAllDistricts] = useState<string[]>([]);
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
  }, [isAuthenticated]);

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
    <div className="max-w-lg mx-auto py-20 text-center px-4">
      <div className="text-6xl mb-4">🎉</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Ariza qabul qilindi!</h1>
      <p className="text-gray-500">Admin ko'rib chiqadi. Natija haqida xabar olasiz.</p>
      <p className="text-sm text-gray-400 mt-3">Profil sahifasiga yo'naltirilmoqda...</p>
    </div>
  );

  const StepIndicator = () => (
    <div className="flex items-center gap-2 mb-8">
      {[1,2,3].map(n => (
        <div key={n} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
            step > n ? "bg-emerald-500 text-white" : step === n ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
          }`}>
            {step > n ? <Check size={14} /> : n}
          </div>
          <span className={`text-sm font-medium hidden sm:block ${step === n ? "text-indigo-700" : "text-gray-400"}`}>
            {n === 1 ? "O'zim haqimda" : n === 2 ? "Ish joyi" : "Xizmatlarim"}
          </span>
          {n < 3 && <div className={`w-8 h-0.5 ${step > n ? "bg-emerald-400" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Provayder bo'lish</h1>
        <p className="text-gray-500 text-sm mt-1">Arizangizni to'ldiring — admin ko'rib chiqadi</p>
      </div>
      <StepIndicator />

      {/* ─── STEP 1 ─── */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">O'zingiz haqingizda *</label>
            <p className="text-xs text-gray-400 mb-2">Kamida 50 belgi</p>
            <textarea rows={5} value={aboutMe} onChange={e => setAboutMe(e.target.value)}
              placeholder="Men 5 yillik tajribaga ega santexnikman. Toshkentning barcha tumanlarida xizmat ko'rsataman..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50" />
            <div className="text-right text-xs text-gray-400 mt-1">{aboutMe.length}/500</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nega HalQil'da ishlashni xohlaysiz? *</label>
            <p className="text-xs text-gray-400 mb-2">Kamida 30 belgi</p>
            <textarea rows={4} value={whyJoin} onChange={e => setWhyJoin(e.target.value)}
              placeholder="Yangi mijozlar topish va..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50" />
            <div className="text-right text-xs text-gray-400 mt-1">{whyJoin.length}/300</div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Portfolio havolasi (ixtiyoriy)</label>
            <input type="url" value={portfolioLink} onChange={e => setPortfolioLink(e.target.value)}
              placeholder="https://instagram.com/..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50" />
          </div>
          <button onClick={() => { if (!step1Valid) return toast.error("Barcha majburiy maydonlarni to'ldiring"); setStep(2); }}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${step1Valid ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
            Keyingi <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ─── STEP 2 ─── */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Qaysi tumanlarda xizmat ko'rsatasiz? *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {allDistricts.map(d => (
                <button key={d} onClick={() => toggleDistrict(d)}
                  className={`px-3 py-2 rounded-lg text-sm text-left border transition-all ${districts.includes(d) ? "bg-indigo-600 text-white border-indigo-600" : "bg-gray-50 text-gray-700 border-gray-200 hover:border-indigo-300"}`}>
                  {districts.includes(d) && "✓ "}{d}
                </button>
              ))}
            </div>
            {districts.length > 0 && <p className="text-xs text-indigo-600 mt-2">Tanlangan: {districts.length} ta</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Kunlik max buyurtmalar (ixtiyoriy)</label>
            <input type="number" min={1} max={50} value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}
              placeholder="Masalan: 5"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2">
              <ChevronLeft size={16} /> Orqaga
            </button>
            <button onClick={() => { if (!step2Valid) return toast.error("Kamida 1 ta tuman tanlang"); setStep(3); }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${step2Valid ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              Keyingi <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3 ─── */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Xizmatlarim ({skills.length} ta)</label>
            <button onClick={() => { resetSkillModal(); setShowSkillModal(true); }}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
              <Plus size={14} /> Xizmat qo'shish
            </button>
          </div>
          {skills.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
              Hali xizmat qo'shilmagan
            </div>
          ) : (
            <div className="space-y-3">
              {skills.map((s, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-gray-800">{s.skillName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{s.categoryName} · {s.experienceYears} yil staj</div>
                      <div className="text-xs text-indigo-600 mt-1">{SERVICE_TYPE_LABELS[s.serviceType]}</div>
                      {(s.priceFrom || s.priceTo) && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {s.priceFrom && `${Number(s.priceFrom).toLocaleString()} so'm`}
                          {s.priceFrom && s.priceTo && " — "}
                          {s.priceTo && `${Number(s.priceTo).toLocaleString()} so'm`}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => openEditSkill(i)} className="p-1.5 hover:bg-indigo-100 rounded-lg text-indigo-600 text-xs">✏️</button>
                      <button onClick={() => setSkills(p => p.filter((_, idx) => idx !== i))} className="p-1.5 hover:bg-red-100 rounded-lg text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="flex-1 py-3 rounded-xl font-bold text-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2">
              <ChevronLeft size={16} /> Orqaga
            </button>
            <button onClick={() => { if (!step3Valid) return toast.error("Kamida 1 ta xizmat qo'shing"); setShowSummary(true); }}
              className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${step3Valid ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
              Yuborish <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Skill Modal ─── */}
      {showSkillModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">Xizmat {editingIdx !== null ? "tahrirlash" : "qo'shish"}</h3>
              <button onClick={() => { resetSkillModal(); setShowSkillModal(false); }}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategoriya *</label>
                <select value={selCat} onChange={e => { setSelCat(e.target.value); setSelSkill(""); setSelSkillName(""); }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Tanlang...</option>
                  {categories.filter(c => c.isActive).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {selCat && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Xizmat turi *</label>
                  <select value={selSkill} onChange={e => { setSelSkill(e.target.value); setSelSkillName(catSkills.find((s: any) => s.id === e.target.value)?.name || ""); }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="">Tanlang...</option>
                    {catSkills.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Xizmat uslubi *</label>
                <div className="space-y-2">
                  {(["ORGANIZED","UNORGANIZED","BOTH"] as const).map(t => (
                    <label key={t} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${serviceType === t ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-200"}`}>
                      <input type="radio" name="serviceType" value={t} checked={serviceType === t} onChange={() => setServiceType(t)} className="accent-indigo-600" />
                      <span className="text-sm">{SERVICE_TYPE_LABELS[t]}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ish staji (yil) *</label>
                <input type="number" min={0.5} max={50} step={0.5} value={expYears} onChange={e => setExpYears(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Narx (dan) so'm</label>
                  <input type="number" value={priceFrom} onChange={e => setPriceFrom(e.target.value)} placeholder="50000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Narx (gacha) so'm</label>
                  <input type="number" value={priceTo} onChange={e => setPriceTo(e.target.value)} placeholder="200000"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tavsif * (kamida 20 belgi)</label>
                <textarea rows={3} value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="Men bu sohada 3 yildan beri ishlayman..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { resetSkillModal(); setShowSkillModal(false); }} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50">Bekor</button>
                <button onClick={addSkill} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold">
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Ariza xulosasi</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="font-semibold text-gray-700 mb-1">O'zingiz haqingizda</div>
                <p className="text-gray-600 line-clamp-3">{aboutMe}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="font-semibold text-gray-700 mb-1">Tumanlar ({districts.length})</div>
                <p className="text-gray-600">{districts.join(", ")}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="font-semibold text-gray-700 mb-1">Xizmatlar ({skills.length})</div>
                {skills.map((s, i) => <div key={i} className="text-gray-600">• {s.skillName} — {s.experienceYears} yil</div>)}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowSummary(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50">Orqaga</button>
              <button onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold">
                {submitting ? "Yuborilmoqda..." : "✅ Tasdiqlash va yuborish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
