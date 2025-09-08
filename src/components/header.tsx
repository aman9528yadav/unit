

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Menu, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { listenToUserData } from "@/services/firestore";
import { GlobalSearch } from "./global-search";
import { SidebarTrigger } from "./ui/sidebar";
import { Logo } from "./logo";
import { useLanguage } from "./language-context";

interface UserProfile {
    fullName: string;
    email: string;
    profileImage?: string;
}

export function Header() {
    const router = useRouter();
    const { t } = useLanguage();
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const storedProfileData = localStorage.getItem("userProfile");
        if(storedProfileData) {
            setProfile(JSON.parse(storedProfileData));
        }

        const userEmail = storedProfileData ? JSON.parse(storedProfileData).email : null;
        const unsub = listenToUserData(userEmail, (data) => {
             if (data && data.fullName) {
                setProfile(data as UserProfile);
            }
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
        <header className="sticky top-0 z-40 w-full px-4 py-2">
            <div className="flex items-center justify-between gap-2 h-14 px-4 bg-card rounded-full border border-primary/20 shadow-md">
                 <div className="flex items-center gap-2 mr-auto">
                    <Logo className="w-8 h-8"/>
                    <h1 className="font-bold text-lg text-foreground">Sutradhaar</h1>
                </div>

                <div className="flex items-center gap-1">
                    <GlobalSearch />
                     <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={handleProfileClick}>
                        {profile ? (
                            <Avatar className="h-8 w-8 border border-border bg-card text-foreground">
                                <AvatarImage src={profile.profileImage}/>
                                <AvatarFallback><User /></AvatarFallback>
                            </Avatar>
                        ) : (
                             <User />
                        )}
                    </Button>
                    <SidebarTrigger asChild>
                         <Button variant="ghost" size="icon">
                            <Menu />
                        </Button>
                    </SidebarTrigger>
                </div>
            </div>
        </header>
    )
}
