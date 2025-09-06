

import { format, differenceInCalendarDays, subDays, parseISO } from 'date-fns';
import { getUserData, updateUserData } from '@/services/firestore';

const STREAK_STORAGE_KEY_BASE = 'userVisitHistory';


export interface StreakData {
    currentStreak: number;
    bestStreak: number;
    daysNotOpened: number;
}

const getVisits = async (email: string): Promise<string[]> => {
    const userData = await getUserData(email);
    return userData?.[STREAK_STORAGE_KEY_BASE] || [];
};

const setVisits = async (visits: string[], email: string) => {
    await updateUserData(email, { [STREAK_STORAGE_KEY_BASE]: visits });
};

export const recordVisit = async (email?: string | null) => {
    if (!email) return;
    
    const visits = await getVisits(email);
    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (!visits.includes(today)) {
        const updatedVisits = [...new Set([...visits, today])];
        await setVisits(updatedVisits, email);
    }
};


export const getStreakData = async (email?: string | null): Promise<StreakData> => {
    if (!email) {
         return { currentStreak: 0, bestStreak: 0, daysNotOpened: 0 };
    }

    const visits = await getVisits(email);
    if (visits.length === 0) {
        return { currentStreak: 0, bestStreak: 0, daysNotOpened: 0 };
    }

    const uniqueSortedVisits = [...new Set(visits)].sort();
    const visitDates = uniqueSortedVisits.map(v => parseISO(v));

    let currentStreak = 0;
    let bestStreak = 0;
    let currentBest = 0;

    // Calculate Best Streak
    if (visitDates.length > 0) {
        currentBest = 1;
        bestStreak = 1;
        for (let i = 1; i < visitDates.length; i++) {
            if (differenceInCalendarDays(visitDates[i], visitDates[i - 1]) === 1) {
                currentBest++;
            } else {
                currentBest = 1;
            }
            if (currentBest > bestStreak) {
                bestStreak = currentBest;
            }
        }
    }

    // Calculate Current Streak
    const today = new Date();
    const lastVisit = visitDates[visitDates.length - 1];

    if (lastVisit) {
        const daysSinceLastVisit = differenceInCalendarDays(today, lastVisit);

        if (daysSinceLastVisit <= 1) {
            currentStreak = 1;
            for (let i = visitDates.length - 2; i >= 0; i--) {
                if (differenceInCalendarDays(visitDates[i + 1], visitDates[i]) === 1) {
                    currentStreak++;
                } else {
                    break;
                }
            }
            if (daysSinceLastVisit > 1) {
                currentStreak = 0;
            }
        }
    }
    
    // If today hasn't been recorded yet, and yesterday was part of the streak, the streak is maintained.
    const todayStr = format(today, 'yyyy-MM-dd');
    if (!visits.includes(todayStr) && currentStreak === 0 && visits.length > 0) {
       const yesterday = subDays(today, 1);
       const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
       if(visits.includes(yesterdayStr)) {
            // Recalculate streak as if today was visited
            const tempStreakData = await getStreakData(email);
            currentStreak = tempStreakData.currentStreak;
       }
    }


    // Calculate Days Not Opened
    const firstVisit = visitDates[0];
    const totalDaysSinceStart = differenceInCalendarDays(today, firstVisit) + 1;
    const daysNotOpened = totalDaysSinceStart - visitDates.length;

    return {
        currentStreak,
        bestStreak,
        daysNotOpened: Math.max(0, daysNotOpened), // Ensure it's not negative
    };
};
