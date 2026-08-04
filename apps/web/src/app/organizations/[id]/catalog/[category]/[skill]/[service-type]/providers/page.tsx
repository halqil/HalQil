"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { useOrganization } from "../../../../../OrganizationContext";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { ProviderList } from "@/components/catalog/ProviderList";
import { Users } from "lucide-react";

export default function OrganizationServiceTypeProvidersPage() {
  const params = useParams();
  const categorySlug = params?.category as string;
  const skillSlug = params?.skill as string;
  const stSlug = params?.["service-type"] as string;
  const { org, loading } = useOrganization();

  const { category, skill, serviceType, providers } = useMemo(() => {
    if (!org) return { category: null, skill: null, serviceType: null, providers: [] };

    // Find category, skill and st name for breadcrumb
    let foundCat = null;
    let foundSkill = null;
    let foundSt = null;
    if (org.skills) {
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
    }

    // Filter providers
    const skillProviders: any[] = [];
    if (org.members) {
      org.members.forEach((m: any) => {
        if (m.provider) {
          const pSkills = m.provider.providerSkills || [];
          const hasSkill = pSkills.some((ps: any) => ps.skill?.slug === skillSlug);
          if (hasSkill) {
            skillProviders.push({
              ...m.provider,
              // Map user data for ProviderCard
              id: m.provider.id,
              name: m.provider.user?.name || "Ismsiz Usta",
              avatar: m.provider.user?.avatar,
              rating: m.provider.rating || 0,
              reliability: m.provider.user?.reliability || 0,
              completed_orders: m.provider.completed_orders || 0,
              skills: pSkills.map((ps: any) => ps.skill?.name).filter(Boolean),
            });
          }
        }
      });
    }

    return { category: foundCat, skill: foundSkill, serviceType: foundSt, providers: skillProviders };
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
    { label: serviceType?.name || stSlug, href: `/organizations/${org.id}/catalog/${categorySlug}/${skillSlug}/${stSlug}` },
    { label: "Ustalar" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumb} />

      <div className="mt-8 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="text-primary-500" />
            Ustalar
          </h1>
          <p className="text-gray-500 mt-2">
            {org.name} tashkilotining {serviceType?.name || stSlug} yo'nalishidagi barcha ustalari
          </p>
        </div>
      </div>

      <ProviderList 
        providers={providers} 
        emptyMessage={`${org.name} da ushbu yo'nalishda faol ustalar topilmadi.`} 
      />
    </div>
  );
}
