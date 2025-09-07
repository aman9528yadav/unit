
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Activity,
  ArrowRightLeft,
  Calculator,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getStats, type DailyActivity } from "@/lib/stats";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useLanguage } from "./language-context";

type ChartType = "bar" | "line";
type TimeRange = "weekly" | "monthly";

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="p-4">
        <CardHeader className="flex flex-row items-center justify-between p-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="p-0">
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const chartConfig = {
      conversions: { label: "Conversions", color: "hsl(var(--chart-1))" },
      calculations: { label: "Calculator", color: "hsl(var(--chart-2))" },
      dateCalculations: { label: "Date Calcs", color: "hsl(var(--chart-3))" },
};

export function Analytics() {
    const { t } = useLanguage();
    const [stats, setStats] = useState<{
        totalOps: number;
        totalConversions: number;
        totalCalculations: number;
        totalDateCalculations: number;
        weeklyActivity: DailyActivity[];
        monthlyActivity: DailyActivity[];
    }>({
        totalOps: 0,
        totalConversions: 0,
        totalCalculations: 0,
        totalDateCalculations: 0,
        weeklyActivity: [],
        monthlyActivity: [],
    });
    const [chartType, setChartType] = useState<ChartType>("bar");
    const [timeRange, setTimeRange] = useState<TimeRange>("weekly");
    
    const chartData = timeRange === 'weekly' ? stats.weeklyActivity : stats.monthlyActivity;
    const formattedChartData = chartData.map(item => ({
        ...item,
        date: format(new Date(item.date), timeRange === 'weekly' ? "EEE" : "dd")
    }));

    const loadStats = useCallback(async () => {
        const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
        const fetchedStats = await getStats(userEmail);
        setStats(fetchedStats);
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const ChartComponent = chartType === 'bar' ? BarChart : LineChart;
    const ChartElement = chartType === 'bar' ? Bar : Line;

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
            <header className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/">
                        <ArrowLeft />
                    </Link>
                </Button>
                <h1 className="text-xl font-bold">{t('analytics.title')}</h1>
            </header>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title={t('analytics.totalOps')} value={stats.totalOps} icon={TrendingUp} />
                <StatCard title={t('analytics.conversions')} value={stats.totalConversions} icon={ArrowRightLeft} />
                <StatCard title={t('analytics.calculator')} value={stats.totalCalculations} icon={Calculator} />
                <StatCard title={t('analytics.dateCalcs')} value={stats.totalDateCalculations} icon={Calendar} />
            </div>
            
             <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>{t('analytics.activityChart')}</CardTitle>
                        <CardDescription>
                            {timeRange === 'weekly' ? t('analytics.last7Days') : t('analytics.thisMonth')}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="weekly">{t('analytics.weekly')}</SelectItem>
                                <SelectItem value="monthly">{t('analytics.monthly')}</SelectItem>
                            </SelectContent>
                        </Select>
                         <Select value={chartType} onValueChange={(v) => setChartType(v as ChartType)}>
                            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bar">{t('analytics.bar')}</SelectItem>
                                <SelectItem value="line">{t('analytics.line')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-64 w-full">
                        <ChartComponent data={formattedChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                           <CartesianGrid vertical={false} strokeDasharray="3 3"/>
                           <XAxis dataKey="date" tickLine={false} axisLine={false} />
                           <YAxis tickLine={false} axisLine={false} />
                           <ChartTooltip 
                            content={<ChartTooltipContent />}
                           />
                           <ChartElement dataKey="conversions" fill="var(--color-conversions)" radius={chartType === 'bar' ? 4 : 0} stackId="a" />
                           <ChartElement dataKey="calculations" fill="var(--color-calculations)" radius={chartType === 'bar' ? 4 : 0} stackId="a" />
                           <ChartElement dataKey="dateCalculations" fill="var(--color-dateCalculations)" radius={chartType === 'bar' ? 4 : 0} stackId="a" />
                        </ChartComponent>
                    </ChartContainer>
                </CardContent>
             </Card>

        </div>
    );
}
