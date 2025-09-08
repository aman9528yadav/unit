

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, User, Settings, Languages, Sigma, Calculator, NotebookPen, History as HistoryIcon, Timer, ArrowLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/context/language-context";
import { listenToUserData, UserData } from "@/services/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Notifications } from "./notifications";

interface UserProfile {
    fullName: string;
    email: string;
    profileImage?: string;
}

const pageTitles: { [key: string]: { title: string, icon: React.ElementType } } = {
    '/': { title: 'Dashboard', icon: Home },
    '/converter': { title: 'Unit Converter', icon: Sigma },
    '/calculator': { title: 'Calculator', icon: Calculator },
    '/notes': { title: 'Notes', icon: NotebookPen },
    '/history': { title: 'History', icon: HistoryIcon },
    '/time': { title: 'Time Utilities', icon: Timer },
    '/settings': { title: 'Settings', icon: Settings },
};

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useLanguage();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);

    const pageInfo = pageTitles[pathname] || { title: 'Sutradhaar', icon: Home };
    const defaultPage = userData?.settings?.defaultPage || 'dashboard';
    const isHomePage = pathname === `/${defaultPage}` || (defaultPage === 'dashboard' && pathname === '/');
    
    useEffect(() => {
        const storedProfileData = localStorage.getItem("userProfile");
        if(storedProfileData) {
            setProfile(JSON.parse(storedProfileData));
        }

        const userEmail = storedProfileData ? JSON.parse(storedProfileData).email : null;
        const unsub = listenToUserData(userEmail, (data) => {
            setUserData(data);
        });

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'userProfile' && event.newValue) {
                setProfile(JSON.parse(event.newValue));
            }
        };

        window.addEventListener('storage', handleStorageChange);
        
        return () => {
            unsub();
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const handleProfileClick = () => {
        if (profile) {
            router.push('/profile');
        } else {
            router.push('/welcome');
        }
    };
    
    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm py-4">
            <div className="w-full max-w-lg flex items-center gap-4">
                 <div className="flex items-center gap-2 mr-auto">
                    {!isHomePage && (
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft />
                        </Button>
                    )}
                    <pageInfo.icon className="h-6 w-6 text-primary" />
                    <h1 className="text-lg font-bold tracking-tight text-foreground">{pageInfo.title}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <LanguageToggle />
                    <Notifications />
                    <Button variant="ghost" size="icon" className="rounded-full" onClick={handleProfileClick}>
                        <Avatar className="h-10 w-10 border border-border bg-card text-foreground">
                            <AvatarImage src={profile?.profileImage}/>
                            <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                    </Button>
                </div>
            </div>
        </header>
    )
}

const LanguageToggle = () => {
    const { language, setLanguage } = useLanguage();
    return (
        <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'hi')}>
            <SelectTrigger className="w-[120px] bg-card border-border">
                <Languages className="mr-2 h-4 w-4" />
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
        </Select>
    );
};
