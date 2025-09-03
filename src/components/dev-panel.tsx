
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ShieldAlert, Trash2, BellRing, Code } from 'lucide-react';

const DEVELOPER_EMAIL = "aman@example.com"; // Hardcoded developer email

interface UserProfile {
    email: string;
    [key: string]: any;
}

export function DevPanel() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
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
    
    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6">
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
