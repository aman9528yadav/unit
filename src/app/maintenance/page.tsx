
"use client";

import { ServerCog } from "lucide-react";
import { motion } from "framer-motion";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        >
          <ServerCog className="w-24 h-24 text-primary" />
        </motion.div>
        <h1 className="text-4xl font-bold">Under Maintenance</h1>
        <p className="text-muted-foreground max-w-md">
          We're currently performing some scheduled maintenance to improve our services. We will be back online shortly. Thank you for your patience!
        </p>
      </motion.div>
    </main>
  );
}
