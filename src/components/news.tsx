
"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Newspaper } from "lucide-react";
import { useRouter } from "next/navigation";

export function News() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <header className="flex items-center gap-4 p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <div className="flex items-center gap-2">
            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
                <Newspaper />
            </div>
            <h1 className="text-xl font-bold">News</h1>
        </div>
      </header>
      <main className="flex-grow">
        <iframe
          src="https://sutradhaar1.42web.io"
          className="w-full h-full border-0"
          title="News"
          sandbox="allow-scripts allow-same-origin"
        ></iframe>
      </main>
    </div>
  );
}
