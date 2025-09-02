import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { eachDayOfInterval, subDays, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
}

const CALCULATION_STORAGE_KEY = 'dailyCalculations';

type DailyCalculationData = {
    [date: string]: number; // date string 'YYYY-MM-DD'
}

export function getWeeklyCalculations(): { name: string; value: number }[] {
  if (typeof window === 'undefined') {
    return Array(7).fill(0).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      return { name: format(date, 'MMM d'), value: 0 };
    });
  }

  const storedData = localStorage.getItem(CALCULATION_STORAGE_KEY);
  const data: DailyCalculationData = storedData ? JSON.parse(storedData) : {};
  
  const today = new Date();
  const weekAgo = subDays(today, 6);
  
  const last7Days = eachDayOfInterval({ start: weekAgo, end: today });
  
  return last7Days.map(date => {
    const formattedDateKey = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'MMM d');
    return {
      name: dayName,
      value: data[formattedDateKey] || 0,
    };
  });
}

export function getTodaysCalculations(): number {
  if (typeof window === 'undefined') return 0;
  
  const storedData = localStorage.getItem(CALCULATION_STORAGE_KEY);
  if (!storedData) {
    return 0;
  }
  try {
    const data: DailyCalculationData = JSON.parse(storedData);
    const today = getTodayString();
    return data[today] || 0;
  } catch (error) {
    console.error("Error parsing daily calculation data from localStorage", error);
    return 0;
  }
}

export function incrementTodaysCalculations() {
  if (typeof window === 'undefined') return;

  const today = getTodayString();
  const storedData = localStorage.getItem(CALCULATION_STORAGE_KEY);
  
  let data: DailyCalculationData = {};
  if (storedData) {
    try {
      data = JSON.parse(storedData);
    } catch (error) {
       console.error("Error parsing daily calculation data from localStorage", error);
    }
  }

  data[today] = (data[today] || 0) + 1;
  
  localStorage.setItem(CALCULATION_STORAGE_KEY, JSON.stringify(data));

  // Dispatch a storage event so other tabs can update
  window.dispatchEvent(new StorageEvent('storage', {
    key: CALCULATION_STORAGE_KEY,
    newValue: JSON.stringify(data),
  }));
}
