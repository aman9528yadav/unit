
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeEditor } from "@/components/theme-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllTimeCalculations } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";


const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";
const PREMIUM_MEMBER_THRESHOLD = 8000;

type UserRole = 'Member' | 'Premium Member' | 'Owner';


export default function ThemeEditorPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
       const parsedProfile = JSON.parse(storedProfile);
       const calculations = getAllTimeCalculations(parsedProfile.email);
       if (parsedProfile.email === DEVELOPER_EMAIL) {
           setUserRole('Owner');
       } else if (calculations >= PREMIUM_MEMBER_THRESHOLD) {
           setUserRole('Premium Member');
       } else {
           setUserRole('Member');
       }
    } else {
      router.replace('/welcome');
    }
  }, [router]);

  if (!isClient || !userRole) {
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
                <Button onClick={() => router.push('/userdata')} className="mt-4">
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

    
