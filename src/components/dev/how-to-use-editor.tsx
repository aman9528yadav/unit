

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Save, FolderPlus, Palette } from 'lucide-react';
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
import { setHowToUseFeaturesInRtdb, listenToHowToUseFeaturesFromRtdb, HowToUseFeature, HowToUseCategory, CustomHowToUseCategory, listenToCustomHowToUseCategoriesFromRtdb, setCustomHowToUseCategoriesInRtdb } from '@/services/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import * as LucideIcons from 'lucide-react';


export function HowToUseEditor() {
    const [features, setFeatures] = useState<HowToUseFeature[] | null>(null);
    const [customCategories, setCustomCategories] = useState<CustomHowToUseCategory[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [editingFeature, setEditingFeature] = useState<HowToUseFeature | null>(null);
    
    // Feature state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('Zap');
    const [iconColor, setIconColor] = useState('');
    const [category, setCategory] = useState<HowToUseCategory | string>('gettingStarted');
    
    // New category state
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryId, setNewCategoryId] = useState('');

    const { toast } = useToast();
    const router = useRouter();
    
    useEffect(() => {
        setIsClient(true);
        const unsubscribeFeatures = listenToHowToUseFeaturesFromRtdb((featuresFromDb) => {
            setFeatures(featuresFromDb);
        });
         const unsubscribeCategories = listenToCustomHowToUseCategoriesFromRtdb((cats) => {
            setCustomCategories(cats || []);
        });
        return () => {
            unsubscribeFeatures();
            unsubscribeCategories();
        };
    }, []);

    const allCategories = useMemo(() => {
        const baseCategories: {id: HowToUseCategory | string; name: string}[] = [
            { id: 'gettingStarted', name: 'Getting Started' },
            { id: 'unitConverter', name: 'Unit Converter' },
            { id: 'calculator', name: 'Calculator' },
            { id: 'notepad', name: 'Notepad' },
            { id: 'customization', name: 'Customization & Settings' },
        ];
        const combined = [...baseCategories, ...customCategories.map(c => ({ id: c.id, name: c.name }))];
        return combined;
    }, [customCategories]);

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
            setIconColor(feature.iconColor || '');
            setCategory(feature.category);
        } else {
            setTitle('');
            setDescription('');
            setIcon('Zap');
            setIconColor('');
            setCategory('gettingStarted');
        }
        setIsDialogOpen(true);
    };

    const handleOpenCategoryDialog = () => {
        setNewCategoryId('');
        setNewCategoryName('');
        setIsCategoryDialogOpen(true);
    }
    
    const handleSaveItem = async () => {
        if (!title || !description || !icon || !category || !features) {
            toast({ title: "Incomplete Information", description: "Please fill out all fields.", variant: "destructive" });
            return;
        }

        let updatedFeatures;
        if (editingFeature) {
            updatedFeatures = features.map(f => f.id === editingFeature.id ? { ...f, title, description, icon, iconColor, category } : f);
        } else {
            const newFeature: HowToUseFeature = { id: uuidv4(), title, description, icon, iconColor, category };
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

    const handleSaveCategory = async () => {
        if (!newCategoryName || !newCategoryId) {
            toast({ title: "Incomplete Information", description: "Please fill out both ID and Name.", variant: "destructive" });
            return;
        }
        if (allCategories.some(c => c.id === newCategoryId || c.name === newCategoryName)) {
             toast({ title: "Category exists", description: "A category with this ID or name already exists.", variant: "destructive" });
             return;
        }
        const updatedCategories = [...customCategories, { id: newCategoryId, name: newCategoryName }];
        try {
            await setCustomHowToUseCategoriesInRtdb(updatedCategories);
            toast({ title: "Category Saved" });
            setIsCategoryDialogOpen(false);
        } catch (error) {
            toast({ title: "Error saving category", variant: "destructive" });
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
            const categoryKey = feature.category;
            (acc[categoryKey] = acc[categoryKey] || []).push(feature);
            return acc;
        }, {} as Record<string, HowToUseFeature[]>);
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
                    <Button size="icon" variant='outline' onClick={handleOpenCategoryDialog}>
                        <FolderPlus className='h-4 w-4'/>
                    </Button>
                    <Button size="icon" onClick={() => handleOpenDialog()}>
                        <Plus />
                    </Button>
                     <Button size="icon" variant="secondary" onClick={handleSaveAll}>
                        <Save />
                    </Button>
                 </div>
            </header>

            <div className="flex-grow space-y-2 overflow-y-auto">
                 <Accordion type="multiple" className="w-full" defaultValue={allCategories.map(c => c.id)}>
                    {allCategories.map(cat => (
                        <AccordionItem value={cat.id} key={cat.id}>
                             <AccordionTrigger className="font-semibold text-lg">{cat.name}</AccordionTrigger>
                             <AccordionContent>
                                <div className="space-y-2">
                                    {(groupedFeatures[cat.id] || []).map((feature) => (
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
                                    {(!groupedFeatures[cat.id] || groupedFeatures[cat.id].length === 0) && (
                                         <p className="text-sm text-muted-foreground text-center p-4">No features in this category.</p>
                                    )}
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
            
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>Add New Category</DialogTitle>
                        <DialogDescription>
                            Create a new section for the 'How to Use' page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cat-id" className="text-right">Category ID</Label>
                            <Input id="cat-id" value={newCategoryId} onChange={(e) => setNewCategoryId(e.target.value.replace(/\s+/g, '').toLowerCase())} className="col-span-3" placeholder="e.g., advancedFeatures"/>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="cat-name" className="text-right">Category Name</Label>
                            <Input id="cat-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="col-span-3" placeholder="e.g., Advanced Features"/>
                        </div>
                    </div>
                     <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" onClick={handleSaveCategory}>Save Category</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
                            <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} className="col-span-3" placeholder="e.g. Paperclip"/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="icon-color" className="text-right">Icon Color</Label>
                            <div className="col-span-3 flex items-center gap-2 border border-input rounded-md p-1">
                                <input
                                    type="color"
                                    id="icon-color"
                                    value={iconColor || '#000000'}
                                    onChange={(e) => setIconColor(e.target.value)}
                                    className="w-8 h-8 border-none cursor-pointer bg-transparent"
                                />
                                <Input 
                                    type="text"
                                    value={iconColor}
                                    onChange={(e) => setIconColor(e.target.value)}
                                    className="w-full h-8 border-none"
                                    placeholder="e.g. #f5f5f5"
                                />
                            </div>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">Category</Label>
                            <Select value={category} onValueChange={(value) => setCategory(value)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allCategories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
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
