

"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useTransition, useRef, useCallback } from "react";
import Link from 'next/link';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Info, Copy, Share2, Globe, LayoutGrid, RotateCcw, Search, Loader2, Home, FileText, Image as ImageIcon, User, Lock, ChevronDown, Sparkles, LogIn, Scale, Power, History, Star, Trash2, GitCompareArrows, Download } from "lucide-react";
import { conversionCategories as baseConversionCategories, ConversionCategory, Unit, Region } from "@/lib/conversions";
import type { ParseConversionQueryOutput } from "@/ai/flows/parse-conversion-flow.ts";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/language-context";
import { CustomUnit, CustomCategory } from "./custom-unit-manager";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuFooter,
} from "@/components/ui/dropdown-menu";
import { useDebounce } from "@/hooks/use-debounce";
import { incrementConversionCount, getStats } from "@/lib/stats";
import { listenToUserData, addConversionToHistory, setFavorites as setFavoritesInDb, deleteHistoryItem, getHistoryKey, listenToFeatureLocks, FeatureLocks } from "@/services/firestore";
import { getStreakData } from "@/lib/streak";
import { offlineParseConversionQuery } from "./global-search";


const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";
const PREMIUM_MEMBER_THRESHOLD = 10000;
type UserRole = 'Member' | 'Premium Member' | 'Owner';


const regions: Region[] = ['International', 'India', 'Japan', 'Korea', 'China', 'Middle East'];
const PREMIUM_REGIONS: Region[] = ['Japan', 'Korea', 'China', 'Middle East'];
const PREMIUM_CATEGORIES: string[] = ['Pressure', 'Energy', 'Currency', 'Fuel Economy'];


interface UserProfile {
    fullName: string;
    email: string;
    profileImage?: string;
    [key:string]: any;
}

const getConversionCategories = (customUnits: CustomUnit[], customCategories: CustomCategory[]): ConversionCategory[] => {
    const categoriesWithCustomData = [...baseConversionCategories].map(c => ({ ...c }));

    customCategories.forEach(cc => {
        if (!categoriesWithCustomData.some(c => c.name === cc.name)) {
            const newCategory: ConversionCategory = {
                name: cc.name,
                icon: Power, // Default icon
                units: [{
                    name: cc.baseUnitName,
                    symbol: cc.baseUnitSymbol,
                    info: `1 ${cc.baseUnitSymbol} = 1 base unit`,
                }],
                factors: { [cc.baseUnitSymbol]: 1 },
                convert: function(value, from, to) {
                    const fromFactor = this.factors![from];
                    const toFactor = this.factors![to];
                    if (fromFactor === undefined || toFactor === undefined) return NaN;
                    const valueInBase = value * fromFactor;
                    return valueInBase / toFactor;
                },
            };
            categoriesWithCustomData.push(newCategory);
        }
    });

    return categoriesWithCustomData.map(category => {
        const newCategory = { ...category, units: [...category.units] };
        if (newCategory.factors) {
          newCategory.factors = { ...newCategory.factors };
        }

        const applicableUnits = customUnits.filter(cu => cu.category === category.name);
        
        applicableUnits.forEach(cu => {
            if (!newCategory.units.some(u => u.symbol === cu.symbol)) {
                newCategory.units.push({
                    name: cu.name,
                    symbol: cu.symbol,
                    info: `1 ${cu.symbol} = ${cu.factor} base units`,
                });
            }
             if (newCategory.factors && newCategory.name !== 'Temperature') {
                newCategory.factors[cu.symbol] = cu.factor;
            }
        });
        
        return newCategory;
    });
};


