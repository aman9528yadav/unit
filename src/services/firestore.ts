
"use client";

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import type { AppNotification } from '@/lib/notifications';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';


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
 * Sets up a real-time listener for the global maintenance mode status and handles redirects.
 * @param setIsMaintenanceMode - State setter to update the component's view of the maintenance status.
 * @param pathname - The current URL pathname from Next.js router.
 * @param router - The Next.js router instance.
 * @returns The unsubscribe function for the listener.
 */
export function listenToGlobalMaintenanceMode(
  setIsMaintenanceMode: (status: boolean) => void,
  pathname: string,
  router: AppRouterInstance
) {
    const maintenanceRef = doc(db, 'settings', 'maintenance');

    const unsubscribe = onSnapshot(maintenanceRef, (docSnap) => {
        const isEnabled = docSnap.exists() ? docSnap.data().isEnabled || false : false;
        setIsMaintenanceMode(isEnabled);
        
        // Centralize redirection logic here
        const isDevRoute = pathname.startsWith('/dev');
        if (isDevRoute) {
            return; // Always allow access to dev routes
        }

        const isMaintenancePage = pathname === '/maintenance';
        
        if (isEnabled && !isMaintenancePage) {
            router.replace('/maintenance');
        } else if (!isEnabled && isMaintenancePage) {
            router.replace('/');
        }

    }, (error) => {
        console.error("Error listening to maintenance mode:", error);
        setIsMaintenanceMode(false);
    });

    return unsubscribe;
}
