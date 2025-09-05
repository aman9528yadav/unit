
"use client";

import { Dashboard } from "@/components/dashboard";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-background p-4 sm:p-6">
      <Dashboard />
    </main>
  );
}
