
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { eachDayOfInterval, subDays, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const getUserKey = (key: string, email: string | null) => {
    if (typeof window === 'undefined') return key; // Should not happen in client-side code
    
    // If email is provided (logged-in user), create a user-specific key.
    // Otherwise, create a generic key for guest users.
    const prefix = email || 'guest';
    return `${prefix}_${key}`;
};


const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
}

const CALCULATION_STORAGE_KEY = 'dailyCalculations';

type DailyCalculationData = {
    [date: string]: number; // date string 'YYYY-MM-DD'
}

export function getWeeklyCalculations(email: string | null): { name: string; value: number }[] {
  if (typeof window === 'undefined') {
    return Array(7).fill(0).map((_, i) => {
      const date = subDays(new Date(), 6 - i);
      return { name: format(date, 'MMM d'), value: 0 };
    });
  }

  const storedData = localStorage.getItem(getUserKey(CALCULATION_STORAGE_KEY, email));
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

export function getTodaysCalculations(email: string | null): number {
  if (typeof window === 'undefined') return 0;
  
  const storedData = localStorage.getItem(getUserKey(CALCULATION_STORAGE_KEY, email));
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

  const storedProfile = localStorage.getItem('userProfile');
  const email = storedProfile ? JSON.parse(storedProfile).email : null;

  const today = getTodayString();
  const userKey = getUserKey(CALCULATION_STORAGE_KEY, email);
  const storedData = localStorage.getItem(userKey);
  
  let data: DailyCalculationData = {};
  if (storedData) {
    try {
      data = JSON.parse(storedData);
    } catch (error) {
       console.error("Error parsing daily calculation data from localStorage", error);
    }
  }

  data[today] = (data[today] || 0) + 1;
  
  localStorage.setItem(userKey, JSON.stringify(data));

  // Dispatch a storage event so other tabs can update
  window.dispatchEvent(new StorageEvent('storage', {
    key: userKey,
    newValue: JSON.stringify(data),
  }));
}
