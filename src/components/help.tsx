
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function Help() {
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Help & Support</h1>
      </header>
      <div className="bg-card p-6 rounded-xl space-y-4 text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h2>
        <div>
          <h3 className="font-semibold text-foreground">How do I reset my password?</h3>
          <p>You can reset your password by going to the login page and clicking on the "Forgot Password" link.</p>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">How do I update my profile?</h3>
          <p>You can update your profile by navigating to the "My Profile" page and clicking the edit icon.</p>
        </div>
         <div>
          <h3 className="font-semibold text-foreground">Contact Us</h3>
          <p>If you have any other questions, please feel free to contact us at <a href="mailto:support@example.com" className="text-accent hover:underline">support@example.com</a>.</p>
        </div>
      </div>
    </div>
  );
}
