
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, User, Bell, Languages, Palette, LayoutGrid, SlidersHorizontal, History, CalculatorIcon, Info, LogOut, Trash2, KeyRound, Globe, Code, Lock, Music } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useTheme } from "@/context/theme-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Region } from "@/lib/conversions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { getAllTimeCalculations } from "@/lib/utils";


export type CalculatorMode = 'basic' | 'scientific';
type UserRole = 'Member' | 'Premium Member' | 'Owner';

const getUserKey = (key: string, email: string | null) => `${email || 'guest'}_${key}`;

const regions: Region[] = ['International', 'India', 'Japan', 'Korea', 'China', 'Middle East'];
const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";
const PREMIUM_MEMBER_THRESHOLD = 8000;

const Section = ({ title, children, description }: { title: string, children: React.ReactNode, description?: string }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="divide-y divide-border">
            {children}
        </CardContent>
    </Card>
);

const SettingRow = ({ label, description, control, isLink = false, href, children }: { label: string, description?: string, control?: React.ReactNode, isLink?: boolean, href?: string, children?: React.ReactNode }) => {
    const content = (
        <div className="flex justify-between items-center py-3">
            <div className="flex-1 pr-4">
                <p className="font-medium">{label}</p>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
                {control}
                {isLink && href && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
        </div>
    );
    
    return (
        <div>
            {isLink && href ? <Link href={href}>{content}</Link> : content}
            {children && <div className="pt-3">{children}</div>}
        </div>
    );
};


export function Settings() {
  const [profile, setProfile] = useState<{ email: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const [userRole, setUserRole] = useState<UserRole>('Member');


  // Settings states
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, customTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const [autoConvert, setAutoConvert] = useState(true);
  const [saveConversionHistory, setSaveConversionHistory] = useState(true);
  const [defaultRegion, setDefaultRegion] = useState<Region>('International');

  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('scientific');
  const [saveCalcHistory, setSaveCalcHistory] = useState(true);
  const [calculatorSound, setCalculatorSound] = useState(true);
  
  // Local state for theme selector
  const [selectedTheme, setSelectedTheme] = useState(theme);

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      setProfile(parsedProfile);
      loadSettings(parsedProfile.email);

      const calculations = getAllTimeCalculations(parsedProfile.email);
      if (parsedProfile.email === DEVELOPER_EMAIL) {
          setUserRole('Owner');
      } else if (calculations >= PREMIUM_MEMBER_THRESHOLD) {
          setUserRole('Premium Member');
      } else {
          setUserRole('Member');
      }

    } else {
      loadSettings(null);
    }
  }, []);
  
  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const loadSettings = (email: string | null) => {
    const notifications = localStorage.getItem(getUserKey('notificationsEnabled', email));
    setNotificationsEnabled(notifications === null ? true : JSON.parse(notifications));

    const auto = localStorage.getItem(getUserKey('autoConvert', email));
    setAutoConvert(auto === null ? true : JSON.parse(auto));

    const saveConv = localStorage.getItem(getUserKey('saveConversionHistory', email));
    setSaveConversionHistory(saveConv === null ? true : JSON.parse(saveConv));
    
    const region = localStorage.getItem(getUserKey('defaultRegion', email));
    if (region && regions.includes(region as Region)) {
      setDefaultRegion(region as Region);
    }

    const calcMode = localStorage.getItem('calculatorMode') as CalculatorMode;
    if (calcMode) setCalculatorMode(calcMode);

    const saveCalc = localStorage.getItem('saveCalcHistory');
    setSaveCalcHistory(saveCalc === null ? true : JSON.parse(saveCalc));

    const calcSound = localStorage.getItem('calculatorSoundEnabled');
    setCalculatorSound(calcSound === null ? true : JSON.parse(calcSound));
  };
  
  const handleSaveChanges = () => {
    const userKey = profile?.email || null;
    localStorage.setItem(getUserKey('notificationsEnabled', userKey), JSON.stringify(notificationsEnabled));
    localStorage.setItem(getUserKey('autoConvert', userKey), JSON.stringify(autoConvert));
    localStorage.setItem(getUserKey('saveConversionHistory', userKey), JSON.stringify(saveConversionHistory));
    localStorage.setItem(getUserKey('defaultRegion', userKey), defaultRegion);
    localStorage.setItem('calculatorMode', calculatorMode);
    localStorage.setItem('saveCalcHistory', JSON.stringify(saveCalcHistory));
    localStorage.setItem('calculatorSoundEnabled', JSON.stringify(calculatorSound));

    
    if (userRole === 'Member' && selectedTheme === 'custom') {
        toast({ title: t('settings.appearance.premiumTooltip'), variant: "destructive" });
        setTheme('light'); // Revert to default
    } else {
        setTheme(selectedTheme);
    }
    
    // Dispatch storage events to notify other components/tabs
    window.dispatchEvent(new StorageEvent('storage', { key: getUserKey('notificationsEnabled', userKey), newValue: JSON.stringify(notificationsEnabled) }));
    window.dispatchEvent(new StorageEvent('storage', { key: getUserKey('autoConvert', userKey), newValue: JSON.stringify(autoConvert) }));
    window.dispatchEvent(new StorageEvent('storage', { key: getUserKey('saveConversionHistory', userKey), newValue: JSON.stringify(saveConversionHistory) }));
    window.dispatchEvent(new StorageEvent('storage', { key: getUserKey('defaultRegion', userKey), newValue: defaultRegion }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'calculatorMode', newValue: calculatorMode }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'saveCalcHistory', newValue: JSON.stringify(saveCalcHistory) }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'calculatorSoundEnabled', newValue: JSON.stringify(calculatorSound) }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'theme', newValue: selectedTheme }));


    toast({ title: t('settings.data.toast.saved.title'), description: t('settings.data.toast.saved.description')});
  };

  const handleClearData = () => {
    localStorage.clear();
    toast({ title: t('settings.data.toast.cleared.title'), description: t('settings.data.toast.cleared.description') });
    setTimeout(() => {
      router.push('/welcome');
    }, 1500);
  };


  if (!isClient) return null;

  const isPremiumFeatureLocked = userRole === 'Member';

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 p-4 sm:p-6">
        <header className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft />
            </Button>
          <h1 className="text-xl font-bold">{t('settings.title')}</h1>
        </header>

        <div className="flex flex-col gap-6">
             <Section title={t('settings.account.title')}>
                <SettingRow
                    isLink
                    href="/profile/edit"
                    label={t('settings.account.editProfile.label')}
                    description={t('settings.account.editProfile.description')}
                    control={<User />}
                />
            </Section>
            <TooltipProvider>
                <Section title={t('settings.appearance.title')}>
                     <SettingRow
                        label={t('settings.appearance.themeMode.label')}
                        description={t('settings.appearance.themeMode.description')}
                        control={
                            <Select value={selectedTheme} onValueChange={(v) => setSelectedTheme(v as any)}>
                                <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="light">{t('settings.appearance.themes.light')}</SelectItem>
                                    <SelectItem value="dark">{t('settings.appearance.themes.dark')}</SelectItem>
                                    {customTheme && (
                                        <Tooltip delayDuration={100}>
                                            <TooltipTrigger asChild>
                                                <div>
                                                    <SelectItem value="custom" disabled={isPremiumFeatureLocked}>
                                                        {isPremiumFeatureLocked && <Lock className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2"/>}
                                                        {t('settings.appearance.themes.custom')}
                                                    </SelectItem>
                                                </div>
                                            </TooltipTrigger>
                                            {isPremiumFeatureLocked && <TooltipContent><p>{t('settings.appearance.premiumTooltip')}</p></TooltipContent>}
                                        </Tooltip>
                                    )}
                                </SelectContent>
                            </Select>
                        }
                    />
                     <SettingRow
                        isLink
                        href="/settings/theme"
                        label={t('settings.appearance.customizeTheme.label')}
                        description={t('settings.appearance.customizeTheme.description')}
                        control={
                             <div className="flex items-center gap-2">
                                {isPremiumFeatureLocked && <Lock className="w-4 h-4 text-amber-500" />}
                                <Palette />
                            </div>
                        }
                    />
                </Section>
            </TooltipProvider>

            <Section title={t('settings.general.title')}>
                 <SettingRow
                    label={t('settings.general.notifications.label')}
                    description={notificationsEnabled ? t('settings.general.notifications.description_on') : t('settings.general.notifications.description_off')}
                    control={<Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />}
                />
                 <SettingRow
                    label={t('settings.general.language.label')}
                    description={t('settings.general.language.description')}
                    control={
                         <Select value={language} onValueChange={(value) => setLanguage(value as 'en' | 'hi')}>
                            <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="hi">हिन्दी</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                />
                {profile?.email === DEVELOPER_EMAIL && (
                  <SettingRow
                      isLink
                      href="/dev"
                      label={t('settings.general.developer.label')}
                      description={t('settings.general.developer.description')}
                      control={<Code />}
                  />
                )}
            </Section>

             <Section title={t('settings.unitConverter.title')} description={t('settings.unitConverter.description')}>
                 <SettingRow
                    label={t('settings.unitConverter.defaultRegion')}
                    control={
                        <Select value={defaultRegion} onValueChange={(v) => setDefaultRegion(v as Region)}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select a region" />
                            </SelectTrigger>
                            <SelectContent>
                                {regions.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    }
                 />
                 <SettingRow
                    label={t('settings.unitConverter.autoConvert.label')}
                    description={t('settings.unitConverter.autoConvert.description')}
                    control={<Switch checked={autoConvert} onCheckedChange={setAutoConvert} />}
                />
                 <SettingRow
                    isLink
                    href="/settings/custom-units"
                    label={t('settings.unitConverter.customUnit.label')}
                    description={t('settings.unitConverter.customUnit.description')}
                    control={
                        <div className="flex items-center gap-2">
                            {isPremiumFeatureLocked && <Lock className="w-4 h-4 text-amber-500" />}
                            <LayoutGrid />
                        </div>
                    }
                />
                 <SettingRow
                    label={t('settings.unitConverter.saveHistory.label')}
                    description={t('settings.unitConverter.saveHistory.description')}
                    control={<Switch checked={saveConversionHistory} onCheckedChange={setSaveConversionHistory} />}
                />
            </Section>
            <TooltipProvider>
                <Section title={t('settings.calculator.title')}>
                     <SettingRow
                        label={t('settings.calculator.mode.label')}
                        description={t('settings.calculator.mode.description')}
                        control={
                            <Select value={calculatorMode} onValueChange={(v) => setCalculatorMode(v as CalculatorMode)} disabled={isPremiumFeatureLocked}>
                                <SelectTrigger className="w-32">
                                    {isPremiumFeatureLocked && <Lock className="w-4 h-4 text-amber-500 mr-2"/>}
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="basic">{t('settings.calculator.modes.basic')}</SelectItem>
                                     <Tooltip delayDuration={100}>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <SelectItem value="scientific" disabled={isPremiumFeatureLocked}>
                                                    {isPremiumFeatureLocked && <Lock className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2"/>}
                                                    {t('settings.calculator.modes.scientific')}
                                                </SelectItem>
                                            </div>
                                        </TooltipTrigger>
                                        {isPremiumFeatureLocked && <TooltipContent><p>{t('settings.calculator.premiumTooltip')}</p></TooltipContent>}
                                    </Tooltip>
                                </SelectContent>
                            </Select>
                        }
                    />
                      <SettingRow
                        label={t('settings.calculator.saveHistory.label')}
                        description={t('settings.calculator.saveHistory.description')}
                        control={<Switch checked={saveCalcHistory} onCheckedChange={setSaveCalcHistory} />}
                    />
                     <SettingRow
                        label={t('settings.calculator.keypressSound.label')}
                        description={t('settings.calculator.keypressSound.description')}
                        control={<Switch checked={calculatorSound} onCheckedChange={setCalculatorSound} />}
                    />
                </Section>
            </TooltipProvider>
        </div>
        
        <footer className="flex justify-between items-center gap-4 mt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/>{t('settings.data.clearData')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('settings.data.dialog.title')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('settings.data.dialog.description')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('settings.data.dialog.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90">
                    {t('settings.data.dialog.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
                <Button onClick={handleSaveChanges}>{t('settings.data.saveChanges')}</Button>
            </div>
        </footer>
    </div>
  );
}

    