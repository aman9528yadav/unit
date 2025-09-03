
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowLeft, MailCheck } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  const handleResetPassword = async () => {
    if (!email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/user-not-found') {
        description = "No account found with this email address.";
      }
      toast({ title: "Request Failed", description, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (emailSent) {
    return (
        <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-screen bg-background text-foreground p-6 text-center">
            <MailCheck className="w-20 h-20 text-primary mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-primary mb-4">Check Your Email</h1>
            <p className="text-muted-foreground mb-6">
                A password reset link has been sent to <strong>{email}</strong>. Please check your inbox (and spam folder) to reset your password.
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/welcome">
                 Back to Login
                </Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-screen bg-background text-foreground p-6">
      <header className="flex items-center gap-4 mb-8">
        <Link href="/welcome">
            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10">
                <ArrowLeft />
            </Button>
        </Link>
        <h1 className="text-2xl font-bold text-primary">Forgot Password</h1>
      </header>

       <div className="text-center mb-8">
            <p className="text-muted-foreground mt-2 text-sm">
                No problem! Enter your email below and we'll send you a link to reset it.
            </p>
      </div>
      
      <div className="bg-card p-8 rounded-2xl">
        <div className="space-y-4">
            <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@example.com" className="bg-secondary mt-2"/>
            </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <Button onClick={handleResetPassword} className="w-full h-12 bg-primary hover:bg-primary/90 rounded-full text-lg text-primary-foreground" disabled={isSubmitting}>
           {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
        </Button>
      </div>
    </div>
  );
}
