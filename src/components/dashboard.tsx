

"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from 'next/link';
import { motion, useSpring, useInView, Reorder } from "framer-motion";
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
  AlertTriangle,
  FileClock,
  BookCopy,
  Receipt,
  GraduationCap,
  Bookmark,
  Clock,
  PieChart,
  Clipboard,
  Layers,
  Bell,
  Menu,
  TrendingDown,
  GripVertical
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
import { DailyActivity, processUserDataForStats, TopFeature } from "@/lib/stats";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { format, intervalToDuration, isPast, parseISO } from "date-fns";
import { listenToNextUpdateInfo, NextUpdateInfo, listenToUserData, listenToUpdatesFromRtdb, UpdateItem, listenToDashboardWelcomeMessage, setDashboardWelcomeMessage, BetaWelcomeMessage, listenToBetaWelcomeMessage, listenToComingSoonItems, ComingSoonItem, defaultComingSoonItems, HowToUseFeature, listenToHowToUseFeaturesFromRtdb, updateUserData } from '@/services/firestore';
import { getStreakData, recordVisit, StreakData } from "@/lib/streak";
import { SidebarTrigger } from "./ui/sidebar";
import { useToast } from "@/hooks/use-toast";


const defaultQuickAccessItems = [
    { id: 'converter', icon: <PieChart size={18} />, label: "Converter", href: "/converter" },
    { id: 'calculator', icon: <Zap size={18} />, label: "Calculator", href: "/calculator" },
    { id: 'notes', icon: <BookOpen size={18} />, label: "Notes", href: "/notes" },
    { id: 'translator', icon: <Layers size={18} />, label: "Translator", href: "/translator" },
    { id: 'history', icon: <Clock size={18} />, label: "History", href: "/history" },
    { id: 'news', icon: <Newspaper size={18} />, label: "News", href: "/news" },
    { id: 'date-calc', icon: <Calendar size={18} />, label: "Date Calc", href: "/time?tab=date-diff" },
    { id: 'favorites', icon: <Star size={18} />, label: "Favorites", href: "/history?tab=favorites" },
    { id: 'help', icon: <Info size={18} />, label: "Help", href: "/how-to-use" },
];

