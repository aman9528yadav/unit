

"use client"

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from '@/context/language-context';
import { ThemeProvider } from '@/context/theme-context';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { listenToGlobalMaintenanceMode } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { Header } from '@/components/header';

function AppFooter() {
    const pathname = usePathname();
    const showFooter = !pathname.startsWith('/dev');

    if (!showFooter) {
        return null;
    }

    return (
        <footer className="text-center p-4 bg-card text-muted-foreground text-sm border-t">
            <p>&copy; {new Date().getFullYear()} Sutradhaar | Owned by Aman Yadav. All Rights Reserved.</p>
        </footer>
    );
}

function MaintenanceRedirect({ children }: { children: React.ReactNode }) {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = listenToGlobalMaintenanceMode(setIsMaintenanceMode);
        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (isMaintenanceMode === null) return;

        if (isMaintenanceMode && !pathname.startsWith('/dev') && pathname !== '/maintenance') {
            router.replace('/maintenance');
        }

        if (!isMaintenanceMode && pathname === '/maintenance') {
            router.replace('/');
        }
    }, [isMaintenanceMode, pathname, router]);


    if (isMaintenanceMode === null) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center">
                <Skeleton className="h-32 w-full max-w-md" />
                <Skeleton className="h-16 w-full max-w-md mt-4" />
            </div>
        );
    }
    
    // Allow dev routes to render regardless of maintenance mode
    if (pathname.startsWith('/dev')) {
        return <>{children}</>;
    }
    
    // If in maintenance, and not on the maintenance page yet, we are redirecting, so render nothing.
    if (isMaintenanceMode && pathname !== '/maintenance') {
        return null; 
    }

    return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const noHeaderPaths = ['/welcome', '/signup', '/forgot-password', '/profile/edit', '/logout', '/profile/success', '/maintenance'];
  const devPaths = /^\/dev(\/.*)?$/;
  const [isCalculatorFullScreen, setIsCalculatorFullScreen] = useState(false);
  
  // A bit of a hack to communicate from a page to the layout.
  // In a real app, you might use a context provider.
  useEffect(() => {
    const checkFullScreen = () => {
        if (pathname === '/calculator') {
             // This is a simplistic check. A more robust solution might involve a global state manager (Context, Zustand, etc.)
             // For this prototype, we'll assume a certain DOM structure or a global flag could be set.
             // Let's assume the child page will add a class to the body.
             const isFullScreen = document.body.classList.contains('calculator-fullscreen');
             setIsCalculatorFullScreen(isFullScreen);
        } else {
            setIsCalculatorFullScreen(false);
        }
    }
    checkFullScreen();

    // Re-check on path changes
    const observer = new MutationObserver(checkFullScreen);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [pathname]);

  
  const hideHeader = noHeaderPaths.includes(pathname) || devPaths.test(pathname) || pathname.startsWith('/notes/') || pathname.startsWith('/profile') || isCalculatorFullScreen;

  return (
    <ThemeProvider>
      <LanguageProvider>
            <html lang="en">
            <head>
                <title>Sutradhaar</title>
                <meta name="description" content="A straightforward unit converter app for various measurements." />
                <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="any" />
                <meta name="manifest" content="/manifest.json" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <link rel="apple-touch-icon" href="/icon-192x192.png" />
            </head>
            <body className="font-body antialiased" suppressHydrationWarning>
                <MaintenanceRedirect>
                <div className="flex flex-col min-h-screen">
                    <main className="flex-grow flex flex-col items-center">
                         {!hideHeader && (
                            <Header />
                        )}
                        {children}
                    </main>
                    <AppFooter />
                </div>
                </MaintenanceRedirect>
                <Toaster />
            </body>
            </html>
      </LanguageProvider>
    </ThemeProvider>
  );
}
