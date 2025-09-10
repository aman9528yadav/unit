

"use client";

import { db, rtdb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, set as setRealtimeDb, onValue, remove as removeRealtimeDb, get, update } from "firebase/database";
import type { AppNotification } from '@/lib/notifications';
import { merge } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import type { Note } from '@/components/notepad';
import * as LucideIcons from 'lucide-react';
import { conversionCategories as baseConversionCategories } from '@/lib/conversions';


export type HowToUseCategory = 'gettingStarted' | 'unitConverter' | 'calculator' | 'notepad' | 'customization';

export interface HowToUseFeature {
    id: string;
    title: string;
    description: string;
    icon: string;
    iconColor?: string;
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

// --- Update Items ---
export interface UpdateItem {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  icon: keyof typeof LucideIcons;
  bgColor: string;
  textColor: string;
  category: string;
  customCategoryTitle?: string;
}

const defaultUpdates: UpdateItem[] = [
    {
        id: uuidv4(),
        version: "v2.4.0",
        date: "2024-10-01T10:00:00Z",
        title: 'Profile Management',
        description: 'Manage your profile, track stats, and view your premium membership progress.',
        icon: 'User',
        bgColor: "bg-orange-500/10",
        textColor: "text-orange-400",
        category: 'New Feature',
        customCategoryTitle: '',
    },
    {
        id: uuidv4(),
        version: "v2.3.0",
        date: "2024-09-25T10:00:00Z",
        title: 'Language Support: Hindi',
        description: 'The entire app is now available in Hindi.',
        icon: 'Languages',
        bgColor: "bg-teal-500/10",
        textColor: "text-teal-400",
        category: 'New Feature',
        customCategoryTitle: '',
    },
];

export async function setUpdatesInRtdb(updates: UpdateItem[]) {
    try {
        const updatesRef = ref(rtdb, 'app-content/updates');
        await setRealtimeDb(updatesRef, updates);
    } catch (error) {
        console.error("Error saving updates to RTDB:", error);
        throw error;
    }
}

export function listenToUpdatesFromRtdb(callback: (updates: UpdateItem[]) => void) {
    const updatesRef = ref(rtdb, 'app-content/updates');
    return onValue(updatesRef, (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data) && data.length > 0) {
            callback(data);
        } else {
            setUpdatesInRtdb(defaultUpdates);
            callback(defaultUpdates);
        }
    }, (error) => {
        console.error("Error listening to updates from RTDB:", error);
        callback(defaultUpdates);
    });
}


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
            // If no data in DB, initialize with default
            setHowToUseFeaturesInRtdb(defaultFeatures);
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

export function listenToCustomHowToUseCategoriesFromRtdb(callback: (categories: CustomHowToUseCategory[] | null) => void) {
    const categoriesRef = ref(rtdb, 'app-content/customHowToUseCategories');
    return onValue(categoriesRef, (snapshot) => {
        const data = snapshot.val();
        callback(data || []);
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
        if (data && Array.isArray(data) && data.length > 0) {
            callback(data);
        } else {
            callback(defaultFaqs);
        }
    }, (error) => {
        console.error("Error listening to FAQs from RTDB:", error);
        callback(defaultFaqs);
    });
}


// --- ABOUT PAGE ---
export interface AppInfo {
    version: string;
    build: string;
    releaseChannel: string;
    license: string;
}

export interface ReleasePlanItem {
    id: string;
    title: string;
    description: string;
    date: string;
}

export interface AboutInfo {
    appInfo: AppInfo;
    releasePlan: ReleasePlanItem[];
}

export interface OwnerInfo {
    name: string;
    imageUrl: string;
}

export interface AboutStats {
    happyUsers: string;
    calculationsDone: string;
}

const defaultAboutStats: AboutStats = {
    happyUsers: '10,000+',
    calculationsDone: '1M+'
};

export async function setAboutStatsInRtdb(stats: AboutStats) {
    try {
        const statsRef = ref(rtdb, 'app-content/aboutStats');
        await setRealtimeDb(statsRef, stats);
    } catch (error) {
        console.error("Error saving About Stats to RTDB:", error);
        throw error;
    }
}

export function listenToAboutStatsFromRtdb(callback: (stats: AboutStats | null) => void) {
    const statsRef = ref(rtdb, 'app-content/aboutStats');
    return onValue(statsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        } else {
            setAboutStatsInRtdb(defaultAboutStats);
            callback(defaultAboutStats);
        }
    }, (error) => {
        console.error("Error listening to About Stats from RTDB:", error);
        callback(defaultAboutStats);
    });
}


