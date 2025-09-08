
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
import { cn } from '@/lib/utils';
import { SidebarProvider, Sidebar, SidebarClose, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, Sigma, Calculator, NotebookPen, History, Timer, Settings, HelpCircle, X } from 'lucide-react';
import { Logo } from '@/components/logo';

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


const navLinks = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/converter", label: "Converter", icon: Sigma },
    { href: "/calculator", label: "Calculator", icon: Calculator },
    { href: "/notes", label: "Notes", icon: NotebookPen },
    { href: "/history", label: "History", icon: History },
    { href: "/time", label: "Timer", icon: Timer },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/how-to-use", label: "Help", icon: HelpCircle },
]

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const noHeaderPaths = ['/welcome', '/signup', '/forgot-password', '/profile/edit', '/logout', '/profile/success', '/maintenance'];
  const devPaths = /^\/dev(\/.*)?$/;
  const [isCalculatorFullScreen, setIsCalculatorFullScreen] = useState(false);
  
  useEffect(() => {
    const checkFullScreen = () => {
        if (pathname === '/calculator') {
             const isFullScreen = document.body.classList.contains('calculator-fullscreen');
             setIsCalculatorFullScreen(isFullScreen);
        } else {
            setIsCalculatorFullScreen(false);
        }
    }
    checkFullScreen();

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
                  <SidebarProvider>
                      <div className="flex flex-col min-h-screen items-center">
                          <div className={cn("w-full flex-grow flex flex-col", "max-w-[412px] relative")}>
                              {!hideHeader && (
                                  <Header />
                              )}
                              {children}
                          </div>
                      </div>
                      <Sidebar>
                          <SidebarContent>
                               <div className="absolute top-4 right-4">
                                <SidebarClose asChild>
                                  <Button variant="ghost" size="icon">
                                    <X className="h-6 w-6" />
                                  </Button>
                                </SidebarClose>
                              </div>
                              <SidebarMenu>
                                  {navLinks.map((link) => (
                                      <SidebarMenuItem key={link.href}>
                                          <Link href={link.href} passHref>
                                              <SidebarMenuButton isActive={pathname === link.href}>
                                                  <span>{link.label}</span>
                                              </SidebarMenuButton>
                                          </Link>
                                      </SidebarMenuItem>
                                  ))}
                              </SidebarMenu>
                          </SidebarContent>
                      </Sidebar>
                  </SidebarProvider>
                </MaintenanceRedirect>
                <Toaster />
            </body>
            </html>
      </LanguageProvider>
    </ThemeProvider>
  );
}
