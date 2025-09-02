
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, User, Bell, Languages, Palette, LayoutGrid, SlidersHorizontal, History, CalculatorIcon } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useTheme } from "@/context/theme-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalculatorMode = 'basic' | 'scientific';

export function Settings() {
  const [notifications, setNotifications] = useState(true);
  const [autoConvert, setAutoConvert] = useState(true);
  const [saveConversionHistory, setSaveConversionHistory] = useState(true);
  const [saveCalcHistory, setSaveCalcHistory] = useState(true);
  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('scientific');
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const savedAutoConvert = localStorage.getItem('autoConvert');
    if (savedAutoConvert !== null) {
      setAutoConvert(JSON.parse(savedAutoConvert));
    }

    const savedConversionHistory = localStorage.getItem('saveConversionHistory');
    if (savedConversionHistory !== null) {
      setSaveConversionHistory(JSON.parse(savedConversionHistory));
    }

    const savedCalcHistory = localStorage.getItem('saveCalcHistory');
    if (savedCalcHistory !== null) {
      setSaveCalcHistory(JSON.parse(savedCalcHistory));
    }
    
    const savedCalcMode = localStorage.getItem('calculatorMode') as CalculatorMode;
    if (savedCalcMode) {
        setCalculatorMode(savedCalcMode);
    }
  }, []);

  const handleAutoConvertChange = (checked: boolean) => {
    setAutoConvert(checked);
    localStorage.setItem('autoConvert', JSON.stringify(checked));
  };

  const handleSaveConversionHistoryChange = (checked: boolean) => {
    setSaveConversionHistory(checked);
    localStorage.setItem('saveConversionHistory', JSON.stringify(checked));
  };

  const handleSaveCalcHistoryChange = (checked: boolean) => {
    setSaveCalcHistory(checked);
    localStorage.setItem('saveCalcHistory', JSON.stringify(checked));
  };
  
  const handleCalcModeChange = (mode: CalculatorMode) => {
    setCalculatorMode(mode);
    localStorage.setItem('calculatorMode', mode);
  }

  const handleThemeChange = (value: string) => {
    if (value === 'light' || value === 'dark' || value === 'custom') {
      setTheme(value);
    }
  }


  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6">
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
              control={
                 <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger className="w-[120px] bg-secondary border-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              }
              isLast={false}
            />
             <SettingsItem 
              icon={Palette} 
              text="Edit Custom Theme"
              href="/settings/theme"
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
              control={<Switch checked={autoConvert} onCheckedChange={handleAutoConvertChange} />} 
            />
             <SettingsItem 
              icon={History} 
              text={t('settings.unitConverter.saveHistory')}
              control={<Switch checked={saveConversionHistory} onCheckedChange={handleSaveConversionHistoryChange} />} 
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
            <SettingsItem 
                icon={CalculatorIcon} 
                text={t('settings.calculator.mode')} 
                control={
                    <Select value={calculatorMode} onValueChange={(value) => handleCalcModeChange(value as CalculatorMode)}>
                        <SelectTrigger className="w-[120px] bg-secondary border-none">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="scientific">Scientific</SelectItem>
                        </SelectContent>
                    </Select>
                }
            />
             <SettingsItem 
              icon={History} 
              text={t('settings.calculator.saveHistory')}
              control={<Switch checked={saveCalcHistory} onCheckedChange={handleSaveCalcHistoryChange} />} 
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
      <div className="p-2 bg-primary/10 rounded-full">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <span className="ml-4 font-medium flex-1">{text}</span>
      {control}
      {value && <span className="text-muted-foreground mr-2">{value}</span>}
      {href && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:bg-primary/5 transition-colors first:rounded-t-xl last:rounded-b-xl block">
        {content}
      </Link>
    );
  }

  return <div className="first:rounded-t-xl last:rounded-b-xl">{content}</div>;
}
