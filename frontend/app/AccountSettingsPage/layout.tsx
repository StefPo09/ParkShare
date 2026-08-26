import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ParkShare",
  description: "Park | Share app",
  icons: {
    icon: '/Icon.svg',
    apple: '/Icon.svg',
  },
}

export default function AccountSettingsPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
