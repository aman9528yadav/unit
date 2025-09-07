
"use client";

import { Button } from "@/components/ui/button";
import { Newspaper, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Skeleton } from "./ui/skeleton";

export function News() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const newsUrl = "https://sutradhaar1.42web.io/";

  return (
    <div className="w-full h-screen flex flex-col bg-background">
        <header className="flex items-center gap-4 p-4 border-b flex-shrink-0">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
             <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Newspaper size={20}/>
                </div>
                <h1 className="text-xl font-bold">News & Updates</h1>
            </div>
        </header>
        <main className="flex-grow relative">
            {isLoading && (
                <div className="absolute inset-0 flex flex-col gap-4 p-4">
                   <Skeleton className="w-1/3 h-8" />
                   <Skeleton className="w-full h-4" />
                   <Skeleton className="w-full h-4" />
                   <Skeleton className="w-2/3 h-4" />
                   <Skeleton className="w-full h-48 mt-4" />
                </div>
            )}
            <iframe
                src={newsUrl}
                title="News & Updates"
                className="w-full h-full border-none"
                onLoad={() => setIsLoading(false)}
            />
        </main>
    </div>
  );
}
