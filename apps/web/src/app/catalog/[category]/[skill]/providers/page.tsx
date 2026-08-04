"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { Breadcrumb } from "@/components/catalog/Breadcrumb"
import { ProviderList } from "@/components/catalog/ProviderList"

export default function SkillProvidersPage() {
  const { category, skill } = useParams() as { category: string, skill: string }
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryName, setCategoryName] = useState<string>("...")
  const [skillName, setSkillName] = useState<string>("...")

  useEffect(() => {
    // Fetch skill details for breadcrumb
    api.get(`/catalog/categories/${category}/skills/${skill}`)
      .then(res => {
        if (res.data.success) {
          setCategoryName(res.data.data.category?.name || "...")
          setSkillName(res.data.data.name)
        }
      }).catch(console.error)

    // Fetch providers
    api.get(`/catalog/categories/${category}/skills/${skill}/providers`)
      .then(res => {
        if (res.data.success) setProviders(res.data.data.providers)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, skill])

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <Breadcrumb items={[
        { label: "Katalog", href: "/catalog" },
        { label: categoryName, href: `/catalog/${category}` },
        { label: skillName, href: `/catalog/${category}/${skill}` },
        { label: "Ustalar" }
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{skillName} ustalari</h1>
        <p className="text-gray-500 mt-2">Bu yo'nalish bo'yicha barcha mutaxassislar ro'yxati</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      ) : (
        <ProviderList 
          providers={providers} 
          emptyMessage="Bu xizmat bo'yicha hozircha ustalar ro'yxatdan o'tmagan." 
        />
      )}
    </div>
  )
}
