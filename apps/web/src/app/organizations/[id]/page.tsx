"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../../lib/store";
import api from "../../../lib/api";
import { AxiosError } from "axios";
import toast from "react-hot-toast";
import { Star, Shield, Users, Briefcase, MapPin, Building, Info } from "lucide-react";
import Link from "next/link";
import Avatar from "../../../components/Avatar";

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
        provider_id: org?.adminProviderId,
        organization_id: id,
        skill_id: selectedSkillId,
        description,
        address,
        preferred_date: preferredDate
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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
  if (!org) return null;

  const isMember = org.members?.some((m: Record<string, any>) => m.provider.user.id === user?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-8 fade-in">
      {/* Profile Header */}
      <div className="glass-card p-8 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-bl-full -z-10"></div>

        <div className="w-32 h-32 rounded-3xl flex-shrink-0 flex items-center justify-center overflow-hidden shadow-lg">
          {org.logo ? (
            <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
          ) : (
            <Avatar name={org.name} size="xl" />
          )}
        </div>

        <div className="flex-1 space-y-4 w-full">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--text)" }}>{org.name}</h1>
              <div className="flex items-center gap-4 text-sm font-medium mt-2">
                <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-lg">
                  <Star size={16} className="fill-current" />
                  <span>{org.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                  <Shield size={16} />
                  <span>{org.reliability.toFixed(0)}% ishonchlilik</span>
                </div>
                <div className="flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">
                  <Users size={16} />
                  <span>{org._count.members} a'zo</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowOrderModal(true)}
                className="btn-primary px-8 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg w-full md:w-auto"
              >
                Buyurtma berish
              </button>
              {user?.role === 'PROVIDER' && !isMember && org.adminProvider?.user?.id !== user?.id && (
                 <button onClick={handleApplyToJoin} className="btn-ghost px-8 py-2 rounded-xl font-bold transition-all w-full md:w-auto" style={{ borderColor: "var(--border-strong)" }}>
                    Tashkilotga qo'shilish
                 </button>
              )}
            </div>
          </div>

          <p className="leading-relaxed p-4 rounded-xl" style={{ color: "var(--text-secondary)", backgroundColor: "var(--sidebar-hover)", borderColor: "var(--border-strong)" }}>
            {org.description || "Tashkilot haqida ma'lumot yo'q."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Members */}
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Users className="text-indigo-500" />
              Tashkilot a'zolari
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {org.members?.map((m: Record<string, any>) => (
                <Link href={`/providers/${m.provider.id}`} key={m.id}>
                  <div className="flex items-center gap-3 p-4 rounded-xl hover:shadow-sm transition-all cursor-pointer" style={{ border: "1px solid var(--border-strong)" }}>
                    <Avatar name={m.provider.user.name} avatar={m.provider.user.avatar} size="md" />
                    <div>
                      <h4 className="font-bold" style={{ color: "var(--text)" }}>{m.provider.user.name}</h4>
                      <div className="flex items-center gap-2 text-xs font-medium mt-1">
                        <span className="flex items-center gap-0.5 text-yellow-500">
                          <Star size={12} className="fill-current" /> {m.provider.user.reliability}%
                        </span>
                        {m.provider.id === org.adminProviderId && (
                           <span className="bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded text-[10px]">ADMIN</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Briefcase className="text-indigo-500" />
              Ko'rsatiladigan xizmatlar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {org.skills?.map((s: Record<string, any>) => (
                <div key={s.id} className="p-4 rounded-xl flex flex-col justify-center" style={{ border: "1px solid var(--border-strong)", backgroundColor: "var(--sidebar-hover)" }}>
                  <h4 className="font-bold" style={{ color: "var(--text)" }}>{s.skill.name}</h4>
                  <span className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{s.skill.category?.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column - Admin info */}
        <div className="space-y-8">
           <div className="glass-card p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Info size={18} className="text-indigo-500" />
                Ma'lumot
              </h3>
              <div className="space-y-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                <div className="flex justify-between items-center pb-2 glass-divider">
                  <span className="font-medium" style={{ color: "var(--muted)" }}>Tashkilot admini:</span>
                  <span className="font-bold" style={{ color: "var(--text)" }}>{org.adminProvider?.user?.name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 glass-divider">
                  <span className="font-medium" style={{ color: "var(--muted)" }}>Tashkil etilgan:</span>
                  <span className="font-bold" style={{ color: "var(--text)" }}>{new Date(org.createdAt).toLocaleDateString('uz-UZ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium" style={{ color: "var(--muted)" }}>Bajarilgan ishlar:</span>
                  <span className="font-bold" style={{ color: "var(--text)" }}>{org._count.orders}</span>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="glass-modal fade-in p-8 max-w-lg w-full relative">
            <button onClick={() => setShowOrderModal(false)} className="absolute top-4 right-4 text-2xl leading-none" style={{ color: "var(--muted)" }}>&times;</button>
            <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Buyurtma berish</h2>

            <form onSubmit={handleOrder} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Xizmat turini tanlang</label>
                <select
                  value={selectedSkillId}
                  onChange={e => setSelectedSkillId(e.target.value)}
                  className="glass-input"
                  required
                >
                  {org.skills?.map((s: Record<string, any>) => (
                    <option key={s.skillId} value={s.skillId}>{s.skill.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Muammo tavsifi</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Muammoni batafsil tushuntiring..."
                  className="glass-textarea"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Manzil</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="To'liq manzil"
                  className="glass-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Qulay vaqt (ixtiyoriy)</label>
                <input
                  type="datetime-local"
                  min={minDateTime}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="glass-input"
                />
              </div>

              <button
                type="submit"
                disabled={orderLoading}
                className="w-full btn-primary font-bold py-4 rounded-xl transition-all shadow-md disabled:opacity-70 mt-2"
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
