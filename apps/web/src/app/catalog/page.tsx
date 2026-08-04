"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import api from "@/lib/api"
import { ChevronRight, Layers, Users, Building2 } from "lucide-react"

export default function CatalogPage() {
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
    <div className="flex justify-center items-center py-20 min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
    </div>
  )

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 fade-in">
      {/* Header Section */}
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Katalog</h1>
        <p className="text-base text-gray-500 max-w-2xl">
          Barcha xizmatlar, mutaxassislar va tashkilotlar bitta joyda. O'zingizga kerakli bo'limni tanlang.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-gray-500">Kategoriyalar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <Link
              key={cat.id}
              href={`/catalog/${cat.slug}`}
              className="group relative bg-white/70 backdrop-blur-lg rounded-2xl border border-white/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col h-full overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/50 to-primary-50/0 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center shadow-sm border border-primary-100">
                  <Layers size={24} className="text-primary-600" />
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-500 group-hover:text-white transition-colors">
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </div>

              <div className="flex-1 mb-6">
                <h2 className="font-bold text-xl text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100/80">
                <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50/50">
                  <Layers size={14} className="text-gray-400 mb-1" />
                  <span className="text-xs font-semibold text-gray-700">{cat._count?.skills ?? cat.skills?.length ?? 0}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Xizmat</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50/50">
                  <Users size={14} className="text-blue-400 mb-1" />
                  <span className="text-xs font-semibold text-gray-700">{cat.providersCount ?? 0}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Usta</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-xl bg-gray-50/50">
                  <Building2 size={14} className="text-indigo-400 mb-1" />
                  <span className="text-xs font-semibold text-gray-700">{cat.organizationsCount ?? 0}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Firma</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
