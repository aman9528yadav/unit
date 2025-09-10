
"use client";

import { HowToUse } from "@/components/how-to-use";
import { useState, useEffect } from 'react';
import MaintenancePage from "@/app/maintenance/page";
import { listenToUpdateInfo } from '@/services/firestore';
import { usePathname } from 'next/navigation';

export default function HowToUsePage() {
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
    <main className="flex min-h-screen w-full flex-col items-center bg-background">
      <HowToUse />
    </main>
  );
}
