

"use client";

import { v4 as uuidv4 } from 'uuid';

const NOTIFICATIONS_STORAGE_KEY = 'appNotifications';

export interface AppNotification {
    id: string;
    title: string;
    description: string;
    createdAt: string;
    read: boolean;
    icon: 'info' | 'success' | 'new';
}

/**
 * Retrieves all notifications from localStorage.
 */
function getNotifications(): AppNotification[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Saves all notifications to localStorage.
 * @param notifications - The array of notifications to save.
 */
function saveNotifications(notifications: AppNotification[]) {
     if (typeof window === 'undefined') return;
     localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
     // Dispatch a storage event so other tabs can update in real-time
     window.dispatchEvent(new StorageEvent('storage', {
        key: NOTIFICATIONS_STORAGE_KEY,
        newValue: JSON.stringify(notifications),
    }));
}

/**
 * Adds a new notification to the list.
 * @param notification - The notification object to add (id, createdAt, read will be handled).
 */
export function addNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) {
    const newNotification: AppNotification = {
        ...notification,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        read: false,
    };
    const notifications = getNotifications();
    const updatedNotifications = [newNotification, ...notifications].slice(0, 20); // Keep max 20
    saveNotifications(updatedNotifications);
}


/**
 * Marks a specific notification as read by its ID.
 * @param id - The ID of the notification to mark as read.
 */
export function markAsRead(id: string) {
    const notifications = getNotifications();
    const updatedNotifications = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updatedNotifications);
}

/**
 * Marks all notifications as read.
 */
export function markAllAsRead() {
    const notifications = getNotifications();
    const updatedNotifications = notifications.map(n => ({...n, read: true}));
    saveNotifications(updatedNotifications);
}


/**
 * Removes all notifications from localStorage.
 */
export function removeAllNotifications() {
    saveNotifications([]);
}

    