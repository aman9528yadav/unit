
import { Converter } from "@/components/converter";
import { Suspense } from "react";

export default function ConverterPage() {
  return (
    <main className="w-full flex-grow p-4 sm:p-6">
      <Suspense>
        <Converter />
      </Suspense>
    </main>
  );
}
