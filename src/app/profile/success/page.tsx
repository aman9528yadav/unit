
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function ProfileSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/profile");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <CheckCircle className="w-24 h-24 text-green-500" />
        <h1 className="text-3xl font-bold">Success!</h1>
        <p className="text-muted-foreground">Your profile has been updated.</p>
        <p className="text-sm text-muted-foreground">Redirecting you back to your profile...</p>
      </div>
    </main>
  );
}
