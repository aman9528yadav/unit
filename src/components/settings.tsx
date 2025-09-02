
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";

const settingsItems = [
  { text: "About UniConvert", href: "#" },
  { text: "Sync with Samsung Cloud", href: "#" },
  { text: "Import notes", href: "#" },
  { text: "Export notes", href: "#" },
  { text: "Sort", href: "#" },
  { text: "Style of new notes", href: "#" },
  { text: "Customize toolbar", href: "#" },
];


export function Settings() {
  return (
    <div className="w-full max-w-md mx-auto text-white flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>
       <nav className="flex-grow">
        <ul className="space-y-2">
          {settingsItems.map((item, index) => (
            <li key={index}>
              <Link href={item.href}>
                <div className="flex items-center p-3 rounded-lg hover:bg-card transition-colors">
                  <span className="font-medium">{item.text}</span>
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

