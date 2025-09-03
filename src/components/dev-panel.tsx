
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldAlert, Trash2, BellRing, Code, KeyRound } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';

const DEVELOPER_EMAIL = "aman@example.com"; // Hardcoded developer email
const DEV_PASSWORD = "password123"; // Hardcoded developer password

interface UserProfile {
    email: string;
    [key: string]: any;
}

export function DevPanel() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
            setProfile(parsedProfile);
            if (parsedProfile.email === DEVELOPER_EMAIL) {
                setIsAuthorized(true);
            }
        }
    }, []);
    
    const handlePasswordSubmit = () => {
        if (password === DEV_PASSWORD) {
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
    
    const handleTriggerToast = () => {
        toast({ title: "Test Notification", description: "This is a test toast from the dev panel." });
    }

    if (!isClient) {
        return null; // or a loading skeleton
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
                     <div>
                        <Label htmlFor="password">Password</Label>
                        <Input 
                            id="password" 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                            placeholder="Enter developer password" 
                        />
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
                    <CardTitle className="flex items-center gap-2"><Trash2 /> Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                        <p>Clear all app data</p>
                        <Button variant="destructive" onClick={handleClearLocalStorage}>Clear Local Storage</Button>
                    </div>
                     <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                        <p>Send a test notification</p>
                        <Button variant="secondary" onClick={handleTriggerToast}>Trigger Toast</Button>
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
}
