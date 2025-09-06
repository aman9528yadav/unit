
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from 'next/link';
import { motion } from "framer-motion";
import {
  Calculator,
  Clock3,
  History,
  NotebookPen,
  Wand2,
  LayoutGrid,
  Search,
  ArrowRight,
  PlayCircle,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Moon,
  Sun,
  UserCircle2,
  Settings,
  Languages,
  Sigma,
  Hourglass,
  Flame,
  Sparkles,
  LogIn,
  Gift,
  Zap,
  Palette,
  Calendar,
  Star,
  Timer,
  ChevronDown,
  Info,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/context/theme-context";
import { getTodaysCalculations, getWeeklyCalculations, getAllTimeCalculations } from "@/lib/utils";
import { getStreakData, type StreakData } from "@/lib/streak";
import { GlobalSearch } from "./global-search";
import { Notifications } from "./notifications";
import { useLanguage } from "@/context/language-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { AboutCard } from "./about-card";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";


interface Note {
    id: string;
    deletedAt?: string | null;
}

const NOTES_STORAGE_KEY_BASE = 'userNotesV2';
const getUserNotesKey = (email: string | null) => email ? `${email}_${NOTES_STORAGE_KEY_BASE}` : 'guest_userNotesV2';

const getSavedNotesCount = (email: string | null) => {
    if (typeof window === 'undefined') return 0;
    const storageKey = getUserNotesKey(email);
    const savedNotes = localStorage.getItem(storageKey);
    if (savedNotes) {
        try {
            const notes: Note[] = JSON.parse(savedNotes);
            return notes.filter(note => !note.deletedAt).length;
        } catch (e) {
            console.error("Failed to parse notes from storage", e);
            return 0;
        }
    }
    return 0;
};

const Stat = ({ icon: Icon, label, value, trend }: any) => (
  <Card className="bg-card border-border shadow-sm">
    <CardContent className="p-4">
      <div className="flex items-center gap-3">
        <div className="size-10 grid place-items-center rounded-lg bg-secondary text-primary">
          <Icon className="size-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-semibold text-foreground">{value}</p>
            {trend && (
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                <TrendingUp className="mr-1 size-3" /> {trend}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const ToolButton = ({ icon: Icon, label, href, color }: any) => (
    <Link href={href} className="group aspect-square rounded-xl border border-border bg-card hover:bg-secondary transition-all p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center">
        <div className={cn("size-12 grid place-items-center rounded-full bg-secondary", color)}>
            <Icon className="size-6" />
        </div>
        <p className="font-semibold text-foreground text-sm">{label}</p>
    </Link>
);

const UpdateCard = ({ update }: any) => (
    <Card className="bg-card border-border shadow-sm hover:bg-secondary transition-colors h-full w-[240px] flex-shrink-0">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
            <div className={cn("size-10 grid place-items-center rounded-lg", update.bgColor, update.color)}>
              <update.icon className="size-5" />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-foreground">{update.title}</p>
                <p className="text-xs text-muted-foreground">{update.description}</p>
            </div>
        </div>
      </CardContent>
    </Card>
);


const RecommendationCard = ({ item }: any) => (
  <motion.div whileHover={{ y: -2 }} className="min-w-[280px] max-w-[300px] rounded-xl overflow-hidden border border-border bg-card">
    <div className="relative h-36">
      <Image src={item.img} alt={item.title} layout="fill" objectFit="cover" data-ai-hint={item.dataAiHint} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <Button asChild size="icon" className="absolute bottom-3 left-3 rounded-full shadow-xl bg-primary hover:bg-primary/90">
         <Link href="/help">
            <PlayCircle className="size-5 text-primary-foreground" />
         </Link>
      </Button>
    </div>
    <div className="p-4">
      <p className="font-medium leading-tight text-foreground">{item.title}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {item.minutes} {item.minutesLabel} • {item.by}
      </p>
    </div>
  </motion.div>
);

interface UserProfile {
    fullName: string;
    email: string;
    profileImage?: string;
    [key: string]: any;
}

const Header = ({ name, profile, onProfileClick }: { name: string, profile: UserProfile | null, onProfileClick: () => void }) => {
  const router = useRouter();
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('dashboard.greeting', { name: name })}</h1>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-green-500" />
                {t('dashboard.welcome')}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <LanguageToggle />
            <Notifications />
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onProfileClick}>
                <Avatar className="h-10 w-10 border border-border bg-card text-foreground">
                <AvatarImage src={profile?.profileImage} alt={profile?.fullName} />
                <AvatarFallback><UserCircle2 className="size-6" /></AvatarFallback>
                </Avatar>
            </Button>
        </div>
      </div>
       <div>
           <GlobalSearch />
        </div>
    </div>
  );
};

const LanguageToggle = () => {
    const { language, setLanguage } = useLanguage();
    return (
        <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'hi')}>
            <SelectTrigger className="w-[120px] bg-card border-border">
                <Languages className="mr-2 h-4 w-4" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
        </Select>
    );
};

