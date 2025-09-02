import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
}

const CALCULATION_STORAGE_KEY = 'dailyCalculations';

type DailyCalculationData = {
    date: string;
    count: number;
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
    if (data.date === today) {
      return data.count;
    }
  } catch (error) {
    console.error("Error parsing daily calculation data from localStorage", error);
    return 0;
  }
  return 0; // if date is not today or data is corrupted
}

export function incrementTodaysCalculations() {
  if (typeof window === 'undefined') return;

  const today = getTodayString();
  let count = 1;

  const storedData = localStorage.getItem(CALCULATION_STORAGE_KEY);
  if (storedData) {
    try {
      const data: DailyCalculationData = JSON.parse(storedData);
      if (data.date === today) {
        count = data.count + 1;
      }
    } catch (error) {
       console.error("Error parsing daily calculation data from localStorage", error);
    }
  }

  const newData: DailyCalculationData = { date: today, count: count };
  localStorage.setItem(CALCULATION_STORAGE_KEY, JSON.stringify(newData));

  // Dispatch a storage event so other tabs can update
  window.dispatchEvent(new StorageEvent('storage', {
    key: CALCULATION_STORAGE_KEY,
    newValue: JSON.stringify(newData),
  }));
}
