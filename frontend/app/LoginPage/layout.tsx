"use client";

import React from "react";
import {ThemeProvider} from "../components/ThemeProvider";

function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
            {children}
        </ThemeProvider>
    );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClientProviders>{children}</ClientProviders>
    );
}