// --- COMING SOON ---
export interface ComingSoonItem {
    id: string;
    title: string;
    description: string;
    soon: boolean;
    icon: string;
}

export const defaultComingSoonItems: ComingSoonItem[] = [
    { id: '1', title: 'AI Smart Search', description: "Type conversions like '10kg to lbs'", soon: true, icon: 'Search' },
    { id: '2', title: 'Shared Notes', description: 'Collaborate with others', soon: false, icon: 'Users' },
    { id: '3', title: 'Smart Recipes', description: 'Context-aware steps', soon: true, icon: 'BrainCircuit' },
];

export async function setComingSoonItemsInRtdb(items: ComingSoonItem[]) {
    try {
        const refPath = ref(rtdb, 'app-content/comingSoon');
        await setRealtimeDb(refPath, items);
    } catch (error) {
        console.error("Error saving Coming Soon items to RTDB:", error);
        throw error;
    }
}

export function listenToComingSoonItems(callback: (items: ComingSoonItem[]) => void): () => void {
    const refPath = ref(rtdb, 'app-content/comingSoon');
    return onValue(refPath, (snapshot) => {
        const data = snapshot.val();
        if (data && Array.isArray(data)) {
            callback(data);
        } else {
            setComingSoonItemsInRtdb(defaultComingSoonItems);
            callback(defaultComingSoonItems);
        }
    }, (error) => {
        console.error("Error listening to Coming Soon items from RTDB:", error);
        callback(defaultComingSoonItems);
    });
}


export async function setAboutInfoInRtdb(info: AboutInfo) {
    try {
        const aboutRef = ref(rtdb, 'app-content/aboutInfo');
        await setRealtimeDb(aboutRef, info);
    } catch (error) {
        console.error("Error saving About Info to RTDB:", error);
        throw error;
    }
}

export function listenToAboutInfoFromRtdb(callback: (info: AboutInfo | null) => void) {
    const aboutRef = ref(rtdb, 'app-content/aboutInfo');
    return onValue(aboutRef, (snapshot) => {
        callback(snapshot.val());
    }, (error) => {
        console.error("Error listening to About Info from RTDB:", error);
        callback(null);
    });
}

export async function setOwnerInfoInRtdb(info: OwnerInfo) {
    try {
        const ownerRef = ref(rtdb, 'app-content/ownerInfo');
        await setRealtimeDb(ownerRef, info);
    } catch (error) {
        console.error("Error saving Owner Info to RTDB:", error);
        throw error;
    }
}

export function listenToOwnerInfoFromRtdb(callback: (info: OwnerInfo | null) => void) {
    const ownerRef = ref(rtdb, 'app-content/ownerInfo');
    return onValue(ownerRef, (snapshot) => {
        callback(snapshot.val());
    }, (error) => {
        console.error("Error listening to Owner Info from RTDB:", error);
        callback(null);
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
  updateText: string;
  maintenanceType: string;
  customMaintenanceTitle?: string;
  updateStatus: 'inprogress' | 'success' | 'failed';
  successMessage?: string;
  failureMessage?: string;
  maintenancePages?: string[];
}

export interface NextUpdateInfo {
  targetDate: string | null;
  updateText: string | null;
  showOnDashboard?: boolean;
  category?: string;
  customCategoryTitle?: string;
}

export interface BroadcastNotification {
    title: string;
    description: string;
    icon: AppNotification['icon'];
    createdAt: string;
}

export interface WelcomeContent {
    title: string;
    description: string;
}

export interface BetaWelcomeMessage {
    title: string;
    description: string;
}

export interface PremiumTier {
    title: string;
    features: string[];
}

export interface PremiumInfoContent {
    title: string;
    description: string;
    memberTier: PremiumTier;
    premiumTier: PremiumTier;
    howToUpgrade: string;
}

export type FeatureLocks = {
    [featureId: string]: boolean; // e.g., { 'Category:Currency': true, 'Theme:retro': true }
};


export const defaultPremiumInfo: PremiumInfoContent = {
    title: "Unlock Premium",
    description: "Upgrade to a Premium Membership to unlock exclusive features and enhance your productivity.",
    memberTier: {
        title: "Standard Member",
        features: ["Access to all core converters", "Calculation History", "Basic Note-Taking"]
    },
    premiumTier: {
        title: "Premium Member",
        features: ["All Standard features", "Custom Unit Creation", "Advanced Theming Options", "Scientific Calculator", "Ad-Free Experience"]
    },
    howToUpgrade: "Become a Premium Member by completing 10,000 operations or maintaining a 15-day activity streak."
};


export async function setPremiumInfoContent(content: PremiumInfoContent) {
    try {
        const refPath = ref(rtdb, 'settings/premiumInfoContent');
        await setRealtimeDb(refPath, content);
    } catch (error) {
        console.error("Error setting premium info content:", error);
        throw error;
    }
}

export function listenToPremiumInfoContent(callback: (content: PremiumInfoContent) => void) {
    const refPath = ref(rtdb, 'settings/premiumInfoContent');
    return onValue(refPath, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            callback(data);
        } else {
            // Set default if it doesn't exist
            setPremiumInfoContent(defaultPremiumInfo);
            callback(defaultPremiumInfo);
        }
    }, (error) => {
        console.error("Error listening to premium info content from RTDB:", error);
        callback(defaultPremiumInfo);
    });
}


