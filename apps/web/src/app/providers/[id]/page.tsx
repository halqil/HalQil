"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import { useAuthStore } from "@/lib/store"
import Avatar from "@/components/Avatar"
import toast from "react-hot-toast"
import {
  Star, MapPin, Shield, Clock, CheckCircle, XCircle,
  ChevronLeft, ChevronRight, Building, Briefcase,
  ThumbsUp, Calendar, Send, X, Loader2, Package,
  ArrowUpDown, TrendingUp
} from "lucide-react"

const SERVICE_TYPE_LABELS: Record<string, string> = {
  ORGANIZED: "Tashkilotli",
  INDEPENDENT: "Tashkilotsiz",
  BOTH: "Ikkalasi"
}

const SORT_OPTIONS = [
  { value: "date_desc", label: "Yangi" },
  { value: "date_asc",  label: "Eski" },
  { value: "rating_desc", label: "Reyting yuqori" },
  { value: "rating_asc",  label: "Reyting past" },
  { value: "positive",    label: "Musbat" },
  { value: "negative",    label: "Manfiy" },
]

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()

  const [provider, setProvider] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [activeCatTab, setActiveCatTab] = useState("all")
  const [reviewCatTab, setReviewCatTab] = useState("all")
  const [reviewSort, setReviewSort] = useState("date_desc")

  const [showOrderModal, setShowOrderModal] = useState(false)
  const [selectedSkillId, setSelectedSkillId] = useState("")
  const [description, setDescription] = useState("")
  const [address, setAddress] = useState("")
  const [preferredDate, setPreferredDate] = useState("")
  const [orderLoading, setOrderLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    api.get(`/providers/${id}`)
      .then(res => {
        if (res.data.success) {
          setProvider(res.data.data)
          if (res.data.data.providerSkills?.length > 0) {
            setSelectedSkillId(res.data.data.providerSkills[0].skillId)
          }
        }
      })
      .catch(() => { toast.error("Provayder topilmadi"); router.push("/providers") })
      .finally(() => setLoading(false))
  }, [id, router])

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) { toast.error("Avval tizimga kiring"); router.push("/auth/login"); return }
    setOrderLoading(true)
    try {
      const res = await api.post("/orders", {
        provider_id: id,
        skill_id: selectedSkillId,
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

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  )
  if (!provider) return null

  const categories = provider.categoryStats ?? []
  const allSkills = provider.providerSkills ?? []
  const filteredSkills = activeCatTab === "all"
    ? allSkills
    : allSkills.filter((ps: any) => ps.skill?.category?.id === activeCatTab)

  const allReviews = provider.reviews ?? []
  const filteredReviews = (() => {
    let list = reviewCatTab === "all"
      ? allReviews
      : allReviews.filter((r: any) => r.skill?.category?.id === reviewCatTab)

    switch (reviewSort) {
      case "date_asc":    list = [...list].sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break
      case "rating_desc": list = [...list].sort((a: any, b: any) => b.rating - a.rating); break
      case "rating_asc":  list = [...list].sort((a: any, b: any) => a.rating - b.rating); break
      case "positive":    list = list.filter((r: any) => r.isPositive); break
      case "negative":    list = list.filter((r: any) => !r.isPositive); break
      default:            list = [...list].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return list
  })()

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
    if (d < 365) return `${Math.floor(d/30)} oy oldin`
    return `${Math.floor(d/365)} yil oldin`
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 fade-in">

      {/* Orqaga */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm w-fit hover:text-blue-500 transition-colors"
        style={{ color: "var(--text-secondary)" }}>
        <ChevronLeft size={18} /> Provayderlar
      </button>

      {/* ── ASOSIY BLOK ── */}
      <section className="glass-card p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <Avatar name={provider.user?.name} avatar={provider.user?.avatar} size="xl" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Ism + statuslar */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
                {provider.user?.name}
              </h1>
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${provider.user?.isOnline ? "bg-green-500" : "bg-gray-400"}`} />
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ color: "var(--text-secondary)", backgroundColor: "var(--sidebar-hover)" }}>
                {provider.user?.isOnline ? "Online" : "Offline"}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                provider.availabilityStatus === "AVAILABLE"
                  ? "bg-green-500/10 text-green-600"
                  : "bg-yellow-500/10 text-yellow-600"
              }`}>
                {provider.availabilityStatus === "AVAILABLE" ? "Bo'sh" : "Band"}
              </span>
            </div>

            {/* Statistika qatori */}
            <div className="flex flex-wrap gap-4 text-sm mb-3">
              <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <Star size={15} className="text-yellow-400 fill-yellow-400" />
                <strong style={{ color: "var(--text)" }}>
                  {provider.rating > 0 ? provider.rating.toFixed(1) : "—"}
                </strong>
                reyting
              </span>
              <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <Shield size={15} className="text-green-500" />
                <strong style={{ color: "var(--text)" }}>
                  {(provider.successfulOrders + provider.failedOrders) > 0
                    ? `${provider.reliability?.toFixed(0)}%`
                    : "—"}
                </strong>
                ishonchlilik
              </span>
              <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <Package size={15} className="text-blue-500" />
                <strong style={{ color: "var(--text)" }}>{provider.successfulOrders}</strong>
                bajarilgan
              </span>
              <span className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                <Calendar size={15} className="text-indigo-500" />
                {new Date(provider.createdAt).toLocaleDateString("uz-UZ", {
                  year: "numeric", month: "long", day: "numeric"
                })} dan beri provayder
              </span>
            </div>

            {/* Narx va hudud */}
            <div className="flex flex-wrap gap-3 text-sm mb-3">

              {provider.districts?.length > 0 && (
                <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                  <MapPin size={14} className="text-red-400" />
                  {provider.districts.slice(0, 3).map((d: any) => d.districtName).join(", ")}
                  {provider.districts.length > 3 && ` +${provider.districts.length - 3}`}
                </span>
              )}
            </div>

            {/* Tashkilot */}
            {provider.memberOfOrganizations?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {provider.memberOfOrganizations.map((m: any) => (
                  <Link key={m.organization.id} href={`/organizations/${m.organization.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "var(--sidebar-hover)" }}>
                    {m.organization.logo
                      ? <img src={m.organization.logo} className="w-5 h-5 rounded object-cover" alt="" />
                      : <Building size={14} className="text-indigo-500" />}
                    <span style={{ color: "var(--text)" }}>{m.organization.name}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Bio */}
            {provider.bio && (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{provider.bio}</p>
            )}
          </div>
        </div>
      </section>

      {/* ── XIZMATLAR ── */}
      <section>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>
          <Briefcase size={18} className="inline mr-2 text-blue-500" />
          Xizmatlar
        </h2>

        {/* Kategoriya tablar */}
        {categories.length >= 1 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => setActiveCatTab("all")}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                activeCatTab === "all" ? "bg-blue-500 text-white" : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
              }`}>
              Barchasi ({allSkills.length})
            </button>
            {categories.map((cat: any) => (
              <button key={cat.categoryId}
                onClick={() => setActiveCatTab(cat.categoryId)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  activeCatTab === cat.categoryId ? "bg-blue-500 text-white" : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                }`}>
                {cat.name} ({cat.skillsCount})
              </button>
            ))}
          </div>
        )}

        {/* Skill kartalar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSkills.map((ps: any) => (
            <div key={ps.id} className="glass-card p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate" style={{ color: "var(--text)" }}>
                    {ps.skill?.name}
                  </h3>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {ps.skill?.category?.name} · {SERVICE_TYPE_LABELS[ps.serviceType]}
                  </span>
                </div>
                {ps.stats?.averageRating > 0 && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold" style={{ color: "var(--text)" }}>
                      {ps.stats.averageRating}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {ps.experienceYears} yil staj
                </span>
                {ps.stats?.reviewCount > 0 && (
                  <span className={`flex items-center gap-1 ${
                    ps.stats.positivePercent > 0 ? "text-green-600" : "text-red-500"
                  }`}>
                    <ThumbsUp size={11} /> {ps.stats.positivePercent}% ijobiy
                  </span>
                )}
                {ps.stats?.reviewCount > 0 && (
                  <span>{ps.stats.reviewCount} sharh</span>
                )}
              </div>

              {(ps.priceFrom || ps.priceTo) && (
                <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  {ps.priceFrom ? `${ps.priceFrom.toLocaleString()} so'm` : ""}
                  {ps.priceFrom && ps.priceTo ? " — " : ""}
                  {ps.priceTo ? `${ps.priceTo.toLocaleString()} so'm` : ""}
                  {ps.priceNote && (
                    <span className="text-xs font-normal ml-1" style={{ color: "var(--muted)" }}>
                      ({ps.priceNote})
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <Link
                  href={`/providers/${id}/skills/${ps.skillId}`}
                  className="flex-1 py-2 rounded-xl text-sm font-medium text-center transition-colors hover:bg-blue-500/10 text-blue-500"
                  style={{ border: "1px solid var(--border-strong)" }}>
                  Batafsil <ChevronRight size={14} className="inline" />
                </Link>
                <button
                  onClick={() => { setSelectedSkillId(ps.skillId); setShowOrderModal(true) }}
                  className="flex-1 py-2 btn-primary rounded-xl text-sm font-bold">
                  Buyurtma
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PORTFOLIO ── */}
      {provider.portfolio?.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>Portfolio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {provider.portfolio.map((img: any) => (
              <div key={img.id} className="aspect-square rounded-xl overflow-hidden group"
                style={{ backgroundColor: "var(--sidebar-hover)" }}>
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${img.imageUrl}`}
                  alt="Portfolio"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SHARHLAR ── */}
      <section>
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text)" }}>
          Sharhlar
          {allReviews.length > 0 && (
            <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
              ({allReviews.length} ta)
            </span>
          )}
        </h2>

        {allReviews.length > 0 && (
          <>
            {/* Kategoriya filter */}
            <div className="flex gap-2 flex-wrap mb-3">
              <button
                onClick={() => setReviewCatTab("all")}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  reviewCatTab === "all" ? "bg-indigo-500 text-white" : "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
                }`}>
                Barchasi ({allReviews.length})
              </button>
              {categories.map((cat: any) => {
                const count = allReviews.filter((r: any) => r.skill?.category?.id === cat.categoryId).length
                if (count === 0) return null
                return (
                  <button key={cat.categoryId}
                    onClick={() => setReviewCatTab(cat.categoryId)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      reviewCatTab === cat.categoryId ? "bg-indigo-500 text-white" : "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
                    }`}>
                    {cat.name} ({count})
                  </button>
                )
              })}
            </div>

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

            {/* Sharh kartalar */}
            {filteredReviews.length === 0 ? (
              <div className="glass-card p-6 text-center" style={{ color: "var(--text-secondary)" }}>
                Bu bo'limda sharhlar yo'q
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredReviews.map((r: any) => (
                  <div key={r.id} className="glass-card p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={r.reviewer?.name} avatar={r.reviewer?.avatar} size="sm" />
                        <div>
                          <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                            {r.reviewer?.name}
                          </div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>
                            {r.skill?.name} · {timeAgo(r.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">{renderStars(r.rating, 13)}</div>
                    </div>
                    {r.comment && (
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {allReviews.length === 0 && (
          <div className="glass-card p-8 text-center" style={{ color: "var(--text-secondary)" }}>
            Hali sharhlar yo'q
          </div>
        )}
      </section>

      {/* ── BUYURTMA MODAL ── */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal p-6 w-full max-w-md fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Buyurtma berish</h2>
              <button onClick={() => setShowOrderModal(false)}>
                <X size={20} style={{ color: "var(--muted)" }} />
              </button>
            </div>
            <form onSubmit={handleOrder} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Xizmat turi
                </label>
                <select value={selectedSkillId} onChange={e => setSelectedSkillId(e.target.value)}
                  className="glass-input" required>
                  {provider.providerSkills?.map((ps: any) => (
                    <option key={ps.skillId} value={ps.skillId}>{ps.skill?.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Muammo tavsifi *
                </label>
                <textarea required rows={3} value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Muammoni batafsil yozing..."
                  className="glass-textarea" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Manzil *
                </label>
                <input type="text" required value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="To'liq manzil" className="glass-input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
                  Qulay vaqt (ixtiyoriy)
                </label>
                <input type="datetime-local" value={preferredDate}
                  onChange={e => setPreferredDate(e.target.value)}
                  className="glass-input" />
              </div>
              <button type="submit" disabled={orderLoading}
                className="btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                {orderLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {orderLoading ? "Yuborilmoqda..." : "Buyurtmani yuborish"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
