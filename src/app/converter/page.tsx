
<<<<<<< HEAD
"use client";

import { useState, useEffect, Suspense } from 'react';
import { Converter } from "@/components/converter";
import MaintenancePage from "@/app/maintenance/page";
import { listenToUpdateInfo } from '@/services/firestore';
import { usePathname, useSearchParams } from 'next/navigation';
=======
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

>>>>>>> eaac25c (i face an erroe in convertor page when deploy in github)

export default function ConverterPage() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsub = listenToUpdateInfo((info) => {
      const fullPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      const isPageInMaintenance = info.maintenancePages?.some(p => fullPath.startsWith(p)) || false;
      setIsMaintenance(isPageInMaintenance);
    });
    return () => unsub();
  }, [pathname, searchParams]);

  if (isMaintenance) {
    return <MaintenancePage />;
  }

  return (
<<<<<<< HEAD
    <main className="w-full flex-grow p-4 sm:p-6">
      <Suspense>
=======
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <Suspense fallback={<ConverterPageSkeleton />}>
>>>>>>> eaac25c (i face an erroe in convertor page when deploy in github)
        <Converter />
      </Suspense>
    </main>
  );
}
