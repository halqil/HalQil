"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import {
  Star, Users, Shield, Building,
  ArrowUpDown, Layers, ChevronRight
} from "lucide-react"

const SORT_OPTIONS = [
  { value: "rating",       label: "Reyting" },
  { value: "reliability",  label: "Ishonchlilik" },
  { value: "members",      label: "A'zolar soni" },
]

interface Organization {
  id: string
  name: string
  description?: string
  logo?: string
  rating: number
  reliability: number
  isActive: boolean
  skills: { skill: { name: string } }[]
  _count: { members: number; orders: number }
  adminProvider: { user: { name: string; avatar?: string } }
}

interface Category {
  id: string
  name: string
  organizationsCount: number
}

export default function OrganizationsPage() {
  const [orgs, setOrgs]               = useState<Organization[]>([])
  const [categories, setCategories]   = useState<Category[]>([])
  const [selectedCat, setSelectedCat] = useState<string>("")
  const [sort, setSort]               = useState("rating")
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
    if (selectedCat) params.set("categoryId", selectedCat)
    if (sort)        params.set("sortBy", sort)
    const query = params.toString()
    api.get(`/organizations${query ? "?" + query : ""}`)
      .then(res => {
        if (res.data.success) setOrgs(res.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedCat, sort])

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>
          Tashkilotlar
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {orgs.length} ta tashkilot
        </p>
      </div>

      {/* Kategoriya filter */}
      <div className="flex gap-2 flex-wrap items-center">
        <Layers size={16} style={{ color: "var(--muted)" }} />
        <button
          onClick={() => setSelectedCat("")}
          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
            selectedCat === ""
              ? "bg-indigo-500 text-white"
              : "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
          }`}
        >
          Barchasi
        </button>
        {catsLoading ? (
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            Yuklanmoqda...
          </span>
        ) : (
          categories
            .filter(cat => cat.organizationsCount > 0)
            .map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors flex items-center gap-1.5 ${
                  selectedCat === cat.id
                    ? "bg-indigo-500 text-white"
                    : "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20"
                }`}
              >
                {cat.name}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  selectedCat === cat.id
                    ? "bg-white/20"
                    : "bg-indigo-500/10"
                }`}>
                  {cat.organizationsCount}
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
                ? "bg-purple-500 text-white"
                : "bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Tashkilotlar */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
        </div>
      ) : orgs.length === 0 ? (
        <div className="glass-card p-8 text-center" style={{ color: "var(--text-secondary)" }}>
          Bu kategoriyada tashkilot topilmadi
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {orgs.map(org => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className="glass-card p-5 flex flex-col gap-4 hover:scale-[1.02] transition-transform group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building size={24} className="text-indigo-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-base group-hover:text-indigo-500 transition-colors truncate"
                    style={{ color: "var(--text)" }}
                  >
                    {org.name}
                  </h3>
                  {org.description && (
                    <p
                      className="text-sm mt-0.5 line-clamp-2"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {org.description}
                    </p>
                  )}
                </div>
              </div>

              <div
                className="flex gap-4 pt-3"
                style={{ borderTop: "1px solid var(--border-strong)" }}
              >
                <div
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{org.rating.toFixed(1)}</span>
                </div>
                <div
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Shield size={14} className="text-green-500" />
                  <span>{org.reliability.toFixed(0)}%</span>
                </div>
                <div
                  className="flex items-center gap-1.5 text-sm"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Users size={14} className="text-blue-500" />
                  <span>{org._count.members} a'zo</span>
                </div>
                <div className="ml-auto">
                  <ChevronRight
                    size={18}
                    className="group-hover:text-indigo-500 transition-colors"
                    style={{ color: "var(--muted)" }}
                  />
                </div>
              </div>

              {org.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {org.skills.slice(0, 4).map((s, i) => (
                    <span key={i} className="glass-chip text-xs">
                      {s.skill.name}
                    </span>
                  ))}
                  {org.skills.length > 4 && (
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      +{org.skills.length - 4} ta
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
