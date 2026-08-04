"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import { Breadcrumb } from "@/components/catalog/Breadcrumb"
import { Users, Building2, Wrench } from "lucide-react"
import { ServiceTypeCard } from "@/components/catalog/ServiceTypeCard"

export default function SkillPage() {
  const { category, skill } = useParams() as { category: string, skill: string }
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/catalog/categories/${category}/skills/${skill}`)
      .then(res => {
        if (res.data.success) setData(res.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, skill])

  if (loading) return (
    <div className="flex justify-center items-center py-20 min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
    </div>
  )

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <h3 className="text-xl font-medium text-gray-900 mb-2">Xizmat yo'nalishi topilmadi</h3>
      <Link href={`/catalog/${category}`} className="text-primary-600 hover:underline">Kategoriyaga qaytish</Link>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <Breadcrumb items={[
        { label: "Katalog", href: "/catalog" },
        { label: data.category.name, href: `/catalog/${category}` },
        { label: data.name }
      ]} />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">{data.name}</h1>
          {data.description && (
            <p className="text-base text-gray-500 max-w-2xl">{data.description}</p>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link 
            href={`/catalog/${category}/${skill}/providers`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:text-primary-600 transition-all shadow-sm"
          >
            <Users className="w-4 h-4" />
            Ustalar <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-md text-xs">{data.providersCount || 0}</span>
          </Link>
          <Link 
            href={`/catalog/${category}/${skill}/organizations`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:text-indigo-600 transition-all shadow-sm"
          >
            <Building2 className="w-4 h-4" />
            Firmalar <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-md text-xs">{data.organizationsCount || 0}</span>
          </Link>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Wrench className="w-5 h-5 text-primary-500" />
        Aniq xizmat turlari
      </h2>

      {(!data.serviceTypes || data.serviceTypes.length === 0) ? (
        <div className="bg-white/50 backdrop-blur-md rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-gray-500">Bu yo'nalish bo'yicha aniq xizmat turlari kiritilmagan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.serviceTypes.map((st: any) => (
            <ServiceTypeCard 
              key={st.id} 
              serviceType={st} 
              categorySlug={category} 
              skillSlug={skill} 
            />
          ))}
        </div>
      )}
    </div>
  )
}
