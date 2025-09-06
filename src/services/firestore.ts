

"use client";

import { db, rtdb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot as onFirestoreSnapshot, query, orderBy, Timestamp, doc, setDoc as setFirestoreDoc, getDoc as getFirestoreDoc, updateDoc } from 'firebase/firestore';
import { ref, set as setRealtimeDb, onValue } from "firebase/database";
import type { AppNotification } from '@/lib/notifications';
import type { DailyData } from '@/lib/utils';


const OFFLINE_QUEUE_KEY = 'firestoreOfflineQueue';

export interface UserEvent {
    email: string;
    name: string;
    type: 'login' | 'signup';
}

export interface UserData {
    dailyCalculations?: DailyData;
    dailyNotes?: DailyData;
    userVisitHistory?: string[];
    [key: string]: any;
}

export interface UpdateInfo {
    targetDate: string | null;
    updateText: string | null;
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
            createdAt: serverTimestamp(), // Use server time for consistency
        };
        await addDoc(collection(db, 'notifications'), notificationData);
    } catch (error) {
        console.error("Error sending notification: ", error);
        // Depending on the app's needs, you might want to throw the error
        // or handle it gracefully (e.g., show an error toast to the admin).
        throw error;
    }
}

/**
 * Sets up a real-time listener for the global notifications collection.
 * @param callback - Function to be called with the notifications array whenever data changes.
 * @returns The unsubscribe function for the listener.
 */
export function listenToGlobalNotifications(callback: (notifications: Omit<AppNotification, 'read'>[]) => void) {
    const q = query(collection(db, "notifications"), orderBy("createdAt", "desc"));

    const unsubscribe = onFirestoreSnapshot(q, (querySnapshot) => {
        const notifications: Omit<AppNotification, 'read'>[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const createdAtDate = (data.createdAt as Timestamp)?.toDate() || new Date();
            
            notifications.push({
                id: doc.id,
                title: data.title,
                description: data.description,
                icon: data.icon,
                createdAt: createdAtDate.toISOString(),
            });
        });
        callback(notifications);
    }, (error) => {
        console.error("Error listening to notifications: ", error);
    });

    return unsubscribe;
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

/**
 * Sets the upcoming update information (countdown target and text) in Realtime Database.
 * @param info - An object containing the targetDate (as ISO string) and updateText.
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
 * Listens for real-time changes to the upcoming update information.
 * @param callback - Function to be called with the update info.
 * @returns The unsubscribe function.
 */
export function listenToUpdateInfo(callback: (info: UpdateInfo) => void) {
    const updateInfoRef = ref(rtdb, 'settings/updateInfo');
    const unsubscribe = onValue(updateInfoRef, (snapshot) => {
        const data = snapshot.val();
        callback({
            targetDate: data?.targetDate || null,
            updateText: data?.updateText || null,
        });
    }, (error) => {
        console.error("Error listening to update info:", error);
        callback({ targetDate: null, updateText: null });
    });

    return unsubscribe;
}


const mergeData = (onlineData: any, localData: any) => {
    const merged = { ...onlineData };
    for (const key in localData) {
        if (typeof localData[key] === 'object' && localData[key] !== null && !Array.isArray(localData[key])) {
             // For objects like dailyCalculations
            merged[key] = { ...(onlineData[key] || {}), ...localData[key] };
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
            const onlineSnap = await getFirestoreDoc(userDocRef);
            const onlineData = onlineSnap.data() || {};
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
 * Sets up a real-time listener for a user's data document.
 * @param email - The user's email, used as the document ID.
 * @param callback - Function to be called with the user data.
 * @returns The unsubscribe function.
 */
export function listenToUserData(email: string | null, callback: (data: UserData | null) => void) {
    if (!email) {
        // For guest users, we just read from local storage and don't set up a listener.
        const localData = JSON.parse(localStorage.getItem(`localUserData_guest`) || '{}');
        callback(localData);
        return () => {}; // Return an empty unsubscribe function
    }

    const userDocRef = doc(db, "users", email);
    const unsubscribe = onFirestoreSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data() as UserData);
        } else {
            callback(null); // Or an empty object {}
        }
    }, (error) => {
        console.error("Error listening to user data:", error);
        callback(null);
    });

    return unsubscribe;
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
        await syncOfflineData(); // Sync any pending changes first
        try {
            const userDocRef = doc(db, 'users', email);
            
            // This special logic handles incrementing a value in a map
            const updates: { [key: string]: any } = {};
            for (const key in data) {
                 if (typeof data[key] === 'object' && !Array.isArray(data[key]) && data[key] !== null) {
                    for (const subKey in data[key]) {
                       updates[`${key}.${subKey}`] = (await getFirestoreDoc(userDocRef).then(d => d.data()?.[key]?.[subKey] || 0)) + data[key][subKey];
                    }
                } else {
                     updates[key] = data[key];
                }
            }

            await setFirestoreDoc(userDocRef, updates, { merge: true });
        } catch (error) {
            console.error("Error updating user data:", error);
            const queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
            queue.push({ email, data, timestamp: Date.now() });
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
        }
    } else if (email) {
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
