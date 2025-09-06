
"use client";

import { useState, useEffect } from 'react';
import { Wrench, Clock, Settings, Zap, Hourglass } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, intervalToDuration, differenceInDays } from "date-fns";

const UPDATE_TIMER_STORAGE_KEY = "nextUpdateTime";

const CountdownBox = ({ value, label }: { value: number; label: string }) => (
    <div className="bg-primary/10 p-4 rounded-lg text-primary w-24">
        <p className="text-4xl font-bold">{String(value).padStart(2, '0')}</p>
        <p className="text-xs text-primary/80">{label}</p>
    </div>
);

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <Card className="bg-card/50 backdrop-blur-sm border-primary/20 text-center flex-1">
        <CardHeader className="items-center pb-2">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Icon className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);


export default function MaintenancePage() {
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState<Duration & { totalDays?: number } | null>(null);

  useEffect(() => {
    const savedDate = localStorage.getItem(UPDATE_TIMER_STORAGE_KEY);
    if (savedDate) {
        const date = new Date(savedDate);
        if (!isNaN(date.getTime()) && date > new Date()) {
            setTargetDate(date);
        }
    }
  }, []);

  useEffect(() => {
    if (!targetDate) return;

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
  }, [targetDate]);


  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-8 w-full max-w-4xl"
      >
        <div className="p-4 bg-primary/10 rounded-full">
            <Wrench className="w-10 h-10 text-primary" />
        </div>
        
        <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">We'll Be Back Soon!</h1>
            <p className="text-muted-foreground max-w-2xl">
              Our website is currently undergoing scheduled maintenance. We're working hard to improve your experience. Thank you for your patience.
            </p>
        </div>

        {timeLeft && (
            <div className="flex gap-2 sm:gap-4">
                <CountdownBox value={timeLeft.totalDays ?? 0} label="DAYS"/>
                <CountdownBox value={timeLeft.hours ?? 0} label="HOURS"/>
                <CountdownBox value={timeLeft.minutes ?? 0} label="MINUTES"/>
                <CountdownBox value={timeLeft.seconds ?? 0} label="SECONDS"/>
            </div>
        )}
        
        <div className="w-full flex flex-col md:flex-row gap-4 mt-4">
            <FeatureCard 
                icon={Hourglass}
                title="Minimal Downtime"
                description="We're working as quickly as possible to restore service"
            />
             <FeatureCard 
                icon={Settings}
                title="System Updates"
                description="Installing important security and performance updates"
            />
             <FeatureCard 
                icon={Zap}
                title="Better Experience"
                description="Coming back with improved features and performance"
            />
        </div>

        <div className="text-center mt-8">
            <p className="text-muted-foreground">Need immediate assistance?</p>
            <a href="mailto:amanyadavyadav9458@gmail.com" className="text-primary hover:underline">
                Contact us at amanyadavyadav9458@gmail.com
            </a>
            <div className="mt-6">
                <Button asChild variant="secondary">
                     <Link href="/dev">Admin Login</Link>
                </Button>
            </div>
        </div>

      </motion.div>
    </main>
  );
}
