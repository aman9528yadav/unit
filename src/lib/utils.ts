

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { eachDayOfInterval, subDays, format, getMonth, getYear } from 'date-fns';
import { getUserData, updateUserData } from "@/services/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CALCULATION_STORAGE_KEY = 'dailyCalculations';
const NOTE_STORAGE_KEY = 'dailyNotes';


export type DailyData = {
    [date: string]: number; // date string 'YYYY-MM-DD'
}

const getDataForDays = async (storageKey: string, email: string | null): Promise<DailyData> => {
    const userData = await getUserData(email);
    return userData?.[storageKey] || {};
};

const getWeeklyData = async (storageKey: string, email: string | null): Promise<{ name: string; value: number }[]> => {
    const data = await getDataForDays(storageKey, email);
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

const getMonthlyData = async (storageKey: string, email: string | null): Promise<{ name: string; value: number }[]> => {
    const data = await getDataForDays(storageKey, email);
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


const incrementTodaysCount = async (storageKey: string) => {
    const storedProfile = localStorage.getItem('userProfile');
    const email = storedProfile ? JSON.parse(storedProfile).email : null;
    const today = getTodayString();
    
    // Get the current local data to increment it.
    const data = await getDataForDays(storageKey, email);
    const currentCount = data[today] || 0;
    
    // The data to update is just the increment for today.
    // The sync logic will handle adding this to Firestore's value.
    const updateData = {
        [storageKey]: {
            [today]: 1 // We just update by 1
        }
    };
    
    await updateUserData(email, updateData);
};


const getAllTimeData = async (storageKey: string, email: string | null): Promise<number> => {
    const data = await getDataForDays(storageKey, email);
    return Object.values(data).reduce((total, count) => total + count, 0);
};

const getTodaysData = async (storageKey: string, email: string | null): Promise<number> => {
    const data = await getDataForDays(storageKey, email);
    return data[getTodayString()] || 0;
};


// --- General Calculations ---
export const incrementTodaysCalculations = () => incrementTodaysCount(CALCULATION_STORAGE_KEY);
export const getTodaysCalculations = (email: string | null): Promise<number> => getTodaysData(CALCULATION_STORAGE_KEY, email);
export const getWeeklyCalculations = (email: string | null) => getWeeklyData(CALCULATION_STORAGE_KEY, email);
export const getMonthlyCalculations = (email: string | null) => getMonthlyData(CALCULATION_STORAGE_KEY, email);
export const getAllTimeCalculations = (email: string | null): Promise<number> => getAllTimeData(CALCULATION_STORAGE_KEY, email);


// --- Note-specific Tracking ---
export const incrementTodaysNotes = () => incrementTodaysCount(NOTE_STORAGE_KEY);
export const getWeeklyNotes = (email: string | null) => getWeeklyData(NOTE_STORAGE_KEY, email);
export const getMonthlyNotes = (email: string | null) => getMonthlyData(NOTE_STORAGE_KEY, email);
export const getAllTimeNotes = (email: string | null): Promise<number> => getAllTimeData(NOTE_STORAGE_KEY, email);
