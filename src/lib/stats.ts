

"use client";

import { format, eachDayOfInterval, subDays } from 'date-fns';
import { updateUserData, getUserData } from '@/services/firestore';
import { NOTES_STORAGE_KEY_BASE, type Note } from '@/components/notepad';
import { ref, runTransaction } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

const getUserNotesKey = (email: string | null) => email ? `${email}_${NOTES_STORAGE_KEY_BASE}` : `guest_${NOTES_STORAGE_KEY_BASE}`;

const incrementStat = async (field: 'totalConversions' | 'totalCalculations' | 'totalDateCalculations') => {
    const userEmail = typeof window !== 'undefined' ? (localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null) : null;
    if (!userEmail) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const sanitizedEmail = userEmail.replace(/[.#$[\]]/g, '_');
    
    // Construct paths for total and daily stats
    const totalStatRef = ref(rtdb, `users/${sanitizedEmail}/${field}`);
    const dailyStatRef = ref(rtdb, `users/${sanitizedEmail}/dailyStats/${today}/${field}`);

    // Use transactions to safely increment both counts
    await runTransaction(totalStatRef, (currentValue) => (currentValue || 0) + 1);
    await runTransaction(dailyStatRef, (currentValue) => (currentValue || 0) + 1);
};


export const incrementConversionCount = () => {
    incrementStat('totalConversions');
};

export const incrementCalculationCount = () => {
    incrementStat('totalCalculations');
};

export const incrementDateCalculationCount = () => {
    incrementStat('totalDateCalculations');
};


export interface DailyActivity {
    date: string;
    conversions: number;
    calculations: number;
    dateCalculations: number;
    total: number;
}

export const processUserDataForStats = (userData: any, email: string | null): {
    todaysOps: number;
    totalOps: number;
    savedNotes: number;
    recycledNotes: number;
    favoriteConversions: number;
    activity: DailyActivity[];
    totalConversions: number;
    totalCalculations: number;
    totalDateCalculations: number;
} => {
    if (!userData) {
        userData = {};
    }
    const today = format(new Date(), 'yyyy-MM-dd');

    const dailyStats = userData.dailyStats || {};
    const todaysDailyStats = dailyStats[today] || {};

    const totalConversions = userData.totalConversions || 0;
    const totalCalculations = userData.totalCalculations || 0;
    const totalDateCalculations = userData.totalDateCalculations || 0;

    const todaysOps = (todaysDailyStats.totalConversions || 0) + (todaysDailyStats.totalCalculations || 0) + (todaysDailyStats.totalDateCalculations || 0);
    const totalOps = totalConversions + totalCalculations + totalDateCalculations;

    // Get note stats from localStorage (remains local)
    const notesKey = getUserNotesKey(email);
    const notesData = typeof window !== 'undefined' ? localStorage.getItem(notesKey) : null;
    const notes: Note[] = notesData ? JSON.parse(notesData) : [];
    const savedNotes = notes.filter(note => !note.deletedAt).length;
    const recycledNotes = notes.filter(note => !!note.deletedAt).length;

    // Get favorite stats from localStorage (remains local)
    const favoritesData = typeof window !== 'undefined' ? localStorage.getItem('favoriteConversions') : null;
    const favoriteConversions = favoritesData ? JSON.parse(favoritesData).length : 0;


    // Prepare activity based on date range
    const activity: DailyActivity[] = [];
    
    const interval = {
        start: subDays(new Date(), 6),
        end: new Date(),
    }
    
    if (interval.start && interval.end) {
         const daysInInterval = eachDayOfInterval(interval);
         daysInInterval.forEach(day => {
            const dateString = format(day, 'yyyy-MM-dd');
            const dayStats = dailyStats[dateString] || {};
            const conversions = dayStats.totalConversions || 0;
            const calculations = dayStats.totalCalculations || 0;
            const dateCalcs = dayStats.totalDateCalculations || 0;
            
            activity.push({ 
                date: dateString, 
                conversions,
                calculations,
                dateCalculations: dateCalcs,
                total: conversions + calculations + dateCalcs
            });
         })
    }


    return { 
        todaysOps, 
        totalOps, 
        savedNotes,
        recycledNotes,
        favoriteConversions,
        activity,
        totalConversions,
        totalCalculations,
        totalDateCalculations
    };
};


export const getStats = async (email: string | null) => {
    const userData = await getUserData(email);
    return processUserDataForStats(userData, email);
};

