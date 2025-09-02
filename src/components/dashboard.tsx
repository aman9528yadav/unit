
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { ArrowRight, Settings, Star, PlayCircle, ClockIcon, User, Search, Bell, Home, StickyNote, CalculatorIcon, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getTodaysCalculations, getWeeklyCalculations } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";

// This should match the key in notepad.tsx
const NOTES_STORAGE_KEY = 'userNotesV2';

interface Note {
    id: string;
    deletedAt?: string | null;
}

const getSavedNotesCount = () => {
    if (typeof window === 'undefined') return 0;
    const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
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
  const [todayCalculations, setTodayCalculations] = useState(0);
  const [weeklyCalculations, setWeeklyCalculations] = useState<{name: string, value: number}[]>([]);
  const [savedNotesCount, setSavedNotesCount] = useState(0);
  const { t } = useLanguage();

  const updateCalculations = () => {
    setTodayCalculations(getTodaysCalculations());
    setWeeklyCalculations(getWeeklyCalculations());
  }

  const updateNotesCount = () => {
    setSavedNotesCount(getSavedNotesCount());
  }

  useEffect(() => {
    setIsClient(true);
    updateCalculations();
    updateNotesCount();
  }, []);

  // Effect to listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'dailyCalculations') {
            updateCalculations();
        }
        if (e.key === NOTES_STORAGE_KEY) {
            updateNotesCount();
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.greeting', { name: "Aman" })}</h1>
          <p className="text-muted-foreground">{t('dashboard.challenge')}</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Search /></Button>
            <Button variant="ghost" size="icon"><Bell /></Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <User />
              </Link>
            </Button>
        </div>
      </header>

      <div className="grid grid-cols-5 gap-2 text-center">
        <Link href="/" className="flex flex-col items-center gap-2 p-2 rounded-lg bg-accent/20 border-accent border text-accent">
            <Home />
            <span className="text-xs font-medium">{t('nav.dashboard')}</span>
        </Link>
         <Link href="/notes" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <StickyNote />
            <span className="text-xs font-medium">{t('nav.notes')}</span>
        </Link>
        <Link href="/converter" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <CalculatorIcon />
            <span className="text-xs font-medium">{t('nav.converter')}</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <Clock />
            <span className="text-xs font-medium">{t('nav.history')}</span>
        </Link>
         <Link href="/settings" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <Settings />
            <span className="text-xs font-medium">{t('nav.settings')}</span>
        </Link>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-lg">{t('dashboard.recommendations')}</h2>
            <Link href="#" className="text-sm text-accent flex items-center gap-1">
                {t('dashboard.seeAll')} <ArrowRight size={16} />
            </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <Card className="bg-card border-none overflow-hidden">
                <div className="relative">
                    <Image src="https://picsum.photos/300/200" alt="Smart Search" width={300} height={200} className="w-full h-24 object-cover" data-ai-hint="digital analytics" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <PlayCircle size={32} className="text-white/80" />
                    </div>
                     <div className="absolute top-2 right-2 bg-yellow-400 p-1 rounded-full">
                        <Star size={12} className="text-black" />
                    </div>
                </div>
                <CardContent className="p-3">
                    <h3 className="font-bold text-sm">{t('dashboard.smartSearch')}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><ClockIcon size={14} /> 05 {t('dashboard.minutes')}</span>
                        <span className="flex items-center gap-1"><User size={14} /> Aman</span>
                    </div>
                </CardContent>
            </Card>
            <Card className="bg-card border-none overflow-hidden">
                 <div className="relative">
                    <Image src="https://picsum.photos/300/200" alt="How to use Smart Calc" width={300} height={200} className="w-full h-24 object-cover" data-ai-hint="financial calculator" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <PlayCircle size={32} className="text-white/80" />
                    </div>
                </div>
                <CardContent className="p-3">
                    <h3 className="font-bold text-sm">{t('dashboard.howToUseCalc')}</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><ClockIcon size={14} /> 15 {t('dashboard.minutes')}</span>
                        <span className="flex items-center gap-1"><User size={14} /> Aman</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
      
       <div className="flex flex-col gap-3">
            <div className="flex items-center space-x-2">
                <Checkbox id="terms1" checked className="border-accent data-[state=checked]:bg-accent" />
                <label htmlFor="terms1" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t('dashboard.feature1')}
                </label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="terms2" checked className="border-accent data-[state=checked]:bg-accent" />
                <label htmlFor="terms2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t('dashboard.feature2')}
                </label>
            </div>
        </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-indigo-400/20 border-indigo-400/50 p-4 col-span-1 rounded-2xl">
            <h3 className="text-card-foreground/90 font-semibold mb-2">{t('dashboard.calculation')}</h3>
             <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyCalculations} margin={{ top: 5, right: 0, left: -30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                                color: 'hsl(var(--foreground))',
                                borderRadius: 'var(--radius)',
                            }}
                            cursor={{ fill: 'hsla(var(--foreground), 0.1)' }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
        <div className="col-span-1 flex flex-col gap-4">
             <Card className="bg-card p-4 rounded-2xl shadow-lg flex-1 flex flex-col items-center justify-center">
                 <p className="text-sm text-accent font-semibold">{t('dashboard.todayCalculation')}</p>
                 <p className="text-5xl font-bold">{String(todayCalculations).padStart(2, '0')}</p>
            </Card>
             <Card className="bg-card p-4 rounded-2xl flex-1 flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">{t('dashboard.savedNotes')}</p>
                <p className="text-5xl font-bold">{String(savedNotesCount).padStart(2, '0')}</p>
            </Card>
        </div>
      </div>
    </div>
  );
}

    