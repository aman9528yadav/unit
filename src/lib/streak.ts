
import { format, differenceInCalendarDays, subDays, parseISO } from 'date-fns';

const STREAK_STORAGE_KEY_BASE = 'userVisitHistory';

export interface StreakData {
    currentStreak: number;
    bestStreak: number;
    daysNotOpened: number;
}

const getUserStreakKey = (email: string) => `${email}_${STREAK_STORAGE_KEY_BASE}`;

// Ensure window is defined before accessing localStorage
const getVisits = (email: string): string[] => {
    if (typeof window === 'undefined') {
        return [];
    }
    const storedVisits = localStorage.getItem(getUserStreakKey(email));
    return storedVisits ? JSON.parse(storedVisits) : [];
};

const setVisits = (visits: string[], email: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(getUserStreakKey(email), JSON.stringify(visits));
    }
};

export const recordVisit = (email?: string | null) => {
    if (!email) return;
    const visits = getVisits(email);
    const today = format(new Date(), 'yyyy-MM-dd');
    if (!visits.includes(today)) {
        const updatedVisits = [...visits, today];
        setVisits(updatedVisits, email);
    }
};

export const getStreakData = (email?: string | null): StreakData => {
    if (!email) {
         return { currentStreak: 0, bestStreak: 0, daysNotOpened: 0 };
    }

    const visits = getVisits(email);
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

    if (lastVisit && (differenceInCalendarDays(today, lastVisit) === 0 || differenceInCalendarDays(today, lastVisit) === 1)) {
        currentStreak = 1;
        for (let i = visitDates.length - 2; i >= 0; i--) {
            if (differenceInCalendarDays(visitDates[i + 1], visitDates[i]) === 1) {
                currentStreak++;
            } else {
                break;
            }
        }
        // If last visit was not today, the streak might be broken
        if (differenceInCalendarDays(today, lastVisit) > 1) {
             currentStreak = 0;
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
