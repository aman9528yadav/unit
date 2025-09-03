
"use client"

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from '@/context/language-context';
import { ThemeProvider } from '@/context/theme-context';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function MaintenanceRedirect({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        const checkMaintenanceMode = () => {
            const isMaintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
            const isAllowedPath = pathname === '/maintenance' || pathname.startsWith('/dev');
            
            if (isMaintenanceMode && !isAllowedPath) {
                router.replace('/maintenance');
            }
        };

        checkMaintenanceMode();

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'maintenanceMode') {
                checkMaintenanceMode();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [isClient, pathname, router]);

    if (!isClient) {
        return null;
    }

    return <>{children}</>;
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
            <MaintenanceRedirect>
                {children}
            </MaintenanceRedirect>
            <Toaster />
          </body>
        </html>
      </LanguageProvider>
    </ThemeProvider>
  );
}
