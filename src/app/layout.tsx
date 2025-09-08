

"use client"

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider, useLanguage } from '@/context/language-context';
import { ThemeProvider, useTheme } from '@/context/theme-context';
import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { listenToGlobalMaintenanceMode, UserData, listenToUserData, listenToAboutInfoFromRtdb, AppInfo, updateUserData } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { Header } from '@/components/header';
import { cn } from '@/lib/utils';
import { SidebarProvider, Sidebar, SidebarClose, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, Sigma, Calculator, NotebookPen, History, Timer, Settings, HelpCircle, X, User, Info, Newspaper, Rocket, Palette, Languages, Hourglass, Calendar, Mail } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

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
    { href: "/translator", label: "AI Translator", icon: Languages },
    { href: "/history", label: "History", icon: History },
    { href: "/time?tab=timer", label: "Timer", icon: Timer },
    { href: "/time?tab=stopwatch", label: "Stopwatch", icon: Hourglass },
    { href: "/time?tab=date-diff", label: "Date Calc", icon: Calendar },
    { href: "/news", label: "News", icon: Newspaper },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/updates", label: "Updates", icon: Rocket },
    { href: "/about", label: "About", icon: Info },
    { href: "/how-to-use", label: "Help", icon: HelpCircle },
     { href: "https://aman9528.wixstudio.com/my-site-3/aman", label: "Contact Us", icon: Mail, isExternal: true },
]

function SidebarSelectors() {
    const { language, setLanguage } = useLanguage();
    const { theme, setTheme, customTheme } = useTheme();
    const [profile, setProfile] = useState<{email:string} | null>(null);

    useEffect(() => {
        const storedProfile = localStorage.getItem("userProfile");
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
        }
    }, [])

    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme as any);
        if (profile?.email) {
            updateUserData(profile.email, { settings: { theme: newTheme } });
        }
    }
    
    const handleLanguageChange = (newLang: string) => {
        setLanguage(newLang as 'en' | 'hi');
         if (profile?.email) {
            updateUserData(profile.email, { settings: { language: newLang } });
        }
    }

    const themes = [
      { name: 'Light', value: 'light' },
      { name: 'Dark', value: 'dark' },
      { name: 'Sutradhaar', value: 'sutradhaar' },
      { name: 'Retro', value: 'retro' },
      { name: 'Glass', value: 'glass' },
      { name: 'Nord', value: 'nord' },
      { name: 'Rose Pine', value: 'rose-pine' },
      ...(customTheme ? [{ name: 'Custom', value: 'custom' }] : [])
    ];

    return (
        <div className="grid grid-cols-2 gap-4 w-[250px] mb-8">
            <div>
                 <Label className="text-xs text-black/70">Theme</Label>
                 <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="h-8 text-black bg-white/50 border-black/20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {themes.map(t => <SelectItem key={t.value} value={t.value}>{t.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div>
                <Label className="text-xs text-black/70">Language</Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                     <SelectTrigger className="h-8 text-black bg-white/50 border-black/20">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<Partial<UserData> | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const noHeaderPaths = ['/welcome', '/signup', '/forgot-password', '/getting-started', '/maintenance', '/logout', '/profile/success'];
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

  useEffect(() => {
    const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
    if (userEmail) {
        const unsub = listenToUserData(userEmail, (data) => {
            setProfile(data);
        });
        return () => unsub();
    }
     const unsubAppInfo = listenToAboutInfoFromRtdb((data) => {
      if (data?.appInfo) {
        setAppInfo(data.appInfo);
      }
    });

    return () => unsubAppInfo();
  }, []);

  
  const hideHeader = noHeaderPaths.includes(pathname) || devPaths.test(pathname) || isCalculatorFullScreen;

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
                      <div className="flex min-h-screen items-center justify-center">
                          <div className={cn("w-full flex-grow flex flex-col", "max-w-[415px] relative")}>
                              {!hideHeader && (
                                  <Header />
                              )}
                              {children}
                          </div>
                      </div>
                      <Sidebar>
                          <SidebarContent className="p-4 flex flex-col items-center justify-center">
                               <div className="absolute top-4 flex flex-col items-center gap-4">
                                <SidebarSelectors />
                                <SidebarClose asChild>
                                  <Button variant="ghost" size="icon" className="text-black hover:bg-black/10 rounded-full">
                                    <X className="h-6 w-6" />
                                  </Button>
                                </SidebarClose>
                              </div>
                              <div className="text-center text-black mb-8 mt-24">
                                <h2 className="text-xl font-medium">Welcome back,</h2>
                                <p className="text-3xl font-bold">{profile?.fullName || 'Guest'}</p>
                              </div>
                              <SidebarMenu>
                                  {navLinks.map((link) => (
                                      <SidebarMenuItem key={link.href}>
                                          <Link href={link.href} passHref>
                                              <SidebarMenuButton isActive={pathname === link.href}>
                                                  <link.icon className="w-5 h-5"/>
                                                  <span>{link.label}</span>
                                              </SidebarMenuButton>
                                          </Link>
                                      </SidebarMenuItem>
                                  ))}
                              </SidebarMenu>
                               <div className="absolute bottom-4 text-center text-black/60 text-sm">
                                <p>Sutradhaar {appInfo?.version || ''}</p>
                                <p>Made by Aman Yadav</p>
                              </div>
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
