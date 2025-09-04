
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomUnitManager } from "@/components/custom-unit-manager";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomUnitsPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setIsAuthorized(true);
    } else {
      router.replace('/welcome');
    }
  }, [router]);

  if (!isClient || !isAuthorized) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center bg-background p-6">
        <div className="w-full max-w-md mx-auto flex flex-col gap-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-40" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </header>
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <div className="text-center text-muted-foreground mt-8 flex flex-col items-center gap-4 bg-card p-6 rounded-lg">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-56" />
                    </div>
                </div>
                <div>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <div className="text-center text-muted-foreground mt-8 flex flex-col items-center gap-4 bg-card p-6 rounded-lg">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-5 w-52" />
                    </div>
                </div>
            </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background">
        <CustomUnitManager />
    </main>
  );
}

    