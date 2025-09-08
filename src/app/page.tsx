

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
            // Allow guest to see dashboard
            return;
        }

        if (userEmail) {
            const unsub = listenToUserData(userEmail, (data: UserData) => {
                const page = data?.settings?.defaultPage;
                // This logic runs once when the component mounts to handle initial redirect
                // We check if this is the first navigation after login.
                const hasRedirected = sessionStorage.getItem('hasRedirected');

                if (!hasRedirected && page && page !== 'dashboard') {
                    sessionStorage.setItem('hasRedirected', 'true');
                    router.replace(`/${page}`);
                }
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
    
    // Always render the Dashboard component if authenticated and on the root path
    if (authStatus === 'authenticated') {
         return (
            <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
                <Dashboard />
            </main>
        );
    }

    return null;
}
