
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PartyPopper } from "lucide-react";

export default function SignupSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/profile/edit");
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
        <PartyPopper className="w-24 h-24 text-primary" />
        <h1 className="text-3xl font-bold">Congratulations!</h1>
        <p className="text-muted-foreground">Your account has been created. Let's set up your profile.</p>
        <p className="text-xs text-muted-foreground mt-8">Made by Aman, Made in India</p>
      </motion.div>
    </main>
  );
}
