
import { Analytics } from "@/components/analytics";
import { Suspense } from "react";

export default function AnalyticsPage() {
  return (
    <main className="w-full flex-grow p-4 sm:p-6">
      <Suspense>
        <Analytics />
      </Suspense>
    </main>
  );
}

    