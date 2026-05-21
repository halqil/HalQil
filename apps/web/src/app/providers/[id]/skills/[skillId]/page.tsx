"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import { useAuthStore } from "@/lib/store"
import Avatar from "@/components/Avatar"
import toast from "react-hot-toast"
import {
  Star, Shield, Clock, ThumbsUp, ChevronLeft,
  Send, X, Loader2, MapPin, ArrowUpDown,
  Briefcase, Package, Building
} from "lucide-react"

const SORT_OPTIONS = [
  { value: "date_desc",   label: "Yangi" },
  { value: "date_asc",    label: "Eski" },
  { value: "rating_desc", label: "Reyting yuqori" },
  { value: "rating_asc",  label: "Reyting past" },
  { value: "positive",    label: "Musbat" },
  { value: "negative",    label: "Manfiy" },
]

const SERVICE_TYPE_LABELS: Record<string, string> = {
  ORGANIZED:   "Tashkilotli — mijoz keladi",
  INDEPENDENT: "Tashkilotsiz — provayder boradi",
  BOTH:        "Ikkalasi ham"
}

export default function SkillDetailPage() {
  const { id, skillId } = useParams<{ id: string; skillId: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [reviewSort, setReviewSort] = useState("date_desc")

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [orderLoading, setOrderLoading] = useState(false)

  useEffect(() => {
    if (!id || !skillId) return
    api.get(`/providers/${id}/skills/${skillId}`)
      .then(res => {
        if (res.data.success) setData(res.data.data)
        else { toast.error("Xizmat topilmadi"); router.back() }
      })
      .catch(() => { toast.error("Xatolik"); router.back() })
      .finally(() => setLoading(false))
  }, [id, skillId, router])

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error("Avval tizimga kiring")
      router.push("/auth/login")
      return
    }
    setOrderLoading(true)
    try {
      const res = await api.post("/orders", {
        provider_id: id,
        skill_id: skillId,
        description,
        address,
        preferred_date: preferredDate || undefined
      })
      if (res.data.success) {
        toast.success("Buyurtma yuborildi!")
        setShowOrderModal(false)
        setDescription(""); setAddress(""); setPreferredDate("")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Xatolik")
    } finally {
      setOrderLoading(false)
    }
  }

  const renderStars = (rating: number, size = 14) => (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size}
          className={i <= Math.round(rating) ? "text-yellow-400 fill-yellow-400" : ""}
          style={{ color: i <= Math.round(rating) ? undefined : "var(--border-strong)" }}
        />
      ))}
    </div>
  )

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const d = Math.floor(diff / 86400000)
    if (d === 0) return "Bugun"
    if (d === 1) return "Kecha"
    if (d < 30) return `${d} kun oldin`
    if (d < 365) return `${Math.floor(d / 30)} oy oldin`
    return `${Math.floor(d / 365)} yil oldin`
  }

  const sortedReviews = (() => {
    if (!data?.reviews) return []
    let list = [...data.reviews]
    switch (reviewSort) {
      case "date_asc":    return list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      case "rating_desc": return list.sort((a, b) => b.rating - a.rating)
      case "rating_asc":  return list.sort((a, b) => a.rating - b.rating)
      case "positive":    return list.filter(r => r.isPositive)
      case "negative":    return list.filter(r => !r.isPositive)
      default:            return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
  })()

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  )
  if (!data) return null

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 fade-in">

      {/* Orqaga */}
      <Link
        href={`/providers/${id}`}
        className="flex items-center gap-2 text-sm w-fit hover:text-blue-500 transition-colors"
        style={{ color: "var(--text-secondary)" }}>
        <ChevronLeft size={18} />
        {data.provider?.name} profili
      </Link>

      {/* ── XIZMAT ASOSIY BLOK ── */}
      <section className="glass-card p-6">
        <div className="flex flex-col gap-4">

          {/* Sarlavha */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>
                {data.skill?.category?.name}
              </div>
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                {data.skill?.name}
              </h1>
            </div>
            {data.stats?.averageRating > 0 && (
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                {renderStars(data.stats.averageRating, 16)}
                <span className="text-lg font-bold" style={{ color: "var(--text)" }}>
                  {data.stats.averageRating}
                </span>
              </div>
            )}
          </div>

          {/* Statistika */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card p-3 text-center">
              <div className="text-lg font-bold" style={{ color: "var(--text)" }}>
                {data.stats?.averageRating > 0 ? data.stats.averageRating : "—"}
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Reyting</div>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="text-lg font-bold text-green-600">
                {data.stats?.positivePercent > 0 ? `${data.stats.positivePercent}%` : "—"}
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Ijobiy</div>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="text-lg font-bold" style={{ color: "var(--text)" }}>
                {data.stats?.successfulOrders ?? 0}
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Bajarilgan</div>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="text-lg font-bold" style={{ color: "var(--text)" }}>
                {data.stats?.reviewCount ?? 0}
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>Sharh</div>
            </div>
          </div>

          {/* Tafsilotlar */}
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--text-secondary)" }}>
              <Clock size={14} className="text-blue-500" />
              {data.experienceYears} yil staj
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
              style={{ backgroundColor: "var(--sidebar-hover)", color: "var(--text-secondary)" }}>
              <Briefcase size={14} className="text-indigo-500" />
              {SERVICE_TYPE_LABELS[data.serviceType] ?? data.serviceType}
            </span>
          </div>

          {/* Narx */}
          {(data.priceFrom || data.priceTo || data.priceNote) && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: "var(--sidebar-hover)" }}>
              <div className="text-xs font-semibold uppercase mb-1" style={{ color: "var(--muted)" }}>
                Narx
              </div>
              <div className="font-bold text-lg" style={{ color: "var(--text)" }}>
                {data.priceFrom ? `${data.priceFrom.toLocaleString()} so'm` : ""}
                {data.priceFrom && data.priceTo ? " — " : ""}
                {data.priceTo ? `${data.priceTo.toLocaleString()} so'm` : ""}
                {!data.priceFrom && !data.priceTo && "Kelishiladi"}
              </div>
              {data.priceNote && (
                <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                  {data.priceNote}
                </div>
              )}
            </div>
          )}

          {/* Tasnif */}
          {data.description && (
            <div>
              <div className="text-xs font-semibold uppercase mb-2" style={{ color: "var(--muted)" }}>
                Xizmat haqida
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {data.description}
              </p>
            </div>
          )}

          {/* Buyurtma tugmasi */}
          <button
            onClick={() => setShowOrderModal(true)}
            className="btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 w-full">
            <Send size={18} />
            Buyurtma berish
          </button>
        </div>
      </section>

      {/* ── PROVAYDER MINI BLOK ── */}
      <section className="glass-card p-4">
        <div className="text-xs font-semibold uppercase mb-3" style={{ color: "var(--muted)" }}>
          Provayder
        </div>
        <Link href={`/providers/${id}`}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Avatar name={data.provider?.name} avatar={data.provider?.avatar} size="md" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate" style={{ color: "var(--text)" }}>
              {data.provider?.name}
            </div>
            <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              <span className={`w-2 h-2 rounded-full ${data.provider?.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
              {data.provider?.isOnline ? "Online" : "Offline"}
              <span style={{ color: "var(--muted)" }}>·</span>
              <Shield size={11} className="text-green-500" />
              {data.provider?.reliability?.toFixed(0)}% ishonchlilik
            </div>
          </div>
          <ChevronLeft size={18} className="rotate-180 flex-shrink-0" style={{ color: "var(--muted)" }} />
        </Link>
      </section>

      {/* ── SHARHLAR ── */}
      <section>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>
          Sharhlar
          {data.reviews?.length > 0 && (
            <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
              ({data.reviews.length} ta)
            </span>
          )}
        </h2>

        {data.reviews?.length > 0 ? (
          <>
            {/* Saralash */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <ArrowUpDown size={15} style={{ color: "var(--muted)" }} />
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value}
                  onClick={() => setReviewSort(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    reviewSort === opt.value ? "bg-gray-600 text-white" : "hover:bg-[var(--sidebar-hover)]"
                  }`}
                  style={reviewSort !== opt.value ? { color: "var(--text-secondary)" } : undefined}>
                  {opt.label}
                </button>
              ))}
            </div>

            {sortedReviews.length === 0 ? (
              <div className="glass-card p-6 text-center" style={{ color: "var(--text-secondary)" }}>
                Bu filtr bo'yicha sharhlar yo'q
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedReviews.map((r: any) => (
                  <div key={r.id} className="glass-card p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.reviewer?.name} avatar={r.reviewer?.avatar} size="sm" />
                        <div>
                          <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                            {r.reviewer?.name}
                          </div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>
                            {timeAgo(r.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">{renderStars(r.rating, 13)}</div>
                    </div>
                    {r.comment && (
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {r.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="glass-card p-8 text-center" style={{ color: "var(--text-secondary)" }}>
            Bu xizmat bo'yicha hali sharhlar yo'q
          </div>
        )}
      </section>

      {/* ── BUYURTMA MODAL ── */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal p-6 w-full max-w-md fade-in">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                  Buyurtma berish
                </h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {data.skill?.name}
                </p>
              </div>
              <button onClick={() => setShowOrderModal(false)}>
                <X size={20} style={{ color: "var(--muted)" }} />
              </button>
            </div>
            <form onSubmit={handleOrder} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}>
                  Muammo tavsifi *
                </label>
                <textarea required rows={3} value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Muammoni batafsil yozing..."
                  className="glass-textarea" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}>
                  Manzil *
                </label>
                <input type="text" required value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="To'liq manzil" className="glass-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1"
                  style={{ color: "var(--text-secondary)" }}>
                  Qulay vaqt (ixtiyoriy)
                </label>
                <input type="datetime-local" value={preferredDate}
                  onChange={e => setPreferredDate(e.target.value)}
                  className="glass-input" />
              </div>
              <button type="submit" disabled={orderLoading}
                className="btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                {orderLoading
                  ? <Loader2 size={18} className="animate-spin" />
                  : <Send size={18} />}
                {orderLoading ? "Yuborilmoqda..." : "Buyurtmani yuborish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
