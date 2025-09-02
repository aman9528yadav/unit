
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ArrowRight, LayoutDashboard, Calculator, Pencil, Settings, Star, PlayCircle, ClockIcon, User, Search, Bell, Home, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { getTodaysCalculations } from "@/lib/utils";

const chartData = [
  { name: 'Jan', value: 158 },
  { name: 'Feb', value: 168 },
  { name: 'Mar', value: 156 },
  { name: 'Apr', value: 158 },
];

export function Dashboard() {
  const [isClient, setIsClient] = useState(false);
  const [todayCalculations, setTodayCalculations] = useState(0);
  const [savedNotes, setSavedNotes] = useState(11); // static for now

  useEffect(() => {
    setIsClient(true);
    setTodayCalculations(getTodaysCalculations());
  }, []);

  // Effect to listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'dailyCalculations') {
            setTodayCalculations(getTodaysCalculations());
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 text-white">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hi, Aman</h1>
          <p className="text-muted-foreground">It's time to challenge your limits.</p>
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

      <div className="grid grid-cols-4 gap-4 text-center">
        <Link href="/" className="flex flex-col items-center gap-2 p-2 rounded-lg bg-accent/20 border-accent border text-accent">
            <Home />
            <span className="text-xs font-medium">Dashboard</span>
        </Link>
         <Link href="/converter" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <FileText />
            <span className="text-xs font-medium">Converter</span>
        </Link>
        <Link href="/converter?tab=Calculator" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <Calculator />
            <span className="text-xs font-medium">Calculator</span>
        </Link>
         <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <Settings />
            <span className="text-xs font-medium">Setting</span>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-lg">Recommendations</h2>
            <Link href="#" className="text-sm text-accent flex items-center gap-1">
                See All <ArrowRight size={16} />
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
                    <h3 className="font-bold text-sm">Smart Search Bar</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><ClockIcon size={14} /> 05 Minutes</span>
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
                    <h3 className="font-bold text-sm">How to use Smart Calc</h3>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><ClockIcon size={14} /> 15 Minutes</span>
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
                    Easy to use and fast in
                </label>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="terms2" checked className="border-accent data-[state=checked]:bg-accent" />
                <label htmlFor="terms2" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Made by Indian 🇮🇳
                </label>
            </div>
        </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-indigo-400/20 border-indigo-400/50 p-4 col-span-1 rounded-2xl">
            <h3 className="text-white/90 font-semibold mb-2">Calculation</h3>
             <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 0, left: -30, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                        <XAxis dataKey="name" tick={{ fill: 'white', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: 'white', fontSize: 12 }} axisLine={false} tickLine={false} domain={[150, 170]}/>
                        <Bar dataKey="value" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
        <div className="col-span-1 flex flex-col gap-4">
             <Card className="bg-card p-4 rounded-2xl shadow-lg shadow-black/30 flex-1 flex flex-col items-center justify-center">
                 <p className="text-sm text-yellow-400 font-semibold">Today Calculation</p>
                 <p className="text-5xl font-bold">{String(todayCalculations).padStart(2, '0')}</p>
            </Card>
             <Card className="bg-card p-4 rounded-2xl flex-1 flex flex-col items-center justify-center">
                <p className="text-sm text-muted-foreground">No. Save Notes</p>
                <p className="text-5xl font-bold">{String(savedNotes).padStart(2, '0')}</p>
            </Card>
        </div>
      </div>
    </div>
  );
}
