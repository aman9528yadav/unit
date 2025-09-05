"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Upload, LogOut, Settings, HelpCircle, X, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";


interface UserProfile {
    fullName: string;
    email: string;
    profileImage?: string;
}

interface UserSettings {
    theme: string;
    defaultRegion: string;
    saveHistory: boolean;
    autoConvert: boolean;
}

const DetailRow = ({ label, value, valueClassName }: { label: string, value: React.ReactNode, valueClassName?: string }) => (
    <div className="flex justify-between items-center py-3">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-medium text-foreground text-right ${valueClassName}`}>{value}</span>
    </div>
);

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-1 mt-4">{title.toUpperCase()}</h3>
        <div className="bg-secondary/50 rounded-lg p-4 divide-y divide-border">
            {children}
        </div>
    </div>
)

export function UserData() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [settings, setSettings] = useState<UserSettings | null>(null);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
        const userProfileData = localStorage.getItem("userProfile");
        if (userProfileData) {
            const parsedProfile = JSON.parse(userProfileData);
            setProfile(parsedProfile);
            loadSettings(parsedProfile.email);
        } else {
            router.push('/welcome');
        }
    }, [router]);

    const loadSettings = (email: string | null) => {
        const getUserKey = (key: string, userEmail: string | null) => `${userEmail || 'guest'}_${key}`;

        const theme = localStorage.getItem('theme') || 'system';
        const defaultRegion = localStorage.getItem(getUserKey('defaultRegion', email)) || 'International';
        const saveHistoryRaw = localStorage.getItem(getUserKey('saveConversionHistory', email));
        const autoConvertRaw = localStorage.getItem(getUserKey('autoConvert', email));

        setSettings({
            theme: theme.charAt(0).toUpperCase() + theme.slice(1),
            defaultRegion,
            saveHistory: saveHistoryRaw === null ? true : JSON.parse(saveHistoryRaw),
            autoConvert: autoConvertRaw === null ? true : JSON.parse(autoConvertRaw),
        });
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
    
    if (!isClient || !profile) {
        // You can return a loading skeleton here
        return null;
    }


    return (
        <div className="w-full max-w-lg mx-auto bg-card rounded-2xl shadow-lg border p-6">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <User/>
                    </div>
                    <h1 className="text-xl font-bold">Profile</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild><Link href="/help"><HelpCircle className="mr-2 h-4 w-4"/> Help</Link></Button>
                     <Link href="/">
                        <Button variant="ghost" size="icon"><X/></Button>
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <aside className="col-span-1 flex flex-col items-center text-center md:border-r md:pr-8">
                     <div className="relative">
                        <Avatar className="w-28 h-28 mb-4">
                            <AvatarImage src={profile.profileImage} alt={profile.fullName} data-ai-hint="man portrait"/>
                            <AvatarFallback>{profile.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <Button asChild size="icon" className="absolute bottom-4 right-0 rounded-full">
                            <Link href="/profile/edit">
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                    <h2 className="text-xl font-bold">{profile.fullName}</h2>
                    <p className="text-muted-foreground text-sm truncate w-full">{profile.email}</p>
                </aside>

                <main className="col-span-2 space-y-2">
                    <Section title="Account">
                        <DetailRow label="Name" value={profile.fullName}/>
                        <DetailRow label="Email" value={profile.email}/>
                        <DetailRow label="Status" value="Verified" valueClassName="text-green-500"/>
                    </Section>

                    <Section title="Preferences">
                        <DetailRow label="Default Region" value={settings?.defaultRegion || '...'}/>
                        <DetailRow label="Theme" value={settings?.theme || '...'}/>
                        <DetailRow label="Save History" value={settings?.saveHistory ? "Enabled" : "Disabled"}/>
                         <DetailRow label="Auto-Convert" value={settings?.autoConvert ? "Enabled" : "Disabled"}/>
                    </Section>
                </main>
            </div>

            <footer className="mt-8 pt-6 border-t flex justify-end items-center gap-4">
                <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/> Log out</Button>
                <Link href="/settings">
                    <Button><Settings className="mr-2 h-4 w-4"/> Manage Settings</Button>
                </Link>
            </footer>
        </div>
    );
}