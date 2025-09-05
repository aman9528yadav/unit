
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dashboard } from "@/components/dashboard";
import { Skeleton } from '@/components/ui/skeleton';

function DashboardSkeleton() {
    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6">
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
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Dev setting to redirect home to maintenance page
        const devHomeIsMaintenance = localStorage.getItem("devHomeIsMaintenance");
        if (devHomeIsMaintenance && JSON.parse(devHomeIsMaintenance)) {
            router.replace('/maintenance');
            return;
        }

        const storedProfile = localStorage.getItem("userProfile");
        const hasSkippedLogin = sessionStorage.getItem("hasSkippedLogin");

        if (storedProfile) {
            setIsAuthenticated(true);
        } else if (hasSkippedLogin) {
            setIsAuthenticated(true);
        } else {
            router.replace('/welcome');
            return;
        }
        setIsCheckingAuth(false);
    }, [router]);

    if (isCheckingAuth) {
        return (
             <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
                <DashboardSkeleton />
            </main>
        );
    }
    
    if (isAuthenticated) {
        return (
            <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
                <Dashboard />
            </main>
        );
    }

    return null;
}
