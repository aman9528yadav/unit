
import { Translator } from "@/components/translator";
import { Suspense } from "react";

export default function TranslatorPage() {
  return (
    <main className="w-full flex-grow p-4 sm:p-6">
      <Suspense>
        <Translator />
      </Suspense>
    </main>
  );
}
