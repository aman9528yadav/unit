
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit, FolderPlus, Tag, Info } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { conversionCategories as baseConversionCategories } from '@/lib/conversions';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';

const getUserKey = (baseKey: string, email: string | null) => `${email || 'guest'}_${baseKey}`;

const CUSTOM_UNITS_STORAGE_KEY_BASE = 'customUnits';
const CUSTOM_CATEGORIES_STORAGE_KEY_BASE = 'customCategories';

interface UserProfile {
    email: string;
    [key: string]: any;
}


export interface CustomUnit {
    id: string;
    name: string;
    symbol: string;
    category: string;
    factor: number;
}

export interface CustomCategory {
    id: string;
    name: string;
    baseUnitName: string;
    baseUnitSymbol: string;
}

export function CustomUnitManager() {
    const [units, setUnits] = useState<CustomUnit[]>([]);
    const [categories, setCategories] = useState<CustomCategory[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isAddUnitDialogOpen, setIsAddUnitDialogOpen] = useState(false);
    const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    
    const [newUnit, setNewUnit] = useState({ name: '', symbol: '', category: '', factor: 1 });
    const [newCategory, setNewCategory] = useState({ name: '', baseUnitName: '', baseUnitSymbol: '' });
    const [editingUnit, setEditingUnit] = useState<CustomUnit | null>(null);
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useLanguage();

    useEffect(() => {
        setIsClient(true);
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            const parsedProfile = JSON.parse(storedProfile);
            setProfile(parsedProfile);
            loadCustomData(parsedProfile.email);
        } else {
            loadCustomData(null);
        }
    }, []);
    
    const loadCustomData = (email: string | null) => {
        const savedUnits = localStorage.getItem(getUserKey(CUSTOM_UNITS_STORAGE_KEY_BASE, email));
        if (savedUnits) {
            setUnits(JSON.parse(savedUnits));
        }
        const savedCategories = localStorage.getItem(getUserKey(CUSTOM_CATEGORIES_STORAGE_KEY_BASE, email));
        if (savedCategories) {
            setCategories(JSON.parse(savedCategories));
        }
    }
    
    const allCategories = [
        ...baseConversionCategories.filter(c => c.name !== 'Temperature').map(c => c.name),
        ...categories.map(c => c.name)
    ];

    const getBaseUnitForCategory = (categoryName: string) => {
        const customCat = categories.find(c => c.name === categoryName);
        if (customCat) {
            return { name: customCat.baseUnitName, symbol: customCat.baseUnitSymbol };
        }
        const baseCat = baseConversionCategories.find(c => c.name === categoryName);
        if (baseCat && baseCat.factors) {
            const baseUnitSymbol = Object.keys(baseCat.factors).find(key => baseCat.factors![key] === 1);
            const baseUnit = baseCat.units.find(u => u.symbol === baseUnitSymbol);
            if (baseUnit) {
                 return { name: baseUnit.name, symbol: baseUnit.symbol };
            }
        }
        return null;
    }
    
    const baseUnitForNewUnit = useMemo(() => {
        if (!newUnit.category) return null;
        return getBaseUnitForCategory(newUnit.category);
    }, [newUnit.category, categories]);


    const updateStoredUnits = (updatedUnits: CustomUnit[]) => {
        setUnits(updatedUnits);
        const key = getUserKey(CUSTOM_UNITS_STORAGE_KEY_BASE, profile?.email || null);
        localStorage.setItem(key, JSON.stringify(updatedUnits));
        window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(updatedUnits) }));
    };
    
    const updateStoredCategories = (updatedCategories: CustomCategory[]) => {
        setCategories(updatedCategories);
        const key = getUserKey(CUSTOM_CATEGORIES_STORAGE_KEY_BASE, profile?.email || null);
        localStorage.setItem(key, JSON.stringify(updatedCategories));
         window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(updatedCategories) }));
    };
    
    const handleInputChange = (field: keyof typeof newUnit, value: string | number) => {
        setNewUnit(prev => ({ ...prev, [field]: value }));
    }
    
    const handleCategoryInputChange = (field: keyof typeof newCategory, value: string) => {
        setNewCategory(prev => ({ ...prev, [field]: value }));
    };

    const handleEditInputChange = (field: keyof CustomUnit, value: string | number) => {
        if (editingUnit) {
            setEditingUnit({ ...editingUnit, [field]: value });
        }
    }

    const handleAddUnit = () => {
        if (!newUnit.name || !newUnit.symbol || !newUnit.category || !newUnit.factor) {
            toast({ title: t('customUnitManager.toast.incompleteUnit.title'), description: t('customUnitManager.toast.incompleteUnit.description'), variant: "destructive" });
            return;
        }

        const newCustomUnit: CustomUnit = { ...newUnit, id: uuidv4(), factor: Number(newUnit.factor) };
        const updatedUnits = [...units, newCustomUnit];
        updateStoredUnits(updatedUnits);

        toast({ title: t('customUnitManager.toast.unitAdded.title'), description: t('customUnitManager.toast.unitAdded.description', { name: newUnit.name }) });
        setNewUnit({ name: '', symbol: '', category: '', factor: 1 });
        setIsAddUnitDialogOpen(false);
    };

    const handleEditUnit = (unit: CustomUnit) => {
        setEditingUnit(unit);
        setIsEditDialogOpen(true);
    }

    const handleUpdateUnit = () => {
        if (!editingUnit) return;

        const updatedUnits = units.map(u => (u.id === editingUnit.id ? { ...editingUnit, factor: Number(editingUnit.factor) } : u));
        updateStoredUnits(updatedUnits);

        toast({ title: t('customUnitManager.toast.unitUpdated.title'), description: t('customUnitManager.toast.unitUpdated.description', { name: editingUnit.name }) });
        setIsEditDialogOpen(false);
        setEditingUnit(null);
    };

    const handleDeleteUnit = (unitId: string) => {
        const updatedUnits = units.filter(u => u.id !== unitId);
        updateStoredUnits(updatedUnits);
        toast({ title: t('customUnitManager.toast.unitRemoved.title'), description: t('customUnitManager.toast.unitRemoved.description') });
    };
    
    const handleAddCategory = () => {
        if (!newCategory.name || !newCategory.baseUnitName || !newCategory.baseUnitSymbol) {
            toast({ title: t('customUnitManager.toast.incompleteCategory.title'), description: t('customUnitManager.toast.incompleteCategory.description'), variant: "destructive" });
            return;
        }

        const newCustomCategory: CustomCategory = { ...newCategory, id: uuidv4() };
        const updatedCategories = [...categories, newCustomCategory];
        updateStoredCategories(updatedCategories);

        toast({ title: t('customUnitManager.toast.categoryAdded.title'), description: t('customUnitManager.toast.categoryAdded.description', { name: newCategory.name }) });
        setNewCategory({ name: '', baseUnitName: '', baseUnitSymbol: '' });
        setIsAddCategoryDialogOpen(false);
    };

    const handleDeleteCategory = (categoryId: string) => {
        const categoryToDelete = categories.find(c => c.id === categoryId);
        if (!categoryToDelete) return;

        // Also remove all units associated with this category
        const updatedUnits = units.filter(u => u.category !== categoryToDelete.name);
        updateStoredUnits(updatedUnits);

        const updatedCategories = categories.filter(c => c.id !== categoryId);
        updateStoredCategories(updatedCategories);
        toast({ title: t('customUnitManager.toast.categoryRemoved.title'), description: t('customUnitManager.toast.categoryRemoved.description', { name: categoryToDelete.name }) });
    };

    if (!isClient) {
        return null; // or a loading skeleton
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6 h-screen">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-bold">{t('customUnitManager.title')}</h1>
                </div>
                <div className='flex gap-2'>
                    <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="icon" variant="outline"><FolderPlus/></Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('customUnitManager.categoryDialog.title')}</DialogTitle>
                                <DialogDescription>{t('customUnitManager.categoryDialog.description')}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="cat-name" className="text-right">{t('customUnitManager.categoryDialog.name')}</Label>
                                    <Input id="cat-name" placeholder={t('customUnitManager.categoryDialog.namePlaceholder')} className="col-span-3" value={newCategory.name} onChange={(e) => handleCategoryInputChange('name', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="base-unit-name" className="text-right">{t('customUnitManager.categoryDialog.baseUnitName')}</Label>
                                    <Input id="base-unit-name" placeholder={t('customUnitManager.categoryDialog.baseUnitNamePlaceholder')} className="col-span-3" value={newCategory.baseUnitName} onChange={(e) => handleCategoryInputChange('baseUnitName', e.target.value)} />
                                </div>
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="base-unit-symbol" className="text-right">{t('customUnitManager.categoryDialog.baseUnitSymbol')}</Label>
                                    <Input id="base-unit-symbol" placeholder={t('customUnitManager.categoryDialog.baseUnitSymbolPlaceholder')} className="col-span-3" value={newCategory.baseUnitSymbol} onChange={(e) => handleCategoryInputChange('baseUnitSymbol', e.target.value)} />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleAddCategory}>{t('customUnitManager.categoryDialog.addButton')}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isAddUnitDialogOpen} onOpenChange={setIsAddUnitDialogOpen}>
                        <DialogTrigger asChild>
                            <Button size="icon">
                                <Plus />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('customUnitManager.unitDialog.title')}</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">{t('customUnitManager.unitDialog.name')}</Label>
                                    <Input id="name" placeholder={t('customUnitManager.unitDialog.namePlaceholder')} className="col-span-3" value={newUnit.name} onChange={(e) => handleInputChange('name', e.target.value)} />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="symbol" className="text-right">{t('customUnitManager.unitDialog.symbol')}</Label>
                                    <Input id="symbol" placeholder={t('customUnitManager.unitDialog.symbolPlaceholder')} className="col-span-3" value={newUnit.symbol} onChange={(e) => handleInputChange('symbol', e.target.value)} />
                                </div>
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="category" className="text-right">{t('customUnitManager.unitDialog.category')}</Label>
                                     <Select value={newUnit.category} onValueChange={(value) => handleInputChange('category', value || '')}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder={t('customUnitManager.unitDialog.categoryPlaceholder')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allCategories.map(cat => (
                                                <SelectItem key={cat} value={cat}>{t(`categories.${cat.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: cat })}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                 <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="factor" className="text-right">{t('customUnitManager.unitDialog.factor')}</Label>
                                    <Input id="factor" type="number" placeholder={t('customUnitManager.unitDialog.factorPlaceholder')} className="col-span-3" value={newUnit.factor} onChange={(e) => handleInputChange('factor', e.target.value)} />
                                </div>
                                {baseUnitForNewUnit && (
                                     <div className="grid grid-cols-4 items-center gap-4">
                                        <div className="col-start-2 col-span-3 flex items-start gap-2 text-sm text-muted-foreground bg-secondary p-2 rounded-md">
                                            <Info size={16} className="text-accent flex-shrink-0 mt-0.5" />
                                            <span>
                                                {t('customUnitManager.unitDialog.factorDescription')} <strong>{t(`units.${baseUnitForNewUnit.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: baseUnitForNewUnit.name })} ({baseUnitForNewUnit.symbol})</strong>.
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="submit" onClick={handleAddUnit}>{t('customUnitManager.unitDialog.addButton')}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <div className="flex-grow space-y-6">
                <div>
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Tag /> {t('customUnitManager.sections.units.title')}</h2>
                    {units.length === 0 ? (
                        <div className="text-center text-muted-foreground mt-8 flex flex-col items-center gap-4 bg-card p-6 rounded-lg">
                            <p>{t('customUnitManager.sections.units.empty.line1')}</p>
                            <p>{t('customUnitManager.sections.units.empty.line2')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {units.map((unit) => (
                                <div key={unit.id} className="bg-card p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{unit.name} ({unit.symbol})</p>
                                        <p className="text-sm text-muted-foreground">{t('customUnitManager.sections.units.unitDetails', { category: unit.category, factor: unit.factor })}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEditUnit(unit)}>
                                            <Edit className="text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUnit(unit.id)}>
                                            <Trash2 className="text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                 <div>
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><FolderPlus /> {t('customUnitManager.sections.categories.title')}</h2>
                    {categories.length === 0 ? (
                        <div className="text-center text-muted-foreground mt-8 flex flex-col items-center gap-4 bg-card p-6 rounded-lg">
                             <p>{t('customUnitManager.sections.categories.empty.line1')}</p>
                             <p>{t('customUnitManager.sections.categories.empty.line2')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {categories.map((cat) => (
                                <div key={cat.id} className="bg-card p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{cat.name}</p>
                                        <p className="text-sm text-muted-foreground">{t('customUnitManager.sections.categories.categoryDetails', { name: cat.baseUnitName, symbol: cat.baseUnitSymbol })}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)}>
                                            <Trash2 className="text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('customUnitManager.editDialog.title')}</DialogTitle>
                    </DialogHeader>
                    {editingUnit && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-name" className="text-right">{t('customUnitManager.unitDialog.name')}</Label>
                                <Input id="edit-name" className="col-span-3" value={editingUnit.name} onChange={(e) => handleEditInputChange('name', e.target.value)} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-symbol" className="text-right">{t('customUnitManager.unitDialog.symbol')}</Label>
                                <Input id="edit-symbol" className="col-span-3" value={editingUnit.symbol} onChange={(e) => handleEditInputChange('symbol', e.target.value)} />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-category" className="text-right">{t('customUnitManager.unitDialog.category')}</Label>
                                 <Select value={editingUnit.category} onValueChange={(value) => handleEditInputChange('category', value)}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder={t('customUnitManager.unitDialog.categoryPlaceholder')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allCategories.map(cat => (
                                            <SelectItem key={cat} value={cat}>{t(`categories.${cat.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: cat })}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="edit-factor" className="text-right">{t('customUnitManager.unitDialog.factor')}</Label>
                                <Input id="edit-factor" type="number" className="col-span-3" value={editingUnit.factor} onChange={(e) => handleEditInputChange('factor', e.target.value)} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>{t('customUnitManager.editDialog.cancel')}</Button>
                        <Button type="submit" onClick={handleUpdateUnit}>{t('customUnitManager.editDialog.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    