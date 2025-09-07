

"use client";

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { setHowToUseFeaturesInRtdb, listenToHowToUseFeaturesFromRtdb, HowToUseFeature, defaultFeatures, HowToUseCategory } from '@/services/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';


const categoryNames: Record<HowToUseCategory, string> = {
    gettingStarted: 'Getting Started',
    unitConverter: 'Unit Converter',
    calculator: 'Calculator',
    notepad: 'Notepad',
    customization: 'Customization & Settings',
};

export function HowToUseEditor() {
    const [features, setFeatures] = useState<HowToUseFeature[] | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState<HowToUseFeature | null>(null);
    
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('Zap'); // Default icon
    const [category, setCategory] = useState<HowToUseCategory>('gettingStarted');
    const { toast } = useToast();
    const router = useRouter();
    
    useEffect(() => {
        setIsClient(true);
        const unsubscribe = listenToHowToUseFeaturesFromRtdb((featuresFromDb) => {
            setFeatures(featuresFromDb);
        });
        return () => unsubscribe();
    }, []);

    const handleSaveAll = async () => {
        if (!features) return;
        try {
            await setHowToUseFeaturesInRtdb(features);
            toast({ title: "Features Saved!", description: "All changes have been saved to the database." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save features.", variant: "destructive" });
        }
    };
    
    const handleOpenDialog = (feature: HowToUseFeature | null = null) => {
        setEditingFeature(feature);
        if (feature) {
            setTitle(feature.title);
            setDescription(feature.description);
            setIcon(feature.icon);
            setCategory(feature.category);
        } else {
            setTitle('');
            setDescription('');
            setIcon('Zap');
            setCategory('gettingStarted');
        }
        setIsDialogOpen(true);
    };
    
    const handleSaveItem = async () => {
        if (!title || !description || !icon || !category || !features) {
            toast({ title: "Incomplete Information", description: "Please fill out all fields.", variant: "destructive" });
            return;
        }

        let updatedFeatures;
        if (editingFeature) {
            updatedFeatures = features.map(f => f.id === editingFeature.id ? { ...f, title, description, icon, category } : f);
        } else {
            const newFeature: HowToUseFeature = { id: uuidv4(), title, description, icon, category };
            updatedFeatures = [...features, newFeature];
        }
        
        try {
            await setHowToUseFeaturesInRtdb(updatedFeatures);
            toast({ title: "Success", description: `Feature ${editingFeature ? 'updated' : 'added'}.`});
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Save Failed", description: "Could not save the feature to the database.", variant: "destructive" });
        }
    };

    const handleDelete = (featureId: string) => {
        if (!features) return;
        if (window.confirm("Are you sure you want to delete this feature?")) {
            const updatedFeatures = features.filter(f => f.id !== featureId);
            setHowToUseFeaturesInRtdb(updatedFeatures);
            toast({ title: "Feature Deleted", description: "The feature has been removed." });
        }
    };
    
    const groupedFeatures = useMemo(() => {
        if (!features) return {};
        return features.reduce((acc, feature) => {
            (acc[feature.category] = acc[feature.category] || []).push(feature);
            return acc;
        }, {} as Record<HowToUseCategory, HowToUseFeature[]>);
    }, [features]);

    if (!isClient || features === null) {
        return null;
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6 h-screen">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-bold">Manage 'How to Use'</h1>
                </div>
                 <div className='flex gap-2'>
                    <Button size="icon" onClick={() => handleOpenDialog()}>
                        <Plus />
                    </Button>
                     <Button size="icon" variant="secondary" onClick={handleSaveAll}>
                        <Save />
                    </Button>
                 </div>
            </header>

            <div className="flex-grow space-y-2">
                 <Accordion type="multiple" className="w-full" defaultValue={Object.keys(categoryNames)}>
                    {Object.entries(groupedFeatures).map(([cat, featuresInCategory]) => (
                        <AccordionItem value={cat} key={cat}>
                             <AccordionTrigger className="font-semibold text-lg">{categoryNames[cat as HowToUseCategory]}</AccordionTrigger>
                             <AccordionContent>
                                <div className="space-y-2">
                                    {featuresInCategory.map((feature) => (
                                         <div key={feature.id} className="bg-card p-4 rounded-lg flex justify-between items-center">
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-bold truncate">{feature.title}</p>
                                                <p className="text-sm text-muted-foreground line-clamp-1">{feature.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(feature)}>
                                                    <Edit className="text-muted-foreground" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(feature.id)}>
                                                    <Trash2 className="text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                 </Accordion>
                {features.length === 0 && (
                    <div className="text-center text-muted-foreground mt-8 flex flex-col items-center gap-4 bg-card p-6 rounded-lg">
                        <p>No features found.</p>
                        <p>Click the '+' button to add one.</p>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFeature ? 'Edit Feature' : 'Add New Feature'}</DialogTitle>
                        <DialogDescription>
                            {editingFeature ? 'Update the details for this feature.' : 'Create a new feature for the How-to-Use page.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right mt-2">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" rows={4} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="icon" className="text-right">Icon</Label>
                            <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} className="col-span-3" placeholder="Lucide icon name, e.g., Zap"/>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <Select value={category} onValueChange={(value) => setCategory(value as HowToUseCategory)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(categoryNames).map(([key, name]) => (
                                        <SelectItem key={key} value={key}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" onClick={handleSaveItem}>{editingFeature ? 'Update Item' : 'Add Item'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
