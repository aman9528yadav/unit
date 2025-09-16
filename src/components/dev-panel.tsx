
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { ShieldAlert, Trash2, Code, KeyRound, Lock, Eye, EyeOff, Timer, NotebookText, FileText, ServerCog, Send, Wrench, Info, Shield, BellOff, Newspaper, User, MessageSquare, ArrowLeft, Crown, Plus, ToggleLeft, Flag, FileSymlink } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { setGlobalMaintenanceMode, listenToGlobalMaintenanceMode, setUpdateInfo, setNextUpdateInfo, listenToUpdateInfo, listenToNextUpdateInfo, setBroadcastNotification, listenToBroadcastNotification, deleteBroadcastNotification, listenToWelcomeContent, setWelcomeContent, setBetaWelcomeMessage, listenToBetaWelcomeMessage, listenToPremiumInfoContent, setPremiumInfoContent, PremiumInfoContent, PremiumTier, setFeatureLocks, listenToFeatureLocks, FeatureLocks, defaultPremiumInfo } from '@/services/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { intervalToDuration } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";
let DEFAULT_DEV_PASSWORD = "121312";

interface UserProfile {
    email: string;
    [key: string]: any;
}

export function DevPanel() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [showAuthPassword, setShowAuthPassword] = useState(false);

    // State for Maintenance Tab
    const [maintenanceDuration, setMaintenanceDuration] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [maintenanceText, setMaintenanceText] = useState('');
    const [maintenanceType, setMaintenanceType] = useState('Security');
    const [customMaintenanceTitle, setCustomMaintenanceTitle] = useState('');
    const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<'inprogress' | 'success' | 'failed'>('inprogress');
    const [successMessage, setSuccessMessage] = useState('');
    const [failureMessage, setFailureMessage] = useState('');
    const [maintenancePages, setMaintenancePages] = useState('');

    // State for Updates Tab
    const [updateDuration, setUpdateDuration] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [updateText, setUpdateText] = useState('');
    const [showUpdateOnDashboard, setShowUpdateOnDashboard] = useState(false);
    const [updateCategory, setUpdateCategory] = useState('New Feature');
    const [customUpdateCategoryTitle, setCustomUpdateCategoryTitle] = useState('');

    // State for Broadcast Tab
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationDescription, setNotificationDescription] = useState('');
    
    // State for Premium Info Tab
    const [premiumInfoContent, setPremiumInfoContent] = useState<PremiumInfoContent>(defaultPremiumInfo);

    // State for Security Tab
    const [currentDevPassword, setCurrentDevPassword] = useState('');
    const [newDevPassword, setNewDevPassword] = useState('');
    
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
        const savedDevPassword = localStorage.getItem('developerPassword');
        if (savedDevPassword) {
            DEFAULT_DEV_PASSWORD = savedDevPassword;
        }

    }, []);
    
     useEffect(() => {
        if (!isAuthenticated) return;
        
        const unsubMaintenanceMode = listenToGlobalMaintenanceMode(setIsMaintenanceMode);

        const unsubUpdateInfo = listenToUpdateInfo((info) => {
            setMaintenanceText(info.updateText || '');
            setMaintenanceType(info.maintenanceType || 'Security');
            setCustomMaintenanceTitle(info.customMaintenanceTitle || '');
            setUpdateStatus(info.updateStatus || 'inprogress');
            setSuccessMessage(info.successMessage || '');
            setFailureMessage(info.failureMessage || '');
            setMaintenancePages((info.maintenancePages || []).join(', '));
            if (info.targetDate) {
                const target = new Date(info.targetDate);
                const now = new Date();
                if (target > now) {
                    const duration = intervalToDuration({ start: now, end: target });
                    setMaintenanceDuration({
                        days: duration.days || 0,
                        hours: duration.hours || 0,
                        minutes: duration.minutes || 0,
                        seconds: duration.seconds || 0,
                    });
                } else {
                    setMaintenanceDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                }
            } else {
                 setMaintenanceDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        });

        const unsubNextUpdateInfo = listenToNextUpdateInfo((info) => {
            setUpdateText(info.updateText || '');
            setShowUpdateOnDashboard(info.showOnDashboard || false);
            setUpdateCategory(info.category || 'New Feature');
            setCustomUpdateCategoryTitle(info.customCategoryTitle || '');
            if (info.targetDate) {
                const target = new Date(info.targetDate);
                const now = new Date();
                 if (target > now) {
                    const duration = intervalToDuration({ start: now, end: target });
                    setUpdateDuration({
                        days: duration.days || 0,
                        hours: duration.hours || 0,
                        minutes: duration.minutes || 0,
                        seconds: duration.seconds || 0,
                    });
                } else {
                    setUpdateDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                }
            } else {
                setUpdateDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        });
        
        const unsubBroadcast = listenToBroadcastNotification((info) => {
            setNotificationTitle(info?.title || '');
            setNotificationDescription(info?.description || '');
        });
        
        const unsubPremiumInfo = listenToPremiumInfoContent((content) => {
            if (content) {
                setPremiumInfoContent(content);
            }
        });


        return () => {
            unsubMaintenanceMode();
            unsubUpdateInfo();
            unsubNextUpdateInfo();
            unsubBroadcast();
            unsubPremiumInfo();
        };
    }, [isAuthenticated]);
    
    const handlePasswordSubmit = () => {
        if (email.toLowerCase() !== DEVELOPER_EMAIL) {
            toast({ title: "Access Denied", description: "This email is not authorized for developer access.", variant: "destructive" });
            return;
        }
        if (password === DEFAULT_DEV_PASSWORD) {
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
    
    const handleMaintenanceDurationChange = (unit: keyof typeof maintenanceDuration, value: string) => {
        const numValue = parseInt(value, 10);
        setMaintenanceDuration(prev => ({ ...prev, [unit]: isNaN(numValue) ? 0 : numValue }));
    };

    const handleUpdateDurationChange = (unit: keyof typeof updateDuration, value: string) => {
        const numValue = parseInt(value, 10);
        setUpdateDuration(prev => ({ ...prev, [unit]: isNaN(numValue) ? 0 : numValue }));
    };

    const handleSetMaintenanceInfo = async () => {
        const now = new Date();
        const { days, hours, minutes, seconds } = maintenanceDuration;
        const totalMilliseconds = (days * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000;
        const targetDateTime = totalMilliseconds > 0 ? new Date(now.getTime() + totalMilliseconds) : null;
        
        try {
             await setUpdateInfo({ 
                targetDate: targetDateTime?.toISOString() ?? null, 
                updateText: maintenanceText, 
                maintenanceType,
                customMaintenanceTitle: maintenanceType === 'Custom' ? customMaintenanceTitle : '',
                updateStatus,
                successMessage,
                failureMessage,
                maintenancePages: maintenancePages.split(',').map(p => p.trim()).filter(Boolean)
            });
             toast({ title: 'Maintenance Info Saved' });
        } catch(e) {
            toast({ title: 'Error saving maintenance info', variant: 'destructive' });
        }
    };

     const handleSetUpdateInfo = async () => {
        const now = new Date();
        const { days, hours, minutes, seconds } = updateDuration;
        const totalMilliseconds = (days * 86400 + hours * 3600 + minutes * 60 + seconds) * 1000;
        const targetDateTime = totalMilliseconds > 0 ? new Date(now.getTime() + totalMilliseconds) : null;
        
        try {
             await setNextUpdateInfo({ 
                targetDate: targetDateTime?.toISOString() ?? null, 
                updateText: updateText,
                showOnDashboard: showUpdateOnDashboard,
                category: updateCategory,
                customCategoryTitle: updateCategory === 'Custom' ? customUpdateCategoryTitle : ''
            });
             toast({ title: 'Next Update Info Saved' });
        } catch(e) {
            toast({ title: 'Error saving next update info', variant: 'destructive' });
        }
    };

    const handleClearMaintenanceInfo = async () => {
        setMaintenanceDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setMaintenanceText('');
        setCustomMaintenanceTitle('');
        setMaintenanceType('Security');
        setUpdateStatus('inprogress');
        setSuccessMessage('');
        setFailureMessage('');
        setMaintenancePages('');
        await setUpdateInfo({ 
            targetDate: null, 
            updateText: '', 
            maintenanceType: 'Security', 
            customMaintenanceTitle: '',
            updateStatus: 'inprogress',
            successMessage: 'The update was successful! We will be back online shortly.',
            failureMessage: 'The update failed. Please try again later.',
            maintenancePages: []
        });
        toast({ title: 'Maintenance Info Cleared' });
    }

    const handleClearUpdateInfo = async () => {
        setUpdateDuration({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setUpdateText('');
        setShowUpdateOnDashboard(false);
        setUpdateCategory('New Feature');
        setCustomUpdateCategoryTitle('');
        await setNextUpdateInfo({ targetDate: null, updateText: '', showOnDashboard: false, category: 'New Feature', customCategoryTitle: '' });
        toast({ title: 'Next Update Info Cleared' });
    }

    const handleSendNotification = async () => {
        if (!notificationTitle || !notificationDescription) {
            toast({ title: "Incomplete", description: "Please fill out both title and description.", variant: "destructive" });
            return;
        }
        
        try {
            await setBroadcastNotification({ 
                title: notificationTitle, 
                description: notificationDescription,
                icon: 'info', 
                createdAt: new Date().toISOString()
            });
            toast({ title: "Notification Updated!", description: "The broadcast has been updated for all users." });
        } catch (error) {
            console.error("Failed to send notification:", error);
            toast({ title: "Broadcast Failed", description: "Could not update notification. Check console for errors.", variant: "destructive" });
        }
    };
    
    const handlePremiumInfoChange = (field: keyof PremiumInfoContent, value: string) => {
        setPremiumInfoContent(prev => ({...prev, [field]: value}));
    };
    
    const handleTierChange = (tier: 'memberTier' | 'premiumTier', field: keyof PremiumTier, value: string | string[]) => {
         setPremiumInfoContent(prev => ({
            ...prev,
            [tier]: {
                ...prev[tier],
                [field]: value
            }
        }));
    };

    const handleFeatureChange = (tier: 'memberTier' | 'premiumTier', index: number, value: string) => {
        const newFeatures = [...premiumInfoContent[tier].features];
        newFeatures[index] = value;
        handleTierChange(tier, 'features', newFeatures);
    };

    const addFeature = (tier: 'memberTier' | 'premiumTier') => {
        handleTierChange(tier, 'features', [...premiumInfoContent[tier].features, 'New Feature']);
    };
    
    const removeFeature = (tier: 'memberTier' | 'premiumTier', index: number) => {
        const newFeatures = premiumInfoContent[tier].features.filter((_, i) => i !== index);
        handleTierChange(tier, 'features', newFeatures);
    };
    
    const handleSavePremiumInfo = async () => {
        try {
            await setPremiumInfoContent(premiumInfoContent);
            toast({ title: "Premium Info Saved" });
        } catch (error) {
            toast({ title: "Error saving premium info", variant: "destructive" });
        }
    };


    const handleDeleteBroadcast = async () => {
        try {
            await deleteBroadcastNotification();
            setNotificationTitle('');
            setNotificationDescription('');
            toast({ title: "Broadcast Deleted", description: "The global notification has been removed." });
        } catch (error) {
             toast({ title: "Deletion Failed", description: "Could not delete broadcast.", variant: "destructive" });
        }
    };
    
     const handleMaintenanceModeToggle = async (enabled: boolean) => {
        try {
            await setGlobalMaintenanceMode(enabled);
            toast({
                title: `Maintenance Mode ${enabled ? 'Enabled' : 'Disabled'}`,
                description: enabled ? "App is now in maintenance mode for all users." : "App is now live for all users.",
            });
        } catch (error) {
            console.error("Failed to toggle maintenance mode:", error);
            toast({ title: "Update Failed", description: "Could not change maintenance mode status.", variant: "destructive" });
        }
    };
    
    const handleDevPasswordChange = () => {
        if (!currentDevPassword || !newDevPassword) {
            toast({ title: "Error", description: "Please fill both password fields.", variant: "destructive" });
            return;
        }
        if (currentDevPassword !== DEFAULT_DEV_PASSWORD) {
            toast({ title: "Incorrect Password", description: "The current password is wrong.", variant: "destructive" });
            return;
        }
        localStorage.setItem('developerPassword', newDevPassword);
        DEFAULT_DEV_PASSWORD = newDevPassword;
        setCurrentDevPassword('');
        setNewDevPassword('');
        toast({ title: "Success", description: "Developer password has been updated." });
    };

    if (!isClient) {
        return null;
    }
    
    if (!isAuthenticated) {
         return (
            <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center text-center gap-4 h-screen">
                <KeyRound className="w-16 h-16 text-primary" />
                <h1 className="text-2xl font-bold">Developer Access</h1>
                <p className="text-muted-foreground">This page is restricted. Please enter the owner's credentials to continue.</p>
                <div className="w-full space-y-4 text-left">
                     <div className="relative">
                        <Label htmlFor="email">Owner Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter owner email" 
                            className="pr-10"
                        />
                    </div>
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
                 <Button onClick={() => router.back()} variant="outline" className="mt-4">Back to App</Button>
            </div>
        );
    }
    

    return (
        <div className="w-full max-w-lg mx-auto flex flex-col gap-6 p-4">
            <header className="flex items-center gap-4">
                 <Button variant="secondary" className="rounded-xl shadow-md" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                 </Button>
                <div>
                    <h1 className="text-2xl font-bold">Developer Panel</h1>
                    <p className="text-muted-foreground">Tools for testing and debugging.</p>
                </div>
            </header>
            
            <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="maintenance">
                    <AccordionTrigger className="p-4 bg-card rounded-lg border">
                        <div className='flex items-center gap-4'>
                            <Timer />
                            <div>
                               <p className="font-semibold text-base text-left">Maintenance Mode</p>
                               <p className="text-sm text-muted-foreground text-left">Control app-wide maintenance state.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-card border-t-0 rounded-b-lg border">
                        <div className="space-y-4">
                             <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                                <div>
                                    <Label htmlFor="maintenance-mode">Enable Global Maintenance</Label>
                                    <p className='text-xs text-muted-foreground'>Redirects all users to the maintenance site.</p>
                                </div>
                                <Switch
                                    id="maintenance-mode"
                                    checked={isMaintenanceMode}
                                    onCheckedChange={handleMaintenanceModeToggle}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maintenancePages">Individual Pages in Maintenance</Label>
                                <Textarea 
                                    id="maintenancePages"
                                    value={maintenancePages}
                                    onChange={(e) => setMaintenancePages(e.target.value)}
                                    placeholder="e.g., /notes, /calculator"
                                    rows={2}
                                />
                                <p className="text-xs text-muted-foreground">Enter page paths separated by commas. These pages will be in maintenance even if global mode is off.</p>
                            </div>
                            <div>
                                <Label>Set Countdown Duration</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="days-m" className="text-xs">Days</Label>
                                        <Input id="days-m" type="number" value={maintenanceDuration.days} onChange={(e) => handleMaintenanceDurationChange('days', e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <Label htmlFor="hours-m" className="text-xs">Hours</Label>
                                        <Input id="hours-m" type="number" value={maintenanceDuration.hours} onChange={(e) => handleMaintenanceDurationChange('hours', e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <Label htmlFor="minutes-m" className="text-xs">Minutes</Label>
                                        <Input id="minutes-m" type="number" value={maintenanceDuration.minutes} onChange={(e) => handleMaintenanceDurationChange('minutes', e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <Label htmlFor="seconds-m" className="text-xs">Seconds</Label>
                                        <Input id="seconds-m" type="number" value={maintenanceDuration.seconds} onChange={(e) => handleMaintenanceDurationChange('seconds', e.target.value)} placeholder="0" />
                                    </div>
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="maintenanceText" className="flex items-center gap-2"><NotebookText /> Maintenance Details</Label>
                                <Textarea 
                                    id="maintenanceText"
                                    value={maintenanceText}
                                    onChange={(e) => setMaintenanceText(e.target.value)}
                                    placeholder="Describe what's happening during maintenance..."
                                    rows={3}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="maintenanceType" className="flex items-center gap-2"><Wrench /> Maintenance Type</Label>
                                <Select value={maintenanceType} onValueChange={setMaintenanceType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Security">Security</SelectItem>
                                        <SelectItem value="Feature Update">Feature Update</SelectItem>
                                        <SelectItem value="Bug Fixes">Bug Fixes</SelectItem>
                                        <SelectItem value="Performance">Performance</SelectItem>
                                        <SelectItem value="Custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {maintenanceType === 'Custom' && (
                                <div className="space-y-2">
                                    <Label htmlFor="customMaintenanceTitle" className="flex items-center gap-2"><Info /> Custom Title</Label>
                                    <Input 
                                        id="customMaintenanceTitle"
                                        value={customMaintenanceTitle}
                                        onChange={(e) => setCustomMaintenanceTitle(e.target.value)}
                                        placeholder="e.g., Database Migration"
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="updateStatus" className="flex items-center gap-2"><Info /> Post-Update Status</Label>
                                <Select value={updateStatus} onValueChange={(v) => setUpdateStatus(v as any)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inprogress">In Progress</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="successMessage">Success Message</Label>
                                <Input id="successMessage" value={successMessage} onChange={(e) => setSuccessMessage(e.target.value)} placeholder="e.g., Update successful!" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="failureMessage">Failure Message</Label>
                                <Input id="failureMessage" value={failureMessage} onChange={(e) => setFailureMessage(e.target.value)} placeholder="e.g., Update failed." />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleClearMaintenanceInfo} className="w-full">Clear</Button>
                                <Button onClick={handleSetMaintenanceInfo} className="w-full">Save</Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="dashboard-banner">
                    <AccordionTrigger className="p-4 bg-card rounded-lg border">
                         <div className='flex items-center gap-4'>
                            <ServerCog />
                            <div>
                               <p className="font-semibold text-base text-left">Dashboard Banner</p>
                               <p className="text-sm text-muted-foreground text-left">Manage the upcoming update banner.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-card border-t-0 rounded-b-lg border">
                         <div className="space-y-4">
                            <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                                <div>
                                    <Label htmlFor="show-update-banner">Show Update Banner on Dashboard</Label>
                                    <p className='text-xs text-muted-foreground'>Toggles the countdown banner for all users.</p>
                                </div>
                                <Switch
                                    id="show-update-banner"
                                    checked={showUpdateOnDashboard}
                                    onCheckedChange={setShowUpdateOnDashboard}
                                />
                            </div>
                            <div>
                                <Label>Set Countdown Duration</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="days-u" className="text-xs">Days</Label>
                                        <Input id="days-u" type="number" value={updateDuration.days} onChange={(e) => handleUpdateDurationChange('days', e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <Label htmlFor="hours-u" className="text-xs">Hours</Label>
                                        <Input id="hours-u" type="number" value={updateDuration.hours} onChange={(e) => handleUpdateDurationChange('hours', e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <Label htmlFor="minutes-u" className="text-xs">Minutes</Label>
                                        <Input id="minutes-u" type="number" value={updateDuration.minutes} onChange={(e) => handleUpdateDurationChange('minutes', e.target.value)} placeholder="0" />
                                    </div>
                                    <div>
                                        <Label htmlFor="seconds-u" className="text-xs">Seconds</Label>
                                        <Input id="seconds-u" type="number" value={updateDuration.seconds} onChange={(e) => handleUpdateDurationChange('seconds', e.target.value)} placeholder="0" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="updateCategory" className="flex items-center gap-2"><Wrench /> Banner Category</Label>
                                <Select value={updateCategory} onValueChange={setUpdateCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="New Feature">New Feature</SelectItem>
                                        <SelectItem value="Bug Fix">Bug Fix</SelectItem>
                                        <SelectItem value="Face Issue">Face Issue</SelectItem>
                                        <SelectItem value="Security">Security</SelectItem>
                                        <SelectItem value="Custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {updateCategory === 'Custom' && (
                                <div className="space-y-2">
                                    <Label htmlFor="customUpdateCategoryTitle" className="flex items-center gap-2"><Info /> Custom Title</Label>
                                    <Input
                                        id="customUpdateCategoryTitle"
                                        value={customUpdateCategoryTitle}
                                        onChange={(e) => setCustomUpdateCategoryTitle(e.target.value)}
                                        placeholder="e.g., Performance Boost"
                                    />
                                </div>
                            )}
                             <div className="space-y-2">
                                <Label htmlFor="updateText" className="flex items-center gap-2"><NotebookText /> Upcoming Feature Details</Label>
                                <Textarea 
                                    id="updateText"
                                    value={updateText}
                                    onChange={(e) => setUpdateText(e.target.value)}
                                    placeholder="Describe what's coming in the next update..."
                                    rows={3}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handleClearUpdateInfo} className="w-full">Clear</Button>
                                <Button onClick={handleSetUpdateInfo} className="w-full">Save</Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="notification">
                    <AccordionTrigger className="p-4 bg-card rounded-lg border">
                         <div className='flex items-center gap-4'>
                            <Send />
                            <div>
                               <p className="font-semibold text-base text-left">Global Notification</p>
                               <p className="text-sm text-muted-foreground text-left">Update the broadcast message for all users.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-card border-t-0 rounded-b-lg border">
                         <div className="space-y-4">
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
                            <div className="flex gap-2">
                                <Button onClick={handleSendNotification} className="w-full">
                                    Update Notification
                                </Button>
                                <Button onClick={handleDeleteBroadcast} variant="destructive" size="icon" className="flex-shrink-0">
                                    <BellOff/>
                                </Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                
                 <AccordionItem value="content">
                    <AccordionTrigger className="p-4 bg-card rounded-lg border">
                        <div className='flex items-center gap-4'>
                            <MessageSquare />
                            <div>
                               <p className="font-semibold text-base text-left">Content Management</p>
                               <p className="text-sm text-muted-foreground text-left">Edit dynamic text and content for various pages.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-card border-t-0 rounded-b-lg border">
                         <div className="space-y-2">
                            <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                                <Label>Getting Started & About Pages</Label>
                                <Button onClick={() => router.push('/dev/about')}>Manage</Button>
                            </div>
                             <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                                <Label>Coming Soon Cards</Label>
                                <Button onClick={() => router.push('/dev/coming-soon-editor')}>Manage</Button>
                            </div>
                            <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                                <Label>Help & How-to-Use Pages</Label>
                                <Button onClick={() => router.push('/dev/how-to-use')}>Manage</Button>
                            </div>
                             <div className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                                <Label>Updates Page</Label>
                                <Button onClick={() => router.push('/dev/updates')}>Manage</Button>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="premium-content">
                    <AccordionTrigger className="p-4 bg-card rounded-lg border">
                        <div className='flex items-center gap-4'>
                            <Crown />
                            <div>
                               <p className="font-semibold text-base text-left">Premium Info Content</p>
                               <p className="text-sm text-muted-foreground text-left">Edit the content of the premium dialog.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-card border-t-0 rounded-b-lg border space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="premium-title">Dialog Title</Label>
                            <Input id="premium-title" value={premiumInfoContent.title} onChange={(e) => handlePremiumInfoChange('title', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="premium-description">Description</Label>
                            <Textarea id="premium-description" value={premiumInfoContent.description} onChange={(e) => handlePremiumInfoChange('description', e.target.value)} />
                        </div>
                        
                        <div className="space-y-2 p-3 bg-secondary rounded-lg">
                            <Label htmlFor="member-title">Member Tier Title</Label>
                            <Input id="member-title" value={premiumInfoContent.memberTier.title} onChange={(e) => handleTierChange('memberTier', 'title', e.target.value)} />
                             <Label>Member Features</Label>
                             {premiumInfoContent.memberTier.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input value={feature} onChange={(e) => handleFeatureChange('memberTier', index, e.target.value)} />
                                    <Button size="icon" variant="ghost" onClick={() => removeFeature('memberTier', index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                </div>
                             ))}
                             <Button size="sm" variant="outline" onClick={() => addFeature('memberTier')}><Plus className="w-4 h-4 mr-2"/> Add Feature</Button>
                        </div>
                        
                         <div className="space-y-2 p-3 bg-secondary rounded-lg">
                            <Label htmlFor="premium-tier-title">Premium Tier Title</Label>
                            <Input id="premium-tier-title" value={premiumInfoContent.premiumTier.title} onChange={(e) => handleTierChange('premiumTier', 'title', e.target.value)} />
                            <Label>Premium Features</Label>
                             {premiumInfoContent.premiumTier.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input value={feature} onChange={(e) => handleFeatureChange('premiumTier', index, e.target.value)} />
                                    <Button size="icon" variant="ghost" onClick={() => removeFeature('premiumTier', index)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                                </div>
                             ))}
                            <Button size="sm" variant="outline" onClick={() => addFeature('premiumTier')}><Plus className="w-4 h-4 mr-2"/> Add Feature</Button>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="how-to-upgrade">"How to Upgrade" Text</Label>
                            <Textarea id="how-to-upgrade" value={premiumInfoContent.howToUpgrade} onChange={(e) => handlePremiumInfoChange('howToUpgrade', e.target.value)} />
                        </div>
                        
                        <Button onClick={handleSavePremiumInfo} className="w-full">Save Premium Info</Button>
                    </AccordionContent>
                </AccordionItem>


                 <AccordionItem value="security">
                    <AccordionTrigger className="p-4 bg-card rounded-lg border">
                        <div className='flex items-center gap-4'>
                            <Shield />
                            <div>
                               <p className="font-semibold text-base text-left">Security & Data</p>
                               <p className="text-sm text-muted-foreground text-left">Manage developer access and clear local data.</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-card border-t-0 rounded-b-lg border">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="currentDevPassword">Current Dev Password</Label>
                                <Input 
                                    id="currentDevPassword" 
                                    type="password"
                                    value={currentDevPassword}
                                    onChange={(e) => setCurrentDevPassword(e.target.value)}
                                    placeholder="Enter current password" 
                                />
                            </div>
                             <div>
                                <Label htmlFor="newDevPassword">New Dev Password</Label>
                                <Input 
                                    id="newDevPassword"
                                    type="password"
                                    value={newDevPassword}
                                    onChange={(e) => setNewDevPassword(e.target.value)}
                                    placeholder="Enter new password"
                                />
                            </div>
                            <Button onClick={handleDevPasswordChange} className="w-full">
                                Change Dev Password
                            </Button>
                             <Button onClick={handleClearLocalStorage} variant="destructive" className="w-full">
                                <Trash2 className="mr-2 h-4 w-4"/> Clear All Local Storage
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}

    