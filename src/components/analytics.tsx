

"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  Calculator,
  Download,
  Calendar as CalendarIcon,
  BarChart,
  LineChart as LineChartIcon,
  ArrowRight,
  Flame,
  TrendingUp,
  CheckCircle,
  XCircle,
  TrendingDown,
  NotebookPen,
  Trash2,
  Star,
  Timer,
  Hourglass,
  Activity,
  BarChart3,
  Users,
  EyeOff
} from "lucide-react";
import { addDays, format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getStats, type DailyActivity } from "@/lib/stats";
import { LineChart, Line, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart as RechartsBarChart } from "recharts";
import { useLanguage } from "@/context/language-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { getStreakData } from "@/lib/streak";
import { cn } from "@/lib/utils";


type ChartType = "bar" | "line";
type TimeRangePreset = "weekly" | "monthly" | "yearly";

interface LastActivityItem {
    name: string;
    details: string;
    timestamp: string;
    icon: React.ElementType;
}

const StatCard = ({ title, value, icon, change, changeType, description }: { title: string, value: string | number, icon: React.ReactNode, change?: string, changeType?: 'increase' | 'decrease' | 'neutral', description?: string }) => (
    <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
        <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
                 <div className="p-2 bg-secondary rounded-lg text-secondary-foreground">
                    {icon}
                 </div>
                <CardTitle className="text-lg">{title}</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <p className="text-4xl font-extrabold">{value}</p>
            {change &&
                <p className={cn(
                    "text-sm font-medium",
                    changeType === 'increase' && 'text-green-600',
                    changeType === 'decrease' && 'text-red-600'
                )}>
                    {changeType === 'increase' && <TrendingUp className="inline-block w-4 h-4" />}
                    {changeType === 'decrease' && <TrendingDown className="inline-block w-4 h-4" />}
                     {change}
                </p>
            }
             {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </CardContent>
    </Card>
);



export function Analytics() {
    const { t } = useLanguage();
    const [stats, setStats] = useState<{
        totalConversions: number;
        totalCalculations: number;
        totalDateCalculations: number;
        savedNotes: number;
        recycledNotes: number;
        favoriteConversions: number;
        activity: DailyActivity[];
        currentStreak: number;
        bestStreak: number;
        daysNotOpened: number;
    }>({
        totalConversions: 0,
        totalCalculations: 0,
        totalDateCalculations: 0,
        savedNotes: 0,
        recycledNotes: 0,
        favoriteConversions: 0,
        activity: [],
        currentStreak: 0,
        bestStreak: 0,
        daysNotOpened: 0,
    });
    
    const [timeRange, setTimeRange] = useState<TimeRangePreset>("weekly");
    const [chartType, setChartType] = useState<ChartType>("bar");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -6),
        to: new Date(),
    });
    const [lastActivities, setLastActivities] = useState<LastActivityItem[]>([]);

    const loadLastActivities = useCallback(() => {
        const activities: (LastActivityItem | null)[] = [
            { key: 'lastConversion', name: 'Unit Conversion', icon: RefreshCw },
            { key: 'lastCalculation', name: 'Calculator', icon: Calculator },
            { key: 'lastNote', name: 'Note Edited', icon: NotebookPen },
            { key: 'lastDateCalc', name: 'Date Calculation', icon: CalendarIcon },
            { key: 'lastTimer', name: 'Timer', icon: Timer },
            { key: 'lastStopwatch', name: 'Stopwatch', icon: Hourglass }
        ].map(({ key, name, icon }) => {
            const item = localStorage.getItem(key);
            if (!item) return null;
            const [details, timestamp] = item.split('|');
            return { name, details, timestamp, icon };
        });

        const sortedActivities = activities
            .filter((a): a is LastActivityItem => a !== null && a.timestamp !== undefined)
            .sort((a, b) => {
                const dateA = new Date(a.timestamp).getTime();
                const dateB = new Date(b.timestamp).getTime();
                if(isNaN(dateA) || isNaN(dateB)) return 0;
                return dateB - dateA;
            });

        setLastActivities(sortedActivities);
    }, []);


    const loadStats = useCallback(async () => {
        const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
        const [fetchedStats, streakData] = await Promise.all([
          getStats(userEmail, dateRange),
          getStreakData(userEmail)
        ]);

        setStats({
            totalConversions: fetchedStats.totalConversions,
            totalCalculations: fetchedStats.totalCalculations,
            totalDateCalculations: fetchedStats.totalDateCalculations,
            savedNotes: fetchedStats.savedNotes,
            recycledNotes: fetchedStats.recycledNotes,
            favoriteConversions: fetchedStats.favoriteConversions,
            activity: fetchedStats.activity,
            currentStreak: streakData.currentStreak,
            bestStreak: streakData.bestStreak,
            daysNotOpened: streakData.daysNotOpened,
        });

    }, [dateRange]);

    useEffect(() => {
        loadStats();
        loadLastActivities();

        const handleStorageChange = () => {
            loadLastActivities();
        }
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadStats, loadLastActivities]);
    
    const handleTimeRangeChange = (preset: TimeRangePreset) => {
      setTimeRange(preset);
      const to = new Date();
      let from;
      if (preset === 'weekly') {
        from = addDays(to, -6);
      } else if (preset === 'monthly') {
        from = addDays(to, -29);
      } else if (preset === 'yearly') {
        from = addDays(to, -364);
      }
      setDateRange({ from, to });
    }
    
    const calculateChange = (key: 'conversions' | 'calculations' | 'dateCalculations') => {
        if (stats.activity.length < 2) {
            return { today: 0, yesterday: 0, change: 0, percent: 0 };
        }
        const today = stats.activity[stats.activity.length - 1][key];
        const yesterday = stats.activity[stats.activity.length - 2][key];
        const change = today - yesterday;
        const percent = yesterday === 0 ? (change > 0 ? 100 : 0) : (change / yesterday) * 100;
        return { today, yesterday, change, percent };
    };

    const conversionsStats = calculateChange("conversions");
    const dateCalcStats = calculateChange("dateCalculations");
    const calculationsStats = calculateChange("calculations");
    
    const featureShare = [
      { name: "Unit Conversions", value: stats.totalConversions },
      { name: "Calculator", value: stats.totalCalculations },
      { name: "Date Calculations", value: stats.totalDateCalculations },
    ];
    
    const COLORS = ["#6366f1", "#22c55e", "#f97316"];
    
    const formattedChartData = stats.activity.map(day => ({
        ...day,
        date: format(new Date(day.date), 'MMM d')
    }));

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight">📊 Analytics Dashboard</h1>
            <Button asChild>
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
            </Button>
          </header>
          
          <Card>
            <CardHeader><CardTitle>Usage Statistics</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <StatCard 
                    title="Total Conversions" 
                    value={stats.totalConversions}
                    icon={<RefreshCw className="text-indigo-500"/>}
                    change={`${Math.abs(conversionsStats.percent).toFixed(1)}% vs previous day`}
                    changeType={conversionsStats.change >= 0 ? 'increase' : 'decrease'}
                />
                 <StatCard 
                    title="Calculator Ops" 
                    value={stats.totalCalculations}
                    icon={<Calculator className="text-green-500"/>}
                    change={`${Math.abs(calculationsStats.percent).toFixed(1)}% vs previous day`}
                    changeType={calculationsStats.change >= 0 ? 'increase' : 'decrease'}
                />
                 <StatCard 
                    title="Date Calculations" 
                    value={stats.totalDateCalculations}
                    icon={<CalendarIcon className="text-orange-500"/>}
                    change={`${Math.abs(dateCalcStats.percent).toFixed(1)}% vs previous day`}
                    changeType={dateCalcStats.change >= 0 ? 'increase' : 'decrease'}
                />
            </CardContent>
          </Card>
          
          <Card>
              <CardHeader><CardTitle>Engagement</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <StatCard 
                    title="Current Streak" 
                    value={`${stats.currentStreak} days`}
                    icon={<Flame className="text-red-500"/>}
                />
                <StatCard 
                    title="Best Streak" 
                    value={`${stats.bestStreak} days`}
                    icon={<CheckCircle className="text-yellow-500"/>}
                />
                <StatCard
                    title="Days Since Last Visit"
                    value={`${stats.daysNotOpened} days`}
                    icon={<EyeOff className="text-gray-500" />}
                />
              </CardContent>
          </Card>

           <Card>
              <CardHeader><CardTitle>Content</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <StatCard 
                    title="Saved Notes" 
                    value={stats.savedNotes}
                    icon={<NotebookPen className="text-blue-500"/>}
                />
                <StatCard 
                    title="Recycle Bin" 
                    value={stats.recycledNotes}
                    icon={<Trash2 className="text-gray-500"/>}
                />
                <StatCard 
                    title="Favorite Conversions" 
                    value={stats.favoriteConversions}
                    icon={<Star className="text-pink-500"/>}
                />
              </CardContent>
          </Card>
    
          {/* Charts */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <CardTitle>Usage Trend</CardTitle>
                        <CardDescription>Your activity over the selected period.</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                id="date"
                                variant={"outline"}
                                className="w-[240px] justify-start text-left font-normal"
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                    <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                    </>
                                    ) : (
                                    format(dateRange.from, "LLL dd, y")
                                    )
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1}
                                />
                            </PopoverContent>
                        </Popover>
                        <Tabs value={timeRange} onValueChange={(v) => handleTimeRangeChange(v as TimeRangePreset)}>
                            <TabsList>
                                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                <TabsTrigger value="yearly">Yearly</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <Tabs value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                            <TabsList>
                                <TabsTrigger value="bar"><BarChart className="w-4 h-4"/></TabsTrigger>
                                <TabsTrigger value="line"><LineChartIcon className="w-4 h-4"/></TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                        <LineChart data={formattedChartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
                            <Line type="monotone" dataKey="conversions" name="Conversions" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                            <Line type="monotone" dataKey="calculations" name="Calculator" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }}/>
                            <Line type="monotone" dataKey="dateCalculations" name="Date Calcs" stroke="#f97316" strokeWidth={2} dot={{ r: 4 }}/>
                        </LineChart>
                    ) : (
                        <RechartsBarChart data={formattedChartData}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="date" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip />
                            <Bar dataKey="conversions" name="Conversions" stackId="a" fill="#6366f1" />
                            <Bar dataKey="calculations" name="Calculator" stackId="a" fill="#22c55e" />
                            <Bar dataKey="dateCalculations" name="Date Calcs" stackId="a" fill="#f97316" />
                        </RechartsBarChart>
                    )}
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="rounded-2xl shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Activity /> Last Activity</CardTitle>
                    <CardDescription>Your most recent actions across the app.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {lastActivities.length > 0 ? lastActivities.map((activity, index) => {
                            if (!isValid(parseISO(activity.timestamp))) return null;
                            return (
                                <li key={index} className="flex items-center gap-4 p-2 bg-secondary rounded-lg">
                                    <div className="p-2 bg-primary/10 text-primary rounded-full">
                                        <activity.icon className="w-5 h-5"/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{activity.name}</p>
                                        <p className="text-sm text-muted-foreground truncate">{activity.details}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true })}
                                    </p>
                                </li>
                            )
                        }) : (
                            <p className="text-center text-muted-foreground py-8">No recent activity recorded.</p>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
      );
}
