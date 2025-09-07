
"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  FileText,
  Calculator,
  Download,
  Calendar,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getStats, type DailyActivity } from "@/lib/stats";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useLanguage } from "@/context/language-context";

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
        weeklyActivity: DailyActivity[];
        monthlyActivity: DailyActivity[];
    }>({
        totalConversions: 0,
        totalCalculations: 0,
        totalDateCalculations: 0,
        weeklyActivity: [],
        monthlyActivity: [],
    });
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    const loadStats = useCallback(async () => {
        const userEmail = localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null;
        const fetchedStats = await getStats(userEmail);
        setStats(fetchedStats);

        // Create a mock recent activity list from stats for demonstration
        const activity = fetchedStats.weeklyActivity.flatMap(day => [
             { type: "Conversion", detail: `${day.conversions} conversions`, date: day.date },
             { type: "Date Calc", detail: `${day.dateCalculations} calculations`, date: day.date },
        ]).filter(item => item.detail.startsWith('0') === false).slice(0, 5);
        setRecentActivity(activity);

    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);


    const calculateChange = (key: 'conversions' | 'calculations' | 'dateCalculations') => {
        if (stats.weeklyActivity.length < 2) {
            return { today: 0, yesterday: 0, change: 0, percent: 0 };
        }
        const today = stats.weeklyActivity[stats.weeklyActivity.length - 1][key];
        const yesterday = stats.weeklyActivity[stats.weeklyActivity.length - 2][key];
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

    return (
        <div className="p-6 grid gap-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight">📊 Analytics Dashboard</h1>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl shadow-sm"><Calendar className="mr-2 h-4 w-4" /> Date Range</Button>
              <Button className="rounded-xl shadow-sm"><Download className="mr-2 h-4 w-4" /> Export</Button>
            </div>
          </div>
    
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Total Conversions</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-extrabold text-indigo-600">{stats.totalConversions}</p>
                <p className={`text-sm font-medium ${conversionsStats.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {conversionsStats.change >= 0 ? "🔼" : "🔽"} {Math.abs(conversionsStats.percent).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
    
            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Calculator Ops</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-extrabold text-green-600">{stats.totalCalculations}</p>
                 <p className={`text-sm font-medium ${calculationsStats.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {calculationsStats.change >= 0 ? "🔼" : "🔽"} {Math.abs(calculationsStats.percent).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
    
            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Date Calculations</CardTitle></CardHeader>
              <CardContent>
                <p className="text-4xl font-extrabold text-orange-600">{stats.totalDateCalculations}</p>
                <p className={`text-sm font-medium ${dateCalcStats.change >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {dateCalcStats.change >= 0 ? "🔼" : "🔽"} {Math.abs(dateCalcStats.percent).toFixed(1)}%
                </p>
              </CardContent>
            </Card>
    
            <Card className="rounded-2xl shadow-md hover:shadow-lg transition">
              <CardHeader><CardTitle>Total Operations</CardTitle></CardHeader>
              <CardContent><p className="text-4xl font-extrabold text-gray-700">{stats.totalConversions + stats.totalCalculations + stats.totalDateCalculations}</p></CardContent>
            </Card>
          </div>
    
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Line Chart */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader><CardTitle>Daily Usage Trend</CardTitle></CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.weeklyActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" tickFormatter={(str) => new Date(str).toLocaleDateString('en-us', { weekday: 'short' })}/>
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line type="monotone" dataKey="conversions" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} name="Conversions" />
                    <Line type="monotone" dataKey="calculations" stroke="#22c55e" strokeWidth={3} dot={{ r: 5 }} name="Calculator"/>
                    <Line type="monotone" dataKey="dateCalculations" stroke="#f97316" strokeWidth={3} dot={{ r: 5 }} name="Date Calcs"/>
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
    
            {/* Pie Chart */}
            <Card className="rounded-2xl shadow-md">
              <CardHeader><CardTitle>Feature Usage Share</CardTitle></CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={featureShare} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                      {featureShare.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
    
          {/* Recent Activity Preview */}
          <Card className="rounded-2xl shadow-md">
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="py-2 px-4">Type</th>
                      <th className="py-2 px-4">Detail</th>
                      <th className="py-2 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((activity, index) => (
                      <tr key={index} className="border-b last:border-0 hover:bg-gray-50 transition">
                        <td className="py-2 px-4 flex items-center gap-2 font-medium">
                          {getActivityIcon(activity.type)} {activity.type}
                        </td>
                        <td className="py-2 px-4">{activity.detail}</td>
                        <td className="py-2 px-4 text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      );
}


    