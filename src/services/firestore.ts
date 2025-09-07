
"use client";

import { db, rtdb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot as onFirestoreSnapshot, query, orderBy, Timestamp, doc, setDoc as setFirestoreDoc, getDoc as getFirestoreDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, set as setRealtimeDb, onValue, remove as removeRealtimeDb } from "firebase/database";
import type { AppNotification } from '@/lib/notifications';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { FAQ, defaultFaqs } from '@/components/help';

const OFFLINE_QUEUE_KEY = 'firestoreOfflineQueue';

export interface UserEvent {
    email: string;
    name: string;
    type: 'login' | 'signup';
}

export async function setFaqs(faqs: FAQ[]) {
    try {
        const faqsDocRef = doc(db, 'app-content', 'faqs');
        await setFirestoreDoc(faqsDocRef, { faqsList: faqs });
    } catch (error) {
        console.error("Error saving FAQs:", error);
        throw error;
    }
}

export function listenToFaqs(callback: (faqs: FAQ[]) => void) {
    const faqsDocRef = doc(db, 'app-content', 'faqs');
    return onFirestoreSnapshot(faqsDocRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data().faqsList || defaultFaqs);
        } else {
            callback(defaultFaqs);
        }
    }, (error) => {
        console.error("Error listening to FAQs:", error);
        callback(defaultFaqs);
    });
}


/**
 * Logs a user event (login or signup) to Firestore.
 * @param event - The event data to log.
 */
