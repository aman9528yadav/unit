
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { eachDayOfInterval, subDays, format, getMonth, getYear } from 'date-fns';

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
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CALCULATION_STORAGE_KEY = 'dailyCalculations';

type DailyCalculationData = {
    [date: string]: number; // date string 'YYYY-MM-DD'
}

export function getAllTimeCalculations(email: string | null): number {
    if (typeof window === 'undefined') return 0;
    
    const storedData = localStorage.getItem(getUserKey(CALCULATION_STORAGE_KEY, email));
    if (!storedData) {
        return 0;
    }
    try {
        const data: DailyCalculationData = JSON.parse(storedData);
        // Sum all the values in the object
        return Object.values(data).reduce((total, count) => total + count, 0);
    } catch (error) {
        console.error("Error parsing daily calculation data from localStorage", error);
        return 0;
    }
}

export function getMonthlyCalculations(email: string | null): { name: string; value: number }[] {
    if (typeof window === 'undefined') return [];

    const storedData = localStorage.getItem(getUserKey(CALCULATION_STORAGE_KEY, email));
    const data: DailyCalculationData = storedData ? JSON.parse(storedData) : {};

    const monthlyTotals: { [month: string]: number } = {};

    for (const dateStr in data) {
        const [year, month] = dateStr.split('-');
        const monthKey = `${year}-${month}`; // e.g., "2024-07"
        if (!monthlyTotals[monthKey]) {
            monthlyTotals[monthKey] = 0;
        }
        monthlyTotals[monthKey] += data[dateStr];
    }

    return Object.entries(monthlyTotals)
        .map(([monthKey, value]) => {
            const [year, month] = monthKey.split('-');
            const date = new Date(Number(year), Number(month) - 1);
            return { name: format(date, 'MMM yyyy'), value };
        })
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()); // Sort by month
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
    // Format the key for lookup in the same local format
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDateKey = `${year}-${month}-${day}`;

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
