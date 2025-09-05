
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
import { GlobalSearchDialog } from "./global-search-dialog";
import { Notifications } from "./notifications";
import { useLanguage } from "@/context/language-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";


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

const quickTools = [
  { label: "Converter", icon: Wand2, href: "/converter" },
  { label: "Calculator", icon: Calculator, href: "/calculator" },
  { label: "Notes", icon: NotebookPen, href: "/notes" },
  { label: "History", icon: History, href: "/history" },
  { label: "Time Tools", icon: Clock3, href: "/time" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

const recommendations = [
  {
    id: 1,
    title: "Smart Search Bar",
    minutes: 5,
    by: "Aman",
    img: "https://picsum.photos/seed/tech1/400/200",
    dataAiHint: "digital analytics"
  },
  {
    id: 2,
    title: "How to use Smart Calc",
    minutes: 15,
    by: "Aman",
    img: "https://picsum.photos/seed/tech2/400/200",
    dataAiHint: "financial calculator"
  },
  {
    id: 3,
    title: "Unit Converter Pro Tips",
    minutes: 8,
    by: "Aman",
    img: "https://picsum.photos/seed/tech3/400/200",
    dataAiHint: "team working"
  },
];

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

const ToolButton = ({ icon: Icon, label, href }: any) => (
  <motion.a
    href={href}
    whileHover={{ y: -2, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="group rounded-lg border border-border bg-card hover:bg-secondary transition-all p-2 flex items-center gap-2 shadow-sm"
  >
    <div className="size-8 grid place-items-center rounded-md bg-secondary text-primary">
      <Icon className="size-4" />
    </div>
    <div className="flex-1">
      <p className="font-medium text-foreground text-xs">{label}</p>
    </div>
    <ArrowRight className="size-4 text-muted-foreground opacity-60 group-hover:opacity-100" />
  </motion.a>
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
        {item.minutes} Minutes • {item.by}
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

const Header = ({ name, profile }: { name: string, profile: UserProfile | null }) => {
  const router = useRouter();
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Hi, {name}</h1>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-green-500" />
                Welcome back
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Notifications />
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push(profile ? '/profile' : '/welcome')}>
                <Avatar className="h-10 w-10 border border-border bg-card text-foreground">
                <AvatarImage src={profile?.profileImage} alt={profile?.fullName} />
                <AvatarFallback><UserCircle2 className="size-6" /></AvatarFallback>
                </Avatar>
            </Button>
        </div>
      </div>
       <div>
           <GlobalSearchDialog />
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
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayCalculations, setTodayCalculations] = useState(0);
  const [allTimeCalculations, setAllTimeCalculations] = useState(0);
  const [weeklyCalculations, setWeeklyCalculations] = useState<{name: string; value: number}[]>([]);
  const [savedNotesCount, setSavedNotesCount] = useState(0);

  const updateStats = (email: string | null) => {
    setTodayCalculations(getTodaysCalculations(email));
    setWeeklyCalculations(getWeeklyCalculations(email));
    setSavedNotesCount(getSavedNotesCount(email));
    setAllTimeCalculations(getAllTimeCalculations(email));
  }

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfile(parsedProfile);
        updateStats(parsedProfile.email);
    } else {
        updateStats(null);
    }
  }, []);
  
  const handleThemeChange = (isDark: boolean) => {
      setTheme(isDark ? 'dark' : 'light');
  }

  if (!isClient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="relative mx-auto max-w-lg px-4 sm:px-6 py-8">
        <Header name={profile?.fullName || 'Guest'} profile={profile} />

        <section className="grid grid-cols-2 gap-4 mt-8">
          <Stat icon={Calculator} label="Today's Ops" value={String(todayCalculations)} />
          <Stat icon={History} label="All Time Ops" value={String(allTimeCalculations)} />
          <Stat icon={NotebookPen} label="Saved Notes" value={String(savedNotesCount)} />
          <Stat icon={History} label="Last 7 Days" value={String(weeklyCalculations.reduce((acc, curr) => acc + curr.value, 0))} />
        </section>

        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Quick Access</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {quickTools.map((t) => (
              <ToolButton key={t.label} {...t} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <Card className="overflow-hidden rounded-xl bg-card border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <div>
                <CardTitle className="text-base text-foreground">Calculation Stats</CardTitle>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
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

        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recommendations</h2>
             <Button asChild variant="link" className="gap-1 text-primary hover:text-primary/90">
                <Link href="/help">
                    See All <ArrowRight className="size-4" />
                </Link>
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4">
            {recommendations.map((r) => (
              <RecommendationCard key={r.id} item={r} />
            ))}
          </div>
        </section>

        <footer className="mt-14 py-8 text-sm text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Sutradhaar • All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
