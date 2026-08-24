import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My App",
  description: "Starter Next.js app"
};

export default function HelpPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
