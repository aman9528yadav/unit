

"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Timer } from "lucide-react";
import { format, intervalToDuration, differenceInDays, parseISO } from "date-fns";
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { listenToNextUpdateInfo, NextUpdateInfo, listenToUpdatesFromRtdb, UpdateItem } from '@/services/firestore';
import * as LucideIcons from "lucide-react";

export function Updates() {
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<Duration & { totalDays?: number } | null>(null);
  const [updateText, setUpdateText] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();
  const [updates, setUpdates] = useState<UpdateItem[]>([]);

  useEffect(() => {
    setIsClient(true);
    const unsubscribe = listenToUpdatesFromRtdb(setUpdates);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if(!isClient) return;
    
    const unsubscribe = listenToNextUpdateInfo((info: NextUpdateInfo) => {
        if (info.targetDate) {
            const date = new Date(info.targetDate);
             if (!isNaN(date.getTime()) && date > new Date()) {
                setTargetDate(date);
            } else {
                setTargetDate(null);
            }
        } else {
            setTargetDate(null);
        }
       setUpdateText(info.updateText || "General improvements and bug fixes.");
    });

    return () => unsubscribe();
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
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, isClient]);
  
  const sortedUpdates = [...updates].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

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
        {sortedUpdates.map((update, index) => {
            const Icon = (LucideIcons as any)[update.icon] || LucideIcons.Rocket;
            return (
              <div key={index} className="mb-6 relative">
                  <div className="flex items-start mb-2">
                      <div className="absolute left-[-18px] top-1 p-2 rounded-full border-4 border-background" style={{ backgroundColor: update.bgColor, color: update.textColor }}>
                          <Icon className="w-5 h-5" />
                      </div>
                      <div className="ml-8 flex-1">
                        <p className="font-semibold text-foreground leading-tight">{update.title}</p>
                        <p className="text-xs text-muted-foreground">
                            {isClient ? format(new Date(update.date), "d MMM yyyy") : ''}
                        </p>
                      </div>
                  </div>
                  <div className="bg-card p-4 rounded-xl ml-8">
                      <p className="text-sm text-muted-foreground">{update.description}</p>
                  </div>
                   <div className="ml-8 mt-2 flex justify-end">
                       <span className="text-xs font-medium text-muted-foreground border rounded-full px-2 py-0.5">{update.version}</span>
                   </div>
              </div>
            )
        })}
      </div>
    </div>
  );
}
