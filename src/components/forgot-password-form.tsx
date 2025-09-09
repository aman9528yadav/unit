

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (emailSent) {
      const timer = setTimeout(() => {
        router.push('/welcome');
      }, 5000); // Redirect after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [emailSent, router]);


  const handleResetPassword = async () => {
    if (!email) {
      toast({ title: t('forgotPassword.toast.emailRequired.title'), description: t('forgotPassword.toast.emailRequired.description'), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setEmailSent(true);
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      let description = t('forgotPassword.toast.requestFailed.default');
      if (error.code === 'auth/user-not-found') {
        description = t('forgotPassword.toast.requestFailed.userNotFound');
      }
      toast({ title: t('forgotPassword.toast.requestFailed.title'), description, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (emailSent) {
    return (
        <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-screen bg-background text-foreground p-6 text-center">
            <MailCheck className="w-20 h-20 text-primary mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-primary mb-4">{t('forgotPassword.success.title')}</h1>
            <p className="text-muted-foreground mb-6">
                {t('forgotPassword.success.description', { email: <strong>{email}</strong> })}
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/welcome">
                 {t('forgotPassword.success.backButton')}
                </Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-screen bg-background text-foreground p-6">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="secondary" className="rounded-xl shadow-md" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <h1 className="text-2xl font-bold text-primary">{t('forgotPassword.title')}</h1>
      </header>

       <div className="text-center mb-8">
            <p className="text-muted-foreground mt-2 text-sm">
                {t('forgotPassword.description')}
            </p>
      </div>
      
      <div className="bg-card p-8 rounded-2xl">
        <div className="space-y-4">
            <div>
                <Label htmlFor="email">{t('forgotPassword.emailLabel')}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@example.com" className="bg-secondary mt-2"/>
            </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <Button onClick={handleResetPassword} className="w-full h-12 bg-primary hover:bg-primary/90 rounded-full text-lg text-primary-foreground" disabled={isSubmitting}>
           {isSubmitting ? t('forgotPassword.sending') : t('forgotPassword.sendButton')}
        </Button>
      </div>
    </div>
  );
}

    
