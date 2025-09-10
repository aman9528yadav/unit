

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Crown, LogOut, Settings, Palette, Globe, Shield, History, CheckCircle, Award, ArrowLeft, Calendar, MapPin, Phone, Linkedin, Twitter, Star, Github, Edit, Instagram, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { listenToUserData, UserData, listenToPremiumInfoContent, PremiumInfoContent } from "@/services/firestore";
import { getStats } from "@/lib/stats";
import { getStreakData } from "@/lib/streak";
import { format } from "date-fns";
import { Progress } from "./ui/progress";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";


type UserRole = 'Member' | 'Premium Member' | 'Owner';
const PREMIUM_MEMBER_THRESHOLD = 10000;
const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";

const defaultSkills = ["React", "Tailwind CSS", "UI/UX Design", "Content Writing", "Cricket", "Music"];

const roleConfig = {
    Member: { icon: UserIcon, color: "text-gray-500" },
    'Premium Member': { icon: Crown, color: "text-purple-500" },
    Owner: { icon: Shield, color: "text-amber-500" },
};


export function UserData() {
    const [profileData, setProfileData] = useState<UserData | null>(null);
    const [stats, setStats] = useState({ conversions: 0, notes: 0, daysActive: 0, totalOps: 0 });
    const [userRole, setUserRole] = useState<UserRole>('Member');
    const [achievements, setAchievements] = useState<string[]>([]);
    const [isPremiumInfoOpen, setIsPremiumInfoOpen] = useState(false);
    const [premiumInfoContent, setPremiumInfoContent] = useState<PremiumInfoContent | null>(null);
    
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useLanguage();

    useEffect(() => {
        const userEmail = auth.currentUser?.email;
        if (!userEmail) {
            router.replace('/welcome');
            return;
        }

        const updateUserRoleAndStats = async (email: string, userData: UserData) => {
            const userStats = await getStats(email);
            const streakData = await getStreakData(email);

            setStats({
                conversions: userStats.totalConversions,
                notes: userStats.savedNotes,
                daysActive: streakData.bestStreak,
                totalOps: userStats.totalOps,
            });
            
            let role: UserRole = 'Member';
            if (email === DEVELOPER_EMAIL) {
                role = 'Owner';
            } else if (userStats.totalOps >= PREMIUM_MEMBER_THRESHOLD || streakData.bestStreak >= 15) {
                role = 'Premium Member';
            }
            setUserRole(role);

            const newAchievements: string[] = [];
            if (auth.currentUser?.emailVerified) newAchievements.push("⭐ Verified User");
            if (userStats.totalConversions >= 100) newAchievements.push("🏆 100+ Conversions");
            if (streakData.bestStreak >= 30) newAchievements.push("📅 30 Days Active");
            if (streakData.bestStreak >= 7) newAchievements.push("🔥 7 Day Streak");
            if (role === 'Premium Member' || role === 'Owner') newAchievements.push("👑 Premium Member");
            setAchievements(newAchievements);
        };


        const unsubscribe = listenToUserData(userEmail, (data) => {
            setProfileData(data);
            updateUserRoleAndStats(userEmail, data);
        });
        
        const unsubPremium = listenToPremiumInfoContent(setPremiumInfoContent);

        return () => {
            unsubscribe();
            unsubPremium();
        };
    }, [router]);

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

    if (!profileData) {
        return null; // Or a loading skeleton
    }

    const {
        profileImage,
        fullName,
        username,
        email,
        phone,
        address,
        dob,
        linkedin,
        twitter,
        github,
        instagram,
        skills = defaultSkills,
        settings,
    } = profileData;

    const premiumProgress = Math.min((stats.totalOps / PREMIUM_MEMBER_THRESHOLD) * 100, 100);
    const RoleIcon = roleConfig[userRole].icon;

    return (
        <div className="min-h-screen flex justify-center p-4 sm:p-6 bg-gray-50 text-gray-900">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-lg"
            >
                <div className="mb-4">
                     <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => router.back()}>
                        <ArrowLeft size={16} /> Back
                    </Button>
                </div>
                
                <Card className="p-6 text-center shadow-xl rounded-2xl relative pt-20">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center group relative">
                             <Avatar className="w-full h-full">
                                <AvatarImage src={profileImage || ''} alt={fullName || 'Profile'} />
                                <AvatarFallback className="text-6xl">
                                    <UserIcon />
                                </AvatarFallback>
                            </Avatar>
                            <Button asChild size="icon" className="absolute bottom-1 right-1 h-8 w-8 rounded-full transition-opacity">
                                <Link href="/profile/edit">
                                    <Edit className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <CardContent className="p-0">
                        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                            {fullName}
                        </h2>
                        {username && <p className="text-sm text-gray-400 mt-1">@{username}</p>}
                         <div className={cn("inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-semibold", roleConfig[userRole].color, "bg-secondary")}>
                            <RoleIcon size={14} /> {userRole}
                         </div>
                        <p className="text-sm text-gray-500">{email}</p>

                        <div className="mt-6 space-y-3 text-left">
                            {phone && <div className="flex justify-between items-center"><span className="font-medium flex items-center gap-2"><Phone size={14} /> Phone</span><span className="px-3 py-1 bg-gray-200 rounded-full text-sm">{phone}</span></div>}
                            {address && <div className="flex justify-between items-center"><span className="font-medium flex items-center gap-2"><MapPin size={14} /> Address</span><span className="px-3 py-1 bg-gray-200 rounded-full text-sm">{address}</span></div>}
                            {dob && <div className="flex justify-between items-center"><span className="font-medium">Birthday</span><span className="px-3 py-1 bg-gray-200 rounded-full text-sm flex items-center gap-1"><Calendar size={14} /> {format(new Date(dob), 'MMMM do')}</span></div>}
                        </div>

                        {settings && (
                             <div className="mt-6 space-y-3 text-left">
                                <div className="flex justify-between items-center"><span className="font-medium">Default Region</span><span className="px-3 py-1 bg-gray-200 rounded-full text-sm">{settings.defaultRegion || 'International'}</span></div>
                                <div className="flex justify-between items-center"><span className="font-medium">Theme</span><span className="px-3 py-1 bg-gray-200 rounded-full text-sm">{settings.theme || 'Default'}</span></div>
                                <div className="flex justify-between items-center"><span className="font-medium">Save History</span><Switch checked={settings.saveHistory} disabled/></div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-6">
                            <Button asChild className="flex gap-2" variant="secondary"><Link href="/settings"><Globe size={16} /> Region</Link></Button>
                            <Button asChild className="flex gap-2" variant="secondary"><Link href="/profile/edit"><Shield size={16} /> Security</Link></Button>
                            <Button asChild className="flex gap-2" variant="secondary"><Link href="/settings/theme"><Palette size={16} /> Theme</Link></Button>
                            <Button asChild className="flex gap-2" variant="secondary"><Link href="/history"><History size={16} /> History</Link></Button>
                        </div>
                        
                        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-lg font-bold">{stats.conversions}</p><p className="text-xs text-gray-500">Conversions</p></div>
                            <div><p className="text-lg font-bold">{stats.notes}</p><p className="text-xs text-gray-500">Notes</p></div>
                            <div><p className="text-lg font-bold">{stats.daysActive}</p><p className="text-xs text-gray-500">Days Active</p></div>
                        </div>

                        {userRole === 'Member' && (
                            <div className="mt-6 text-left">
                                <h3 className="font-semibold flex items-center gap-2 text-lg"><Crown size={18} /> Premium Progress</h3>
                                <p className="text-xs text-gray-500 mt-1">Complete {PREMIUM_MEMBER_THRESHOLD.toLocaleString()} operations to unlock premium features.</p>
                                <Progress value={premiumProgress} className="mt-2" />
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-gray-500 mt-1 text-right">{stats.totalOps.toLocaleString()} / {PREMIUM_MEMBER_THRESHOLD.toLocaleString()}</p>
                                     <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => router.push('/premium')}>
                                        Learn more
                                    </Button>
                                </div>
                            </div>
                        )}

                        {achievements.length > 0 && (
                            <div className="mt-6 text-left">
                                <h3 className="font-semibold flex items-center gap-2 text-lg"><Award size={18} /> Achievements</h3>
                                <ul className="mt-2 space-y-1 text-sm">
                                    {achievements.map((achieve, index) => (<li key={index} className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-1">{achieve}</li>))}
                                </ul>
                            </div>
                        )}

                        {skills && skills.length > 0 && (
                             <div className="mt-6 text-left">
                                <h3 className="font-semibold flex items-center gap-2 text-lg"><Star size={18} /> Skills & Interests</h3>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {skills.map((skill, index) => (<span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm shadow-sm">{skill}</span>))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6 flex gap-4 justify-center">
                            {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline flex items-center gap-1 text-sm"><Linkedin size={16} /> LinkedIn</a>}
                            {twitter && <a href={twitter} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline flex items-center gap-1 text-sm"><Twitter size={16} /> Twitter</a>}
                            {github && <a href={github} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:underline flex items-center gap-1 text-sm"><Github size={16} /> GitHub</a>}
                            {instagram && <a href={instagram} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline flex items-center gap-1 text-sm"><Instagram size={16} /> Instagram</a>}
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-8">
                            <Button asChild variant="outline" size="icon">
                                <Link href="/profile/edit">
                                    <Edit size={16} />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="icon">
                                <Link href="/settings">
                                    <Settings size={16} />
                                </Link>
                            </Button>
                            <Button variant="destructive" size="icon" onClick={handleLogout}>
                                <LogOut size={16} />
                            </Button>
                        </div>
                        
                        <p className="mt-6 text-xs text-gray-500">© 2025 Sutradhar | Owned by Aman Yadav. v1.5.2</p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
