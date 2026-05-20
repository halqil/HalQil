"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import { ChevronRight, ArrowLeft, Users, Layers } from "lucide-react"

export default function CategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const [category, setCategory] = useState<any>(null)
  const [skills, setSkills] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get("/catalog/categories"),
      api.get(`/catalog/skills?category_id=${categoryId}`)
    ])
      .then(([catsRes, skillsRes]) => {
        if (catsRes.data.success) {
          const found = catsRes.data.data.find((c: any) => c.id === categoryId)
          setCategory(found ?? null)
        }
        if (skillsRes.data.success) setSkills(skillsRes.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [categoryId])

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
    </div>
  )

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/services"
          className="p-2 rounded-xl hover:bg-[var(--sidebar-hover)] transition-colors"
        >
          <ArrowLeft size={20} style={{ color: "var(--text-secondary)" }} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
            {category?.name ?? "Kategoriya"}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {skills.length} ta xizmat
          </p>
        </div>
      </div>

      {skills.length === 0 ? (
        <div className="glass-card p-8 text-center" style={{ color: "var(--text-secondary)" }}>
          Bu kategoriyada xizmat topilmadi
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {skills.map(skill => (
            <Link
              key={skill.id}
              href={`/services/${categoryId}/${skill.id}`}
              className="glass-card p-4 flex items-center justify-between hover:scale-[1.01] transition-transform group"
            >
              <div className="flex flex-col gap-1">
                <span
                  className="font-semibold text-sm group-hover:text-blue-500 transition-colors"
                  style={{ color: "var(--text)" }}
                >
                  {skill.name}
                </span>
                {skill.description && (
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {skill.description}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
                  <Users size={11} />
                  {skill._count?.providerSkills ?? 0} provayder
                </span>
              </div>
              <ChevronRight size={18} style={{ color: "var(--muted)" }} className="flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
