

"use client";

import { db, rtdb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, set as setRealtimeDb, onValue, remove as removeRealtimeDb, get, update } from "firebase/database";
import type { AppNotification } from '@/lib/notifications';
import { merge } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import type { Note } from '@/components/notepad';


export type HowToUseCategory = 'gettingStarted' | 'unitConverter' | 'calculator' | 'notepad' | 'customization';

export interface HowToUseFeature {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: HowToUseCategory | string;
}

export interface CustomHowToUseCategory {
    id: string;
    name: string;
}


export const defaultFeatures: HowToUseFeature[] = [
     {
      id: uuidv4(),
      title: 'Login, Signup, or Skip',
      description: 'Create an account to save your data and unlock premium features, or use the app as a guest by skipping the login.',
      icon: 'LogIn',
      category: 'gettingStarted'
    },
    {
      id: uuidv4(),
      title: 'The Dashboard',
      description: 'Your central hub. Access all major tools like the Converter, Calculator, and Notes with a single tap. View your usage stats at a glance.',
      icon: 'Zap',
      category: 'gettingStarted'
    },
    {
      id: uuidv4(),
      title: 'Smart Search',
      description: "The fastest way to convert. Simply type your query like '10kg to lbs' or '5 miles in km' into the search bar on the dashboard or converter page.",
      icon: 'Search',
      category: 'unitConverter'
    },
     {
      id: uuidv4(),
      title: 'Manual Conversion',
      description: "For more control, manually select a category (e.g., Length, Weight), choose your 'From' and 'To' units, and enter the value. The result appears instantly.",
      icon: 'Sigma',
      category: 'unitConverter'
    },
    {
      id: uuidv4(),
      title: 'Favorites & History',
      description: "Never lose a conversion. Your calculations are automatically saved to History. Tap the star icon to save any conversion as a favorite for quick access later.",
      icon: 'Star',
      category: 'unitConverter'
    },
    {
      id: uuidv4(),
      title: 'Basic & Scientific Modes',
      description: "Perform simple arithmetic in Basic mode. Unlock the Scientific calculator by becoming a Premium Member to access functions like sine, cosine, and logarithms.",
      icon: 'Calculator',
      category: 'calculator'
    },
    {
      id: uuidv4(),
      title: 'Rich Text Editing',
      description: "Create detailed notes with titles, categories, and rich text formatting like bold, italics, lists, and different colors. You can even attach images.",
      icon: 'NotebookText',
      category: 'notepad'
    },
    {
      id: uuidv4(),
      title: 'Theme Editor',
      description: "Make the app truly yours. As a Premium Member, you can use the Theme Editor to change the app's colors to match your style.",
      icon: 'Palette',
      category: 'customization'
    },
    {
      id: uuidv4(),
      title: 'Custom Units',
      description: "A premium feature for power users. Add your own units to existing categories or create entirely new categories for specialized conversions.",
      icon: 'Beaker',
      category: 'customization'
    },
];

// --- FAQ HELP PAGE ---
export interface FAQ {
    id: string;
    question: string;
    answer: string;
}

export const defaultFaqs: FAQ[] = [
    // ... (default FAQs remain the same)
];


export async function setHowToUseFeaturesInRtdb(features: HowToUseFeature[]) {
    try {
        const featuresRef = ref(rtdb, 'app-content/howToUseFeatures');
        await setRealtimeDb(featuresRef, features);
    } catch (error) {
        console.error("Error saving HowToUse features to RTDB:", error);
        throw error;
    }
}

export function listenToHowToUseFeaturesFromRtdb(callback: (features: HowToUseFeature[]) => void) {
    const featuresRef = ref(rtdb, 'app-content/howToUseFeatures');
    return onValue(featuresRef, (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data) && data.length > 0) {
            callback(data);
        } else {
            callback(defaultFeatures);
        }
    }, (error) => {
        console.error("Error listening to HowToUse features from RTDB:", error);
        callback(defaultFeatures);
    });
}

export async function setCustomHowToUseCategoriesInRtdb(categories: CustomHowToUseCategory[]) {
    try {
        const categoriesRef = ref(rtdb, 'app-content/customHowToUseCategories');
        await setRealtimeDb(categoriesRef, categories);
    } catch (error) {
        console.error("Error saving HowToUse categories to RTDB:", error);
        throw error;
    }
}

export function listenToCustomHowToUseCategoriesFromRtdb(callback: (categories: CustomHowToUseCategory[]) => void) {
    const categoriesRef = ref(rtdb, 'app-content/customHowToUseCategories');
    return onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) {
            callback(data);
        } else {
            callback([]);
        }
    }, (error) => {
        console.error("Error listening to custom HowToUse categories from RTDB:", error);
        callback([]);
    });
}


