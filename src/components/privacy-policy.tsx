

"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function PrivacyPolicy() {
  const router = useRouter();
  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <Button variant="secondary" className="rounded-xl shadow-md" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <h1 className="text-xl font-bold">Privacy Policy</h1>
      </header>
      <div className="bg-card p-6 rounded-xl space-y-4 text-sm text-muted-foreground">
        <p><strong>Last Updated:</strong> September 06, 2025</p>

        <p>
          Welcome to Sutradhaar ("we," "our," or "us"). We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">1. Information We Collect</h2>
        <p>
          We may collect information about you in a variety of ways. The information we may collect via the Application includes:
        </p>
        <ul className="list-disc pl-5 space-y-1">
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, and email address, that you voluntarily give to us when you register with the Application.</li>
            <li><strong>Usage Data:</strong> Information our servers automatically collect when you access the Application, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Application. All usage data is anonymized and aggregated.</li>
            <li><strong>Application Data:</strong> We store your conversion history, calculation history, and notes locally on your device or linked to your account if you are logged in.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground pt-4">2. How We Use Your Information</h2>
        <p>
          Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:
        </p>
        <ul className="list-disc pl-5 space-y-1">
            <li>Create and manage your account.</li>
            <li>Enable user-to-user communications.</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Application.</li>
            <li>Notify you of updates to the Application.</li>
        </ul>

        <h2 className="text-lg font-semibold text-foreground pt-4">3. Disclosure of Your Information</h2>
        <p>
          We do not share, sell, rent, or trade your information with third parties for their commercial purposes.
        </p>
        
        <h2 className="text-lg font-semibold text-foreground pt-4">4. Security of Your Information</h2>
        <p>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
        </p>

        <h2 className="text-lg font-semibold text-foreground pt-4">5. Contact Us</h2>
        <p>If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:amanyadavyadav9458@gmail.com" className="text-primary hover:underline">amanyadavyadav9458@gmail.com</a></p>
      </div>
    </div>
  );
}
