

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
  Rocket
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "./global-search";
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
import { format, intervalToDuration } from "date-fns";
import { listenToNextUpdateInfo, NextUpdateInfo, listenToUserData } from "@/services/firestore";
import { getStreakData, recordVisit, StreakData } from "@/lib/streak";


const ToolButton = ({ icon: Icon, label, href, color, target, onClick }: any) => {
    const content = (
        <motion.div 
            className="group aspect-square rounded-xl border border-border bg-card hover:bg-secondary transition-all p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
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


const UpdateCard = ({ update }: any) => (
    <Card className="bg-card border-border shadow-sm hover:bg-secondary transition-colors w-[240px] flex-shrink-0 flex flex-col p-4">
      <div className="flex items-start gap-3 flex-1">
          <div className={cn("size-10 grid place-items-center rounded-lg", update.bgColor, update.color)}>
            <update.icon className="size-5" />
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


const RecommendationCard = ({ item }: any) => (
  <motion.div whileHover={{ y: -2 }} className="min-w-[280px] max-w-[300px] rounded-xl overflow-hidden border border-border bg-card">
    <div className="relative h-36">
      <Image src={item.img} alt={item.title} layout="fill" objectFit="cover" data-ai-hint={item.dataAiHint} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
      <Button asChild size="icon" className="absolute bottom-3 left-3 rounded-full shadow-xl bg-primary hover:bg-primary/90">
         <Link href="/how-to-use">
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

const Header = ({ name, onProfileClick, profileImage }: { name: string, onProfileClick: () => void, profileImage?: string }) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [welcomeMessage, setWelcomeMessage] = useState(t('dashboard.welcome'));

  useEffect(() => {
    const timer = setTimeout(() => {
      setWelcomeMessage(t('dashboard.dynamicWelcome'));
    }, 120000); // 2 minutes in milliseconds

    return () => clearTimeout(timer);
  }, [t]);
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('dashboard.greeting', { name: name })}</h1>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-green-500" />
                {welcomeMessage}
            </div>
        </div>
        <div className="flex items-center gap-2">
            <LanguageToggle />
            <Notifications />
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onProfileClick}>
                <Avatar className="h-10 w-10 border border-border bg-card text-foreground">
                    <AvatarImage src={profileImage}/>
                    <AvatarFallback><User /></AvatarFallback>
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

function AnimatedStat({ value }: { value: number }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });
  const spring = useSpring(0, {
    damping: 30, // Slower, less bouncy
    stiffness: 80, // Less stiff
  });

  useEffect(() => {
    if (isInView) {
      spring.set(value);
    }
  }, [isInView, value, spring]);

  useEffect(() => {
    // Animate on value change as well
    spring.set(value);
  }, [value, spring]);


  const displayValue = useSpring(spring, {
    damping: 30,
    stiffness: 80,
  });

  useEffect(() => {
    const unsubscribe = displayValue.on("change", (latest) => {
      if (ref.current) {
        (ref.current as any).textContent = Math.round(latest).toLocaleString();
      }
    });
    return () => unsubscribe();
  }, [displayValue]);

  return <p ref={ref} className="font-semibold text-lg">0</p>;
}

const StatCard = ({ title, value, icon: Icon, color, unit }: { title: string, value: number, icon: React.ElementType, color?: string, unit?: string }) => (
    <Card className="flex flex-col p-4 bg-card border-border shadow-sm">
        <div className="flex items-center gap-2">
            <div className={cn("size-8 grid place-items-center rounded-lg", color)}>
                <Icon className="size-5" />
            </div>
             <div className="flex items-baseline gap-1">
                <AnimatedStat value={value} />
                {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
             </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">{title}</p>
    </Card>
);

const CountdownBox = ({ value, label }: { value: number; label: string }) => (
    <div className="bg-primary/10 p-3 rounded-lg text-primary text-center">
        <p className="text-2xl font-bold">{String(value).padStart(2, '0')}</p>
        <p className="text-xs text-primary/80">{label}</p>
    </div>
);


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

    if (!updateInfo?.showOnDashboard || !timeLeft) {
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
            </CardContent>
        </Card>
    );
}


