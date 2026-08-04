"use client"
import { useEffect, useState } from "react"
import api from "@/lib/api"
import { useAuthStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Avatar from "@/components/Avatar"
import toast from "react-hot-toast"
import {
  Package, Clock, CheckCircle, XCircle, MessageSquare,
  AlertTriangle, Zap, Loader2, Star, ChevronRight,
  Briefcase, Filter
} from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Kutilmoqda",
  ACCEPTED: "Qabul qilindi",
  CHATTING: "Muloqotda",
  IN_PROGRESS: "Jarayonda",
  AWAITING_CONFIRMATION: "Tasdiq kutilmoqda",
  COMPLETED: "Yakunlandi",
  FAILED: "Muvaffaqiyatsiz",
  CANCELLED: "Bekor qilindi",
  REJECTED: "Rad etildi",
  DISPUTED: "Shikoyat",
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  ACCEPTED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  CHATTING: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  IN_PROGRESS: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  AWAITING_CONFIRMATION: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  FAILED: "bg-red-500/10 text-red-600 border-red-500/20",
  CANCELLED: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
  DISPUTED: "bg-orange-500/10 text-orange-600 border-orange-500/20",
}

const TABS = [
  { key: "all",       label: "Barchasi" },
  { key: "new",       label: "Yangi" },
  { key: "active",    label: "Faol" },
  { key: "awaiting",  label: "Tasdiq kerak" },
  { key: "done",      label: "Yakunlangan" },
  { key: "cancelled", label: "Bekor/Rad" },
]

const ACTIVE_STATUSES   = ["ACCEPTED", "CHATTING", "IN_PROGRESS"]
const DONE_STATUSES     = ["COMPLETED", "FAILED"]
const CANCELLED_STATUSES = ["CANCELLED", "REJECTED", "DISPUTED"]

