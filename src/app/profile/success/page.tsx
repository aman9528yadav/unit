"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function ProfileSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/profile");
    }, 2500); // Increased duration for animation

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.5,
          delay: 0.2,
          ease: [0, 0.71, 0.2, 1.01]
        }}
        className="flex flex-col items-center gap-4"
      >
        <CheckCircle className="w-24 h-24 text-green-500" />
        <h1 className="text-3xl font-bold">Success!</h1>
        <p className="text-muted-foreground">Your profile is all set.</p>
        <p className="text-sm text-muted-foreground">Redirecting you to your profile...</p>
      </motion.div>
    </main>
  );
}
