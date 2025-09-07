

"use client";

import { format, eachDayOfInterval, subDays } from 'date-fns';
import { updateUserData, getUserData } from '@/services/firestore';
import { NOTES_STORAGE_KEY_BASE, type Note } from '@/components/notepad';

const getUserNotesKey = (email: string | null) => email ? `${email}_${NOTES_STORAGE_KEY_BASE}` : `guest_${NOTES_STORAGE_KEY_BASE}`;

const incrementStat = async (field: 'totalConversions' | 'totalCalculations' | 'totalDateCalculations') => {
    const userEmail = typeof window !== 'undefined' ? (localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null) : null;
    if (!userEmail) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    
    // We can't just increment, we need to read the current value first.
    const userData = await getUserData(userEmail);

    const dataToUpdate: {[key: string]: any} = {};

    // Increment total count
    dataToUpdate[field] = (userData[field] || 0) + 1;

    // Increment daily count
    const dailyField = `daily${field.charAt(10).toUpperCase()}${field.slice(11)}`; // e.g., dailyConversions
    const dailyData = userData[dailyField] || {};
    dailyData[today] = (dailyData[today] || 0) + 1;
    dataToUpdate[dailyField] = dailyData;
    
    await updateUserData(userEmail, dataToUpdate);
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
