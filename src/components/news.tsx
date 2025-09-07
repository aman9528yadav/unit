
"use client";

import { Button } from "@/components/ui/button";
import { Newspaper, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

export function News() {
  const router = useRouter();

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <header className="absolute top-0 left-0 w-full p-4 flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
        </header>
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
        >
            <div className="p-4 bg-primary/10 rounded-full">
                <Newspaper className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-4xl font-bold">News & Updates</h1>
            <p className="text-muted-foreground max-w-md">
                Stay up-to-date with the latest news, announcements, and articles from our team.
            </p>
            <Button asChild className="mt-4">
                <Link href="https://sutradhaar1.42web.io/">
                    Read News
                </Link>
            </Button>
        </motion.div>
    </main>
  );
}
