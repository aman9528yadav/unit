
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function PrivacyPolicy() {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Privacy Policy</h1>
      </header>
      <div className="bg-card p-6 rounded-xl space-y-4 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
        <p>We collect information you provide directly to us. For example, we collect information when you create an account, update your profile, use the interactive features of our services, and communicate with us.</p>
        
        <h2 className="text-lg font-semibold text-foreground">2. How We Use Information</h2>
        <p>We may use the information we collect to provide, maintain, and improve our services, and to personalize your experience. We may also use the information we collect to communicate with you about products, services, offers, promotions, and events.</p>

        <h2 className="text-lg font-semibold text-foreground">3. Sharing of Information</h2>
        <p>We may share the information we collect with vendors, consultants, and other service providers who need access to such information to carry out work on our behalf.</p>
      </div>
    </div>
  );
}
