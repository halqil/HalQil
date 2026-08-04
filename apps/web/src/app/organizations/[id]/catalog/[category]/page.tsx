"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "../../OrganizationContext";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import Link from "next/link";
import { Briefcase, ChevronRight, Users } from "lucide-react";

export default function OrganizationCategoryPage() {
  const params = useParams();
  const categorySlug = params?.category as string;
  const router = useRouter();
  const { org, loading } = useOrganization();

  const { category, skills, providersCount } = useMemo(() => {
    if (!org?.skills) return { category: null, skills: [], providersCount: 0 };
    
    // Find category details and its skills in this org
    let catObj = null;
    const catSkills = [];
    
    for (const os of org.skills) {
      if (os.skill?.category?.slug === categorySlug) {
        if (!catObj) catObj = os.skill.category;
        catSkills.push(os.skill);
      }
    }

    // Count providers for this category in this org
    let pCount = 0;
    if (org.members) {
      org.members.forEach((m: any) => {
        const pSkills = m.provider?.providerSkills || [];
        const hasSkillInCategory = pSkills.some((ps: any) => ps.skill?.category?.slug === categorySlug);
        if (hasSkillInCategory) pCount++;
      });
    }

    return { category: catObj, skills: catSkills, providersCount: pCount };
  }, [org, categorySlug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!org || !category) {
    return (
      <div className="text-center py-20 text-gray-500">
        Kategoriya topilmadi yoki bu tashkilotda bunday xizmat yo'q.
      </div>
    );
  }

  const breadcrumb = [
    { label: org.name, href: `/organizations/${org.id}` },
    { label: "Katalog", href: `/organizations/${org.id}/catalog` },
    { label: category.name },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumb} />

      <div className="mt-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{category.name}</h1>
        <p className="text-gray-500 mt-2">Qaysi xizmat turini qidiryapsiz?</p>
      </div>

      {skills.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-gray-500">Xizmatlar topilmadi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill: any) => (
            <Link
              key={skill.slug}
              href={`/organizations/${org.id}/catalog/${categorySlug}/${skill.slug}`}
              className="bg-white p-6 rounded-2xl flex items-center gap-4 hover:shadow-lg border border-gray-100 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 flex-shrink-0 group-hover:scale-110 transition-transform">
                <Briefcase size={24} />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {skill.name}
                </span>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-500" />
            </Link>
          ))}
        </div>
      )}

      {/* Umumiy ustalar */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-primary-500" />
              Barcha ustalar ({providersCount})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Shu yo'nalish bo'yicha tashkilotning barcha ustalarini ko'rish
            </p>
          </div>
          <Link
            href={`/organizations/${org.id}/catalog/${categorySlug}/providers`}
            className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors border border-gray-200"
          >
            Ro'yxatni ko'rish
          </Link>
        </div>
      </div>
    </div>
  );
}
