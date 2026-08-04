"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import api from "@/lib/api"
import { Breadcrumb } from "@/components/catalog/Breadcrumb"
import { Users, Building2, ShieldCheck, CheckCircle2 } from "lucide-react"

export default function ServiceTypePage() {
  const { category, skill, "service-type": stSlug } = useParams() as { category: string, skill: string, "service-type": string }
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/catalog/categories/${category}/skills/${skill}/service-types/${stSlug}`)
      .then(res => {
        if (res.data.success) setData(res.data.data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [category, skill, stSlug])

  if (loading) return (
    <div className="flex justify-center items-center py-20 min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
    </div>
  )

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <h3 className="text-xl font-medium text-gray-900 mb-2">Xizmat turi topilmadi</h3>
      <Link href={`/catalog/${category}/${skill}`} className="text-primary-600 hover:underline">Orqaga qaytish</Link>
    </div>
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS', maximumFractionDigits: 0 }).format(price);
  };

  let displayPrice = 'Kelishilgan narxda';
  if (data.pricingType === 'FIXED' && data.fixedPrice) {
    displayPrice = formatPrice(data.fixedPrice);
  } else if (data.pricingType === 'RANGE' && data.minPrice) {
    displayPrice = data.maxPrice ? `${formatPrice(data.minPrice)} - ${formatPrice(data.maxPrice)}` : `dan ${formatPrice(data.minPrice)}`;
  } else if (data.pricingType === 'STARTING_AT' && data.minPrice) {
    displayPrice = `dan ${formatPrice(data.minPrice)}`;
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 fade-in">
      <Breadcrumb items={[
        { label: "Katalog", href: "/catalog" },
        { label: data.skill.category.name, href: `/catalog/${category}` },
        { label: data.skill.name, href: `/catalog/${category}/${skill}` },
        { label: data.name }
      ]} />

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8 md:p-10">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{data.name}</h1>
            
            {data.description && (
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                {data.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100/60">
              <div>
                <span className="block text-sm text-gray-500 mb-1">Xizmat narxi</span>
                <span className="text-2xl font-bold text-gray-900">{displayPrice}</span>
              </div>
              <div className="w-px h-12 bg-gray-200 hidden sm:block"></div>
              <div>
                <span className="block text-sm text-gray-500 mb-1">Kafolat</span>
                <span className="flex items-center text-green-600 font-medium">
                  <ShieldCheck className="w-5 h-5 mr-1" /> Platforma kafolati
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link 
                href={`/catalog/${category}/${skill}/${stSlug}/providers`}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-all shadow-sm hover:shadow-md"
              >
                <Users className="w-5 h-5" />
                Usta chaqirish
              </Link>
              <Link 
                href={`/catalog/${category}/${skill}/${stSlug}/organizations`}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                <Building2 className="w-5 h-5" />
                Firmalarni ko'rish
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border-t border-gray-100 p-6 md:px-10">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Nega aynan HalQil?</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Faqat tasdiqlangan va tekshirilgan ustalar</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Sifat va narx mutanosibligi</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>Nizoli vaziyatlarda adolatli yechim</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
