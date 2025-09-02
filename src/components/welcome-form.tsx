
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

export function WelcomeForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Login Successful" });
      
      const user = auth.currentUser;
      if (user) {
        // Fetch or create profile
         const profile = {
            fullName: user.displayName || "User",
            email: user.email || "",
            profileImage: user.photoURL || "https://picsum.photos/200",
            nickname: user.displayName?.split(' ')[0] || "User",
            mobile: user.phoneNumber || ""
          };
          localStorage.setItem("userProfile", JSON.stringify(profile));
      }
      router.push("/");
    } catch (error: any) {
       toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleGoogleLogin = async () => {
     const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const profile = {
        fullName: user.displayName || "New User",
        email: user.email || "",
        profileImage: user.photoURL || "https://picsum.photos/200",
        nickname: user.displayName?.split(' ')[0] || "User",
        mobile: user.phoneNumber || ""
      };

      localStorage.setItem("userProfile", JSON.stringify(profile));
      toast({ title: "Login Successful!", description: `Welcome back, ${profile.fullName}!` });
      router.push("/");

    } catch (error: any) {
      console.error("Error during Google sign-in:", error);
      toast({ title: "Sign-in Failed", description: error.message, variant: "destructive" });
    }
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center gap-8 p-4 sm:p-6 min-h-screen">
       <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome Back!</h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          Log in to continue your journey with UniConvert.
        </p>
      </div>

      <div className="w-full space-y-4">
        <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary mt-1 h-12 rounded-lg border-none" placeholder="aman@example.com" />
        </div>
        <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-secondary mt-1 h-12 rounded-lg border-none" placeholder="••••••••" />
        </div>
        <div className="pt-4">
            <Button type="button" onClick={handleLogin} className="w-full h-14 bg-accent text-accent-foreground font-bold text-lg rounded-full hover:bg-accent/90">
                Log In
            </Button>
        </div>
      </div>
      
       <p className="text-center text-sm text-muted-foreground">
        Or, log in with a provider:
      </p>

      <div className="w-full">
         <Button onClick={handleGoogleLogin}  className="w-full h-12 bg-card text-card-foreground font-bold text-base rounded-lg hover:bg-card/90 border flex items-center justify-center gap-2">
            <Image src="/google-logo.svg" alt="Google" width={24} height={24} />
            Continue with Google
         </Button>
      </div>

       <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
