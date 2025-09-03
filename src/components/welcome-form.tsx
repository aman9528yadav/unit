
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
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendEmailVerification } from "firebase/auth";

export function WelcomeForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
          title: "Email Not Verified",
          description: "Please check your inbox and verify your email before logging in.",
          variant: "destructive",
          action: (
            <Button variant="secondary" onClick={() => sendEmailVerification(user)}>
                Resend Email
            </Button>
          ),
          duration: 9000,
        });
        await auth.signOut(); // Log the user out
        setIsSubmitting(false);
        return;
      }
      
      const profile = {
        fullName: user.displayName || email.split('@')[0], // Fallback for email/pass users
        email: user.email || "",
        profileImage: user.photoURL || "https://picsum.photos/200",
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
      
      const profile = {
        fullName: user.displayName || "New User",
        email: user.email || "",
        profileImage: user.photoURL || "https://picsum.photos/200",
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

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-screen bg-[#1A1A1A] text-white p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-yellow-400">Log In</h1>
      </div>

      <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Welcome</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.
          </p>
      </div>
      
      <div className="bg-[#4D4D4D] p-8 rounded-2xl">
          <div className="space-y-6">
            <div>
                <Label htmlFor="email">Username or email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white text-black mt-2" placeholder="example@example.com" />
            </div>
            <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white text-black mt-2" placeholder="**********" />
                 <div className="text-right mt-2">
                    <Link href="#" className="text-xs text-yellow-400 hover:underline">Forgot Password?</Link>
                </div>
            </div>
          </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <Button onClick={handleLogin} className="w-full h-12 bg-[#333333] hover:bg-[#444444] border border-gray-600 rounded-full text-lg" disabled={isSubmitting}>
           {isSubmitting ? 'Logging In...' : 'Log In'}
        </Button>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600"></span>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-[#1A1A1A] px-2 text-muted-foreground">or log in with</span>
            </div>
        </div>
        <div className="flex justify-center gap-4">
            <Button onClick={handleGoogleLogin} variant="outline" size="icon" className="rounded-full bg-transparent border-gray-600 hover:bg-gray-700" disabled={isSubmitting}>
                <Image src="/google-logo.svg" alt="Google" width={20} height={20} />
            </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-yellow-400 hover:underline">
             Sign Up
            </Link>
        </p>
      </div>
    </div>
  );
}
