

"use client";

import { db, rtdb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot as onFirestoreSnapshot, query, orderBy, Timestamp, doc, setDoc as setFirestoreDoc, getDoc as getFirestoreDoc, updateDoc } from 'firebase/firestore';
import { ref, set as setRealtimeDb, onValue } from "firebase/database";
import type { AppNotification } from '@/lib/notifications';


const OFFLINE_QUEUE_KEY = 'firestoreOfflineQueue';

export interface UserEvent {
    email: string;
    name: string;
    type: 'login' | 'signup';
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

export function syncOfflineData() {
    // This function is kept for future use if online sync is re-enabled.
    // For now, it does nothing as all data is local.
    console.log("Data is local-only. Sync function is disabled.");
}
