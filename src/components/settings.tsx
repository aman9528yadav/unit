
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, User, Bell, Languages, Palette, LayoutGrid, SlidersHorizontal, History, CalculatorIcon } from "lucide-react";

export function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [autoConvert, setAutoConvert] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);

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

      <div className="flex flex-col gap-8">
        {/* General Settings */}
        <div>
          <h2 className="text-lg font-bold mb-3">General setting</h2>
          <div className="bg-card rounded-xl">
            <SettingsItem icon={User} text="Edit profile information" href="/profile/edit" />
            <SettingsItem 
              icon={Bell} 
              text="Notifications" 
              control={<Switch checked={notifications} onCheckedChange={setNotifications} />} 
            />
            <SettingsItem 
              icon={Languages} 
              text="Language" 
              value="English" 
              href="#" 
            />
             <SettingsItem 
              icon={Palette} 
              text="Theme" 
              value="Light mode" 
              href="#"
              isLast={true}
            />
          </div>
        </div>

        {/* Unit Converter Settings */}
        <div>
          <h2 className="text-lg font-bold mb-3">Unit convertor</h2>
           <div className="bg-card rounded-xl">
            <SettingsItem icon={LayoutGrid} text="Change icon" href="#" />
             <SettingsItem 
              icon={SlidersHorizontal} 
              text="Auto convertor" 
              control={<Switch checked={autoConvert} onCheckedChange={setAutoConvert} />} 
            />
            <SettingsItem 
              icon={Languages} 
              text="Custom unit"
              value="Off" 
              href="#"
              isLast={true}
            />
          </div>
        </div>

        {/* Calculator Settings */}
        <div>
          <h2 className="text-lg font-bold mb-3">Calculator</h2>
           <div className="bg-card rounded-xl">
            <SettingsItem icon={CalculatorIcon} text="Mode" value="Basic" href="#" />
             <SettingsItem 
              icon={History} 
              text="Save history" 
              control={<Switch checked={saveHistory} onCheckedChange={setSaveHistory} />} 
              isLast={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingsItemProps {
  icon: React.ElementType;
  text: string;
  href?: string;
  control?: React.ReactNode;
  value?: string;
  isLast?: boolean;
}

function SettingsItem({ icon: Icon, text, href, control, value, isLast = false }: SettingsItemProps) {
  const content = (
    <div className={`flex items-center p-4 ${!isLast ? 'border-b border-border' : ''}`}>
      <div className="p-2 bg-indigo-500/20 rounded-full">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <span className="ml-4 font-medium flex-1">{text}</span>
      {control}
      {value && <span className="text-muted-foreground">{value}</span>}
      {href && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:bg-white/5 transition-colors rounded-xl">
        {content}
      </Link>
    );
  }

  return content;
}
