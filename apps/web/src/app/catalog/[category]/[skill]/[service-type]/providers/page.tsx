"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { Breadcrumb } from "@/components/catalog/Breadcrumb"
import { ProviderList } from "@/components/catalog/ProviderList"

export default function ServiceTypeProvidersPage() {
  const { category, skill, "service-type": stSlug } = useParams() as { category: string, skill: string, "service-type": string }
  const [providers, setProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryName, setCategoryName] = useState<string>("...")
  const [skillName, setSkillName] = useState<string>("...")
  const [stName, setStName] = useState<string>("...")

  useEffect(() => {
    // Fetch ST details for breadcrumb
    api.get(`/catalog/categories/${category}/skills/${skill}/service-types/${stSlug}`)
      .then(res => {
        if (res.data.success) {
          setCategoryName(res.data.data.skill?.category?.name || "...")
          setSkillName(res.data.data.skill?.name || "...")
          setStName(res.data.data.name)
        }
      }).catch(console.error)

    // Fetch providers
    api.get(`/catalog/categories/${category}/skills/${skill}/service-types/${stSlug}/providers`)
      .then(res => {
        if (res.data.success) setProviders(res.data.data.providers)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, skill, stSlug])

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <Breadcrumb items={[
        { label: "Katalog", href: "/catalog" },
        { label: categoryName, href: `/catalog/${category}` },
        { label: skillName, href: `/catalog/${category}/${skill}` },
        { label: stName, href: `/catalog/${category}/${skill}/${stSlug}` },
        { label: "Ustalar" }
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{stName} - Ustalar</h1>
        <p className="text-gray-500 mt-2">Bu xizmat turi bo'yicha mutaxassislar ro'yxati</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
        </div>
      ) : (
        <ProviderList 
          providers={providers} 
          emptyMessage="Bu xizmat turi bo'yicha hozircha ustalar ro'yxatdan o'tmagan." 
        />
      )}
    </div>
  )
}
