
"use client";

import React, { useCallback, useEffect, useState } from "react";
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
  ChevronDown,
  PieChart as PieChartIcon,
  MoreVertical
} from "lucide-react";
import { addDays, format, formatDistanceToNow, parseISO, isValid, subDays } from "date-fns";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DailyActivity, processUserDataForStats, TopFeature } from "@/lib/stats";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ComposedChart, Bar as RechartsBar, Legend, Sector, AreaChart, Area } from "recharts";
import { useLanguage } from "@/context/language-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { getStreakData, StreakData } from "@/lib/streak";
import { cn } from "@/lib/utils";
import { listenToUserData, UserData } from "@/services/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useRouter } from "next/navigation";


type ChartType = "bar" | "line" | "area";
type TimeRangePreset = "weekly" | "monthly" | "yearly";

interface LastActivityItem {
    name: string;
    details: string;
    timestamp: string;
    icon: React.ElementType;
}

export function Analytics() {
    const { t } = useLanguage();
    const router = useRouter();
    const [stats, setStats] = useState({
        totalConversions: 0,
        totalCalculations: 0,
        totalDateCalculations: 0,
        savedNotes: 0,
        recycledNotes: 0,
        favoriteConversions: 0,
        activity: [] as DailyActivity[],
        todaysOps: 0,
        totalOps: 0
    });
    const [streakData, setStreakData] = useState<StreakData>({
        currentStreak: 0,
        bestStreak: 0,
        daysNotOpened: 0,
    });
    
    const [dateFilter, setDateFilter] = useState<TimeRangePreset>("weekly");
    const [lastActivities, setLastActivities] = useState<LastActivityItem[]>([]);
    const [showAllStats, setShowAllStats] = useState(false);
    const [chartType, setChartType] = useState<ChartType>('bar');
    const [activeIndex, setActiveIndex] = useState(0);

    const loadLastActivities = useCallback((userData: UserData) => {
        const conversionHistory = userData.conversionHistory || [];
        const localActivities: (LastActivityItem | null)[] = [
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

        const lastConversion = conversionHistory[0];
        if (lastConversion) {
             const [details, category, timestamp] = lastConversion.split('|');
             localActivities.push({ name: 'Unit Conversion', details, timestamp, icon: RefreshCw });
        }

        const sortedActivities = localActivities
            .filter((a): a is LastActivityItem => a !== null && a.timestamp !== undefined && isValid(parseISO(a.timestamp)))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        setLastActivities(sortedActivities);
    }, []);

    const filterActivityData = (activity: DailyActivity[], filter: TimeRangePreset): DailyActivity[] => {
        const today = new Date();
        let startDate: Date;
        if (filter === 'weekly') {
            startDate = subDays(today, 6);
        } else if (filter === 'monthly') {
            startDate = subDays(today, 29);
        } else { // yearly
            startDate = subDays(today, 364);
        }
        return activity.filter(d => parseISO(d.date) >= startDate);
    };

    useEffect(() => {
        const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
        
        const unsub = listenToUserData(userEmail, (userData) => {
            if (userData) {
                const processed = processUserDataForStats(userData, userEmail);
                setStats(processed as any);
                
                if (userEmail) {
                    getStreakData(userEmail).then(setStreakData);
                }
                
                loadLastActivities(userData);
            }
        });
        
        const handleStorageChange = (e: StorageEvent) => {
            if (['lastCalculation', 'lastNote', 'lastDateCalc', 'lastTimer', 'lastStopwatch'].includes(e.key || '')) {
                listenToUserData(userEmail, (userData) => {
                    if (userData) loadLastActivities(userData);
                });
            }
        }
        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            unsub();
            window.removeEventListener('storage', handleStorageChange);
        }
    }, [loadLastActivities]);
    
    const calculateChange = (key: 'conversions' | 'calculations' | 'dateCalculations' | 'notes' | 'total') => {
        if (stats.activity.length < 2) {
            return { today: 0, yesterday: 0, change: 0, percent: 0, changeType: 'neutral' as const };
        }
        const today = stats.activity[stats.activity.length - 1]?.[key] || 0;
        const yesterday = stats.activity[stats.activity.length - 2]?.[key] || 0;
        const change = today - yesterday;
        const percent = yesterday === 0 ? (change > 0 ? 100 : 0) : (change / yesterday) * 100;
        const changeType = change > 0 ? 'increase' : change < 0 ? 'decrease' : 'neutral';
        return { today, yesterday, change, percent, changeType };
    };

    const conversionsStats = calculateChange("conversions");
    const calculationsStats = calculateChange("calculations");
    const dateCalcStats = calculateChange("dateCalculations");
    const notesStats = calculateChange("notes");
    
    const statCards = [
        { title: "Total Conversions", value: stats.totalConversions, sub: `${conversionsStats.percent > 0 ? '+' : ''}${conversionsStats.percent.toFixed(0)}% vs prev day`, type: conversionsStats.changeType },
        { title: "Calculator Ops", value: stats.totalCalculations, sub: `${calculationsStats.percent > 0 ? '+' : ''}${calculationsStats.percent.toFixed(0)}% vs prev day`, type: calculationsStats.changeType },
        { title: "Date Calculations", value: stats.totalDateCalculations, sub: `${dateCalcStats.percent > 0 ? '+' : ''}${dateCalcStats.percent.toFixed(0)}% vs prev day`, type: dateCalcStats.changeType },
        { title: "Current Streak", value: `${streakData.currentStreak} days`, sub: `Best Streak: ${streakData.bestStreak} days` },
        { title: "Saved Notes", value: stats.savedNotes, sub: `${notesStats.change > 0 ? '+' : ''}${notesStats.change} vs prev day`, type: notesStats.changeType },
        { title: "Recycle Bin", value: stats.recycledNotes, sub: "Items in bin" },
        { title: "Favorite Conversions", value: stats.favoriteConversions, sub: "Your top conversions" },
    ];
    
    const chartData = filterActivityData(stats.activity, dateFilter).map(day => ({
        ...day,
        day: dateFilter === 'weekly' ? format(parseISO(day.date), 'EEE') 
           : dateFilter === 'monthly' ? format(parseISO(day.date), 'd')
           : format(parseISO(day.date), 'MMM')
    }));

    const renderChart = () => {
        switch (chartType) {
            case "line": return (
                <LineChart data={chartData}>
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="conversions" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="notes" stroke="hsl(var(--accent))" strokeWidth={2} />
                    <Line type="monotone" dataKey="dateCalculations" stroke="hsl(var(--secondary))" strokeWidth={2} />
                </LineChart>
            );
            case "area": return (
                <AreaChart data={chartData}>
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Area type="monotone" dataKey="conversions" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                    <Area type="monotone" dataKey="notes" stackId="1" stroke="hsl(var(--accent))" fill="hsl(var(--accent) / 0.2)" />
                    <Area type="monotone" dataKey="dateCalculations" stackId="1" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.2)" />
                </AreaChart>
            );
            case "bar": default: return (
                <ComposedChart data={chartData}>
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <RechartsBar dataKey="conversions" fill="hsl(var(--primary))" barSize={30} />
                    <RechartsBar dataKey="notes" fill="hsl(var(--accent))" barSize={30} />
                    <RechartsBar dataKey="dateCalculations" fill="hsl(var(--secondary))" barSize={30} />
                    <Line type="monotone" dataKey="conversions" stroke="hsl(var(--destructive))" strokeWidth={3} dot={false} />
                </ComposedChart>
            );
        }
    };
    
    const activityPieData = [
        { name: 'Conversions', value: stats.totalConversions },
        { name: 'Date Calcs', value: stats.totalDateCalculations },
        { name: 'Calculator Ops', value: stats.totalCalculations },
        { name: 'Notes', value: stats.savedNotes },
    ].filter(item => item.value > 0);
    
    const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "#a5b4fc"];

    const onPieEnter = useCallback((_: any, index: number) => {
        setActiveIndex(index);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-background p-4 overflow-x-hidden">
            <div className="max-w-md mx-auto space-y-6 pb-10 w-full">
                <div className="flex justify-between items-center sticky top-0 bg-background/70 backdrop-blur z-10 py-2">
                    <h1 className="text-2xl font-bold text-primary">Analytics</h1>
                    <Button variant="secondary" className="rounded-xl shadow-md" onClick={() => router.push('/')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                    {(showAllStats ? statCards : statCards.slice(0, 4)).map((item, i) => (
                        <Card key={i} className="bg-white shadow-sm border-0 rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-gray-700 flex justify-between items-center">
                                    {item.title}
                                    {item.type === 'decrease' ? (
                                        <TrendingDown className="h-4 w-4 text-red-500" />
                                    ) : item.type === 'increase' ? (
                                        <TrendingUp className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <MoreVertical className="h-4 w-4 text-gray-400" />
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xl font-bold text-gray-900">{item.value}</p>
                                <p className="text-xs text-gray-500">{item.sub}</p>
                            </CardContent>
                        </Card>
                    ))}
                </motion.div>

                {!showAllStats && (
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllStats(true)}
                            className="rounded-full text-purple-600 border-purple-300"
                        >
                            Show More
                        </Button>
                    </div>
                )}
                
                 {showAllStats && (
                    <div className="flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllStats(false)}
                            className="rounded-full text-purple-600 border-purple-300"
                        >
                            Show Less
                        </Button>
                    </div>
                )}

                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Usage Trend</CardTitle>
                        <div className="flex gap-2 flex-wrap pt-2">
                             <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as TimeRangePreset)}>
                                <SelectTrigger className="text-sm border rounded-md px-2 py-1 h-auto">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                    <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                             </Select>
                            <Button size="sm" variant={chartType === "bar" ? "default" : "outline"} onClick={() => setChartType("bar")}>Bar</Button>
                            <Button size="sm" variant={chartType === "line" ? "default" : "outline"} onClick={() => setChartType("line")}>Line</Button>
                            <Button size="sm" variant={chartType === "area" ? "default" : "outline"} onClick={() => setChartType("area")}>Area</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="h-72 overflow-x-auto">
                        <div className="min-w-[600px] h-64">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={chartType + dateFilter}
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -30 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full h-full"
                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        {renderChart()}
                                    </ResponsiveContainer>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Activity Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-60">
                        <ResponsiveContainer width="100%" height="80%">
                            <PieChart>
                                <Pie
                                    data={activityPieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={70}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                >
                                    {activityPieData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap justify-center gap-3 mt-2">
                            {activityPieData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1 text-xs text-gray-600">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                                    {entry.name} ({((entry.value / activityPieData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(0)}%)
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                
                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Week-over-Week Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Conversions</span>
                            <span className={`text-sm font-bold ${conversionsStats.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {conversionsStats.change >= 0 ? `+${conversionsStats.change}` : conversionsStats.change}
                            </span>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Calculator</span>
                            <span className={`text-sm font-bold ${calculationsStats.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {calculationsStats.change >= 0 ? `+${calculationsStats.change}` : calculationsStats.change}
                            </span>
                        </div>
                         <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Date Calcs</span>
                            <span className={`text-sm font-bold ${dateCalcStats.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {dateCalcStats.change >= 0 ? `+${dateCalcStats.change}` : dateCalcStats.change}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm border-0 rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Last Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                         {lastActivities.length > 0 ? lastActivities.map((activity, index) => {
                            if (!isValid(parseISO(activity.timestamp))) return null;
                            return (
                                <div key={index} className="p-3 bg-gradient-to-r from-purple-50 via-pink-50 to-white rounded-lg shadow-sm">
                                    <p className="font-medium text-gray-800 text-sm">{activity.name}</p>
                                    <p className="text-xs text-gray-500">{formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true })}</p>
                                </div>
                            )
                        }) : (
                            <p className="text-center text-muted-foreground py-8">No recent activity recorded.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
