"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { Eye, Check, X, MessageSquare, Search, ChevronLeft, ChevronRight, ExternalLink, Clock, CheckCircle, XCircle, Building, Home, RefreshCw } from "lucide-react";

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

const STATUS_BADGE_ICONS: Record<string, { icon: typeof Clock; label: string }> = {
  PENDING: { icon: Clock, label: "Kutilmoqda" },
  APPROVED: { icon: CheckCircle, label: "Tasdiqlandi" },
  REJECTED: { icon: XCircle, label: "Rad etildi" },
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-500/10 text-amber-500",
  APPROVED: "bg-emerald-500/10 text-emerald-500",
  REJECTED: "bg-red-500/10 text-red-500",
};
const SERVICE_LABELS_DATA: Record<string, { icon: typeof Building; label: string }> = {
  ORGANIZED: { icon: Building, label: "Tashkilotli" },
  UNORGANIZED: { icon: Home, label: "Uyga boradi" },
  BOTH: { icon: RefreshCw, label: "Ikkalasi" },
  INDEPENDENT: { icon: RefreshCw, label: "Ikkalasi" },
};

function StatusBadge({ status }: { status: string }) {
  const data = STATUS_BADGE_ICONS[status];
  if (!data) return null;
  const Icon = data.icon;
  return <span className="inline-flex items-center gap-1"><Icon size={12} /> {data.label}</span>;
}

