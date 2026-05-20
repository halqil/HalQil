"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/store"
import api from "@/lib/api"
import Link from "next/link"
import Avatar from "@/components/Avatar"
import {
  Search, Package, MapPin,
  Clock, CheckCircle, MessageCircle, Loader,
  Star, ChevronRight, Layers, Building, Users
} from "lucide-react"

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Kutilmoqda",
  ACCEPTED: "Qabul qilindi",
  CHATTING: "Muloqotda",
  IN_PROGRESS: "Jarayonda",
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  ACCEPTED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  CHATTING: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  IN_PROGRESS: "bg-purple-500/10 text-purple-600 border-purple-500/20",
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock size={12} />,
  ACCEPTED: <CheckCircle size={12} />,
  CHATTING: <MessageCircle size={12} />,
  IN_PROGRESS: <Loader size={12} />,
}

export default function HomePage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const [activeOrders, setActiveOrders] = useState<Record<string, any>[]>([])
  const [nearbyProviders, setNearbyProviders] = useState<Record<string, any>[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<Record<string, any>[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [providersLoading, setProvidersLoading] = useState(true)
  const [orgsLoading, setOrgsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.replace('/auth/login')
      return
    }

    setMounted(true)

    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders?status=PENDING,ACCEPTED,CHATTING,IN_PROGRESS")
        if (res.data.success) setActiveOrders(res.data.data)
      } catch (error) {
        console.error(error)
      } finally {
        setOrdersLoading(false)
      }
    }

    const fetchProviders = async () => {
      try {
        const res = await api.get("/providers")
        if (res.data.success) setNearbyProviders(res.data.data.slice(0, 4))
      } catch (error) {
        console.error(error)
      } finally {
        setProvidersLoading(false)
      }
    }

    const fetchCategories = async () => {
      try {
        const res = await api.get("/catalog/categories")
        if (res.data.success) setCategories(res.data.data.slice(0, 6))
      } catch (error) {
        console.error(error)
      }
    }

    const fetchOrgs = async () => {
      try {
        const res = await api.get("/organizations")
        if (res.data.success) setOrganizations(res.data.data.slice(0, 4))
      } catch (error) {
        console.error(error)
      } finally {
        setOrgsLoading(false)
      }
    }

    fetchOrders()
    fetchProviders()
    fetchCategories()
    fetchOrgs()
  }, [])

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      router.push('/providers')
    } else {
      router.push('/providers?q=' + encodeURIComponent(searchQuery.trim()))
    }
  }

  if (!mounted) return (
    <div className="flex items-center justify-center min-h-[40vh]" style={{ color: "var(--text-secondary)" }}>
      <Loader size={24} className="animate-spin text-blue-500" />
    </div>
  )

  if (!user) return null

  return (
    <div className="flex flex-col gap-8 fade-in">
      {/* Salomlashuv */}
      <section>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Xush kelibsiz, {user.name?.split(" ")[0]}
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>Bugun qanday xizmat kerak?</p>
      </section>

      {/* Qidiruv */}
      <section className="glass-card p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Santexnik, elektrik, farrosh..."
              className="w-full pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} className="btn-primary px-6 py-4 rounded-xl font-bold">
            Qidirish
          </button>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {["Santexnik", "Elektrik", "Farrosh", "Usta", "Sartarosh"].map(tag => (
            <Link
              key={tag}
              href={`/providers?q=${tag}`}
              className="px-3 py-1.5 rounded-full text-sm bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
            >
              {tag}
            </Link>
          ))}
        </div>
      </section>

      {/* Xizmatlar */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Layers size={18} />
            Xizmatlar
          </h2>
          <Link href="/services" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
            Barchasi <ChevronRight size={14} />
          </Link>
        </div>
        {categories.length === 0 ? (
          <div className="glass-card p-4 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Yuklanmoqda...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map(cat => (
              <Link
                key={cat.id}
                href={`/services/${cat.id}`}
                className="glass-card p-4 flex flex-col gap-2 hover:scale-[1.02] transition-transform group"
              >
                <span className="font-semibold text-sm group-hover:text-blue-500 transition-colors" style={{ color: "var(--text)" }}>
                  {cat.name}
                </span>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="flex items-center gap-1">
                    <Layers size={11} />
                    {cat._count?.skills ?? cat.skills?.length ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} />
                    {cat.providersCount ?? 0}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Provayderlar */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
            <MapPin size={18} />
            Provayderlar
          </h2>
          <Link href="/providers" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
            Barchasi <ChevronRight size={14} />
          </Link>
        </div>
        {providersLoading ? (
          <div className="glass-card p-6 flex items-center gap-3" style={{ color: "var(--text-secondary)" }}>
            <Loader size={18} className="animate-spin text-blue-500" />
            <span>Yuklanmoqda...</span>
          </div>
        ) : nearbyProviders.length === 0 ? (
          <div className="glass-card p-6 text-center" style={{ color: "var(--text-secondary)" }}>
            Provayderlar topilmadi
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearbyProviders.map(provider => (
              <Link
                key={provider.id}
                href={`/providers/${provider.id}`}
                className="glass-card p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform group"
              >
                <Avatar name={provider.name} avatar={provider.avatar} size="sm" />
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="font-semibold text-sm group-hover:text-blue-500 transition-colors truncate" style={{ color: "var(--text)" }}>
                    {provider.name}
                  </span>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span>{provider.reliability?.toFixed(1)}%</span>
                    {provider.completed_orders > 0 && (
                      <span style={{ color: "var(--muted)" }}>· {provider.completed_orders} ta</span>
                    )}
                  </div>
                  {provider.skills?.length > 0 && (
                    <span className="text-xs truncate" style={{ color: "var(--muted)" }}>
                      {provider.skills.slice(0, 2).map((s: any) => s.name).join(", ")}
                    </span>
                  )}
                </div>
                <ChevronRight size={16} style={{ color: "var(--muted)" }} className="flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tashkilotlar */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text)" }}>
            <Building size={18} />
            Tashkilotlar
          </h2>
          <Link href="/organizations" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
            Barchasi <ChevronRight size={14} />
          </Link>
        </div>
        {orgsLoading ? (
          <div className="glass-card p-6 flex items-center gap-3" style={{ color: "var(--text-secondary)" }}>
            <Loader size={18} className="animate-spin text-blue-500" />
            <span>Yuklanmoqda...</span>
          </div>
        ) : organizations.length === 0 ? (
          <div className="glass-card p-6 text-center" style={{ color: "var(--text-secondary)" }}>
            Tashkilotlar topilmadi
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {organizations.map(org => (
              <Link
                key={org.id}
                href={`/organizations/${org.id}`}
                className="glass-card p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  {org.logo ? (
                    <img src={org.logo} alt={org.name} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <Building size={20} className="text-indigo-500" />
                  )}
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="font-semibold text-sm group-hover:text-blue-500 transition-colors truncate" style={{ color: "var(--text)" }}>
                    {org.name}
                  </span>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <span className="flex items-center gap-0.5">
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      {org.rating?.toFixed(1)}
                    </span>
                    <span style={{ color: "var(--muted)" }}>·</span>
                    <span className="flex items-center gap-0.5">
                      <Users size={11} />
                      {org._count?.members} a'zo
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--muted)" }} className="flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Faol buyurtmalar */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2
            className="text-lg font-semibold flex items-center gap-2"
            style={{ color: "var(--text)" }}
          >
            <Package size={18} />
            Faol buyurtmalar
          </h2>
          <Link href="/orders" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
            Barchasi <ChevronRight size={14} />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="glass-card p-6 flex items-center gap-3" style={{ color: "var(--text-secondary)" }}>
            <Loader size={18} className="animate-spin text-blue-500" />
            <span>Yuklanmoqda...</span>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="glass-card p-6 text-center" style={{ color: "var(--text-secondary)" }}>
            Hozircha faol buyurtma yo'q
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeOrders.map(order => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="glass-card p-4 flex justify-between items-center hover:scale-[1.01] transition-transform"
              >
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${STATUS_COLORS[order.status] || "bg-gray-500/10 text-gray-600 border-gray-500/20"}`}
                  >
                    {STATUS_ICONS[order.status]}
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  {order.description && (
                    <p
                      className="text-sm line-clamp-1 mt-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {order.description}
                    </p>
                  )}
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {new Date(order.createdAt).toLocaleDateString("uz-UZ")}
                  </span>
                </div>
                <ChevronRight size={18} style={{ color: "var(--muted)" }} className="ml-3 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
