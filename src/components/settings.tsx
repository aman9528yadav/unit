
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronRight, User, Bell, Languages, Palette, LayoutGrid, SlidersHorizontal, History, CalculatorIcon, Info, LogOut, Trash2 } from "lucide-react";
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

export type CalculatorMode = 'basic' | 'scientific';

const getUserKey = (key: string, email: string) => `${email}_${key}`;

const Section = ({ title, children, description }: { title: string, children: React.ReactNode, description?: string }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-4">
            {children}
        </CardContent>
    </Card>
);

const SettingRow = ({ label, description, control }: { label: string, description?: string, control: React.ReactNode }) => (
    <div className="flex justify-between items-center">
        <div>
            <p className="font-medium">{label}</p>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        <div>
            {control}
        </div>
    </div>
)

export function Settings() {
  const [profile, setProfile] = useState<{ email: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Settings states
  const [theme, setTheme] = useState('system');
  const [accent, setAccent] = useState('blue');
  const [unitSystem, setUnitSystem] = useState('si');
  const [frequentLength, setFrequentLength] = useState('m-ft');
  const [frequentTemp, setFrequentTemp] = useState('c-f');
  const [saveHistory, setSaveHistory] = useState(true);
  const [autoClear, setAutoClear] = useState('30');


  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      setProfile(parsedProfile);
    } else {
        // Redirect or handle guest user
    }
  }, []);
  
  const handleSaveChanges = () => {
    // Here you would save all the state values to localStorage or a backend
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

  if (!isClient) return null;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 p-4 sm:p-6">
        <header className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Settings</h1>
            <div className="flex items-center gap-4">
                <p className="text-sm text-muted-foreground">Signed in</p>
                <Button variant="ghost" onClick={handleLogout}><LogOut className="mr-2"/> Log out</Button>
            </div>
        </header>

         <div className="bg-blue-500/10 text-blue-800 dark:text-blue-200 p-4 rounded-lg flex items-center gap-3">
            <Info className="flex-shrink-0" />
            <p className="text-sm">Adjust how Sutradhaar looks and behaves. Changes are saved when you click Save Changes.</p>
        </div>

        <div className="flex flex-col gap-6">
            <Section title="Appearance">
                <SettingRow
                    label="Theme"
                    description="Choose between System, Light, or Dark."
                    control={
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="system">System</SelectItem>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                />
                 <SettingRow
                    label="Accent"
                    description="Affects buttons and highlights."
                    control={
                        <Select value={accent} onValueChange={setAccent}>
                            <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="blue">Blue</SelectItem>
                                <SelectItem value="green">Green</SelectItem>
                                <SelectItem value="red">Red</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                />
            </Section>

             <Section title="Default Units">
                <SettingRow
                    label="Unit System"
                    control={
                        <Select value={unitSystem} onValueChange={setUnitSystem}>
                            <SelectTrigger className="w-40"><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="si">SI (Metric)</SelectItem>
                                <SelectItem value="imperial">Imperial</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                />
                 <SettingRow
                    label="Frequent Conversions"
                    control={
                        <div className="flex gap-2">
                             <Select value={frequentLength} onValueChange={setFrequentLength}>
                                <SelectTrigger className="w-auto"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="m-ft">Length • m ↔ ft</SelectItem>
                                    <SelectItem value="km-mi">Length • km ↔ mi</SelectItem>
                                </SelectContent>
                            </Select>
                             <Select value={frequentTemp} onValueChange={setFrequentTemp}>
                                <SelectTrigger className="w-auto"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="c-f">Temperature • °C ↔ °F</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    }
                />
            </Section>
            
            <Section title="Privacy & History">
                <SettingRow
                    label="Save Conversion History"
                    description="Disable to stop storing past conversions."
                    control={<Switch checked={saveHistory} onCheckedChange={setSaveHistory} />}
                />
                 <SettingRow
                    label="Auto-clear after"
                    control={
                        <div className="flex items-center gap-2">
                            <Select value={autoClear} onValueChange={setAutoClear}>
                                <SelectTrigger className="w-32"><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30">30 days</SelectItem>
                                    <SelectItem value="60">60 days</SelectItem>
                                    <SelectItem value="90">90 days</SelectItem>
                                    <SelectItem value="never">Never</SelectItem>
                                </SelectContent>
                            </Select>
                             <Button variant="outline"><Trash2 className="mr-2 h-4 w-4"/> Clear Now</Button>
                        </div>
                    }
                />
            </Section>

            <Section title="About">
                <SettingRow label="App" control={<p className="font-mono">Sutradhaar • Unit Converter v1.0.0</p>} />
                <SettingRow label="Developer" control={<p>Aman Yadav</p>} />
                <SettingRow label="Support" control={
                    <div className="flex gap-4">
                        <Button variant="link" asChild><a href="mailto:support@sutradhaar.app">Email</a></Button>
                        <Button variant="link" asChild><a href="#">Website</a></Button>
                    </div>
                }/>
            </Section>
        </div>
        
        <footer className="flex justify-end gap-4 mt-4">
            <Button variant="outline" asChild><Link href="/">Back</Link></Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
        </footer>
    </div>
  );
}
