

"use client";

import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { getUserData, updateUserData } from '@/services/firestore';

export interface StreakData {
    currentStreak: number;
    bestStreak: number;
    daysNotOpened: number;
}

const getGuestKey = (key: string) => `guest_${key}`;
const getTodayDateString = () => format(new Date(), 'yyyy-MM-dd');

/**
 * Records a visit for the current day for a given user.
 * @param email - The user's email or null for guests.
 */
export async function recordVisit(email: string | null) {
    const today = getTodayDateString();
    
    if (!email) {
        const key = getGuestKey('userVisitHistory');
        const historyStr = localStorage.getItem(key);
        const visitHistory: string[] = historyStr ? JSON.parse(historyStr) : [];
        if (!visitHistory.includes(today)) {
            const updatedHistory = [...visitHistory, today].slice(-365);
            localStorage.setItem(key, JSON.stringify(updatedHistory));
        }
        return;
    }
    
    const userData = await getUserData(email);
    const visitHistory: string[] = userData.userVisitHistory || [];
    
    if (!visitHistory.includes(today)) {
        const updatedHistory = [...visitHistory, today].slice(-365); // Keep last year of visits
        await updateUserData(email, { userVisitHistory: updatedHistory });
    }
}

/**
 * Calculates the user's current and best streak from their visit history.
 * @param email - The user's email or null for guests.
 * @returns An object containing the current streak, best streak, and days since last visit.
 */
export async function getStreakData(email: string | null): Promise<StreakData> {
    let visitHistory: string[] = [];

    if (!email) {
         const key = getGuestKey('userVisitHistory');
         const historyStr = localStorage.getItem(key);
         visitHistory = historyStr ? JSON.parse(historyStr) : [];
    } else {
        const userData = await getUserData(email);
        visitHistory = userData.userVisitHistory || [];
    }


    if (visitHistory.length === 0) {
        return { currentStreak: 0, bestStreak: 0, daysNotOpened: 0 };
    }
    
    // Sort dates to ensure they are in chronological order
    const sortedDates = visitHistory.map(d => parseISO(d)).sort((a, b) => a.getTime() - b.getTime());
    
    let currentStreak = 0;
    let bestStreak = 0;

    if (sortedDates.length > 0) {
        // Check if the last visit was today or yesterday to determine current streak
        const today = new Date();
        const lastVisit = sortedDates[sortedDates.length - 1];
        if (differenceInCalendarDays(today, lastVisit) <= 1) {
            currentStreak = 1;
            for (let i = sortedDates.length - 1; i > 0; i--) {
                const diff = differenceInCalendarDays(sortedDates[i], sortedDates[i - 1]);
                if (diff === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
        }
        
        // Calculate best streak
        let longestStreak = 0;
        if (sortedDates.length > 0) {
            longestStreak = 1;
            let currentLongest = 1;
            for (let i = 1; i < sortedDates.length; i++) {
                if (differenceInCalendarDays(sortedDates[i], sortedDates[i-1]) === 1) {
                    currentLongest++;
                } else {
                    longestStreak = Math.max(longestStreak, currentLongest);
                    currentLongest = 1;
                }
            }
            bestStreak = Math.max(longestStreak, currentLongest);
        }
    }
    
    const daysNotOpened = differenceInCalendarDays(new Date(), sortedDates[sortedDates.length - 1]);

    const data = { currentStreak, bestStreak, daysNotOpened };
    
    // Save the calculated streaks back to user data for potential other uses if logged in
    if(email) {
        await updateUserData(email, { streakData: data });
    }

    return data;
}
