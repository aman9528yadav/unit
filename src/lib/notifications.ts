
"use client";

import { v4 as uuidv4 } from 'uuid';

const READ_NOTIFICATIONS_STORAGE_KEY = 'readAppNotifications';

export interface AppNotification {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    read: boolean;
    icon: 'info' | 'success' | 'new';
}

/**
 * Retrieves the set of read notification IDs from localStorage.
 */
function getReadNotificationIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    const stored = localStorage.getItem(READ_NOTIFICATIONS_STORAGE_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
}

/**
 * Marks a specific notification as read by adding its ID to localStorage.
 * @param id - The ID of the notification to mark as read.
 */
export function markAsRead(id: string) {
    if (typeof window === 'undefined') return;

    const readIds = getReadNotificationIds();
    readIds.add(id);
    localStorage.setItem(READ_NOTIFICATIONS_STORAGE_KEY, JSON.stringify(Array.from(readIds)));

    // Dispatch a storage event so other tabs can update in real-time
    window.dispatchEvent(new StorageEvent('storage', {
        key: READ_NOTIFICATIONS_STORAGE_KEY,
        newValue: JSON.stringify(Array.from(readIds)),
    }));
}

/**
 * Combines global notifications with local read statuses.
 * @param globalNotifications - Array of notifications from the backend (Firestore).
 */
export function getNotificationsWithReadStatus(globalNotifications: Omit<AppNotification, 'read'>[]): AppNotification[] {
    const readIds = getReadNotificationIds();
    return globalNotifications
        .map(n => ({
            ...n,
            read: readIds.has(n.id),
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Removes all read notification IDs from localStorage.
 * This is effectively the "Clear All" or "Remove All" function.
 * Note: This does not delete notifications from the backend, only from the user's view.
 */
export function removeAllNotifications() {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(READ_NOTIFICATIONS_STORAGE_KEY);
    
    window.dispatchEvent(new StorageEvent('storage', {
        key: READ_NOTIFICATIONS_STORAGE_KEY,
        newValue: '[]',
    }));
}
