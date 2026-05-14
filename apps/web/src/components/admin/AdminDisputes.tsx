"use client";
import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import { timeAgo } from "@/lib/timeAgo";
import {
  AlertTriangle, CheckCircle, User, Wrench, ExternalLink,
  ChevronLeft, ChevronRight, Scale, X, ShieldCheck
} from "lucide-react";

type DisputeOrder = {
  id: string;
  status: string;
  disputeReason?: string;
  unsuccessReason?: string;
  unsuccessCategory?: string;
  finishType?: string;
  createdAt: string;
  updatedAt: string;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  resolveNote?: string | null;
  resolveDecision?: string | null;
  resolver?: { id: string; name: string; firstName?: string; lastName?: string } | null;
  user: { id: string; name: string; avatar?: string };
  provider: { user: { id: string; name: string; avatar?: string } };
  skill: { id: string; name: string };
};

const FILTER_TABS = [
  { key: "ALL",      label: "Barchasi" },
  { key: "DISPUTED", label: "Hal qilinmagan" },
  { key: "RESOLVED", label: "Hal qilingan" },
];

export default function AdminDisputes() {
  const [orders, setOrders]     = useState<DisputeOrder[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading]   = useState(true);

  // Resolve modal
  const [resolveId, setResolveId]       = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<"PROVIDER_FAULT" | "USER_FAULT" | null>(null);
  const [resolveNote, setResolveNote]   = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/orders/disputed", {
        params: { status: statusFilter, page, limit: 20 }
      });
      const d = res.data.data;
      setOrders(d.orders ?? d);
      setTotal(d.total ?? (d.orders ?? d).length);
      setTotalPages(d.totalPages ?? 1);
    } catch { toast.error("Yuklashda xatolik"); }
    finally { setLoading(false); }
  }, [statusFilter, page]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const openResolveModal = (id: string, decision: "PROVIDER_FAULT" | "USER_FAULT") => {
    setResolveId(id);
    setPendingDecision(decision);
    setResolveNote("");
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveId || !pendingDecision || !resolveNote.trim()) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/orders/${resolveId}/resolve`, { decision: pendingDecision, note: resolveNote });
      toast.success("Qaror qabul qilindi");
      setResolveId(null); setPendingDecision(null); setResolveNote("");
      fetchOrders();
    } catch (e) {
      toast.error((e as AxiosError<{ error: string }>).response?.data?.error || "Xatolik");
    } finally { setActionLoading(false); }
  };

  const isResolved = (o: DisputeOrder) => !!o.resolvedBy;

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "var(--sidebar-hover)" }}>
          {FILTER_TABS.map(tab => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === tab.key ? "shadow-sm" : "hover:opacity-80"}`}
              style={statusFilter === tab.key ? { backgroundColor: "var(--card)", color: "var(--text)" } : { color: "var(--text-secondary)" }}>
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Jami: <strong>{total}</strong></span>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"/></div>
      ) : orders.length === 0 ? (
        <div className="glass-card py-16 text-center">
          <CheckCircle className="mx-auto text-green-500/40 mb-3" size={48} />
          <p style={{ color: "var(--muted)" }}>Shikoyatlar yo&apos;q</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className={`glass-card p-5 space-y-4 ${isResolved(order) ? "border-l-4 border-blue-500" : "bg-orange-500/5 border-l-4 border-orange-500"}`}>
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold" style={{ color: "var(--text)" }}>{order.skill?.name}</span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--muted)" }}>
                      #{order.id.slice(-6)}
                    </span>
                    {isResolved(order) ? (
                      <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <ShieldCheck size={11} /> Hal qilindi
                      </span>
                    ) : (
                      <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <AlertTriangle size={11} /> DISPUTED
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(order.createdAt)}</div>
                </div>
                <a href={`/orders/${order.id}`} target="_blank"
                  className="text-xs text-blue-500 hover:underline flex-shrink-0 flex items-center gap-1">
                  Chat tarixi <ExternalLink size={11} />
                </a>
              </div>

              {/* User & Provider */}
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card p-3 bg-blue-500/5 !rounded-xl">
                  <div className="text-xs text-blue-500 font-medium mb-1 flex items-center gap-1"><User size={12} /> Mijoz</div>
                  <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{order.user?.name}</div>
                </div>
                <div className="glass-card p-3 bg-emerald-500/5 !rounded-xl">
                  <div className="text-xs text-emerald-500 font-medium mb-1 flex items-center gap-1"><Wrench size={12} /> Provayder</div>
                  <div className="font-medium text-sm" style={{ color: "var(--text)" }}>{order.provider?.user?.name}</div>
                </div>
              </div>

              {/* Provayder sababi */}
              {(order.unsuccessReason || order.finishType === "UNSUCCESSFUL") && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                  <div className="text-xs font-bold text-orange-500 mb-1">Provayder sababi ({order.unsuccessCategory})</div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{order.unsuccessReason || "-"}</p>
                </div>
              )}

              {/* Shikoyat sababi */}
              {order.disputeReason && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <div className="text-xs font-bold text-red-500 mb-1 flex items-center gap-1"><AlertTriangle size={12} /> Mijoz shikoyati</div>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{order.disputeReason}</p>
                </div>
              )}

              {/* RESOLVED info */}
              {isResolved(order) && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-1">
                  <div className="text-xs font-bold text-blue-500 mb-2 flex items-center gap-1"><ShieldCheck size={13} /> Admin qarori</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${order.resolveDecision === "PROVIDER_FAULT" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
                      {order.resolveDecision === "PROVIDER_FAULT" ? "⚡ Provayder aybdor" : "⚠️ User aybdor"}
                    </span>
                  </div>
                  {order.resolveNote && (
                    <p className="text-sm italic" style={{ color: "var(--text-secondary)" }}>&quot;{order.resolveNote}&quot;</p>
                  )}
                  {order.resolver && (
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      Hal qildi: <span className="font-medium">{order.resolver.name}</span>
                    </div>
                  )}
                  {order.resolvedAt && (
                    <div className="text-xs" style={{ color: "var(--muted)" }}>{timeAgo(order.resolvedAt)}</div>
                  )}
                </div>
              )}

              {/* Action buttons (only DISPUTED) */}
              {!isResolved(order) && order.status === "DISPUTED" && (
                <div className="flex gap-2">
                  <button onClick={() => openResolveModal(order.id, "PROVIDER_FAULT")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                    <Scale size={15} /> Provayder aybdor
                  </button>
                  <button onClick={() => openResolveModal(order.id, "USER_FAULT")}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors flex items-center justify-center gap-2">
                    <Scale size={15} /> User aybdor
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="glass-card px-4 py-3 flex items-center justify-between">
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{total} ta</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-[var(--sidebar-hover)]"><ChevronLeft size={15} /></button>
            <span className="text-sm px-2" style={{ color: "var(--text)" }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-[var(--sidebar-hover)]"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveId && pendingDecision && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <form onSubmit={handleResolve} className="glass-modal fade-in p-6 w-full max-w-md space-y-4">
            <h3 className={`text-lg font-bold flex items-center gap-2 ${pendingDecision === "PROVIDER_FAULT" ? "text-red-500" : "text-amber-500"}`}>
              <Scale size={20} />
              {pendingDecision === "PROVIDER_FAULT" ? "Provayder aybdor" : "User aybdor"}
            </h3>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>
                Admin eslatmasi <span className="text-red-500">*</span>
              </label>
              <textarea
                required rows={4}
                value={resolveNote}
                onChange={e => setResolveNote(e.target.value)}
                placeholder="Qaror sababini yozing..."
                className="glass-textarea w-full resize-none"
              />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setResolveId(null); setPendingDecision(null); }}
                className="btn-ghost flex-1 py-2.5 rounded-xl text-sm font-medium">Bekor</button>
              <button type="submit" disabled={actionLoading || !resolveNote.trim()}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 transition-colors ${pendingDecision === "PROVIDER_FAULT" ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}>
                {actionLoading ? "Saqlanmoqda..." : "Tasdiqlash"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
