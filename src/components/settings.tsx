

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, User, Bell, Languages, Palette, LayoutGrid, SlidersHorizontal, CalculatorIcon, Info, LogOut, Trash2, KeyRound, Globe, Code, Lock, Music, Sigma, Home, Rocket } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { useTheme, type CustomTheme } from "@/context/theme-context";
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
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { listenToUserData, updateUserData } from "@/services/firestore";
import { getStreakData } from "@/lib/streak";


export type CalculatorMode = 'basic' | 'scientific';
type DefaultPage = 'dashboard' | 'calculator' | 'notes' | 'converter' | 'time';
type CalculatorTheme = 'original' | 'physical';
const PREMIUM_MEMBER_THRESHOLD = 10000;
type UserRole = 'Member' | 'Premium Member' | 'Owner';


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

const SettingRow = ({ label, description, control, isLink = false, href, children, isLocked = false, onLockClick }: { label:string, description?:string, control?:React.ReactNode, isLink?:boolean, href?:string, children?:React.ReactNode, isLocked?:boolean, onLockClick?:()=>void }) => {
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

const ThemePreview = ({ theme }: { theme: string }) => {
    return (
        <div className={cn("w-full h-full bg-background text-foreground font-sans", theme)}>
            <div className="p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-primary/10 rounded-lg text-primary"><Sigma size={16} /></div>
                        <h1 className="text-md font-bold">Converter</h1>
                    </div>
                    <Avatar className="h-6 w-6">
                        <AvatarFallback><User size={12}/></AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-full rounded-md border border-input bg-background flex items-center px-2 text-sm">10</div>
                    </div>
                    <div className="text-center text-xl font-bold text-primary">6.2137</div>
                    <Button size="sm">Convert</Button>
                    <Button size="sm" variant="secondary">History</Button>
                </div>
            </div>
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
  const [defaultPage, setDefaultPage] = useState<DefaultPage>('dashboard');
  const [showGettingStarted, setShowGettingStarted] = useState(true);

  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('basic');
  const [calculatorTheme, setCalculatorTheme] = useState<CalculatorTheme>('original');
  const [calculatorSound, setCalculatorSound] = useState(true);
  
  // Local state for theme selector
  const [selectedTheme, setSelectedTheme] = useState(theme);

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem('userProfile');
    const email = storedProfile ? JSON.parse(storedProfile).email : null;
    setProfile(storedProfile ? JSON.parse(storedProfile) : null);
    
    if (email) {
        updateUserRole(email);
        const unsub = listenToUserData(email, (data) => {
            if (!data) return;
            const userSettings = data.settings || {};
            setNotificationsEnabled(userSettings.notificationsEnabled ?? true);
            setSaveConversionHistory(userSettings.saveConversionHistory ?? true);
            if (userSettings.defaultRegion && regions.includes(userSettings.defaultRegion)) {
                setDefaultRegion(userSettings.defaultRegion);
            }
            if (userSettings.defaultPage) setDefaultPage(userSettings.defaultPage);
            if (userSettings.calculatorMode) setCalculatorMode(userSettings.calculatorMode);
            if (userSettings.calculatorTheme) setCalculatorTheme(userSettings.calculatorTheme);
            setShowGettingStarted(userSettings.showGettingStarted ?? true);
            setCalculatorSound(userSettings.calculatorSound ?? true);
        });
        return () => unsub();
    }
  }, []);
  
  const updateUserRole = async (email: string | null) => {
    if(email === "amanyadavyadav9458@gmail.com") {
        setUserRole('Owner');
        return;
    }
    const stats = await getStats(email);
    const streakData = await getStreakData(email);
    if(stats.totalOps >= PREMIUM_MEMBER_THRESHOLD || streakData.bestStreak >= 15) {
        setUserRole('Premium Member');
    } else {
        setUserRole('Member');
    }
  };

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);
  
  const handleSaveChanges = () => {
    if (!profile) {
        toast({ title: "Error", description: "You must be logged in to save settings.", variant: "destructive" });
        return;
    }
    
    const isPremiumFeatureLocked = userRole === 'Member';
    const isThemeLocked = isPremiumFeatureLocked && (selectedTheme === 'retro' || selectedTheme === 'glass' || selectedTheme === 'nord' || selectedTheme === 'rose-pine' || selectedTheme === 'custom' || selectedTheme === 'sutradhaar');
    const isCalcModeLocked = isPremiumFeatureLocked && calculatorMode === 'scientific';

    if(isThemeLocked || isCalcModeLocked) {
        setShowPremiumLockDialog(true);
        setSelectedTheme(theme);
        if (isCalcModeLocked) {
            setCalculatorMode('basic');
        }
        return;
    }
    
    setTheme(selectedTheme as any);

    const settingsToSave = {
        language,
        theme: selectedTheme,
        customTheme: theme === 'custom' ? customTheme : null,
        notificationsEnabled,
        saveConversionHistory,
        defaultRegion,
        defaultPage,
        showGettingStarted,
        calculatorMode,
        calculatorTheme,
        calculatorSound
    };

    updateUserData(profile.email, { settings: settingsToSave });

    toast({ title: t('settings.data.toast.saved.title'), description: t('settings.data.toast.saved.description')});
  };

  const handleClearData = () => {
    localStorage.clear();
    if (profile) {
        updateUserData(profile.email, {
            conversionHistory: [],
            calculationHistory: [],
            favoriteConversions: [],
            notes: [],
            dailyStats: {},
            totalConversions: 0,
            totalCalculations: 0,
            totalDateCalculations: 0,
            userVisitHistory: [],
            streakData: { currentStreak: 0, bestStreak: 0, daysNotOpened: 0 }
        });
    }
    toast({ title: t('settings.data.clearData'), description: t('settings.data.toast.cleared.description') });
    setTimeout(() => {
      auth.signOut();
      router.push('/welcome');
    }, 1500);
  };


  if (!isClient) return null;

  const isPremiumFeatureLocked = userRole === 'Member';
  
  const themes = [
      { name: 'Light', value: 'light', isLocked: false },
      { name: 'Dark', value: 'dark', isLocked: false },
      { name: 'Sutradhaar', value: 'sutradhaar', isLocked: isPremiumFeatureLocked },
      { name: 'Retro', value: 'retro', isLocked: isPremiumFeatureLocked },
      { name: 'Glass', value: 'glass', isLocked: isPremiumFeatureLocked },
      { name: 'Nord', value: 'nord', isLocked: isPremiumFeatureLocked },
      { name: 'Rose Pine', value: 'rose-pine', isLocked: isPremiumFeatureLocked },
  ]
  if(customTheme) {
      themes.push({ name: 'Custom', value: 'custom', isLocked: isPremiumFeatureLocked });
  }

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
                    <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 items-end">
                            <div>
                                <Label>{t('settings.appearance.themeMode.label')}</Label>
                                <Select
                                    value={selectedTheme}
                                    onValueChange={(v) => {
                                        const themeItem = themes.find(t => t.value === v);
                                        if (themeItem?.isLocked) {
                                            setShowPremiumLockDialog(true);
                                        } else {
                                            setSelectedTheme(v);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {themes.map((themeItem) => (
                                            <SelectItem key={themeItem.value} value={themeItem.value} disabled={themeItem.isLocked}>
                                                <div className="flex items-center gap-2">
                                                    {themeItem.isLocked && <Lock className="w-3 h-3"/>}
                                                    {themeItem.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="mx-auto w-[150px] h-[200px] bg-gray-800 rounded-lg p-1.5 border-2 border-gray-900 shadow-lg overflow-hidden">
                                <div className="w-full h-full rounded-md overflow-hidden">
                                    <ThemePreview theme={selectedTheme} />
                                </div>
                            </div>
                        </div>
                    </div>
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
                 <SettingRow
                    label="Default Home Page"
                    description="Choose the first page you see"
                    control={
                         <Select value={defaultPage} onValueChange={(value) => setDefaultPage(value as DefaultPage)}>
                            <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dashboard">Dashboard</SelectItem>
                                <SelectItem value="converter">Converter</SelectItem>
                                <SelectItem value="calculator">Calculator</SelectItem>
                                <SelectItem value="notes">Notes</SelectItem>
                                <SelectItem value="time">Timer</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                />
                <SettingRow
                    label="Show Getting Started"
                    description="Display the intro screen on next launch"
                    control={<Switch checked={showGettingStarted} onCheckedChange={setShowGettingStarted} />}
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
                        label="Calculator Style"
                        description="Choose your preferred calculator design"
                        control={
                            <Select value={calculatorTheme} onValueChange={(v) => setCalculatorTheme(v as CalculatorTheme)}>
                                <SelectTrigger className="w-32">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="original">Original</SelectItem>
                                    <SelectItem value="physical">Physical</SelectItem>
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
                        Complete {PREMIUM_MEMBER_THRESHOLD.toLocaleString()} operations or maintain a 15-day streak to unlock this feature and more!
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
