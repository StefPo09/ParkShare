import React from "react";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "./components/ThemeProvider";
import { LanguageProvider } from "./components/LanguageProvider";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import BookingReminderNotifications from "./components/BookingReminderNotifications";
import ProfileCompletionGuard from "./components/ProfileCompletionGuard";
import FloatingAiChat from "./components/FloatingAiChat";
import RouteTransition from "./components/RouteTransition";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ParkShare",
  description: "Find and share parking with ParkShare.",
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'ParkShare',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f4c81',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <LanguageProvider>
          <ThemeProvider>
            <ServiceWorkerRegistration />
            <BookingReminderNotifications />
            <ProfileCompletionGuard>
              <RouteTransition>{children}</RouteTransition>
            </ProfileCompletionGuard>
            <FloatingAiChat />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
