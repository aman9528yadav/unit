

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { eachDayOfInterval, subDays, format, getMonth, getYear } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CALCULATION_STORAGE_KEY = 'dailyCalculations';
export const NOTE_STORAGE_KEY = 'dailyNotes';


export type DailyData = {
    [date: string]: number; // date string 'YYYY-MM-DD'
}

export const getWeeklyData = (data: DailyData | undefined) => {
    data = data || {};
    const today = new Date();
    const weekAgo = subDays(today, 6);
    const last7Days = eachDayOfInterval({ start: weekAgo, end: today });
    
    const allTime = Object.values(data).reduce((total, count) => total + count, 0);
    const todayCount = data[format(today, 'yyyy-MM-dd')] || 0;

    const weekly = last7Days.map(date => {
        const formattedDateKey = format(date, 'yyyy-MM-dd');
        const dayName = format(date, 'MMM d');
        return {
          name: dayName,
          value: data?.[formattedDateKey] || 0,
        };
    });
    
     const monthly = Object.entries(
        Object.entries(data).reduce((acc, [dateStr, count]) => {
            const monthKey = format(new Date(dateStr), 'MMM yyyy');
            acc[monthKey] = (acc[monthKey] || 0) + count;
            return acc;
        }, {} as Record<string, number>)
    )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());


    return {
      todayCalculations: todayCount,
      allTimeCalculations: allTime,
      allTimeNotes: allTime, // Re-using for notes context
      weeklyCalculations: weekly,
      monthlyCalculations: monthly,
      weeklyNotes: weekly, // Re-using for notes context
      monthlyNotes: monthly, // Re-using for notes context
    }
}
