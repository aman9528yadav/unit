
import { Calculator } from "@/components/calculator";
import { Suspense } from "react";

export default function CalculatorPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <Suspense>
        <Calculator />
      </Suspense>
    </main>
  );
}
