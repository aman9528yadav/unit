
"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Save, Palette, Calendar as CalendarIcon, Beaker, Bug, Rocket, Shield, AlertTriangle } from 'lucide-react';
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
import { setUpdatesInRtdb, listenToUpdatesFromRtdb, UpdateItem } from '@/services/firestore';
import * as LucideIcons from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { format, parseISO } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

const iconNames = Object.keys(LucideIcons).filter(key => typeof (LucideIcons as any)[key] === 'object');


export function UpdatesEditor() {
    const [updates, setUpdates] = useState<UpdateItem[] | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<UpdateItem | null>(null);
    
    // Form state
    const [formState, setFormState] = useState<Omit<UpdateItem, 'id'>>({
        version: '',
        date: new Date().toISOString(),
        title: '',
        description: '',
        icon: 'Rocket',
        bgColor: '',
        textColor: '',
        category: 'New Feature',
        customCategoryTitle: '',
    });

    const { toast } = useToast();
    const router = useRouter();
    
    useEffect(() => {
        setIsClient(true);
        const unsubscribe = listenToUpdatesFromRtdb((updatesFromDb) => {
            setUpdates(updatesFromDb);
        });
        return () => unsubscribe();
    }, []);

    const handleSaveAll = async () => {
        if (!updates) return;
        try {
            await setUpdatesInRtdb(updates);
            toast({ title: "Updates Saved!", description: "All changes have been saved to the database." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save updates.", variant: "destructive" });
        }
    };
    
    const handleOpenDialog = (update: UpdateItem | null = null) => {
        setEditingUpdate(update);
        if (update) {
            setFormState(update);
        } else {
            setFormState({
                version: '',
                date: new Date().toISOString(),
                title: '',
                description: '',
                icon: 'Rocket',
                bgColor: '#fecaca', // A default bg color
                textColor: '#991b1b', // A default text color
                category: 'New Feature',
                customCategoryTitle: '',
            });
        }
        setIsDialogOpen(true);
    };
    
    const handleSaveItem = async () => {
        if (!formState.title || !formState.version || !updates) {
            toast({ title: "Incomplete Information", description: "Please fill out at least title and version.", variant: "destructive" });
            return;
        }

        let updatedList;
        if (editingUpdate) {
            updatedList = updates.map(u => u.id === editingUpdate.id ? { ...formState, id: u.id } : u);
        } else {
            const newItem: UpdateItem = { ...formState, id: uuidv4() };
            updatedList = [...updates, newItem];
        }
        
        try {
            await setUpdatesInRtdb(updatedList);
            toast({ title: "Success", description: `Update item ${editingUpdate ? 'updated' : 'added'}.`});
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Save Failed", description: "Could not save the update item to the database.", variant: "destructive" });
        }
    };

    const handleDelete = (id: string) => {
        if (!updates) return;
        if (window.confirm("Are you sure you want to delete this update item?")) {
            const updatedList = updates.filter(u => u.id !== id);
            setUpdatesInRtdb(updatedList);
            toast({ title: "Update Deleted", description: "The update item has been removed." });
        }
    };
    
    const handleInputChange = (field: keyof typeof formState, value: string) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    }

    if (!isClient || updates === null) {
        return null;
    }

    return (
        <div className="w-full max-w-lg mx-auto flex flex-col gap-6 p-4 sm:p-6 h-screen">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-bold">Manage Updates</h1>
                </div>
                 <div className='flex gap-2'>
                    <Button size="icon" onClick={() => handleOpenDialog()}>
                        <Plus />
                    </Button>
                 </div>
            </header>

            <div className="flex-grow space-y-2 overflow-y-auto">
                {updates.map((update) => (
                    <div key={update.id} className="bg-card p-4 rounded-lg flex justify-between items-center">
                        <div className="flex-1 overflow-hidden">
                            <p className="font-bold truncate">{update.title}</p>
                            <p className="text-sm text-muted-foreground">{update.version} - {format(parseISO(update.date), "PPP")}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(update)}>
                                <Edit className="text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(update.id)}>
                                <Trash2 className="text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}
                {updates.length === 0 && (
                    <div className="text-center text-muted-foreground mt-8 flex flex-col items-center gap-4 bg-card p-6 rounded-lg">
                        <p>No update items found.</p>
                        <p>Click the '+' button to add one.</p>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingUpdate ? 'Edit Update' : 'Add New Update'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="version">Version</Label>
                            <Input id="version" value={formState.version} onChange={(e) => handleInputChange('version', e.target.value)} placeholder="e.g., v2.5.0"/>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formState.date ? format(parseISO(formState.date), "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent>
                                    <Calendar
                                        mode="single"
                                        selected={parseISO(formState.date)}
                                        onSelect={(d) => d && handleInputChange('date', d.toISOString())}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={formState.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="e.g., New Feature Added"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={formState.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe the update..."/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                             <Select value={formState.category} onValueChange={(v) => handleInputChange('category', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="New Feature"><Rocket className="mr-2 h-4 w-4" /> New Feature</SelectItem>
                                    <SelectItem value="Bug Fix"><Bug className="mr-2 h-4 w-4" /> Bug Fix</SelectItem>
                                    <SelectItem value="Face Issue"><AlertTriangle className="mr-2 h-4 w-4" /> Face Issue</SelectItem>
                                    <SelectItem value="Security"><Shield className="mr-2 h-4 w-4" /> Security</SelectItem>
                                    <SelectItem value="Custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {formState.category === 'Custom' && (
                            <div className="space-y-2">
                                <Label htmlFor="customCategoryTitle">Custom Category Title</Label>
                                <Input id="customCategoryTitle" value={formState.customCategoryTitle} onChange={(e) => handleInputChange('customCategoryTitle', e.target.value)} placeholder="e.g., Performance Boost"/>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon Name</Label>
                            <Input id="icon" value={formState.icon} onChange={(e) => handleInputChange('icon', e.target.value)} placeholder="e.g., Rocket"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bgColor">Icon Background Color</Label>
                            <Input id="bgColor" type="color" value={formState.bgColor} onChange={(e) => handleInputChange('bgColor', e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="textColor">Icon Text Color</Label>
                            <Input id="textColor" type="color" value={formState.textColor} onChange={(e) => handleInputChange('textColor', e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" onClick={handleSaveItem}>{editingUpdate ? 'Update Item' : 'Add Item'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
