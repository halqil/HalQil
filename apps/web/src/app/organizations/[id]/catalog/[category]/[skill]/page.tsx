"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useOrganization } from "../../../OrganizationContext";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { ServiceTypeCard } from "@/components/catalog/ServiceTypeCard";
import Link from "next/link";
import { Users } from "lucide-react";

export default function OrganizationSkillPage() {
  const params = useParams();
  const categorySlug = params?.category as string;
  const skillSlug = params?.skill as string;
  const { org, loading } = useOrganization();

  const { category, skill, serviceTypes, providersCount } = useMemo(() => {
    if (!org?.skills) return { category: null, skill: null, serviceTypes: [], providersCount: 0 };
    
    // Find skill and category
    let foundSkill = null;
    let foundCat = null;
    
    for (const os of org.skills) {
      if (os.skill?.slug === skillSlug && os.skill?.category?.slug === categorySlug) {
        foundSkill = os.skill;
        foundCat = os.skill.category;
        break;
      }
    }

    // Since we don't have serviceTypes directly on os.skill from the backend `getOrganizationById`
    // Wait, getOrganizationById includes `skills.skill.category` but NOT `skills.skill.serviceTypes`!
    // Let's assume serviceTypes are either there or we just show a placeholder if not loaded,
    // Actually, service types might not be fetched for orgs right now.
    // If it's missing, we fall back to an empty array.
    const sTypes = foundSkill?.serviceTypes || [];

    // Count providers for this skill in this org
    let pCount = 0;
    if (org.members) {
      org.members.forEach((m: any) => {
        const pSkills = m.provider?.providerSkills || [];
        const hasSkill = pSkills.some((ps: any) => ps.skill?.slug === skillSlug);
        if (hasSkill) pCount++;
      });
    }

    return { category: foundCat, skill: foundSkill, serviceTypes: sTypes, providersCount: pCount };
  }, [org, categorySlug, skillSlug]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!org || !skill) {
    return (
      <div className="text-center py-20 text-gray-500">
        Xizmat topilmadi yoki bu tashkilotda bunday xizmat yo'q.
      </div>
    );
  }

  const breadcrumb = [
    { label: org.name, href: `/organizations/${org.id}` },
    { label: "Katalog", href: `/organizations/${org.id}/catalog` },
    { label: category?.name || "Kategoriya", href: `/organizations/${org.id}/catalog/${categorySlug}` },
    { label: skill.name },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumb} />

      <div className="mt-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{skill.name}</h1>
        {skill.description && <p className="text-gray-500 mt-2">{skill.description}</p>}
      </div>

      {serviceTypes.length === 0 ? (
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <p className="text-gray-500">Bu yo'nalish bo'yicha maxsus xizmat turlari topilmadi.</p>
          {/* If there are no service types, the user can directly order the skill from the org profile page, 
              but let's provide a button to order directly */}
          <Link 
            href={`/organizations/${org.id}`}
            className="mt-4 inline-block px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
          >
            Tashkilotga buyurtma berish
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serviceTypes.map((st: any) => (
            <ServiceTypeCard 
              key={st.slug}
              serviceType={st}
              href={`/organizations/${org.id}/catalog/${categorySlug}/${skillSlug}/${st.slug}`}
            />
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
            href={`/organizations/${org.id}/catalog/${categorySlug}/${skillSlug}/providers`}
            className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors border border-gray-200"
          >
            Ro'yxatni ko'rish
          </Link>
        </div>
      </div>
    </div>
  );
}
