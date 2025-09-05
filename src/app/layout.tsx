
"use client"

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from '@/context/language-context';
import { ThemeProvider } from '@/context/theme-context';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { listenToGlobalMaintenanceMode } from '@/services/firestore';

function MaintenanceRedirect({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isMaintenance, setIsMaintenance] = useState(false);

    useEffect(() => {
        const unsubscribe = listenToGlobalMaintenanceMode(setIsMaintenance);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const isAllowedPath = pathname === '/maintenance' || pathname.startsWith('/dev');
        if (isMaintenance && !isAllowedPath) {
            router.replace('/maintenance');
        }
    }, [isMaintenance, pathname, router]);

    const isAllowedPath = pathname === '/maintenance' || pathname.startsWith('/dev');
    if (isMaintenance && !isAllowedPath) {
        return null; // Render nothing while redirecting
    }

    return <>{children}</>;
}

function AppFooter() {
    const pathname = usePathname();
    const showFooter = pathname !== '/maintenance';

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
                    <MaintenanceRedirect>
                        {children}
                    </MaintenanceRedirect>
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
