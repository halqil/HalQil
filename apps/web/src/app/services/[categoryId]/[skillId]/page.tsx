"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import Avatar from "@/components/Avatar"
import {
  ArrowLeft, Star, ChevronRight, MapPin,
  TrendingUp, Briefcase, ArrowUpDown
} from "lucide-react"

const SORT_OPTIONS = [
  { value: "reliability",      label: "Ishonchlilik" },
  { value: "completed_orders", label: "Buyurtmalar" },
  { value: "skills_count",     label: "Xizmatlar soni" },
]

export default function SkillProvidersPage() {
  const { categoryId, skillId } = useParams<{ categoryId: string; skillId: string }>()
  const [skill, setSkill] = useState<any>(null)
  const [providers, setProviders] = useState<any[]>([])
  const [sort, setSort] = useState("reliability")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/catalog/skills?category_id=${categoryId}`),
      api.get(`/providers?skill_id=${skillId}&sort=${sort}`)
    ])
      .then(([skillsRes, providersRes]) => {
        if (skillsRes.data.success) {
          const found = skillsRes.data.data.find((s: any) => s.id === skillId)
          setSkill(found ?? null)
        }
        if (providersRes.data.success) setProviders(providersRes.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [categoryId, skillId, sort])

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div className="flex items-center gap-3">
        <Link
          href={`/services/${categoryId}`}
          className="p-2 rounded-xl hover:bg-[var(--sidebar-hover)] transition-colors"
        >
          <ArrowLeft size={20} style={{ color: "var(--text-secondary)" }} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {skill?.name ?? "Xizmat"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {providers.length} ta provayder
          </p>
        </div>
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
                ? "bg-blue-500 text-white"
                : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : providers.length === 0 ? (
        <div className="glass-card p-8 text-center" style={{ color: "var(--text-secondary)" }}>
          Bu xizmat bo'yicha provayder topilmadi
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map(p => (
            <Link
              key={p.id}
              href={`/providers/${p.id}`}
              className="glass-card p-5 flex flex-col gap-4 hover:scale-[1.02] transition-transform group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Avatar name={p.name} avatar={p.avatar} size="md" />
                <div className="flex-1 min-w-0">
                  <p
                    className="font-bold text-sm group-hover:text-blue-500 transition-colors truncate"
                    style={{ color: "var(--text)" }}
                  >
                    {p.name}
                  </p>
                  <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                    <Star size={11} className="text-yellow-400 fill-yellow-400" />
                    <span>{p.reliability?.toFixed(1)}%</span>
                    <span style={{ color: "var(--muted)" }}>ishonchlilik</span>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--muted)" }} />
              </div>

              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
                <span className="flex items-center gap-1">
                  <TrendingUp size={12} />
                  {p.completed_orders} buyurtma
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={12} />
                  {p.skills?.length} xizmat
                </span>
                {p.districts?.length > 0 && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin size={12} />
                    {p.districts[0]}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