export default function OrdersPage() {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()

  const [orders, setOrders]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState("all")

  // Accept modal
  const [acceptModal, setAcceptModal] = useState<any>(null)
  const [acceptMsg, setAcceptMsg]     = useState("")
  const [acceptLoading, setAcceptLoading] = useState(false)

  // Reject modal
  const [rejectModal, setRejectModal]     = useState<any>(null)
  const [rejectReason, setRejectReason]   = useState("")
  const [rejectLoading, setRejectLoading] = useState(false)

  // Cancel modal
  const [cancelModal, setCancelModal]     = useState<any>(null)
  const [cancelReason, setCancelReason]   = useState("")
  const [cancelLoading, setCancelLoading] = useState(false)

  // Confirm modal
  const [confirmModal, setConfirmModal] = useState<any>(null)
  const [rating, setRating]             = useState(5)
  const [comment, setComment]           = useState("")
  const [confirmLoading, setConfirmLoading] = useState(false)

  const fetchOrders = async () => {
    try {
      const res = await api.get("/orders")
      if (res.data.success) setOrders(res.data.data)
    } catch { toast.error("Xatolik") }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (!isAuthenticated) { router.push("/auth/login"); return }
    fetchOrders()
  }, [isAuthenticated, router])

  const isProvider = (order: any) =>
    user?.role === "PROVIDER" && order.provider?.userId === user?.id

  const getFiltered = () => {
    switch (tab) {
      case "new":       return orders.filter(o => o.status === "PENDING")
      case "active":    return orders.filter(o => ACTIVE_STATUSES.includes(o.status))
      case "awaiting":  return orders.filter(o => o.status === "AWAITING_CONFIRMATION")
      case "done":      return orders.filter(o => DONE_STATUSES.includes(o.status))
      case "cancelled": return orders.filter(o => CANCELLED_STATUSES.includes(o.status))
      default:          return orders
    }
  }

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!acceptModal) return
    setAcceptLoading(true)
    try {
      await api.patch(`/orders/${acceptModal.id}/accept`, { message: acceptMsg })
      toast.success("Buyurtma qabul qilindi")
      setAcceptModal(null); setAcceptMsg("")
      fetchOrders()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    } finally { setAcceptLoading(false) }
  }

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectModal || !rejectReason.trim()) return
    setRejectLoading(true)
    try {
      await api.patch(`/orders/${rejectModal.id}/reject`, { reason: rejectReason })
      toast.success("Buyurtma rad etildi")
      setRejectModal(null); setRejectReason("")
      fetchOrders()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    } finally { setRejectLoading(false) }
  }

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancelModal || cancelReason.trim().length < 3) return
    setCancelLoading(true)
    try {
      await api.patch(`/orders/${cancelModal.id}/cancel`, { reason: cancelReason })
      toast.success("Buyurtma bekor qilindi")
      setCancelModal(null); setCancelReason("")
      fetchOrders()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    } finally { setCancelLoading(false) }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmModal) return
    setConfirmLoading(true)
    try {
      await api.patch(`/orders/${confirmModal.id}/confirm`, {
        action: "CONFIRM",
        rating,
        comment: comment || undefined
      })
      toast.success("Tasdiqlandi!")
      setConfirmModal(null); setRating(5); setComment("")
      fetchOrders()
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    } finally { setConfirmLoading(false) }
  }

  const handleOpenChat = async (orderId: string) => {
    try {
      await api.patch(`/orders/${orderId}/chat`)
      toast.success("Chat ochildi")
      router.push(`/orders/${orderId}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    }
  }

  const renderBadge = (order: any) => {
    const base = "px-2.5 py-1 rounded-full text-xs font-bold border inline-flex items-center gap-1"
    const cls = STATUS_COLOR[order.status] || "bg-gray-500/10 text-gray-500"
    const icons: Record<string, any> = {
      PENDING: <Clock size={11} />,
      AWAITING_CONFIRMATION: <Clock size={11} />,
      COMPLETED: order.autoCompleted ? <Zap size={11} /> : <CheckCircle size={11} />,
      FAILED: <XCircle size={11} />,
      DISPUTED: <AlertTriangle size={11} />,
      CANCELLED: <XCircle size={11} />,
      REJECTED: <XCircle size={11} />,
    }
    return (
      <span className={`${base} ${cls}`}>
        {icons[order.status]}
        {order.status === "COMPLETED" && order.autoCompleted
          ? "Avtomatik yakunlandi"
          : STATUS_LABELS[order.status] || order.status}
      </span>
    )
  }

  const tabCount = (key: string) => {
    switch (key) {
      case "new":       return orders.filter(o => o.status === "PENDING").length
      case "active":    return orders.filter(o => ACTIVE_STATUSES.includes(o.status)).length
      case "awaiting":  return orders.filter(o => o.status === "AWAITING_CONFIRMATION").length
      case "done":      return orders.filter(o => DONE_STATUSES.includes(o.status)).length
      case "cancelled": return orders.filter(o => CANCELLED_STATUSES.includes(o.status)).length
      default:          return orders.length
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  )

  const filtered = getFiltered()

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Buyurtmalar</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Jami {orders.length} ta buyurtma
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-4 border-b pb-4 mb-2">
        <button
          onClick={() => router.push('/orders/requested')}
          className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100 shadow-sm"
        >
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm">Yuborilgan buyurtmalar</span>
        </button>
        {user?.role === "PROVIDER" && (
          <button
            onClick={() => router.push('/orders/received')}
            className="flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <span className="font-semibold text-sm">Kelgan buyurtmalar</span>
          </button>
        )}
      </div>

      {/* Tab filter (legacy) */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => {
          const count = tabCount(t.key)
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                tab === t.key ? "bg-blue-500 text-white" : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
              }`}>
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-white/20" : "bg-blue-500/10"
              }`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Buyurtmalar */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package size={48} className="mx-auto mb-4" style={{ color: "var(--muted)" }} />
          <p style={{ color: "var(--muted)" }}>Bu bo'limda buyurtmalar yo'q</p>
          {user?.role === "USER" && (
            <Link href="/providers" className="text-blue-500 text-sm hover:underline mt-2 inline-block">
              Provayder izlash →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(order => {
            const provider = isProvider(order)
            const other = provider ? order.user : order.provider?.user
            return (
              <div key={order.id} className="glass-card p-5 flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  {renderBadge(order)}
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>
                    {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
                  </span>
                </div>

                {/* Xizmat va tavsif */}
                <div>
                  <h3 className="font-bold" style={{ color: "var(--text)" }}>
                    {order.skill?.name}
                  </h3>
                  <p className="text-sm line-clamp-2 mt-1" style={{ color: "var(--text-secondary)" }}>
                    {order.description}
                  </p>
                </div>

                {/* Boshqa tomon */}
                {other && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl"
                    style={{ backgroundColor: "var(--sidebar-hover)" }}>
                    <Avatar name={other.name} avatar={other.avatar} size="sm" />
                    <div className="min-w-0">
                      <div className="text-xs" style={{ color: "var(--muted)" }}>
                        {provider ? "Mijoz" : "Provayder"}
                      </div>
                      <div className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                        {other.name}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tugmalar */}
                <div className="flex flex-col gap-2 mt-auto">
                  <Link href={`/orders/${order.id}`}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-blue-500/10 text-blue-500"
                    style={{ border: "1px solid var(--border-strong)" }}>
                    <MessageSquare size={15} /> Batafsil & Chat
                  </Link>

                  {/* Provider tugmalari */}
                  {provider && order.status === "PENDING" && (
                    <div className="grid grid-cols-3 gap-1.5">
                      <button onClick={() => { setAcceptModal(order); setAcceptMsg("") }}
                        className="py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors">
                        <CheckCircle size={13} className="mx-auto mb-0.5" /> Qabul
                      </button>
                      <button onClick={() => handleOpenChat(order.id)}
                        className="py-2 rounded-xl text-xs font-bold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors">
                        <MessageSquare size={13} className="mx-auto mb-0.5" /> Chat
                      </button>
                      <button onClick={() => { setRejectModal(order); setRejectReason("") }}
                        className="py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors">
                        <XCircle size={13} className="mx-auto mb-0.5" /> Rad
                      </button>
                    </div>
                  )}

                  {/* User tugmalari */}
                  {!provider && order.status === "PENDING" && (
                    <button onClick={() => { setCancelModal(order); setCancelReason("") }}
                      className="py-2.5 rounded-xl text-sm font-bold bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                      <XCircle size={15} /> Bekor qilish
                    </button>
                  )}

                  {!provider && order.status === "AWAITING_CONFIRMATION" && (
                    <button onClick={() => { setConfirmModal(order); setRating(5); setComment("") }}
                      className="py-2.5 rounded-xl text-sm font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle size={15} /> Tasdiqlash
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Accept Modal */}
      {acceptModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAccept} className="glass-modal fade-in p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2">
              <CheckCircle size={20} /> Buyurtmani qabul qilish
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text)" }}>{acceptModal.skill?.name}</strong> — {acceptModal.user?.name}
            </p>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Mijozga xabar (ixtiyoriy)
              </label>
              <textarea rows={3} value={acceptMsg} onChange={e => setAcceptMsg(e.target.value)}
                placeholder="Qabul qildim, tez orada sizga yetib boraman..."
                className="glass-textarea" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setAcceptModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium btn-ghost">Bekor</button>
              <button type="submit" disabled={acceptLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-success disabled:opacity-60">
                {acceptLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Qabul qilish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReject} className="glass-modal fade-in p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
              <XCircle size={20} /> Rad etish
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--text)" }}>{rejectModal.skill?.name}</strong> — {rejectModal.user?.name}
            </p>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Rad etish sababi *
              </label>
              <textarea required rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Hozir band emasman, keyinroq murojaat qiling..."
                className="glass-textarea" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setRejectModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium btn-ghost">Bekor</button>
              <button type="submit" disabled={rejectLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-danger disabled:opacity-60">
                {rejectLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Rad etish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCancel} className="glass-modal fade-in p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
              <XCircle size={20} className="text-red-500" /> Bekor qilish
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Bu amalni ortga qaytarib bo'lmaydi.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Bekor qilish sababi *
              </label>
              <textarea required rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)}
                placeholder="Kamida 3 ta belgi kiriting..."
                className="glass-textarea" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCancelModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium btn-ghost">Yo'q</button>
              <button type="submit" disabled={cancelLoading || cancelReason.trim().length < 3}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-danger disabled:opacity-60">
                {cancelLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Ha, bekor qilish"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleConfirm} className="glass-modal fade-in p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="text-lg font-bold text-emerald-500 flex items-center gap-2">
              <CheckCircle size={20} /> Xizmatni tasdiqlash
            </h3>
            {confirmModal.isSuccessful === false && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600">
                Provayder xizmat muvaffaqiyatsiz deb belgilagan.
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                Baho
              </label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                      rating >= n ? "bg-yellow-400 text-white" : "bg-yellow-400/10 text-yellow-600"
                    }`}>
                    {n}★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                Izoh (ixtiyoriy)
              </label>
              <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Xizmat haqida fikringiz..."
                className="glass-textarea" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium btn-ghost">Bekor</button>
              <button type="submit" disabled={confirmLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold btn-success disabled:opacity-60">
                {confirmLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Tasdiqlash"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
