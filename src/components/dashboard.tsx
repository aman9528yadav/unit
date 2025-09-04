
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowRight, Settings, Star, PlayCircle, ClockIcon, User, Search, Bell, Home, StickyNote, CalculatorIcon, Clock, Hourglass, Sparkles, LogIn, Sigma } from "lucide-react";
import { getTodaysCalculations, getWeeklyCalculations } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { recordVisit } from "@/lib/streak";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { Notifications } from "./notifications";
import { GlobalSearchDialog } from "./global-search-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";


// This should match the key in notepad.tsx
const NOTES_STORAGE_KEY_BASE = 'userNotesV2';

interface Note {
    id: string;
    deletedAt?: string | null;
}

interface UserProfile {
    fullName: string;
    email: string;
    profileImage?: string;
    [key: string]: any;
}

const getUserNotesKey = (email: string) => `${email}_${NOTES_STORAGE_KEY_BASE}`;

const getSavedNotesCount = (email: string | null) => {
    if (typeof window === 'undefined') return 0;
    // For guests, use a generic key
    const storageKey = email ? getUserNotesKey(email) : 'guest_userNotesV2';
    const savedNotes = localStorage.getItem(storageKey);
    if (savedNotes) {
        try {
            const notes: Note[] = JSON.parse(savedNotes);
            // Count only notes that are not in the recycle bin
            return notes.filter(note => !note.deletedAt).length;
        } catch (e) {
            console.error("Failed to parse notes from storage", e);
            return 0;
        }
    }
    return 0;
};


