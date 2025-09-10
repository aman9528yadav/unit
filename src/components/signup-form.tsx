

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile, User } from "firebase/auth";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, Eye, EyeOff, Play, ArrowRight, User as UserIcon } from "lucide-react";
import { logUserEvent, mergeLocalDataWithFirebase, checkUsernameExists, setUsername as setUsernameInDb } from "@/services/firestore";
import { useLanguage } from "@/context/language-context";
import { cn } from "@/lib/utils";


const handleSuccessfulSignup = async (user: User, username: string) => {
    // This function will handle both setting local storage and logging the event
    await mergeLocalDataWithFirebase(user.email!);
    await setUsernameInDb(username, user.email!);
    
    const profile = {
        fullName: user.displayName,
        email: user.email,
        username: username,
        dob: '', // DOB is not available on signup
    };
    localStorage.setItem("userProfile", JSON.stringify(profile));
    window.dispatchEvent(new StorageEvent('storage', { key: 'userProfile', newValue: JSON.stringify(profile) }));

    if (user.email && user.displayName) {
         await logUserEvent({
            email: user.email,
            name: user.displayName,
            type: 'signup'
        });
    }
}

const checkPasswordStrength = (password: string) => {
    let score = 0;
    if (!password) return null;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score < 3) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (score < 5) return { label: 'Medium', color: 'bg-yellow-500', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-green-500', width: 'w-full' };
};


export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{label: string; color: string; width: string} | null>(null);

  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);


  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    if (resendTimer > 0) {
      timerInterval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0 && emailSent) {
      setCanResend(true);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [resendTimer, emailSent]);
  
  useEffect(() => {
    if (!emailSent || !auth.currentUser) return;

    const verificationInterval = setInterval(async () => {
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
            clearInterval(verificationInterval);
            await handleSuccessfulSignup(auth.currentUser, username);
            toast({
                title: t('signup.toast.verified.title'),
                description: t('signup.toast.verified.description'),
            });
            router.push('/signup-success');
        }
    }, 3000);

    return () => clearInterval(verificationInterval);
  }, [emailSent, router, toast, t, username]);


  const startResendTimer = () => {
    setResendTimer(30);
    setCanResend(false);
  };

  const handleResendEmail = async () => {
    if (auth.currentUser) {
        setIsSubmitting(true);
        try {
            await sendEmailVerification(auth.currentUser);
            toast({
                title: t('signup.toast.resent.title'),
                description: t('signup.toast.resent.description'),
            });
            startResendTimer();
        } catch (error) {
            console.error("Error resending verification email:", error);
            toast({ title: t('signup.toast.error.title'), description: t('signup.toast.error.description'), variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !fullName || !confirmPassword || !username) {
      toast({ title: t('signup.toast.requiredFields'), variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: t('signup.toast.passwordsNoMatch'), variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: t('signup.toast.passwordTooShort.title', {min: 6}), description: t('signup.toast.passwordTooShort.description', {min: 6}), variant: "destructive" });
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,15}$/.test(username)) {
        toast({ title: "Invalid Username", description: "Username must be 3-15 characters and contain only letters, numbers, and underscores.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);

    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
        toast({ title: "Username Taken", description: "This username is already in use. Please choose another one.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // It's better to update the profile before sending the verification email
      await updateProfile(result.user, { displayName: fullName });
      
      await sendEmailVerification(result.user);
      
      setEmailSent(true);
      startResendTimer();

    } catch (error: any) {
      console.error("Error during email sign-up:", error);
      let description = t('signup.toast.signupFailed.default');
      if (error.code === 'auth/email-already-in-use') {
        description = t('signup.toast.signupFailed.emailInUse');
      } else if (error.code === 'auth/weak-password') {
        description = t('signup.toast.signupFailed.weakPassword');
      }
      toast({ title: t('signup.toast.signupFailed.title'), description, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem("hasSkippedLogin", "true");
    router.push("/");
  };


  if (emailSent) {
    return (
        <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-screen bg-background text-foreground p-6 text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">{t('signup.verify.title')}</h1>
            <p className="text-muted-foreground mb-6">
                {t('signup.verify.description', { email: <strong>{email}</strong> })}
            </p>
             <p className="text-sm text-muted-foreground mb-6">{t('signup.verify.redirectMessage')}</p>
            <Button onClick={handleResendEmail} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-lg" disabled={!canResend || isSubmitting}>
                {isSubmitting ? t('signup.verify.sending') : (canResend ? t('signup.verify.resend') : t('signup.verify.resendTimer', { time: resendTimer }))}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-8">
                {t('signup.verify.wrongEmail')}{" "}
                <button onClick={() => setEmailSent(false)} className="font-semibold text-primary hover:underline">
                 {t('signup.verify.goBack')}
                </button>
            </p>
        </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col justify-center min-h-screen bg-background text-foreground p-6">
      <div className="bg-card p-8 rounded-2xl shadow-lg border border-border/50">
          <div className="grid grid-cols-2 bg-muted p-1 rounded-lg mb-6">
              <Button variant="ghost" className="data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm" onClick={() => router.push('/welcome')}>{t('signup.tabs.login')}</Button>
              <Button variant="ghost" className="data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm" data-active="true">{t('signup.tabs.signup')}</Button>
          </div>
          <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">{t('signup.title')}</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                 {t('signup.description')}
              </p>
          </div>
          <div className="space-y-4">
              <div>
                  <Label htmlFor="fullName">{t('signup.labels.fullName')}</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('signup.placeholders.fullName')} className="bg-secondary mt-1"/>
              </div>
              <div>
                  <Label htmlFor="username">{t('signup.labels.username')}</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder={t('signup.placeholders.username')} className="bg-secondary mt-1"/>
              </div>
              <div>
                  <Label htmlFor="email">{t('signup.labels.email')}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('signup.placeholders.email')} className="bg-secondary mt-1"/>
              </div>
              <div className="relative">
                  <Label htmlFor="password">{t('signup.labels.password')}</Label>
                  <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder={t('signup.placeholders.password')}
                  className="bg-secondary mt-1 pr-10"
                  />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-8 text-muted-foreground"
                  >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {passwordStrength && (
                    <div className="mt-2 flex items-center gap-2">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className={cn("h-full transition-all", passwordStrength.color, passwordStrength.width)}></div>
                        </div>
                        <span className="text-xs font-semibold" style={{ color: `var(--${passwordStrength.label.toLowerCase()})` }}>{passwordStrength.label}</span>
                    </div>
                  )}
              </div>
              <div className="relative">
                  <Label htmlFor="confirmPassword">{t('signup.labels.confirmPassword')}</Label>
                  <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder={t('signup.placeholders.confirmPassword')}
                  className="bg-secondary mt-1 pr-10"
                  />
                  <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-8 text-muted-foreground"
                  >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
              </div>
          </div>

          <div className="flex justify-between items-center mt-6">
               <Button variant="ghost" onClick={handleSkip}>{t('signup.skip')}</Button>
               <div className="flex items-center gap-2">
                  <Button onClick={handleEmailSignup} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                     <UserIcon className="mr-2 h-4 w-4"/> {isSubmitting ? t('signup.signingUp') : t('signup.signupButton')}
                  </Button>
               </div>
          </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
            By creating an account, you agree to our <Link href="/privacy-policy" className="font-semibold text-primary hover:underline">Privacy Policy</Link> and <Link href="#" className="font-semibold text-primary hover:underline">Terms of Service</Link>.
        </p>
      </div>
    </div>
  );
}
