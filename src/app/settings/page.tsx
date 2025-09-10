
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Settings } from "@/components/settings";
import { Skeleton } from "@/components/ui/skeleton";
import MaintenancePage from "@/app/maintenance/page";
import { listenToUpdateInfo } from '@/services/firestore';

export default function SettingsPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
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