export function Dashboard() {
  const { t } = useLanguage();
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showBetaDialog, setShowBetaDialog] = useState(false);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
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

    useEffect(() => {
        setIsClient(true);
        const storedProfileData = localStorage.getItem("userProfile");
        const userEmail = storedProfileData ? JSON.parse(storedProfileData).email : null;
        
        if(storedProfileData) {
            setProfile(JSON.parse(storedProfileData));
        }

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
        
        const hasSeenDialog = localStorage.getItem('hasSeenBetaDialog');
        if (!hasSeenDialog) {
            setShowBetaDialog(true);
        }
        
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            unsub();
        }
    }, []);
  
  const handleProfileClick = () => {
    if (profile) {
      router.push('/profile');
    } else {
      setShowLoginDialog(true);
    }
  };
  
  const handleBetaDialogClose = () => {
      if (doNotShowAgain) {
          localStorage.setItem('hasSeenBetaDialog', 'true');
      }
      setShowBetaDialog(false);
  };

  const openFeatureDialog = (title: string, description: string) => {
    setFeatureDialogContent({ title, description });
    setShowFeatureDialog(true);
  };

    const quickTools = [
      { label: t('dashboard.tools.converter'), icon: Sigma, href: "/converter", color: "text-blue-400" },
      { label: t('dashboard.tools.calculator'), icon: Calculator, href: "/calculator", color: "text-orange-400" },
      { label: t('dashboard.tools.notes'), icon: NotebookPen, href: "/notes", color: "text-yellow-400" },
      { label: t('dashboard.tools.history'), icon: History, href: "/history", color: "text-blue-400" },
      { label: 'News & Updates', icon: Newspaper, href: "/news", color: 'text-green-400' },
      { label: 'AI Search', icon: Wand2, onClick: () => openFeatureDialog("AI Smart Search (Coming Soon)", "A powerful new search experience that understands natural language to find notes, perform conversions, and navigate the app faster than ever."), color: 'text-indigo-400' },
    ];
    
    const moreTools = [
        { label: t('dashboard.tools.favorites'), icon: Star, href: '/history?tab=favorites', color: 'text-yellow-500' },
        { label: t('dashboard.tools.dateCalc'), icon: Calendar, href: "/time?tab=date-diff", color: "text-green-400" },
        { label: t('dashboard.tools.timer'), icon: Timer, href: '/time?tab=timer', color: 'text-red-500' },
        { label: t('dashboard.tools.stopwatch'), icon: Hourglass, href: '/time?tab=stopwatch', color: 'text-indigo-500' },
        { label: t('dashboard.tools.settings'), icon: Settings, href: "/settings", color: "text-gray-400" },
    ];

    const allTools = [...quickTools, ...moreTools];
    const toolsToShow = showMoreTools ? allTools : allTools.slice(0, 6);


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
        title: t('updates.items.appearance.title'),
        description: t('updates.items.appearance.description'),
        href: "/updates",
        color: "text-pink-400",
        bgColor: "bg-pink-500/10"
      },
      {
        icon: Zap,
        title: t('updates.items.timeTools.title'),
        description: t('updates.items.timeTools.description'),
        href: "/updates",
        color: "text-green-400",
        bgColor: "bg-green-500/10"
      },
      {
        icon: Gift,
        title: t('updates.items.customUnits.title'),
        description: t('updates.items.customUnits.description'),
        href: "/updates",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10"
      },
      {
        icon: Wand2,
        title: t('updates.items.smartSearch.title'),
        description: t('updates.items.smartSearch.description'),
        href: "/updates",
        color: "text-indigo-400",
        bgColor: "bg-indigo-500/10"
      },
       {
        icon: Languages,
        title: t('updates.items.languageSupport.title'),
        description: t('updates.items.languageSupport.description'),
        href: "/updates",
        color: "text-teal-400",
        bgColor: "bg-teal-500/10"
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
      <Header name={profile?.fullName || t('dashboard.guest')} onProfileClick={handleProfileClick} profileImage={profile?.profileImage} />
      
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
        <div className="overflow-hidden">
             <div className="flex gap-4 overflow-x-auto pb-4 -mb-4 -mx-4 px-4">
              {recommendations.map((r) => (
                <RecommendationCard key={r.id} item={r} />
              ))}
            </div>
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
    
    <AlertDialog open={showBetaDialog} onOpenChange={setShowBetaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center text-center">
            <motion.div 
                className="p-3 bg-primary/10 rounded-full mb-4 w-fit"
                animate={{ rotate: [0, -15, 15, -15, 15, 0], y: [0, -10, 0] }}
                transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 2 }}
            >
              <Rocket className="w-8 h-8 text-primary" />
            </motion.div>
            <AlertDialogTitle className="text-2xl">Welcome to Sutradhaar Beta!</AlertDialogTitle>
            <AlertDialogDescription className="max-w-md whitespace-pre-wrap text-center">
              Thank you for trying out the beta version. The app is currently in Phase 1 of testing. If you encounter any issues or have feedback, please don't hesitate to contact me. I apologize for any inconvenience.
              <br/><br/>
              - Aman
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center space-x-2 my-4 justify-center">
            <Checkbox id="dont-show-again" checked={doNotShowAgain} onCheckedChange={(checked) => setDoNotShowAgain(checked as boolean)} />
            <Label htmlFor="dont-show-again" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Don't show this message again
            </Label>
          </div>
          <AlertDialogFooter className="flex-col-reverse sm:flex-col-reverse gap-2">
            <AlertDialogAction onClick={handleBetaDialogClose}>Got it!</AlertDialogAction>
            <Button asChild variant="outline">
                <Link href="/about">About App</Link>
            </Button>
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

    