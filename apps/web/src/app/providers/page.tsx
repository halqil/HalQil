"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import Avatar from "@/components/Avatar"
import {
  Star, MapPin, Briefcase, ArrowUpDown,
  Users, ChevronRight, Layers
} from "lucide-react"

const SORT_OPTIONS = [
  { value: "reliability",      label: "Ishonchlilik" },
  { value: "completed_orders", label: "Buyurtmalar" },
  { value: "skills_count",     label: "Xizmatlar soni" },
]

interface Provider {
  id: string
  name: string
  avatar: string | null
  reliability: number
  service_type: string
  districts: string[]
  completed_orders: number
  skills: { id: string; name: string }[]
}

interface Category {
  id: string
  name: string
  providersCount: number
}

export default function ProvidersPage() {
  const searchParams = useSearchParams()
  const [providers, setProviders]     = useState<Provider[]>([])
  const [categories, setCategories]   = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState<string>("")
  const [sort, setSort]               = useState("reliability")
  const [loading, setLoading]         = useState(true)
  const [catsLoading, setCatsLoading] = useState(true)

  useEffect(() => {
    api.get("/catalog/categories")
      .then(res => {
        if (res.data.success) setCategories(res.data.data)
      })
      .catch(console.error)
      .finally(() => setCatsLoading(false))
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (selectedCat) params.set("category_id", selectedCat)
    if (sort)        params.set("sort", sort)
    const query = params.toString()
    api.get(`/providers${query ? "?" + query : ""}`)
      .then(res => {
        if (res.data.success) setProviders(res.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedCat, sort])

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Provayderlar
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {providers.length} ta mutaxassis
        </p>
      </div>

      {/* Kategoriya filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <Layers size={16} style={{ color: "var(--muted)" }} />
        <button
          onClick={() => setSelectedCat("")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            selectedCat === ""
              ? "bg-blue-500 text-white"
              : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
          }`}
        >
          Barchasi
        </button>
        {catsLoading ? (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Yuklanmoqda...
          </span>
        ) : (
          categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(cat.id)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                selectedCat === cat.id
                  ? "bg-blue-500 text-white"
                  : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
              }`}
            >
              {cat.name}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                selectedCat === cat.id
                  ? "bg-white/20"
                  : "bg-blue-500/10"
              }`}>
                {cat.providersCount}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Saralash */}
      <div className="flex items-center gap-2 flex-wrap">
        <ArrowUpDown size={16} style={{ color: "var(--muted)" }} />
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              sort === opt.value
                ? "bg-indigo-500 text-white"
                : "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Provayderlar */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : providers.length === 0 ? (
        <div className="glass-card p-8 text-center" style={{ color: "var(--text-secondary)" }}>
          Bu kategoriyada provayder topilmadi
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {providers.map(p => (
            <Link
              key={p.id}
              href={`/providers/${p.id}`}
              className="glass-card p-5 flex flex-col gap-4 hover:scale-[1.02] transition-transform group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Avatar name={p.name} avatar={p.avatar} size="lg" />
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold group-hover:text-blue-500 transition-colors truncate"
                    style={{ color: "var(--text)" }}
                  >
                    {p.name}
                  </p>
                  <div
                    className="flex items-center gap-1 text-sm mt-0.5"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Star size={13} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">{p.reliability.toFixed(1)}%</span>
                    <span>ishonchlilik</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                {p.skills.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Briefcase size={15} className="mt-0.5 text-blue-500 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                      {p.skills.slice(0, 3).map(s => (
                        <span key={s.id} className="glass-chip text-xs">{s.name}</span>
                      ))}
                      {p.skills.length > 3 && (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>
                          +{p.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {p.districts.length > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPin size={15} className="text-red-500 flex-shrink-0" />
                    <span className="line-clamp-1">{p.districts.join(", ")}</span>
                  </div>
                )}
              </div>

              <div
                className="flex justify-between items-center text-sm pt-3"
                style={{ borderTop: "1px solid var(--border-strong)" }}
              >
                <span style={{ color: "var(--muted)" }}>
                  {p.completed_orders} ta buyurtma
                </span>
                <span className="text-blue-500 font-medium group-hover:underline flex items-center gap-1">
                  Batafsil <ChevronRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
