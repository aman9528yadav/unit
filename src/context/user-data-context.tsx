
"use client";

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { listenToUserData, updateUserData, UserData } from '@/services/firestore';
import { getStreakData, recordVisit, StreakData } from '@/lib/streak';
import { getWeeklyData, getMonthlyData, CALCULATION_STORAGE_KEY, NOTE_STORAGE_KEY } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface UserProfile {
  fullName: string;
  email: string;
  profileImage?: string;
  [key: string]: any;
}

interface UserDataContextType {
  profile: UserProfile | null;
  userRole: 'Member' | 'Premium Member' | 'Owner';
  todayCalculations: number;
  allTimeCalculations: number;
  allTimeNotes: number;
  streakData: StreakData;
  weeklyCalculations: { name: string; value: number }[];
  monthlyCalculations: { name: string; value: number }[];
  weeklyNotes: { name: string; value: number }[];
  monthlyNotes: { name: string; value: number }[];
  incrementTodaysCalculations: () => void;
  incrementTodaysNotes: () => void;
  isLoading: boolean;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const PREMIUM_MEMBER_THRESHOLD = 8000;
const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";

export const UserDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userData, setUserData] = useState<UserData>({});
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, bestStreak: 0, daysNotOpened: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      setProfile(parsedProfile);
      // It's important to record the visit as soon as we know who the user is.
      recordVisit(parsedProfile.email);
    } else {
        // Handle guest user initialization
        recordVisit(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const email = profile?.email || null;
    const unsubscribe = listenToUserData(email, (data) => {
      if (data) {
        setUserData(data);
        // Recalculate streak data whenever user data changes
        getStreakData(email, data.userVisitHistory).then(setStreakData);
      }
    });

    return () => unsubscribe();
  }, [profile]);
  
  const incrementTodaysCount = useCallback((storageKey: string) => {
    const email = profile?.email || null;
    const today = new Date().toISOString().split('T')[0];
    const update = {
      [storageKey]: {
        [today]: 1
      }
    };
    updateUserData(email, update);
  }, [profile?.email]);

  const incrementTodaysCalculations = useCallback(() => {
    incrementTodaysCount(CALCULATION_STORAGE_KEY);
  }, [incrementTodaysCount]);
  
  const incrementTodaysNotes = useCallback(() => {
    incrementTodaysCount(NOTE_STORAGE_KEY);
  }, [incrementTodaysCount]);
  
  const {
      todayCalculations,
      allTimeCalculations,
      weeklyCalculations,
      monthlyCalculations
  } = getWeeklyData(userData[CALCULATION_STORAGE_KEY] || {});

  const {
      allTimeNotes,
      weeklyNotes,
      monthlyNotes
  } = getWeeklyData(userData[NOTE_STORAGE_KEY] || {});


  const userRole: UserDataContextType['userRole'] = (() => {
    if (profile?.email === DEVELOPER_EMAIL) return 'Owner';
    if (allTimeCalculations >= PREMIUM_MEMBER_THRESHOLD) return 'Premium Member';
    return 'Member';
  })();
  
  const value = {
    profile,
    userRole,
    todayCalculations,
    allTimeCalculations,
    allTimeNotes,
    streakData,
    weeklyCalculations,
    monthlyCalculations,
    weeklyNotes,
    monthlyNotes,
    incrementTodaysCalculations,
    incrementTodaysNotes,
    isLoading,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
