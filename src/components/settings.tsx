

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, User, Bell, Languages, Palette, LayoutGrid, SlidersHorizontal, CalculatorIcon, Info, LogOut, Trash2, KeyRound, Globe, Code, Lock, Music } from "lucide-react";
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
import { getStats } from "@/lib/stats";


export type CalculatorMode = 'basic' | 'scientific';
const PREMIUM_MEMBER_THRESHOLD = 8000;
type UserRole = 'Member' | 'Premium Member' | 'Owner';

const getUserKey = (key: string, email: string | null) => `${email || 'guest'}_${key}`;

const regions: Region[] = ['International', 'India', 'Japan', 'Korea', 'China', 'Middle East'];

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

const SettingRow = ({ label, description, control, isLink = false, href, children, isLocked = false, onLockClick }: { label: string, description?: string, control?: React.ReactNode, isLink?: boolean, href?: string, children?: React.ReactNode, isLocked?: boolean, onLockClick?: () => void }) => {
    const content = (
        <div className="flex justify-between items-center py-3">
            <div className="flex-1 pr-4">
                <div className="flex items-center gap-2">
                    {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                    <p className="font-medium">{label}</p>
                </div>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
                {control}
                {isLink && href && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
        </div>
    );
    
    const handleWrapperClick = () => {
        if (isLocked && onLockClick) {
            onLockClick();
        } else if (isLink && href) {
            // Handled by Link component
        }
    };

    if (isLink && href && !isLocked) {
        return <Link href={href}>{content}</Link>;
    }

    return (
        <div onClick={handleWrapperClick} className={isLocked ? 'cursor-pointer' : ''}>
            {content}
            {children && <div className="pt-3">{children}</div>}
        </div>
    );
};


export function Settings() {
  const [profile, setProfile] = useState<{email: string} | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('Member');
  const [showPremiumLockDialog, setShowPremiumLockDialog] = useState(false);
  const { toast } = useToast();
  const router = useRouter();


  // Settings states
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, customTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const [saveConversionHistory, setSaveConversionHistory] = useState(true);
  const [defaultRegion, setDefaultRegion] = useState<Region>('International');

  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('basic');
  const [calculatorSound, setCalculatorSound] = useState(true);
  
  // Local state for theme selector
  const [selectedTheme, setSelectedTheme] = useState(theme);

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem('userProfile');
    const email = storedProfile ? JSON.parse(storedProfile).email : null;
    setProfile(storedProfile ? JSON.parse(storedProfile) : null);
    loadSettings(email);
    updateUserRole(email);
  }, []);
  
  const updateUserRole = async (email: string | null) => {
    if(email === "amanyadavyadav9458@gmail.com") {
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
    setSelectedTheme(theme);
  }, [theme]);

  const loadSettings = (email: string | null) => {
    const notifications = localStorage.getItem(getUserKey('notificationsEnabled', email));
    setNotificationsEnabled(notifications === null ? true : JSON.parse(notifications));

    const saveConv = localStorage.getItem(getUserKey('saveConversionHistory', email));
    setSaveConversionHistory(saveConv === null ? true : JSON.parse(saveConv));
    
    const region = localStorage.getItem(getUserKey('defaultRegion', email));
    if (region && regions.includes(region as Region)) {
      setDefaultRegion(region as Region);
    }

    const calcMode = localStorage.getItem('calculatorMode') as CalculatorMode;
    if (calcMode) setCalculatorMode(calcMode);

    const calcSound = localStorage.getItem('calculatorSoundEnabled');
    setCalculatorSound(calcSound === null ? true : JSON.parse(calcSound));
  };
  
  const handleSaveChanges = () => {
    const userKey = profile?.email || null;
    
    // Only save settings if they are not locked
    const isPremiumFeatureLocked = userRole === 'Member';
    const isThemeLocked = isPremiumFeatureLocked && (selectedTheme === 'retro' || selectedTheme === 'glass' || selectedTheme === 'nord' || selectedTheme === 'rose-pine');
    const isCalcModeLocked = isPremiumFeatureLocked && calculatorMode === 'scientific';

    if(isThemeLocked || isCalcModeLocked) {
        setShowPremiumLockDialog(true);
        // Revert to old settings
        const oldTheme = localStorage.getItem('theme') || 'light';
        const oldCalcMode = (localStorage.getItem('calculatorMode') as CalculatorMode) || 'basic';
        setSelectedTheme(oldTheme as any);
        setCalculatorMode(oldCalcMode);
        return;
    }

    localStorage.setItem(getUserKey('notificationsEnabled', userKey), JSON.stringify(notificationsEnabled));
    localStorage.setItem(getUserKey('saveConversionHistory', userKey), JSON.stringify(saveConversionHistory));
    localStorage.setItem(getUserKey('defaultRegion', userKey), defaultRegion);
    localStorage.setItem('calculatorMode', calculatorMode);
    localStorage.setItem('calculatorSoundEnabled', JSON.stringify(calculatorSound));
    setTheme(selectedTheme);
    
    // Dispatch storage events to notify other components/tabs
    window.dispatchEvent(new StorageEvent('storage', { key: getUserKey('notificationsEnabled', userKey), newValue: JSON.stringify(notificationsEnabled) }));
    window.dispatchEvent(new StorageEvent('storage', { key: getUserKey('saveConversionHistory', userKey), newValue: JSON.stringify(saveConversionHistory) }));
    window.dispatchEvent(new StorageEvent('storage', { key: getUserKey('defaultRegion', userKey), newValue: defaultRegion }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'calculatorMode', newValue: calculatorMode }));
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
                                    <SelectItem value="retro" disabled={isPremiumFeatureLocked}>Retro</SelectItem>
                                    <SelectItem value="glass" disabled={isPremiumFeatureLocked}>Glass</SelectItem>
                                    <SelectItem value="nord" disabled={isPremiumFeatureLocked}>Nord</SelectItem>
                                    <SelectItem value="rose-pine" disabled={isPremiumFeatureLocked}>Rosé Pine</SelectItem>
                                    {customTheme && (
                                        <SelectItem value="custom" disabled={isPremiumFeatureLocked}>
                                            {t('settings.appearance.themes.custom')}
                                        </SelectItem>
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
                        isLocked={isPremiumFeatureLocked}
                        onLockClick={() => setShowPremiumLockDialog(true)}
                        control={
                             <div className="flex items-center gap-2">
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
                {profile?.email === "amanyadavyadav9458@gmail.com" && (
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
                    isLink
                    href="/settings/custom-units"
                    label={t('settings.unitConverter.customUnit.label')}
                    description={t('settings.unitConverter.customUnit.description')}
                    isLocked={isPremiumFeatureLocked}
                    onLockClick={() => setShowPremiumLockDialog(true)}
                    control={
                        <div className="flex items-center gap-2">
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
                        isLocked={isPremiumFeatureLocked}
                        onLockClick={() => setShowPremiumLockDialog(true)}
                        control={
                            <Select value={calculatorMode} onValueChange={(v) => setCalculatorMode(v as CalculatorMode)} disabled={isPremiumFeatureLocked}>
                                <SelectTrigger className="w-32">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="basic">{t('settings.calculator.modes.basic')}</SelectItem>
                                    <SelectItem value="scientific">{t('settings.calculator.modes.scientific')}</SelectItem>
                                </SelectContent>
                            </Select>
                        }
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
         <AlertDialog open={showPremiumLockDialog} onOpenChange={setShowPremiumLockDialog}>
            <AlertDialogContent>
                <AlertDialogHeader className="items-center text-center">
                     <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <AlertDialogTitle className="text-2xl">Premium Feature Locked</AlertDialogTitle>
                    <AlertDialogDescription>
                        This feature is available to Premium Members. Complete {PREMIUM_MEMBER_THRESHOLD.toLocaleString()} operations to unlock this feature and more!
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center flex-col-reverse sm:flex-row gap-2">
                     <AlertDialogCancel onClick={() => setShowPremiumLockDialog(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push('/profile')}>
                        Check Your Progress
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
