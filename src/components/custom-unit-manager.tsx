
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { conversionCategories } from '@/lib/conversions';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

const CUSTOM_UNITS_STORAGE_KEY = 'customUnits';

export interface CustomUnit {
    id: string;
    name: string;
    symbol: string;
    category: string;
    factor: number;
}

export function CustomUnitManager() {
    const [units, setUnits] = useState<CustomUnit[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newUnit, setNewUnit] = useState({ name: '', symbol: '', category: '', factor: 1 });
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
        const savedUnits = localStorage.getItem(CUSTOM_UNITS_STORAGE_KEY);
        if (savedUnits) {
            setUnits(JSON.parse(savedUnits));
        }
    }, []);

    const updateStoredUnits = (updatedUnits: CustomUnit[]) => {
        setUnits(updatedUnits);
        localStorage.setItem(CUSTOM_UNITS_STORAGE_KEY, JSON.stringify(updatedUnits));
    };
    
    const handleInputChange = (field: keyof typeof newUnit, value: string | number) => {
        setNewUnit(prev => ({ ...prev, [field]: value }));
    }

    const handleAddUnit = () => {
        if (!newUnit.name || !newUnit.symbol || !newUnit.category || !newUnit.factor) {
            toast({ title: "Incomplete Information", description: "Please fill out all fields to add a unit.", variant: "destructive" });
            return;
        }

        const newCustomUnit: CustomUnit = { ...newUnit, id: uuidv4(), factor: Number(newUnit.factor) };
        const updatedUnits = [...units, newCustomUnit];
        updateStoredUnits(updatedUnits);

        toast({ title: "Unit Added!", description: `Successfully added ${newUnit.name}.` });
        setNewUnit({ name: '', symbol: '', category: '', factor: 1 });
        setIsDialogOpen(false);
    };

    const handleDeleteUnit = (unitId: string) => {
        const updatedUnits = units.filter(u => u.id !== unitId);
        updateStoredUnits(updatedUnits);
        toast({ title: "Unit Removed", description: "The custom unit has been deleted." });
    };

    if (!isClient) {
        return null; // or a loading skeleton
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6 h-screen">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/settings">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold">Custom Units</h1>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="icon">
                            <Plus />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Custom Unit</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" placeholder="e.g., Furlong" className="col-span-3" value={newUnit.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="symbol" className="text-right">Symbol</Label>
                                <Input id="symbol" placeholder="e.g., fur" className="col-span-3" value={newUnit.symbol} onChange={(e) => handleInputChange('symbol', e.target.value)} />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">Category</Label>
                                 <Select value={newUnit.category} onValueChange={(value) => handleInputChange('category', value)}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {conversionCategories.map(cat => (
                                            <SelectItem key={cat.name} value={cat.name}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="factor" className="text-right">Factor</Label>
                                <Input id="factor" type="number" placeholder="e.g., 201.168" className="col-span-3" value={newUnit.factor} onChange={(e) => handleInputChange('factor', e.target.value)} />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right col-span-1"></Label>
                                <p className="col-span-3 text-sm text-muted-foreground">This factor is relative to the base unit of the selected category (e.g., for Length, the base is Meters).</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={handleAddUnit}>Add Unit</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="flex-grow">
                {units.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-16 flex flex-col items-center gap-4">
                        <p>You haven't added any custom units yet.</p>
                        <p>Click the '+' button to add your first one.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {units.map((unit) => (
                            <div key={unit.id} className="bg-card p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{unit.name} ({unit.symbol})</p>
                                    <p className="text-sm text-muted-foreground">{unit.category} (1 {unit.symbol} = {unit.factor} x base unit)</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteUnit(unit.id)}>
                                    <Trash2 className="text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
