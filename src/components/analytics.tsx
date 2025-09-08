

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
  ChevronDown,
  PieChart as PieChartIcon
} from "lucide-react";
import { addDays, format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DailyActivity, processUserDataForStats } from "@/lib/stats";
import { LineChart, Line, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart as RechartsBarChart, Legend, Sector } from "recharts";
import { useLanguage } from "@/context/language-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { getStreakData, StreakData } from "@/lib/streak";
import { cn } from "@/lib/utils";
import { listenToUserData, UserData } from "@/services/firestore";


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

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 6) * cos;
  const sy = cy + (outerRadius + 6) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 12;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold text-lg">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 4}
        outerRadius={outerRadius + 8}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="hsl(var(--foreground))" className="text-sm">{`${value} ops`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" className="text-xs">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


export function Analytics() {
    const { t } = useLanguage();
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
    
    const [timeRange, setTimeRange] = useState<TimeRangePreset>("weekly");
    const [chartType, setChartType] = useState<ChartType>("bar");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: addDays(new Date(), -6),
        to: new Date(),
    });
    const [lastActivities, setLastActivities] = useState<LastActivityItem[]>([]);
    const [showAllStats, setShowAllStats] = useState(false);
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
            .sort((a, b) => {
                const dateA = new Date(a.timestamp).getTime();
                const dateB = new Date(b.timestamp).getTime();
                return dateB - dateA;
            });

        setLastActivities(sortedActivities);
    }, []);


    useEffect(() => {
        const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
        
        const unsub = listenToUserData(userEmail, (userData) => {
            if (userData) {
                const processed = processUserDataForStats(userData, userEmail);
                setStats(processed);
                
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

    const pieChartData = [
        { name: 'Conversions', value: stats.totalConversions },
        { name: 'Date Calcs', value: stats.totalDateCalculations },
        { name: 'Notes', value: stats.savedNotes },
    ];
    
    const PIE_COLORS = ['#06b6d4', '#ec4899', '#8b5cf6'];
    
    const onPieEnter = useCallback((_: any, index: number) => {
        setActiveIndex(index);
    }, []);


    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight">📊 {t('analytics.title')}</h1>
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
                    <div className="grid grid-cols-2 gap-4">
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
                                <TabsTrigger value="weekly">{t('analytics.weekly')}</TabsTrigger>
                                <TabsTrigger value="monthly">{t('analytics.monthly')}</TabsTrigger>
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
                    <CardTitle className="flex items-center gap-2"><PieChartIcon /> Activity Breakdown</CardTitle>
                    <CardDescription>A percentage breakdown of your most common activities.</CardDescription>
                </CardHeader>
                <CardContent className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                activeIndex={activeIndex}
                                activeShape={renderActiveShape}
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                fill="#8884d8"
                                dataKey="value"
                                onMouseEnter={onPieEnter}
                                paddingAngle={5}
                            >
                                {pieChartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                             <Legend />
                        </PieChart>
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
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold">{activity.name}</p>
                                        <p className="text-sm text-muted-foreground break-words">{activity.details}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground whitespace-nowrap self-start">
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

