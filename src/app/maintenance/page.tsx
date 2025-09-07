
"use client";

import { useState, useEffect } from 'react';
import { Wrench, Clock, Settings, Zap, Hourglass, Bug, Rocket, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, intervalToDuration, differenceInDays } from "date-fns";
import { listenToUpdateInfo, UpdateInfo } from '@/services/firestore';

const CountdownBox = ({ value, label }: { value: number; label: string }) => (
    <div className="bg-primary/10 p-4 rounded-lg text-primary w-24">
        <p className="text-4xl font-bold">{String(value).padStart(2, '0')}</p>
        <p className="text-xs text-primary/80">{label}</p>
    </div>
);

const FeatureCard = ({ icon: Icon, title, description, className }: { icon: React.ElementType, title: string, description: string, className?: string }) => (
    <Card className={`bg-card/50 backdrop-blur-sm border-primary/20 text-center flex-1 ${className}`}>
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

const maintenanceTypeMap = {
    "Security": { icon: Shield, title: "Security Update", description: "Applying the latest security patches to keep your data safe." },
    "Feature Update": { icon: Rocket, title: "New Features", description: "We're launching exciting new features for you to enjoy." },
    "Bug Fixes": { icon: Bug, title: "Bug Squashing", description: "Ironing out some wrinkles to improve your experience." },
    "Performance": { icon: Zap, title: "Performance Boost", description: "Making the app faster and more responsive." }
};


export default function MaintenancePage() {
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [updateText, setUpdateText] = useState<string | null>(null);
  const [maintenanceType, setMaintenanceType] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<Duration & { totalDays?: number } | null>(null);
  const [timerFinished, setTimerFinished] = useState(false);

  useEffect(() => {
    const unsubscribe = listenToUpdateInfo((info: UpdateInfo) => {
        if (info.targetDate) {
            const date = new Date(info.targetDate);
            if (!isNaN(date.getTime()) && date > new Date()) {
                setTargetDate(date);
                setTimerFinished(false);
            } else {
                setTargetDate(null);
                 if (info.targetDate) setTimerFinished(true);
            }
        } else {
            setTargetDate(null);
            setTimerFinished(false);
        }
        setUpdateText(info.updateText || "General improvements and bug fixes.");
        setMaintenanceType(info.maintenanceType || "Performance");
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!targetDate) {
        setTimeLeft(null);
        return;
    };

    const timer = setInterval(() => {
      const now = new Date();
      if (targetDate > now) {
        const duration = intervalToDuration({ start: now, end: targetDate });
        const totalDays = differenceInDays(targetDate, now);
        setTimeLeft({ ...duration, totalDays });
      } else {
        setTimeLeft(null);
        setTimerFinished(true);
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);
  
  const typeDetails = maintenanceTypeMap[maintenanceType as keyof typeof maintenanceTypeMap] || maintenanceTypeMap['Performance'];


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
              {updateText}
            </p>
        </div>
        
        <div className="w-full max-w-sm">
            <FeatureCard 
                icon={typeDetails.icon}
                title={typeDetails.title}
                description={typeDetails.description}
                className="bg-secondary"
            />
        </div>


        {timeLeft && (
            <div className="flex gap-2 sm:gap-4">
                <CountdownBox value={timeLeft.totalDays ?? 0} label="DAYS"/>
                <CountdownBox value={timeLeft.hours ?? 0} label="HOURS"/>
                <CountdownBox value={timeLeft.minutes ?? 0} label="MINUTES"/>
                <CountdownBox value={timeLeft.seconds ?? 0} label="SECONDS"/>
            </div>
        )}

        {timerFinished && (
            <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-lg">
                <p className="font-semibold">Maintenance done! We will be back in a few minutes.</p>
            </div>
        )}
        
        <div className="w-full flex flex-col md:flex-row gap-4 mt-4">
            <FeatureCard 
                icon={Hourglass}
                title="Minimal Downtime"
                description="We're working as quickly as possible to restore service"
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
