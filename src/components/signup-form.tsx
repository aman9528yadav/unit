
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, sendEmailVerification, User } from "firebase/auth";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        // The user object needs to be reloaded to get the latest emailVerified status.
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
            clearInterval(verificationInterval);
            toast({
                title: "Email Verified!",
                description: "Your account is active. Please log in.",
            });
            router.push('/welcome');
        }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(verificationInterval); // Cleanup on component unmount
  }, [emailSent, router, toast]);


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
                title: "Verification Email Sent",
                description: "A new verification link has been sent to your email address.",
            });
            startResendTimer();
        } catch (error) {
            console.error("Error resending verification email:", error);
            toast({ title: "Error", description: "Failed to resend verification email.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
  };

  const handleEmailSignup = async () => {
    if (!email || !password || !fullName || !confirmPassword) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user);
      // We don't need to set current user from state anymore, auth.currentUser will be available.
      setEmailSent(true);
      startResendTimer();

    } catch (error: any) {
      console.error("Error during email sign-up:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use. Please log in or use a different email.";
      } else if (error.code === 'auth/weak-password') {
        description = "The password is too weak. Please choose a stronger password (at least 6 characters).";
      }
      toast({ title: "Sign-up Failed", description, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const profile = {
        fullName: user.displayName || "New User",
        email: user.email || "",
        profileImage: user.photoURL || "https://picsum.photos/200",
      };

      localStorage.setItem("userProfile", JSON.stringify(profile));
      router.push("/profile/success");

    } catch (error: any) {
      console.error("Error during Google sign-up:", error);
      toast({ title: "Sign-up Failed", description: "Could not sign up with Google. Please try again.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
        <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-screen bg-background text-foreground p-6 text-center">
            <h1 className="text-3xl font-bold text-primary mb-4">Verify Your Email</h1>
            <p className="text-muted-foreground mb-6">
                A verification link has been sent to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.
            </p>
             <p className="text-sm text-muted-foreground mb-6">This page will automatically redirect after you have verified your email.</p>
            <Button onClick={handleResendEmail} className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-lg" disabled={!canResend || isSubmitting}>
                {isSubmitting ? 'Sending...' : (canResend ? 'Resend Email' : `Resend in ${resendTimer}s`)}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-8">
                Wrong email?{" "}
                <button onClick={() => setEmailSent(false)} className="font-semibold text-primary hover:underline">
                 Go back
                </button>
            </p>
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
        <h1 className="text-2xl font-bold text-primary">Create Account</h1>
      </header>

       <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Let's Start!</h2>
      </div>
      
       <div className="bg-card p-8 rounded-2xl">
            <div className="space-y-4">
                 <div>
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aman Yadav" className="bg-secondary mt-2"/>
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@example.com" className="bg-secondary mt-2"/>
                </div>
                <div className="relative">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="**********" 
                      className="bg-secondary mt-2 pr-10"
                    />
                     <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-9 text-muted-foreground"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
                 <div className="relative">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="**********" 
                      className="bg-secondary mt-2 pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-9 text-muted-foreground"
                    >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground my-6">
          By continuing, you agree to <Link href="#" className="text-primary">Terms of Use</Link> and <Link href="#" className="text-primary">Privacy Policy</Link>.
      </p>

      <div className="mt-4 space-y-4">
        <Button onClick={handleEmailSignup} className="w-full h-12 bg-primary hover:bg-primary/90 rounded-full text-lg text-primary-foreground" disabled={isSubmitting}>
            {isSubmitting ? 'Signing Up...' : 'Sign Up'}
        </Button>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-muted-foreground">or sign up with</span>
            </div>
        </div>
        <div className="flex justify-center gap-4">
            <Button onClick={handleGoogleSignup} variant="outline" size="icon" className="rounded-full" disabled={isSubmitting}>
                <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
            </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link href="/welcome" className="font-semibold text-primary hover:underline">
             Log in
            </Link>
        </p>
      </div>
    </div>
  );
}
