import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About ParkShare",
  description: "Learn about ParkShare and our goal to make parking easier to find and share.",
  icons: {
    icon: '/Icon.svg',
    apple: '/Icon.svg',
  },
}

export default function AboutUsPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