export function Dashboard() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  
  const [stats, setStats] = useState({
    todaysOps: 0,
    totalOps: 0,
    savedNotes: 0,
    activity: [] as DailyActivity[],
    topFeature: 'Converter' as TopFeature
  });
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, bestStreak: 0, daysNotOpened: 0});
  const [comingSoonItems, setComingSoonItems] = useState<ComingSoonItem[]>(defaultComingSoonItems);
  const [whatsNewItems, setWhatsNewItems] = useState<UpdateItem[]>([]);
  const [discoverItems, setDiscoverItems] = useState<HowToUseFeature[]>([]);
  const [quickAccessItems, setQuickAccessItems] = useState(defaultQuickAccessItems);
  const [profile, setProfile] = useState<{email:string} | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userEmail = localStorage.getItem("userProfile")
      ? JSON.parse(localStorage.getItem("userProfile")!).email
      : null;
      
    if (userEmail) {
      setProfile({ email: userEmail });
      recordVisit(userEmail);
    }

    const unsubUserData = listenToUserData(userEmail, (userData) => {
      if (userData) {
        const processedStats = processUserDataForStats(userData, userEmail);
        setStats(processedStats as any);
        if (userData.settings?.quickAccessOrder) {
          const savedOrder = userData.settings.quickAccessOrder;
          const orderedItems = savedOrder.map((id: string) => defaultQuickAccessItems.find(item => item.id === id)).filter(Boolean);
          const newItems = defaultQuickAccessItems.filter(item => !savedOrder.includes(item.id));
          setQuickAccessItems([...orderedItems, ...newItems]);
        }
      }
    });

    if (userEmail) {
        getStreakData(userEmail).then(setStreakData);
    }
    
    const unsubComingSoon = listenToComingSoonItems(setComingSoonItems);
    
    const unsubUpdates = listenToUpdatesFromRtdb((updates) => {
        const sortedUpdates = [...updates].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
        setWhatsNewItems(sortedUpdates.slice(0, 2));
    });
    
    const unsubDiscover = listenToHowToUseFeaturesFromRtdb((features) => {
        setDiscoverItems(features.slice(-3).reverse());
    });

    return () => {
        unsubUserData();
        unsubComingSoon();
        unsubUpdates();
        unsubDiscover();
    };
  }, []);

  const handleSaveOrder = () => {
    if (profile?.email) {
      const order = quickAccessItems.map(item => item.id);
      updateUserData(profile.email, { 'settings.quickAccessOrder': order });
      toast({ title: "Layout Saved!", description: "Your quick access layout has been updated." });
    }
    setIsCustomizeMode(false);
  };


  const chartData = stats.activity.map(day => ({
      date: format(new Date(day.date), 'EEE'),
      ops: day.total,
  }));
  const chartConfig = {
      ops: {
          label: "Operations",
          color: "hsl(var(--primary))",
      },
  };
  
  const topFeatureIcon = {
      'Converter': <Sigma size={16} className="text-primary" />,
      'Calculator': <Calculator size={16} className="text-primary" />,
      'Date Calcs': <Calendar size={16} className="text-primary" />,
  }
  
  const calculateChange = (key: 'total') => {
      if (stats.activity.length < 2) {
          return { changeType: 'neutral' as const };
      }
      const today = stats.activity[stats.activity.length - 1]?.[key] || 0;
      const yesterday = stats.activity[stats.activity.length - 2]?.[key] || 0;
      const change = today - yesterday;
      return { changeType: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral' };
  };
  
  const todaysOpsStats = calculateChange('total');


  const statsData = [
    { key: "Today", value: stats.todaysOps, icon: <Clock size={16} className="text-primary" />, changeType: todaysOpsStats.changeType },
    { key: "Streak", value: streakData.currentStreak, icon: <Flame size={16} className="text-primary" /> },
    { key: "Saved", value: stats.savedNotes, icon: <Bookmark size={16} className="text-primary" /> },
    { key: "All time", value: stats.totalOps, icon: <Star size={16} className="text-primary" /> },
    { key: "Top Feature", value: stats.topFeature, icon: topFeatureIcon[stats.topFeature] }
  ];


  return (
    <div className="text-foreground max-w-sm mx-auto">
      {/* STAT CARDS - HORIZONTAL SCROLL */}
      <div className="mb-5">
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-2">
            {statsData.map((s) => (
                <div key={s.key} className="min-w-[120px] flex-shrink-0 p-3 rounded-2xl bg-card shadow-sm border">
                <div className="flex items-center justify-between text-xs text-foreground/80">
                    <div className="flex items-center gap-2">
                      {s.icon} {s.key}
                    </div>
                    {s.changeType === 'increase' && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {s.changeType === 'decrease' && <TrendingDown className="h-4 w-4 text-red-500" />}
                </div>
                <div className="text-xl font-bold mt-1 text-primary">{s.value}</div>
                </div>
            ))}
             <div className="min-w-[120px] flex-shrink-0 p-3 rounded-2xl bg-card shadow-sm border flex flex-col items-center justify-center">
                 <Link href="/analytics" className="text-primary font-semibold text-sm hover:underline">View Analytics</Link>
             </div>
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* WEEKLY SUMMARY WITH BARS */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-primary">Weekly Summary</h3>
           <Button asChild variant="link" size="sm" className="text-primary">
            <Link href="/analytics">View Analytics</Link>
          </Button>
        </div>
        <div className="h-28 px-1">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <RechartsBarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                />
                <YAxis hide/>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="ops" fill="var(--color-ops)" radius={8} />
            </RechartsBarChart>
          </ChartContainer>
        </div>
      </div>

      {/* QUICK ACCESS */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-primary">Quick Access</h3>
          {profile && !isCustomizeMode && (
            <button onClick={() => setIsCustomizeMode(true)} className="text-xs text-primary hover:underline">Customize</button>
          )}
           {isCustomizeMode && (
             <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => setIsCustomizeMode(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveOrder}>Save</Button>
             </div>
          )}
        </div>
        <Reorder.Group axis="y" values={quickAccessItems} onReorder={setQuickAccessItems} className="grid grid-cols-3 gap-3">
          {quickAccessItems.map((item, index) => (
            <Reorder.Item key={item.id} value={item}>
               <Shortcut icon={item.icon} label={item.label} href={item.href} isCustomizeMode={isCustomizeMode} />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

      {/* COMING SOON - HORIZONTAL */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-primary">Coming Soon</h3>
          <span className="text-xs text-muted-foreground">Preview</span>
        </div>
        <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-2">
            {comingSoonItems.map((item) => (
                <ComingCard key={item.id} {...item} />
            ))}
            </div>
             <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* WHATS NEW */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-primary">What's New</h3>
            <Link href="/updates" className="text-xs text-primary hover:underline">See all</Link>
        </div>
        <div className="space-y-2">
            {whatsNewItems.map((item, index) => {
                const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Rocket;
                return (
                    <NewsItem key={index} icon={<Icon size={16} />} title={item.title} desc={item.description} href="/updates" />
                )
            })}
        </div>
      </div>

      {/* DISCOVER SUTRADHAAR */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-primary">Discover Sutradhaar</h3>
             <Link href="/how-to-use" className="text-xs text-primary hover:underline">See all</Link>
        </div>
        <div className="space-y-2">
          {discoverItems.map((item, index) => {
               const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Zap;
               return (
                    <InfoItem key={index} icon={<Icon size={16} />} title={item.title} subtitle={item.description} href="/how-to-use" />
               )
          })}
        </div>
      </div>

      <div className="mb-12">
        <AboutCard />
      </div>
    </div>
  );
}

/* --- Helper components --- */
function Shortcut({ icon, label, href, isCustomizeMode }: { icon: React.ReactNode, label: string, href?: string, isCustomizeMode?: boolean }) {
    const content = (
        <div className={cn("relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-card shadow-sm border text-xs text-primary", isCustomizeMode && "cursor-grab")}>
            <div className="p-2 rounded-lg bg-secondary">{icon}</div>
            <div>{label}</div>
            {isCustomizeMode && (
              <div className="absolute top-1 right-1 text-muted-foreground">
                <GripVertical size={16}/>
              </div>
            )}
        </div>
    );

    if (href && !isCustomizeMode) {
        return <Link href={href}>{content}</Link>
    }
    return <div>{content}</div>;
}


function ComingCard({ title, description, soon, icon }: ComingSoonItem) {
  const router = useRouter();
  const [profile, setProfile] = useState<{email: string} | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showComingSoonDialog, setShowComingSoonDialog] = useState(false);
  const Icon = (LucideIcons as any)[icon] || LucideIcons.Sparkles;

   useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
    }
  }, []);
  
  const handleClick = () => {
    if (!profile) {
      setShowLoginDialog(true);
    } else {
      setShowComingSoonDialog(true);
    }
  };

  return (
    <>
      <button onClick={handleClick} className="min-w-[180px] p-3 rounded-2xl bg-card shadow-sm border text-left">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Icon size={16} />
                {title}
            </div>
          {soon && <div className="text-[10px] px-2 py-1 rounded-full bg-yellow-200 text-yellow-800">Soon</div>}
        </div>
        <div className="text-xs text-muted-foreground mt-2">{description}</div>
      </button>

      <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Login Required</AlertDialogTitle>
            <AlertDialogDescription>
              Please log in to be notified about this feature.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/welcome')}>
              Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <AlertDialog open={showComingSoonDialog} onOpenChange={setShowComingSoonDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center text-center">
             <div className="p-3 bg-primary/10 rounded-full mb-4">
                <Icon className="w-8 h-8 text-primary" />
            </div>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>
              {description} We'll notify you via Sutradhaar's notification system when it's ready!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function NewsItem({ icon, title, desc, href }: { icon?: React.ReactNode, title: string, desc: string, href?: string }) {
    const content = (
        <div className="p-3 rounded-xl bg-card shadow-sm border flex items-center gap-3">
            {icon && <div className="p-2 rounded-lg bg-secondary text-primary">{icon}</div>}
            <div>
                <div className="text-sm font-medium text-primary">{title}</div>
                <div className="text-xs text-muted-foreground mt-1">{desc}</div>
            </div>
        </div>
    );
    if(href) {
        return <Link href={href}>{content}</Link>
    }
    return content;
}

function InfoItem({ icon, title, subtitle, href }: { icon: React.ReactNode, title: string, subtitle: string, href?: string }) {
    const content = (
        <div className="p-3 rounded-2xl bg-card shadow-sm border flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">{icon}</div>
            <div>
                <div className="text-sm font-medium text-primary">{title}</div>
                <div className="text-xs text-muted-foreground">{subtitle}</div>
            </div>
        </div>
    );
    if (href) {
        return <Link href={href}>{content}</Link>;
    }
    return <div>{content}</div>;
}
