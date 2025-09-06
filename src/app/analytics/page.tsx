
import { Analytics } from "@/components/analytics";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function AnalyticsPageSkeleton() {
    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 p-4 sm:p-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-8 w-40" />
                </div>
                <Skeleton className="h-10 w-24" />
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-60 w-full" />
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-72 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        </div>
    );
}


export default function AnalyticsPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
       <Suspense fallback={<AnalyticsPageSkeleton />}>
            <Analytics />
       </Suspense>
    </main>
  );
}
