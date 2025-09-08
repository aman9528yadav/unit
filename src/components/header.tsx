

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, User, Settings, Languages, Sigma, Calculator, NotebookPen, History as HistoryIcon, Timer, ArrowLeft, HelpCircle, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/context/language-context";
import { listenToUserData, UserData } from "@/services/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Notifications } from "./notifications";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { GlobalSearch } from "./global-search";

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

const navLinks = [
    { href: "/", label: "Dashboard", icon: Home },
    { href: "/converter", label: "Converter", icon: Sigma },
    { href: "/calculator", label: "Calculator", icon: Calculator },
    { href: "/notes", label: "Notes", icon: NotebookPen },
    { href: "/history", label: "History", icon: HistoryIcon },
    { href: "/time", label: "Timer", icon: Timer },
    { href: "/settings", label: "Settings", icon: Settings },
]

export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useLanguage();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);

    const pageInfo = pageTitles[pathname] || { title: 'Sutradhaar', icon: Home };
    const defaultPage = userData?.settings?.defaultPage || 'dashboard';

    // A page is only the "home" page if it's the root and the default is dashboard,
    // or if it's the specific default page.
    const isHomePage = (pathname === `/${defaultPage}`) || (pathname === '/' && defaultPage === 'dashboard');

    
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
        <header className="sticky top-0 z-40 w-full max-w-lg border-b bg-background/80 backdrop-blur-sm py-2">
            <div className="flex items-center gap-2">
                 <div className="flex items-center gap-2 mr-auto">
                    {!isHomePage && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <pageInfo.icon className="h-5 w-5 text-primary" />
                    <h1 className="text-base font-bold tracking-tight text-foreground">{pageInfo.title}</h1>
                </div>

                <div className="flex items-center gap-1">
                    <GlobalSearch />
                    <LanguageToggle />
                    <Notifications />
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={handleProfileClick}>
                        <Avatar className="h-8 w-8 border border-border bg-card text-foreground">
                            <AvatarImage src={profile?.profileImage}/>
                            <AvatarFallback><User /></AvatarFallback>
                        </Avatar>
                    </Button>
                </div>
            </div>
             <ScrollArea className="w-full whitespace-nowrap rounded-lg mt-2">
                <nav className="flex w-max space-x-2 pb-2">
                    {navLinks.map(link => (
                        <Link key={link.href} href={link.href} passHref>
                            <Button
                                variant={pathname === link.href ? "secondary" : "ghost"}
                                className="text-sm px-3 py-1 h-auto flex-shrink-0"
                            >
                                {link.label}
                            </Button>
                        </Link>
                    ))}
                    <Link href="/how-to-use" passHref>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <HelpCircle className="h-5 w-5"/>
                        </Button>
                    </Link>
                </nav>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </header>
    )
}

const LanguageToggle = () => {
    const { language, setLanguage } = useLanguage();
    return (
        <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'hi')}>
            <SelectTrigger className="w-[80px] h-9 bg-card border-border">
                <Languages className="mr-2 h-4 w-4" />
                <span>{language === 'en' ? 'En' : 'Hi'}</span>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिन्दी</SelectItem>
            </SelectContent>
        </Select>
    );
};