export async function setBetaWelcomeMessage(content: BetaWelcomeMessage) {
    try {
        const refPath = ref(rtdb, 'settings/betaWelcomeMessage');
        await setRealtimeDb(refPath, content);
    } catch (error) {
        console.error("Error setting beta welcome message:", error);
        throw error;
    }
}

export function listenToBetaWelcomeMessage(callback: (content: BetaWelcomeMessage | null) => void) {
    const refPath = ref(rtdb, 'settings/betaWelcomeMessage');
    return onValue(refPath, (snapshot) => {
        callback(snapshot.val());
    });
}


export async function setWelcomeContent(content: WelcomeContent) {
    try {
        const welcomeRef = ref(rtdb, 'settings/welcomeContent');
        await setRealtimeDb(welcomeRef, content);
    } catch (error) {
        console.error("Error setting welcome content:", error);
        throw error;
    }
}

export function listenToWelcomeContent(callback: (content: WelcomeContent | null) => void) {
    const welcomeRef = ref(rtdb, 'settings/welcomeContent');
    return onValue(welcomeRef, (snapshot) => {
        callback(snapshot.val());
    });
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
        callback(snapshot.val() || { 
            targetDate: null, 
            updateText: '', 
            maintenanceType: 'Performance',
            customMaintenanceTitle: '',
            updateStatus: 'inprogress',
            successMessage: 'The update was successful!',
            failureMessage: 'The update failed. Please try again later.',
            maintenancePages: []
        });
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

export async function setFeatureLocks(locks: FeatureLocks) {
    try {
        await setRealtimeDb(ref(rtdb, 'settings/featureLocks'), locks);
    } catch (error) {
        console.error("Error setting feature locks:", error);
        throw error;
    }
}

export function listenToFeatureLocks(callback: (locks: FeatureLocks | null) => void) {
    return onValue(ref(rtdb, 'settings/featureLocks'), (snapshot) => {
        callback(snapshot.val() || {});
    });
}

// --- USER DATA (RTDB & LocalStorage) ---

export const getGuestKey = (key: string) => `guest_${key}`;

const getGuestData = (): UserData => {
    if (typeof window === 'undefined') return {} as UserData;
    const notes = localStorage.getItem(getGuestKey('notes'));
    const conversionHistory = localStorage.getItem(getGuestKey('conversionHistory'));
    const calculationHistory = localStorage.getItem(getGuestKey('calculationHistory'));
    const favoriteConversions = localStorage.getItem(getGuestKey('favoriteConversions'));
    const customUnits = localStorage.getItem(getGuestKey('customUnits'));
    const customCategories = localStorage.getItem(getGuestKey('customCategories'));
    const stats = localStorage.getItem(getGuestKey('stats'));

    const data: Partial<UserData> = {};
    if (notes) data.notes = JSON.parse(notes);
    if (conversionHistory) data.conversionHistory = JSON.parse(conversionHistory);
    if (calculationHistory) data.calculationHistory = JSON.parse(calculationHistory);
    if (favoriteConversions) data.favoriteConversions = JSON.parse(favoriteConversions);
    if (customUnits) data.customUnits = JSON.parse(customUnits);
    if (customCategories) data.customCategories = JSON.parse(customCategories);
    if (stats) Object.assign(data, JSON.parse(stats));

    return data as UserData;
};


export interface UserData {
    fullName: string;
    username: string;
    email: string;
    profileImage?: string;
    dob?: string;
    phone?: string;
    address?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
    instagram?: string;
    skills?: string[];
    notePassword?: string;
    settings?: {
        language?: string;
        theme?: string;
        customTheme?: any;
        notificationsEnabled?: boolean;
        saveConversionHistory?: boolean;
        defaultRegion?: string;
        defaultCategory?: string;
        defaultPage?: 'dashboard' | 'calculator' | 'notes' | 'converter' | 'time';
        showGettingStarted?: boolean;
        calculatorMode?: 'basic' | 'scientific';
        calculatorTheme?: 'original' | 'physical';
        calculatorSound?: boolean;
        quickAccessOrder?: string[];
    };
    [key: string]: any; // For other dynamic properties
}
/**
 * Retrieves a user's data document from Realtime Database.
 * @param email - The user's email. Returns guest data if null.
 * @returns The user data object.
 */
export async function getUserData(email: string | null): Promise<UserData> {
    if (!email) {
        return getGuestData();
    }
    try {
        const userRef = ref(rtdb, `users/${sanitizeEmail(email)}`);
        const snapshot = await get(userRef);
        return snapshot.val() || ({} as UserData);
    } catch (error) {
        console.error("Error getting user data from RTDB:", error);
        return {} as UserData; // Return empty object on error to prevent app crashes
    }
}

/**
 * Creates or updates a user's data in Realtime Database.
 * @param email - The user's email. Does nothing if null.
 * @param data - The data object to merge with existing data.
 */
export async function updateUserData(email: string | null, data: Partial<UserData>) {
    if (!email) return;
    try {
        const userRef = ref(rtdb, `users/${sanitizeEmail(email)}`);
        const existingData = (await get(userRef)).val() || {};
        const mergedData = merge(existingData, data);
        await setRealtimeDb(userRef, mergedData);
    } catch (error) {
        console.error("Error updating user data in RTDB:", error);
    }
}


/**
 * Listens to a user's data document from Realtime Database or local storage for guests.
 * @param email - The user's email.
 * @param callback - The function to call with the user data.
 * @returns An unsubscribe function.
 */
export function listenToUserData(email: string | null, callback: (data: UserData) => void) {
     if (!email) {
        callback(getGuestData());
        const storageHandler = (e: StorageEvent) => {
             const guestKeys = [
                getGuestKey('notes'), getGuestKey('conversionHistory'), getGuestKey('calculationHistory'), 
                getGuestKey('favoriteConversions'), getGuestKey('customUnits'), getGuestKey('customCategories'),
                getGuestKey('stats'), getGuestKey('userVisitHistory'),
            ];
            if (e.key && guestKeys.includes(e.key)) {
                callback(getGuestData());
            }
        };

        window.addEventListener('storage', storageHandler);
        return () => window.removeEventListener('storage', storageHandler);
    }
    const userRef = ref(rtdb, `users/${sanitizeEmail(email)}`);
    return onValue(userRef, (snapshot) => {
        callback(snapshot.val() || {});
    }, (error) => {
        console.error("Error listening to user data:", error);
        callback({} as UserData);
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
        const localNotes = localStorage.getItem(getGuestKey('notes'));
        callback(localNotes ? JSON.parse(localNotes) : []);
        const storageHandler = (e: StorageEvent) => {
            if (e.key === getGuestKey('notes')) {
                callback(e.newValue ? JSON.parse(e.newValue) : []);
            }
        };
        window.addEventListener('storage', storageHandler);
        return () => window.removeEventListener('storage', storageHandler);
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
    if (!email) {
        const key = getGuestKey('notes');
        localStorage.setItem(key, JSON.stringify(notes));
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(notes) }));
        return;
    }
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
export const getHistoryKey = (email: string | null, historyType: HistoryType) => email ? `user_${email}_${historyType}` : `guest_${historyType}`;


async function addToHistory(email: string | null, historyType: HistoryType, item: string) {
    if (!email) {
        const key = getGuestKey(historyType);
        const currentHistory = JSON.parse(localStorage.getItem(key) || '[]');
        const newHistory = [item, ...currentHistory].slice(0, 100);
        localStorage.setItem(key, JSON.stringify(newHistory));
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(newHistory) }));
        return;
    }

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


