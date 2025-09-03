
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";
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

  const handleEmailSignup = async () => {
    if (!email || !password || !fullName) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      const profile = {
        fullName: fullName,
        email: user.email || "",
        profileImage: user.photoURL || "https://picsum.photos/200",
        nickname: fullName.split(' ')[0] || "User",
        mobile: user.phoneNumber || ""
      };

      localStorage.setItem("userProfile", JSON.stringify(profile));
      toast({ title: "Account Created!", description: `Welcome, ${profile.fullName}!` });
      router.push("/");

    } catch (error: any) {
      console.error("Error during email sign-up:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email address is already in use. Please log in or use a different email.";
      } else if (error.code === 'auth/weak-password') {
        description = "The password is too weak. Please choose a stronger password.";
      }
      toast({ title: "Sign-up Failed", description, variant: "destructive" });
    }
  };

  const handleGoogleSignup = async () => {
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
      toast({ title: "Account Created!", description: `Welcome, ${profile.fullName}!` });
      router.push("/");

    } catch (error: any) {
      console.error("Error during Google sign-up:", error);
      toast({ title: "Sign-up Failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col justify-center min-h-screen bg-[#1A1A1A] text-white p-6">
       
      <header className="flex items-center gap-4 mb-8">
        <Link href="/welcome">
            <Button variant="ghost" size="icon" className="text-yellow-400">
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
        <Button onClick={handleEmailSignup} className="w-full h-12 bg-[#333333] hover:bg-[#444444] border border-gray-600 rounded-full text-lg">
            Sign Up
        </Button>
        <p className="text-center text-sm text-muted-foreground">or sign up with</p>
        <div className="flex justify-center gap-4">
            <Button onClick={handleGoogleSignup} variant="outline" size="icon" className="rounded-full bg-transparent border-gray-600 hover:bg-gray-700">
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
