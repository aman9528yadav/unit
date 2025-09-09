

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
import { cn } from '@/lib/utils';
import { SidebarProvider, Sidebar, SidebarClose, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, Sigma, Calculator, NotebookPen, History, Timer, Settings, HelpCircle, X, User, Info, Newspaper, Rocket, Palette, Languages, Hourglass, Calendar, Mail, Crown, Sparkles, LogIn, LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { motion, PanInfo } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Header } from '@/components/header';


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


const navSections = [
    { 
        title: "📊 Productivity", 
        links: [
            { href: "/", label: "Dashboard", icon: Home },
            { href: "/converter", label: "Converter", icon: Sigma },
            { href: "/calculator", label: "Calculator", icon: Calculator },
            { href: "/notes", label: "Notes", icon: NotebookPen },
            { href: "/time?tab=date-diff", label: "Date Calc", icon: Calendar },
        ]
    },
    { 
        title: "⏱️ Time Tools", 
        links: [
            { href: "/history", label: "History", icon: History, requiresAuth: true },
            { href: "/time?tab=timer", label: "Timer", icon: Timer },
            { href: "/time?tab=stopwatch", label: "Stopwatch", icon: Hourglass },
        ]
    },
    {
        title: "🌐 Online Tools",
        links: [
            { href: "/translator", label: "AI Translator", icon: Languages },
            { href: "https://aman9528.wixstudio.com/my-site-3", label: "News", icon: Newspaper, isExternal: true },
        ]
    },
    {
        title: "⚙️ Settings",
        links: [
            { href: "/profile", label: "Profile", icon: User, requiresAuth: true },
            { href: "/settings", label: "Settings", icon: Settings, requiresAuth: true },
            { href: "/updates", label: "Updates", icon: Rocket },
            { href: "/premium", label: "Go Premium", icon: Crown },
            { href: "/about", label: "About", icon: Info },
            { href: "/how-to-use", label: "Help", icon: HelpCircle },
            { href: "https://aman9528.wixstudio.com/my-site-3/aman", label: "Contact Us", icon: Mail, isExternal: true },
        ]
    }
];

function PageContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Partial<UserData> | null>(null);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

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

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Navigate back if swiped right with enough velocity
    if (info.offset.x > 100 && info.velocity.x > 200) {
      router.back();
    }
  };

  return (
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        className={cn("w-full flex-grow flex flex-col", "relative bg-transparent")}
      >
          {children}
      </motion.div>
  )
}

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [profile, setProfile] = useState<Partial<UserData> | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [isCalculatorFullScreen, setIsCalculatorFullScreen] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  
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
    setIsLoggedIn(!!userEmail);

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


  const handleLinkClick = (e: React.MouseEvent, href: string, requiresAuth: boolean) => {
    if (requiresAuth && !isLoggedIn) {
      e.preventDefault();
      setShowLoginDialog(true);
    }
  };
  
  const handleLogout = () => {
    auth.signOut().then(() => {
        localStorage.removeItem("userProfile");
        router.push("/logout");
    });
  }

  return (
    <html lang="en">
      <head>
          <title>Sutradhaar</title>
          <meta name="description" content="A straightforward unit converter app for various measurements." />
          <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%236B46C1' /><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='70' fill='white' font-family='sans-serif'>S</text></svg>" />
          <meta name="manifest" content="/manifest.json" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={cn("font-body antialiased", theme === 'sutradhaar' && 'sutradhaar-body')} suppressHydrationWarning>
          <MaintenanceRedirect>
            <SidebarProvider>
                <div className="flex min-h-screen items-start justify-center flex-col">
                    <div className="w-full max-w-[412px] mx-auto flex flex-col flex-grow bg-background/80 backdrop-blur-sm">
                        <Header />
                        <PageContent>{children}</PageContent>
                    </div>
                </div>
                <Sidebar>
                    <SidebarContent>
                         <SidebarClose asChild>
                            <Button
                                variant="ghost"
                                className="absolute top-4 right-4 text-2xl font-bold text-gray-600 dark:text-gray-300 hover:text-red-500"
                            >
                                ✕
                            </Button>
                        </SidebarClose>

                        <div className="flex items-center gap-4 mb-8 mt-10 p-3 bg-white/70 dark:bg-neutral-800/70 rounded-2xl shadow-md">
                            <Avatar className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                                <AvatarImage src={profile?.profileImage || ''} />
                                <AvatarFallback className="text-white font-bold text-lg bg-transparent">{profile?.fullName?.[0] || 'G'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Welcome back,</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">{profile?.fullName || 'Guest'}</p>
                                {isLoggedIn ? (
                                    <button onClick={() => router.push('/profile')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View Profile</button>
                                ): (
                                    <button onClick={() => router.push('/welcome')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Login</button>
                                )}
                            </div>
                        </div>

                         <div className="space-y-8 overflow-y-auto h-[65vh] pb-6 pr-2 custom-scrollbar">
                           {navSections.map(section => {
                                const filteredLinks = section.links.filter(link => !link.requiresAuth || isLoggedIn);
                                if(filteredLinks.length === 0) return null;

                               return (
                                <section key={section.title}>
                                    <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3">{section.title}</h2>
                                    <SidebarMenu>
                                         {filteredLinks.map((link) => (
                                            <SidebarMenuItem key={link.href}>
                                                <Link 
                                                href={link.href} 
                                                passHref
                                                onClick={(e) => handleLinkClick(e, link.href, !!link.requiresAuth)}
                                                target={link.isExternal ? "_blank" : undefined}
                                                rel={link.isExternal ? "noopener noreferrer" : undefined}
                                                >
                                                    <SidebarMenuButton isActive={pathname === link.href}>
                                                        <link.icon size={20}/>
                                                        <span>{link.label}</span>
                                                    </SidebarMenuButton>
                                                </Link>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </section>
                               )
                           })}
                        </div>
                        
                         <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400 border-t pt-4">
                            Sutradhaar <br /> Made by Aman Yadav
                            {isLoggedIn && (
                                <div className="flex justify-center mt-3">
                                <button onClick={handleLogout} className="flex items-center gap-1 text-red-500 text-sm hover:underline">
                                    <LogOut size={16} /> Logout
                                </button>
                                </div>
                            )}
                        </div>
                    </SidebarContent>
                </Sidebar>
            </SidebarProvider>
          </MaintenanceRedirect>
          <Toaster />
          <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
            <AlertDialogContent>
              <AlertDialogHeader className="items-center text-center">
                <div className="p-3 bg-primary/10 rounded-full mb-4 w-fit">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <AlertDialogTitle className="text-2xl">{t('dashboard.unlockProfile.title')}</AlertDialogTitle>
                <AlertDialogDescription className="max-w-xs">
                  {t('dashboard.unlockProfile.description')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col-reverse sm:flex-col-reverse gap-2">
                <AlertDialogCancel>{t('dashboard.unlockProfile.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => router.push('/welcome')} className="bg-primary hover:bg-primary/90">
                  <LogIn className="mr-2"/>
                  {t('dashboard.unlockProfile.confirm')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      </body>
    </html>
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
        <RootLayoutContent>{children}</RootLayoutContent>
      </LanguageProvider>
    </ThemeProvider>
  );
}
