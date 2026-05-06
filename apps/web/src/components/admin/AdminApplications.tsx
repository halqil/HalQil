"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { Eye, Check, X, MessageSquare, Search, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

type Application = {
  id: string; status: string; createdAt: string;
  skillsCount: number; districts: string[];
  user: { id: string; name: string; firstName?: string; lastName?: string; username?: string; walletId?: string; email?: string; avatar?: string; isOnline?: boolean; reliability?: number; successfulOrders?: number; cancelledOrders?: number; createdAt?: string; };
};

type AppDetail = Application & {
  aboutMe: string; whyJoin: string; portfolioLink?: string;
  workDistricts: string[]; dailyLimit?: number; rejectionNote?: string;
  skills: Array<{ id: string; skillId: string; serviceType: string; experienceYears: number; priceFrom?: number; priceTo?: number; description: string; portfolioImages: string[]; skill: { id: string; name: string; category: { id: string; name: string } }; }>;
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: "🟡 Kutilmoqda", APPROVED: "✅ Tasdiqlandi", REJECTED: "❌ Rad etildi"
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};
const SERVICE_LABELS: Record<string, string> = {
  ORGANIZED: "🏢 Tashkilotli", UNORGANIZED: "🏠 Uyga boradi", BOTH: "🔄 Ikkalasi", INDEPENDENT: "🔄 Ikkalasi"
};

