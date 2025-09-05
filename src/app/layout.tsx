
"use client"

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from '@/context/language-context';
import { ThemeProvider } from '@/context/theme-context';
import React from 'react';
import { usePathname } from 'next/navigation';

function AppFooter() {
    const pathname = usePathname();
    const showFooter = !pathname.startsWith('/dev'); // Simplified logic

    if (!showFooter) {
        return null;
    }

    return (
        <footer className="text-center p-4 bg-card text-muted-foreground text-sm border-t">
            <p>&copy; {new Date().getFullYear()} Sutradhaar | Owned by Aman Yadav. All Rights Reserved.</p>
        </footer>
    );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <html lang="en" suppressHydrationWarning>
          <head>
            <title>UniConvert</title>
            <meta name="description" content="A straightforward unit converter app for various measurements." />
            <meta name="manifest" content="/manifest.json" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
            <link rel="apple-touch-icon" href="/icon-192x192.png" />
          </head>
          <body className="font-body antialiased">
            <div className="flex flex-col min-h-screen">
                <main className="flex-grow">
                    {children}
                </main>
                <AppFooter />
            </div>
            <Toaster />
          </body>
        </html>
      </LanguageProvider>
    </ThemeProvider>
  );
}
