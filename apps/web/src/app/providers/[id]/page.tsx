"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../../lib/store";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import Avatar from "../../../components/Avatar";
import {
  Star, MapPin, CheckCircle, ShieldCheck, X, Clock, Building,
  Loader2, Send
} from "lucide-react";

export default function ProviderDetail() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [provider, setProvider] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);

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
          if (res.data.data.providerSkills?.length > 0) setSelectedSkillId(res.data.data.providerSkills[0].skillId);
        }
      } catch (error) {
        toast.error("Mutaxassis topilmadi");
        router.push("/providers");
      } finally { setLoading(false); }
    };
    fetchDetail();
    const interval = setInterval(() => setMinDateTime(getMinDateTime()), 60_000);
    return () => clearInterval(interval);
  }, [id, router]);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error("Avval tizimga kiring!"); router.push("/auth/login"); return; }
    setOrderLoading(true);
    try {
      const res = await api.post("/orders", { provider_id: id, skill_id: selectedSkillId, description, address, preferred_date: preferredDate });
      if (res.data.success) { toast.success("Buyurtma muvaffaqiyatli yuborildi!"); setShowOrderModal(false); }
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    } finally { setOrderLoading(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>;
  if (!provider) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 fade-in">
      {/* Profile Header */}
      <div className="glass-card p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-bl-full -z-10" />

        <Avatar name={provider.user?.name} avatar={provider.user?.avatar} size="xl" className="!w-32 !h-32 !text-4xl ring-4 ring-[var(--border)]" />

        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold" style={{ color: "var(--text)" }}>{provider.user?.name}</h1>
                <div className={`w-3 h-3 rounded-full ${provider.user?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
              </div>
              <div className="text-sm flex items-center gap-2 flex-wrap mb-2" style={{ color: "var(--muted)" }}>
                <span className="font-medium text-blue-500">@{provider.user?.username}</span>
                <span style={{ color: "var(--border-strong)" }}>|</span>
                <span className="font-mono text-xs px-1 rounded" style={{ backgroundColor: "var(--sidebar-hover)" }}>ID: {provider.user?.walletId?.slice(0, 8)}...</span>
                <span style={{ color: "var(--border-strong)" }}>|</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  provider.availabilityStatus === 'AVAILABLE' ? 'bg-green-500/10 text-green-600' :
                  provider.availabilityStatus === 'BUSY' ? 'bg-yellow-500/10 text-yellow-600' : 'bg-gray-500/10 text-gray-500'
                }`}>
                  {provider.availabilityStatus === 'AVAILABLE' ? 'Bo\'sh' : provider.availabilityStatus === 'BUSY' ? 'Band' : 'Offline'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm font-medium">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={18} className="fill-current" />
                  <span>{provider.user?.reliability?.toFixed(1)}% ishonch</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={18} className="fill-current" />
                  <span>{provider.reviews?.length > 0 ? (provider.reviews.reduce((acc: number, curr: Record<string, any>) => acc + curr.rating, 0) / provider.reviews.length).toFixed(1) : 0} ({provider.reviews?.length || 0} sharh)</span>
                </div>
                <div className="flex items-center gap-1 text-blue-500">
                  <ShieldCheck size={18} /> <span>Tasdiqlangan</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1">
              <button onClick={() => provider.availabilityStatus === 'AVAILABLE' && setShowOrderModal(true)}
                disabled={provider.availabilityStatus !== 'AVAILABLE'}
                className={`px-8 py-3 rounded-xl font-bold transition-all w-full md:w-auto ${
                  provider.availabilityStatus === 'AVAILABLE' ? 'btn-primary' : 'opacity-50 cursor-not-allowed'
                }`}
                style={provider.availabilityStatus !== 'AVAILABLE' ? { backgroundColor: 'var(--skeleton)', color: 'var(--muted)', boxShadow: 'none' } : undefined}>
                Buyurtma berish
              </button>
              {provider.availabilityStatus === 'BUSY' && (
                <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                  <Clock size={12} /> Provayder hozir band
                </span>
              )}
            </div>
          </div>

          <p style={{ color: "var(--text-secondary)" }}>{provider.bio || "O'zi haqida ma'lumot kiritilmagan."}</p>

          <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg inline-flex" style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--text-secondary)" }}>
            <MapPin size={16} className="text-red-500" />
            <span className="font-medium">Xizmat hududlari:</span>
            {provider.districts?.map((d: Record<string, any>) => d.districtName).join(", ")}
          </div>

          {provider.memberOfOrganizations?.map((m: Record<string, any>) => m.status === 'ACTIVE' && (
            <div key={m.id} className="mt-4 flex items-center gap-3 p-3 glass-card !rounded-xl bg-indigo-500/5">
              {m.organization?.logo ? <img src={m.organization.logo} className="w-10 h-10 rounded-lg object-cover" /> :
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center"><Building size={20} className="text-indigo-500" /></div>}
              <div>
                <div className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Tashkilot a'zosi</div>
                <a href={`/organizations/${m.organization?.id}`} className="font-bold hover:text-indigo-500 transition-colors" style={{ color: "var(--text)" }}>{m.organization?.name}</a>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Xizmatlar va Narxlar</h2>
            <div className="space-y-4">
              {provider.providerSkills?.map((ps: Record<string, any>) => (
                <div key={ps.id} className="flex justify-between items-center p-4 rounded-xl transition-colors hover:bg-[var(--sidebar-hover)]"
                  style={{ border: "1px solid var(--border-strong)" }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <div>
                      <h4 className="font-bold" style={{ color: "var(--text)" }}>{ps.skill?.name}</h4>
                      {ps.priceNote && <p className="text-sm" style={{ color: "var(--muted)" }}>{ps.priceNote}</p>}
                      {ps.experienceYears > 0 && <p className="text-xs text-blue-500 font-medium mt-1">Staj: {ps.experienceYears} yil</p>}
                    </div>
                  </div>
                  <div className="text-right font-bold text-blue-500">
                    {ps.priceFrom ? `${ps.priceFrom.toLocaleString()} so'm` : "Kelishuv"}
                    {ps.priceTo ? ` - ${ps.priceTo.toLocaleString()} so'm` : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {provider.portfolio?.length > 0 && (
            <div className="glass-card p-8">
              <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Portfolio</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {provider.portfolio.map((img: Record<string, any>) => (
                  <div key={img.id} className="aspect-square rounded-xl overflow-hidden relative group" style={{ backgroundColor: "var(--skeleton)" }}>
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

        <div className="space-y-8">
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Mijozlar fikri</h2>
            {provider.reviews?.length === 0 ? (
              <p className="italic" style={{ color: "var(--muted)" }}>Hali sharhlar yo'q</p>
            ) : (
              <div className="space-y-6">
                {provider.reviews?.map((review: Record<string, any>) => (
                  <div key={review.id} className="pb-4 last:pb-0" style={{ borderBottom: "1px solid var(--border-strong)" }}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-sm" style={{ color: "var(--text)" }}>{review.reviewer?.name}</div>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} className={i < review.rating ? "text-yellow-400 fill-yellow-400" : ""} style={{ color: i < review.rating ? undefined : "var(--skeleton)" }} />
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-blue-500 font-medium mb-1">{review.skill?.name}</div>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{review.comment}</p>
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
          <div className="glass-modal p-8 max-w-lg w-full relative fade-in">
            <button onClick={() => setShowOrderModal(false)} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors" style={{ color: "var(--muted)" }}>
              <X size={22} />
            </button>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Buyurtma berish</h2>

            <form onSubmit={handleOrder} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Xizmat turini tanlang</label>
                <select value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)}
                  className="glass-input" required>
                  {provider.providerSkills?.map((ps: Record<string, any>) => (
                    <option key={ps.skillId} value={ps.skillId}>{ps.skill?.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Muammo tavsifi</label>
                <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Muammoni batafsil tushuntiring..." className="glass-textarea" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Manzil</label>
                <input type="text" required value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="To'liq manzil" className="glass-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Qulay vaqt (ixtiyoriy)</label>
                <input type="datetime-local" min={minDateTime} value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)} className="glass-input" />
              </div>
              <button type="submit" disabled={orderLoading} className="btn-primary w-full py-4 mt-2">
                {orderLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {orderLoading ? "Yuborilmoqda..." : "Buyurtmani tasdiqlash"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
