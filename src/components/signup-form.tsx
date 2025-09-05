
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, sendEmailVerification, updateProfile, User } from "firebase/auth";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, Eye, EyeOff, Play, ArrowRight, User as UserIcon } from "lucide-react";
import { logUserEvent } from "@/services/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const handleSuccessfulSignup = async (user: User) => {
    // This function will handle both setting local storage and logging the event
    const profile = {
        fullName: user.displayName,
        email: user.email,
        dob: '', // DOB is not available on signup
        profileImage: user.photoURL || ''
    };
    localStorage.setItem("userProfile", JSON.stringify(profile));

    if (user.email && user.displayName) {
         await logUserEvent({
            email: user.email,
            name: user.displayName,
            type: 'signup'
        });
    }
}


export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
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
            await handleSuccessfulSignup(auth.currentUser);
            toast({
                title: "Email Verified!",
                description: "Your account is active. You will be redirected.",
            });
            router.push('/profile/success');
        }
    }, 3000);

    return () => clearInterval(verificationInterval);
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
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // It's better to update the profile before sending the verification email
      await updateProfile(result.user, { displayName: fullName });
      
      await sendEmailVerification(result.user);
      
      setEmailSent(true);
      startResendTimer();

    } catch (error: any) {
      console.error("Error during email sign-up:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use. Please log in or use a different email.";
      } else if (error.code === 'auth/weak-password') {
        description = "The password is too weak. Please choose a stronger password (at least 8 characters).";
      }
      toast({ title: "Sign-up Failed", description, variant: "destructive" });
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
            <h1 className="text-3xl font-bold text-primary mb-4">Verify Your Email</h1>
            <p className="text-muted-foreground mb-6">
                A verification link has been sent to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.
            </p>
             <p className="text-sm text-muted-foreground mb-6">Once verified, you will be automatically redirected.</p>
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
    <div className="w-full max-w-lg mx-auto flex flex-col justify-center min-h-screen bg-background text-foreground p-6">
      <div className="bg-card p-8 rounded-2xl shadow-lg border border-border/50">
        <Tabs defaultValue="signup" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" onClick={() => router.push('/welcome')}>Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="signup">
                <div className="text-center my-6">
                    <h2 className="text-2xl font-bold">Create your Sutradhaar Account</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                       Start converting with a personalized workspace
                    </p>
                </div>
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aman Yadav" className="bg-secondary mt-1"/>
                    </div>
                    <div>
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. aman_y" className="bg-secondary mt-1"/>
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@domain.com" className="bg-secondary mt-1"/>
                    </div>
                    <div className="relative">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Create a strong password" 
                        className="bg-secondary mt-1 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-8 text-muted-foreground"
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
                        placeholder="Re-enter your password" 
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
                     <Button variant="ghost" onClick={handleSkip}>Skip for now</Button>
                     <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => router.push('/welcome')}><UserIcon className="mr-2 h-4 w-4"/> Login</Button>
                        <Button onClick={handleEmailSignup} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                           <UserIcon className="mr-2 h-4 w-4"/> {isSubmitting ? 'Signing Up...' : 'Sign Up'}
                        </Button>
                     </div>
                </div>

            </TabsContent>
        </Tabs>
        <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href="/welcome" className="font-semibold text-primary hover:underline">
            Login
            </Link>
        </p>
      </div>
    </div>
  );
}
