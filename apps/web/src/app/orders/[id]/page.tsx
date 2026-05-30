"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import toast from "react-hot-toast"
import Link from "next/link"
import Avatar from "@/components/Avatar"
import {
  MapPin, Clock, FileText, CheckCircle, XCircle,
  MessageSquare, AlertTriangle, ChevronLeft, ChevronRight, Star,
  Loader2, Building
} from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  PENDING:               "Kutilmoqda",
  ACCEPTED:              "Qabul qilindi",
  CHATTING:              "Muloqotda",
  IN_PROGRESS:           "Jarayonda",
  AWAITING_CONFIRMATION: "Tasdiq kutilmoqda",
  COMPLETED:             "Yakunlandi",
  FAILED:                "Muvaffaqiyatsiz",
  CANCELLED:             "Bekor qilindi",
  REJECTED:              "Rad etildi",
  DISPUTED:              "Shikoyat",
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:               "bg-yellow-500/10 text-yellow-600",
  ACCEPTED:              "bg-blue-500/10 text-blue-600",
  CHATTING:              "bg-indigo-500/10 text-indigo-600",
  IN_PROGRESS:           "bg-purple-500/10 text-purple-600",
  AWAITING_CONFIRMATION: "bg-orange-500/10 text-orange-600",
  COMPLETED:             "bg-emerald-500/10 text-emerald-600",
  FAILED:                "bg-red-500/10 text-red-600",
  CANCELLED:             "bg-gray-500/10 text-gray-500",
  REJECTED:              "bg-red-500/10 text-red-600",
  DISPUTED:              "bg-orange-500/10 text-orange-600",
}

const UNSUCCESSFUL_LABELS: Record<string, string> = {
  MY_FAULT:      "Men bajara olmadim",
  CLIENT_ABSENT: "Mijoz uyda yo'q edi",
  NO_MATERIAL:   "Material yoki sharoit yo'q edi",
  OTHER:         "Boshqa sabab",
}

