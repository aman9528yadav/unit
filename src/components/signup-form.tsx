
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function SignupForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  const setupRecaptcha = () => {
    if (!recaptchaContainerRef.current) return;
    
    // Ensure the container is empty before creating a new verifier
    recaptchaContainerRef.current.innerHTML = "";

    const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
      'size': 'invisible',
      'callback': (response: any) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
    return recaptchaVerifier;
  }

  const handleEmailSignup = async () => {
    if (!email || !password || !fullName) {
      toast({ title: "Please fill all fields", variant: "destructive" });
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
      toast({ title: "Sign-up Failed", description: error.message, variant: "destructive" });
    }
  };

  const handlePhoneSignup = async () => {
    if (!phone) {
        toast({ title: "Please enter a phone number", variant: "destructive" });
        return;
    }
    try {
        const recaptchaVerifier = setupRecaptcha();
        if (!recaptchaVerifier) {
            toast({ title: "Recaptcha setup failed", variant: "destructive" });
            return;
        }
        const result = await signInWithPhoneNumber(auth, phone, recaptchaVerifier);
        setConfirmationResult(result);
        setIsOtpSent(true);
        toast({ title: "OTP Sent!", description: "Please check your phone for the verification code." });
    } catch (error: any) {
        console.error("Error during phone sign-up:", error);
        toast({ title: "Phone Sign-up Failed", description: error.message, variant: "destructive" });
    }
  };

  const handleVerifyOtp = async () => {
     if (!otp) {
        toast({ title: "Please enter the OTP", variant: "destructive" });
        return;
    }
    try {
        await confirmationResult.confirm(otp);
        const user = auth.currentUser;
        if (user) {
            const profile = {
                fullName: "New User", // Or prompt for name
                email: user.email || "",
                profileImage: user.photoURL || "https://picsum.photos/200",
                nickname: "User",
                mobile: user.phoneNumber || ""
            };
            localStorage.setItem("userProfile", JSON.stringify(profile));
            toast({ title: "Account Verified!", description: "Welcome!" });
            router.push("/");
        }
    } catch (error: any) {
         console.error("Error during OTP verification:", error);
        toast({ title: "OTP Verification Failed", description: error.message, variant: "destructive" });
    }
  }


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
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center gap-8 p-4 sm:p-6 min-h-screen">
       <div ref={recaptchaContainerRef}></div>
       <div className="text-center">
        <h1 className="text-3xl font-bold">Create Account</h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          Join UniConvert to get access to all features and save your preferences.
        </p>
      </div>
      
       <Tabs defaultValue="google" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="phone">Phone</TabsTrigger>
        </TabsList>
        <TabsContent value="google" className="mt-6">
            <Button onClick={handleGoogleSignup} className="w-full h-12 bg-card text-card-foreground font-bold text-base rounded-lg hover:bg-card/90 border flex items-center justify-center gap-2">
                <Image src="/google-logo.svg" alt="Google" width={24} height={24} />
                Sign up with Google
            </Button>
        </TabsContent>
        <TabsContent value="email" className="mt-6">
            <div className="space-y-4">
                 <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aman Yadav" className="mt-1"/>
                </div>
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aman@example.com" className="mt-1"/>
                </div>
                <div>
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1"/>
                </div>
                <Button onClick={handleEmailSignup} className="w-full h-12">Sign up with Email</Button>
            </div>
        </TabsContent>
         <TabsContent value="phone" className="mt-6">
            <div className="space-y-4">
                {!isOtpSent ? (
                    <>
                        <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 123 456 7890" className="mt-1"/>
                        </div>
                        <Button onClick={handlePhoneSignup} className="w-full h-12">Send OTP</Button>
                    </>
                ) : (
                    <>
                        <div>
                            <Label htmlFor="otp">Verification Code</Label>
                            <Input id="otp" type="text" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" className="mt-1"/>
                        </div>
                        <Button onClick={handleVerifyOtp} className="w-full h-12">Verify OTP</Button>
                    </>
                )}
            </div>
        </TabsContent>
      </Tabs>


       <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/welcome" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
