import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "News & Updates | ParkShare",
  description: "Discover the latest ParkShare features and updates."
};

export default function NewsUpdatesPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
