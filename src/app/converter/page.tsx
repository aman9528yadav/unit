
"use client";

import { useState, useEffect, Suspense } from 'react';
import { Converter } from "@/components/converter";
import MaintenancePage from "@/app/maintenance/page";
import { listenToUpdateInfo } from '@/services/firestore';
import { usePathname, useSearchParams } from 'next/navigation';

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
    <main className="w-full flex-grow p-4 sm:p-6">
      <Suspense>
        <Converter />
      </Suspense>
    </main>
  );
}
