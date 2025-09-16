
"use client"

import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider, useLanguage } from '@/context/language-context';
import { ThemeProvider, useTheme } from '@/context/theme-context';
import React, { useEffect, useState } from 'react';
import { usePathname, useRouter, AppRouterInstance } from 'next/navigation';
import { listenToGlobalMaintenanceMode, UserData, listenToUserData, listenToAboutInfoFromRtdb, AppInfo, updateUserData, listenToUpdateInfo } from '@/services/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { SidebarProvider, Sidebar, SidebarClose, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Home, Sigma, Calculator, NotebookPen, History, Timer, Settings, HelpCircle, X, User, Info, Newspaper, Rocket, Palette, Languages, Hourglass, Calendar, Mail, Crown, Sparkles, LogIn, LogOut } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Header } from '@/components/header';
import { auth } from '@/lib/firebase';
import * as LucideIcons from 'lucide-react';


function MaintenanceRedirect({ children }: { children: React.ReactNode }) {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = listenToGlobalMaintenanceMode(setIsMaintenanceMode);
        return () => unsubscribe();
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
            { href: "/time?tab=timer", label: "Timer", icon: Timer },
            { href: "/time?tab=stopwatch", label: "Stopwatch", icon: Hourglass },
        ]
    },
    { 
        title: "⏱️ Time Tools", 
        links: [
            { href: "/history", label: "History", icon: History, requiresAuth: true },
        ]
    },
    {
        title: "🌐 Online Tools",
        links: [
            { href: "/translator", label: "AI Translator", icon: Languages, comingSoon: true, description: "Translate text between multiple languages with AI-powered suggestions and corrections." },
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

function PageSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-4">
                 <Skeleton className="h-24 w-full rounded-2xl" />
                 <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
    )
}


