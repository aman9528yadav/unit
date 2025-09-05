
"use client";

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, Timestamp, doc, setDoc } from 'firebase/firestore';
import type { AppNotification } from '@/lib/notifications';


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
 * @param enabled - Whether maintenance mode should be on or off.
 */
export async function setGlobalMaintenanceMode(enabled: boolean) {
    try {
        const statusRef = doc(db, 'app-status', 'maintenance');
        await setDoc(statusRef, { enabled });
    } catch (error) {
        console.error("Error setting maintenance mode:", error);
        throw error;
    }
}

/**
 * Listens for real-time changes to the global maintenance mode status.
 * @param callback - Function to be called with the status (true/false) whenever it changes.
 * @returns The unsubscribe function for the listener.
 */
export function listenToGlobalMaintenanceMode(callback: (enabled: boolean) => void) {
    const statusRef = doc(db, 'app-status', 'maintenance');
    const unsubscribe = onSnapshot(statusRef, (doc) => {
        if (doc.exists()) {
            callback(doc.data().enabled);
        } else {
            // If the document doesn't exist, assume maintenance is off.
            callback(false);
        }
    }, (error) => {
        console.error("Error listening to maintenance mode:", error);
        // In case of error, assume not in maintenance to avoid locking out users.
        callback(false);
    });

    return unsubscribe;
}
