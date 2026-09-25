import React from "react";
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "./components/ThemeProvider";
import { LanguageProvider } from "./components/LanguageProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ParkShare",
  description: "Park | Share app",
  icons: {
    icon: '/Icon.svg',
    apple: '/Icon.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Inline failsafe script: if client JS bundles are blocked or hydration never runs,
            this will hide the loading overlay and reveal the StartPage UI after a short timeout. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){
          try{
            var reveal = function(){
              var overlay = document.getElementById('parkshare-loading-overlay');
              if(overlay){ overlay.style.display = 'none'; }
              var morph = document.getElementById('parkshare-morph-container');
              if(morph){
                morph.classList.remove('opacity-0','-translate-y-8','scale-150');
                morph.classList.add('opacity-100','translate-y-0','scale-100');
              }
              var tagline = document.getElementById('parkshare-tagline-container');
              if(tagline){
                tagline.classList.remove('opacity-0','translate-y-16');
                tagline.classList.add('opacity-100','translate-y-0');
              }
            };
            // Run shortly after parse and again as a failsafe
            setTimeout(reveal, 700);
            setTimeout(reveal, 3000);
            setTimeout(reveal, 8000);
          }catch(e){/* no-op */}
        })();` }} />

        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
