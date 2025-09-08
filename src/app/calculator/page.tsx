
"use client";

import { Calculator } from "@/components/calculator";
import { Suspense, useState } from "react";
import { cn } from "@/lib/utils";

export default function CalculatorPage() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  return (
    <main className={cn(
        "flex min-h-screen w-full flex-col items-center bg-background",
        !isFullScreen && "p-4 sm:p-6"
    )}>
      <Suspense>
        <Calculator isFullScreen={isFullScreen} onFullScreenToggle={setIsFullScreen} />
      </Suspense>
    </main>
  );
}
