"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Mic, ArrowRight } from "lucide-react"
import Link from "next/link"
import api from "@/lib/api"
import Avatar from "@/components/Avatar"
import { Star, Building, ChevronRight } from "lucide-react"

interface SearchResult {
  providers: any[]
  organizations: any[]
}

const QUICK_QUERIES = [
  "Santexnik",
  "Elektrik",
  "Farrosh",
  "Usta",
  "Sartarosh",
  "Mebel yig'ish",
]

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (q: string) => {
    const trimmed = q.trim()
    if (!trimmed) return
    setLoading(true)
    try {
      const [providersRes, orgsRes] = await Promise.all([
        api.get(`/providers?district=${encodeURIComponent(trimmed)}`),
        api.get("/organizations"),
      ])
      const providers = providersRes.data.success ? providersRes.data.data : []
      const orgs = orgsRes.data.success
        ? orgsRes.data.data.filter((o: any) =>
            o.name.toLowerCase().includes(trimmed.toLowerCase()) ||
            o.description?.toLowerCase().includes(trimmed.toLowerCase())
          )
        : []
      setResults({ providers, organizations: orgs })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (query.trim()) handleSearch(query)
  }

  return (
    <div className="flex flex-col gap-8 fade-in max-w-3xl mx-auto">
      {/* Qidiruv inputi */}
      <section className="glass-card p-6">
        <h1 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>
          Qanday xizmat kerak?
        </h1>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Masalan: kran ta'mirlash, uy tozalash..."
              className="w-full pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ background: "var(--input-bg)", color: "var(--text)" }}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>
          <button
            onClick={handleSubmit}
            className="btn-primary px-6 py-4 rounded-xl font-bold"
          >
            <Search size={20} />
          </button>
        </div>

        {/* Tezkor takliflar */}
        {!results && (
          <div className="flex flex-wrap gap-2 mt-4">
            {QUICK_QUERIES.map(q => (
              <button
                key={q}
                onClick={() => {
                  setQuery(q)
                  handleSearch(q)
                }}
                className="px-3 py-1.5 rounded-full text-sm bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Yuklanish */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      )}

      {/* Natijalar */}
      {results && !loading && (
        <div className="flex flex-col gap-8">
          {/* Provayderlar */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                Provayderlar
                {results.providers.length > 0 && (
                  <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
                    {results.providers.length} ta
                  </span>
                )}
              </h2>
              <Link
                href={`/providers?district=${encodeURIComponent(query)}`}
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                Barchasi <ChevronRight size={14} />
              </Link>
            </div>

            {results.providers.length === 0 ? (
              <div
                className="glass-card p-6 text-center"
                style={{ color: "var(--text-secondary)" }}
              >
                Provayder topilmadi
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {results.providers.slice(0, 5).map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/providers/${p.id}`}
                    className="glass-card p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform group"
                  >
                    <Avatar name={p.name} avatar={p.avatar} size="sm" />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span
                        className="font-semibold text-sm group-hover:text-blue-500 transition-colors truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {p.name}
                      </span>
                      <div
                        className="flex items-center gap-1 text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <Star size={11} className="text-yellow-400 fill-yellow-400" />
                        <span>{p.reliability?.toFixed(1)}%</span>
                        {p.completed_orders > 0 && (
                          <span style={{ color: "var(--muted)" }}>
                            · {p.completed_orders} ta buyurtma
                          </span>
                        )}
                      </div>
                      {p.skills?.length > 0 && (
                        <span
                          className="text-xs truncate"
                          style={{ color: "var(--muted)" }}
                        >
                          {p.skills
                            .slice(0, 3)
                            .map((s: any) => s.name)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      style={{ color: "var(--muted)" }}
                      className="flex-shrink-0"
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Tashkilotlar */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold" style={{ color: "var(--text)" }}>
                Tashkilotlar
                {results.organizations.length > 0 && (
                  <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
                    {results.organizations.length} ta
                  </span>
                )}
              </h2>
              <Link
                href="/organizations"
                className="text-sm text-blue-500 hover:underline flex items-center gap-1"
              >
                Barchasi <ChevronRight size={14} />
              </Link>
            </div>

            {results.organizations.length === 0 ? (
              <div
                className="glass-card p-6 text-center"
                style={{ color: "var(--text-secondary)" }}
              >
                Tashkilot topilmadi
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {results.organizations.slice(0, 4).map((org: any) => (
                  <Link
                    key={org.id}
                    href={`/organizations/${org.id}`}
                    className="glass-card p-4 flex items-center gap-3 hover:scale-[1.01] transition-transform group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                      {org.logo ? (
                        <img
                          src={org.logo}
                          alt={org.name}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                      ) : (
                        <Building size={20} className="text-indigo-500" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <span
                        className="font-semibold text-sm group-hover:text-blue-500 transition-colors truncate"
                        style={{ color: "var(--text)" }}
                      >
                        {org.name}
                      </span>
                      <div
                        className="flex items-center gap-2 text-xs"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <span className="flex items-center gap-0.5">
                          <Star size={11} className="text-yellow-400 fill-yellow-400" />
                          {org.rating?.toFixed(1)}
                        </span>
                        <span style={{ color: "var(--muted)" }}>·</span>
                        <span>{org._count?.members} a'zo</span>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      style={{ color: "var(--muted)" }}
                      className="flex-shrink-0"
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
