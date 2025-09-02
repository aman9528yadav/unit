
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, User, Bell, Languages, Palette, LayoutGrid, SlidersHorizontal, History, CalculatorIcon } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [autoConvert, setAutoConvert] = useState(true);
  const [saveHistory, setSaveHistory] = useState(true);
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="w-full max-w-md mx-auto text-white flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{t('settings.title')}</h1>
      </header>

      <div className="flex flex-col gap-8">
        {/* General Settings */}
        <div>
          <h2 className="text-lg font-bold mb-3">{t('settings.general.title')}</h2>
          <div className="bg-card rounded-xl">
            <SettingsItem icon={User} text={t('settings.general.editProfile')} href="/profile/edit" />
            <SettingsItem 
              icon={Bell} 
              text={t('settings.general.notifications')}
              control={<Switch checked={notifications} onCheckedChange={setNotifications} />} 
            />
            <SettingsItem 
              icon={Languages} 
              text={t('settings.general.language')}
              control={
                <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'hi')}>
                  <SelectTrigger className="w-[120px] bg-secondary border-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिन्दी</SelectItem>
                  </SelectContent>
                </Select>
              }
            />
             <SettingsItem 
              icon={Palette} 
              text={t('settings.general.theme')}
              value={t('settings.general.lightMode')}
              href="#"
              isLast={true}
            />
          </div>
        </div>

        {/* Unit Converter Settings */}
        <div>
          <h2 className="text-lg font-bold mb-3">{t('settings.unitConverter.title')}</h2>
           <div className="bg-card rounded-xl">
            <SettingsItem icon={LayoutGrid} text={t('settings.unitConverter.changeIcon')} href="#" />
             <SettingsItem 
              icon={SlidersHorizontal} 
              text={t('settings.unitConverter.autoConvert')}
              control={<Switch checked={autoConvert} onCheckedChange={setAutoConvert} />} 
            />
            <SettingsItem 
              icon={Languages} 
              text={t('settings.unitConverter.customUnit')}
              value={t('settings.unitConverter.off')}
              href="#"
              isLast={true}
            />
          </div>
        </div>

        {/* Calculator Settings */}
        <div>
          <h2 className="text-lg font-bold mb-3">{t('settings.calculator.title')}</h2>
           <div className="bg-card rounded-xl">
            <SettingsItem icon={CalculatorIcon} text={t('settings.calculator.mode')} value={t('settings.calculator.basic')} href="#" />
             <SettingsItem 
              icon={History} 
              text={t('settings.calculator.saveHistory')}
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
      {value && <span className="text-muted-foreground mr-2">{value}</span>}
      {href && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:bg-white/5 transition-colors first:rounded-t-xl last:rounded-b-xl block">
        {content}
      </Link>
    );
  }

  return <div className="first:rounded-t-xl last:rounded-b-xl">{content}</div>;
}
