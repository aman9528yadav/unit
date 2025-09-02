
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/context/language-context";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage(); // Load language context

  useEffect(() => {
    const profile = localStorage.getItem("userProfile");
    if (!profile) {
      router.replace("/welcome");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto flex flex-col gap-6">
           <header className="flex justify-between items-center">
            <div>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </header>
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
           <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-40 w-full rounded-lg" />
                <Skeleton className="h-40 w-full rounded-lg" />
            </div>
           </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <Dashboard />
    </main>
  );
}