function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [profile, setProfile] = useState<Partial<UserData> | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);
  const [comingSoonFeature, setComingSoonFeature] = useState<{title: string, description: string, icon: React.ElementType} | null>(null);


  // Pages where the main header should be hidden
  const noHeaderPages = ['/welcome', '/signup', '/forgot-password', '/logout', '/getting-started', '/maintenance'];
  const showHeader = !noHeaderPages.includes(pathname);
  
  useEffect(() => {
    const handleAuthChange = (user: any) => {
        const userEmail = user ? user.email : null;
        setIsLoggedIn(!!userEmail);

        if (userEmail) {
            const unsub = listenToUserData(userEmail, (data) => {
                setProfile(data);
            });
            return () => unsub();
        } else {
            setProfile(null);
        }
    };
    
    // Check initial state
    const currentUser = auth.currentUser;
    handleAuthChange(currentUser);

    // Listen for future changes
    const unsubscribe = auth.onAuthStateChanged(handleAuthChange);
    
    return () => unsubscribe();
  }, []);


  const handleLinkClick = (e: React.MouseEvent, link: any) => {
    if (link.requiresAuth && !isLoggedIn) {
      e.preventDefault();
      setShowLoginDialog(true);
    }
    if(link.comingSoon) {
        e.preventDefault();
        setComingSoonFeature({
            title: link.label,
            description: link.description || "This feature is under development. We'll notify you when it's ready!",
            icon: link.icon
        });
        setShowComingSoonDialog(true);
    }
  };
  
  const handleLogout = () => {
    auth.signOut().then(() => {
        localStorage.removeItem("userProfile");
        setIsLoggedIn(false);
        setProfile(null);
        router.push("/logout");
    });
  }
  
  const displayName = profile?.email === 'amanyadavyadav9458@gmail.com' ? 'Aman jii' : profile?.fullName || 'Guest';


  return (
    <html lang="en">
      <head>
          <title>Sutradhaar</title>
          <meta name="description" content="A straightforward unit converter app for various measurements." />
          <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%237C3AED' /><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='70' fill='white' font-family='sans-serif'>S</text></svg>" />
          <meta name="manifest" content="/manifest.json" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={cn("font-body antialiased", theme === 'sutradhaar' && 'sutradhaar-body')} suppressHydrationWarning>
          <MaintenanceRedirect>
            {pathname === '/maintenance' ? (
                 <AnimatePresence mode="wait">
                    <motion.div
                        key={pathname}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            ) : (
                <SidebarProvider>
                    <div className="flex min-h-screen items-start justify-center flex-col">
                        <div className="w-full max-w-[412px] mx-auto flex flex-col flex-grow bg-background">
                            {showHeader && <Header />}
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={pathname}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full flex-grow flex flex-col"
                                >
                                    <React.Suspense fallback={<div className="w-full flex-grow p-4 sm:p-6"><PageSkeleton/></div>}>
                                        {children}
                                    </React.Suspense>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                    <Sidebar>
                        <SidebarContent>
                            <SidebarClose asChild>
                                <Button
                                    variant="ghost"
                                    className="absolute top-4 right-4 text-2xl font-bold"
                                >
                                    ✕
                                </Button>
                            </SidebarClose>

                            <div className="flex items-center gap-4 mb-8 mt-10 p-3 bg-card/70 dark:bg-card/70 rounded-2xl shadow-md">
                                <Avatar className="w-14 h-14 bg-gradient-to-r from-primary to-accent shadow-lg">
                                    <AvatarImage src={profile?.profileImage || ''} />
                                    <AvatarFallback className="text-white font-bold text-lg bg-transparent">{profile?.fullName?.[0] || 'G'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-xs text-muted-foreground">Welcome back,</p>
                                    <p className="text-lg font-semibold text-foreground">{displayName}</p>
                                    {isLoggedIn ? (
                                        <button onClick={() => router.push('/profile')} className="text-xs text-primary hover:underline">View Profile</button>
                                    ): (
                                        <button onClick={() => router.push('/welcome')} className="text-xs text-primary hover:underline">Login</button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-8 overflow-y-auto h-[calc(100vh-280px)] pb-6 pr-2 sidebar-scrollbar always-visible-scrollbar">
                            {navSections.map(section => {
                                    const filteredLinks = section.links.filter(link => !link.requiresAuth || isLoggedIn);
                                    if(filteredLinks.length === 0) return null;

                                return (
                                    <section key={section.title}>
                                        <h2 className="text-sm font-bold text-muted-foreground mb-3">{section.title}</h2>
                                        <SidebarMenu>
                                            {filteredLinks.map((link) => (
                                                <SidebarMenuItem key={link.href}>
                                                    <Link 
                                                    href={link.href} 
                                                    passHref
                                                    onClick={(e) => handleLinkClick(e, link)}
                                                    target={link.isExternal ? "_blank" : undefined}
                                                    rel={link.isExternal ? "noopener noreferrer" : undefined}
                                                    >
                                                        <SidebarMenuButton isActive={pathname === link.href}>
                                                            <link.icon size={20}/>
                                                            <span className="flex-1">{link.label}</span>
                                                             {link.comingSoon && <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-200 text-yellow-800 font-bold">Soon</span>}
                                                        </SidebarMenuButton>
                                                    </Link>
                                                </SidebarMenuItem>
                                            ))}
                                        </SidebarMenu>
                                    </section>
                                )
                            })}
                            </div>
                            
                            <div className="mt-auto text-center text-xs text-muted-foreground border-t pt-4">
                                Sutradhaar <br /> Made by Aman Yadav
                                <div className="flex justify-center mt-3">
                                {isLoggedIn ? (
                                    <button onClick={() => setShowLogoutDialog(true)} className="flex items-center gap-1 text-red-500 text-sm hover:underline">
                                        <LogOut size={16} /> Logout
                                    </button>
                                ) : (
                                     <button onClick={() => router.push('/welcome')} className="flex items-center gap-1 text-primary text-sm hover:underline">
                                        <LogIn size={16} /> Login
                                    </button>
                                )}
                                </div>
                            </div>
                        </SidebarContent>
                    </Sidebar>
                </SidebarProvider>
            )}
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
          <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                        You will be returned to the login screen.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
                        Log Out
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
           </AlertDialog>
            <AlertDialog open={showComingSoonDialog} onOpenChange={setShowComingSoonDialog}>
              <AlertDialogContent>
                <AlertDialogHeader className="items-center text-center">
                   {comingSoonFeature?.icon && (
                        <div className="p-3 bg-primary/10 rounded-full mb-4">
                            <comingSoonFeature.icon className="w-8 h-8 text-primary" />
                        </div>
                   )}
                  <AlertDialogTitle>{comingSoonFeature?.title} is Coming Soon!</AlertDialogTitle>
                  <AlertDialogDescription>
                    {comingSoonFeature?.description}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction onClick={() => setShowComingSoonDialog(false)}>Got it!</AlertDialogAction>
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
