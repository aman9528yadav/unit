
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, User, Bell, Languages, Palette, LayoutGrid, SlidersHorizontal, History, CalculatorIcon, Info, LogOut, Trash2, KeyRound, Globe } from "lucide-react";
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


export type CalculatorMode = 'basic' | 'scientific';

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

  // Settings states
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const [autoConvert, setAutoConvert] = useState(true);
  const [saveConversionHistory, setSaveConversionHistory] = useState(true);
  const [defaultRegion, setDefaultRegion] = useState<Region>('International');

  const [calculatorMode, setCalculatorMode] = useState<CalculatorMode>('scientific');
  const [saveCalcHistory, setSaveCalcHistory] = useState(true);
  

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      setProfile(parsedProfile);
      loadSettings(parsedProfile.email);
    } else {
      loadSettings(null);
    }
  }, []);

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
  };
  
  const handleSaveChanges = () => {
    const userKey = profile?.email || null;
    localStorage.setItem(getUserKey('notificationsEnabled', userKey), JSON.stringify(notificationsEnabled));
    localStorage.setItem(getUserKey('autoConvert', userKey), JSON.stringify(autoConvert));
    localStorage.setItem(getUserKey('saveConversionHistory', userKey), JSON.stringify(saveConversionHistory));
    localStorage.setItem(getUserKey('defaultRegion', userKey), defaultRegion);
    localStorage.setItem('calculatorMode', calculatorMode);
    localStorage.setItem('saveCalcHistory', JSON.stringify(saveCalcHistory));
    
    // Dispatch storage events to notify other components/tabs
    window.dispatchEvent(new StorageEvent('storage', { key: getUserKey('notificationsEnabled', userKey), newValue: JSON.stringify(notificationsEnabled) }));
    window.dispatchEvent(new StorageEvent('storage', { key: getUserKey('autoConvert', userKey), newValue: JSON.stringify(autoConvert) }));
    window.dispatchEvent(new StorageEvent('storage', { key: getUserKey('saveConversionHistory', userKey), newValue: JSON.stringify(saveConversionHistory) }));
    window.dispatchEvent(new StorageEvent('storage', { key: getUserKey('defaultRegion', userKey), newValue: defaultRegion }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'calculatorMode', newValue: calculatorMode }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'saveCalcHistory', newValue: JSON.stringify(saveCalcHistory) }));


    toast({ title: "Settings Saved", description: "Your preferences have been updated."});
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
        localStorage.removeItem("userProfile");
        toast({ title: "Logged Out", description: "You have been successfully logged out." });
        router.push("/logout");
    }).catch((error) => {
        console.error("Logout Error:", error);
        toast({ title: "Logout Failed", description: "An error occurred while logging out.", variant: "destructive" });
    });
  };

  const handleClearData = () => {
    localStorage.clear();
    toast({ title: "Data Cleared", description: "All app data has been wiped. You will be logged out." });
    setTimeout(() => {
      router.push('/welcome');
    }, 1500);
  };


  if (!isClient) return null;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-6 p-4 sm:p-6">
        <header className="flex items-center gap-4">
          <Link href="/">
              <Button variant="ghost" size="icon">
                  <ArrowLeft />
              </Button>
          </Link>
          <h1 className="text-xl font-bold">Settings</h1>
        </header>

        <div className="flex flex-col gap-6">
             <Section title="Account">
                <SettingRow
                    isLink
                    href="/profile/edit"
                    label="Edit Profile"
                    description="Manage your personal information"
                    control={<User />}
                />
            </Section>

            <Section title="General">
                 <SettingRow
                    label="Notifications"
                    description={notificationsEnabled ? "Enabled" : "Disabled"}
                    control={<Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />}
                />
                 <SettingRow
                    label="Language"
                    description="Set your preferred language"
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
                    isLink
                    href="/settings/theme"
                    label="Theme"
                    description="Customize the app's appearance"
                    control={<Palette />}
                />
            </Section>

             <Section title="Unit Converter" description="Configure default units and conversion behavior.">
                 <SettingRow
                    label="Default Region"
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
                    label="Auto Convert"
                    description="Automatically convert on value change"
                    control={<Switch checked={autoConvert} onCheckedChange={setAutoConvert} />}
                />
                 <SettingRow
                    isLink
                    href="/settings/custom-units"
                    label="Custom Units"
                    description="Add or manage your own units"
                    control={<LayoutGrid />}
                />
                 <SettingRow
                    label="Save Conversion History"
                    description="Keep a record of your conversions"
                    control={<Switch checked={saveConversionHistory} onCheckedChange={setSaveConversionHistory} />}
                />
            </Section>

            <Section title="Calculator">
                 <SettingRow
                    label="Mode"
                    description="Switch between calculator types"
                    control={
                        <Select value={calculatorMode} onValueChange={(v) => setCalculatorMode(v as CalculatorMode)}>
                            <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="scientific">Scientific</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                />
                  <SettingRow
                    label="Save Calculation History"
                    description="Keep a record of your calculations"
                    control={<Switch checked={saveCalcHistory} onCheckedChange={setSaveCalcHistory} />}
                />
            </Section>
        </div>
        
        <footer className="flex justify-between items-center gap-4 mt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4"/> Clear Data</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all app data, including your settings, history, and notes, and log you out.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90">
                    Yes, Clear Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2"/> Log out</Button>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
        </footer>
    </div>
  );
}
