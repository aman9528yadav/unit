
"use client";

import { About } from "@/components/about";
import { Suspense, useState, useEffect } from "react";
import MaintenancePage from "@/app/maintenance/page";
import { listenToUpdateInfo } from '@/services/firestore';
import { usePathname, useSearchParams } from 'next/navigation';

export default function AboutPage() {
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
    <Suspense>
      <About />
    </Suspense>
  );
}
