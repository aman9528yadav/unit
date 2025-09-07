
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, User } from "firebase/auth";
import { Eye, EyeOff, Info, ArrowRight, Play } from "lucide-react";
import { logUserEvent } from "@/services/firestore";
import { useLanguage } from "@/context/language-context";


const handleSuccessfulLogin = async (user: User) => {
    const storedProfile = localStorage.getItem("userProfile");
    const existingProfile = storedProfile ? JSON.parse(storedProfile) : {};

    const profile = {
        fullName: user.displayName || user.email?.split('@')[0] || "New User",
        email: user.email,
        dob: existingProfile.email === user.email ? existingProfile.dob : '',
    };

    localStorage.setItem("userProfile", JSON.stringify(profile));

    if (user.email && user.displayName) {
        await logUserEvent({
            email: user.email,
            name: user.displayName,
            type: 'login'
        });
    }
}


export function WelcomeForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useLanguage();

  const handleLogin = async () => {
    if (!email || !password) {
        toast({ title: t('welcome.toast.loginFailed.title'), description: t('welcome.toast.loginFailed.missingFields'), variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
      router.push("/");

    } catch (error: any) {
       toast({ title: t('welcome.toast.loginFailed.title'), description: t('welcome.toast.loginFailed.invalidCredentials'), variant: "destructive" });
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
        <header className="flex justify-between items-center py-4 mb-8">
             <h1 className="text-xl font-bold flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <ArrowRight className="rotate-[-45deg]"/>
                </div>
                Sutradhaar
            </h1>
            <Button variant="outline" onClick={handleSkip}>
                <Play className="mr-2 h-4 w-4 rotate-180"/> {t('welcome.skip')}
            </Button>
        </header>

        <div className="bg-card p-6 rounded-2xl border-2 border-primary/20 mt-4">
              <div className="grid grid-cols-2 bg-muted p-1 rounded-lg mb-6">
                <Button variant="ghost" className="data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm" data-active="true">{t('welcome.tabs.login')}</Button>
                <Button variant="ghost" className="data-[active=true]:bg-background data-[active=true]:text-foreground data-[active=true]:shadow-sm" onClick={() => router.push('/signup')}>{t('welcome.tabs.signup')}</Button>
            </div>
             <div className="text-left mb-6">
                <h2 className="text-2xl font-bold">{t('welcome.title')}</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                   {t('welcome.description')}
                </p>
            </div>

            <div className="bg-primary/10 text-primary-foreground p-3 rounded-lg mb-6 flex items-center gap-3 text-sm">
                <Info className="text-primary"/>
                <span className="text-primary font-medium">{t('welcome.info')}</span>
            </div>

            <div className="space-y-4">
                <div>
                    <Label htmlFor="email">{t('welcome.emailLabel')}</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background mt-1" placeholder={t('welcome.emailPlaceholder')} />
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
    </div>
  );
}