export default function AdminApplications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [detail, setDetail] = useState<AppDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action modals
  const [approveApp, setApproveApp] = useState<string | null>(null);
  const [rejectApp, setRejectApp] = useState<string | null>(null);
  const [chatApp, setChatApp] = useState<string | null>(null);
  const [approveMsg, setApproveMsg] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [chatMsg, setChatMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/applications", {
        params: { status: statusFilter, search: search || undefined, page, limit: 20 }
      });
      const d = res.data.data;
      setApplications(d.applications);
      setTotal(d.total);
      setTotalPages(d.totalPages);
    } catch { toast.error("Yuklashda xatolik"); }
    finally { setLoading(false); }
  }, [statusFilter, search, page]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);
  useEffect(() => { setPage(1); }, [statusFilter, search]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/admin/applications/${id}`);
      setDetail(res.data.data);
    } catch { toast.error("Xatolik"); }
    finally { setDetailLoading(false); }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveApp || !approveMsg.trim()) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/applications/${approveApp}/approve`, { message: approveMsg });
      toast.success("Ariza tasdiqlandi! ✅");
      setApproveApp(null); setApproveMsg(""); setDetail(null); fetchApplications();
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    } finally { setActionLoading(false); }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectApp || !rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/applications/${rejectApp}/reject`, { reason: rejectReason });
      toast.success("Ariza rad etildi");
      setRejectApp(null); setRejectReason(""); setDetail(null); fetchApplications();
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    } finally { setActionLoading(false); }
  };

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatApp || !chatMsg.trim()) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/applications/${chatApp}/open-chat`, { message: chatMsg });
      toast.success("Chat ochildi!");
      setChatApp(null); setChatMsg("");
    } catch (e) {
      const err = e as AxiosError<{ error: string }>;
      toast.error(err.response?.data?.error || "Xatolik");
    } finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {["PENDING","APPROVED","REJECTED"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === s ? "bg-white shadow-sm text-indigo-700" : "text-gray-500 hover:text-gray-700"}`}>
              {STATUS_BADGE[s]}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ism, username yoki email..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <span className="text-sm text-gray-500">Jami: <strong>{total}</strong></span>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center text-gray-400">Arizalar yo'q</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {applications.map(a => (
              <div key={a.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 flex-shrink-0">
                    {a.user.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800">{a.user.name}</span>
                      {a.user.username && <span className="text-indigo-600 text-sm">@{a.user.username}</span>}
                      {a.user.walletId && <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{a.user.walletId}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[a.status]}`}>{STATUS_BADGE[a.status]}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5 flex gap-3">
                      <span>{new Date(a.createdAt).toLocaleDateString("uz-UZ")}</span>
                      <span>{a.skillsCount} ta xizmat</span>
                      <span>{a.districts?.slice(0,2).join(", ")}{a.districts?.length > 2 ? ` +${a.districts.length-2}` : ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => openDetail(a.id)} title="Batafsil"
                      className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"><Eye size={16} /></button>
                    {a.status === "PENDING" && <>
                      <button onClick={() => { setApproveApp(a.id); setApproveMsg(""); }} title="Tasdiqlash"
                        className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"><Check size={16} /></button>
                      <button onClick={() => { setChatApp(a.id); setChatMsg(""); }} title="Chat ochish"
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><MessageSquare size={16} /></button>
                      <button onClick={() => { setRejectApp(a.id); setRejectReason(""); }} title="Rad etish"
                        className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><X size={16} /></button>
                    </>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">{total} ta</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronLeft size={15} /></button>
              <span className="text-sm text-gray-700 px-2">{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Detail Drawer ─── */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-xl h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Ariza tafsilotlari</h2>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"/></div>
            ) : detail && (
              <div className="p-6 space-y-6">
                {/* User */}
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-lg flex-shrink-0">
                      {detail.user.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800">{detail.user.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className={`w-1.5 h-1.5 rounded-full ${detail.user.isOnline ? "bg-green-500" : "bg-gray-300"}`}/>
                        {detail.user.isOnline ? "Online" : "Offline"}
                        {detail.user.username && <span>· @{detail.user.username}</span>}
                      </div>
                    </div>
                    <a href={`/users/${detail.user.id}`} target="_blank" className="ml-auto text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-xs">
                      Profil <ExternalLink size={11} />
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    {detail.user.walletId && <div><span className="text-gray-500">ID:</span> <span className="font-mono">{detail.user.walletId}</span></div>}
                    {detail.user.email && <div><span className="text-gray-500">Email:</span> {detail.user.email}</div>}
                    <div><span className="text-gray-500">Ishonchlilik:</span> <span className="font-semibold text-emerald-600">{detail.user.reliability}%</span></div>
                    <div><span className="text-gray-500">Muvaffaqiyatli:</span> <span className="font-semibold">{detail.user.successfulOrders}</span></div>
                  </div>
                </div>

                {/* Ariza */}
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">O'zi haqida</div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">{detail.aboutMe}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Nega qo'shilmoqchi</div>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">{detail.whyJoin}</p>
                  </div>
                  {detail.portfolioLink && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Portfolio</div>
                      <a href={detail.portfolioLink} target="_blank" className="text-sm text-indigo-600 hover:underline break-all">{detail.portfolioLink}</a>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Tumanlar</div>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.workDistricts.map(d => (
                        <span key={d} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">{d}</span>
                      ))}
                    </div>
                  </div>
                  {detail.dailyLimit && (
                    <div className="text-sm text-gray-600">Kunlik limit: <strong>{detail.dailyLimit}</strong> ta</div>
                  )}
                </div>

                {/* Skills */}
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Xizmatlar ({detail.skills.length})</div>
                  <div className="space-y-3">
                    {detail.skills.map(s => (
                      <div key={s.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-gray-800">{s.skill.name}</div>
                            <div className="text-xs text-gray-500">{s.skill.category.name}</div>
                          </div>
                          <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-lg">{SERVICE_LABELS[s.serviceType]}</span>
                        </div>
                        <div className="flex gap-4 text-xs text-gray-500 mt-2">
                          <span>Staj: <strong>{s.experienceYears} yil</strong></span>
                          {s.priceFrom && <span>Dan: <strong>{s.priceFrom.toLocaleString()} so'm</strong></span>}
                          {s.priceTo && <span>Gacha: <strong>{s.priceTo.toLocaleString()} so'm</strong></span>}
                        </div>
                        <p className="text-xs text-gray-600 mt-2 bg-white p-2 rounded-lg border border-gray-100">{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {detail.status === "PENDING" && (
                  <div className="flex gap-2 pt-2 sticky bottom-0 bg-white py-4 border-t border-gray-100">
                    <button onClick={() => { setApproveApp(detail.id); setApproveMsg(""); }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5">
                      <Check size={15}/> Qabul
                    </button>
                    <button onClick={() => { setChatApp(detail.id); setChatMsg(""); }}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5">
                      <MessageSquare size={15}/> Chat
                    </button>
                    <button onClick={() => { setRejectApp(detail.id); setRejectReason(""); }}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5">
                      <X size={15}/> Rad
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Approve Modal ─── */}
      {approveApp && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleApprove} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-emerald-700">✅ Arizani qabul qilish</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qabul qilish xabari *</label>
              <textarea required rows={4} value={approveMsg} onChange={e => setApproveMsg(e.target.value)}
                placeholder="Tabriklaymiz! Siz provayder bo'ldingiz..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"/>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setApproveApp(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Bekor</button>
              <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold">
                {actionLoading ? "Yuborilmoqda..." : "Tasdiqlash"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Chat Modal ─── */}
      {chatApp && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleChat} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-blue-700">💬 Chat ochish</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birinchi xabar *</label>
              <textarea required rows={4} value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                placeholder="Salom! Arizangiz haqida bir nechta savollarim bor..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none resize-none"/>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setChatApp(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Bekor</button>
              <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-bold">
                {actionLoading ? "..." : "Chat ochish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Reject Modal ─── */}
      {rejectApp && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleReject} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-red-600">❌ Arizani rad etish</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rad etish sababi *</label>
              <textarea required rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Ariza to'liq emas, ..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-red-500 outline-none resize-none"/>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRejectApp(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50">Bekor</button>
              <button type="submit" disabled={actionLoading} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-bold">
                {actionLoading ? "..." : "Rad etish"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
