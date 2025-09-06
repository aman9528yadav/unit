
"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Timer,
  Sigma,
  NotebookPen,
  Search,
  ChevronDown,
  PieChart as PieChartIcon,
  Lightbulb
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getWeeklyCalculations, getMonthlyCalculations, getTodaysCalculations, getAllTimeCalculations } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { useRouter } from "next/navigation";


const topOperations = [
    { name: "Date Calc", icon: Timer, count: 42, lastUsed: "Sep 5, 2025", trend: 5 },
    { name: "Smart Search", icon: Search, count: 35, lastUsed: "Sep 4, 2025", trend: -2 },
    { name: "Notes", icon: NotebookPen, count: 28, lastUsed: "Sep 3, 2025", trend: 8 },
    { name: "Converter", icon: Sigma, count: 19, lastUsed: "Sep 5, 2025", trend: 3 },
];

const timeTrackingData = [
  { name: 'Converter', value: 400, color: 'hsl(var(--chart-1))' },
  { name: 'Calculator', value: 300, color: 'hsl(var(--chart-2))' },
  { name: 'Notes', value: 300, color: 'hsl(var(--chart-3))' },
  { name: 'Time Tools', value: 200, color: 'hsl(var(--chart-4))' },
];


export function Analytics() {
  const [isClient, setIsClient] = useState(false);
  const [weeklyCalculations, setWeeklyCalculations] = useState<{name: string; value: number}[]>([]);
  const [monthlyCalculations, setMonthlyCalculations] = useState<{name: string; value: number}[]>([]);
  const { t } = useLanguage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('weekly');
  const [toolFilter, setToolFilter] = useState('all');

   useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    const userEmail = storedProfile ? JSON.parse(storedProfile).email : null;
    setWeeklyCalculations(getWeeklyCalculations(userEmail));
    setMonthlyCalculations(getMonthlyCalculations(userEmail));
  }, []);

  const chartData = activeTab === 'weekly' ? weeklyCalculations : monthlyCalculations;

  if (!isClient) {
      return null; // Or return a skeleton loader
  }
  
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
        <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                 <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <BarChart3 />
                    </div>
                    <h1 className="text-xl font-bold">Dashboard Analytics</h1>
                </div>
            </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Extended Graphs Panel</CardTitle>
                        <CardDescription>Visualize your productivity over time.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <div className="flex justify-between items-center mb-4">
                                <TabsList>
                                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                                    <TabsTrigger value="custom" disabled>Custom Range</TabsTrigger>
                                </TabsList>
                                <Select value={toolFilter} onValueChange={setToolFilter}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Filter Tool"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Tools</SelectItem>
                                        <SelectItem value="calc">Calculator</SelectItem>
                                        <SelectItem value="notes">Notes</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <TabsContent value="weekly">
                                 <div className="h-80 w-full">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                                          <defs>
                                            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                          </defs>
                                          <CartesianGrid vertical={false} strokeOpacity={0.1} stroke="hsl(var(--border))" />
                                          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                          <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                          <Tooltip
                                            cursor={{ strokeDasharray: '3 3', fill: 'hsl(var(--muted))' }}
                                            contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} 
                                          />
                                          <Area type="monotone" dataKey="value" strokeWidth={2} stroke="hsl(var(--primary))" fill="url(#fill)" />
                                        </AreaChart>
                                      </ResponsiveContainer>
                                </div>
                            </TabsContent>
                             <TabsContent value="monthly">
                                 <div className="h-80 w-full">
                                      <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                                          <defs>
                                            <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                            </linearGradient>
                                          </defs>
                                          <CartesianGrid vertical={false} strokeOpacity={0.1} stroke="hsl(var(--border))" />
                                          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                          <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                          <Tooltip
                                            cursor={{ strokeDasharray: '3 3', fill: 'hsl(var(--muted))' }}
                                            contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} 
                                          />
                                          <Area type="monotone" dataKey="value" strokeWidth={2} stroke="hsl(var(--primary))" fill="url(#fill)" />
                                        </AreaChart>
                                      </ResponsiveContainer>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Top Operations Snapshot</CardTitle>
                        <CardDescription>Your most frequently used tools.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tool Name</TableHead>
                                    <TableHead className="text-center">Usage Count</TableHead>
                                    <TableHead className="text-right">Last Used</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topOperations.map((op) => (
                                    <TableRow key={op.name}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <op.icon className="h-5 w-5 text-muted-foreground"/>
                                                {op.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                {op.count}
                                                {op.trend > 0 ? <TrendingUp className="h-4 w-4 text-green-500"/> : <TrendingDown className="h-4 w-4 text-red-500"/>}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">{op.lastUsed}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {/* Sidebar column */}
            <div className="lg:col-span-1 flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Time Tracking Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <div className="h-48 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={timeTrackingData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {timeTrackingData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2">
                            {timeTrackingData.map((entry) => (
                                <div key={entry.name} className="flex items-center gap-2 text-sm">
                                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }}/>
                                    <span>{entry.name}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
                 <Card className="bg-secondary">
                    <CardContent className="p-6">
                        <p className="text-center font-semibold text-foreground">"You spent <span className="text-primary">1h 12m</span> on productivity tools today"</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex-row items-center gap-3 space-y-0">
                         <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                            <Lightbulb />
                        </div>
                        <CardTitle>Insights Box</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">"Most active between 9–11 AM. Consider scheduling key tasks here."</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
