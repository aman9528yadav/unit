
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
export function getNotifications(): AppNotification[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    const notifications: AppNotification[] = stored ? JSON.parse(stored) : [];
    // Return sorted with the newest first
    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Adds a new notification to localStorage.
 * @param notification - The notification content to add.
 */
export function addNotification(notification: { title: string, description: string }) {
    if (typeof window === 'undefined') return;

    const notifications = getNotifications();
    const newNotification: AppNotification = {
        ...notification,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        read: false,
        icon: 'new',
    };
    
    const updatedNotifications = [newNotification, ...notifications];
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    
    // Dispatch a storage event so other tabs can update in real-time
    window.dispatchEvent(new StorageEvent('storage', {
        key: NOTIFICATIONS_STORAGE_KEY,
        newValue: JSON.stringify(updatedNotifications),
    }));
}

/**
 * Marks a specific notification as read.
 * @param id - The ID of the notification to mark as read.
 */
export function markAsRead(id: string) {
    if (typeof window === 'undefined') return;

    const notifications = getNotifications();
    const updatedNotifications = notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updatedNotifications));
    
     window.dispatchEvent(new StorageEvent('storage', {
        key: NOTIFICATIONS_STORAGE_KEY,
        newValue: JSON.stringify(updatedNotifications),
    }));
}

    