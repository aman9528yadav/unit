

"use client";

import { db, rtdb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, set as setRealtimeDb, onValue, remove as removeRealtimeDb, get, update } from "firebase/database";
import type { AppNotification } from '@/lib/notifications';
import { FAQ, defaultFaqs } from '@/components/help';
import { merge } from 'lodash';
import { v4 as uuidv4 } from 'uuid';


// --- HOW TO USE PAGE ---
export interface HowToUseFeature {
    id: string;
    title: string;
    description: string;
    icon: string;
}

export const defaultFeatures: HowToUseFeature[] = [
    {
      id: uuidv4(),
      title: 'Converter',
      description: 'Use the smart search or manual inputs to convert units across various categories.',
      icon: 'Sigma',
    },
    {
      id: uuidv4(),
      title: 'Calculator',
      description: 'Perform basic and scientific calculations with a clean and simple interface.',
      icon: 'Calculator',
    },
    {
      id: uuidv4(),
      title: 'Notepad',
      description: 'Jot down notes, format text, and even attach images. Your notes are saved to your account.',
      icon: 'NotebookText',
    },
];


export async function setHowToUseFeaturesInRtdb(features: HowToUseFeature[]) {
    try {
        const featuresRef = ref(rtdb, 'app-content/howToUseFeatures');
        await setRealtimeDb(featuresRef, features);
    } catch (error) {
        console.error("Error saving HowToUse features to RTDB:", error);
        throw error;
    }
}

export function listenToHowToUseFeaturesFromRtdb(callback: (features: HowToUseFeature[]) => void) {
    const featuresRef = ref(rtdb, 'app-content/howToUseFeatures');
    return onValue(featuresRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        } else {
            callback(defaultFeatures);
        }
    }, (error) => {
        console.error("Error listening to HowToUse features from RTDB:", error);
        callback(defaultFeatures);
    });
}


// --- Santize email for RTDB path ---
const sanitizeEmail = (email: string) => email.replace(/[.#$[\]]/g, '_');


// --- HELP/FAQ PAGE ---
export async function setFaqsInRtdb(faqs: FAQ[]) {
    try {
        const faqsRef = ref(rtdb, 'app-content/faqs');
        await setRealtimeDb(faqsRef, faqs);
    } catch (error) {
        console.error("Error saving FAQs to RTDB:", error);
        throw error;
    }
}

export function listenToFaqsFromRtdb(callback: (faqs: FAQ[]) => void) {
    const faqsRef = ref(rtdb, 'app-content/faqs');
    return onValue(faqsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        } else {
            callback(defaultFaqs);
        }
    }, (error) => {
        console.error("Error listening to FAQs from RTDB:", error);
        callback(defaultFaqs);
    });
}


