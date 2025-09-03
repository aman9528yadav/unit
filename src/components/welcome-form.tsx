
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
        <Button onClick={handleLogin} className="w-full h-12 bg-[#333333] hover:bg-[#444444] border border-gray-600 rounded-full text-lg">
            Log In
        </Button>
        <p className="text-center text-sm text-muted-foreground">or sign up with</p>
        <div className="flex justify-center gap-4">
            <Button onClick={handleGoogleLogin} variant="outline" size="icon" className="rounded-full bg-transparent border-gray-600 hover:bg-gray-700">
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
