
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Trash2, Code, KeyRound, Lock, Eye, EyeOff, Timer, NotebookText, FileText, ServerCog, Send } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from './ui/switch';
import { sendGlobalNotification } from '@/services/firestore';


const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";
const DEFAULT_DEV_PASSWORD = "121312";
const DEV_PASSWORD_STORAGE_KEY = "developer_password";
const UPDATE_TIMER_STORAGE_KEY = "nextUpdateTime";
const UPDATE_TEXT_STORAGE_KEY = "nextUpdateText";
const MAINTENANCE_MODE_STORAGE_KEY = "maintenanceMode";


interface UserProfile {
    email: string;
    [key: string]: any;
}

export function DevPanel() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [devPassword, setDevPassword] = useState(DEFAULT_DEV_PASSWORD);
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isClient, setIsClient] = useState(false);
    const [showAuthPassword, setShowAuthPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    const [duration, setDuration] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [updateText, setUpdateText] = useState('');
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationDescription, setNotificationDescription] = useState('');
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
        const storedProfile = localStorage.getItem('userProfile');
        const storedDevPassword = localStorage.getItem(DEV_PASSWORD_STORAGE_KEY);
        const storedUpdateText = localStorage.getItem(UPDATE_TEXT_STORAGE_KEY);
        const storedMaintenanceMode = localStorage.getItem(MAINTENANCE_MODE_STORAGE_KEY);
        
        if (storedDevPassword) {
            setDevPassword(storedDevPassword);
        }
         if (storedUpdateText) {
            setUpdateText(storedUpdateText);
        }
        if (storedMaintenanceMode) {
            setIsMaintenanceMode(storedMaintenanceMode === 'true');
        }

        if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
            setProfile(parsedProfile);
            if (parsedProfile.email === DEVELOPER_EMAIL) {
                setIsAuthorized(true);
            }
        }
    }, []);
    
    const handlePasswordSubmit = () => {
        if (password === devPassword) {
            setIsAuthenticated(true);
            toast({ title: "Access Granted", description: "Welcome to the Developer Panel." });
        } else {
            toast({ title: "Access Denied", description: "Incorrect password.", variant: "destructive" });
        }
    };

    const handleClearLocalStorage = () => {
        if (window.confirm("Are you sure you want to clear ALL local storage data? This will log you out and delete all guest data.")) {
            localStorage.clear();
            toast({ title: "Local Storage Cleared", description: "All data has been wiped. The app will now reload." });
            setTimeout(() => router.push('/welcome'), 1500);
        }
    };
    
    const handleChangePassword = () => {
        if (!newPassword || newPassword !== confirmNewPassword) {
            toast({ title: "Password Mismatch", description: "The new passwords do not match.", variant: "destructive" });
            return;
        }
        if (newPassword.length < 6) {
            toast({ title: "Password Too Short", description: "Password must be at least 6 characters.", variant: "destructive" });
            return;
        }
        localStorage.setItem(DEV_PASSWORD_STORAGE_KEY, newPassword);
        setDevPassword(newPassword);
        setNewPassword('');
        setConfirmNewPassword('');
        toast({ title: "Password Updated", description: "Developer password has been changed successfully." });
    };

    const handleDurationChange = (unit: keyof typeof duration, value: string) => {
        const numValue = parseInt(value, 10);
        setDuration(prev => ({ ...prev, [unit]: isNaN(numValue) ? 0 : numValue }));
    };

    const handleSetTimer = () => {
        const now = new Date();
        const { days, hours, minutes, seconds } = duration;
        const totalMilliseconds = (days * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000;
        
        if(totalMilliseconds <= 0) {
            toast({ title: 'Invalid Duration', description: 'Please enter a positive duration.', variant: 'destructive' });
            return;
        }

        const targetDateTime = new Date(now.getTime() + totalMilliseconds);

        localStorage.setItem(UPDATE_TIMER_STORAGE_KEY, targetDateTime.toISOString());
        window.dispatchEvent(new StorageEvent('storage', { key: UPDATE_TIMER_STORAGE_KEY, newValue: targetDateTime.toISOString() }));
        toast({ title: 'Countdown Set!', description: `Timer set for ${targetDateTime.toLocaleString()}` });
    };

    const handleClearTimer = () => {
        localStorage.removeItem(UPDATE_TIMER_STORAGE_KEY);
        window.dispatchEvent(new StorageEvent('storage', { key: UPDATE_TIMER_STORAGE_KEY, newValue: null }));
        setDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        toast({ title: 'Countdown Cleared' });
    };
    
    const handleSaveUpdateText = () => {
        localStorage.setItem(UPDATE_TEXT_STORAGE_KEY, updateText);
         window.dispatchEvent(new StorageEvent('storage', { key: UPDATE_TEXT_STORAGE_KEY, newValue: updateText }));
        toast({ title: 'Update Text Saved' });
    };

    const handleMaintenanceModeToggle = (checked: boolean) => {
        setIsMaintenanceMode(checked);
        localStorage.setItem(MAINTENANCE_MODE_STORAGE_KEY, String(checked));
        window.dispatchEvent(new StorageEvent('storage', { key: MAINTENANCE_MODE_STORAGE_KEY, newValue: String(checked) }));
        toast({
            title: `Maintenance Mode ${checked ? 'Enabled' : 'Disabled'}`,
            description: `The app is now ${checked ? 'in' : 'out of'} maintenance mode.`,
        });
    };

    const handleSendNotification = async () => {
        if (!notificationTitle || !notificationDescription) {
            toast({ title: "Incomplete", description: "Please fill out both title and description.", variant: "destructive" });
            return;
        }
        
        try {
            await sendGlobalNotification({ 
                title: notificationTitle, 
                description: notificationDescription,
                icon: 'new', // Default icon for new broadcasts
            });
            setNotificationTitle('');
            setNotificationDescription('');
            toast({ title: "Notification Sent!", description: "The broadcast has been sent to all users." });
        } catch (error) {
            console.error("Failed to send notification:", error);
            toast({ title: "Broadcast Failed", description: "Could not send notification. Check console for errors.", variant: "destructive" });
        }
    };


    if (!isClient) {
        return null;
    }

    if (!isAuthorized) {
        return (
            <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center text-center gap-4 h-screen">
                <ShieldAlert className="w-16 h-16 text-destructive" />
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">You are not authorized to view this page. Please log in with a developer account.</p>
                <Button onClick={() => router.push('/welcome')}>Go to Login</Button>
            </div>
        );
    }
    
    if (!isAuthenticated) {
         return (
            <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center text-center gap-4 h-screen">
                <KeyRound className="w-16 h-16 text-primary" />
                <h1 className="text-2xl font-bold">Developer Access</h1>
                <p className="text-muted-foreground">This page is restricted. Please enter the password to continue.</p>
                <div className="w-full space-y-4 text-left">
                     <div className="relative">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                            id="password" 
                            type={showAuthPassword ? "text" : "password"} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                            placeholder="Enter developer password" 
                            className="pr-10"
                        />
                         <button
                            type="button"
                            onClick={() => setShowAuthPassword(!showAuthPassword)}
                            className="absolute right-3 top-8 text-muted-foreground"
                        >
                            {showAuthPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <Button onClick={handlePasswordSubmit} className="w-full">
                        Authenticate
                    </Button>
                </div>
                 <Button onClick={() => router.push('/')} variant="outline" className="mt-4">Back to App</Button>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4">
            <header className="text-center">
                <h1 className="text-2xl font-bold">Developer Panel</h1>
                <p className="text-muted-foreground">Tools for testing and debugging.</p>
            </header>

            <Tabs defaultValue="updates" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="updates">Updates</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="data">Raw Data</TabsTrigger>
                </TabsList>
                <TabsContent value="updates" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Timer /> Update Management</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                                <Label htmlFor="maintenance-mode" className="flex items-center gap-2 cursor-pointer">
                                    <ServerCog />
                                    Maintenance Mode
                                </Label>
                                <Switch
                                    id="maintenance-mode"
                                    checked={isMaintenanceMode}
                                    onCheckedChange={handleMaintenanceModeToggle}
                                />
                            </div>
                            <Label>Set Countdown Duration</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="days" className="text-xs">Days</Label>
                                    <Input id="days" type="number" value={duration.days} onChange={(e) => handleDurationChange('days', e.target.value)} placeholder="0" />
                                </div>
                                <div>
                                    <Label htmlFor="hours" className="text-xs">Hours</Label>
                                    <Input id="hours" type="number" value={duration.hours} onChange={(e) => handleDurationChange('hours', e.target.value)} placeholder="0" />
                                </div>
                                <div>
                                    <Label htmlFor="minutes" className="text-xs">Minutes</Label>
                                    <Input id="minutes" type="number" value={duration.minutes} onChange={(e) => handleDurationChange('minutes', e.target.value)} placeholder="0" />
                                </div>
                                <div>
                                    <Label htmlFor="seconds" className="text-xs">Seconds</Label>
                                    <Input id="seconds" type="number" value={duration.seconds} onChange={(e) => handleDurationChange('seconds', e.target.value)} placeholder="0" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSetTimer} className="w-full">Set Timer</Button>
                                <Button onClick={handleClearTimer} variant="destructive" className="w-full">Clear Timer</Button>
                            </div>
                            <div className="pt-4 space-y-2">
                                <Label htmlFor="updateText" className="flex items-center gap-2"><NotebookText /> Upcoming Feature Details</Label>
                                <Textarea 
                                    id="updateText"
                                    value={updateText}
                                    onChange={(e) => setUpdateText(e.target.value)}
                                    placeholder="Describe what's coming in the next update..."
                                    rows={4}
                                />
                                <Button onClick={handleSaveUpdateText} className="w-full">Save Details</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="content" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><FileText /> Content Management</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                                <p>Manage Help & Support FAQs</p>
                                <Button onClick={() => router.push('/dev/help')}>Edit Content</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="broadcast" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Send /> Notification Broadcaster</CardTitle>
                            <CardDescription>Send a notification to all active users of the application.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="notificationTitle">Title</Label>
                                <Input 
                                    id="notificationTitle" 
                                    value={notificationTitle}
                                    onChange={(e) => setNotificationTitle(e.target.value)}
                                    placeholder="e.g., New Feature!"
                                />
                            </div>
                             <div>
                                <Label htmlFor="notificationDescription">Description</Label>
                                <Textarea 
                                    id="notificationDescription"
                                    value={notificationDescription}
                                    onChange={(e) => setNotificationDescription(e.target.value)}
                                    placeholder="Describe the notification..."
                                    rows={3}
                                />
                            </div>
                            <Button onClick={handleSendNotification} className="w-full">
                                Send Broadcast
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="security" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Lock /> Security & Data</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                                <p>Clear all app data</p>
                                <Button variant="destructive" onClick={handleClearLocalStorage}>Clear Local Storage</Button>
                            </div>
                            <div>
                                <Label htmlFor="newPassword">New Developer Password</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    >
                                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="confirmNewPassword"
                                        type={showConfirmNewPassword ? "text" : "password"}
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    >
                                        {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <Button onClick={handleChangePassword} className="w-full">
                                Update Password
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="data" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Code /> Raw Data</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h3 className="font-semibold mb-2">User Profile</h3>
                            <pre className="bg-secondary p-4 rounded-md text-xs overflow-auto">
                                {JSON.stringify(profile, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <Button onClick={() => router.push('/')} variant="outline" className="mt-4">Back to App</Button>
        </div>
    );
}

    
