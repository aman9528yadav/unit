
"use client";

import { TimeUtilities, TimeUtilitiesSkeleton } from "@/components/time-utilities";
import { Suspense, useState, useEffect } from "react";
import MaintenancePage from "@/app/maintenance/page";
import { listenToUpdateInfo } from '@/services/firestore';
import { usePathname } from 'next/navigation';

export default function TimePage() {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = listenToUpdateInfo((info) => {
      const isPageInMaintenance = info.maintenancePages?.some(p => pathname.startsWith(p)) || false;
      setIsMaintenance(isPageInMaintenance);
    });
    return () => unsub();
  }, [pathname]);

  if (isMaintenance) {
    return <MaintenancePage />;
  }

  return (
    <main className="w-full flex-grow p-4 sm:p-6">
      <Suspense fallback={<TimeUtilitiesSkeleton />}>
        <TimeUtilities />
      </Suspense>
    </main>
  );
}
