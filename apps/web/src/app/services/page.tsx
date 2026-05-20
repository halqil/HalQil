"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import { ChevronRight, Layers, Users, Building } from "lucide-react"

export default function ServicesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/catalog/categories")
      .then(res => {
        if (res.data.success) setCategories(res.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Xizmatlar</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Kerakli xizmat kategoriyasini tanlang
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="glass-card p-8 text-center" style={{ color: "var(--text-secondary)" }}>
          Kategoriyalar topilmadi
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/services/${cat.id}`}
              className="glass-card p-5 flex flex-col gap-4 hover:scale-[1.02] transition-transform group"
            >
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Layers size={20} className="text-blue-500" />
                </div>
                <ChevronRight
                  size={18}
                  className="group-hover:text-blue-500 transition-colors"
                  style={{ color: "var(--muted)" }}
                />
              </div>

              <div>
                <h2 className="font-bold text-base" style={{ color: "var(--text)" }}>
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted)" }}>
                <span className="flex items-center gap-1">
                  <Layers size={12} />
                  {cat._count?.skills ?? cat.skills?.length ?? 0} xizmat
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {cat.providersCount ?? 0} provayder
                </span>
                <span className="flex items-center gap-1">
                  <Building size={12} />
                  {cat.organizationsCount ?? 0} tashkilot
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
