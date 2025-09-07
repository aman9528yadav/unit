

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
  EyeOff,
  ChevronDown
} from "lucide-react";
import { addDays, format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DailyActivity, processUserDataForStats } from "@/lib/stats";
import { LineChart, Line, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart as RechartsBarChart } from "recharts";
import { useLanguage } from "@/context/language-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { getStreakData, StreakData } from "@/lib/streak";
import { cn } from "@/lib/utils";
import { listenToUserData } from "@/services/firestore";


type ChartType = "bar" | "line";
type TimeRangePreset = "weekly" | "monthly" | "yearly";

interface LastActivityItem {
    name: string;
    details: string;
    timestamp: string;
    icon: React.ElementType;
}

const StatCard = ({ title, value, icon, change, changeType, description }: { title: string, value: string | number, icon: React.ReactNode, change?: string, changeType?: 'increase' | 'decrease' | 'neutral', description?: string }) => (
    <Card className="rounded-2xl shadow-sm hover:shadow-lg transition flex flex-col p-4 bg-card border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <div className="p-1 bg-secondary rounded-lg text-secondary-foreground">
                {icon}
             </div>
            {title}
        </div>
        <div className="flex-1 flex flex-col justify-center items-center gap-1">
            <p className="text-3xl font-extrabold">{value}</p>
            {change &&
                <p className={cn(
                    "text-xs font-medium flex items-center gap-1",
                    changeType === 'increase' && 'text-green-600',
                    changeType === 'decrease' && 'text-red-600',
                     changeType === 'neutral' && 'text-muted-foreground'
                )}>
                    {changeType === 'increase' && <TrendingUp className="inline-block w-3 h-3" />}
                    {changeType === 'decrease' && <TrendingDown className="inline-block w-3 h-3" />}
                     {change}
                </p>
            }
        </div>
         {description && <p className="text-xs text-muted-foreground mt-1 text-center">{description}</p>}
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
    }>({
        totalConversions: 0,
        totalCalculations: 0,
        totalDateCalculations: 0,
        savedNotes: 0,
        recycledNotes: 0,
        favoriteConversions: 0,
        activity: [],
    });
    const [streakData, setStreakData] = useState<StreakData>({
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
    const [showAllStats, setShowAllStats] = useState(false);


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


    useEffect(() => {
        const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
        
        const unsub = listenToUserData(userEmail, (userData) => {
            const processed = processUserDataForStats(userData, userEmail);
            setStats(processed);
            
            // Recalculate streak based on latest visit history
            getStreakData(userEmail).then(setStreakData);
        });

        loadLastActivities();

        const handleStorageChange = () => {
            loadLastActivities();
        }
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            unsub();
            window.removeEventListener('storage', handleStorageChange);
        }
    }, []);
    
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
    
    const allStatCards = [
        { 
            title: "Total Conversions", 
            value: stats.totalConversions,
            icon: <RefreshCw className="text-indigo-500 w-4 h-4"/>,
            change: `${conversionsStats.percent > 0 ? '+' : ''}${conversionsStats.percent.toFixed(1)}% vs prev day`,
            changeType: conversionsStats.change > 0 ? 'increase' : (conversionsStats.change < 0 ? 'decrease' : 'neutral'),
        },
        { 
            title: "Calculator Ops", 
            value: stats.totalCalculations,
            icon: <Calculator className="text-green-500 w-4 h-4"/>,
            change: `${calculationsStats.percent > 0 ? '+' : ''}${calculationsStats.percent.toFixed(1)}% vs prev day`,
            changeType: calculationsStats.change > 0 ? 'increase' : (calculationsStats.change < 0 ? 'decrease' : 'neutral'),
        },
        { 
            title: "Date Calculations", 
            value: stats.totalDateCalculations,
            icon: <CalendarIcon className="text-orange-500 w-4 h-4"/>,
            change: `${dateCalcStats.percent > 0 ? '+' : ''}${dateCalcStats.percent.toFixed(1)}% vs prev day`,
            changeType: dateCalcStats.change > 0 ? 'increase' : (dateCalcStats.change < 0 ? 'decrease' : 'neutral'),
        },
        { 
            title: "Current Streak", 
            value: `${streakData.currentStreak} days`,
            icon: <Flame className="text-red-500 w-4 h-4"/>,
        },
        { 
            title: "Best Streak", 
            value: `${streakData.bestStreak} days`,
            icon: <CheckCircle className="text-yellow-500 w-4 h-4"/>,
        },
        {
            title: "Days Since Last Visit",
            value: `${streakData.daysNotOpened} days`,
            icon: <EyeOff className="text-gray-500 w-4 h-4" />,
        },
        { 
            title: "Saved Notes", 
            value: stats.savedNotes,
            icon: <NotebookPen className="text-blue-500 w-4 h-4"/>,
        },
        { 
            title: "Recycle Bin", 
            value: stats.recycledNotes,
            icon: <Trash2 className="text-gray-500 w-4 h-4"/>,
        },
        { 
            title: "Favorite Conversions", 
            value: stats.favoriteConversions,
            icon: <Star className="text-pink-500 w-4 h-4"/>,
        }
    ];

    const visibleStatCards = showAllStats ? allStatCards : allStatCards.slice(0, 6);
    
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
                <CardHeader>
                    <CardTitle>Overview</CardTitle>
                    <CardDescription>A complete overview of all your stats.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {visibleStatCards.map((cardProps, index) => (
                            <StatCard key={index} {...cardProps} />
                        ))}
                    </div>
                    {allStatCards.length > 6 && (
                        <div className="flex justify-center mt-4">
                            <Button variant="outline" onClick={() => setShowAllStats(!showAllStats)}>
                                {showAllStats ? 'Show Less' : 'Show More'}
                                <ChevronDown className={cn("ml-2 h-4 w-4 transition-transform", showAllStats && "rotate-180")} />
                            </Button>
                        </div>
                    )}
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
