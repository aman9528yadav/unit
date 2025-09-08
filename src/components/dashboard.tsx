

"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from 'next/link';
import { motion, useSpring, useInView } from "framer-motion";
import {
  Calculator,
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
  User,
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
  Newspaper,
  Rocket,
  Lightbulb,
  Beaker,
  BookOpen,
  Globe2,
  Bug,
  Shield,
  AlertTriangle
} from "lucide-react";
import * as LucideIcons from 'lucide-react';
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Notifications } from "./notifications";
import { useLanguage } from "@/context/language-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { AboutCard } from "./about-card";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { DailyActivity, processUserDataForStats } from "@/lib/stats";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, intervalToDuration, isPast } from "date-fns";
import { listenToNextUpdateInfo, NextUpdateInfo, listenToUserData, listenToUpdatesFromRtdb, UpdateItem, listenToDashboardWelcomeMessage, setDashboardWelcomeMessage, BetaWelcomeMessage, listenToBetaWelcomeMessage } from "@/services/firestore";
import { getStreakData, recordVisit, StreakData } from "@/lib/streak";


const ToolButton = ({ icon: Icon, label, href, color, target, onClick, comingSoon = false }: any) => {
    const content = (
        <motion.div
            className={cn(
                "group aspect-square rounded-xl border border-border bg-card hover:bg-secondary transition-all p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center",
                comingSoon && "opacity-60 cursor-not-allowed"
            )}
            whileHover={{ scale: comingSoon ? 1 : 1.05 }}
            whileTap={{ scale: comingSoon ? 1 : 0.95 }}
        >
            {comingSoon && <Badge variant="secondary" className="absolute top-2 right-2">Soon</Badge>}
            <div className={cn("size-12 grid place-items-center rounded-full bg-secondary", color)}>
                <Icon className="size-6" />
            </div>
            <p className="font-semibold text-foreground text-sm">{label}</p>
        </motion.div>
    );

    const isInternalLink = href && href.startsWith('/');

    if (onClick) {
        return <div onClick={onClick} className="cursor-pointer">{content}</div>;
    }

    if (isInternalLink) {
        return <Link href={href}>{content}</Link>;
    }

    if (href) {
        return (
            <a href={href} target={target || '_blank'} rel="noopener noreferrer">
                {content}
            </a>
        );
    }
    
    return <div className="cursor-pointer">{content}</div>;
};


const UpdateCard = ({ update }: { update: UpdateItem }) => {
    const Icon = (LucideIcons as any)[update.icon] || Rocket;
    return (
        <Card className="bg-card border-border shadow-sm hover:bg-secondary transition-colors w-[240px] flex-shrink-0 flex flex-col p-4">
          <div className="flex items-start gap-3 flex-1">
              <div 
                className="size-10 grid place-items-center rounded-lg"
                style={{ backgroundColor: update.bgColor, color: update.textColor }}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex-1">
                  <p className="font-semibold text-foreground">{update.title}</p>
              </div>
          </div>
          <p className="text-xs text-muted-foreground pt-2 line-clamp-2">
              {update.description}
          </p>
        </Card>
    );
};


const HowToUseCard = ({ icon: Icon, title, description, href }: any) => (
  <Link href={href}>
    <motion.div
      className="bg-card p-4 rounded-lg border border-border flex items-start gap-4 hover:bg-secondary transition-colors cursor-pointer"
      whileHover={{ y: -2 }}
    >
      <div className="p-3 bg-primary/10 rounded-full text-primary">
        <Icon className="size-6" />
      </div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  </Link>
);


interface UserProfile {
    fullName: string;
    email: string;
    profileImage?: string;
    [key: string]: any;
}


const CountdownBox = ({ value, label }: { value: number; label: string }) => (
    <div className="bg-primary/10 p-3 rounded-lg text-primary text-center">
        <p className="text-2xl font-bold">{String(value).padStart(2, '0')}</p>
        <p className="text-xs text-primary/80">{label}</p>
    </div>
);

const categoryIcons: { [key: string]: React.ElementType } = {
  "New Feature": Rocket,
  "Bug Fix": Bug,
  "Improvement": Beaker,
  "Security": Shield,
  "Face Issue": AlertTriangle,
};

