import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications | ParkShare",
  description: "See your ParkShare reservation and parking-spot activity."
};

export default function NotificationsPageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
