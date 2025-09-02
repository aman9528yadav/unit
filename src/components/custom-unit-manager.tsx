
"use client";

import { useState } from 'react';
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


export function CustomUnitManager() {
    const [units, setUnits] = useState<any[]>([]);

    const handleAddUnit = (unit: any) => {
        // This will be implemented later
        console.log("Adding unit", unit);
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
                <Dialog>
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
                                <Input id="name" placeholder="e.g., Furlong" className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="symbol" className="text-right">Symbol</Label>
                                <Input id="symbol" placeholder="e.g., fur" className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="category" className="text-right">Category</Label>
                                 <Select>
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
                                <Input id="factor" type="number" placeholder="e.g., 201.168" className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Is Equal To</Label>
                                <p className="col-span-3 text-sm text-muted-foreground">1 Custom Unit = [Factor] x [Base Unit]</p>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="submit" onClick={() => handleAddUnit({})}>Add Unit</Button>
                            </DialogClose>
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
                        {units.map((unit, index) => (
                            <div key={index} className="bg-card p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-bold">{unit.name} ({unit.symbol})</p>
                                    <p className="text-sm text-muted-foreground">{unit.category}</p>
                                </div>
                                <Button variant="ghost" size="icon">
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