function UpdateBanner() {
    const [updateInfo, setUpdateInfo] = useState<NextUpdateInfo | null>(null);
    const [timeLeft, setTimeLeft] = useState<Duration | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        const unsubscribe = listenToNextUpdateInfo((info) => {
            setUpdateInfo(info);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!updateInfo?.targetDate) {
            setTimeLeft(null);
            return;
        }

        const targetDate = new Date(updateInfo.targetDate);
        if (isPast(targetDate)) {
             setTimeLeft(null);
             return;
        }

        const timer = setInterval(() => {
            const now = new Date();
            if (targetDate > now) {
                setTimeLeft(intervalToDuration({ start: now, end: targetDate }));
            } else {
                setTimeLeft(null);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [updateInfo?.targetDate]);

    if (!updateInfo?.showOnDashboard) {
        return null;
    }
    
    const Icon = categoryIcons[updateInfo.category || ''] || Rocket;
    const categoryTitle = updateInfo.category === 'Custom' ? updateInfo.customCategoryTitle : updateInfo.category;

    if (updateInfo.targetDate && isPast(new Date(updateInfo.targetDate))) {
        return (
             <Card className="bg-green-50 border-green-200 text-green-800">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="text-green-600"/> Update is Live!</CardTitle>
                    <Link href="/updates">
                        <Button variant="ghost" size="sm" className="text-green-800 hover:bg-green-100">
                            See What's New <ArrowRight className="ml-2 h-4 w-4"/>
                        </Button>
                    </Link>
                </CardHeader>
             </Card>
        )
    }

    if (!timeLeft) {
        return null;
    }

    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Timer className="text-primary"/> Next Update In</CardTitle>
                    <Link href="/updates">
                         <Button variant="ghost" size="sm">Details <ArrowRight className="ml-2 h-4 w-4"/></Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 sm:gap-4 justify-center">
                    <CountdownBox value={timeLeft.days ?? 0} label="Days" />
                    <CountdownBox value={timeLeft.hours ?? 0} label="Hours" />
                    <CountdownBox value={timeLeft.minutes ?? 0} label="Minutes" />
                    <CountdownBox value={timeLeft.seconds ?? 0} label="Seconds" />
                </div>
                 {categoryTitle && (
                    <div className="mt-4 flex justify-center">
                       <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground p-2 px-4 rounded-full text-sm font-medium">
                          <Icon className="w-5 h-5 text-primary" />
                          <span>{categoryTitle}</span>
                       </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const StatCard = ({ title, value, unit, icon: Icon, color }: { title: string, value: string | number, unit?: string, icon: React.ElementType, color: string }) => (
    <div className="bg-card rounded-xl p-4 flex items-center gap-4 shadow-sm border border-border">
        <div className={cn("size-10 grid place-items-center rounded-lg", color)}>
            <Icon className="size-5" />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-bold text-lg text-foreground">
                {value} {unit && <span className="text-sm font-medium">{unit}</span>}
            </p>
        </div>
    </div>
);


export function Dashboard() {
  const { t } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [featureDialogContent, setFeatureDialogContent] = useState({ title: '', description: '' });
  const router = useRouter();

  const [stats, setStats] = useState<{
      todaysOps: number;
      totalOps: number;
      savedNotes: number;
      activity: DailyActivity[];
  }>({
      todaysOps: 0,
      totalOps: 0,
      savedNotes: 0,
      activity: [],
  });

  const [streakData, setStreakData] = useState<StreakData>({
      currentStreak: 0,
      bestStreak: 0,
      daysNotOpened: 0,
  });

  const [recentUpdates, setRecentUpdates] = useState<UpdateItem[]>([]);

    useEffect(() => {
        setIsClient(true);
        const storedProfileData = localStorage.getItem("userProfile");
        const userEmail = storedProfileData ? JSON.parse(storedProfileData).email : null;
        
        if(storedProfileData) {
            setProfile(JSON.parse(storedProfileData));
        }
        
        const unsubUpdates = listenToUpdatesFromRtdb((updates) => {
            const sortedUpdates = updates.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecentUpdates(sortedUpdates);
        });

        const unsub = listenToUserData(userEmail, (userData) => {
            const processedStats = processUserDataForStats(userData, userEmail);
            setStats(processedStats);
            
            // Recalculate streak data based on the latest visit history
            getStreakData(userEmail).then(setStreakData);
        });

        // Record visit once on component mount
        recordVisit(userEmail);

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'userProfile' && event.newValue) {
                setProfile(JSON.parse(event.newValue));
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            unsub();
            unsubUpdates();
        }
    }, []);
  
  
  const openFeatureDialog = (title: string, description: string) => {
    setFeatureDialogContent({ title, description });
    setShowFeatureDialog(true);
  };

    const quickTools = [
      { label: t('dashboard.tools.converter'), icon: Sigma, href: "/converter", color: "text-blue-400" },
      { label: t('dashboard.tools.calculator'), icon: Calculator, href: "/calculator", color: "text-orange-400" },
      { label: t('dashboard.tools.notes'), icon: NotebookPen, href: "/notes", color: "text-yellow-400" },
      { label: 'Translator', icon: Globe2, href: "/translator", color: 'text-purple-400' },
      { label: t('dashboard.tools.history'), icon: History, href: "/history", color: "text-blue-400" },
      { label: 'News & Updates', icon: Newspaper, href: "/news", color: 'text-green-400' },
    ];
    
    const moreTools = [
        { label: t('dashboard.tools.favorites'), icon: Star, href: '/history?tab=favorites', color: 'text-yellow-500' },
        { label: t('dashboard.tools.dateCalc'), icon: Calendar, href: "/time?tab=date-diff", color: "text-green-400" },
        { label: t('dashboard.tools.timer'), icon: Timer, href: '/time?tab=timer', color: 'text-red-500' },
        { label: t('dashboard.tools.stopwatch'), icon: Hourglass, href: '/time?tab=stopwatch', color: 'text-indigo-500' },
        { label: t('dashboard.tools.settings'), icon: Settings, href: "/settings", color: "text-gray-400" },
    ];
    
    const comingSoonTools = [
        { label: 'AI Smart Search', icon: Wand2, onClick: () => openFeatureDialog("AI Smart Search (Coming Soon)", "A powerful new search experience that understands natural language to find notes, perform conversions, and navigate the app faster than ever."), color: 'text-indigo-400', comingSoon: true },
    ];

    const allTools = [...quickTools, ...moreTools];
    const toolsToShow = showMoreTools ? allTools : allTools.slice(0, 6);


    const howToUseItems = [
      {
        icon: Search,
        title: "Smart Search",
        description: "Type conversions like '10kg to lbs' directly.",
        href: "/how-to-use"
      },
      {
        icon: Beaker,
        title: "Custom Units",
        description: "Add your own units for specialized tasks.",
        href: "/how-to-use"
      },
      {
        icon: Timer,
        title: "Time Utilities",
        description: "Use the Pomodoro timer, stopwatch, and more.",
        href: "/how-to-use"
      },
    ];
    
    const chartConfig = {
      conversions: {
        label: "Conversions",
        color: "hsl(var(--chart-1))",
      },
      calculations: {
        label: "Calculator Ops",
        color: "hsl(var(--chart-2))",
      },
      dateCalculations: {
        label: "Date Calcs",
        color: "hsl(var(--chart-3))",
      },
    };

    const formattedChartData = (stats.activity || []).map(item => ({
        ...item,
        date: format(new Date(item.date), "EEE")
    }))

  if (!isClient) {
    return null;
  }

  return (
    <motion.div 
        className="w-full max-w-lg mx-auto flex flex-col gap-8 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
    >
        
      <UpdateBanner />

      <section>
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Statistics</h2>
              <Button asChild variant="link" className="gap-1 text-primary hover:text-primary/90">
                    <Link href="/analytics">View Analytics <ArrowRight className="size-4" /></Link>
                </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <StatCard title={t('dashboard.todayOps')} value={stats.todaysOps} icon={TrendingUp} color="text-green-500 bg-green-500/10" />
             <StatCard title={t('dashboard.currentStreak')} value={streakData.currentStreak} icon={Flame} color="text-orange-500 bg-orange-500/10" unit={t('dashboard.days')} />
             <StatCard title={t('dashboard.savedNotes')} value={stats.savedNotes} icon={NotebookPen} color="text-yellow-500 bg-yellow-500/10" />
             <StatCard title={t('dashboard.allTimeOps')} value={stats.totalOps} icon={BarChart3} color="text-blue-500 bg-blue-500/10" />
          </div>
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
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Coming Soon</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {comingSoonTools.map((tool) => (
                <ToolButton key={tool.label} {...tool} />
            ))}
          </div>
      </section>
      
      <section>
         <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle>Weekly Report</CardTitle>
                    <CardDescription>Your activity over the last 7 days.</CardDescription>
                </div>
                <Button asChild variant="outline" size="sm">
                    <Link href="/analytics">View Analytics</Link>
                </Button>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="h-48 w-full">
                    <BarChart data={formattedChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                       <CartesianGrid vertical={false} strokeDasharray="3 3"/>
                       <XAxis dataKey="date" tickLine={false} axisLine={false} />
                       <YAxis tickLine={false} axisLine={false} />
                       <ChartTooltip 
                        content={<ChartTooltipContent />}
                       />
                       <Bar dataKey="conversions" fill="var(--color-conversions)" radius={4} stackId="a" />
                       <Bar dataKey="calculations" fill="var(--color-calculations)" radius={4} stackId="a" />
                       <Bar dataKey="dateCalculations" fill="var(--color-dateCalculations)" radius={4} stackId="a" />
                    </BarChart>
                </ChartContainer>
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
                    <UpdateCard key={update.id} update={update} />
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Discover Sutradhaar</h2>
           <Button asChild variant="link" className="gap-1 text-primary hover:text-primary/90">
              <Link href="/how-to-use">
                  {t('dashboard.seeAll')} <ArrowRight className="size-4" />
              </Link>
          </Button>
        </div>
        <div className="space-y-3">
          {howToUseItems.map((item) => (
            <HowToUseCard key={item.title} {...item} />
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
    
      
      <AlertDialog open={showFeatureDialog} onOpenChange={setShowFeatureDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4 w-fit">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-2xl">{featureDialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription className="max-w-xs">
              {featureDialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowFeatureDialog(false)}>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    <section>
        <AboutCard />
      </section>
    </motion.div>
  );
}
