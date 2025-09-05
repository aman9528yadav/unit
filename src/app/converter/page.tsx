
import { Converter } from "@/components/converter";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function ConverterPageSkeleton() {
    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-4">
            <header className="flex items-center justify-between">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-8 w-32" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
            </header>
            <Skeleton className="h-12 w-full" />
            <div className="bg-card p-4 rounded-xl flex flex-col gap-4 mt-4">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-36" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-12 w-full" />
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        </div>
    );
}


export default function ConverterPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <Suspense fallback={<ConverterPageSkeleton />}>
        <Converter />
      </Suspense>
    </main>
  );
}
