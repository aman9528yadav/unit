
import { GettingStarted } from "@/components/getting-started";
import { Suspense } from "react";

export default function GettingStartedPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background">
        <Suspense>
            <GettingStarted />
        </Suspense>
    </main>
  );
}