export async function deleteHistoryItem(email: string | null, historyType: HistoryType, itemToDelete: string) {
    if(!email) {
         const key = getGuestKey(historyType);
         const currentHistory = JSON.parse(localStorage.getItem(key) || '[]');
         const newHistory = currentHistory.filter((item: string) => item !== itemToDelete);
         localStorage.setItem(key, JSON.stringify(newHistory));
         window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(newHistory) }));
         return;
    }
    const userRef = ref(rtdb, `users/${sanitizeEmail(email)}/${historyType}`);
    const snapshot = await get(userRef);
    const currentHistory = snapshot.val() || [];
    const newHistory = currentHistory.filter((item: string) => item !== itemToDelete);
    await setRealtimeDb(userRef, newHistory);
}


export async function clearAllHistory(email: string | null, historyType: HistoryType) {
    if(!email) {
        const key = getGuestKey(historyType);
        localStorage.setItem(key, '[]');
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: '[]' }));
        return;
    }
    await setRealtimeDb(ref(rtdb, `users/${sanitizeEmail(email)}/${historyType}`), []);
}


export async function setFavorites(email: string | null, favorites: string[]) {
     if(!email) {
        const key = getGuestKey('favoriteConversions');
        localStorage.setItem(key, JSON.stringify(favorites));
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(favorites) }));
        return;
     }
     await setRealtimeDb(ref(rtdb, `users/${sanitizeEmail(email)}/favoriteConversions`), favorites);
}


