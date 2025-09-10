

import { TimeUtilities, TimeUtilitiesSkeleton } from "@/components/time-utilities";
import { Suspense } from "react";

export default function TimePage() {
  return (
    <main className="w-full flex-grow p-4 sm:p-6">
      <Suspense fallback={<TimeUtilitiesSkeleton />}>
        <TimeUtilities />
      </Suspense>
    </main>
  );
}
