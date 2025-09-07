
import { Analytics } from "@/components/analytics";
import { Suspense } from "react";

export default function AnalyticsPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <Suspense>
        <Analytics />
      </Suspense>
    </main>
  );
}

    
