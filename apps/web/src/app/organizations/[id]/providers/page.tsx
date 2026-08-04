"use client";

import React, { useMemo } from "react";
import { useOrganization } from "../OrganizationContext";
import { Breadcrumb } from "@/components/catalog/Breadcrumb";
import { ProviderList } from "@/components/catalog/ProviderList";
import { Users } from "lucide-react";

export default function OrganizationProvidersPage() {
  const { org, loading } = useOrganization();

  const providers = useMemo(() => {
    if (!org?.members) return [];
    
    return org.members
      .filter((m: any) => m.provider)
      .map((m: any) => {
        const pSkills = m.provider.providerSkills || [];
        return {
          ...m.provider,
          // Map user data for ProviderCard
          id: m.provider.id,
          name: m.provider.user?.name || "Ismsiz Usta",
          avatar: m.provider.user?.avatar,
          rating: m.provider.rating || 0,
          reliability: m.provider.user?.reliability || 0,
          completed_orders: m.provider.completed_orders || 0,
          skills: pSkills.map((ps: any) => ps.skill?.name).filter(Boolean),
        };
      });
  }, [org]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="text-center py-20 text-gray-500">
        Tashkilot topilmadi.
      </div>
    );
  }

  const breadcrumb = [
    { label: org.name, href: `/organizations/${org.id}` },
    { label: "Barcha ustalar" },
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
            {org.name} tashkilotining barcha a'zolari va ustalari
          </p>
        </div>
      </div>

      <ProviderList 
        providers={providers} 
        emptyMessage={`${org.name} da hozircha ustalar mavjud emas.`} 
      />
    </div>
  );
}
