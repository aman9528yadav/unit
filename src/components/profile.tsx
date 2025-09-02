
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Star,
  Lock,
  Settings,
  HelpCircle,
  LogOut,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { getStreakData, StreakData } from "@/lib/streak";

const menuItems = [
  { icon: User, text: "Profile", href: "/profile/edit" },
  { icon: Star, text: "Favorite", href: "/history" },
  { icon: Lock, text: "Privacy Policy", href: "/privacy-policy" },
  { icon: Settings, text: "Settings", href: "/settings" },
  { icon: HelpCircle, text: "Help", href: "/help" },
  { icon: LogOut, text: "Logout", href: "#" },
];

const defaultProfile = {
    fullName: "Aman Yadav",
    email: "aman@example.com",
    birthday: "April 1st",
    profileImage: "https://picsum.photos/200",
    dob: "1990-04-01"
};

export function Profile() {
  const [profile, setProfile] = useState(defaultProfile);
  const [streakData, setStreakData] = useState<StreakData>({ bestStreak: 0, currentStreak: 0, daysNotOpened: 0 });
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
       if (parsed.dob && !isNaN(new Date(parsed.dob).getTime())) {
        parsed.birthday = format(new Date(parsed.dob), "MMMM do");
      }
      setProfile(parsed);
    }
    setStreakData(getStreakData());
  }, []);

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
            <Image
              src={profile.profileImage || defaultProfile.profileImage}
              alt={profile.fullName}
              width={112}
              height={112}
              className="rounded-full border-4 border-white object-cover w-28 h-28"
              data-ai-hint="profile picture"
            />
            <Link href="/profile/edit">
              <Button
                variant="outline"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-accent border-accent hover:bg-accent/90"
              >
                <Pencil className="w-4 h-4 text-accent-foreground" />
              </Button>
            </Link>
          </div>
          <h2 className="text-2xl font-bold mt-2">{profile.fullName}</h2>
          <p className="text-sm">{profile.email}</p>
          <p className="text-sm">Birthday: {profile.birthday}</p>
        </div>
      </div>

      <div className="bg-card text-card-foreground p-4 rounded-xl -mt-6 mx-4 shadow-lg flex justify-around text-center">
        <div>
          <p className="text-lg font-bold">{streakData.bestStreak} Days</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
        <div className="border-l border-border"></div>
        <div>
          <p className="text-lg font-bold">{streakData.currentStreak} Days</p>
          <p className="text-xs text-muted-foreground">Current Streak</p>
        </div>
        <div className="border-l border-border"></div>
        <div>
          <p className="text-lg font-bold">{streakData.daysNotOpened} Days</p>
          <p className="text-xs text-muted-foreground">Not Open</p>
        </div>
      </div>

      <nav className="mt-6 px-4 flex-grow">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link href={item.href}>
                <div className="flex items-center p-3 rounded-lg hover:bg-card transition-colors">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="ml-4 font-medium">{item.text}</span>
                  <ChevronRight className="ml-auto w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
