
"use client";

import { useState, useEffect } from 'react';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Zap, Rocket, Timer, Palette, Languages, User, Wand2 } from "lucide-react";
import { format, intervalToDuration, differenceInDays } from "date-fns";
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';

const UPDATE_TIMER_STORAGE_KEY = "nextUpdateTime";
const UPDATE_TEXT_STORAGE_KEY = "nextUpdateText";

const getUpdates = (t: (key: string) => string) => [
    {
        version: "v2.4.0",
        date: "2024-10-01T10:00:00Z",
        title: t('updates.items.profileManagement.title'),
        description: t('updates.items.profileManagement.description'),
        icon: User,
        bgColor: "bg-orange-500/10",
        textColor: "text-orange-400"
    },
    {
        version: "v2.3.0",
        date: "2024-09-25T10:00:00Z",
        title: t('updates.items.languageSupport.title'),
        description: t('updates.items.languageSupport.description'),
        icon: Languages,
        bgColor: "bg-teal-500/10",
        textColor: "text-teal-400"
    },
     {
        version: "v2.2.0",
        date: "2024-09-10T10:00:00Z",
        title: t('updates.items.smartSearch.title'),
        description: t('updates.items.smartSearch.description'),
        icon: Wand2,
        bgColor: "bg-indigo-500/10",
        textColor: "text-indigo-400"
    },
    {
        version: "v2.1.5",
        date: "2024-08-20T10:00:00Z",
        title: t('updates.items.appearance.title'),
        description: t('updates.items.appearance.description'),
        icon: Palette,
        bgColor: "bg-pink-500/10",
        textColor: "text-pink-400"
    },
    {
        version: "v2.1.0",
        date: "2024-08-15T10:00:00Z",
        title: t('updates.items.timeTools.title'),
        description: t('updates.items.timeTools.description'),
        icon: Zap,
        bgColor: "bg-green-500/10",
        textColor: "text-green-400"
    },
    {
        version: "v2.0.0",
        date: "2024-07-20T09:00:00Z",
        title: t('updates.items.customUnits.title'),
        description: t('updates.items.customUnits.description'),
        icon: Gift,
        bgColor: "bg-blue-500/10",
        textColor: "text-blue-400"
    },
    {
        version: "v1.0.0",
        date: "2024-06-01T12:00:00Z",
        title: t('updates.items.initialLaunch.title'),
        description: t('updates.items.initialLaunch.description'),
        icon: Rocket,
        bgColor: "bg-purple-500/10",
        textColor: "text-purple-400"
    },
];


export function Updates() {
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<Duration & { totalDays?: number } | null>(null);
  const [updateText, setUpdateText] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const updates = getUpdates(t);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const loadData = () => {
    const savedDate = localStorage.getItem(UPDATE_TIMER_STORAGE_KEY);
    const savedText = localStorage.getItem(UPDATE_TEXT_STORAGE_KEY);
    
    if (savedText) {
        setUpdateText(savedText);
    } else {
        setUpdateText("General improvements and bug fixes.");
    }

    if (savedDate) {
      const date = new Date(savedDate);
      if (!isNaN(date.getTime()) && date > new Date()) {
        setTargetDate(date);
      } else {
        setTargetDate(null);
        localStorage.removeItem(UPDATE_TIMER_STORAGE_KEY);
      }
    } else {
        setTargetDate(null);
    }
  };
  
  useEffect(() => {
    if(!isClient) return;
    
    loadData();
    
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === UPDATE_TIMER_STORAGE_KEY || event.key === UPDATE_TEXT_STORAGE_KEY) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isClient]);


  useEffect(() => {
    if (!targetDate || !isClient) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const now = new Date();
      if (targetDate > now) {
        const duration = intervalToDuration({ start: now, end: targetDate });
        const totalDays = differenceInDays(targetDate, now);
        setTimeLeft({ ...duration, totalDays });
      } else {
        setTimeLeft(null);
        setTargetDate(null);
        localStorage.removeItem(UPDATE_TIMER_STORAGE_KEY);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, isClient]);


  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">{t('updates.title')}</h1>
      </header>

      {isClient && timeLeft && (
        <div className="bg-card p-6 rounded-xl text-center">
            <div className='flex items-center justify-center gap-2 mb-4'>
                <Timer className="text-accent" />
                <h2 className="text-lg font-bold text-foreground">{t('updates.countdown.title')}</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
                <div className='bg-background p-3 rounded-lg'>
                    <p className="text-3xl font-bold">{timeLeft.totalDays}</p>
                    <p className="text-xs text-muted-foreground">{t('updates.countdown.days')}</p>
                </div>
                <div className='bg-background p-3 rounded-lg'>
                    <p className="text-3xl font-bold">{String(timeLeft.hours || 0).padStart(2, '0')}</p>
                    <p className="text-xs text-muted-foreground">{t('updates.countdown.hours')}</p>
                </div>
                 <div className='bg-background p-3 rounded-lg'>
                    <p className="text-3xl font-bold">{String(timeLeft.minutes || 0).padStart(2, '0')}</p>
                    <p className="text-xs text-muted-foreground">{t('updates.countdown.minutes')}</p>
                </div>
                 <div className='bg-background p-3 rounded-lg'>
                    <p className="text-3xl font-bold">{String(timeLeft.seconds || 0).padStart(2, '0')}</p>
                    <p className="text-xs text-muted-foreground">{t('updates.countdown.seconds')}</p>
                </div>
            </div>
             {updateText && (
                <div className="mt-4 text-left p-4 bg-secondary rounded-lg">
                    <h3 className="font-semibold mb-2 text-foreground">{t('updates.countdown.expect')}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{updateText}</p>
                </div>
            )}
        </div>
      )}

      <div className="relative pl-8">
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border"></div>
        {updates.map((update, index) => (
            <div key={index} className="mb-6 relative">
                <div className="flex items-center mb-2">
                    <div className={`absolute left-[-18px] top-1 p-2 rounded-full border-4 border-background ${update.bgColor} ${update.textColor}`}>
                        <update.icon className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-muted-foreground ml-8">
                        {isClient ? format(new Date(update.date), "d MMM yyyy, h:mm a") : ''}
                    </p>
                </div>
                <div className="bg-card p-4 rounded-xl ml-8">
                    <h2 className="text-lg font-semibold text-foreground mb-2">{update.title}</h2>
                    <p className="text-sm text-muted-foreground">{update.description}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
