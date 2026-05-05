"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../../lib/store";
import api from "../../../lib/api";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { Star, Shield, Users, Briefcase, MapPin, Building, Info } from "lucide-react";
import Link from "next/link";

export default function OrganizationDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  const [org, setOrg] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchOrg = async () => {
      try {
        const res = await api.get(`/organizations/${id}`);
        if (res.data.success) {
          setOrg(res.data.data);
          if (res.data.data.skills?.length > 0) {
            setSelectedSkillId(res.data.data.skills[0].skillId);
          }
        }
      } catch (error) {
        toast.error("Tashkilot topilmadi");
        router.push("/organizations");
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, [id, router]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Avval tizimga kiring!");
      router.push("/login");
      return;
    }

    setOrderLoading(true);
    try {
      // Find a provider in this organization who has this skill
      // In a real app, you might just send organizationId and let the backend assign, 
      // or the user selects a specific member. 
      // Based on our controller, we added organizationId to orders. Let's just pass organization_id and the admin as provider for now.
      
      const res = await api.post("/orders", {
        provider_id: org?.adminProviderId, // Default to admin, or we let org accept
        organization_id: id,
        skill_id: selectedSkillId,
        description,
        address,
        preferred_time: preferredTime
      });
      if (res.data.success) {
        toast.success("Buyurtma muvaffaqiyatli yuborildi!");
        setShowOrderModal(false);
      }
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleApplyToJoin = async () => {
    if (!isAuthenticated) return router.push("/login");
    const msg = prompt("Qo'shilish uchun xabar (ixtiyoriy):");
    if (msg === null) return;
    try {
      await api.post("/provider/organization/apply-join", { organization_id: id, message: msg });
      toast.success("Ariza yuborildi!");
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!org) return null;

  const isMember = org.members?.some((m: Record<string, any>) => m.provider.user.id === user?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-full -z-10"></div>
        
        <div className="w-32 h-32 bg-gray-100 rounded-3xl flex-shrink-0 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg text-4xl">
          {org.logo ? <img src={org.logo} alt={org.name} className="w-full h-full object-cover" /> : "🏢"}
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{org.name}</h1>
              <div className="flex items-center gap-4 text-sm font-medium mt-2">
                <div className="flex items-center gap-1 text-yellow-500 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                  <Star size={16} className="fill-current" />
                  <span>{org.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                  <Shield size={16} />
                  <span>{org.reliability.toFixed(0)}% ishonchlilik</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                  <Users size={16} />
                  <span>{org._count.members} a'zo</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setShowOrderModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg w-full md:w-auto"
              >
                Buyurtma berish
              </button>
              {user?.role === 'PROVIDER' && !isMember && org.adminProvider?.user?.id !== user?.id && (
                 <button onClick={handleApplyToJoin} className="bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-2 rounded-xl font-bold transition-all w-full md:w-auto">
                    Tashkilotga qo'shilish
                 </button>
              )}
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            {org.description || "Tashkilot haqida ma'lumot yo'q."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Members */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="text-indigo-600" />
              Tashkilot a'zolari
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {org.members?.map((m: Record<string, any>) => (
                <Link href={`/providers/${m.provider.id}`} key={m.id}>
                  <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer">
                    <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-gray-500">
                      {m.provider.user.avatar ? <img src={m.provider.user.avatar} className="w-full h-full object-cover" /> : m.provider.user.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{m.provider.user.name}</h4>
                      <div className="flex items-center gap-2 text-xs font-medium mt-1">
                        <span className="flex items-center gap-0.5 text-yellow-500">
                          <Star size={12} className="fill-current" /> {m.provider.user.reliability}%
                        </span>
                        {m.provider.id === org.adminProviderId && (
                           <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[10px]">ADMIN</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Briefcase className="text-indigo-600" />
              Ko'rsatiladigan xizmatlar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {org.skills?.map((s: Record<string, any>) => (
                <div key={s.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col justify-center">
                  <h4 className="font-bold text-gray-900">{s.skill.name}</h4>
                  <span className="text-xs text-gray-500 mt-1">{s.skill.category?.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - Admin info */}
        <div className="space-y-8">
           <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl shadow-sm border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <Info size={18} className="text-indigo-600" />
                Ma'lumot
              </h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div className="flex justify-between items-center pb-2 border-b border-indigo-100/50">
                  <span className="font-medium text-gray-500">Tashkilot admini:</span>
                  <span className="font-bold text-gray-900">{org.adminProvider?.user?.name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-indigo-100/50">
                  <span className="font-medium text-gray-500">Tashkil etilgan:</span>
                  <span className="font-bold text-gray-900">{new Date(org.createdAt).toLocaleDateString('uz-UZ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-500">Bajarilgan ishlar:</span>
                  <span className="font-bold text-gray-900">{org._count.orders}</span>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setShowOrderModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 text-2xl leading-none">&times;</button>
            <h2 className="text-2xl font-bold mb-6">Buyurtma berish</h2>
            
            <form onSubmit={handleOrder} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Xizmat turini tanlang</label>
                <select 
                  value={selectedSkillId} 
                  onChange={e => setSelectedSkillId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  {org.skills?.map((s: Record<string, any>) => (
                    <option key={s.skillId} value={s.skillId}>{s.skill.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Muammo tavsifi</label>
                <textarea 
                  required 
                  rows={3} 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Muammoni batafsil tushuntiring..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manzil</label>
                <input 
                  type="text" 
                  required 
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="To'liq manzil"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qulay vaqt (ixtiyoriy)</label>
                <input 
                  type="text" 
                  value={preferredTime}
                  onChange={e => setPreferredTime(e.target.value)}
                  placeholder="Masalan: Ertaga soat 14:00"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={orderLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-md disabled:opacity-70 mt-2"
              >
                {orderLoading ? "Yuborilmoqda..." : "Buyurtmani tasdiqlash"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
