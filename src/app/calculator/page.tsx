
import { Calculator } from "@/components/calculator";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function CalculatorPageSkeleton() {
    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-4">
            <header className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-8 w-24" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </header>
            <div className="bg-card p-4 rounded-xl flex flex-col gap-4 mt-4">
                 <div className="text-right h-28 flex flex-col justify-end p-4">
                    <Skeleton className="h-8 w-3/4 self-end mb-2"/>
                    <Skeleton className="h-12 w-1/2 self-end"/>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 md:h-20 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}


export default function CalculatorPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <Suspense fallback={<CalculatorPageSkeleton />}>
        <Calculator />
      </Suspense>
    </main>
  );
}
