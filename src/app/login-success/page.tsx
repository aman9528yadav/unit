
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Handshake } from "lucide-react";
import { Logo } from "@/components/logo";

export default function LoginSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        <Handshake className="w-24 h-24 text-primary" />
        <h1 className="text-3xl font-bold">Welcome to Sutradhaar</h1>
        <p className="text-muted-foreground">You are now logged in. Redirecting to your dashboard...</p>
        <p className="text-xs text-muted-foreground mt-8">Made by Aman, Made in India</p>
      </motion.div>
    </main>
  );
}
