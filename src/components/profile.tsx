
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Star,
  Lock,
  Settings,
  HelpCircle,
  LogOut,
  Code,
  Gift,
  Pencil,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { getStreakData, StreakData } from "@/lib/streak";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";

interface UserProfile {
    fullName: string;
    email: string;
    birthday: string;
    dob: string;
    profileImage?: string;
}

const defaultProfile: UserProfile = {
    fullName: "Aman Yadav",
    email: "aman@example.com",
    birthday: "April 1st",
    dob: "1990-04-01",
    profileImage: '',
};

export function Profile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
       if (parsed.dob && !isNaN(new Date(parsed.dob).getTime())) {
        parsed.birthday = format(new Date(parsed.dob), "MMMM do");
      }
      setProfile(parsed);
    } else {
        router.replace('/welcome');
    }

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'userProfile' && e.newValue) {
            setProfile(JSON.parse(e.newValue));
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, [router]);

  const handleLogout = () => {
    auth.signOut().then(() => {
        localStorage.removeItem("userProfile");
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        router.push("/logout");
    }).catch((error) => {
        console.error("Logout Error:", error);
        toast({ title: "Logout Failed", description: "An error occurred while logging out.", variant: "destructive" });
    });
  };

  const menuItems = [
    { icon: User, text: "User Data", href: "/userdata" },
    { icon: Star, text: "Favorite", href: "/history" },
    { icon: Gift, text: "What's New", href: "/updates" },
    { icon: Lock, text: "Privacy Policy", href: "/privacy-policy" },
    { icon: Settings, text: "Settings", href: "/settings" },
    { icon: HelpCircle, text: "Help", href: "/help" },
    { icon: Info, text: "About", href: "/about" },
    { icon: LogOut, text: "Logout", onClick: handleLogout }
  ];


  if (!isClient) {
    return null; // or a loading spinner
  }

  return (
    <div className="w-full max-w-md mx-auto text-foreground flex flex-col">
      <div className="bg-primary/80 text-primary-foreground pb-8 rounded-b-3xl">
        <header className="p-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-white/20">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">My Profile</h1>
        </header>

        <div className="flex flex-col items-center text-center gap-2 mt-2">
           <div className="relative w-28 h-28">
                <Avatar className="w-28 h-28 text-6xl border-4 border-background">
                    <AvatarImage src={profile.profileImage} alt={profile.fullName} />
                    <AvatarFallback>
                        <User />
                    </AvatarFallback>
                </Avatar>
                <Button asChild size="icon" className="absolute bottom-0 right-0 rounded-full w-8 h-8">
                    <Link href="/profile/edit">
                        <Pencil />
                    </Link>
                </Button>
            </div>
          <h2 className="text-2xl font-bold mt-2">{profile.fullName}</h2>
          <p className="text-sm">{profile.email}</p>
          <p className="text-sm">Birthday: {profile.birthday}</p>
        </div>
      </div>

      <nav className="mt-6 px-4 flex-grow">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
             const content = (
                <div className="flex items-center p-3 rounded-lg hover:bg-card transition-colors">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="ml-4 font-medium">{item.text}</span>
                  <ChevronRight className="ml-auto w-5 h-5 text-muted-foreground" />
                </div>
              );

            return (
              <li key={index} onClick={item.onClick}>
                {item.href ? <Link href={item.href}>{content}</Link> : <div className="cursor-pointer">{content}</div>}
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  );
}