function ServiceLabel({ serviceType }: { serviceType: string }) {
  const data = SERVICE_LABELS_DATA[serviceType];
  if (!data) return null;
  const Icon = data.icon;
  return <span className="inline-flex items-center gap-1"><Icon size={12} /> {data.label}</span>;
}

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
      toast.success("Ariza tasdiqlandi!");
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
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--sidebar-hover)" }}>
          {["PENDING","APPROVED","REJECTED"].map(s => {
            const BadgeIcon = STATUS_BADGE_ICONS[s].icon;
            return (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${statusFilter === s ? "shadow-sm" : "hover:opacity-80"}`}
                style={statusFilter === s ? { backgroundColor: "var(--card)", color: "var(--text)" } : { color: "var(--text-secondary)" }}>
                <BadgeIcon size={12} /> {STATUS_BADGE_ICONS[s].label}
              </button>
            );
          })}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Ism, username yoki email..."
            className="glass-input w-full pl-9 pr-3 py-2 text-sm" />
        </div>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Jami: <strong>{total}</strong></span>
      </div>

      {/* List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
        ) : applications.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--muted)" }}>Arizalar yo&apos;q</div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-strong)" }}>
            {applications.map(a => (
              <div key={a.id} className="p-4 transition-colors hover:bg-[var(--sidebar-hover)]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 flex-shrink-0">
                    {a.user.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold" style={{ color: "var(--text)" }}>{a.user.name}</span>
                      {a.user.username && <span className="text-indigo-600 text-sm">@{a.user.username}</span>}
                      {a.user.walletId && <span className="font-mono text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--sidebar-hover)" }}>{a.user.walletId}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${STATUS_COLORS[a.status]}`}><StatusBadge status={a.status} /></span>
                    </div>
                    <div className="text-xs mt-0.5 flex gap-3" style={{ color: "var(--muted)" }}>
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
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--border-strong)" }}>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{total} ta</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-[var(--sidebar-hover)]"><ChevronLeft size={15} /></button>
              <span className="text-sm px-2" style={{ color: "var(--text)" }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-[var(--sidebar-hover)]"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      {(detail || detailLoading) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xl h-full overflow-y-auto shadow-2xl" style={{ backgroundColor: "var(--card)" }}>
            <div className="sticky top-0 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "var(--card)", borderBottom: "1px solid var(--border-strong)" }}>
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Ariza tafsilotlari</h2>
              <button onClick={() => setDetail(null)} className="hover:opacity-80" style={{ color: "var(--muted)" }}><X size={20} /></button>
            </div>

            {detailLoading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"/></div>
            ) : detail && (
              <div className="p-6 space-y-6">
                {/* User */}
                <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: "var(--sidebar-hover)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-lg flex-shrink-0">
                      {detail.user.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold" style={{ color: "var(--text)" }}>{detail.user.name}</div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
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
                    {detail.user.walletId && <div><span style={{ color: "var(--text-secondary)" }}>ID:</span> <span className="font-mono">{detail.user.walletId}</span></div>}
                    {detail.user.email && <div><span style={{ color: "var(--text-secondary)" }}>Email:</span> {detail.user.email}</div>}
                    <div><span style={{ color: "var(--text-secondary)" }}>Ishonchlilik:</span> <span className="font-semibold text-emerald-600">{detail.user.reliability}%</span></div>
                    <div><span style={{ color: "var(--text-secondary)" }}>Muvaffaqiyatli:</span> <span className="font-semibold">{detail.user.successfulOrders}</span></div>
                  </div>
                </div>

                {/* Ariza */}
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>O&apos;zi haqida</div>
                    <p className="text-sm p-3 rounded-xl" style={{ color: "var(--text)", backgroundColor: "var(--sidebar-hover)" }}>{detail.aboutMe}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Nega qo&apos;shilmoqchi</div>
                    <p className="text-sm p-3 rounded-xl" style={{ color: "var(--text)", backgroundColor: "var(--sidebar-hover)" }}>{detail.whyJoin}</p>
                  </div>
                  {detail.portfolioLink && (
                    <div>
                      <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Portfolio</div>
                      <a href={detail.portfolioLink} target="_blank" className="text-sm text-indigo-600 hover:underline break-all">{detail.portfolioLink}</a>
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--text-secondary)" }}>Tumanlar</div>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.workDistricts.map(d => (
                        <span key={d} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg">{d}</span>
                      ))}
                    </div>
                  </div>
                  {detail.dailyLimit && (
                    <div className="text-sm" style={{ color: "var(--text-secondary)" }}>Kunlik limit: <strong>{detail.dailyLimit}</strong> ta</div>
                  )}
                </div>

                {/* Skills */}
                <div>
                  <div className="text-xs font-semibold uppercase mb-3" style={{ color: "var(--text-secondary)" }}>Xizmatlar ({detail.skills.length})</div>
                  <div className="space-y-3">
                    {detail.skills.map(s => (
                      <div key={s.id} className="rounded-xl p-4" style={{ backgroundColor: "var(--sidebar-hover)", border: "1px solid var(--border-strong)" }}>
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold" style={{ color: "var(--text)" }}>{s.skill.name}</div>
                            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.skill.category.name}</div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded-lg" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border-strong)" }}><ServiceLabel serviceType={s.serviceType} /></span>
                        </div>
                        <div className="flex gap-4 text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                          <span>Staj: <strong>{s.experienceYears} yil</strong></span>
                          {s.priceFrom && <span>Dan: <strong>{s.priceFrom.toLocaleString()} so&apos;m</strong></span>}
                          {s.priceTo && <span>Gacha: <strong>{s.priceTo.toLocaleString()} so&apos;m</strong></span>}
                        </div>
                        <p className="text-xs mt-2 p-2 rounded-lg" style={{ color: "var(--text-secondary)", backgroundColor: "var(--card)", border: "1px solid var(--border-strong)" }}>{s.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {detail.status === "PENDING" && (
                  <div className="flex gap-2 pt-2 sticky bottom-0 py-4" style={{ backgroundColor: "var(--card)", borderTop: "1px solid var(--border-strong)" }}>
                    <button onClick={() => { setApproveApp(detail.id); setApproveMsg(""); }}
                      className="btn-success flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5">
                      <Check size={15}/> Qabul
                    </button>
                    <button onClick={() => { setChatApp(detail.id); setChatMsg(""); }}
                      className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5">
                      <MessageSquare size={15}/> Chat
                    </button>
                    <button onClick={() => { setRejectApp(detail.id); setRejectReason(""); }}
                      className="btn-danger flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5">
                      <X size={15}/> Rad
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {approveApp && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleApprove} className="glass-modal fade-in p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2"><CheckCircle size={20} /> Arizani qabul qilish</h3>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Qabul qilish xabari *</label>
              <textarea required rows={4} value={approveMsg} onChange={e => setApproveMsg(e.target.value)}
                placeholder="Tabriklaymiz! Siz provayder bo'ldingiz..."
                className="glass-textarea w-full resize-none"/>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setApproveApp(null)} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm font-medium">Bekor</button>
              <button type="submit" disabled={actionLoading} className="btn-success flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
                {actionLoading ? "Yuborilmoqda..." : "Tasdiqlash"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chat Modal */}
      {chatApp && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleChat} className="glass-modal fade-in p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text)" }}><MessageSquare size={20} className="text-blue-500" /> Chat ochish</h3>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Birinchi xabar *</label>
              <textarea required rows={4} value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                placeholder="Salom! Arizangiz haqida bir nechta savollarim bor..."
                className="glass-textarea w-full resize-none"/>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setChatApp(null)} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm font-medium">Bekor</button>
              <button type="submit" disabled={actionLoading} className="btn-primary flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
                {actionLoading ? "..." : "Chat ochish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Modal */}
      {rejectApp && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleReject} className="glass-modal fade-in p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-red-500 flex items-center gap-2"><XCircle size={20} /> Arizani rad etish</h3>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Rad etish sababi *</label>
              <textarea required rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Ariza to'liq emas, ..."
                className="glass-textarea w-full resize-none"/>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRejectApp(null)} className="btn-ghost flex-1 py-2.5 rounded-xl text-sm font-medium">Bekor</button>
              <button type="submit" disabled={actionLoading} className="btn-danger flex-1 py-2.5 rounded-xl text-sm font-bold disabled:opacity-60">
                {actionLoading ? "..." : "Rad etish"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
