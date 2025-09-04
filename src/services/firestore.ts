
"use client";

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';
import type { AppNotification } from '@/lib/notifications';

/**
 * Adds a new notification to the global 'notifications' collection in Firestore.
 */
export async function sendGlobalNotification(notification: { title: string, description: string, icon: AppNotification['icon'] }) {
    try {
        await addDoc(collection(db, 'notifications'), {
            ...notification,
            createdAt: serverTimestamp(), // Use server time for consistency
        });
    } catch (error) {
        console.error("Error sending notification: ", error);
        // Depending on the app's needs, you might want to throw the error
        // or handle it gracefully (e.g., show an error toast to the admin).
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
            notifications.push({
                id: doc.id,
                title: data.title,
                description: data.description,
                icon: data.icon,
                // Firestore timestamp needs to be converted to ISO string for consistency
                createdAt: data.createdAt?.toDate().toISOString() || new Date().toISOString(),
            });
        });
        callback(notifications);
    });

    return unsubscribe;
}
