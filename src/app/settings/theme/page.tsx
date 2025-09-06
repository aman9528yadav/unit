
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeEditor } from "@/components/theme-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useUserData } from "@/context/user-data-context";


export default function ThemeEditorPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { userRole, isLoading, profile } = useUserData();

  useEffect(() => {
    setIsClient(true);
    // Redirect if not logged in after loading
    if (!isLoading && !profile) {
         router.replace('/welcome');
    }
  }, [isLoading, profile, router]);

  if (!isClient || isLoading) {
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

  if (userRole === 'Member') {
    return (
        <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-6">
            <div className="w-full max-w-md mx-auto flex flex-col items-center text-center gap-4 bg-card p-8 rounded-2xl">
                <div className="p-4 bg-primary/10 rounded-full mb-4">
                  <Lock className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Premium Feature Locked</h1>
                <p className="text-muted-foreground">
                    The Theme Editor is available to Premium Members. Complete 8,000 operations to unlock this feature and more!
                </p>
                <Button onClick={() => router.push('/profile')} className="mt-4">
                    Check Your Progress
                </Button>
            </div>
        </main>
    )
  }

  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background">
        <ThemeEditor />
    </main>
  );
}
