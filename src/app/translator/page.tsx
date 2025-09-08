
import { Translator } from "@/components/translator";
import { Suspense } from "react";

export default function TranslatorPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <Suspense>
        <Translator />
      </Suspense>
    </main>
  );
}
