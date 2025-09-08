
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User, Menu, Search, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { listenToUserData } from "@/services/firestore";
import { GlobalSearch } from "./global-search";
import { SidebarTrigger } from "./ui/sidebar";
import { Logo } from "./logo";
import { useLanguage } from '@/context/language-context';
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Notifications } from "./notifications";

interface UserProfile {
    fullName: string;
    email: string;
    profileImage?: string;
}

export function Header() {
    const router = useRouter();
    const { t } = useLanguage();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const storedProfileData = localStorage.getItem("userProfile");
        if(storedProfileData) {
            setProfile(JSON.parse(storedProfileData));
            setIsLoggedIn(true);
        } else {
            setIsLoggedIn(false);
        }

        const userEmail = storedProfileData ? JSON.parse(storedProfileData).email : null;
        const unsub = listenToUserData(userEmail, (data) => {
             if (data && data.fullName) {
                setProfile(data as UserProfile);
            }
        });

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'userProfile') {
                const newProfile = event.newValue;
                if (newProfile) {
                    setProfile(JSON.parse(newProfile));
                    setIsLoggedIn(true);
                } else {
                    setProfile(null);
                    setIsLoggedIn(false);
                }
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
                <AnimatePresence>
                    {!isSearchActive && (
                        <motion.div
                            key="logo"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20, position: 'absolute' }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="flex items-center gap-2"
                        >
                            <SidebarTrigger asChild>
                                 <Button variant="ghost" size="icon">
                                    <Menu />
                                </Button>
                            </SidebarTrigger>
                             <h1 className="font-bold text-lg">Sutradhaar</h1>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 flex justify-center items-center">
                    <AnimatePresence>
                        {isSearchActive ? (
                            <GlobalSearch isSearchActive={isSearchActive} onSearchToggle={setIsSearchActive} />
                        ) : (
                             <motion.div
                                key="search-button"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="w-full max-w-xs flex justify-center"
                            >
                                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsSearchActive(true)} disabled={!isLoggedIn}>
                                   <Search className="text-muted-foreground"/>
                               </Button>
                           </motion.div>
                        )}
                    </AnimatePresence>
                </div>


                <div className="flex items-center gap-1">
                     <Notifications />
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
                </div>
            </div>
        </header>
    )
}
