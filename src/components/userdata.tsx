

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Upload, LogOut, Settings, HelpCircle, X, Pencil, TrendingUp, Info, CheckCircle, Crown, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/context/language-context";
import { getStats } from "@/lib/stats";
import { ProfilePhotoEditor } from "./profile-photo-editor";
import { listenToUserData } from "@/services/firestore";
import { getStreakData } from "@/lib/streak";


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

const PREMIUM_MEMBER_THRESHOLD = 10000;
type UserRole = 'Member' | 'Premium Member' | 'Owner';

const DetailRow = ({ label, value, valueClassName }: { label: string, value: React.ReactNode, valueClassName?: string }) => (
    <div className="flex justify-between items-center py-3">
        <span className="text-muted-foreground">{label}</span>
        <div className={`flex items-center gap-2 font-medium text-foreground text-right ${valueClassName}`}>
            {value}
        </div>
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
    const [userRole, setUserRole] = useState<UserRole>('Member');
    const [stats, setStats] = useState({ totalOps: 0 });
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useLanguage();


    useEffect(() => {
        setIsClient(true);
        const userEmail = auth.currentUser?.email || (localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null);
    
        if (!userEmail) {
            router.replace('/welcome');
            return;
        }

        const unsub = listenToUserData(userEmail, (data) => {
            if (!data) {
                router.replace('/welcome');
                return;
            }
            const userProfile: UserProfile = {
                fullName: data.fullName || auth.currentUser?.displayName || 'Guest',
                email: userEmail,
                profileImage: data.profileImage,
            };
            setProfile(userProfile);
            
            const userSettings = data.settings || {};
             setSettings({
                theme: userSettings.theme?.charAt(0).toUpperCase() + userSettings.theme?.slice(1) || 'System',
                defaultRegion: userSettings.defaultRegion || 'International',
                saveHistory: userSettings.saveConversionHistory ?? true,
                autoConvert: userSettings.autoConvert ?? true,
            });

            updateUserRoleAndStats(userEmail);
        });

        return () => unsub();

    }, [router]);

    const updateUserRoleAndStats = async (email: string | null) => {
        const userStats = await getStats(email);
        setStats({ totalOps: userStats.totalOps });
        const streakData = await getStreakData(email);

        if(email === "amanyadavyadav9458@gmail.com") {
            setUserRole('Owner');
            return;
        }
        if(userStats.totalOps >= PREMIUM_MEMBER_THRESHOLD || streakData.bestStreak >= 15) {
            setUserRole('Premium Member');
        } else {
            setUserRole('Member');
        }
    };
    
    const handleLogout = () => {
        auth.signOut().then(() => {
            localStorage.removeItem("userProfile");
            toast({ title: t('profile.toast.logout.title'), description: t('profile.toast.logout.description') });
            router.push("/logout");
        }).catch((error) => {
            console.error("Logout Error:", error);
            toast({ title: t('profile.toast.logoutFailed.title'), description: t('profile.toast.logoutFailed.description'), variant: "destructive" });
        });
    };
    
    if (!isClient || !profile) {
        // You can return a loading skeleton here
        return null;
    }

    const roleText = {
      'Member': t('userdata.roles.member'),
      'Premium Member': t('userdata.roles.premiummember'),
      'Owner': t('userdata.roles.owner')
    }
    const RoleIcon = userRole === 'Member' ? Star : Crown;
    const roleIconColor = userRole === 'Member' ? '' : 'text-yellow-400';
    const progress = Math.min((stats.totalOps / PREMIUM_MEMBER_THRESHOLD) * 100, 100);


    return (
        <div className="w-full max-w-lg mx-auto bg-card rounded-2xl shadow-lg border p-6">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <User/>
                    </div>
                    <h1 className="text-xl font-bold">{t('userdata.title')}</h1>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href="/profile/edit"><Pencil className="h-4 w-4"/></Link>
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild><Link href="/help"><HelpCircle className="mr-2 h-4 w-4"/> {t('userdata.help')}</Link></Button>
                     <Link href="/">
                        <Button variant="ghost" size="icon"><X/></Button>
                    </Link>
                </div>
            </header>

             <div className="flex flex-col items-center text-center">
                 <div className="relative">
                    <Avatar className="w-28 h-28 mb-4">
                        <AvatarImage src={profile.profileImage} alt={profile.fullName}/>
                        <AvatarFallback>{profile.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                </div>
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                     <Badge variant="secondary">
                        <RoleIcon className={`mr-2 h-4 w-4 ${roleIconColor}`}/>
                        {roleText[userRole]}
                    </Badge>
                </div>
                <p className="text-muted-foreground text-sm">{profile.email}</p>
            </div>
            
            {userRole === 'Member' && (
                <div className="my-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold">{t('userdata.premium.title')}</h3>
                        <p className="text-sm font-bold">{stats.totalOps.toLocaleString()} / {PREMIUM_MEMBER_THRESHOLD.toLocaleString()} {t('userdata.premium.ops')}</p>
                    </div>
                    <Progress value={progress} />
                     <Link href="/help">
                        <p className="text-xs text-center text-muted-foreground mt-2 hover:underline cursor-pointer">
                            {t('userdata.premium.learnMore')}
                        </p>
                    </Link>
                </div>
            )}


            <main className="w-full mt-2">
                <Section title={t('userdata.sections.account.title')}>
                    <DetailRow label={t('userdata.sections.account.name')} value={profile.fullName}/>
                    <DetailRow label={t('userdata.sections.account.email')} value={profile.email}/>
                    <DetailRow
                        label={t('userdata.sections.account.status')}
                        value={
                            <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                {t('userdata.sections.account.verified')}
                            </>
                        }
                    />
                </Section>

                <Section title={t('userdata.sections.preferences.title')}>
                    <DetailRow label={t('userdata.sections.preferences.region')} value={settings?.defaultRegion || '...'}/>
                    <DetailRow label={t('userdata.sections.preferences.theme')} value={t(`userdata.sections.preferences.themes.${settings?.theme.toLowerCase() || '...'}`)}/>
                    <DetailRow label={t('userdata.sections.preferences.saveHistory')} value={settings?.saveHistory ? t('userdata.sections.preferences.enabled') : t('userdata.sections.preferences.disabled')}/>
                </Section>
            </main>

            <footer className="mt-8 pt-6 border-t flex justify-end items-center gap-4">
                <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4"/> {t('userdata.logout')}</Button>
                <Link href="/settings">
                    <Button><Settings className="mr-2 h-4 w-4"/> {t('userdata.manageSettings')}</Button>
                </Link>
            </footer>
        </div>
    );
}
