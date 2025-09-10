

"use client";

import { format, eachDayOfInterval, subDays } from 'date-fns';
import { updateUserData, getUserData } from '@/services/firestore';
import { type Note } from '@/components/notepad';
import { ref, runTransaction } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

const getGuestKey = (key: string) => `guest_${key}`;

const getGuestStats = () => {
    if (typeof window === 'undefined') return {};
    const stats = localStorage.getItem(getGuestKey('stats'));
    return stats ? JSON.parse(stats) : {};
};

const setGuestStats = (stats: any) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(getGuestKey('stats'), JSON.stringify(stats));
    window.dispatchEvent(new StorageEvent('storage', { key: getGuestKey('stats') }));
};

const incrementStat = async (field: 'totalConversions' | 'totalCalculations' | 'totalDateCalculations' | 'notes') => {
    const userEmail = typeof window !== 'undefined' ? (localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null) : null;
    const today = format(new Date(), 'yyyy-MM-dd');

    if (!userEmail) {
        // Guest user logic
        const stats = getGuestStats();
        
        stats[field] = (stats[field] || 0) + 1;
        
        if (!stats.dailyStats) stats.dailyStats = {};
        if (!stats.dailyStats[today]) stats.dailyStats[today] = {};
        
        stats.dailyStats[today][field] = (stats.dailyStats[today][field] || 0) + 1;

        setGuestStats(stats);
        return;
    }

    // Logged-in user logic
    const sanitizedEmail = userEmail.replace(/[.#$[\]]/g, '_');
    
    // Use a transaction to safely increment both total and daily counts
    const userRef = ref(rtdb, `users/${sanitizedEmail}`);
    await runTransaction(userRef, (currentUserData) => {
        if (currentUserData) {
            // Increment total count
            currentUserData[field] = (currentUserData[field] || 0) + 1;
            
            // Initialize dailyStats if it doesn't exist
            if (!currentUserData.dailyStats) {
                currentUserData.dailyStats = {};
            }
            // Initialize today's stats if it doesn't exist
            if (!currentUserData.dailyStats[today]) {
                currentUserData.dailyStats[today] = {};
            }
            // Increment today's count
            currentUserData.dailyStats[today][field] = (currentUserData.dailyStats[today][field] || 0) + 1;

        } else {
             // If user data doesn't exist, create it
            currentUserData = {
                [field]: 1,
                dailyStats: {
                    [today]: {
                        [field]: 1
                    }
                }
            };
        }
        return currentUserData;
    });
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
    notes: number;
    total: number;
}

export type TopFeature = 'Converter' | 'Calculator' | 'Date Calcs';

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
    totalHistory: number;
    topFeature: TopFeature;
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
    
    const conversionHistory = userData.conversionHistory || [];
    const calculationHistory = userData.calculationHistory || [];
    const totalHistory = conversionHistory.length + calculationHistory.length;

    const todaysConversions = todaysDailyStats.totalConversions || 0;
    const todaysCalculations = todaysDailyStats.totalCalculations || 0;
    const todaysDateCalcs = todaysDailyStats.totalDateCalculations || 0;
    const todaysNotes = todaysDailyStats.notes || 0;

    const todaysOps = todaysConversions + todaysCalculations + todaysDateCalcs + todaysNotes;
    const totalOps = totalConversions + totalCalculations + totalDateCalculations + (userData.notes?.length || 0);

    // Get note stats from user data
    const notes: Note[] = userData.notes || [];
    const savedNotes = notes.filter(note => !note.deletedAt).length;
    const recycledNotes = notes.filter(note => !!note.deletedAt).length;

    // Get favorite stats
    const favoriteConversions = (userData.favoriteConversions || []).length;


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
            const notesEdited = dayStats.notes || 0;
            
            activity.push({ 
                date: dateString, 
                conversions,
                calculations,
                dateCalculations: dateCalcs,
                notes: notesEdited,
                total: conversions + calculations + dateCalcs + notesEdited,
            });
         })
    }

    // Determine top feature
    let topFeature: TopFeature = 'Converter';
    if (totalCalculations > totalConversions && totalCalculations > totalDateCalculations) {
        topFeature = 'Calculator';
    } else if (totalDateCalculations > totalConversions && totalDateCalculations > totalCalculations) {
        topFeature = 'Date Calcs';
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
        totalDateCalculations,
        totalHistory,
        topFeature
    };
};


export const getStats = async (email: string | null) => {
    const userData = await getUserData(email);
    return processUserDataForStats(userData, email);
};