const CHAT_ACTIVE_STATUSES = ["ACCEPTED", "CHATTING", "IN_PROGRESS"]

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()

  const [order, setOrder]     = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Finish modal
  const [showFinish, setShowFinish]   = useState(false)
  const [finishType, setFinishType]   = useState<"SUCCESSFUL" | "UNSUCCESSFUL" | null>(null)
  const [failCategory, setFailCategory] = useState("MY_FAULT")
  const [failReason, setFailReason]   = useState("")
  const [finishLoading, setFinishLoading] = useState(false)

  // Confirm modal
  const [showConfirm, setShowConfirm] = useState(false)
  const [rating, setRating]           = useState(5)
  const [comment, setComment]         = useState("")
  const [confirmLoading, setConfirmLoading] = useState(false)

  // Dispute modal
  const [showDispute, setShowDispute]   = useState(false)
  const [disputeReason, setDisputeReason] = useState("")
  const [disputeLoading, setDisputeLoading] = useState(false)

  // Accept modal
  const [showAccept, setShowAccept] = useState(false)
  const [acceptMsg, setAcceptMsg]   = useState("")
  const [acceptLoading, setAcceptLoading] = useState(false)

  // Reject modal
  const [showReject, setShowReject]     = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [rejectLoading, setRejectLoading] = useState(false)

  // Cancel modal
  const [showCancel, setShowCancel]     = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`)
      if (res.data.success) {
        setOrder(res.data.data)
      }
    } catch {
      toast.error("Buyurtma topilmadi")
      router.push("/orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return }
    fetchOrder()
  }, [id, isAuthenticated])



  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setAcceptLoading(true)
    try {
      await api.patch(`/orders/${id}/accept`, { message: acceptMsg || undefined })
      toast.success("Qabul qilindi!")
      setShowAccept(false); setAcceptMsg("")
      fetchOrder()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    } finally { setAcceptLoading(false) }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectReason.trim()) return
    setRejectLoading(true)
    try {
      await api.patch(`/orders/${id}/reject`, { reason: rejectReason })
      toast.success("Rad etildi")
      setShowReject(false); setRejectReason("")
      fetchOrder()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    } finally { setRejectLoading(false) }
  }

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cancelReason.trim().length < 3) return
    setCancelLoading(true)
    try {
      await api.patch(`/orders/${id}/cancel`, { reason: cancelReason })
      toast.success("Bekor qilindi")
      setShowCancel(false); setCancelReason("")
      fetchOrder()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    } finally { setCancelLoading(false) }
  }

  const handleOpenChat = async () => {
    try {
      await api.patch(`/orders/${id}/chat`)
      toast.success("Chat ochildi!")
      router.push(`/chats/${id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    }
  }

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!finishType) return
    setFinishLoading(true)
    try {
      const body: any = { type: finishType }
      if (finishType === "UNSUCCESSFUL") {
        body.category = failCategory
        body.reason   = failReason
      }
      await api.patch(`/orders/${id}/finish`, body)
      toast.success(finishType === "SUCCESSFUL" ? "Muvaffaqiyatli yakunlandi!" : "Yakunlandi")
      setShowFinish(false); setFinishType(null); setFailReason("")
      fetchOrder()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    } finally { setFinishLoading(false) }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmLoading(true)
    try {
      await api.patch(`/orders/${id}/confirm`, {
        action: "CONFIRM",
        rating,
        comment: comment || undefined
      })
      toast.success("Tasdiqlandi!")
      setShowConfirm(false); setRating(5); setComment("")
      fetchOrder()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    } finally { setConfirmLoading(false) }
  }

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!disputeReason.trim()) return
    setDisputeLoading(true)
    try {
      await api.patch(`/orders/${id}/confirm`, { action: "DISPUTE", reason: disputeReason })
      toast.success("Shikoyat yuborildi!")
      setShowDispute(false); setDisputeReason("")
      fetchOrder()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    } finally { setDisputeLoading(false) }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  )
  if (!order) return null

  const isProvider = user?.role === "PROVIDER" && order.provider?.userId === user?.id
  const otherParty = isProvider ? order.user : order.provider?.user
  const chatActive = CHAT_ACTIVE_STATUSES.includes(order.status)
  const otherPartyLink = isProvider
    ? `/users/${otherParty?.id || order?.userId}` 
    : `/providers/${order?.providerId}`

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 fade-in">

      {/* Orqaga */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm w-fit hover:text-blue-500 transition-colors"
        style={{ color: "var(--text-secondary)" }}>
        <ChevronLeft size={18} /> Buyurtmalar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Chap ustun: Ma'lumotlar ── */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* Asosiy info */}
          <div className="glass-card p-5 flex flex-col gap-4">

            {/* Status va sana */}
            <div className="flex items-center justify-between gap-2">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${STATUS_COLOR[order.status] || "bg-gray-500/10 text-gray-500"}`}>
                {STATUS_LABELS[order.status] || order.status}
              </span>
              <span className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>
                {new Date(order.createdAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>

            {/* Xizmat */}
            <div>
              <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Xizmat</div>
              <div className="font-bold text-base" style={{ color: "var(--text)" }}>
                {order.skill?.name}
              </div>
              {order.skill?.category?.name && (
                <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {order.skill.category.name}
                </div>
              )}
            </div>

            {/* Muammo tavsifi */}
            <div>
              <div className="text-xs mb-1 flex items-center gap-1" style={{ color: "var(--muted)" }}>
                <FileText size={12} /> Muammo tavsifi
              </div>
              <p className="text-sm p-3 rounded-xl leading-relaxed"
                style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--text)" }}>
                {order.description}
              </p>
            </div>

            {/* Manzil, vaqt, tashkilot */}
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                <span style={{ color: "var(--text)" }}>{order.address}</span>
              </div>
              {order.preferredDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-blue-400 flex-shrink-0" />
                  <span style={{ color: "var(--text)" }}>
                    {new Date(order.preferredDate).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>
              )}
              {order.organization && (
                <div className="flex items-center gap-2 text-sm">
                  <Building size={14} className="text-indigo-400 flex-shrink-0" />
                  <Link href={`/organizations/${order.organization.id}`}
                    className="text-indigo-500 hover:underline">
                    {order.organization.name}
                  </Link>
                </div>
              )}
            </div>

            {/* Ajratuvchi */}
            <div style={{ borderTop: "1px solid var(--border-strong)" }} />

            {/* Vaqt jadvali */}
            <div className="flex flex-col gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                Vaqt jadvali
              </div>

              <div className="flex flex-col gap-1.5">
                {/* Yaratildi */}
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <span style={{ color: "var(--text-secondary)" }}>Yaratildi:</span>
                  <span className="font-medium" style={{ color: "var(--text)" }}>
                    {new Date(order.createdAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                </div>

                {/* Qabul qilindi yoki rad etildi */}
                {["ACCEPTED", "CHATTING", "IN_PROGRESS", "AWAITING_CONFIRMATION",
                  "COMPLETED", "FAILED", "DISPUTED"].includes(order.status) && order.updatedAt && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span style={{ color: "var(--text-secondary)" }}>Qabul qilindi:</span>
                    <span className="font-medium" style={{ color: "var(--text)" }}>
                      {new Date(order.updatedAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                )}

                {/* Tasdiq so'raldi */}
                {order.awaitingConfirmAt && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />
                    <span style={{ color: "var(--text-secondary)" }}>Tasdiq so'raldi:</span>
                    <span className="font-medium" style={{ color: "var(--text)" }}>
                      {new Date(order.awaitingConfirmAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                )}

                {/* Yakunlandi */}
                {order.completedAt && ["COMPLETED", "FAILED"].includes(order.status) && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${order.status === "COMPLETED" ? "bg-emerald-500" : "bg-red-400"}`} />
                    <span style={{ color: "var(--text-secondary)" }}>Yakunlandi:</span>
                    <span className="font-medium" style={{ color: "var(--text)" }}>
                      {new Date(order.completedAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                )}

                {/* Admin hal qildi */}
                {order.resolvedAt && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    <span style={{ color: "var(--text-secondary)" }}>Admin qarori:</span>
                    <span className="font-medium" style={{ color: "var(--text)" }}>
                      {new Date(order.resolvedAt).toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Sabab bo'limlari */}
            {(order.cancelReason || order.rejectionReason ||
              order.disputeReason || order.resolveNote) && (
              <>
                <div style={{ borderTop: "1px solid var(--border-strong)" }} />
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                    Sabab
                  </div>

                  {order.cancelReason && (
                    <div className="text-xs p-3 rounded-xl"
                      style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--text-secondary)" }}>
                      <span className="font-semibold block mb-0.5" style={{ color: "var(--text)" }}>
                        Bekor qilish sababi:
                      </span>
                      {order.cancelReason}
                    </div>
                  )}

                  {order.rejectionReason && (
                    <div className="text-xs p-3 rounded-xl"
                      style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--text-secondary)" }}>
                      <span className="font-semibold block mb-0.5" style={{ color: "var(--text)" }}>
                        Rad etish sababi:
                      </span>
                      {order.rejectionReason}
                    </div>
                  )}

                  {order.disputeReason && (
                    <div className="text-xs p-3 rounded-xl bg-orange-500/5"
                      style={{ border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}>
                      <span className="font-semibold block mb-0.5 text-orange-500">
                        Shikoyat sababi:
                      </span>
                      {order.disputeReason}
                    </div>
                  )}

                  {order.resolveNote && (
                    <div className="text-xs p-3 rounded-xl bg-purple-500/5"
                      style={{ border: "1px solid var(--border-strong)", color: "var(--text-secondary)" }}>
                      <span className="font-semibold block mb-0.5 text-purple-500">
                        Admin qarori ({order.resolveDecision === "PROVIDER_FAULT" ? "Provayder aybdor" : "Shikoyat asossiz"}):
                      </span>
                      {order.resolveNote}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Ajratuvchi */}
            <div style={{ borderTop: "1px solid var(--border-strong)" }} />

            {/* Boshqa tomon */}
            {otherParty && (
              <Link
                href={isProvider ? `/users/${order.user?.id}` : `/providers/${order.provider?.id}`}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-blue-500/5"
                style={{ backgroundColor: "var(--sidebar-hover)" }}>
                <Avatar name={otherParty.name} avatar={otherParty.avatar} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs" style={{ color: "var(--muted)" }}>
                    {isProvider ? "Mijoz" : "Provayder"}
                  </div>
                  <div className="text-sm font-semibold truncate hover:text-blue-500 transition-colors"
                    style={{ color: "var(--text)" }}>
                    {otherParty.name}
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: "var(--muted)" }} className="flex-shrink-0" />
              </Link>
            )}
          </div>

          {/* Status banner — User uchun */}
          {!isProvider && order.status === "AWAITING_CONFIRMATION" && (
            <div className={`glass-card p-4 flex flex-col gap-3 ${order.finishType === "SUCCESSFUL" ? "border-emerald-500/30" : "border-orange-500/30"}`}
              style={{ border: "1px solid" }}>
              {order.finishType === "SUCCESSFUL" ? (
                <div className="flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-500" />
                  <span className="font-semibold text-emerald-500 text-sm">
                    Provayder xizmat ko'rsatildi deb belgiladi
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <XCircle size={18} className="text-orange-500" />
                    <span className="font-semibold text-orange-500 text-sm">
                      Provayder muvaffaqiyatsiz dedi
                    </span>
                  </div>
                  {order.unsuccessCategory && (
                    <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
                      Sabab: {UNSUCCESSFUL_LABELS[order.unsuccessCategory] || order.unsuccessCategory}
                    </div>
                  )}
                  {order.unsuccessReason && (
                    <div className="text-xs p-2 rounded-lg" style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--text-secondary)" }}>
                      {order.unsuccessReason}
                    </div>
                  )}
                </>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setShowConfirm(true); setRating(5); setComment("") }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-success flex items-center justify-center gap-1.5">
                  <CheckCircle size={15} /> Tasdiqlash
                </button>
                <button onClick={() => setShowDispute(true)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-danger flex items-center justify-center gap-1.5">
                  <AlertTriangle size={15} /> Shikoyat
                </button>
              </div>
            </div>
          )}

          {!isProvider && order.status === "DISPUTED" && (
            <div className="glass-card p-4 flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" />
              <span className="text-sm text-yellow-500 font-medium">
                Shikoyatingiz ko'rib chiqilmoqda
              </span>
            </div>
          )}

          {!isProvider && order.status === "COMPLETED" && (
            <div className="glass-card p-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-emerald-500" />
              <span className="text-sm text-emerald-500 font-medium">
                {order.autoCompleted ? "Avtomatik yakunlandi" : "Muvaffaqiyatli yakunlandi"}
              </span>
            </div>
          )}

          {!isProvider && order.status === "FAILED" && (
            <div className="glass-card p-4 flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <XCircle size={18} className="text-red-500" />
                <span className="text-sm text-red-500 font-medium">Muvaffaqiyatsiz yakunlandi</span>
              </div>
              {order.unsuccessReason && (
                <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                  {order.unsuccessReason}
                </p>
              )}
            </div>
          )}

          {/* Amal tugmalari */}
          <div className="flex flex-col gap-2">
            {/* Provider tugmalari */}
            {isProvider && order.status === "PENDING" && (
              <>
                <button onClick={() => setShowAccept(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold btn-success flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Qabul qilish
                </button>
                <button onClick={handleOpenChat}
                  className="w-full py-2.5 rounded-xl text-sm font-bold btn-primary flex items-center justify-center gap-2">
                  <MessageSquare size={16} /> Chat ochish
                </button>
                <button onClick={() => setShowReject(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold btn-danger flex items-center justify-center gap-2">
                  <XCircle size={16} /> Rad etish
                </button>
              </>
            )}

            {isProvider && order.status === "CHATTING" && (
              <>
                <div className="p-3 rounded-xl text-xs text-center"
                  style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--text-secondary)" }}>
                  Mijoz bilan muloqot davom etmoqda. Qabul qilsangiz xizmat boshlanadi.
                </div>
                <button onClick={() => setShowAccept(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold btn-success flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Qabul qilish
                </button>
                <button onClick={() => setShowReject(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold btn-danger flex items-center justify-center gap-2">
                  <XCircle size={16} /> Rad etish
                </button>
              </>
            )}

            {/* User tugmalari */}
            {!isProvider && ["PENDING", "ACCEPTED", "CHATTING"].includes(order.status) && (
              <button onClick={() => setShowCancel(true)}
                className="w-full py-2.5 rounded-xl text-sm font-bold btn-danger flex items-center justify-center gap-2">
                <XCircle size={16} /> Bekor qilish
              </button>
            )}
          </div>
        </div>

        {/* ── O'ng ustun: Chatga o'tish ── */}
        <div className="lg:col-span-2">
          <div className="glass-card flex flex-col items-center justify-center gap-4 p-8" style={{ minHeight: "300px" }}>
            <MessageSquare size={48} className="opacity-30" style={{ color: "var(--muted)" }} />
            {chatActive ? (
              <>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Provayder bilan suhbatni davom ettiring
                </p>
                <button
                  onClick={() => router.push(`/chats/${id}`)}
                  className="btn-primary px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  <MessageSquare size={16} /> Chatga o&apos;tish →
                </button>
              </>
            ) : (
              <p className="text-sm text-center" style={{ color: "var(--text-secondary)" }}>
                Chat aktiv emas — {STATUS_LABELS[order.status] || order.status}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALLAR ── */}

      {/* Accept */}
      {showAccept && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAccept} className="glass-modal fade-in p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2">
              <CheckCircle size={20} /> Qabul qilish
            </h3>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Mijozga xabar (ixtiyoriy)
              </label>
              <textarea rows={3} value={acceptMsg} onChange={e => setAcceptMsg(e.target.value)}
                placeholder="Qabul qildim, tez orada yetib boraman..."
                className="glass-textarea" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowAccept(false)}
                className="flex-1 py-2.5 rounded-xl text-sm btn-ghost">Bekor</button>
              <button type="submit" disabled={acceptLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-success disabled:opacity-60">
                {acceptLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Qabul qilish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject */}
      {showReject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReject} className="glass-modal fade-in p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
              <XCircle size={20} /> Rad etish
            </h3>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Sabab *
              </label>
              <textarea required rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Rad etish sababini yozing..." className="glass-textarea" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowReject(false)}
                className="flex-1 py-2.5 rounded-xl text-sm btn-ghost">Bekor</button>
              <button type="submit" disabled={rejectLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-danger disabled:opacity-60">
                {rejectLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Rad etish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cancel */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCancel} className="glass-modal fade-in p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
              <XCircle size={20} className="text-red-500" /> Bekor qilish
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Bu amalni ortga qaytarib bo'lmaydi.
            </p>

            {order.status === "ACCEPTED" && (
              <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                style={{ backgroundColor: "rgba(234, 179, 8, 0.1)", border: "1px solid rgba(234, 179, 8, 0.3)" }}>
                <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                <span className="text-yellow-600">
                  Diqqat! Provayder allaqachon qabul qilgan.
                  Bekor qilish statistikangizga ta'sir qiladi va
                  provayderga xabar yuboriladi.
                </span>
              </div>
            )}

            {order.status === "CHATTING" && (
              <div className="flex items-start gap-2 p-3 rounded-xl text-xs"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-red-600">
                  Diqqat! Provayder bilan muloqot boshlangan.
                  Bekor qilish statistikangizga ta'sir qiladi va
                  provayderga xabar yuboriladi.
                </span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Sabab *
              </label>
              <textarea required rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                placeholder="Kamida 3 ta belgi..." className="glass-textarea" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowCancel(false)}
                className="flex-1 py-2.5 rounded-xl text-sm btn-ghost">Yo'q</button>
              <button type="submit" disabled={cancelLoading || cancelReason.trim().length < 3}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-danger disabled:opacity-60">
                {cancelLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Ha, bekor qilish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Finish */}
      {showFinish && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal fade-in p-6 w-full max-w-md">
            {finishType === null && (
              <>
                <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text)" }}>
                  Xizmat natijasi
                </h3>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
                  Xizmat muvaffaqiyatli ko'rsatildimi?
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setFinishType("SUCCESSFUL")}
                    className="flex-1 py-3 rounded-xl font-bold btn-success flex items-center justify-center gap-2">
                    <CheckCircle size={18} /> Ha
                  </button>
                  <button onClick={() => setFinishType("UNSUCCESSFUL")}
                    className="flex-1 py-3 rounded-xl font-bold btn-danger flex items-center justify-center gap-2">
                    <XCircle size={18} /> Yo'q
                  </button>
                </div>
                <button onClick={() => setShowFinish(false)}
                  className="w-full mt-3 py-2 text-sm btn-ghost rounded-xl">Bekor</button>
              </>
            )}
            {finishType === "SUCCESSFUL" && (
              <form onSubmit={handleFinish} className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2">
                  <CheckCircle size={20} /> Muvaffaqiyatli yakunlash
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Mijozga tasdiqlash uchun yuboriladi.
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFinishType(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm btn-ghost">Orqaga</button>
                  <button type="submit" disabled={finishLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-success disabled:opacity-60">
                    {finishLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Yuborish"}
                  </button>
                </div>
              </form>
            )}
            {finishType === "UNSUCCESSFUL" && (
              <form onSubmit={handleFinish} className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
                  <XCircle size={20} /> Muvaffaqiyatsiz
                </h3>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                    Sabab turi
                  </label>
                  <div className="flex flex-col gap-2">
                    {Object.entries(UNSUCCESSFUL_LABELS).map(([val, label]) => (
                      <label key={val}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          failCategory === val ? "border-red-400 bg-red-500/10" : "hover:bg-[var(--sidebar-hover)]"
                        }`}
                        style={{ borderColor: failCategory === val ? undefined : "var(--border-strong)" }}>
                        <input type="radio" name="failCat" value={val}
                          checked={failCategory === val} onChange={() => setFailCategory(val)}
                          className="accent-red-500" />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                    Sabab matni *
                  </label>
                  <textarea required rows={3} value={failReason} onChange={e => setFailReason(e.target.value)}
                    placeholder="Batafsil tushuntiring..." className="glass-textarea" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setFinishType(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm btn-ghost">Orqaga</button>
                  <button type="submit" disabled={finishLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-danger disabled:opacity-60">
                    {finishLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Yuborish"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Confirm */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleConfirm} className="glass-modal fade-in p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2">
              <CheckCircle size={20} /> Xizmatni tasdiqlash
            </h3>
            {order.finishType === "UNSUCCESSFUL" && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600">
                Provayder muvaffaqiyatsiz deb belgilagan.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Baho
              </label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-1 ${
                      rating >= n ? "bg-yellow-400 text-white" : "bg-yellow-400/10 text-yellow-600"
                    }`}>
                    {n}<Star size={12} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Izoh (ixtiyoriy)
              </label>
              <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Xizmat haqida fikringiz..." className="glass-textarea" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm btn-ghost">Bekor</button>
              <button type="submit" disabled={confirmLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-success disabled:opacity-60">
                {confirmLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Tasdiqlash"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dispute */}
      {showDispute && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleDispute} className="glass-modal fade-in p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-orange-500 flex items-center gap-2">
              <AlertTriangle size={20} /> Shikoyat qilish
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Admin ko'rib chiqadi va qaror qiladi.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Shikoyat sababi *
              </label>
              <textarea required rows={3} value={disputeReason} onChange={e => setDisputeReason(e.target.value)}
                placeholder="Nima sababdan rozi emasligingizni yozing..."
                className="glass-textarea" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowDispute(false)}
                className="flex-1 py-2.5 rounded-xl text-sm btn-ghost">Bekor</button>
              <button type="submit" disabled={disputeLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-danger disabled:opacity-60">
                {disputeLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Shikoyat yuborish"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  )
}
