"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../../lib/store";
import api from "../../../lib/api";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { ArrowRight, Plus, X } from "lucide-react";

interface Category { id: string; name: string; icon?: string; }
interface Skill { id: string; name: string; categoryId: string; category?: Category; }

export default function BecomeProvider() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillDetails, setSkillDetails] = useState<Record<string, { price_from?: number; price_to?: number; experience_years: number }>>({});
  const [districts, setDistricts] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    api.get("/catalog/categories").then(r => setCategories(r.data.data)).catch(console.error);
    api.get("/catalog/skills").then(r => setSkills(r.data.data)).catch(console.error);
  }, [isAuthenticated, router]);

  const filteredSkills = selectedCategory ? skills.filter(s => s.categoryId === selectedCategory) : skills;

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]);
    if (!skillDetails[skillId]) {
      setSkillDetails(prev => ({ ...prev, [skillId]: { experience_years: 0 } }));
    }
  };

  const updateDetail = (skillId: string, field: string, value: string) => {
    setSkillDetails(prev => ({
      ...prev,
      [skillId]: { ...prev[skillId], [field]: field === "experience_years" ? parseFloat(value) || 0 : parseInt(value) || undefined }
    }));
  };

  const addDistrict = () => setDistricts(prev => [...prev, ""]);
  const removeDistrict = (idx: number) => setDistricts(prev => prev.filter((_, i) => i !== idx));
  const updateDistrict = (idx: number, value: string) => setDistricts(prev => prev.map((d, i) => i === idx ? value : d));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDistricts = districts.filter(d => d.trim());
    if (selectedSkills.length === 0) return toast.error("Kamida bitta xizmat turini tanlang");
    if (cleanDistricts.length === 0) return toast.error("Kamida bitta hududni kiriting");

    setLoading(true);
    try {
      const price_notes = selectedSkills.map(skill_id => ({
        skill_id,
        price_from: skillDetails[skill_id]?.price_from,
        price_to: skillDetails[skill_id]?.price_to,
        experience_years: skillDetails[skill_id]?.experience_years ?? 0,
      }));
      await api.post("/provider/apply", { bio, skill_ids: selectedSkills, districts: cleanDistricts, price_notes });
      toast.success("Ariza muvaffaqiyatli yuborildi!");
      router.push("/profile");
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">Provayder bo'lish</h1>
          <p className="text-gray-500">O'z mahoratingizni taklif qiling va mijozlar toping</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">O'zingiz haqingizda</label>
            <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tajribangiz, malakangiz haqida qisqacha..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Xizmat turlari</label>
            <div className="flex flex-wrap gap-2 mb-4">
              <button type="button" onClick={() => setSelectedCategory("")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${!selectedCategory ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                Barchasi
              </button>
              {categories.map(cat => (
                <button key={cat.id} type="button" onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedCategory === cat.id ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {cat.icon || "📁"} {cat.name}
                </button>
              ))}
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredSkills.map(skill => {
                const isSelected = selectedSkills.includes(skill.id);
                return (
                  <div key={skill.id} className={`p-3 rounded-xl border-2 transition-all ${isSelected ? "border-emerald-400 bg-emerald-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSkill(skill.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500" />
                      <span className="font-medium text-sm">{skill.name}</span>
                      <span className="text-xs text-gray-400">({skill.category?.name})</span>
                    </label>
                    {isSelected && (
                      <div className="grid grid-cols-3 gap-2 mt-3 pl-6">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Narx dan (so'm)</label>
                          <input type="number" placeholder="0"
                            value={skillDetails[skill.id]?.price_from || ""}
                            onChange={e => updateDetail(skill.id, "price_from", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Narx gacha</label>
                          <input type="number" placeholder="0"
                            value={skillDetails[skill.id]?.price_to || ""}
                            onChange={e => updateDetail(skill.id, "price_to", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">Staj (yil) *</label>
                          <input type="number" min="0" max="60" step="0.5" placeholder="0"
                            value={skillDetails[skill.id]?.experience_years ?? ""}
                            onChange={e => updateDetail(skill.id, "experience_years", e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredSkills.length === 0 && <p className="text-gray-400 text-sm text-center py-6">Xizmat turlari topilmadi</p>}
            </div>
          </div>

          {/* Districts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Xizmat ko'rsatish hududlari</label>
            <div className="space-y-2">
              {districts.map((d, idx) => (
                <div key={idx} className="flex gap-2">
                  <input type="text" value={d} onChange={e => updateDistrict(idx, e.target.value)}
                    placeholder="Masalan: Chilonzor, Yunusobod..."
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                  {districts.length > 1 && (
                    <button type="button" onClick={() => removeDistrict(idx)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={20} /></button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addDistrict} className="flex items-center gap-1 text-emerald-600 text-sm font-medium hover:text-emerald-700">
                <Plus size={16} /> Yana hudud qo'shish
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
            {loading ? "Yuborilmoqda..." : <><span>Arizani yuborish</span><ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
