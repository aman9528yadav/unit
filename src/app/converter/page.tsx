
import { Converter } from "@/components/converter";
import { Suspense } from "react";

export default function ConverterPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <Suspense>
        <Converter />
      </Suspense>
    </main>
  );
}
