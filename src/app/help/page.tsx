
import { HowToUse } from "@/components/how-to-use";

// This page is redirected from the HowToUse page for backwards compatibility.
// The content is now merged into the How To Use page.
export default function HelpPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background">
      <HowToUse />
    </main>
  );
}
