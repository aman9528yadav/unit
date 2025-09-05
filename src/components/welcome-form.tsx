
"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Eye, EyeOff } from "lucide-react";

const GoogleIcon = () => (
    <svg viewBox="0 0 48 48" className="w-5 h-5">
      <title>Google Logo</title>
      <clipPath id="g">
        <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
      </clipPath>
      <g clipPath="url(#g)">
        <path fill="#FBBC05" d="M0 37V11l17 13z"/>
        <path fill="#EA4335" d="M0 11l17 13 7-6.1L48 14V0H0z"/>
        <path fill="#34A853" d="M0 37l30-23 7.9 1L48 0v48H0z"/>
        <path fill="#4285F4" d="M48 48L17 24l-4-3 35-10z"/>
      </g>
    </svg>
);


export function WelcomeForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
        toast({ title: "Login Failed", description: "Please enter both email and password.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
         toast({ 
           title: "Login Failed", 
           description: "Please verify your email address before logging in. Check your inbox for the verification link.", 
           variant: "destructive" 
         });
         setIsSubmitting(false);
         return;
      }
      
      const storedProfile = localStorage.getItem("userProfile");
      const existingProfile = storedProfile ? JSON.parse(storedProfile) : {};

      const profile = {
        fullName: user.displayName || email.split('@')[0],
        email: user.email,
        profileImage: user.photoURL || "https://picsum.photos/200",
        dob: existingProfile.email === user.email ? existingProfile.dob : ''
      };

      localStorage.setItem("userProfile", JSON.stringify(profile));
      router.push("/profile/success");

    } catch (error: any) {
       toast({ title: "Login Failed", description: "Invalid email or password. Please try again.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
     const provider = new GoogleAuthProvider();
     setIsSubmitting(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const storedProfile = localStorage.getItem("userProfile");
      const existingProfile = storedProfile ? JSON.parse(storedProfile) : {};

      const profile = {
        fullName: user.displayName || "New User",
        email: user.email,
        profileImage: user.photoURL || "https://picsum.photos/200",
        dob: existingProfile.email === user.email ? existingProfile.dob : ''
      };

      localStorage.setItem("userProfile", JSON.stringify(profile));
      router.push("/profile/success");

    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      toast({ title: "Sign-in Failed", description: "Could not sign in with Google. Please try again.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const handleSkip = () => {
    sessionStorage.setItem("hasSkippedLogin", "true");
    router.push("/");
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-screen bg-background text-foreground p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Log In</h1>
      </div>

      <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Welcome</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Your all-in-one solution for seamless unit conversions, calculations, and note-taking. Log in to sync your data across devices.
          </p>
      </div>
      
      <div className="bg-card p-8 rounded-2xl">
          <div className="space-y-6">
            <div>
                <Label htmlFor="email">Username or email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary mt-2" placeholder="example@example.com" />
            </div>
            <div className="relative">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="bg-secondary mt-2 pr-10" 
                  placeholder="**********" 
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-9 text-muted-foreground"
                >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                 <div className="text-right mt-2">
                    <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot Password?</Link>
                </div>
            </div>
          </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <Button onClick={handleLogin} className="w-full h-12 bg-primary hover:bg-primary/90 rounded-full text-lg text-primary-foreground" disabled={isSubmitting}>
           {isSubmitting ? 'Logging In...' : 'Log In'}
        </Button>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-background px-2 text-muted-foreground">or log in with</span>
            </div>
        </div>
        <div className="flex justify-center gap-4">
            <Button onClick={handleGoogleLogin} variant="outline" size="icon" className="rounded-full" disabled={isSubmitting}>
                <GoogleIcon />
            </Button>
        </div>

         <div className="text-center">
             <Button variant="link" onClick={handleSkip} className="text-muted-foreground">Skip for now</Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
             Sign Up
            </Link>
        </p>
      </div>
    </div>
  );
}
