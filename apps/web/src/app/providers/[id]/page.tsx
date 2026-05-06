"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../../lib/store";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { Star, MapPin, CheckCircle, ShieldCheck } from "lucide-react";

export default function ProviderDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  
  const [provider, setProvider] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  // Order modal state
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);

  // Minimal sana: hozirgi vaqt, timezone bilan
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const [minDateTime, setMinDateTime] = useState(getMinDateTime);

  useEffect(() => {
    if (!id) return;
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/providers/${id}`);
        if (res.data.success) {
          setProvider(res.data.data);
          if (res.data.data.providerSkills?.length > 0) {
            setSelectedSkillId(res.data.data.providerSkills[0].skillId);
          }
        }
      } catch (error) {
        toast.error("Mutaxassis topilmadi");
        router.push("/providers");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();

    // Har daqiqada minDateTime ni yangilash
    const interval = setInterval(() => setMinDateTime(getMinDateTime()), 60_000);
    return () => clearInterval(interval);
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
      const res = await api.post("/orders", {
        provider_id: id,
        skill_id: selectedSkillId,
        description,
        address,
        preferred_date: preferredDate
      });
      if (res.data.success) {
        toast.success("Buyurtma muvaffaqiyatli yuborildi!");
        setShowOrderModal(false);
        // Optionally redirect to user's orders page
      }
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!provider) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-bl-full -z-10"></div>
        
        <div className="w-32 h-32 bg-gray-200 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative">
          {provider.user?.avatar ? (
            <img src={provider.user.avatar} alt={provider.user?.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-bold text-gray-400">{provider.user?.name?.charAt(0)}</span>
          )}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-gray-900">{provider.user?.name}</h1>
                <div className={`w-3 h-3 rounded-full ${provider.user?.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} title={provider.user?.isOnline ? 'Online' : 'Offline'}></div>
              </div>
              <div className="text-sm text-gray-500 mb-2 flex items-center gap-2">
                <span className="font-medium text-blue-600">@{provider.user?.username}</span>
                <span className="text-gray-300">|</span>
                <span>ID: <span className="font-mono bg-gray-100 px-1 rounded">{provider.user?.walletId?.slice(0, 8)}...</span></span>
                <span className="text-gray-300">|</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  provider.availabilityStatus === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                  provider.availabilityStatus === 'BUSY' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {provider.availabilityStatus === 'AVAILABLE' ? '🟢 Bo\'sh' : provider.availabilityStatus === 'BUSY' ? '🟡 Band' : '⚫ Offline'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={18} className="fill-current" />
                  <span>{provider.user?.reliability?.toFixed(1)}% ishonch</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={18} className="fill-current" />
                  <span>{provider.reviews?.length > 0 ? (provider.reviews.reduce((acc: number, curr: Record<string, any>) => acc + curr.rating, 0) / provider.reviews.length).toFixed(1) : 0} Reyting ({provider.reviews?.length || 0} sharh)</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                  <ShieldCheck size={18} className="text-blue-500" />
                  <span>Tasdiqlangan usta</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-1">
              <button 
                onClick={() => provider.availabilityStatus === 'AVAILABLE' && setShowOrderModal(true)}
                disabled={provider.availabilityStatus !== 'AVAILABLE'}
                title={provider.availabilityStatus === 'BUSY' ? 'Provayder hozir band' : ''}
                className={`px-8 py-3 rounded-xl font-bold transition-all shadow-md w-full md:w-auto ${
                  provider.availabilityStatus === 'AVAILABLE'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                }`}
              >
                Buyurtma berish
              </button>
              {provider.availabilityStatus === 'BUSY' && (
                <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                  🟡 Provayder hozir band
                </span>
              )}
            </div>
          </div>

          <p className="text-gray-600 leading-relaxed">{provider.bio || "O'zi haqida ma'lumot kiritilmagan."}</p>

          <div className="flex items-center gap-2 text-gray-600 bg-gray-50 inline-flex px-4 py-2 rounded-lg text-sm">
            <MapPin size={16} className="text-red-500" />
            <span className="font-medium">Xizmat hududlari:</span> 
            {provider.districts?.map((d: Record<string, any>) => d.districtName).join(", ")}
          </div>

          {provider.memberOfOrganizations?.map((m: Record<string, any>) => m.status === 'ACTIVE' && (
            <div key={m.id} className="mt-4 flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              {m.organization?.logo ? <img src={m.organization.logo} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-indigo-200 flex items-center justify-center">🏢</div>}
              <div>
                <div className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Tashkilot a'zosi</div>
                <a href={`/organizations/${m.organization?.id}`} className="font-bold text-gray-900 hover:text-indigo-600">{m.organization?.name}</a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Skills */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6">Xizmatlar va Narxlar</h2>
            <div className="space-y-4">
              {provider.providerSkills?.map((ps: Record<string, any>) => (
                <div key={ps.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <div>
                      <h4 className="font-bold text-gray-900">{ps.skill?.name}</h4>
                      {ps.priceNote && <p className="text-sm text-gray-500">{ps.priceNote}</p>}
                      {ps.experienceYears > 0 && <p className="text-xs text-blue-600 font-medium mt-1">Staj: {ps.experienceYears} yil</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">
                      {ps.priceFrom ? `${ps.priceFrom.toLocaleString()} so'm` : "Kelishuv"} 
                      {ps.priceTo ? ` - ${ps.priceTo.toLocaleString()} so'm` : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio */}
          {provider.portfolio?.length > 0 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold mb-6">Ish namunalari (Portfolio)</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {provider.portfolio.map((img: Record<string, any>) => (
                  <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100 relative group">
                    <img src={`http://localhost:5000${img.imageUrl}`} alt="Portfolio" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                        {img.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Reviews */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6">Mijozlar fikri</h2>
            {provider.reviews?.length === 0 ? (
              <p className="text-gray-500 italic">Hali sharhlar yo'q</p>
            ) : (
              <div className="space-y-6">
                {provider.reviews?.map((review: Record<string, any>) => (
                  <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-sm">{review.reviewer?.name}</div>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-blue-600 font-medium mb-1">{review.skill?.name}</div>
                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  {provider.providerSkills?.map((ps: Record<string, any>) => (
                    <option key={ps.skillId} value={ps.skillId}>{ps.skill?.name}</option>
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qulay vaqt (ixtiyoriy)</label>
                <input 
                  type="datetime-local"
                  min={minDateTime}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={orderLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-md disabled:opacity-70 mt-2"
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