const ThemeToggle = ({ isDark, onChange }: { isDark: boolean; onChange: (isDark: boolean) => void }) => (
  <div className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card">
    <Sun className="size-4 text-yellow-400" />
    <Switch checked={isDark} onCheckedChange={onChange} />
    <Moon className="size-4 text-cyan-400" />
  </div>
);

export function Dashboard() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayCalculations, setTodayCalculations] = useState(0);
  const [allTimeCalculations, setAllTimeCalculations] = useState(0);
  const [weeklyCalculations, setWeeklyCalculations] = useState<{name: string; value: number}[]>([]);
  const [savedNotesCount, setSavedNotesCount] = useState(0);
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, bestStreak: 0, daysNotOpened: 0 });
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const router = useRouter();


  const updateStats = (email: string | null) => {
    setTodayCalculations(getTodaysCalculations(email));
    setWeeklyCalculations(getWeeklyCalculations(email));
    setSavedNotesCount(getSavedNotesCount(email));
    setAllTimeCalculations(getAllTimeCalculations(email));
    setStreakData(getStreakData(email));
  }

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    const userEmail = storedProfile ? JSON.parse(storedProfile).email : null;
    setProfile(storedProfile ? JSON.parse(storedProfile) : null);
    updateStats(userEmail);

    const handleStorageChange = (e: StorageEvent) => {
        // If calculation history or notes change, update stats
        if (e.key?.includes('dailyCalculations') || e.key?.includes('userNotesV2') || e.key?.includes('userVisitHistory')) {
            updateStats(userEmail);
        }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, []);
  
  const handleThemeChange = (isDark: boolean) => {
      setTheme(isDark ? 'dark' : 'light');
  }

  const handleProfileClick = () => {
    if (profile) {
      router.push('/userdata');
    } else {
      setShowLoginDialog(true);
    }
  };
  
    const quickTools = [
      { label: t('dashboard.tools.converter'), icon: Sigma, href: "/converter", color: "text-blue-400" },
      { label: t('dashboard.tools.calculator'), icon: Calculator, href: "/calculator", color: "text-orange-400" },
      { label: t('dashboard.tools.notes'), icon: NotebookPen, href: "/notes", color: "text-yellow-400" },
      { label: t('dashboard.tools.history'), icon: History, href: "/history", color: "text-blue-400" },
      { label: t('dashboard.tools.settings'), icon: Settings, href: "/settings", color: "text-gray-400" },
    ];
    
    const moreTools = [
        { label: t('dashboard.tools.favorites'), icon: Star, href: '/history?tab=favorites', color: 'text-yellow-500' },
        { label: t('dashboard.tools.dateCalc'), icon: Calendar, href: "/time?tab=date-diff", color: "text-green-400" },
        { label: t('dashboard.tools.timer'), icon: Timer, href: '/time?tab=timer', color: 'text-red-500' },
        { label: t('dashboard.tools.stopwatch'), icon: Hourglass, href: '/time?tab=stopwatch', color: 'text-indigo-500' },
    ];

    const toolsToShow = showMoreTools ? [...quickTools, ...moreTools] : quickTools;

    const recommendations = [
      {
        id: 1,
        title: t('dashboard.recommendations.smartSearch.title'),
        minutes: 5,
        minutesLabel: t('dashboard.minutes'),
        by: "Aman",
        img: "https://picsum.photos/seed/tech1/400/200",
        dataAiHint: "digital analytics"
      },
      {
        id: 2,
        title: t('dashboard.recommendations.smartCalc.title'),
        minutes: 15,
        minutesLabel: t('dashboard.minutes'),
        by: "Aman",
        img: "https://picsum.photos/seed/tech2/400/200",
        dataAiHint: "financial calculator"
      },
      {
        id: 3,
        title: t('dashboard.recommendations.proTips.title'),
        minutes: 8,
        minutesLabel: t('dashboard.minutes'),
        by: "Aman",
        img: "https://picsum.photos/seed/tech3/400/200",
        dataAiHint: "team working"
      },
    ];

    const recentUpdates = [
      {
        icon: Palette,
        title: t('dashboard.updates.appearance.title'),
        description: t('dashboard.updates.appearance.description'),
        href: "/updates",
        color: "text-pink-400",
        bgColor: "bg-pink-500/10"
      },
      {
        icon: Zap,
        title: t('dashboard.updates.time.title'),
        description: t('dashboard.updates.time.description'),
        href: "/updates",
        color: "text-green-400",
        bgColor: "bg-green-500/10"
      },
      {
        icon: Gift,
        title: t('dashboard.updates.customUnits.title'),
        description: t('dashboard.updates.customUnits.description'),
        href: "/updates",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10"
      },
    ];

  if (!isClient) {
    return null;
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-8 py-8">
      <Header name={profile?.fullName || t('dashboard.guest')} profile={profile} onProfileClick={handleProfileClick} />

      <section className="grid grid-cols-2 gap-4">
        <Stat icon={Calculator} label={t('dashboard.todayOps')} value={String(todayCalculations)} />
        <Stat icon={Flame} label={t('dashboard.currentStreak')} value={`${streakData.currentStreak} ${t('dashboard.days')}`} />
        <Stat icon={NotebookPen} label={t('dashboard.savedNotes')} value={String(savedNotesCount)} />
        <Stat icon={History} label={t('dashboard.allTimeOps')} value={String(allTimeCalculations)} />
      </section>

      <section>
        <Card className="bg-card border-border shadow-sm">
          <CardHeader>
            <CardTitle>{t('dashboard.quickAccess')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {toolsToShow.map((t) => (
                <ToolButton key={t.label} {...t} />
              ))}
            </div>
             <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setShowMoreTools(!showMoreTools)}
            >
                {showMoreTools ? t('dashboard.showLess') : t('dashboard.showMore')}
                <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", showMoreTools && "rotate-180")} />
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="overflow-hidden rounded-xl bg-card border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-0">
            <div>
              <CardTitle className="text-base text-foreground">{t('dashboard.calculationStats')}</CardTitle>
              <p className="text-xs text-muted-foreground">{t('dashboard.last7Days')}</p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyCalculations} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeOpacity={0.1} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                  <Area type="monotone" dataKey="value" strokeWidth={2} stroke="hsl(var(--primary))" fill="url(#fill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">{t('dashboard.whatsNew')}</h2>
              <Button asChild variant="link" className="gap-1 text-primary hover:text-primary/90">
                  <Link href="/updates">
                      {t('dashboard.seeAll')} <ArrowRight className="size-4" />
                  </Link>
              </Button>
          </div>
          <ScrollArea className="w-full whitespace-nowrap rounded-lg">
            <div className="flex gap-4 pb-4">
                {recentUpdates.map((update) => (
                    <UpdateCard key={update.title} update={update} />
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('dashboard.recommendations.title')}</h2>
           <Button asChild variant="link" className="gap-1 text-primary hover:text-primary/90">
              <Link href="/help">
                  {t('dashboard.seeAll')} <ArrowRight className="size-4" />
              </Link>
          </Button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
          {recommendations.map((r) => (
            <RecommendationCard key={r.id} item={r} />
          ))}
        </div>
      </section>
      
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

    <section>
        <AboutCard />
      </section>
    </div>
  );
}
