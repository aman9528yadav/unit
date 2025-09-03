
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
import { ArrowLeft } from "lucide-react";

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

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0 && emailSent) {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer, emailSent]);


  const startResendTimer = () => {
    setResendTimer(30);
    setCanResend(false);
  };

  const handleResendEmail = async () => {
    if (currentUser) {
        setIsSubmitting(true);
        try {
            await sendEmailVerification(currentUser);
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
      setCurrentUser(result.user); // Save user for resend logic
      setEmailSent(true);
      startResendTimer();
      
      const profile = {
        fullName: fullName,
        email: email,
        profileImage: "https://picsum.photos/200", // Default profile image
      };
      localStorage.setItem("userProfile", JSON.stringify(profile));

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
      
      // For Google sign-in, email is automatically verified.
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
        <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-screen bg-[#1A1A1A] text-white p-6 text-center">
            <h1 className="text-3xl font-bold text-yellow-400 mb-4">Verify Your Email</h1>
            <p className="text-muted-foreground mb-6">
                A verification link has been sent to <strong>{email}</strong>. Please check your inbox and click the link to activate your account.
            </p>
            <Button onClick={handleResendEmail} className="w-full h-12 bg-[#333333] hover:bg-[#444444] border border-gray-600 rounded-full text-lg" disabled={!canResend || isSubmitting}>
                {isSubmitting ? 'Sending...' : (canResend ? 'Resend Email' : `Resend in ${resendTimer}s`)}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-8">
                Already verified?{" "}
                <Link href="/welcome" className="font-semibold text-yellow-400 hover:underline">
                 Log In
                </Link>
            </p>
        </div>
    )
  }

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-screen bg-[#1A1A1A] text-white p-6">
       
      <header className="flex items-center gap-4 mb-8">
        <Link href="/welcome">
            <Button variant="ghost" size="icon" className="text-yellow-400 hover:bg-yellow-400/10">
                <ArrowLeft />
            </Button>
        </Link>
        <h1 className="text-2xl font-bold text-yellow-400">Create Account</h1>
      </header>

       <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Let's Start!</h2>
      </div>
      
       <div className="bg-[#4D4D4D] p-8 rounded-2xl">
            <div className="space-y-4">
                 <div>
                    <Label htmlFor="fullName">Full name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aman Yadav" className="bg-white text-black mt-2"/>
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@example.com" className="bg-white text-black mt-2"/>
                </div>
                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="**********" className="bg-white text-black mt-2"/>
                </div>
                 <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="**********" className="bg-white text-black mt-2"/>
                </div>
            </div>
      </div>
      
      <p className="text-center text-xs text-muted-foreground my-6">
          By continuing, you agree to <Link href="#" className="text-yellow-400">Terms of Use</Link> and <Link href="#" className="text-yellow-400">Privacy Policy</Link>.
      </p>

      <div className="mt-4 space-y-4">
        <Button onClick={handleEmailSignup} className="w-full h-12 bg-[#333333] hover:bg-[#444444] border border-gray-600 rounded-full text-lg" disabled={isSubmitting}>
            {isSubmitting ? 'Signing Up...' : 'Sign Up'}
        </Button>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600"></span>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-[#1A1A1A] px-2 text-muted-foreground">or sign up with</span>
            </div>
        </div>
        <div className="flex justify-center gap-4">
            <Button onClick={handleGoogleSignup} variant="outline" size="icon" className="rounded-full bg-transparent border-gray-600 hover:bg-gray-700" disabled={isSubmitting}>
                <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
            </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link href="/welcome" className="font-semibold text-yellow-400 hover:underline">
             Log in
            </Link>
        </p>
      </div>
    </div>
  );
}
