
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
  Info,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useLanguage } from "@/context/language-context";
import { getStats } from "@/lib/stats";
import { Badge } from "./ui/badge";
import { motion } from "framer-motion";

const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";
const PREMIUM_MEMBER_THRESHOLD = 8000;
type UserRole = 'Member' | 'Premium Member' | 'Owner';


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
};

export function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('Member');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const updateUserRole = async (email: string | null) => {
    if(email === DEVELOPER_EMAIL) {
        setUserRole('Owner');
        return;
    }
    const stats = await getStats(email);
    if(stats.totalOps >= PREMIUM_MEMBER_THRESHOLD) {
        setUserRole('Premium Member');
    } else {
        setUserRole('Member');
    }
  };

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
       if (parsed.dob && !isNaN(new Date(parsed.dob).getTime())) {
        parsed.birthday = format(new Date(parsed.dob), "MMMM do");
      }
      setProfile(parsed);
      updateUserRole(parsed.email);
    } else {
        router.replace('/welcome');
    }

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'userProfile' && e.newValue) {
            const newProfile = JSON.parse(e.newValue);
            setProfile(newProfile);
            updateUserRole(newProfile.email);
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);

  }, [router]);

  const handleLogout = () => {
    auth.signOut().then(() => {
        localStorage.removeItem("userProfile");
        toast({ title: t('profile.toast.logout.title'), description: t('profile.toast.logout.description') });
        router.push("/logout");
    }).catch((error) => {
        console.error("Logout Error:", error);
        toast({ title: t('profile.toast.logoutFailed.title'), description: t('profile.toast.logoutFailed.description'), variant: "destructive" });
    });
  };

  const menuItems = [
    { icon: Gift, text: t('profile.menu.whatsNew'), href: "/updates" },
    { icon: Lock, text: t('profile.menu.privacy'), href: "/privacy-policy" },
    { icon: Settings, text: t('profile.menu.settings'), href: "/settings" },
    { icon: HelpCircle, text: t('profile.menu.help'), href: "/help" },
    { icon: Info, text: t('profile.menu.about'), href: "/about" },
    { icon: LogOut, text: t('profile.menu.logout'), onClick: handleLogout }
  ];

  if (profile?.email === DEVELOPER_EMAIL) {
    menuItems.splice(5, 0, { icon: Code, text: t('profile.menu.developer'), href: "/dev" });
  }


  if (!isClient || !profile) {
    return null; // or a loading spinner
  }

  const roleText = {
      'Member': 'Member',
      'Premium Member': 'Premium',
      'Owner': 'Owner'
  }

  return (
    <motion.div 
        className="w-full max-w-md mx-auto text-foreground flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="bg-primary/80 text-primary-foreground pb-8 rounded-b-3xl">
        <header className="p-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-white/20">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{t('profile.title')}</h1>
        </header>

        <div className="flex flex-col items-center text-center gap-2 mt-2">
            <div className="relative w-28 h-28 cursor-pointer">
                <Avatar className="w-28 h-28 text-6xl border-4 border-background">
                    <AvatarImage src={profile.profileImage} alt={profile.fullName} />
                    <AvatarFallback>
                        {profile.fullName?.split(' ').map(n => n[0]).join('') || <User />}
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
          <Badge variant="secondary" className="mt-2">
             {userRole === 'Premium Member' || userRole === 'Owner' ? <Crown className="w-4 h-4 mr-2 text-yellow-400"/> : <Star className="w-4 h-4 mr-2" />}
             {roleText[userRole]}
          </Badge>
        </div>
      </div>

      <nav className="mt-6 px-4 flex-grow">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
             const content = (
                <motion.div 
                    className="flex items-center p-3 rounded-lg hover:bg-card transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                  <div className="p-2 bg-primary/10 rounded-full">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="ml-4 font-medium">{item.text}</span>
                  <ChevronRight className="ml-auto w-5 h-5 text-muted-foreground" />
                </motion.div>
              );

            return (
              <li key={index} onClick={item.onClick} className="cursor-pointer">
                {item.href ? <Link href={item.href}>{content}</Link> : <div>{content}</div>}
              </li>
            )
          })}
        </ul>
      </nav>
    </motion.div>
  );
}
