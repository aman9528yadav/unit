
"use client";

import { About } from "@/components/about";
import { Suspense, useState, useEffect } from "react";
import MaintenancePage from "@/app/maintenance/page";
import { listenToUpdateInfo } from '@/services/firestore';
import { usePathname } from 'next/navigation';

export default function AboutPage() {
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
    <Suspense>
      <About />
    </Suspense>
  );
}
