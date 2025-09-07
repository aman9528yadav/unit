
import { History } from "@/components/history";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function HistoryPageSkeleton() {
    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-4">
            <header className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-8 w-24" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </header>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-full" />
             <div className="flex flex-col gap-3 mt-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        </div>
    );
}


export default function HistoryPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <Suspense fallback={<HistoryPageSkeleton />}>
        <History />
      </Suspense>
    </main>
  );
}
