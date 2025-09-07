import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { getUserData, updateUserData } from "@/services/firestore";
import { format, subDays } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


const getTodayDateString = () => format(new Date(), 'yyyy-MM-dd');

export async function incrementTodaysCalculations() {
    const today = getTodayDateString();
    
    // We assume the user is logged in if their profile exists in localStorage
    const storedProfile = typeof window !== 'undefined' ? localStorage.getItem('userProfile') : null;
    const email = storedProfile ? JSON.parse(storedProfile).email : null;

    const userData = await getUserData(email);
    
    const dailyCalculations = userData.dailyCalculations || {};
    dailyCalculations[today] = (dailyCalculations[today] || 0) + 1;
    
    await updateUserData(email, { dailyCalculations });
}


export async function getTodaysCalculations(email: string | null): Promise<number> {
    const today = getTodayDateString();
    const userData = await getUserData(email);
    return userData.dailyCalculations?.[today] || 0;
}

export async function getWeeklyCalculations(email: string | null): Promise<{ name: string; value: number }[]> {
    const userData = await getUserData(email);
    const dailyCalculations = userData.dailyCalculations || {};
    const weeklyData = [];

    for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateString = format(date, 'yyyy-MM-dd');
        const dayName = format(date, 'EEE');
        weeklyData.push({
            name: dayName,
            value: dailyCalculations[dateString] || 0,
        });
    }
    return weeklyData;
}

export async function getAllTimeCalculations(email: string | null): Promise<number> {
    const userData = await getUserData(email);
    const dailyCalculations = userData.dailyCalculations || {};
    return Object.values(dailyCalculations).reduce((sum: number, count: any) => sum + count, 0);
}


export async function getAllTimeNotes(email: string | null): Promise<number> {
    const userData = await getUserData(email);
    // Assuming notes are stored in a structure within userData
    return userData.notes?.length || 0;
}
