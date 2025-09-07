
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Newspaper } from "lucide-react";
import { useRouter } from "next/navigation";

export function News() {
  const router = useRouter();

  return (
    <div className="w-full h-screen flex flex-col">
      <header className="flex items-center gap-4 p-4 border-b sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div className="flex items-center gap-2">
            <Newspaper />
            <h1 className="text-xl font-bold">News & Updates</h1>
        </div>
      </header>
      <iframe
        src="https://sutradhaar1.42web.io/"
        className="w-full h-full border-0"
        title="Sutradhaar News"
        sandbox="allow-scripts allow-same-origin"
      ></iframe>
    </div>
  );
}
