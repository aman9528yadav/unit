
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldAlert, Trash2, Code, KeyRound, Lock, Eye, EyeOff, Timer } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';

const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";
const DEFAULT_DEV_PASSWORD = "121212";
const DEV_PASSWORD_STORAGE_KEY = "developer_password";
const UPDATE_TIMER_STORAGE_KEY = "nextUpdateTime";

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
    const [countdownDate, setCountdownDate] = useState('');
    const [countdownTime, setCountdownTime] = useState('');
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
        const storedProfile = localStorage.getItem('userProfile');
        const storedDevPassword = localStorage.getItem(DEV_PASSWORD_STORAGE_KEY);
        
        if (storedDevPassword) {
            setDevPassword(storedDevPassword);
        }

        if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
            setProfile(parsedProfile);
            if (parsedProfile.email === DEVELOPER_EMAIL) {
                setIsAuthorized(true);
            }
        }

        const storedTimer = localStorage.getItem(UPDATE_TIMER_STORAGE_KEY);
        if (storedTimer) {
            const date = new Date(storedTimer);
            if (!isNaN(date.getTime())) {
                setCountdownDate(date.toISOString().split('T')[0]);
                setCountdownTime(date.toTimeString().split(' ')[0].substring(0, 5));
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

    const handleSetTimer = () => {
        if (!countdownDate || !countdownTime) {
            toast({ title: 'Invalid Date/Time', description: 'Please select both a date and a time.', variant: 'destructive' });
            return;
        }
        // Correctly parse date and time parts to avoid timezone issues
        const [year, month, day] = countdownDate.split('-').map(Number);
        const [hours, minutes] = countdownTime.split(':').map(Number);
        
        // Create date in local timezone then convert to ISO string.
        // Note: Month is 0-indexed in JavaScript's Date constructor.
        const targetDateTime = new Date(year, month - 1, day, hours, minutes);

        if (isNaN(targetDateTime.getTime())) {
            toast({ title: 'Invalid Date/Time', description: 'The selected date or time is not valid.', variant: 'destructive' });
            return;
        }
        localStorage.setItem(UPDATE_TIMER_STORAGE_KEY, targetDateTime.toISOString());
        window.dispatchEvent(new StorageEvent('storage', { key: UPDATE_TIMER_STORAGE_KEY, newValue: targetDateTime.toISOString() }));
        toast({ title: 'Countdown Set!', description: `Timer set for ${targetDateTime.toLocaleString()}` });
    };

    const handleClearTimer = () => {
        localStorage.removeItem(UPDATE_TIMER_STORAGE_KEY);
        window.dispatchEvent(new StorageEvent('storage', { key: UPDATE_TIMER_STORAGE_KEY, newValue: null }));
        setCountdownDate('');
        setCountdownTime('');
        toast({ title: 'Countdown Cleared' });
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
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Trash2 /> General Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                        <p>Clear all app data</p>
                        <Button variant="destructive" onClick={handleClearLocalStorage}>Clear Local Storage</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Lock /> Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Label htmlFor="newPassword">New Password</Label>
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
                            className="absolute right-3 top-8 text-muted-foreground"
                        >
                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <div className="relative">
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
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
                            className="absolute right-3 top-8 text-muted-foreground"
                        >
                            {showConfirmNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <Button onClick={handleChangePassword} className="w-full">
                        Update Developer Password
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Timer /> Update Countdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div>
                        <Label htmlFor="countdownDate">Target Date</Label>
                        <Input
                            id="countdownDate"
                            type="date"
                            value={countdownDate}
                            onChange={(e) => setCountdownDate(e.target.value)}
                        />
                    </div>
                     <div>
                        <Label htmlFor="countdownTime">Target Time</Label>
                        <Input
                            id="countdownTime"
                            type="time"
                            value={countdownTime}
                            onChange={(e) => setCountdownTime(e.target.value)}
                        />
                    </div>
                     <div className="flex gap-2">
                        <Button onClick={handleSetTimer} className="w-full">Set Timer</Button>
                        <Button onClick={handleClearTimer} variant="destructive" className="w-full">Clear Timer</Button>
                    </div>
                </CardContent>
            </Card>

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

            <Button onClick={() => router.push('/')} variant="outline" className="mt-4">Back to App</Button>
        </div>
    );

    
