
"use client";

import { useState, useEffect } from 'react';
import { Notepad } from "@/components/notepad";
import MaintenancePage from "@/app/maintenance/page";
import { listenToUpdateInfo } from '@/services/firestore';
import { usePathname } from 'next/navigation';

export default function NotesPage() {
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
      <Notepad />
    </main>
  );
}
