
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeEditor } from "@/components/theme-editor";
import { Skeleton } from "@/components/ui/skeleton";

export default function ThemeEditorPage() {
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
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="bg-card p-4 rounded-xl space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background">
        <ThemeEditor />
    </main>
  );
}

    