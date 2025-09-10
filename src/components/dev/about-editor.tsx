

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Save, Trash2, Edit, Pencil, User, MessageSquare } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
    listenToAboutInfoFromRtdb, 
    setAboutInfoInRtdb, 
    type AppInfo, 
    type ReleasePlanItem,
    type OwnerInfo,
    listenToOwnerInfoFromRtdb,
    setOwnerInfoInRtdb,
    listenToWelcomeContent,
    setWelcomeContent,
    setBetaWelcomeMessage,
    listenToBetaWelcomeMessage,
    BetaWelcomeMessage,
    WelcomeContent,
    listenToAboutStatsFromRtdb,
    setAboutStatsInRtdb,
    AboutStats,
} from '@/services/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ProfilePhotoEditor } from '../profile-photo-editor';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Textarea } from '../ui/textarea';


export function AboutEditor() {
    const [appInfo, setAppInfo] = useState<AppInfo>({ version: '', build: '', releaseChannel: '', license: '' });
    const [releasePlan, setReleasePlan] = useState<ReleasePlanItem[]>([]);
    const [ownerInfo, setOwnerInfo] = useState<OwnerInfo>({ name: 'Aman Yadav', imageUrl: '' });
    const [welcomeContent, setWelcomeContentState] = useState<WelcomeContent>({ title: '', description: ''});
    const [betaWelcome, setBetaWelcome] = useState<BetaWelcomeMessage>({ title: '', description: '' });
    const [aboutStats, setAboutStats] = useState<AboutStats>({ happyUsers: '0', calculationsDone: '0' });

    const [isClient, setIsClient] = useState(false);
    const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
        const unsubscribeAbout = listenToAboutInfoFromRtdb((data) => {
            if (data) {
                setAppInfo(data.appInfo || { version: '', build: '', releaseChannel: '', license: '' });
                setReleasePlan(data.releasePlan || []);
            }
        });
         const unsubscribeOwner = listenToOwnerInfoFromRtdb((data) => {
            if (data) {
                setOwnerInfo(data);
            }
        });
         const unsubWelcomeContent = listenToWelcomeContent((content) => {
            if(content) setWelcomeContentState(content);
        });

        const unsubBetaWelcome = listenToBetaWelcomeMessage((content) => {
            if(content) setBetaWelcome(content);
        });
        
        const unsubAboutStats = listenToAboutStatsFromRtdb((stats) => {
            if(stats) setAboutStats(stats);
        });
        
        return () => {
            unsubscribeAbout();
            unsubscribeOwner();
            unsubWelcomeContent();
            unsubBetaWelcome();
            unsubAboutStats();
        };
    }, []);

    const handleAppInfoChange = (field: keyof AppInfo, value: string) => {
        setAppInfo(prev => ({ ...prev, [field]: value }));
    };
    
    const handleOwnerInfoChange = (field: keyof OwnerInfo, value: string) => {
        setOwnerInfo(prev => ({...prev, [field]: value}));
    }
    
    const handleAboutStatsChange = (field: keyof AboutStats, value: string) => {
        setAboutStats(prev => ({...prev, [field]: value}));
    }

    const handleReleasePlanChange = (id: string, field: keyof Omit<ReleasePlanItem, 'id'>, value: string) => {
        setReleasePlan(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleAddReleaseItem = () => {
        setReleasePlan(prev => [...prev, { id: uuidv4(), title: 'New Milestone', date: 'TBD', description: '' }]);
    };

    const handleDeleteReleaseItem = (id: string) => {
        setReleasePlan(prev => prev.filter(item => item.id !== id));
    };

    const handleSaveChanges = async () => {
        try {
            await setAboutInfoInRtdb({ appInfo, releasePlan });
            await setOwnerInfoInRtdb(ownerInfo);
            await setWelcomeContent(welcomeContent);
            await setBetaWelcomeMessage(betaWelcome);
            await setAboutStatsInRtdb(aboutStats);
            toast({ title: 'Success!', description: 'All content has been saved.' });
        } catch (error) {
            console.error("Failed to save content:", error);
            toast({ title: 'Error', description: 'Could not save changes.', variant: 'destructive' });
        }
    };
    
    const handleSavePhoto = (newImage: string | null) => {
        setOwnerInfo(prev => ({...prev, imageUrl: newImage || ''}));
        setIsPhotoEditorOpen(false);
        toast({ title: 'Photo Updated', description: "Click 'Save All' to apply the changes." });
    }

    if (!isClient) return null;
    
    if (isPhotoEditorOpen) {
        return (
            <ProfilePhotoEditor
                currentImage={ownerInfo.imageUrl}
                onSave={handleSavePhoto}
                onClose={() => setIsPhotoEditorOpen(false)}
            />
        );
    }

    return (
        <div className="w-full max-w-lg mx-auto flex flex-col gap-6 p-4 sm:p-6">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-bold">Edit Page Content</h1>
                </div>
                <Button onClick={handleSaveChanges}>
                    <Save className="mr-2 h-4 w-4" /> Save All
                </Button>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare /> Welcome Screen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="welcomeTitle">Welcome Title</Label>
                        <Input id="welcomeTitle" value={welcomeContent.title} onChange={(e) => setWelcomeContentState(p => ({...p, title: e.target.value}))} />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="welcomeDescription">Welcome Description</Label>
                        <Textarea id="welcomeDescription" value={welcomeContent.description} onChange={(e) => setWelcomeContentState(p => ({...p, description: e.target.value}))} />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare /> Beta Welcome Popup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="betaWelcomeTitle">Beta Welcome Title</Label>
                        <Input id="betaWelcomeTitle" value={betaWelcome.title} onChange={(e) => setBetaWelcome(p => ({...p, title: e.target.value}))} />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="betaWelcomeDescription">Beta Welcome Description</Label>
                        <Textarea id="betaWelcomeDescription" value={betaWelcome.description} onChange={(e) => setBetaWelcome(p => ({...p, description: e.target.value}))} />
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>About Page Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="happyUsers">Happy Users</Label>
                        <Input id="happyUsers" value={aboutStats.happyUsers} onChange={(e) => handleAboutStatsChange('happyUsers', e.target.value)} placeholder="e.g. 10,000+"/>
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="calculationsDone">Calculations Done</Label>
                        <Input id="calculationsDone" value={aboutStats.calculationsDone} onChange={(e) => handleAboutStatsChange('calculationsDone', e.target.value)} placeholder="e.g. 1M+"/>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Owner Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-1">
                        <Label htmlFor="ownerName">Owner Name</Label>
                        <Input id="ownerName" value={ownerInfo.name} onChange={(e) => handleOwnerInfoChange('name', e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label>Owner Photo</Label>
                        <div className="flex items-center gap-4">
                           <Avatar className="w-20 h-20">
                               <AvatarImage src={ownerInfo.imageUrl} alt={ownerInfo.name} />
                               <AvatarFallback><User /></AvatarFallback>
                           </Avatar>
                           <Button variant="outline" onClick={() => setIsPhotoEditorOpen(true)}>
                               <Pencil className="mr-2 h-4 w-4" /> Change Photo
                           </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>App Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label htmlFor="version">Version</Label>
                            <Input id="version" value={appInfo.version} onChange={(e) => handleAppInfoChange('version', e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="build">Build</Label>
                            <Input id="build" value={appInfo.build} onChange={(e) => handleAppInfoChange('build', e.target.value)} />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="releaseChannel">Release Channel</Label>
                            <Input id="releaseChannel" value={appInfo.releaseChannel} onChange={(e) => handleAppInfoChange('releaseChannel', e.target.value)} />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="license">License</Label>
                            <Input id="license" value={appInfo.license} onChange={(e) => handleAppInfoChange('license', e.target.value)} />
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Release Plan</CardTitle>
                        <Button size="sm" onClick={handleAddReleaseItem}><Plus className="mr-2 h-4 w-4"/> Add Item</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {releasePlan.map(item => (
                        <div key={item.id} className="flex flex-col gap-2 p-3 bg-secondary rounded-lg">
                            <div className="flex gap-2 items-end">
                                <div className="flex-grow space-y-1">
                                    <Label htmlFor={`title-${item.id}`}>Title</Label>
                                    <Input id={`title-${item.id}`} value={item.title} onChange={(e) => handleReleasePlanChange(item.id, 'title', e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`date-${item.id}`}>Date</Label>
                                    <Input id={`date-${item.id}`} value={item.date} onChange={(e) => handleReleasePlanChange(item.id, 'date', e.target.value)} placeholder="e.g., 15/07/2025" />
                                </div>
                                <Button variant="destructive" size="icon" onClick={() => handleDeleteReleaseItem(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor={`description-${item.id}`}>Description</Label>
                                <Textarea id={`description-${item.id}`} value={item.description} onChange={(e) => handleReleasePlanChange(item.id, 'description', e.target.value)} placeholder="Enter description text here..." />
                            </div>
                        </div>
                    ))}
                    {releasePlan.length === 0 && (
                        <p className="text-center text-muted-foreground">No release plan items yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
