

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
                            <Logo className="w-8 h-8"/>
                            <h1 className="font-bold text-lg text-foreground hidden sm:block">Sutradhaar</h1>
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
                                className="w-full max-w-xs"
                            >
                                <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => setIsSearchActive(true)}>
                                   <Search className="text-muted-foreground"/>
                                   <span className="text-muted-foreground">Search...</span>
                               </Button>
                           </motion.div>
                        )}
                    </AnimatePresence>
                </div>


                <div className="flex items-center gap-1">
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
