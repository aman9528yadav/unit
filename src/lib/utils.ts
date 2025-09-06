
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
const NOTE_STORAGE_KEY = 'dailyNotes';


type DailyData = {
    [date: string]: number; // date string 'YYYY-MM-DD'
}

const getDataForDays = (storageKey: string, email: string | null): DailyData => {
    if (typeof window === 'undefined') return {};
    const storedData = localStorage.getItem(getUserKey(storageKey, email));
    return storedData ? JSON.parse(storedData) : {};
};

const getWeeklyData = (storageKey: string, email: string | null): { name: string; value: number }[] => {
    const data = getDataForDays(storageKey, email);
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

const getMonthlyData = (storageKey: string, email: string | null): { name: string; value: number }[] => {
    const data = getDataForDays(storageKey, email);
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
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());
};


const incrementTodaysCount = (storageKey: string) => {
    if (typeof window === 'undefined') return;
    
    const storedProfile = localStorage.getItem('userProfile');
    const email = storedProfile ? JSON.parse(storedProfile).email : null;
    
    const today = getTodayString();
    const userKey = getUserKey(storageKey, email);
    const data = getDataForDays(storageKey, email);
    
    data[today] = (data[today] || 0) + 1;
    
    localStorage.setItem(userKey, JSON.stringify(data));
    window.dispatchEvent(new StorageEvent('storage', { key: userKey, newValue: JSON.stringify(data) }));
};

const getAllTimeData = (storageKey: string, email: string | null): number => {
    const data = getDataForDays(storageKey, email);
    return Object.values(data).reduce((total, count) => total + count, 0);
};

// --- General Calculations ---
export const incrementTodaysCalculations = () => incrementTodaysCount(CALCULATION_STORAGE_KEY);
export const getTodaysCalculations = (email: string | null): number => getDataForDays(CALCULATION_STORAGE_KEY, email)[getTodayString()] || 0;
export const getWeeklyCalculations = (email: string | null) => getWeeklyData(CALCULATION_STORAGE_KEY, email);
export const getMonthlyCalculations = (email: string | null) => getMonthlyData(CALCULATION_STORAGE_KEY, email);
export const getAllTimeCalculations = (email: string | null): number => getAllTimeData(CALCULATION_STORAGE_KEY, email);


// --- Note-specific Tracking ---
export const incrementTodaysNotes = () => incrementTodaysCount(NOTE_STORAGE_KEY);
export const getWeeklyNotes = (email: string | null) => getWeeklyData(NOTE_STORAGE_KEY, email);
export const getMonthlyNotes = (email: string | null) => getMonthlyData(NOTE_STORAGE_KEY, email);
export const getAllTimeNotes = (email: string | null): number => getAllTimeData(NOTE_STORAGE_KEY, email);
