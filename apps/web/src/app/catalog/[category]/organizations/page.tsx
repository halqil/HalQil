"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import api from "@/lib/api"
import { Breadcrumb } from "@/components/catalog/Breadcrumb"
import { OrganizationList } from "@/components/catalog/OrganizationList"

export default function CategoryOrganizationsPage() {
  const { category } = useParams() as { category: string }
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryName, setCategoryName] = useState<string>("...")

  useEffect(() => {
    api.get(`/catalog/categories/${category}`)
      .then(res => {
        if (res.data.success) setCategoryName(res.data.data.name)
      }).catch(console.error)

    api.get(`/catalog/categories/${category}/organizations`)
      .then(res => {
        if (res.data.success) setOrganizations(res.data.data.organizations)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <Breadcrumb items={[
        { label: "Katalog", href: "/catalog" },
        { label: categoryName, href: `/catalog/${category}` },
        { label: "Barcha firmalar" }
      ]} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{categoryName} firmalari</h1>
        <p className="text-gray-500 mt-2">Bu yo'nalishdagi barcha tasdiqlangan tashkilotlar ro'yxati</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        </div>
      ) : (
        <OrganizationList 
          organizations={organizations} 
          emptyMessage="Bu kategoriyada hozircha firmalar ro'yxatdan o'tmagan." 
        />
      )}
    </div>
  )
}
