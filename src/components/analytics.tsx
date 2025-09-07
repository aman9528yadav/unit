

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
  Star
} from "lucide-react";
import { addDays, format } from "date-fns";
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

type ChartType = "bar" | "line";
type TimeRangePreset = "weekly" | "monthly" | "yearly";


const getActivityIcon = (type: string) => {
    switch (type) {
      case "Conversion":
        return <RefreshCw className="text-indigo-500" size={18} />;
      case "Note":
        return <FileText className="text-green-500" size={18} />;
      case "Date Calc":
        return <Calculator className="text-orange-500" size={18} />;
      default:
        return null;
    }
};


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
    }, [loadStats]);
    
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight">📊 Analytics Dashboard</h1>
            <Button asChild>
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
            </Button>
          </div>
    
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Total Conversions</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-extrabold text-indigo-600">{stats.totalConversions}</p>
                <p className={`text-sm font-medium ${conversionsStats.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {conversionsStats.change >= 0 ? <TrendingUp className="inline-block w-4 h-4" /> : <TrendingDown className="inline-block w-4 h-4" />} {Math.abs(conversionsStats.percent).toFixed(1)}% vs previous day
                </p>
              </CardContent>
            </Card>
    
            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Calculator Ops</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-extrabold text-green-600">{stats.totalCalculations}</p>
                 <p className={`text-sm font-medium ${calculationsStats.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {calculationsStats.change >= 0 ? <TrendingUp className="inline-block w-4 h-4" /> : <TrendingDown className="inline-block w-4 h-4" />} {Math.abs(calculationsStats.percent).toFixed(1)}% vs previous day
                </p>
              </CardContent>
            </Card>
    
            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Date Calculations</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-extrabold text-orange-600">{stats.totalDateCalculations}</p>
                <p className={`text-sm font-medium ${dateCalcStats.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {dateCalcStats.change >= 0 ? <TrendingUp className="inline-block w-4 h-4" /> : <TrendingDown className="inline-block w-4 h-4" />} {Math.abs(dateCalcStats.percent).toFixed(1)}% vs previous day
                </p>
              </CardContent>
            </Card>
    
            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Total Operations</CardTitle></CardHeader>
              <CardContent><p className="text-4xl font-extrabold text-gray-700">{stats.totalConversions + stats.totalCalculations + stats.totalDateCalculations}</p></CardContent>
            </Card>

            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Current Streak</CardTitle></CardHeader>
              <CardContent><p className="text-4xl font-extrabold text-red-500 flex items-center gap-2"><Flame /> {stats.currentStreak} days</p></CardContent>
            </Card>
            
            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Best Streak</CardTitle></CardHeader>
              <CardContent><p className="text-4xl font-extrabold text-yellow-500 flex items-center gap-2"><CheckCircle /> {stats.bestStreak} days</p></CardContent>
            </Card>

            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Saved Notes</CardTitle></CardHeader>
              <CardContent><p className="text-4xl font-extrabold text-blue-500 flex items-center gap-2"><NotebookPen /> {stats.savedNotes}</p></CardContent>
            </Card>
            
            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Recycle Bin</CardTitle></CardHeader>
              <CardContent><p className="text-4xl font-extrabold text-gray-500 flex items-center gap-2"><Trash2 /> {stats.recycledNotes}</p></CardContent>
            </Card>

            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Favorite Conversions</CardTitle></CardHeader>
              <CardContent><p className="text-4xl font-extrabold text-pink-500 flex items-center gap-2"><Star /> {stats.favoriteConversions}</p></CardContent>
            </Card>
          </div>
    
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
        </div>
      );
}
