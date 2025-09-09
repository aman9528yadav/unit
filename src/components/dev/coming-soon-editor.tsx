
"use client";

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Save, Sparkles } from 'lucide-react';
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
import { setComingSoonItemsInRtdb, listenToComingSoonItems, ComingSoonItem } from '@/services/firestore';
import { Switch } from '../ui/switch';
import * as LucideIcons from 'lucide-react';


export function ComingSoonEditor() {
    const [items, setItems] = useState<ComingSoonItem[] | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ComingSoonItem | null>(null);
    
    // Form state
    const [formState, setFormState] = useState<Omit<ComingSoonItem, 'id'>>({
        title: '',
        description: '',
        soon: false,
        icon: 'Sparkles',
    });

    const { toast } = useToast();
    const router = useRouter();
    
    useEffect(() => {
        setIsClient(true);
        const unsubscribe = listenToComingSoonItems((items) => {
            setItems(items);
        });
        return () => unsubscribe();
    }, []);
    
    const handleOpenDialog = (item: ComingSoonItem | null = null) => {
        setEditingItem(item);
        if (item) {
            setFormState(item);
        } else {
            setFormState({
                title: '',
                description: '',
                soon: false,
                icon: 'Sparkles',
            });
        }
        setIsDialogOpen(true);
    };
    
    const handleSaveItem = async () => {
        if (!formState.title || !items) {
            toast({ title: "Title is required.", variant: "destructive" });
            return;
        }

        let updatedList;
        if (editingItem) {
            updatedList = items.map(u => u.id === editingItem.id ? { ...formState, id: u.id } : u);
        } else {
            const newItem: ComingSoonItem = { ...formState, id: uuidv4() };
            updatedList = [...items, newItem];
        }
        
        try {
            await setComingSoonItemsInRtdb(updatedList);
            toast({ title: "Success", description: `Item ${editingItem ? 'updated' : 'added'}.`});
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Save Failed", variant: "destructive" });
        }
    };

    const handleDelete = (id: string) => {
        if (!items) return;
        if (window.confirm("Are you sure you want to delete this item?")) {
            const updatedList = items.filter(u => u.id !== id);
            setComingSoonItemsInRtdb(updatedList);
            toast({ title: "Item Deleted" });
        }
    };
    
    const handleInputChange = (field: keyof typeof formState, value: string | boolean) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    }

    if (!isClient || items === null) {
        return null;
    }

    return (
        <div className="w-full max-w-lg mx-auto flex flex-col gap-6 p-4 sm:p-6 h-screen">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-bold">Manage "Coming Soon"</h1>
                </div>
                 <div className='flex gap-2'>
                    <Button size="icon" onClick={() => handleOpenDialog()}>
                        <Plus />
                    </Button>
                 </div>
            </header>

            <div className="flex-grow space-y-2 overflow-y-auto">
                {items.map((item) => {
                    const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Sparkles;
                    return (
                        <div key={item.id} className="bg-card p-4 rounded-lg flex justify-between items-center">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <Icon className="w-6 h-6 text-primary flex-shrink-0" />
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-bold truncate">{item.title}</p>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                    {item.soon && <span className="text-xs text-yellow-600 font-semibold">SOON</span>}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(item)}>
                                    <Edit className="text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="text-destructive" />
                                </Button>
                            </div>
                        </div>
                    )
                })}
                {items.length === 0 && (
                    <div className="text-center text-muted-foreground mt-8 flex flex-col items-center gap-4 bg-card p-6 rounded-lg">
                        <p>No "Coming Soon" items found.</p>
                        <p>Click the '+' button to add one.</p>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={formState.title} onChange={(e) => handleInputChange('title', e.target.value)} placeholder="e.g., AI Smart Search"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={formState.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Describe the feature..."/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon Name</Label>
                            <Input id="icon" value={formState.icon} onChange={(e) => handleInputChange('icon', e.target.value)} placeholder="e.g., Search, Users, BrainCircuit"/>
                        </div>
                         <div className="flex items-center space-x-2">
                            <Switch id="soon-switch" checked={formState.soon} onCheckedChange={(checked) => handleInputChange('soon', checked)} />
                            <Label htmlFor="soon-switch">Show "Soon" Tag</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" onClick={handleSaveItem}>{editingItem ? 'Update Item' : 'Add Item'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
