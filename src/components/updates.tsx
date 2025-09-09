

"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Timer, CheckCircle, Rocket, Bug, Beaker, Shield, AlertTriangle } from "lucide-react";
import { format, intervalToDuration, differenceInDays, parseISO } from "date-fns";
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { listenToNextUpdateInfo, NextUpdateInfo, listenToUpdatesFromRtdb, UpdateItem } from '@/services/firestore';
import * as LucideIcons from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';

const categoryIcons: { [key: string]: React.ElementType } = {
  "New Feature": Rocket,
  "Bug Fix": Bug,
  "Improvement": Beaker,
  "Security": Shield,
  "Face Issue": AlertTriangle,
};

const CountdownBox = ({ value, label }: { value: number; label: string }) => (
    <div className="bg-primary/10 p-3 rounded-lg text-primary text-center">
        <p className="text-2xl font-bold">{String(value).padStart(2, '0')}</p>
        <p className="text-xs text-primary/80">{label}</p>
    </div>
);


export function Updates() {
  const [nextUpdateInfo, setNextUpdateInfo] = useState<NextUpdateInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState<Duration & { totalDays?: number } | null>(null);
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
        setNextUpdateInfo(info);
    });

    return () => unsubscribe();
  }, [isClient]);


  useEffect(() => {
    if (!nextUpdateInfo?.targetDate || !isClient) {
      setTimeLeft(null);
      return;
    }

    const targetDate = new Date(nextUpdateInfo.targetDate);

    const timer = setInterval(() => {
      const now = new Date();
      if (targetDate > now) {
        const duration = intervalToDuration({ start: now, end: targetDate });
        const totalDays = differenceInDays(targetDate, now);
        setTimeLeft({ ...duration, totalDays });
      } else {
        setTimeLeft(null);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextUpdateInfo, isClient]);
  
  const sortedUpdates = [...updates].sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
  
  const isTimerFinished = nextUpdateInfo?.targetDate && new Date(nextUpdateInfo.targetDate) < new Date();
  const Icon = categoryIcons[nextUpdateInfo?.category || ''] || Rocket;
  const categoryTitle = nextUpdateInfo?.category === 'Custom' ? nextUpdateInfo.customCategoryTitle : nextUpdateInfo?.category;

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <Button variant="secondary" className="rounded-xl shadow-md" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <h1 className="text-xl font-bold">{t('updates.title')}</h1>
      </header>

      {isClient && timeLeft && (
        <div className="bg-card p-6 rounded-xl text-center border">
            <div className='flex items-center justify-center gap-2 mb-4'>
                <Timer className="text-accent" />
                <h2 className="text-lg font-bold text-foreground">{t('updates.countdown.title')}</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
                <CountdownBox value={timeLeft.days ?? 0} label={t('updates.countdown.days')} />
                <CountdownBox value={timeLeft.hours ?? 0} label={t('updates.countdown.hours')} />
                <CountdownBox value={timeLeft.minutes ?? 0} label={t('updates.countdown.minutes')} />
                <CountdownBox value={timeLeft.seconds ?? 0} label={t('updates.countdown.seconds')} />
            </div>
             {categoryTitle && (
                <div className="mt-4 flex justify-center">
                    <div className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground p-2 px-4 rounded-full text-sm font-medium">
                        <Icon className="w-5 h-5 text-primary" />
                        <span>{categoryTitle}</span>
                    </div>
                </div>
            )}
             {nextUpdateInfo?.updateText && (
                <div className="mt-4 text-left p-4 bg-secondary rounded-lg">
                    <h3 className="font-semibold mb-2 text-foreground">{t('updates.countdown.expect')}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{nextUpdateInfo.updateText}</p>
                </div>
            )}
        </div>
      )}

      {isClient && isTimerFinished && (
        <div className="border p-4 rounded-lg flex items-center gap-4 bg-green-100 border-green-200 text-green-800">
            <CheckCircle className="w-6 h-6" />
            <p className="font-semibold">Congratulations! The new update is now live. Enjoy the new features.</p>
        </div>
      )}

      <div className="space-y-6">
        {sortedUpdates.map((update) => {
            const UpdateIcon = (LucideIcons as any)[update.icon] || categoryIcons[update.category] || LucideIcons.Rocket;
            const categoryTitle = update.category === 'Custom' ? update.customCategoryTitle : update.category;
            return (
                <Card key={update.id} className="overflow-hidden">
                    <CardHeader className="flex-row items-start gap-4">
                         <div className="p-3 rounded-full border" style={{ backgroundColor: update.bgColor, color: update.textColor }}>
                            <UpdateIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <CardTitle>{update.title}</CardTitle>
                            <CardDescription>
                                {isClient ? format(new Date(update.date), "d MMMM, yyyy") : ''}
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                         <p className="text-sm text-muted-foreground">{update.description}</p>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center text-xs bg-secondary py-2 px-6">
                         {categoryTitle && <span className="font-semibold text-primary">{categoryTitle}</span>}
                       <span className="font-medium text-muted-foreground border rounded-full px-2 py-0.5 bg-background">{update.version}</span>
                    </CardFooter>
                </Card>
            )
        })}
      </div>
    </div>
  );
}
