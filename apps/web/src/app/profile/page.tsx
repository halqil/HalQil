"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/store";
import api from "../../lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { User, Mail, Shield, Star, Calendar, Briefcase, MapPin, CheckCircle, Edit3, Copy, MessageSquare } from "lucide-react";

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

  // null = yuklanmagan, false = ariza yo'q, object = ariza mavjud
  const [application, setApplication] = useState<Record<string, any> | null | false>(null);

  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");

  const [showJoinOrg, setShowJoinOrg] = useState(false);
  const [orgJoinId, setOrgJoinId] = useState("");
  const [orgJoinMsg, setOrgJoinMsg] = useState("");
  const [orgsList, setOrgsList] = useState<Array<{id: string, name: string}>>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
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
      if (res.data.success) {
        setApplication(res.data.data);
      } else {
        setApplication(false);
      }
    } catch (error) {
      const err = error as AxiosError<{ code: string }>;
      if (err.response?.status === 404) {
        setApplication(false); // ariza yo'q
      } else {
        setApplication(false);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.patch("/user/me/profile", { firstName, lastName, username });
      if (res.data.success) {
        toast.success("Profil yangilandi!");
        setProfile({ ...profile, ...res.data.data });
        // Update auth store too
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
      case "SUPER_ADMIN": return { label: "Super Admin", color: "bg-red-100 text-red-700 border-red-200" };
      case "PROVIDER": return { label: "Provayder", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
      default: return { label: "Foydalanuvchi", color: "bg-blue-100 text-blue-700 border-blue-200" };
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
      if (res.data.success) {
        router.push("/admin-chat");
      }
    } catch (error) {
      toast.error("Admin chat ochishda xatolik");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!profile) return null;

  const roleBadge = getRoleBadge(profile.role);
  const providerProfile = profile.providerProfile;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full"></div>
        
        <div className="relative flex flex-col md:flex-row gap-6 items-start">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {profile.avatar ? (
              <img src={`http://localhost:5000${profile.avatar}`} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
            ) : (
              profile.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {editing ? (
                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-2 w-full max-w-sm">
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ism"
                    className="text-lg font-bold border-b border-blue-500 focus:outline-none bg-transparent"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Familya"
                    className="text-lg font-bold border-b border-blue-500 focus:outline-none bg-transparent"
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="text-lg font-bold border-b border-blue-500 focus:outline-none bg-transparent"
                  />
                  <div className="flex gap-2 mt-2">
                    <button type="submit" className="text-blue-600 hover:text-blue-800 text-sm font-medium">Saqlash</button>
                    <button type="button" onClick={() => { 
                      setEditing(false); 
                      setFirstName(profile.firstName || ""); 
                      setLastName(profile.lastName || ""); 
                      setUsername(profile.username || ""); 
                    }} className="text-gray-400 hover:text-gray-600 text-sm">Bekor</button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 className="text-2xl font-bold">{profile.name}</h1>
                  <div className={`w-3 h-3 rounded-full ${profile.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} title={profile.isOnline ? 'Online' : 'Offline'}></div>
                  <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-blue-600 transition-colors ml-2">
                    <Edit3 size={16} />
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1.5 font-medium text-blue-600">
                <span>@{profile.username}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded">
                <span className="font-mono text-xs">ID: {profile.walletId}</span>
                <button onClick={() => { navigator.clipboard.writeText(profile.walletId); toast.success("Nusxalandi"); }} className="text-gray-400 hover:text-gray-700">
                  <Copy size={12} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1.5">
                <Mail size={14} />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} />
                <span>A'zo: {new Date(profile.createdAt).toLocaleDateString("uz-UZ")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={14} className="text-yellow-500" />
                <span>{profile.reliability?.toFixed(1)}% ishonchlilik</span>
              </div>
            </div>

            {/* User statistikasi */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-center">
                <div className="text-lg font-extrabold text-blue-700">{Math.round(profile.reliability || 100)}%</div>
                <div className="text-[10px] text-blue-500 font-medium">📊 Ishonchlilik</div>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-center">
                <div className="text-lg font-extrabold text-green-700">{profile.successfulOrders ?? 0}</div>
                <div className="text-[10px] text-green-500 font-medium">✅ Muvaffaqiyatli</div>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">
                <div className="text-lg font-extrabold text-red-600">{profile.cancelledOrders ?? 0}</div>
                <div className="text-[10px] text-red-400 font-medium">❌ Bekor qilingan</div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
              <button
                onClick={handleOpenAdminChat}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs font-bold transition-colors border border-blue-200"
              >
                <MessageSquare size={14} />
                Admin bilan bog'lanish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Provider Status Section ─────────────────────────────────── */}

      {/* 1. USER + ariza yo'q → CTA */}
      {profile.role === "USER" && application === false && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-8 rounded-3xl border border-emerald-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold text-emerald-900 mb-2">Provayder bo'lmoqchimisiz?</h2>
              <p className="text-emerald-700">O'z mahoratingizni taklif qiling va yangi mijozlar toping!</p>
            </div>
            <Link
              href="/profile/become-provider"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md whitespace-nowrap"
            >
              🚀 Provayder bo'lish
            </Link>
          </div>
        </div>
      )}

      {/* 2. Ariza PENDING */}
      {application && (application as Record<string, any>).status === "PENDING" && (
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl text-center">
          <div className="text-3xl mb-2">🟡</div>
          <h3 className="text-lg font-bold text-yellow-800 mb-1">Arizangiz ko'rib chiqilmoqda...</h3>
          <p className="text-yellow-700 text-sm max-w-md mx-auto">
            Sizning provayder bo'lish arizangiz adminlar tomonidan ko'rib chiqilmoqda.
            Natija bo'yicha xabarnoma olasiz.
          </p>
        </div>
      )}

      {/* 3. Ariza REJECTED */}
      {application && (application as Record<string, any>).status === "REJECTED" && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-2xl">
          <div className="text-3xl mb-2">❌</div>
          <h3 className="text-lg font-bold text-red-800 mb-2">Arizangiz rad etildi</h3>
          <p className="text-red-700 text-sm mb-4">
            Sabab: {(application as Record<string, any>).rejectionNote || "Ko'rsatilmagan"}
          </p>
          <Link
            href="/profile/become-provider"
            className="inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Qayta ariza berish
          </Link>
        </div>
      )}

      {/* 4. PROVIDER → Badge + Dashboard tugmasi */}
      {profile.role === "PROVIDER" && (
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">✅</div>
            <div>
              <span className="inline-block bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-1">Provayder</span>
              <p className="text-emerald-800 text-sm">Siz tasdiqlangan provaydersiz. Dashboard orqali xizmatlaringizni boshqaring.</p>
            </div>
          </div>
          <Link
            href="/provider/dashboard"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md whitespace-nowrap text-sm"
          >
            Provayder dashboard →
          </Link>
        </div>
      )}

      {providerProfile && providerProfile.status === "APPROVED" && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Briefcase size={22} className="text-emerald-600" />
              Provayder profili
            </h2>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
              Tasdiqlangan ✓
            </span>
          </div>

          {providerProfile.bio && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Bio</h4>
              <p className="text-gray-800">{providerProfile.bio}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Xizmatlar</h4>
            <div className="space-y-2">
              {providerProfile.providerSkills?.map((ps: Record<string, any>) => (
                <div key={ps.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <span className="font-medium">{ps.skill?.name}</span>
                    <span className="text-xs text-gray-400">({ps.skill?.category?.name})</span>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    {ps.priceFrom ? `${ps.priceFrom.toLocaleString()} so'm` : "Kelishuv"}
                    {ps.priceTo ? ` - ${ps.priceTo.toLocaleString()} so'm` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
              <MapPin size={14} /> Xizmat hududlari
            </h4>
            <div className="flex flex-wrap gap-2">
              {providerProfile.districts?.map((d: Record<string, any>) => (
                <span key={d.id} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium">
                  {d.districtName}
                </span>
              ))}
            </div>
          </div>

          {providerProfile.portfolio?.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Portfolio</h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {providerProfile.portfolio.map((img: Record<string, any>) => (
                  <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={`http://localhost:5000${img.imageUrl}`} alt="Portfolio" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organizations Section */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                🏢 Tashkilotlar
              </h4>
              <div className="flex gap-2">
                <button onClick={() => setShowJoinOrg(true)} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium">Qo'shilish</button>
                <button onClick={() => setShowCreateOrg(true)} className="text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-medium">Yaratish</button>
              </div>
            </div>

            <div className="space-y-3">
              {providerProfile.adminOfOrganizations?.map((org: Record<string, any>) => (
                <div key={org.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold">{org.name[0]}</div>
                    <div>
                      <div className="font-bold text-gray-900">{org.name} <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded ml-1">ADMIN</span></div>
                      <div className="text-xs text-gray-500">Reyting: {org.rating} • Ishonch: {org.reliability}%</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {providerProfile.memberOfOrganizations?.map((m: Record<string, any>) => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center font-bold">{m.organization.name[0]}</div>
                    <div>
                      <div className="font-bold text-gray-900">{m.organization.name}</div>
                      <div className="text-xs text-gray-500">Status: {m.status}</div>
                    </div>
                  </div>
                </div>
              ))}

              {providerProfile.adminOfOrganizations?.length === 0 && providerProfile.memberOfOrganizations?.length === 0 && (
                <p className="text-sm text-gray-500 italic">Siz hozircha hech qanday tashkilotga a'zo emassiz.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Org Modal */}
      {showCreateOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Tashkilot yaratish</h2>
            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nomi</label>
                <input required value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tavsif</label>
                <textarea value={orgDesc} onChange={e => setOrgDesc(e.target.value)} className="w-full border rounded-lg p-2" rows={3}></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowCreateOrg(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Bekor</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Ariza yuborish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Org Modal */}
      {showJoinOrg && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Tashkilotga qo'shilish</h2>
            <form onSubmit={handleJoinOrg} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tashkilotni tanlang</label>
                <select required value={orgJoinId} onChange={e => setOrgJoinId(e.target.value)} className="w-full border rounded-lg p-2">
                  <option value="">Tanlang...</option>
                  {orgsList.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Xabar (ixtiyoriy)</label>
                <textarea value={orgJoinMsg} onChange={e => setOrgJoinMsg(e.target.value)} className="w-full border rounded-lg p-2" rows={2}></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowJoinOrg(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Bekor</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Ariza yuborish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