export function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayCalculations, setTodayCalculations] = useState(0);
  const [weeklyCalculations, setWeeklyCalculations] = useState<{name: string, value: number}[]>([]);
  const [savedNotesCount, setSavedNotesCount] = useState(0);
  const { t } = useLanguage();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const router = useRouter();


  const updateStats = (email: string | null) => {
    setTodayCalculations(getTodaysCalculations(email));
    setWeeklyCalculations(getWeeklyCalculations(email));
    setSavedNotesCount(getSavedNotesCount(email));
  }

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfile(parsedProfile);
        recordVisit(parsedProfile.email); // Record the visit for streak tracking
        updateStats(parsedProfile.email);
    } else {
        updateStats(null); // For guest users
    }
  }, []);

  // Effect to listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (profile?.email && (e.key === `${profile.email}_dailyCalculations` || e.key === getUserNotesKey(profile.email))) {
            updateStats(profile.email);
        }
        if (e.key === 'userProfile') {
            if (e.newValue) {
                const newProfile = JSON.parse(e.newValue);
                setProfile(newProfile);
                updateStats(newProfile.email);
            } else {
                setProfile(null);
                updateStats(null);
            }
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [profile]);
  
  const handleProfileClick = () => {
    if (profile) {
      router.push('/profile');
    } else {
      setShowLoginDialog(true);
    }
  };


  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <header className="flex justify-between items-center sticky top-0 z-50 bg-background py-4">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.greeting', { name: profile?.fullName || "Guest" })}</h1>
          <p className="text-muted-foreground">{t('dashboard.challenge')}</p>
        </div>
        <div className="flex items-center gap-2">
            {profile && <GlobalSearchDialog />}
            {profile && <Notifications />}
             <Button variant="ghost" size="icon" className="rounded-full" onClick={handleProfileClick}>
                <Avatar>
                    <AvatarImage src={profile?.profileImage} alt={profile?.fullName} />
                    <AvatarFallback>
                        <User />
                    </AvatarFallback>
                </Avatar>
              </Button>
        </div>
      </header>
      
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card p-4 rounded-2xl col-span-1 flex flex-col items-center justify-center text-center">
             <CalculatorIcon className="w-8 h-8 text-accent mb-2"/>
             <p className="text-3xl font-bold">{String(todayCalculations).padStart(2, '0')}</p>
             <p className="text-sm text-muted-foreground mt-1">{t('dashboard.todayCalculation')}</p>
        </Card>
         <Card className="bg-card p-4 rounded-2xl col-span-1 flex flex-col items-center justify-center text-center">
            <StickyNote className="w-8 h-8 text-primary mb-2"/>
            <p className="text-3xl font-bold">{String(savedNotesCount).padStart(2, '0')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('dashboard.savedNotes')}</p>
        </Card>
      </div>

      <Card className="bg-card p-0 rounded-2xl">
          <CardHeader>
            <CardTitle>Quick Access</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
             <div className="grid grid-cols-3 gap-3 text-center">
                <Link href="/converter" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    <div className="p-2 bg-primary/20 rounded-full"><Sigma className="text-primary"/></div>
                    <p className="font-semibold text-sm">Converter</p>
                </Link>
                 <Link href="/converter?tab=Calculator" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    <div className="p-2 bg-orange-500/10 rounded-full"><CalculatorIcon className="text-orange-500"/></div>
                    <p className="font-semibold text-sm">Calculator</p>
                </Link>
                <Link href="/notes" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    <div className="p-2 bg-accent/20 rounded-full"><StickyNote className="text-accent"/></div>
                    <p className="font-semibold text-sm">{t('nav.notes')}</p>
                </Link>
                <Link href="/history" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    <div className="p-2 bg-blue-500/10 rounded-full"><Clock className="text-blue-500"/></div>
                    <p className="font-semibold text-sm">{t('nav.history')}</p>
                </Link>
                <Link href="/time" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                     <div className="p-2 bg-green-500/10 rounded-full"><Hourglass className="text-green-500"/></div>
                     <p className="font-semibold text-sm">Time Tools</p>
                </Link>
                {profile && (
                 <Link href="/settings" className="flex flex-col items-center gap-2 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                     <div className="p-2 bg-gray-500/10 rounded-full"><Settings className="text-gray-500"/></div>
                     <p className="font-semibold text-sm">Settings</p>
                 </Link>
                )}
              </div>
          </CardContent>
      </Card>

        
        <Card className="bg-card p-4 rounded-2xl">
            <h3 className="font-semibold mb-2 text-center">{t('dashboard.calculation')}</h3>
             <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyCalculations} margin={{ top: 5, right: 0, left: -30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                                color: 'hsl(var(--foreground))',
                                borderRadius: 'var(--radius)',
                            }}
                            cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

      <div>
        <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-lg">{t('dashboard.recommendations')}</h2>
            <Link href="/help" className="text-sm text-accent flex items-center gap-1">
                {t('dashboard.seeAll')} <ArrowRight size={16} />
            </Link>
        </div>
        <div className="grid grid-cols-1 gap-4">
            <Link href="/help">
                <Card className="bg-card border-none overflow-hidden h-full flex items-center">
                    <div className="relative w-1/3">
                        <Image src="https://picsum.photos/200/200" alt="Smart Search" width={200} height={200} className="w-full h-28 object-cover" data-ai-hint="digital analytics" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <PlayCircle size={32} className="text-white/80" />
                        </div>
                    </div>
                    <CardContent className="p-3 w-2/3">
                        <h3 className="font-bold text-sm">{t('dashboard.smartSearch')}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">Learn how to use the AI-powered search for instant conversions.</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1"><ClockIcon size={14} /> 05 {t('dashboard.minutes')}</span>
                            <span className="flex items-center gap-1"><User size={14} /> Aman</span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
            <Link href="/help">
                <Card className="bg-card border-none overflow-hidden h-full flex items-center">
                     <div className="relative w-1/3">
                        <Image src="https://picsum.photos/201/200" alt="How to use Smart Calc" width={201} height={200} className="w-full h-28 object-cover" data-ai-hint="financial calculator" />
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <PlayCircle size={32} className="text-white/80" />
                        </div>
                    </div>
                    <CardContent className="p-3 w-2/3">
                        <h3 className="font-bold text-sm">{t('dashboard.howToUseCalc')}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">Discover the advanced functions of the scientific calculator.</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                            <span className="flex items-center gap-1"><ClockIcon size={14} /> 15 {t('dashboard.minutes')}</span>
                            <span className="flex items-center gap-1"><User size={14} /> Aman</span>
                        </div>
                    </CardContent>
                </Card>
            </Link>
        </div>
      </div>
      
       <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4 w-fit">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-2xl">Unlock Your Profile</AlertDialogTitle>
            <AlertDialogDescription className="max-w-xs">
              Log in or create an account to personalize your experience, save preferences, and access your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-col-reverse gap-2">
            <AlertDialogCancel>Not Now</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/welcome')} className="bg-primary hover:bg-primary/90">
              <LogIn className="mr-2"/>
              Continue to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    