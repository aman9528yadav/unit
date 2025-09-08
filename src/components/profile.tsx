

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Crown, LogOut, Settings, Palette, Globe, Shield, History, CheckCircle, Award, ArrowLeft, Calendar, MapPin, Phone, Linkedin, Twitter, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/context/language-context";
import { listenToUserData, UserData } from "@/services/firestore";
import { getStats } from "@/lib/stats";
import { getStreakData } from "@/lib/streak";
import { format } from "date-fns";

type UserRole = 'Member' | 'Premium Member' | 'Owner';
const PREMIUM_MEMBER_THRESHOLD = 10000;
const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";

const defaultSkills = ["React", "Tailwind CSS", "UI/UX Design", "Content Writing", "Cricket", "Music"];

export function Profile() {
    const [profileData, setProfileData] = useState<UserData | null>(null);
    const [stats, setStats] = useState({ conversions: 0, notes: 0, daysActive: 0, history: 0 });
    const [userRole, setUserRole] = useState<UserRole>('Member');
    const [achievements, setAchievements] = useState<string[]>([]);
    
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
                history: userStats.totalHistory,
            });

            if (email === DEVELOPER_EMAIL) {
                setUserRole('Owner');
            } else if (userStats.totalOps >= PREMIUM_MEMBER_THRESHOLD || streakData.bestStreak >= 15) {
                setUserRole('Premium Member');
            } else {
                setUserRole('Member');
            }

            const newAchievements: string[] = [];
            if (auth.currentUser?.emailVerified) newAchievements.push("⭐ Verified User");
            if (userStats.totalConversions >= 100) newAchievements.push("🏆 100+ Conversions");
            if (streakData.bestStreak >= 30) newAchievements.push("📅 30 Days Active");
            if (streakData.bestStreak >= 7) newAchievements.push("🔥 7 Day Streak");
            if (userRole === 'Premium Member' || userRole === 'Owner') newAchievements.push("👑 Premium Member");
            setAchievements(newAchievements);
        };


        const unsubscribe = listenToUserData(userEmail, (data) => {
            setProfileData(data);
            updateUserRoleAndStats(userEmail, data);
        });

        return () => unsubscribe();
    }, [router, userRole, t]);


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
        email,
        phone,
        address,
        dob,
        linkedin,
        twitter,
        skills = defaultSkills,
        settings,
    } = profileData;

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

                <div className="relative rounded-2xl overflow-hidden shadow-lg">
                    <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
                            <img
                                src={profileImage || 'https://i.pravatar.cc/150?u=amanyadav9458'}
                                alt="Profile"
                                className="w-full h-full rounded-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                <Card className="mt-20 p-6 text-center shadow-xl rounded-2xl">
                    <CardContent className="p-0">
                        <h2 className="text-xl font-semibold flex items-center justify-center gap-2">
                            {fullName} {userRole !== 'Member' && <Crown className="text-yellow-500" size={20} />}
                        </h2>
                        <p className="text-sm text-gray-500">{email}</p>
                        <p className="flex items-center justify-center gap-1 text-green-500 mt-1 text-sm">
                            <CheckCircle size={16} /> Verified
                        </p>

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
                            <Button asChild className="flex gap-2" variant="secondary"><Link href="/settings"><Globe size={16} /> {settings?.defaultRegion || 'Region'}</Link></Button>
                            <Button asChild className="flex gap-2" variant="secondary"><Link href="/profile/edit"><Shield size={16} /> Security</Link></Button>
                            <Button asChild className="flex gap-2" variant="secondary"><Link href="/settings/theme"><Palette size={16} /> {settings?.theme || 'Theme'}</Link></Button>
                            <Button asChild className="flex gap-2" variant="secondary"><Link href="/history"><History size={16} /> {stats.history} items</Link></Button>
                        </div>
                        
                        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-lg font-bold">{stats.conversions}</p><p className="text-xs text-gray-500">Conversions</p></div>
                            <div><p className="text-lg font-bold">{stats.notes}</p><p className="text-xs text-gray-500">Notes</p></div>
                            <div><p className="text-lg font-bold">{stats.daysActive}</p><p className="text-xs text-gray-500">Days Active</p></div>
                        </div>

                        {achievements.length > 0 && (
                            <div className="mt-6 text-left">
                                <h3 className="font-semibold flex items-center gap-2 text-lg"><Award size={18} /> Achievements</h3>
                                <ul className="mt-2 space-y-1 text-sm">
                                    {achievements.map((achieve, index) => (<li key={index} className="flex items-center gap-2 bg-gray-100 rounded-md px-3 py-1">{achieve}</li>))}
                                </ul>
                            </div>
                        )}

                        {skills.length > 0 && (
                             <div className="mt-6 text-left">
                                <h3 className="font-semibold flex items-center gap-2 text-lg"><Star size={18} /> Skills & Interests</h3>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {skills.map((skill, index) => (<span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm shadow-sm">{skill}</span>))}
                                </div>
                            </div>
                        )}

                        {(linkedin || twitter) && (
                            <div className="mt-6 flex gap-4 justify-center">
                                {linkedin && <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline flex items-center gap-1 text-sm"><Linkedin size={16} /> LinkedIn</a>}
                                {twitter && <a href={twitter} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline flex items-center gap-1 text-sm"><Twitter size={16} /> Twitter</a>}
                            </div>
                        )}

                        <div className="flex justify-between mt-8">
                            <Button variant="outline" className="flex gap-2" onClick={handleLogout}><LogOut size={16} /> Log out</Button>
                            <Button asChild className="flex gap-2"><Link href="/settings"><Settings size={16} /> Manage Settings</Link></Button>
                        </div>
                        
                        <p className="mt-6 text-xs text-gray-500">© 2025 Sutradhar | Owned by Aman Yadav. v1.5.2</p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
