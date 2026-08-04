"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface OrganizationContextType {
  org: Record<string, any> | null;
  loading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({ org: null, loading: true });

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [org, setOrg] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOrg = async () => {
      try {
        const res = await api.get(`/organizations/${id}`);
        if (res.data.success) {
          setOrg(res.data.data);
        }
      } catch (error) {
        toast.error("Tashkilot topilmadi");
        router.push("/organizations");
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, [id, router]);

  return (
    <OrganizationContext.Provider value={{ org, loading }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = () => useContext(OrganizationContext);
