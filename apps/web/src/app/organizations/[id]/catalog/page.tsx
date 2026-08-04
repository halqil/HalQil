"use client";

import React, { useMemo } from "react";
import { useOrganization } from "../OrganizationContext";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import Link from "next/link";
import { Layers, ChevronRight } from "lucide-react";

export default function OrganizationCatalogPage() {
  const { org, loading } = useOrganization();

  // Extract unique categories from org.skills
  const categories = useMemo(() => {
    if (!org?.skills) return [];
    const catMap = new Map();
    org.skills.forEach((os: any) => {
      const category = os.skill?.category;
      if (category && !catMap.has(category.slug)) {
        catMap.set(category.slug, category);
      }
    });
    return Array.from(catMap.values());
  }, [org]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!org) return null;

  const breadcrumb = [
    { label: org.name, href: `/organizations/${org.id}` },
    { label: "Katalog" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumb} />
      
      <div className="mt-8 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{org.name} - Xizmat yo'nalishlari</h1>
        <p className="text-gray-500 mt-2">Ushbu tashkilot ko'rsatadigan xizmat yo'nalishlarini tanlang</p>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-gray-500">Tashkilot hozircha hech qanday yo'nalish qo'shmagan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat: any) => (
            <Link
              key={cat.slug}
              href={`/organizations/${org.id}/catalog/${cat.slug}`}
              className="bg-white p-6 rounded-2xl flex items-center gap-4 hover:shadow-lg border border-gray-100 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0 group-hover:scale-110 transition-transform">
                <Layers size={24} />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {cat.name}
                </span>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-primary-500" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
