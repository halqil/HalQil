"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/store";
import api from "../../lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import Avatar from "../../components/Avatar";
import {
  User, Mail, Shield, Star, Calendar, Briefcase, MapPin,
  CheckCircle, Edit3, Copy, MessageSquare, Rocket, Clock,
  XCircle, BarChart3, Award, Building
} from "lucide-react";

import { AxiosError } from "axios";

export default function Profile() {
  const { isAuthenticated, user: authUser, login: setAuth } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");

  const [application, setApplication] = useState<Record<string, any> | null | false>(null);

  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");

  const [showJoinOrg, setShowJoinOrg] = useState(false);
  const [orgJoinId, setOrgJoinId] = useState("");
  const [orgJoinMsg, setOrgJoinMsg] = useState("");
  const [orgsList, setOrgsList] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return; }
    fetchProfile();
    fetchMyApplication();
    api.get("/organizations").then(r => setOrgsList(r.data.data)).catch(console.error);
  }, [isAuthenticated, router]);

  const fetchProfile = async () => {
    try {
      const res = await api.get("/user/me");
      if (res.data.success) {
        setProfile(res.data.data);
        setFirstName(res.data.data.firstName || "");
        setLastName(res.data.data.lastName || "");
        setUsername(res.data.data.username || "");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyApplication = async () => {
    try {
      const res = await api.get("/provider/my-application");
      if (res.data.success) setApplication(res.data.data);
      else setApplication(false);
    } catch (error) {
      setApplication(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch("/user/me/profile", { firstName, lastName, username });
      if (res.data.success) {
        toast.success("Profil yangilandi!");
        setProfile({ ...profile, ...res.data.data });
        const token = localStorage.getItem("accessToken") || "";
        const refreshToken = localStorage.getItem("refreshToken") || "";
        setAuth({ ...authUser!, name: res.data.data.name, username: res.data.data.username }, token, refreshToken);
        setEditing(false);
      }
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik yuz berdi");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN": return { label: "Super Admin", color: "bg-red-500/10 text-red-500 border-red-500/20" };
      case "PROVIDER": return { label: "Provayder", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
      default: return { label: "Foydalanuvchi", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
    }
  };

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/provider/organization/apply-create", { name: orgName, description: orgDesc });
      toast.success("Tashkilot yaratish arizasi yuborildi");
      setShowCreateOrg(false);
      fetchProfile();
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    }
  };

  const handleJoinOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/provider/organization/apply-join", { organization_id: orgJoinId, message: orgJoinMsg });
      toast.success("Qo'shilish arizasi yuborildi");
      setShowJoinOrg(false);
      fetchProfile();
    } catch (error) {
      const err = error as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    }
  };

  const handleOpenAdminChat = async () => {
    try {
      const res = await api.post("/my/admin-chat");
      if (res.data.success) router.push("/admin-chat");
    } catch (error) {
      toast.error("Admin chat ochishda xatolik");
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
  if (!profile) return null;

  const roleBadge = getRoleBadge(profile.role);
  const providerProfile = profile.providerProfile;

  return (
    <div className="max-w-4xl mx-auto space-y-8 fade-in">
      {/* Profile Header */}
      <div className="glass-card p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full" />

        <div className="relative flex flex-col md:flex-row gap-6 items-start">
          <Avatar name={profile.name} avatar={profile.avatar} size="xl" />

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {editing ? (
                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-2 w-full max-w-sm">
                  <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Ism"
                    className="glass-input text-lg font-bold" autoFocus />
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Familya"
                    className="glass-input text-lg font-bold" />
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username"
                    className="glass-input text-lg font-bold" />
                  <div className="flex gap-2 mt-2">
                    <button type="submit" className="btn-primary text-sm py-2">Saqlash</button>
                    <button type="button" onClick={() => {
                      setEditing(false);
                      setFirstName(profile.firstName || "");
                      setLastName(profile.lastName || "");
                      setUsername(profile.username || "");
                    }} className="btn-ghost text-sm py-2">Bekor</button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>{profile.name}</h1>
                  <div className={`w-3 h-3 rounded-full ${profile.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} title={profile.isOnline ? 'Online' : 'Offline'} />
                  <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg hover:bg-[var(--sidebar-hover)] transition-colors" style={{ color: "var(--muted)" }}>
                    <Edit3 size={16} />
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
              <span className="font-medium text-blue-500">@{profile.username}</span>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: "var(--sidebar-hover)" }}>
                <span className="font-mono text-xs" style={{ color: "var(--muted)" }}>ID: {profile.walletId}</span>
                <button onClick={() => { navigator.clipboard.writeText(profile.walletId); toast.success("Nusxalandi"); }}
                  className="hover:text-blue-500 transition-colors" style={{ color: "var(--muted)" }}>
                  <Copy size={12} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
              <div className="flex items-center gap-1.5"><Mail size={14} /><span>{profile.email}</span></div>
              <div className="flex items-center gap-1.5"><Calendar size={14} /><span>A'zo: {new Date(profile.createdAt).toLocaleDateString("uz-UZ")}</span></div>
              <div className="flex items-center gap-1.5"><Star size={14} className="text-yellow-500" /><span>{profile.reliability?.toFixed(1)}% ishonchlilik</span></div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="glass-card p-3 text-center !rounded-xl">
                <div className="text-lg font-extrabold text-blue-500">{Math.round(profile.reliability || 100)}%</div>
                <div className="text-[10px] font-medium flex items-center justify-center gap-1" style={{ color: "var(--muted)" }}>
                  <BarChart3 size={10} /> Ishonchlilik
                </div>
              </div>
              <div className="glass-card p-3 text-center !rounded-xl">
                <div className="text-lg font-extrabold text-green-500">{profile.successfulOrders ?? 0}</div>
                <div className="text-[10px] font-medium flex items-center justify-center gap-1" style={{ color: "var(--muted)" }}>
                  <CheckCircle size={10} /> Muvaffaqiyatli
                </div>
              </div>
              <div className="glass-card p-3 text-center !rounded-xl">
                <div className="text-lg font-extrabold text-red-500">{profile.cancelledOrders ?? 0}</div>
                <div className="text-[10px] font-medium flex items-center justify-center gap-1" style={{ color: "var(--muted)" }}>
                  <XCircle size={10} /> Bekor qilingan
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
              <button onClick={handleOpenAdminChat}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-full text-xs font-bold transition-colors border border-blue-500/20">
                <MessageSquare size={14} /> Admin bilan bog'lanish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Status Section */}
      {profile.role === "USER" && application === false && (
        <div className="glass-card p-8 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Provayder bo'lmoqchimisiz?</h2>
              <p style={{ color: "var(--text-secondary)" }}>O'z mahoratingizni taklif qiling va yangi mijozlar toping!</p>
            </div>
            <Link href="/profile/become-provider" className="btn-success px-6 py-3 font-bold whitespace-nowrap">
              <Rocket size={18} /> Provayder bo'lish
            </Link>
          </div>
        </div>
      )}

      {application && (application as Record<string, any>).status === "PENDING" && (
        <div className="glass-card p-6 text-center bg-yellow-500/5">
          <Clock className="mx-auto mb-3 text-yellow-500" size={32} />
          <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>Arizangiz ko'rib chiqilmoqda...</h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
            Sizning provayder bo'lish arizangiz adminlar tomonidan ko'rib chiqilmoqda.
          </p>
        </div>
      )}

      {application && (application as Record<string, any>).status === "REJECTED" && (
        <div className="glass-card p-6 bg-red-500/5">
          <XCircle className="text-red-500 mb-3" size={32} />
          <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>Arizangiz rad etildi</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            Sabab: {(application as Record<string, any>).rejectionNote || "Ko'rsatilmagan"}
          </p>
          <Link href="/profile/become-provider" className="btn-danger text-sm">Qayta ariza berish</Link>
        </div>
      )}

      {profile.role === "PROVIDER" && (
        <div className="glass-card p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-emerald-500/5">
          <div className="flex items-center gap-3">
            <Award className="text-emerald-500" size={28} />
            <div>
              <span className="inline-block bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-1">Provayder</span>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Siz tasdiqlangan provaydersiz.</p>
            </div>
          </div>
          <Link href="/provider/dashboard" className="btn-success text-sm whitespace-nowrap">
            Provayder dashboard
          </Link>
        </div>
      )}

      {providerProfile && providerProfile.status === "APPROVED" && (
        <div className="glass-card p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Briefcase size={22} className="text-emerald-500" /> Provayder profili
            </h2>
            <div className="flex items-center gap-2.5">
              <Link href="/profile/skills" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-full text-xs font-bold transition-colors border border-blue-500/20">
                <Edit3 size={12} /> Skill boshqaruvi
              </Link>
              <span className="glass-badge bg-emerald-500/10 text-emerald-500">
                <CheckCircle size={12} /> Tasdiqlangan
              </span>
            </div>
          </div>

          {providerProfile.bio && (
            <div>
              <h4 className="text-sm font-medium mb-1" style={{ color: "var(--muted)" }}>Bio</h4>
              <p style={{ color: "var(--text)" }}>{providerProfile.bio}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>Xizmatlar</h4>
            <div className="space-y-2">
              {providerProfile.providerSkills?.map((ps: Record<string, any>) => (
                <div key={ps.id} className="flex justify-between items-center p-3 rounded-xl" style={{ backgroundColor: "var(--sidebar-hover)" }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <span className="font-medium" style={{ color: "var(--text)" }}>{ps.skill?.name}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>({ps.skill?.category?.name})</span>
                  </div>
                  <span className="text-sm text-blue-500 font-medium">
                    {ps.priceFrom ? `${ps.priceFrom.toLocaleString()} so'm` : "Kelishuv"}
                    {ps.priceTo ? ` - ${ps.priceTo.toLocaleString()} so'm` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1" style={{ color: "var(--muted)" }}>
              <MapPin size={14} /> Xizmat hududlari
            </h4>
            <div className="flex flex-wrap gap-2">
              {providerProfile.districts?.map((d: Record<string, any>) => (
                <span key={d.id} className="glass-chip">{d.districtName}</span>
              ))}
            </div>
          </div>

          {providerProfile.portfolio?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2" style={{ color: "var(--muted)" }}>Portfolio</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {providerProfile.portfolio.map((img: Record<string, any>) => (
                  <div key={img.id} className="aspect-square rounded-xl overflow-hidden" style={{ backgroundColor: "var(--skeleton)" }}>
                    <img src={img.imageUrl.startsWith('http') ? img.imageUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${img.imageUrl}`} alt="Portfolio" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organizations Section */}
          <div className="pt-6" style={{ borderTop: "1px solid var(--border-strong)" }}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Building size={20} /> Tashkilotlar
              </h4>
              <div className="flex gap-2">
                <button onClick={() => setShowJoinOrg(true)} className="btn-ghost text-xs py-1.5 px-3">Qo'shilish</button>
                <button onClick={() => setShowCreateOrg(true)} className="btn-success text-xs py-1.5 px-3">Yaratish</button>
              </div>
            </div>

            <div className="space-y-3">
              {providerProfile.adminOfOrganizations?.map((org: Record<string, any>) => (
                <div key={org.id} className="flex justify-between items-center p-3 glass-card !rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center font-bold">{org.name[0]}</div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: "var(--text)" }}>
                        {org.name} <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded ml-1">ADMIN</span>
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>Reyting: {org.rating} | Ishonch: {org.reliability}%</div>
                    </div>
                  </div>
                </div>
              ))}

              {providerProfile.memberOfOrganizations?.map((m: Record<string, any>) => (
                <div key={m.id} className="flex justify-between items-center p-3 glass-card !rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center font-bold" style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--text-secondary)" }}>{m.organization.name[0]}</div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: "var(--text)" }}>{m.organization.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted)" }}>Status: {m.status}</div>
                    </div>
                  </div>
                </div>
              ))}

              {providerProfile.adminOfOrganizations?.length === 0 && providerProfile.memberOfOrganizations?.length === 0 && (
                <p className="text-sm italic" style={{ color: "var(--muted)" }}>Siz hozircha hech qanday tashkilotga a'zo emassiz.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Org Modal */}
      {showCreateOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal p-6 w-full max-w-md fade-in">
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Tashkilot yaratish</h2>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Nomi</label>
                <input required value={orgName} onChange={e => setOrgName(e.target.value)} className="glass-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tavsif</label>
                <textarea value={orgDesc} onChange={e => setOrgDesc(e.target.value)} className="glass-textarea" rows={3} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowCreateOrg(false)} className="btn-ghost">Bekor</button>
                <button type="submit" className="btn-success">Ariza yuborish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Org Modal */}
      {showJoinOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal p-6 w-full max-w-md fade-in">
            <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Tashkilotga qo'shilish</h2>
            <form onSubmit={handleJoinOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Tashkilotni tanlang</label>
                <select required value={orgJoinId} onChange={e => setOrgJoinId(e.target.value)} className="glass-input">
                  <option value="">Tanlang...</option>
                  {orgsList.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Xabar (ixtiyoriy)</label>
                <textarea value={orgJoinMsg} onChange={e => setOrgJoinMsg(e.target.value)} className="glass-textarea" rows={2} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowJoinOrg(false)} className="btn-ghost">Bekor</button>
                <button type="submit" className="btn-primary">Ariza yuborish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
