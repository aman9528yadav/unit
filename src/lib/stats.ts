

"use client";

import { format, eachDayOfInterval, subDays } from 'date-fns';
import { updateUserData, getUserData, rtdb } from '@/services/firestore';
import { NOTES_STORAGE_KEY_BASE, type Note } from '@/components/notepad';
import { ref, runTransaction } from 'firebase/database';

const getUserNotesKey = (email: string | null) => email ? `${email}_${NOTES_STORAGE_KEY_BASE}` : `guest_${NOTES_STORAGE_KEY_BASE}`;

const incrementStat = async (field: 'totalConversions' | 'totalCalculations' | 'totalDateCalculations') => {
    const userEmail = typeof window !== 'undefined' ? (localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null) : null;
    if (!userEmail) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    const dailyField = `daily${field.charAt(10).toUpperCase()}${field.slice(11)}`;

    const sanitizedEmail = userEmail.replace(/[.#$[\]]/g, '_');
    const userRef = ref(rtdb, `users/${sanitizedEmail}`);

    // Use a transaction to safely increment both total and daily counts
    await runTransaction(userRef, (currentUserData) => {
        if (currentUserData) {
            // Increment total count
            currentUserData[field] = (currentUserData[field] || 0) + 1;
            
            // Increment daily count
            if (!currentUserData[dailyField]) {
                currentUserData[dailyField] = {};
            }
            currentUserData[dailyField][today] = (currentUserData[dailyField][today] || 0) + 1;
        } else {
            // If user data doesn't exist, create it
            return {
                [field]: 1,
                [dailyField]: {
                    [today]: 1
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

    const dailyConversions = userData.dailyConversions || {};
    const dailyCalculations = userData.dailyCalculations || {};
    const dailyDateCalculations = userData.dailyDateCalculations || {};

    const totalConversions = userData.totalConversions || 0;
    const totalCalculations = userData.totalCalculations || 0;
    const totalDateCalculations = userData.totalDateCalculations || 0;

    const todaysOps = (dailyConversions[today] || 0) + (dailyCalculations[today] || 0) + (dailyDateCalculations[today] || 0);
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
            const conversions = dailyConversions[dateString] || 0;
            const calculations = dailyCalculations[dateString] || 0;
            const dateCalcs = dailyDateCalculations[dateString] || 0;
            
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