export async function logUserEvent(event: UserEvent) {
    try {
        await addDoc(collection(db, 'user_events'), {
            ...event,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error logging user event:", error);
        // Silently fail to not disrupt user experience
    }
}


/**
 * Adds a new notification to the global 'notifications' collection in Firestore.
 */
export async function sendGlobalNotification(notification: { title: string, description: string, icon: AppNotification['icon'] }) {
    try {
        const notificationData = {
            title: notification.title,
            description: notification.description,
            icon: notification.icon,
            createdAt: new Date().toISOString(),
        };
        // Using a single document to store the latest notification
        const broadcastRef = doc(db, 'app-content', 'broadcastNotification');
        await setFirestoreDoc(broadcastRef, notificationData);
    } catch (error) {
        console.error("Error sending notification: ", error);
        throw error;
    }
}

/**
 * Sets the global maintenance mode status in Firebase Realtime Database.
 * @param isEnabled - Boolean indicating if maintenance mode should be on or off.
 */
export async function setGlobalMaintenanceMode(isEnabled: boolean) {
    try {
        const maintenanceRef = ref(rtdb, 'settings/maintenance');
        await setRealtimeDb(maintenanceRef, { isEnabled: isEnabled });
    } catch (error) {
        console.error("Error setting maintenance mode:", error);
        throw error;
    }
}


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

export async function setBroadcastNotification(info: BroadcastNotification) {
    try {
        const broadcastRef = ref(rtdb, 'settings/broadcastNotification');
        await setRealtimeDb(broadcastRef, info);
    } catch (error) {
        console.error("Error setting broadcast notification:", error);
        throw error;
    }
}

export async function deleteBroadcastNotification() {
    try {
        const broadcastRef = ref(rtdb, 'settings/broadcastNotification');
        await removeRealtimeDb(broadcastRef);
    } catch (error) {
        console.error("Error deleting broadcast notification:", error);
        throw error;
    }
}

export function listenToBroadcastNotification(callback: (info: BroadcastNotification | null) => void) {
    const broadcastRef = ref(rtdb, 'settings/broadcastNotification');

    const unsubscribe = onValue(broadcastRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Error listening to broadcast notification:", error);
    });

    return unsubscribe;
}


/**
 * Sets the global update information in Firebase Realtime Database for the maintenance page.
 * @param info - Object containing the target date and update text.
 */
export async function setUpdateInfo(info: UpdateInfo) {
    try {
        const updateInfoRef = ref(rtdb, 'settings/updateInfo');
        await setRealtimeDb(updateInfoRef, info);
    } catch (error) {
        console.error("Error setting update info:", error);
        throw error;
    }
}

/**
 * Sets the global update information in Firebase Realtime Database for the updates page.
 * @param info - Object containing the target date and update text.
 */
export async function setNextUpdateInfo(info: NextUpdateInfo) {
    try {
        const updateInfoRef = ref(rtdb, 'settings/nextUpdateInfo');
        await setRealtimeDb(updateInfoRef, info);
    } catch (error) {
        console.error("Error setting next update info:", error);
        throw error;
    }
}


/**
 * Listens for changes to the global update information from Realtime Database for the maintenance page.
 * @param callback - Function to be called with the update info.
 * @returns The unsubscribe function for the listener.
 */
export function listenToUpdateInfo(callback: (info: UpdateInfo) => void) {
    const updateInfoRef = ref(rtdb, 'settings/updateInfo');

    const unsubscribe = onValue(updateInfoRef, (snapshot) => {
        const data = snapshot.val();
        const info: UpdateInfo = {
            targetDate: data?.targetDate || null,
            updateText: data?.updateText || null,
            maintenanceType: data?.maintenanceType || null,
            customMaintenanceTitle: data?.customMaintenanceTitle || ''
        };
        callback(info);
    }, (error) => {
        console.error("Error listening to update info:", error);
        callback({ targetDate: null, updateText: null, maintenanceType: null, customMaintenanceTitle: '' }); // Default on error
    });

    return unsubscribe;
}

/**
 * Listens for changes to the global update information from Realtime Database for the updates page.
 * @param callback - Function to be called with the update info.
 * @returns The unsubscribe function for the listener.
 */
export function listenToNextUpdateInfo(callback: (info: NextUpdateInfo) => void) {
    const updateInfoRef = ref(rtdb, 'settings/nextUpdateInfo');

    const unsubscribe = onValue(updateInfoRef, (snapshot) => {
        const data = snapshot.val();
        const info: NextUpdateInfo = {
            targetDate: data?.targetDate || null,
            updateText: data?.updateText || null,
            showOnDashboard: data?.showOnDashboard || false,
        };
        callback(info);
    }, (error) => {
        console.error("Error listening to next update info:", error);
        callback({ targetDate: null, updateText: null, showOnDashboard: false }); // Default on error
    });

    return unsubscribe;
}


/**
 * Sets up a real-time listener for the global maintenance mode status from Realtime Database.
 * @param setIsMaintenanceMode - State setter to update the component's view of the maintenance status.
 * @returns The unsubscribe function for the listener.
 */
export function listenToGlobalMaintenanceMode(
  setIsMaintenanceMode: (status: boolean) => void
) {
    const maintenanceRef = ref(rtdb, 'settings/maintenance');
    
    const unsubscribe = onValue(maintenanceRef, (snapshot) => {
        const data = snapshot.val();
        const isEnabled = data?.isEnabled || false;
        setIsMaintenanceMode(isEnabled);
    }, (error) => {
        console.error("Error listening to maintenance mode:", error);
        setIsMaintenanceMode(false); // Default to off on error
    });

    return unsubscribe;
}


const mergeData = (onlineData: any, localData: any) => {
    const merged = { ...onlineData };
    for (const key in localData) {
        if (key === 'dailyCalculations' && typeof localData[key] === 'object' && localData[key] !== null) {
            merged[key] = { ...(onlineData[key] || {}) };
             for(const date in localData[key]) {
                 merged[key][date] = (onlineData[key]?.[date] || 0) + localData[key][date];
             }
        } else if (Array.isArray(localData[key])) {
            // For arrays like userVisitHistory
            merged[key] = [...new Set([...(onlineData[key] || []), ...localData[key]])];
        } else {
            merged[key] = localData[key];
        }
    }
    return merged;
};

export async function syncOfflineData() {
    console.log("Attempting to sync offline data...");
    const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
    if (queue.length === 0) {
        console.log("No offline data to sync.");
        return;
    }

    // Group updates by user (email)
    const updatesByUser: { [email: string]: any } = {};
    for (const { email, data } of queue) {
        const userKey = email || 'guest';
        if (!updatesByUser[userKey]) {
            updatesByUser[userKey] = {};
        }
        updatesByUser[userKey] = mergeData(updatesByUser[userKey], data);
    }
    
    for (const email of Object.keys(updatesByUser)) {
        if (email === 'guest') continue; // Don't sync guest data to firestore
        try {
            console.log(`Syncing data for ${email}...`);
            const userDocRef = doc(db, 'users', email);
            const onlineData = (await getFirestoreDoc(userDocRef)).data() || {};
            const dataToSync = mergeData(onlineData, updatesByUser[email]);
            await setFirestoreDoc(userDocRef, dataToSync);
            console.log(`Sync successful for ${email}.`);
        } catch (error) {
            console.error(`Failed to sync data for ${email}:`, error);
            // If it fails, we leave the data in the queue to be retried later.
            return;
        }
    }

    console.log("Clearing offline queue.");
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
}


/**
 * Retrieves a user's data document from Firestore.
 * It also merges any pending offline data.
 * @param email - The user's email, used as the document ID.
 * @returns The user data object or null if it doesn't exist.
 */
export async function getUserData(email: string | null) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
    let onlineData = {};
    
    // Get online data if connected and user is logged in
    if (isOnline && email) {
        try {
            const userDocRef = doc(db, 'users', email);
            const docSnap = await getFirestoreDoc(userDocRef);
            if (docSnap.exists()) {
                onlineData = docSnap.data();
            }
        } catch (error) {
            console.error("Error getting user data from Firestore:", error);
            // Proceed with local data if Firestore fails
        }
    }

    // Get local data (for guests or offline users)
    const localDataKey = `localUserData_${email || 'guest'}`;
    const localData = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(localDataKey) || '{}') : {};

    return mergeData(onlineData, localData);
}

/**
 * Creates or updates a user's data document in Firestore.
 * Handles offline storage by queueing updates.
 * @param email - The user's email, used as the document ID.
 * @param data - The data object to merge with existing data.
 */
export async function updateUserData(email: string | null, data: { [key: string]: any }) {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;

    if (email && isOnline) {
        // Sync any pending changes first
        await syncOfflineData();
        try {
            const userDocRef = doc(db, 'users', email);
            await setFirestoreDoc(userDocRef, data, { merge: true });
        } catch (error) {
            console.error("Error updating user data:", error);
            // If online update fails, save to offline queue as a fallback
            const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
            queue.push({ email, data, timestamp: Date.now() });
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        }
    } else if (email) {
        // Offline but logged in: queue the update
        const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
        queue.push({ email, data, timestamp: Date.now() });
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    }

    // Always update local data for immediate UI feedback and for guests
    const localDataKey = `localUserData_${email || 'guest'}`;
    const currentLocalData = typeof localStorage !== 'undefined' ? JSON.parse(localStorage.getItem(localDataKey) || '{}') : {};
    const newLocalData = mergeData(currentLocalData, data);
     if (typeof localStorage !== 'undefined') {
        localStorage.setItem(localDataKey, JSON.stringify(newLocalData));
    }
}
