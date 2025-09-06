

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Upload, LogOut, Settings, HelpCircle, X, Pencil, TrendingUp, Info, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { getAllTimeCalculations } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/context/language-context";


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

const PREMIUM_MEMBER_THRESHOLD = 8000;

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
    const [isClient, setIsClient] = useState(false);
    const [userRole, setUserRole] = useState<'Member' | 'Premium Member' | 'Owner'>('Member');
    const [totalCalculations, setTotalCalculations] = useState(0);
    const [progress, setProgress] = useState(0);
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useLanguage();

    const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";

    useEffect(() => {
        setIsClient(true);
        const userProfileData = localStorage.getItem("userProfile");
        if (userProfileData) {
            const parsedProfile = JSON.parse(userProfileData);
            setProfile(parsedProfile);
            loadSettings(parsedProfile.email);
            
            getAllTimeCalculations(parsedProfile.email).then(calculations => {
                setTotalCalculations(calculations);
                setProgress((calculations / PREMIUM_MEMBER_THRESHOLD) * 100);

                if (parsedProfile.email === DEVELOPER_EMAIL) {
                    setUserRole('Owner');
                } else if (calculations >= PREMIUM_MEMBER_THRESHOLD) {
                    setUserRole('Premium Member');
                } else {
                    setUserRole('Member');
                }
            });
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


    return (
        <div className="w-full max-w-lg mx-auto bg-card rounded-2xl shadow-lg border p-6">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <User/>
                    </div>
                    <h1 className="text-xl font-bold">{t('userdata.title')}</h1>
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
                        <AvatarImage src={profile.profileImage} alt={profile.fullName} data-ai-hint="man portrait"/>
                        <AvatarFallback>{profile.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <Button asChild size="icon" className="absolute bottom-4 right-0 rounded-full">
                        <Link href="/profile/edit">
                            <Pencil className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{profile.fullName}</h2>
                    <Badge variant={userRole === 'Owner' ? 'default' : userRole === 'Premium Member' ? 'secondary' : 'outline'}>{t(`userdata.roles.${userRole.toLowerCase().replace(' ', '')}`)}</Badge>
                </div>
                <p className="text-muted-foreground text-sm">{profile.email}</p>
            </div>
            
            {userRole !== 'Owner' && userRole !== 'Premium Member' && (
                <div className="mt-6">
                    <div className="flex justify-between items-end mb-2">
                         <div className="text-sm">
                            <p className="font-semibold text-foreground">{t('userdata.premium.title')}</p>
                            <p className="text-xs text-muted-foreground">{totalCalculations.toLocaleString()} / {PREMIUM_MEMBER_THRESHOLD.toLocaleString()} {t('userdata.premium.ops')}</p>
                        </div>
                        <span className="text-sm font-bold text-primary">{Math.floor(progress)}%</span>
                    </div>
                    <Progress value={progress} />
                    <Button asChild variant="link" size="sm" className="p-0 h-auto mt-2 text-primary">
                        <Link href="/help">
                            <Info className="mr-1 h-3 w-3"/>
                            {t('userdata.premium.learnMore')}
                        </Link>
                    </Button>
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
                    <DetailRow label={t('userdata.sections.preferences.autoConvert')} value={settings?.autoConvert ? t('userdata.sections.preferences.enabled') : t('userdata.sections.preferences.disabled')}/>
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

    