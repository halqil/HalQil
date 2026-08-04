"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { User, Calendar, MapPin, Briefcase, Camera, Loader2, Save, ImagePlus, X } from "lucide-react";

const DAYS = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export default function ProviderProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  
  // Bio
  const [bio, setBio] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  // Schedule
  const [schedules, setSchedules] = useState<any[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Locations (Districts)
  const [districts, setDistricts] = useState<string[]>([]);
  const [savingLocations, setSavingLocations] = useState(false);

  // Portfolio
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [savingPortfolio, setSavingPortfolio] = useState(false);

  const UZ_DISTRICTS = [
    'Yunusobod', "Mirzo Ulug'bek", 'Chilonzor', 'Bektemir', 'Yashnobod',
    'Mirobod', 'Sergeli', 'Shayxontohur', 'Olmazor', 'Uchtepa', 'Yakkasaroy', 'Yangihayot',
    'Andijon', 'Namangan', 'Samarqand', 'Buxoro', 'Farg\'ona', 'Qo\'qon',
    'Nukus', 'Urganch', 'Termiz', 'Qarshi', 'Navoiy', 'Jizzax', 'Guliston',
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profRes, schedRes] = await Promise.all([
        api.get("/provider/profile"),
        api.get("/provider/schedule")
      ]);
      
      if (profRes.data.success) {
        setBio(profRes.data.data.bio || "");
        setDistricts(profRes.data.data.serviceLocations || []);
        setPortfolio(profRes.data.data.portfolio || []);
      }
      
      if (schedRes.data.success) {
        setSchedules(schedRes.data.data);
      } else {
        // Init empty
        const empty = DAYS.map((_, i) => ({
          dayOfWeek: i,
          isActive: i >= 1 && i <= 5, // Mon-Fri active by default
          openTime: "09:00",
          closeTime: "18:00"
        }));
        setSchedules(empty);
      }
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      const res = await api.patch("/provider/bio", { bio });
      if (res.data.success) toast.success("Bio saqlandi");
    } catch (e) {
      toast.error("Xatolik");
    } finally {
      setSavingBio(false);
    }
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const res = await api.put("/provider/schedule", { schedules });
      if (res.data.success) toast.success("Jadval saqlandi");
    } catch (e) {
      toast.error("Xatolik");
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleSaveLocations = async () => {
    setSavingLocations(true);
    try {
      const res = await api.put("/provider/locations", { locations: districts });
      if (res.data.success) toast.success("Hududlar saqlandi");
    } catch (e) {
      toast.error("Xatolik");
    } finally {
      setSavingLocations(false);
    }
  };

  const toggleDistrict = (d: string) => {
    setDistricts(prev => 
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const handleSavePortfolio = async () => {
    setSavingPortfolio(true);
    try {
      const res = await api.patch("/provider/profile", { portfolio });
      if (res.data.success) toast.success("Portfolio saqlandi");
    } catch (e) {
      toast.error("Xatolik");
    } finally {
      setSavingPortfolio(false);
    }
  };

  const removePortfolioImage = (index: number) => {
    setPortfolio(prev => prev.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: string, value: any) => {
    setSchedules(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin w-8 h-8 text-primary-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usta Profili</h1>
        <p className="text-gray-500 mt-1">Mijozlar siz haqingizda ko'radigan ma'lumotlarni tahrirlang.</p>
      </div>

      {/* Bio Section */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <User size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">O'zim haqimda (Bio)</h2>
        </div>
        
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="O'zingiz haqingizda, tajribangiz va ko'nikmalaringizni yozing..."
          className="w-full min-h-[120px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
        />
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleSaveBio}
            disabled={savingBio}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {savingBio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Saqlash
          </button>
        </div>
      </section>

      {/* Schedule Section */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
            <Calendar size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Ish jadvali</h2>
        </div>

        <div className="space-y-4">
          {schedules.map((s, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
              <label className="flex items-center gap-3 w-40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={s.isActive}
                  onChange={(e) => updateSchedule(i, 'isActive', e.target.checked)}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                />
                <span className={`font-medium ${s.isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                  {DAYS[s.dayOfWeek]}
                </span>
              </label>

              {s.isActive && (
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="time"
                    value={s.openTime}
                    onChange={(e) => updateSchedule(i, 'openTime', e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="time"
                    value={s.closeTime}
                    onChange={(e) => updateSchedule(i, 'closeTime', e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSaveSchedule}
            disabled={savingSchedule}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {savingSchedule ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Jadvalni saqlash
          </button>
        </div>
      </section>

      {/* Locations Section */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <MapPin size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Xizmat ko'rsatish hududlari</h2>
        </div>

        <div className="flex flex-wrap gap-3">
          {UZ_DISTRICTS.map(d => {
            const isSelected = districts.includes(d);
            return (
              <button
                key={d}
                onClick={() => toggleDistrict(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isSelected 
                    ? 'bg-orange-100 text-orange-700 border border-orange-200 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSaveLocations}
            disabled={savingLocations}
            className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {savingLocations ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Hududlarni saqlash
          </button>
        </div>
      </section>

      {/* Portfolio Section */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <Camera size={20} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Portfolio Galereyasi</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {portfolio.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
              <img src={img} alt={`Portfolio ${i}`} className="w-full h-full object-cover" />
              <button 
                onClick={() => removePortfolioImage(i)}
                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button 
            onClick={() => {
              const url = prompt("Rasm URL manzilini kiriting (MVP):");
              if (url) setPortfolio(prev => [...prev, url]);
            }}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-500 hover:bg-purple-50 flex flex-col items-center justify-center text-gray-400 hover:text-purple-600 transition-colors"
          >
            <ImagePlus size={28} className="mb-2" />
            <span className="text-sm font-medium">Rasm yuklash</span>
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleSavePortfolio}
            disabled={savingPortfolio}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            {savingPortfolio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Galereyani saqlash
          </button>
        </div>
      </section>

    </div>
  );
}
