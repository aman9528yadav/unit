
"use client";

import { format, startOfWeek, startOfMonth } from 'date-fns';
import { updateUserData, getUserData } from '@/services/firestore';
import { NOTES_STORAGE_KEY_BASE, type Note } from '@/components/notepad';

const getUserNotesKey = (email: string | null) => email ? `${email}_${NOTES_STORAGE_KEY_BASE}` : `guest_${NOTES_STORAGE_KEY_BASE}`;

const incrementStat = async (field: 'totalConversions' | 'totalCalculations' | 'totalDateCalculations', dailyField: 'dailyConversions' | 'dailyCalculations' | 'dailyDateCalculations') => {
    const userEmail = typeof window !== 'undefined' ? (localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null) : null;
    const today = format(new Date(), 'yyyy-MM-dd');

    const userData = await getUserData(userEmail);
    
    const currentTotal = userData[field] || 0;
    const dailyData = userData[dailyField] || {};
    const todaysCount = dailyData[today] || 0;

    const dataToUpdate = {
        [field]: currentTotal + 1,
        [dailyField]: {
            ...dailyData,
            [today]: todaysCount + 1
        }
    };
    
    await updateUserData(userEmail, dataToUpdate);
};

export const incrementConversionCount = () => {
    incrementStat('totalConversions', 'dailyConversions');
};

export const incrementCalculationCount = () => {
    incrementStat('totalCalculations', 'dailyCalculations');
};

export const incrementDateCalculationCount = () => {
    incrementStat('totalDateCalculations', 'dailyDateCalculations');
};


export interface DailyActivity {
    date: string;
    conversions: number;
    calculations: number;
    dateCalculations: number;
    total: number;
}

export const getStats = async (email: string | null): Promise<{
    todaysOps: number;
    totalOps: number;
    savedNotes: number;
    weeklyActivity: DailyActivity[];
    monthlyActivity: DailyActivity[];
    totalConversions: number;
    totalCalculations: number;
    totalDateCalculations: number;
}> => {
    const userData = await getUserData(email);
    const today = format(new Date(), 'yyyy-MM-dd');

    const dailyConversions = userData.dailyConversions || {};
    const dailyCalculations = userData.dailyCalculations || {};
    const dailyDateCalculations = userData.dailyDateCalculations || {};

    const totalConversions = userData.totalConversions || 0;
    const totalCalculations = userData.totalCalculations || 0;
    const totalDateCalculations = userData.totalDateCalculations || 0;

    const todaysOps = (dailyConversions[today] || 0) + (dailyCalculations[today] || 0) + (dailyDateCalculations[today] || 0);
    const totalOps = totalConversions + totalCalculations + totalDateCalculations;

    const notesKey = getUserNotesKey(email);
    const notesData = typeof window !== 'undefined' ? localStorage.getItem(notesKey) : null;
    const notes: Note[] = notesData ? JSON.parse(notesData) : [];
    const savedNotes = notes.filter(note => !note.deletedAt).length;

    // Prepare weekly activity
    const weeklyActivity: DailyActivity[] = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = format(date, 'yyyy-MM-dd');
        
        const conversions = dailyConversions[dateString] || 0;
        const calculations = dailyCalculations[dateString] || 0;
        const dateCalcs = dailyDateCalculations[dateString] || 0;
        
        weeklyActivity.push({ 
            date: dateString, 
            conversions,
            calculations,
            dateCalculations: dateCalcs,
            total: conversions + calculations + dateCalcs
        });
    }

    // Prepare monthly activity
    const monthlyActivity: DailyActivity[] = [];
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const daysInMonth = now.getDate();

    for (let i = 0; i < daysInMonth; i++) {
        const date = new Date(firstDayOfMonth);
        date.setDate(date.getDate() + i);
        const dateString = format(date, 'yyyy-MM-dd');

        const conversions = dailyConversions[dateString] || 0;
        const calculations = dailyCalculations[dateString] || 0;
        const dateCalcs = dailyDateCalculations[dateString] || 0;

        monthlyActivity.push({
            date: dateString,
            conversions,
            calculations,
            dateCalculations: dateCalcs,
            total: conversions + calculations + dateCalcs
        });
    }

    return { 
        todaysOps, 
        totalOps, 
        savedNotes, 
        weeklyActivity,
        monthlyActivity,
        totalConversions,
        totalCalculations,
        totalDateCalculations
    };
};
