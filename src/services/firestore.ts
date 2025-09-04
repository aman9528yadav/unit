
"use client";

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import type { AppNotification } from '@/lib/notifications';

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
