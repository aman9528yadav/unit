
"use client";

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
} from "lucide-react";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: User, text: "Profile", href: "#" },
  { icon: Star, text: "Favorite", href: "/history" },
  { icon: Lock, text: "Privacy Policy", href: "#" },
  { icon: Settings, text: "Settings", href: "#" },
  { icon: HelpCircle, text: "Help", href: "#" },
  { icon: LogOut, text: "Logout", href: "#" },
];

export function Profile() {
  return (
    <div className="w-full max-w-md mx-auto text-white flex flex-col">
      <div className="bg-indigo-400/90 pb-8 rounded-b-3xl">
        <header className="p-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">My Profile</h1>
        </header>

        <div className="flex flex-col items-center text-center gap-2 mt-2">
          <div className="relative w-28 h-28">
            <Image
              src="https://picsum.photos/200"
              alt="Aman Yadav"
              width={112}
              height={112}
              className="rounded-full border-4 border-white"
              data-ai-hint="profile picture"
            />
          </div>
          <h2 className="text-2xl font-bold mt-2">Aman Yadav</h2>
          <p className="text-sm">aman@example.com</p>
          <p className="text-sm">Birthday: April 1st</p>
        </div>
      </div>

      <div className="bg-card text-card-foreground p-4 rounded-xl -mt-6 mx-4 shadow-lg flex justify-around text-center">
        <div>
          <p className="text-lg font-bold">12 Days</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
        <div className="border-l border-border"></div>
        <div>
          <p className="text-lg font-bold">06 Days</p>
          <p className="text-xs text-muted-foreground">Current Streak</p>
        </div>
        <div className="border-l border-border"></div>
        <div>
          <p className="text-lg font-bold">04 Days</p>
          <p className="text-xs text-muted-foreground">Not Open</p>
        </div>
      </div>

      <nav className="mt-6 px-4 flex-grow">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link href={item.href}>
                <div className="flex items-center p-3 rounded-lg hover:bg-card transition-colors">
                  <div className="p-2 bg-indigo-500/20 rounded-full">
                    <item.icon className="w-5 h-5 text-indigo-400" />
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
