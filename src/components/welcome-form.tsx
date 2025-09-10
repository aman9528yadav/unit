

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, User, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Eye, EyeOff, Info, ArrowRight, Play } from "lucide-react";
import { logUserEvent, listenToWelcomeContent, updateUserData, mergeLocalDataWithFirebase, getEmailForUsername } from "@/services/firestore";
import { useLanguage } from "@/context/language-context";


const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 48 48" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,36.596,44,31.016,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


const handleSuccessfulLogin = async (user: User) => {
    const profile = {
        fullName: user.displayName,
        email: user.email,
    };
    
    // Merge guest data with firebase account
    await mergeLocalDataWithFirebase(user.email!);
    
    // Ensure the user document exists in RTDB after merge
    await updateUserData(user.email!, {
        fullName: user.displayName,
        email: user.email,
        profileImage: user.photoURL,
    });

    localStorage.setItem("userProfile", JSON.stringify(profile));
    window.dispatchEvent(new StorageEvent('storage', { key: 'userProfile', newValue: JSON.stringify(profile) }));


    if (user.email && user.displayName) {
         await logUserEvent({
            email: user.email,
            name: user.displayName,
            type: 'login'
        });
    }
}


export function WelcomeForm() {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [welcomeContent, setWelcomeContent] = useState({ title: "Login to Sutradhaar", description: "Access your unit converter dashboard" });
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const unsub = listenToWelcomeContent((content) => {
        if (content) {
            setWelcomeContent(content);
        }
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
        toast({ title: t('welcome.toast.loginFailed.title'), description: t('welcome.toast.loginFailed.missingFields'), variant: "destructive" });
        return;
    }
    setIsSubmitting(true);

    let loginEmail = emailOrUsername;
    // Check if it's an email or username
    if (!emailOrUsername.includes('@')) {
        const emailFromDb = await getEmailForUsername(emailOrUsername);
        if (emailFromDb) {
            loginEmail = emailFromDb;
        } else {
            toast({ title: t('welcome.toast.loginFailed.title'), description: "Username not found.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }
    }


    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
         toast({ 
           title: t('welcome.toast.loginFailed.title'), 
           description: t('welcome.toast.loginFailed.notVerified'), 
           variant: "destructive" 
         });
         setIsSubmitting(false);
         return;
      }
      
      await handleSuccessfulLogin(user);
      router.push("/login-success");

    } catch (error: any) {
       toast({ title: t('welcome.toast.loginFailed.title'), description: t('welcome.toast.loginFailed.invalidCredentials'), variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        await handleSuccessfulLogin(result.user);
        router.push('/login-success');
    } catch (error) {
         console.error("Google Sign-in Error:", error);
         toast({ title: "Google Sign-in Failed", description: "Could not sign in with Google. Please try again.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    sessionStorage.setItem("hasSkippedLogin", "true");
    router.push("/");
  };

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col justify-center min-h-screen bg-background text-foreground p-6">
        <div className="bg-card p-6 rounded-2xl border-2 border-primary/20 mt-4">
              <div className="grid grid-cols-2 bg-muted p-1 rounded-lg mb-6">
                <Button variant="ghost" className="data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm" data-active="true">{t('welcome.tabs.login')}</Button>
                <Button variant="ghost" className="data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm" onClick={() => router.push('/signup')}>{t('welcome.tabs.signup')}</Button>
            </div>
             <div className="text-left mb-6">
                <h2 className="text-2xl font-bold">{welcomeContent.title}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                   {welcomeContent.description}
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="email">{t('welcome.emailLabel')}</Label>
                    <Input id="email" type="text" value={emailOrUsername} onChange={(e) => setEmailOrUsername(e.target.value)} className="bg-background mt-1" placeholder={t('welcome.emailPlaceholder')} />
                </div>
                <div className="relative">
                    <Label htmlFor="password">{t('welcome.passwordLabel')}</Label>
                    <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="bg-background mt-1 pr-10" 
                    placeholder="**********" 
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-8 text-muted-foreground"
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                </div>
            </div>

            <div className="flex justify-between items-center mt-6">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">{t('welcome.forgotPassword')}</Link>
                 <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                    {isSubmitting ? t('welcome.loggingIn') : t('welcome.loginButton')} <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            </div>

             <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-muted"></div>
                <span className="flex-shrink mx-4 text-muted-foreground text-xs">OR</span>
                <div className="flex-grow border-t border-muted"></div>
            </div>

             <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                <GoogleIcon className="w-5 h-5 mr-2" />
                Sign in with Google
            </Button>


             <p className="text-center text-sm text-muted-foreground mt-8">
                {t('welcome.noAccount')}{" "}
                <Link href="/signup" className="font-semibold text-primary hover:underline">
                {t('welcome.signupLink')}
                </Link>
            </p>
            <p className="text-center text-xs text-muted-foreground mt-6">
                By continuing, you agree to our <Link href="/privacy-policy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>.
            </p>
        </div>
         <Button variant="outline" onClick={handleSkip} className="mt-4">
            <Play className="mr-2 h-4 w-4 rotate-180"/> {t('welcome.skip')}
        </Button>
    </div>
  );
}
