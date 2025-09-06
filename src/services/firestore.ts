

"use client";

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, Timestamp, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import type { AppNotification } from '@/lib/notifications';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const OFFLINE_QUEUE_KEY = 'firestoreOfflineQueue';

export interface UserEvent {
    email: string;
    name: string;
    type: 'login' | 'signup';
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

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
 * Sets the global maintenance mode status in Firestore.
 * @param isEnabled - Boolean indicating if maintenance mode should be on or off.
 */
export async function setGlobalMaintenanceMode(isEnabled: boolean) {
    try {
        const maintenanceRef = doc(db, 'settings', 'maintenance');
        await setDoc(maintenanceRef, { isEnabled: isEnabled });
    } catch (error) {
        console.error("Error setting maintenance mode:", error);
        throw error;
    }
}

/**
 * Sets up a real-time listener for the global maintenance mode status.
 * @param setIsMaintenanceMode - State setter to update the component's view of the maintenance status.
 * @returns The unsubscribe function for the listener.
 */
export function listenToGlobalMaintenanceMode(
  setIsMaintenanceMode: (status: boolean) => void,
) {
    const maintenanceRef = doc(db, 'settings', 'maintenance');

    const unsubscribe = onSnapshot(maintenanceRef, (docSnap) => {
        const isEnabled = docSnap.exists() ? docSnap.data().isEnabled || false : false;
        setIsMaintenanceMode(isEnabled);
        
        // This logic is now moved to the layout to handle route-based redirection.

    }, (error) => {
        console.error("Error listening to maintenance mode:", error);
        setIsMaintenanceMode(false); // Default to off on error
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
        if (!updatesByUser[email]) {
            updatesByUser[email] = {};
        }
        updatesByUser[email] = mergeData(updatesByUser[email], data);
    }
    
    for (const email of Object.keys(updatesByUser)) {
        try {
            console.log(`Syncing data for ${email}...`);
            const userDocRef = doc(db, 'users', email);
            const onlineData = (await getDoc(userDocRef)).data() || {};
            const dataToSync = mergeData(onlineData, updatesByUser[email]);
            await setDoc(userDocRef, dataToSync);
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
    const isOnline = navigator.onLine;
    let onlineData = {};
    
    // Get online data if connected and user is logged in
    if (isOnline && email) {
        try {
            const userDocRef = doc(db, 'users', email);
            const docSnap = await getDoc(userDocRef);
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
    const localData = JSON.parse(localStorage.getItem(localDataKey) || '{}');

    return mergeData(onlineData, localData);
}

/**
 * Creates or updates a user's data document in Firestore.
 * Handles offline storage by queueing updates.
 * @param email - The user's email, used as the document ID.
 * @param data - The data object to merge with existing data.
 */
export async function updateUserData(email: string | null, data: { [key: string]: any }) {
    const isOnline = navigator.onLine;

    if (email && isOnline) {
        // Sync any pending changes first
        await syncOfflineData();
        try {
            const userDocRef = doc(db, 'users', email);
            await setDoc(userDocRef, data, { merge: true });
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
    const currentLocalData = JSON.parse(localStorage.getItem(localDataKey) || '{}');
    const newLocalData = mergeData(currentLocalData, data);
    localStorage.setItem(localDataKey, JSON.stringify(newLocalData));
}


    