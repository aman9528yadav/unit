
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "@/components/settings";
import { Skeleton } from "@/components/ui/skeleton";
import MaintenancePage from "@/app/maintenance/page";
import { listenToUpdateInfo } from '@/services/firestore';
import { usePathname } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const unsub = listenToUpdateInfo((info) => {
      const isPageInMaintenance = info.maintenancePages?.some(p => pathname.startsWith(p)) || false;
      setIsMaintenance(isPageInMaintenance);
    });
    return () => unsub();
  }, [pathname]);
  
  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setIsAuthorized(true);
    } else {
      router.replace('/welcome');
    }
  }, [router]);

  if (isMaintenance) {
    return <MaintenancePage />;
  }

  if (!isClient || !isAuthorized) {
    return (
      <main className="w-full flex-grow p-6">
          <div className="w-full max-w-md mx-auto flex flex-col gap-6">
              <div className="space-y-8">
                  <div>
                      <Skeleton className="h-6 w-40 mb-3" />
                      <div className="bg-card rounded-xl p-4 space-y-4">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                      </div>
                  </div>
                  <div>
                      <Skeleton className="h-6 w-40 mb-3" />
                      <div className="bg-card rounded-xl p-4 space-y-4">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-10 w-full" />
                      </div>
                  </div>
              </div>
          </div>
      </main>
    );
  }

  return (
    <main className="w-full flex-grow">
      <Settings />
    </main>
  );
}
