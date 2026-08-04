"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useOrganization } from "../../../../OrganizationContext";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import Link from "next/link";
import { Users } from "lucide-react";

export default function OrganizationServiceTypePage() {
  const params = useParams();
  const categorySlug = params?.category as string;
  const skillSlug = params?.skill as string;
  const stSlug = params?.["service-type"] as string;
  const { org, loading } = useOrganization();

  const { category, skill, serviceType, providersCount } = useMemo(() => {
    if (!org?.skills) return { category: null, skill: null, serviceType: null, providersCount: 0 };
    
    // Find skill, category, service type
    let foundSkill = null;
    let foundCat = null;
    let foundSt = null;
    
    for (const os of org.skills) {
      if (os.skill?.slug === skillSlug && os.skill?.category?.slug === categorySlug) {
        foundSkill = os.skill;
        foundCat = os.skill.category;
        if (os.skill.serviceTypes) {
          foundSt = os.skill.serviceTypes.find((s: any) => s.slug === stSlug);
        }
        break;
      }
    }

    // Count providers for this service type in this org
    let pCount = 0;
    if (org.members) {
      org.members.forEach((m: any) => {
        // Fallback: If service types aren't strictly mapped to providers yet, we count providers by skill
        const pSkills = m.provider?.providerSkills || [];
        const hasSkill = pSkills.some((ps: any) => ps.skill?.slug === skillSlug);
        if (hasSkill) pCount++;
      });
    }

    return { category: foundCat, skill: foundSkill, serviceType: foundSt, providersCount: pCount };
  }, [org, categorySlug, skillSlug, stSlug]);

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
    { label: skill.name, href: `/organizations/${org.id}/catalog/${categorySlug}/${skillSlug}` },
    { label: serviceType?.name || stSlug },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumb} />

      <div className="mt-8 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{serviceType?.name || stSlug}</h1>
        {serviceType?.description && <p className="text-gray-500 mt-2">{serviceType.description}</p>}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Shu xizmatga buyurtma berish</h2>
          <p className="text-gray-500 mt-1">Tashkilot orqali ushbu xizmatni buyurtma qilishingiz mumkin.</p>
        </div>
        
        {/* Placeholder for order action */}
        <Link 
          href={`/organizations/${org.id}`}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors shadow-sm"
        >
          Buyurtma berish
        </Link>
      </div>

      {/* Umumiy ustalar */}
      <div className="mt-12 pt-8 border-t border-gray-100">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users size={20} className="text-primary-500" />
              Barcha ustalar ({providersCount})
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Shu xizmat bo'yicha tashkilotning barcha ustalarini ko'rish
            </p>
          </div>
          <Link
            href={`/organizations/${org.id}/catalog/${categorySlug}/${skillSlug}/${stSlug}/providers`}
            className="px-6 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors border border-gray-200"
          >
            Ro'yxatni ko'rish
          </Link>
        </div>
      </div>
    </div>
  );
}