export const mergeLocalDataWithFirebase = async (email: string) => {
    if (!email) return;

    const guestData = await getUserData(null);
    const userData = await getUserData(email);

    const mergedData: Partial<UserData> = {};

    // Merge notes
    if (guestData.notes && guestData.notes.length > 0) {
        mergedData.notes = [...(userData.notes || []), ...guestData.notes];
    }
    // Merge histories
    if (guestData.conversionHistory && guestData.conversionHistory.length > 0) {
        mergedData.conversionHistory = [...new Set([...guestData.conversionHistory, ...(userData.conversionHistory || [])])].slice(0, 100);
    }
    if (guestData.calculationHistory && guestData.calculationHistory.length > 0) {
        mergedData.calculationHistory = [...new Set([...guestData.calculationHistory, ...(userData.calculationHistory || [])])].slice(0, 100);
    }
    // Merge favorites
    if (guestData.favoriteConversions && guestData.favoriteConversions.length > 0) {
        mergedData.favoriteConversions = [...new Set([...guestData.favoriteConversions, ...(userData.favoriteConversions || [])])];
    }
    // Merge custom units/categories
    if (guestData.customUnits && guestData.customUnits.length > 0) {
        mergedData.customUnits = [...(userData.customUnits || []), ...guestData.customUnits];
    }
     if (guestData.customCategories && guestData.customCategories.length > 0) {
        mergedData.customCategories = [...(userData.customCategories || []), ...guestData.customCategories];
    }
    
    // Merge stats
    mergedData.totalConversions = (userData.totalConversions || 0) + (guestData.totalConversions || 0);
    mergedData.totalCalculations = (userData.totalCalculations || 0) + (guestData.totalCalculations || 0);
    mergedData.totalDateCalculations = (userData.totalDateCalculations || 0) + (guestData.totalDateCalculations || 0);
    mergedData.dailyStats = merge({}, userData.dailyStats, guestData.dailyStats);
     if (guestData.userVisitHistory && guestData.userVisitHistory.length > 0) {
        mergedData.userVisitHistory = [...new Set([...guestData.userVisitHistory, ...(userData.userVisitHistory || [])])].sort();
    }
    
    if (Object.keys(mergedData).length > 0) {
        await updateUserData(email, mergedData);
    }

    // Clear guest data from local storage
    const guestKeys = [
        'guest_notes', 'guest_conversionHistory', 'guest_calculationHistory', 
        'guest_favoriteConversions', 'guest_customUnits', 'guest_customCategories', 
        'guest_stats', 'guest_userVisitHistory'
    ];
    guestKeys.forEach(key => localStorage.removeItem(key));
}

// --- USERNAME MANAGEMENT ---
/**
 * Checks if a username already exists in the 'usernames' collection.
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
    const usernameRef = ref(rtdb, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernameRef);
    return snapshot.exists();
}

/**
 * Associates a username with an email in the 'usernames' collection.
 */
export async function setUsername(username: string, email: string) {
    const usernameRef = ref(rtdb, `usernames/${username.toLowerCase()}`);
    await setRealtimeDb(usernameRef, { email });
    const userRef = ref(rtdb, `users/${sanitizeEmail(email)}`);
    await update(userRef, { username });
}

/**
 * Retrieves the email associated with a given username.
 */
export async function getEmailForUsername(username: string): Promise<string | null> {
    const usernameRef = ref(rtdb, `usernames/${username.toLowerCase()}`);
    const snapshot = await get(usernameRef);
    if (snapshot.exists()) {
        return snapshot.val().email;
    }
    return null;
}
