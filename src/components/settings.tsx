

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, User, Bell, Languages, Palette, LayoutGrid, SlidersHorizontal, CalculatorIcon, Info, LogOut, Trash2, KeyRound, Globe, Code, Lock, Music, Sigma, Home, Rocket, Crown, HelpCircle, Star, Flag } from "lucide-react";
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
import { Region, conversionCategories } from "@/lib/conversions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { getStats } from "@/lib/stats";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { cn } from "@/lib/utils";
import { Label } from "./ui/label";
import { listenToUserData, updateUserData, listenToPremiumInfoContent, PremiumInfoContent, defaultPremiumInfo } from "@/services/firestore";
import { getStreakData } from "@/lib/streak";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";

export type CalculatorMode = 'basic' | 'scientific';
type DefaultPage = 'dashboard' | 'calculator' | 'notes' | 'converter' | 'time';
type CalculatorTheme = 'original' | 'physical';
const PREMIUM_MEMBER_THRESHOLD = 10000;
type UserRole = 'Member' | 'Premium Member' | 'Owner';


const regions: Region[] = ['International', 'India', 'Japan', 'Korea', 'China', 'Middle East'];


const SettingRow = ({ label, description, control, isLink = false, href, children, onLockClick, isPremium = false }: { label:string, description?:string, control?:React.ReactNode, isLink?:boolean, href?:string, children?:React.ReactNode, onLockClick?:()=>void, isPremium?: boolean }) => {
    const content = (
        <div className="flex justify-between items-center py-4">
            <div className="flex-1 pr-4">
                <div className="flex items-center gap-2">
                    {isPremium && (
                         <Star className={cn("h-4 w-4 text-yellow-400 fill-yellow-400")} />
                    )}
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
    
    const Wrapper = isLink && href ? Link : 'div';
    const wrapperProps = isLink && href ? { href } : {};

    const handleClick = (e: React.MouseEvent) => {
        if (isPremium && onLockClick) {
            e.preventDefault();
            onLockClick();
        }
    };

    if (isLink && href) {
        return <Link href={href} onClick={isPremium ? handleClick : undefined} className="px-4 border-b last:border-b-0 block">{content}</Link>;
    }


    return (
        <div className="px-4 border-b last:border-b-0" onClick={isPremium ? handleClick : undefined}>
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
  const { toast } = useToast();
  const router = useRouter();


  // Settings states
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme, customTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const [saveConversionHistory, setSaveConversionHistory] = useState(true);
  const [defaultRegion, setDefaultRegion] = useState<Region>('International');
  const [defaultCategory, setDefaultCategory] = useState<string>('Length');
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
    
    if (email) {
      setProfile({ email });
    } else {
        router.replace('/welcome');
        return;
    }

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
            if (userSettings.defaultCategory) setDefaultCategory(userSettings.defaultCategory);
            if (userSettings.defaultPage) setDefaultPage(userSettings.defaultPage);
            if (userSettings.calculatorMode) setCalculatorMode(userSettings.calculatorMode);
            if (userSettings.calculatorTheme) setCalculatorTheme(userSettings.calculatorTheme);
            setShowGettingStarted(userSettings.showGettingStarted ?? true);
            setCalculatorSound(userSettings.calculatorSound ?? true);
        });
        
        return () => {
            unsub();
        };
    }
  }, [router]);
  
  const updateUserRole = async (email: string | null) => {
    if(email === DEVELOPER_EMAIL) {
        setUserRole('Owner');
        return;
    }
    if (!email) {
        setUserRole('Member');
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

    setTheme(selectedTheme as any);

    const settingsToSave = {
        language,
        theme: selectedTheme,
        customTheme: theme === 'custom' ? customTheme : null,
        notificationsEnabled,
        saveConversionHistory,
        defaultRegion,
        defaultCategory,
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
  
  const themes = [
      { name: 'Light', value: 'light', isPremium: false },
      { name: 'Dark', value: 'dark', isPremium: false },
      { name: 'Sutradhaar', value: 'sutradhaar', isPremium: true },
      { name: 'Retro', value: 'retro', isPremium: true },
      { name: 'Glass', value: 'glass', isPremium: true },
      { name: 'Nord', value: 'nord', isPremium: true },
      { name: 'Rose Pine', value: 'rose-pine', isPremium: true },
  ]
  if(customTheme) {
      themes.push({ name: 'Custom', value: 'custom', isPremium: true });
  }

  const isCustomizeThemeLocked = userRole === 'Member';
  const isScientificModeLocked = userRole === 'Member';
  const isCustomUnitsLocked = userRole === 'Member';
  
  const handlePremiumLockClick = () => {
    router.push('/premium');
  }


  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 p-4 sm:p-6">
        <header className="flex items-center gap-4">
            <Button variant="secondary" className="rounded-xl shadow-md" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
          <h1 className="text-xl font-bold">{t('settings.title')}</h1>
        </header>

        <div className="flex flex-col gap-6">
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full space-y-4">
                <AccordionItem value="item-1" className="border-none">
                    <AccordionTrigger className="p-4 bg-card rounded-lg border">
                         <div className='flex items-center gap-4'>
                            <User />
                            <div>
                               <p className="font-semibold text-base text-left">Account</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 bg-card border-t-0 rounded-b-lg border mt-[-8px] pt-2">
                         <SettingRow
                            isLink
                            href="/profile/edit"
                            label={t('settings.account.editProfile.label')}
                            description={t('settings.account.editProfile.description')}
                        />
                         <div className="px-4 py-2 text-center">
                            <Button variant="link" onClick={() => router.push('/premium')} className="text-primary">
                                Learn more about Premium
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="item-2" className="border-none">
                    <AccordionTrigger className="p-4 bg-card rounded-lg border">
                         <div className='flex items-center gap-4'>
                            <Palette />
                            <div>
                               <p className="font-semibold text-base text-left">Appearance</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-card border-t-0 rounded-b-lg border mt-[-8px] pt-2">
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4 items-end">
                                <div>
                                    <Label>{t('settings.appearance.themeMode.label')}</Label>
                                    <Select
                                        value={selectedTheme}
                                        onValueChange={(v) => {
                                            const themeItem = themes.find(t => t.value === v);
                                            if (themeItem?.isPremium && userRole === 'Member') {
                                                handlePremiumLockClick();
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
                                                <SelectItem key={themeItem.value} value={themeItem.value}>
                                                    <div className="flex items-center gap-2">
                                                        {themeItem.isPremium && <Star className={cn("w-3 h-3", (themeItem.isPremium && userRole === 'Member') ? "text-muted-foreground" : "text-yellow-500 fill-yellow-400")} />}
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
                            isPremium={isCustomizeThemeLocked}
                            onLockClick={handlePremiumLockClick}
                        />
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="item-3" className="border-none">
                    <AccordionTrigger className="p-4 bg-card rounded-lg border">
                         <div className='flex items-center gap-4'>
                            <SlidersHorizontal />
                            <div>
                               <p className="font-semibold text-base text-left">General</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 bg-card border-t-0 rounded-b-lg border mt-[-8px] pt-2">
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
                        {profile?.email === DEVELOPER_EMAIL && (
                          <SettingRow
                              isLink
                              href="/dev"
                              label={t('settings.general.developer.label')}
                              description={t('settings.general.developer.description')}
                              control={<Code />}
                          />
                        )}
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="item-4" className="border-none">
                    <AccordionTrigger className="p-4 bg-card rounded-lg border">
                         <div className='flex items-center gap-4'>
                            <Sigma />
                            <div>
                               <p className="font-semibold text-base text-left">Unit Converter</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 bg-card border-t-0 rounded-b-lg border mt-[-8px] pt-2">
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
                            label="Default Category"
                            control={
                                <Select value={defaultCategory} onValueChange={(v) => setDefaultCategory(v)}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {conversionCategories.map(c => (
                                            <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
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
                            isPremium={isCustomUnitsLocked}
                            onLockClick={handlePremiumLockClick}
                        />
                         <SettingRow
                            label={t('settings.unitConverter.saveHistory.label')}
                            description={t('settings.unitConverter.saveHistory.description')}
                            control={<Switch checked={saveConversionHistory} onCheckedChange={setSaveConversionHistory} />}
                        />
                    </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="item-5" className="border-none">
                    <AccordionTrigger className="p-4 bg-card rounded-lg border">
                         <div className='flex items-center gap-4'>
                            <CalculatorIcon />
                            <div>
                               <p className="font-semibold text-base text-left">Calculator</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 bg-card border-t-0 rounded-b-lg border mt-[-8px] pt-2">
                        <div onClick={() => isScientificModeLocked && handlePremiumLockClick()} className={cn(isScientificModeLocked && "cursor-pointer")}>
                            <SettingRow
                                label={t('settings.calculator.mode.label')}
                                description={t('settings.calculator.mode.description')}
                                isPremium={isScientificModeLocked}
                                onLockClick={handlePremiumLockClick}
                                control={
                                    <Select value={calculatorMode} onValueChange={(v) => { if(!isScientificModeLocked) setCalculatorMode(v as CalculatorMode) }}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="basic">{t('settings.calculator.modes.basic')}</SelectItem>
                                            <SelectItem value="scientific" onSelect={(e) => {if(isScientificModeLocked) e.preventDefault()}}>{t('settings.calculator.modes.scientific')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                }
                            />
                        </div>
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
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
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