export function Converter() {
  const { toast } = useToast();
  const router = useRouter();

  const [customUnits, setCustomUnits] = useState<CustomUnit[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  
  const conversionCategories = useMemo(() => getConversionCategories(customUnits, customCategories), [customUnits, customCategories]);


  const [selectedCategory, setSelectedCategory] = React.useState<ConversionCategory>(conversionCategories[0]);
  const [fromUnit, setFromUnit] = React.useState<string>(conversionCategories[0].units[0].symbol);
  const [toUnit, setToUnit] = React.useState<string>(conversionCategories[0].units[1].symbol);
  const [inputValue, setInputValue] = React.useState<string>("1");
  const [outputValue, setOutputValue] = React.useState<string>("");
  const [region, setRegion] = React.useState<Region>('International');
  const { language, t } = useLanguage();
  const [showPremiumLockDialog, setShowPremiumLockDialog] = useState(false);


  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('Member');
  const [featureLocks, setFeatureLocks] = useState<FeatureLocks>({});
  
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [recentConversions, setRecentConversions] = useState<string[]>([]);

  const imageExportRef = React.useRef<HTMLDivElement>(null);

  const currentUnits = React.useMemo(() => {
    return selectedCategory.units.filter(u => !u.region || u.region === region);
  }, [selectedCategory, region]);
  
  const allUnits = React.useMemo(() => conversionCategories.flatMap(c => c.units), [conversionCategories]);


  const fromUnitInfo = React.useMemo(() => currentUnits.find(u => u.symbol === fromUnit), [currentUnits, fromUnit]);
  const toUnitInfo = React.useMemo(() => currentUnits.find(u => u.symbol === toUnit), [currentUnits, toUnit]);
  
  const updateUserRole = useCallback(async (email: string | null) => {
    if(email === DEVELOPER_EMAIL) {
        setUserRole('Owner');
        return;
    }
    if (email) {
        const stats = await getStats(email);
        const streakData = await getStreakData(email);
        if(stats.totalOps >= PREMIUM_MEMBER_THRESHOLD || streakData.bestStreak >= 15) {
            setUserRole('Premium Member');
        } else {
            setUserRole('Member');
        }
    } else {
        setUserRole('Member');
    }
  }, []);

  React.useEffect(() => {
    const storedProfileData = localStorage.getItem("userProfile");
    const userEmail = storedProfileData ? JSON.parse(storedProfileData).email : null;
    
    updateUserRole(userEmail);
    
    const unsubLocks = listenToFeatureLocks(setFeatureLocks);

    const unsub = listenToUserData(userEmail, (data) => {
        if (data && data.fullName && data.email) {
            setProfile(data);
        } else if (storedProfileData) {
            setProfile(JSON.parse(storedProfileData));
        }

        if (!data) return;

        const newCustomUnits = data.customUnits || [];
        const newCustomCategories = data.customCategories || [];

        setCustomUnits(newCustomUnits);
        setCustomCategories(newCustomCategories);
        
        setFavorites(data.favoriteConversions || []);
        const conversionHistory = data.conversionHistory || [];
        setRecentConversions(conversionHistory.slice(0, 4));
        
        const savedDefaultRegion = data.settings?.defaultRegion;
         if (savedDefaultRegion && regions.includes(savedDefaultRegion as Region)) {
          setRegion(savedDefaultRegion as Region);
        }

        const savedDefaultCategory = data.settings?.defaultCategory;
        if (savedDefaultCategory) {
            const latestConversionCategories = getConversionCategories(newCustomUnits, newCustomCategories);
            const category = latestConversionCategories.find(c => c.name === savedDefaultCategory);
            if (category) {
                setSelectedCategory(category);
                setFromUnit(category.units[0].symbol);
                setToUnit(category.units.length > 1 ? category.units[1].symbol : category.units[0].symbol);
            }
        }
    });

    return () => {
      unsub();
      unsubLocks();
    };
  }, [updateUserRole]);

  React.useEffect(() => {
    const itemToRestore = localStorage.getItem("restoreConversion");
    if (itemToRestore) {
        const parsedQuery = offlineParseConversionQuery(itemToRestore, allUnits, conversionCategories);
        if (parsedQuery) {
            restoreFromParsedQuery(parsedQuery);
        }
        localStorage.removeItem("restoreConversion");
    }

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'userProfile') {
            const newProfileData = e.newValue;
            const userEmail = newProfileData ? JSON.parse(newProfileData).email : null;
            setProfile(newProfileData ? JSON.parse(newProfileData) : null);
            updateUserRole(userEmail);
        }
        if (e.key === getHistoryKey(profile?.email || null, 'conversionHistory')) {
            const newHistory = JSON.parse(e.newValue || '[]');
            setRecentConversions(newHistory.slice(0, 4));
        }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [allUnits, conversionCategories, updateUserRole, profile?.email]);

    useEffect(() => {
        const performConversion = () => {
            const numValue = parseFloat(inputValue);
            if (isNaN(numValue) || !fromUnit || !toUnit) {
                setOutputValue("");
                return;
            }

            const categoryToUse = conversionCategories.find(c => c.units.some(u => u.symbol === fromUnit) && c.units.some(u => u.symbol === toUnit));
            if (!categoryToUse) {
                setOutputValue("");
                return;
            }

            const result = categoryToUse.convert(numValue, fromUnit, toUnit, region) as number;
            if (result === undefined || isNaN(result)) {
                setOutputValue("");
                return;
            }
            
            const formattedResult = result.toLocaleString(undefined, {
                maximumFractionDigits: 5,
                useGrouping: false,
            });
            
            setOutputValue(formattedResult);
        };
        performConversion();
    }, [inputValue, fromUnit, toUnit, region, conversionCategories]);
  
  const getFullHistoryString = (input: string, from: string, to: string, result: string, category: string): string => {
    return `${input} ${from} → ${result} ${to}|${category}|${new Date().toISOString()}`;
  };

  const handleSaveToHistory = (input: string, from: string, to: string, result: string, category: string) => {
    const historyString = getFullHistoryString(input, from, to, result, category);
    addConversionToHistory(profile?.email || null, historyString);
    localStorage.setItem('lastConversion', historyString);
  };

  const isFeatureLocked = (featureId: string, isPremiumByDefault: boolean) => {
    const isLockedByFlag = featureLocks[featureId];
    if (isLockedByFlag === true) return true;
    if (isLockedByFlag === false) return false;
    return isPremiumByDefault && userRole === 'Member';
  };
  
  const isExportLocked = isFeatureLocked('Export', true);

  const handleCategoryChange = (categoryName: string) => {
    const isPremiumCategory = PREMIUM_CATEGORIES.includes(categoryName);
    if (isFeatureLocked(`Category:${categoryName}`, isPremiumCategory)) {
        setShowPremiumLockDialog(true);
        return;
    }

    const category = conversionCategories.find(c => c.name === categoryName);
    if (category) {
      setSelectedCategory(category);
      setFromUnit(category.units[0].symbol);
      setToUnit(category.units.length > 1 ? category.units[1].symbol : category.units[0].symbol);
      setInputValue("1");
      setOutputValue("");
    }
  };

  const handleRegionChange = (newRegion: string) => {
    const isPremiumRegion = PREMIUM_REGIONS.includes(newRegion as Region);
    if (isFeatureLocked(`Region:${newRegion}`, isPremiumRegion)) {
        setShowPremiumLockDialog(true);
    } else {
        setRegion(newRegion as Region);
    }
  }

  const handleSwapUnits = () => {
    const currentInput = inputValue;
    const currentOutput = outputValue;
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputValue(currentOutput.replace(/,/g, ''));
  };

  const handleConvertClick = () => {
    if(outputValue) {
        incrementConversionCount();
        updateUserRole(profile?.email || null);
        handleSaveToHistory(inputValue, fromUnit, toUnit, outputValue, selectedCategory.name);
    }
  };
  
  const restoreFromParsedQuery = (parsedQuery: ParseConversionQueryOutput) => {
    const category = conversionCategories.find(c => c.name === parsedQuery.category);
    if (category) {
        const categoryUnits = category.units.filter(u => !u.region || u.region === region);
        const fromUnitExists = categoryUnits.some(u => u.symbol === parsedQuery.fromUnit);
        const toUnitExists = categoryUnits.some(u => u.symbol === parsedQuery.toUnit);

        if (fromUnitExists && toUnitExists) {
            setSelectedCategory(category);
            setFromUnit(parsedQuery.fromUnit);
            setToUnit(parsedQuery.toUnit);
            setInputValue(String(parsedQuery.value));
        } else {
            toast({ title: t('converter.toast.cannotRestore'), description: t('converter.toast.regionError', { region }), variant: "destructive" });
        }
    } else {
        toast({ title: t('converter.toast.cannotRestore'), description: t('converter.toast.categoryError'), variant: "destructive" });
    }
  };
  
  const handleRestoreConversion = (item: string) => {
    localStorage.setItem("restoreConversion", item);
    // Use a slight delay to allow localStorage to update before navigation
    setTimeout(() => router.push("/converter"), 50);
    // Reload is not ideal, but it's a simple way to ensure state is fresh
    setTimeout(() => window.location.reload(), 100);
  }

  const handleDeleteConversion = (itemToDelete: string) => {
     deleteHistoryItem(profile?.email || null, 'conversionHistory', itemToDelete);
  }

  const handleShareAsImage = async () => {
    if (isExportLocked) {
        setShowPremiumLockDialog(true);
        return;
    }
    await handleExportAsImage();
  };
  
  const handleExportAsTxt = () => {
     if (isExportLocked) {
        setShowPremiumLockDialog(true);
        return;
    }
    if (!outputValue) {
      toast({ title: t('converter.toast.nothingToExport'), description: t('converter.toast.performConversionFirst'), variant: "destructive" });
      return;
    }
    const conversionString = `${inputValue} ${fromUnit} → ${outputValue} ${toUnit}\n\nSutradhaar | Made by Aman Yadav`;
    
    const blob = new Blob([conversionString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversion-${inputValue}${fromUnit}-to-${toUnit}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: t('converter.toast.exportedAsTxt') });
  };
  
  const handleExportAsImage = async () => {
     if (isExportLocked) {
        setShowPremiumLockDialog(true);
        return;
    }
     if (!outputValue || !imageExportRef.current) {
        toast({ title: t('converter.toast.nothingToExport'), description: t('converter.toast.performConversionFirst'), variant: "destructive" });
        return;
    }

    try {
        const canvas = await html2canvas(imageExportRef.current, { backgroundColor: null, scale: 3 });
        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `conversion-${inputValue}${fromUnit}-to-${toUnit}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: t('converter.toast.exportedAsImage') });
    } catch (error) {
        console.error('Error exporting as image:', error);
        toast({ title: t('converter.toast.couldNotExportImage'), description: t('converter.toast.couldNotExportImage'), variant: "destructive" });
    }
  };
  
    const handleExportAsPdf = async () => {
        if (isExportLocked) {
            setShowPremiumLockDialog(true);
            return;
        }
        if (!imageExportRef.current || !outputValue) {
            toast({ title: t('converter.toast.nothingToExport'), description: t('converter.toast.performConversionFirst'), variant: "destructive" });
            return;
        }

        try {
            const canvas = await html2canvas(imageExportRef.current, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`conversion-${inputValue}${fromUnit}-to-${toUnit}.pdf`);
        } catch (error) {
            console.error('Error exporting as PDF:', error);
            toast({ title: "Could not export PDF", variant: "destructive" });
        }
    };
  
  const handleProfileClick = () => {
    if (profile) {
      router.push('/profile');
    } else {
      setShowLoginDialog(true);
    }
  };
  
  const handleCopy = () => {
    if (outputValue) {
        navigator.clipboard.writeText(outputValue);
        toast({ title: t('converter.toast.copied'), description: t('converter.toast.copiedDescription', {outputValue})});
    }
  };
  
  const handleToggleFavorite = () => {
    if (!outputValue) return;

    const currentConversionString = getFullHistoryString(inputValue, fromUnit, toUnit, outputValue, selectedCategory.name);

    const newFavorites = favorites.includes(currentConversionString)
      ? favorites.filter(fav => fav !== currentConversionString)
      : [...favorites, currentConversionString];

    setFavorites(newFavorites);
    setFavoritesInDb(profile?.email || null, newFavorites);
    
    if (favorites.includes(currentConversionString)) {
        toast({ title: t('converter.toast.favRemoved') });
    } else {
        toast({ title: t('converter.toast.favAdded') });
    }
  };

  useEffect(() => {
    if (!outputValue) {
        setIsFavorite(false);
        return;
    }
    const currentConversionString = getFullHistoryString(inputValue, fromUnit, toUnit, outputValue, selectedCategory.name);
    setIsFavorite(favorites.includes(currentConversionString));
  }, [inputValue, fromUnit, toUnit, outputValue, selectedCategory, favorites]);

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
      
      <div className="absolute -left-[9999px] -top-[9999px]">
        {outputValue && (
            <ConversionImage
              ref={imageExportRef}
              category={selectedCategory}
              fromUnit={fromUnit}
              toUnit={toUnit}
              inputValue={inputValue}
              outputValue={outputValue}
              t={t}
            />
        )}
       </div>
        
        <Card>
            <CardContent className="flex flex-col gap-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <Label className="flex items-center gap-2 mb-2"><Globe size={16}/>{t('converter.region')}</Label>
                        <Select value={region} onValueChange={handleRegionChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Region"/>
                            </SelectTrigger>
                            <SelectContent>
                                {regions.map(r => {
                                    const isLocked = isFeatureLocked(`Region:${r}`, PREMIUM_REGIONS.includes(r));
                                    return (
                                        <SelectItem key={r} value={r} onSelect={(e) => { if (isLocked) { e.preventDefault(); setShowPremiumLockDialog(true); } }}>
                                            <div className="flex items-center gap-2">
                                                {PREMIUM_REGIONS.includes(r) && <Star className={cn("w-3 h-3", isLocked ? "text-muted-foreground" : "text-yellow-500 fill-yellow-400")} />}
                                                {r}
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="flex items-center gap-2 mb-2"><LayoutGrid size={16}/>{t('converter.category')}</Label>
                        <Select value={selectedCategory.name} onValueChange={handleCategoryChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {conversionCategories.map(cat => {
                                    const isLocked = isFeatureLocked(`Category:${cat.name}`, PREMIUM_CATEGORIES.includes(cat.name));
                                    return (
                                        <SelectItem key={cat.name} value={cat.name} onSelect={(e) => { if (isLocked) { e.preventDefault(); setShowPremiumLockDialog(true); } }}>
                                            <div className="flex items-center gap-2">
                                                {PREMIUM_CATEGORIES.includes(cat.name) && <Star className={cn("w-3 h-3", isLocked ? "text-muted-foreground" : "text-yellow-500 fill-yellow-400")} />}
                                                <cat.icon className="w-4 h-4" />
                                                {t(`categories.${cat.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: cat.name })}
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div>
                  <Label htmlFor="value">{t('converter.from')}</Label>
                  <Input
                      id="value"
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      className="mt-2"
                      placeholder="0"
                  />
                </div>

                <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <Select value={fromUnit} onValueChange={setFromUnit}>
                        <SelectTrigger>
                            <SelectValue placeholder="From" />
                        </SelectTrigger>
                        <SelectContent>
                            {currentUnits.map(unit => <SelectItem key={unit.symbol} value={unit.symbol}>{t(`units.${unit.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: unit.name })} ({unit.symbol})</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" className="self-center rounded-full" onClick={handleSwapUnits}>
                        <ArrowRightLeft className="w-5 h-5" />
                    </Button>

                    <Select value={toUnit} onValueChange={setToUnit}>
                        <SelectTrigger>
                            <SelectValue placeholder="To" />
                        </SelectTrigger>
                        <SelectContent>
                            {currentUnits.map(unit => <SelectItem key={unit.symbol} value={unit.symbol}>{t(`units.${unit.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: unit.name })} ({unit.symbol})</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    {fromUnitInfo?.info && <div className="flex items-center gap-2 bg-secondary p-2 rounded-md"><Info size={14}/> {fromUnitInfo.info}</div>}
                    {toUnitInfo?.info && <div className="flex items-center gap-2 bg-secondary p-2 rounded-md"><Info size={14}/> {toUnitInfo.info}</div>}
                </div>

                <div className="bg-secondary p-4 rounded-lg flex justify-between items-center">
                    <span className="text-2xl font-bold">{outputValue || "0.00"}</span>
                     <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={handleToggleFavorite} disabled={!outputValue}>
                            <Star className={cn("w-5 h-5", isFavorite && "text-yellow-400 fill-yellow-400")} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!outputValue}><Copy size={16}/></Button>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Share2 size={16} />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={handleShareAsImage}>
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    <span>Share as Image</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleExportAsTxt}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Export as TXT</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={handleExportAsPdf}>
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>Export as PDF</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-center mt-2 gap-4">
                     <CompareButton category={selectedCategory} fromUnit={fromUnit} inputValue={inputValue} t={t} />
                    <Button onClick={handleConvertClick} className="w-full">
                        <Power className="mr-2 h-4 w-4"/>
                        {t('converter.convertButton')}
                    </Button>
                </div>
            </CardContent>
        </Card>
      
       <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4 w-fit">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-2xl">{t('dashboard.unlockProfile.title')}</AlertDialogTitle>
            <AlertDialogDescription className="max-w-xs">
              {t('dashboard.unlockProfile.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-col-reverse gap-2">
            <AlertDialogCancel>{t('dashboard.unlockProfile.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/welcome')} className="bg-primary hover:bg-primary/90">
              <LogIn className="mr-2"/>
              {t('dashboard.unlockProfile.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

        <AlertDialog open={showPremiumLockDialog} onOpenChange={setShowPremiumLockDialog}>
            <AlertDialogContent>
                <AlertDialogHeader className="items-center text-center">
                     <div className="p-4 bg-primary/10 rounded-full mb-4">
                        <Star className="w-10 h-10 text-primary" />
                    </div>
                    <AlertDialogTitle className="text-2xl">Premium Feature Locked</AlertDialogTitle>
                    <AlertDialogDescription>
                        Complete {PREMIUM_MEMBER_THRESHOLD.toLocaleString()} operations or maintain a 15-day streak to unlock this feature and more!
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center flex-col-reverse sm:flex-row gap-2">
                     <AlertDialogCancel onClick={() => setShowPremiumLockDialog(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push('/premium')}>
                        Check Your Progress
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        
        {recentConversions.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center gap-2">
                           <History size={18} />
                           {t('converter.recentConversions')}
                        </div>
                        <Button variant="link" size="sm" onClick={() => router.push('/history?tab=conversions')}>{t('dashboard.seeAll')}</Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {recentConversions.map((calc, i) => (
                            <li key={i} className="flex justify-between items-center p-2 bg-secondary rounded-md group">
                               <span className="truncate">{calc.split('|')[0]}</span>
                               <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRestoreConversion(calc)}>
                                        <RotateCcw className="h-4 w-4"/>
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteConversion(calc)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                               </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        )}
    </div>
  );
}

const CompareButton = ({ category, fromUnit, inputValue, t }: { category: ConversionCategory; fromUnit: string; inputValue: string, t: any }) => {
    const comparisonUnits = category.units.filter(u => u.symbol !== fromUnit);

    const getComparisonResults = () => {
        const value = parseFloat(inputValue);
        if (isNaN(value)) return [];

        return comparisonUnits.map(unit => {
            const result = category.convert(value, fromUnit, unit.symbol) as number;
            const formattedResult = result.toLocaleString(undefined, {
                maximumFractionDigits: 5,
                useGrouping: false,
            });
            return {
                name: t(`units.${unit.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: unit.name }),
                unitSymbol: unit.symbol,
                value: parseFloat(formattedResult),
            };
        });
    };
    
    const results = getComparisonResults();

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <GitCompareArrows className="mr-2 h-4 w-4" /> Compare
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full">
                <DialogHeader>
                    <DialogTitle>Conversion Comparison</DialogTitle>
                    <DialogDescription>
                        Comparing {inputValue} {fromUnit} to other units in the {category.name} category.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid grid-cols-1 gap-6 max-h-[60vh] overflow-y-auto p-1">
                    {/* Chart */}
                    <div className="h-64 pr-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={results} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorUv" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                                <RechartsTooltip 
                                    cursor={{fill: 'hsl(var(--muted))'}}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-background border p-2 rounded-lg shadow-lg">
                                                   <p className="font-semibold">{`${payload[0].payload.name}: ${payload[0].value}`}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" fill="url(#colorUv)" barSize={15} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {/* List */}
                    <div className="space-y-2">
                        {results.map(res => (
                            <div key={res.unitSymbol} className="flex justify-between items-center bg-secondary p-3 rounded-lg">
                               <div>
                                    <p className="font-semibold text-foreground">{res.name}</p>
                                    <p className="text-xs text-muted-foreground">{res.unitSymbol}</p>
                               </div>
                               <p className="text-lg font-bold text-primary">{res.value.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
                 <DialogFooter>
                    <Button onClick={() => navigator.clipboard.writeText(results.map(r => `${r.value} ${r.unitSymbol}`).join('\n'))}>
                        <Copy className="mr-2 h-4 w-4" /> Copy All
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


interface ConversionImageProps {
    category: ConversionCategory;
    fromUnit: string;
    toUnit: string;
    inputValue: string;
    outputValue: string;
    t: (key: string, params?: any) => string;
}

const ConversionImage = React.forwardRef<HTMLDivElement, ConversionImageProps>(
  ({ category, fromUnit, toUnit, inputValue, outputValue, t }, ref) => {
    const fromUnitInfo = category.units.find(u => u.symbol === fromUnit);
    const toUnitInfo = category.units.find(u => u.symbol === toUnit);
    const Icon = category.icon;

    return (
      <div
        ref={ref}
        className="w-[350px] bg-card text-foreground font-sans p-6 flex flex-col gap-4 rounded-xl border"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t(`categories.${category.name.toLowerCase().replace(/[\s().-]/g, '')}`)} {t('converter.image.conversion')}</h2>
        </div>
        <div className="flex flex-col gap-2 text-center">
            <p className="text-xl text-muted-foreground">{fromUnitInfo ? t(`units.${fromUnitInfo.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: fromUnitInfo.name }) : ''}</p>
            <p className="text-5xl font-bold">{inputValue}</p>
            <p className="text-lg text-muted-foreground">{fromUnitInfo?.symbol}</p>
        </div>
        <div className="flex justify-center">
            <ArrowRightLeft className="w-8 h-8 text-muted-foreground" />
        </div>
         <div className="flex flex-col gap-2 text-center">
            <p className="text-xl text-muted-foreground">{toUnitInfo ? t(`units.${toUnitInfo.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: toUnitInfo.name }) : ''}</p>
            <p className="text-5xl font-bold text-primary">{outputValue}</p>
            <p className="text-lg text-muted-foreground">{toUnitInfo?.symbol}</p>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
            Sutradhaar | Made by Aman Yadav
        </p>
      </div>
    );
  }
);
ConversionImage.displayName = 'ConversionImage';
