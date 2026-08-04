import React from "react";
import { OrganizationProvider } from "./OrganizationContext";

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      {children}
    </OrganizationProvider>
  );
}
