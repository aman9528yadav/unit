
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from "@/components/dashboard";
import { Skeleton } from '@/components/ui/skeleton';
import { listenToUserData, UserData } from '@/services/firestore';

function DashboardSkeleton() {
    return (
        <div className="w-full max-w-lg mx-auto flex flex-col gap-6 p-4 sm:p-6">
            <header className="flex justify-between items-center">
                <div>
                    <Skeleton className="h-8 w-40 mb-2" />
                    <Skeleton className="h-4 w-60" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </header>
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
    )
}

export default function Home() {
    const router = useRouter();
    const [authStatus, setAuthStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');
    const [defaultPage, setDefaultPage] = useState('/welcome');

    useEffect(() => {
        const storedProfile = localStorage.getItem("userProfile");
        const hasSkippedLogin = sessionStorage.getItem("hasSkippedLogin");
        const userEmail = storedProfile ? JSON.parse(storedProfile).email : null;

        if (!userEmail && !hasSkippedLogin) {
            router.replace('/welcome');
            setAuthStatus('unauthenticated');
            return;
        }

        if (hasSkippedLogin) {
            setAuthStatus('authenticated');
            setDefaultPage('/'); // Default for guests
            return;
        }

        if (userEmail) {
            const unsub = listenToUserData(userEmail, (data: UserData) => {
                const page = data?.settings?.defaultPage;
                let homeRoute = '/';
                if (page && page !== 'dashboard') {
                    homeRoute = `/${page}`;
                }
                
                // If current path is already home, redirect. Otherwise, let other pages load.
                if (window.location.pathname === '/') {
                    router.replace(homeRoute);
                }
                
                setDefaultPage(homeRoute);
                setAuthStatus('authenticated');
            });
            return () => unsub();
        }

    }, [router]);

    if (authStatus === 'loading') {
        return (
             <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
                <DashboardSkeleton />
            </main>
        );
    }
    
    // For guests or users who set Dashboard as default and land on '/'
    if (authStatus === 'authenticated' && window.location.pathname === '/') {
         return (
            <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
                <Dashboard />
            </main>
        );
    }

    // This will be null for most cases as redirection happens in useEffect
    return null;
}