// --- Santize email for RTDB path ---
const sanitizeEmail = (email: string) => email.replace(/[.#$[\]]/g, '_');


// --- HELP/FAQ PAGE ---
export async function setFaqsInRtdb(faqs: FAQ[]) {
    try {
        const faqsRef = ref(rtdb, 'app-content/faqs');
        await setRealtimeDb(faqsRef, faqs);
    } catch (error) {
        console.error("Error saving FAQs to RTDB:", error);
        throw error;
    }
}

export function listenToFaqsFromRtdb(callback: (faqs: FAQ[]) => void) {
    const faqsRef = ref(rtdb, 'app-content/faqs');
    return onValue(faqsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        } else {
            callback(defaultFaqs);
        }
    }, (error) => {
        console.error("Error listening to FAQs from RTDB:", error);
        callback(defaultFaqs);
    });
}


// --- USER EVENTS (FIRESTORE) ---
export interface UserEvent {
    email: string;
    name: string;
    type: 'login' | 'signup';
}
export async function logUserEvent(event: UserEvent) {
    try {
        await addDoc(collection(db, 'user_events'), {
            ...event,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error logging user event:", error);
    }
}


// --- APP-WIDE SETTINGS (RTDB) ---
export interface UpdateInfo {
  targetDate: string | null;
  updateText: string | null;
  maintenanceType: string | null;
  customMaintenanceTitle?: string;
}

export interface NextUpdateInfo {
  targetDate: string | null;
  updateText: string | null;
  showOnDashboard?: boolean;
}

export interface BroadcastNotification {
    title: string;
    description: string;
    icon: AppNotification['icon'];
    createdAt: string;
}

export async function setGlobalMaintenanceMode(isEnabled: boolean) {
    try {
        const maintenanceRef = ref(rtdb, 'settings/maintenance');
        await setRealtimeDb(maintenanceRef, { isEnabled });
    } catch (error) {
        console.error("Error setting maintenance mode:", error);
        throw error;
    }
}

export function listenToGlobalMaintenanceMode( setIsMaintenanceMode: (status: boolean) => void) {
    const maintenanceRef = ref(rtdb, 'settings/maintenance');
    return onValue(maintenanceRef, (snapshot) => {
        setIsMaintenanceMode(snapshot.val()?.isEnabled || false);
    });
}

export async function setUpdateInfo(info: UpdateInfo) {
    try {
        await setRealtimeDb(ref(rtdb, 'settings/updateInfo'), info);
    } catch (error) {
        console.error("Error setting update info:", error);
        throw error;
    }
}

export function listenToUpdateInfo(callback: (info: UpdateInfo) => void) {
    return onValue(ref(rtdb, 'settings/updateInfo'), (snapshot) => {
        callback(snapshot.val() || { targetDate: null, updateText: null, maintenanceType: null, customMaintenanceTitle: '' });
    });
}

export async function setNextUpdateInfo(info: NextUpdateInfo) {
     try {
        await setRealtimeDb(ref(rtdb, 'settings/nextUpdateInfo'), info);
    } catch (error) {
        console.error("Error setting next update info:", error);
        throw error;
    }
}

export function listenToNextUpdateInfo(callback: (info: NextUpdateInfo) => void) {
    return onValue(ref(rtdb, 'settings/nextUpdateInfo'), (snapshot) => {
        callback(snapshot.val() || { targetDate: null, updateText: null, showOnDashboard: false });
    });
}

export async function setBroadcastNotification(info: BroadcastNotification) {
     try {
        await setRealtimeDb(ref(rtdb, 'settings/broadcastNotification'), info);
    } catch (error) {
        console.error("Error setting broadcast notification:", error);
        throw error;
    }
}

export async function deleteBroadcastNotification() {
    try {
        await removeRealtimeDb(ref(rtdb, 'settings/broadcastNotification'));
    } catch (error) {
        console.error("Error deleting broadcast notification:", error);
        throw error;
    }
}

export function listenToBroadcastNotification(callback: (info: BroadcastNotification | null) => void) {
    return onValue(ref(rtdb, 'settings/broadcastNotification'), (snapshot) => {
        callback(snapshot.val());
    });
}

// --- USER DATA (RTDB) ---
/**
 * Retrieves a user's data document from Realtime Database.
 * @param email - The user's email. Returns an empty object if null.
 * @returns The user data object.
 */
export async function getUserData(email: string | null) {
    if (!email) return {};
    try {
        const userRef = ref(rtdb, `users/${sanitizeEmail(email)}`);
        const snapshot = await get(userRef);
        return snapshot.val() || {};
    } catch (error) {
        console.error("Error getting user data from RTDB:", error);
        return {}; // Return empty object on error to prevent app crashes
    }
}

/**
 * Creates or updates a user's data in Realtime Database.
 * This uses `update` which is equivalent to a merge, so it won't overwrite entire objects.
 * @param email - The user's email. Does nothing if null.
 * @param data - The data object to merge with existing data.
 */
export async function updateUserData(email: string | null, data: { [key: string]: any }) {
    if (!email) return;
    try {
        const userRef = ref(rtdb, `users/${sanitizeEmail(email)}`);
        await update(userRef, data);
    } catch (error) {
        console.error("Error updating user data in RTDB:", error);
    }
}

/**
 * Listens to a user's data document from Realtime Database.
 * @param email - The user's email.
 * @param callback - The function to call with the user data.
 * @returns An unsubscribe function.
 */
export function listenToUserData(email: string | null, callback: (data: any) => void) {
    if (!email) {
        callback({}); // Return empty object for guests
        return () => {}; // Return a no-op unsubscribe function
    }
    const userRef = ref(rtdb, `users/${sanitizeEmail(email)}`);
    return onValue(userRef, (snapshot) => {
        callback(snapshot.val() || {});
    }, (error) => {
        console.error("Error listening to user data:", error);
        callback({});
    });
}

// --- USER NOTES (RTDB) ---

/**
 * Listens for changes to a user's notes in the Realtime Database.
 * @param email - The user's email. If null, an empty array is returned.
 * @param callback - The function to call with the notes array.
 * @returns An unsubscribe function.
 */
export function listenToUserNotes(email: string | null, callback: (notes: Note[]) => void) {
    if (!email) {
        callback([]);
        return () => {};
    }
    const notesRef = ref(rtdb, `users/${sanitizeEmail(email)}/notes`);
    return onValue(notesRef, (snapshot) => {
        callback(snapshot.val() || []);
    }, (error) => {
        console.error("Error listening to user notes:", error);
        callback([]);
    });
}

/**
 * Updates a user's notes in the Realtime Database.
 * @param email - The user's email. Does nothing if null.
 * @param notes - The entire array of notes to save.
 */
export async function updateUserNotes(email: string | null, notes: Note[]) {
    if (!email) return;
    try {
        const notesRef = ref(rtdb, `users/${sanitizeEmail(email)}/notes`);
        await setRealtimeDb(notesRef, notes);
    } catch (error) {
        console.error("Error updating user notes in RTDB:", error);
    }
}


// --- HISTORY AND FAVORITES ---
export type HistoryType = 'conversionHistory' | 'calculationHistory' | 'favoriteConversions';

// Centralize local storage key generation
export const CONVERSION_HISTORY_KEY = (email: string | null) => email ? `${email}_conversionHistory` : 'guest_conversionHistory';
export const CALCULATION_HISTORY_KEY = (email: string | null) => email ? `${email}_calculationHistory` : 'guest_calculationHistory';
export const FAVORITES_HISTORY_KEY = (email: string | null) => email ? `${email}_favoriteConversions` : 'guest_favoriteConversions';


async function addToHistory(email: string | null, historyType: HistoryType, item: string) {
    if (!email) return;
    try {
        const userRef = ref(rtdb, `users/${sanitizeEmail(email)}/${historyType}`);
        const snapshot = await get(userRef);
        let currentHistory: string[] = snapshot.val();
        
        if (!Array.isArray(currentHistory)) {
            currentHistory = [];
        }

        const newHistory = [item, ...currentHistory].slice(0, 100); // Keep last 100 items
        await setRealtimeDb(userRef, newHistory);
    } catch (error) {
        console.error(`Error adding to ${historyType}:`, error);
    }
}

export const addConversionToHistory = (email: string | null, item: string) => addToHistory(email, 'conversionHistory', item);
export const addCalculationToHistory = (email: string | null, item: string) => addToHistory(email, 'calculationHistory', item);
export const addFavoriteToHistory = (email: string | null, item: string) => addToHistory(email, 'favoriteConversions', item);


export async function deleteHistoryItem(email: string | null, historyType: HistoryType, itemToDelete: string) {
    if(!email) return;
    const userRef = ref(rtdb, `users/${sanitizeEmail(email)}/${historyType}`);
    const snapshot = await get(userRef);
    const currentHistory = snapshot.val() || [];
    const newHistory = currentHistory.filter((item: string) => item !== itemToDelete);
    await setRealtimeDb(userRef, newHistory);
}


export async function clearAllHistory(email: string | null, historyType: HistoryType) {
    if(!email) return;
    await setRealtimeDb(ref(rtdb, `users/${sanitizeEmail(email)}/${historyType}`), []);
}


export async function setFavorites(email: string | null, favorites: string[]) {
     if(!email) return;
     await setRealtimeDb(ref(rtdb, `users/${sanitizeEmail(email)}/favoriteConversions`), favorites);
}
