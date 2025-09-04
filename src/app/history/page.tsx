
"use client";

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton';

const HistoryComponent = dynamic(() => import('@/components/history'), { 
  ssr: false,
  loading: () => <HistoryPageSkeleton />
});

export default function HistoryPage() {
  return <HistoryComponent />;
}

function HistoryPageSkeleton() {
    return (
        <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
            <div className="w-full max-w-md mx-auto flex flex-col gap-4">
                <header className="flex items-center justify-between">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </header>

                <div className="w-full">
                    <Skeleton className="h-10 w-full rounded-md mb-4" />
                    <div className="flex flex-col gap-3">
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                    </div>
                </div>
            </div>
        </main>
    );
}
