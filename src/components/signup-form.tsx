
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();

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
      toast({
        title: "Account Created!",
        description: `Welcome, ${profile.fullName}!`,
      });
      router.push("/");

    } catch (error: any) {
      console.error("Error during Google sign-up:", error);
      toast({
        title: "Sign-up Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center gap-8 p-4 sm:p-6 min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Create Account</h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          Join UniConvert to get access to all features and save your preferences.
        </p>
      </div>
      
      <div className="w-full space-y-4">
        <Button
          onClick={handleGoogleSignup}
          className="w-full h-12 bg-card text-card-foreground font-bold text-base rounded-lg hover:bg-card/90 border flex items-center justify-center gap-2"
        >
          <Image src="/google-logo.svg" alt="Google" width={24} height={24} />
          Sign up with Google
        </Button>
      </div>

       <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/welcome" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