// --- USER EVENTS (FIRESTORE) ---
export interface UserEvent {
    email: string;
    name: string;
    type: 'login' | 'signup';
}
export async function logUserEvent(event: UserEvent) {
    try {
        await addDoc(collection(db, 'user_events'), {
            ...event,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error logging user event:", error);
    }
}


// --- APP-WIDE SETTINGS (RTDB) ---
export interface UpdateInfo {
  targetDate: string | null;
  updateText: string | null;
  maintenanceType: string | null;
  customMaintenanceTitle?: string;
}

export interface NextUpdateInfo {
  targetDate: string | null;
  updateText: string | null;
  showOnDashboard?: boolean;
}

export interface BroadcastNotification {
    title: string;
    description: string;
    icon: AppNotification['icon'];
    createdAt: string;
}

export async function setGlobalMaintenanceMode(isEnabled: boolean) {
    try {
        const maintenanceRef = ref(rtdb, 'settings/maintenance');
        await setRealtimeDb(maintenanceRef, { isEnabled });
    } catch (error) {
        console.error("Error setting maintenance mode:", error);
        throw error;
    }
}

export function listenToGlobalMaintenanceMode( setIsMaintenanceMode: (status: boolean) => void) {
    const maintenanceRef = ref(rtdb, 'settings/maintenance');
    return onValue(maintenanceRef, (snapshot) => {
        setIsMaintenanceMode(snapshot.val()?.isEnabled || false);
    });
}

export async function setUpdateInfo(info: UpdateInfo) {
    await setRealtimeDb(ref(rtdb, 'settings/updateInfo'), info);
}

export function listenToUpdateInfo(callback: (info: UpdateInfo) => void) {
    return onValue(ref(rtdb, 'settings/updateInfo'), (snapshot) => {
        callback(snapshot.val() || { targetDate: null, updateText: null, maintenanceType: null, customMaintenanceTitle: '' });
    });
}

export async function setNextUpdateInfo(info: NextUpdateInfo) {
    await setRealtimeDb(ref(rtdb, 'settings/nextUpdateInfo'), info);
}

export function listenToNextUpdateInfo(callback: (info: NextUpdateInfo) => void) {
    return onValue(ref(rtdb, 'settings/nextUpdateInfo'), (snapshot) => {
        callback(snapshot.val() || { targetDate: null, updateText: null, showOnDashboard: false });
    });
}

export async function setBroadcastNotification(info: BroadcastNotification) {
    await setRealtimeDb(ref(rtdb, 'settings/broadcastNotification'), info);
}

export async function deleteBroadcastNotification() {
    await removeRealtimeDb(ref(rtdb, 'settings/broadcastNotification'));
}

export function listenToBroadcastNotification(callback: (info: BroadcastNotification | null) => void) {
    return onValue(ref(rtdb, 'settings/broadcastNotification'), (snapshot) => {
        callback(snapshot.val());
    });
}

// --- USER DATA (RTDB) ---
/**
 * Retrieves a user's data document from Realtime Database.
 * @param email - The user's email. Returns an empty object if null.
 * @returns The user data object.
 */
export async function getUserData(email: string | null) {
    if (!email) return {};
    try {
        const userRef = ref(rtdb, `users/${sanitizeEmail(email)}`);
        const snapshot = await get(userRef);
        return snapshot.val() || {};
    } catch (error) {
        console.error("Error getting user data from RTDB:", error);
        return {}; // Return empty object on error to prevent app crashes
    }
}

/**
 * Creates or updates a user's data in Realtime Database.
 * This uses `update` which is equivalent to a merge, so it won't overwrite entire objects.
 * @param email - The user's email. Does nothing if null.
 * @param data - The data object to merge with existing data.
 */
export async function updateUserData(email: string | null, data: { [key: string]: any }) {
    if (!email) return;
    try {
        const userRef = ref(rtdb, `users/${sanitizeEmail(email)}`);
        
        // Deep merge for nested objects like daily stats
        const existingData = await getUserData(email);
        const mergedData = merge({}, existingData, data);
        
        await setRealtimeDb(userRef, mergedData);

    } catch (error) {
        console.error("Error updating user data in RTDB:", error);
        // We could add an offline queue here again if needed, but for now, we'll fail silently.
    }
}

// --- OFFLINE DATA SYNC ---
const OFFLINE_QUEUE_KEY = 'offlineQueue';

/**
 * Queues a data update to be sent to Firestore when the app is back online.
 * @param email - The user's email.
 * @param data - The data object to update.
 */
function queueUpdate(email: string, data: { [key: string]: any }) {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    queue.push({ email, data, timestamp: new Date().toISOString() });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}


/**
 * Syncs any queued offline data with Firestore.
 */
export async function syncOfflineData() {
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    if (queue.length === 0) return;

    const updatesByEmail: { [email: string]: any } = {};

    // Group updates by email to reduce Firestore writes
    for (const item of queue) {
        if (!updatesByEmail[item.email]) {
            updatesByEmail[item.email] = {};
        }
        // Deep merge updates for the same user
        updatesByEmail[item.email] = merge(updatesByEmail[item.email], item.data);
    }
    
    try {
        for (const email in updatesByEmail) {
             const userRef = doc(db, 'users', email);
             await setDoc(userRef, updatesByEmail[email], { merge: true });
        }
        // Clear the queue only after successful sync
        localStorage.removeItem(OFFLINE_QUEUE_KEY);
        console.log('Offline data synced successfully.');
    } catch (error) {
        console.error('Error syncing offline data:', error);
    }
}
