
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useTransition, useRef } from "react";
import Link from 'next/link';
import html2canvas from 'html2canvas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Info, Copy, Star, Share2, Globe, LayoutGrid, Clock, RefreshCw, Zap, Square, Beaker, Trash2, RotateCcw, Search, Loader2, Home, FileText, Image as ImageIcon, File as FileIcon, CalculatorIcon, StickyNote, Settings, Bell, User, Hourglass, BarChart2, ChevronDown, Sparkles, LogIn, Scale, Power, Gauge, Flame, DollarSign, Fuel, Edit } from "lucide-react";
import { conversionCategories as baseConversionCategories, ConversionCategory, Unit, Region } from "@/lib/conversions";
import type { ParseConversionQueryOutput } from "@/ai/flows/parse-conversion-flow.ts";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useSearchParams, useRouter } from "next/navigation";
import { incrementTodaysCalculations } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { CustomUnit, CustomCategory } from "./custom-unit-manager";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";


const regions: Region[] = ['International', 'India', 'Japan', 'Korea', 'China', 'Middle East'];

interface UserProfile {
    fullName: string;
    email: string;
    profileImage?: string;
    [key:string]: any;
}

const getUserKey = (key: string, email: string | null) => {
    if (typeof window === 'undefined') return key;
    const prefix = email || 'guest';
    return `${prefix}_${key}`;
};


// Offline parser to replace the AI flow
const offlineParseConversionQuery = (query: string, allUnits: Unit[]): ParseConversionQueryOutput | null => {
    // Regex to capture value and units, e.g., "10.5 km to m"
    const regex = /^\s*([0-9.,]+)\s*([a-zA-Z°/²³-]+)\s*(?:to|in|as|)\s*([a-zA-Z°/²³-]+)\s*$/i;
    const match = query.match(regex);

    if (!match) return null;

    const [, valueStr, fromUnitStr, toUnitStr] = match;

    const value = parseFloat(valueStr.replace(/,/g, ''));
    if (isNaN(value)) return null;

    // Find the full unit info from the symbols
    const fromUnit = allUnits.find(u => u.symbol.toLowerCase() === fromUnitStr.toLowerCase());
    const toUnit = allUnits.find(u => u.symbol.toLowerCase() === toUnitStr.toLowerCase());

    if (!fromUnit || !toUnit) return null;

    // Find the category that contains both units
    const category = baseConversionCategories.find(c =>
        c.units.some(u => u.symbol === fromUnit.symbol) &&
        c.units.some(u => u.symbol === toUnit.symbol)
    );

    if (!category) return null;

    return {
        value,
        fromUnit: fromUnit.symbol,
        toUnit: toUnit.symbol,
        category: category.name,
    };
};

type ChartDataItem = {
    name: string;
    value: number;
}


export function Converter() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [customUnits, setCustomUnits] = useState<CustomUnit[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  
  const conversionCategories = useMemo(() => {
    const categoriesWithCustomData = [...baseConversionCategories].map(c => ({ ...c }));

    // Add custom categories
    customCategories.forEach(cc => {
        if (!categoriesWithCustomData.some(c => c.name === cc.name)) {
            const newCategory: ConversionCategory = {
                name: cc.name,
                icon: Beaker, // Default icon for custom categories
                units: [{
                    name: cc.baseUnitName,
                    symbol: cc.baseUnitSymbol,
                    info: `Base unit for ${cc.name}`
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

    // Add custom units to their respective categories
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

  }, [customUnits, customCategories]);


  const [selectedCategory, setSelectedCategory] = React.useState<ConversionCategory>(conversionCategories[0]);
  const [fromUnit, setFromUnit] = React.useState<string>(conversionCategories[0].units[0].symbol);
  const [toUnit, setToUnit] = React.useState<string>(conversionCategories[0].units[1].symbol);
  const [inputValue, setInputValue] = React.useState<string>("1");
  const [outputValue, setOutputValue] = React.useState<string>("");
  const [history, setHistory] = React.useState<string[]>([]);
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [region, setRegion] = React.useState<Region>('International');
  const { t } = useLanguage();
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [isGraphVisible, setIsGraphVisible] = useState(false);
  const [showRecentHistory, setShowRecentHistory] = useState(true);


  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, startSearchTransition] = React.useTransition();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoConvert, setAutoConvert] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);


  const imageExportRef = React.useRef<HTMLDivElement>(null);

  const currentUnits = React.useMemo(() => {
    return selectedCategory.units.filter(u => !u.region || u.region === region);
  }, [selectedCategory, region]);
  
  const allUnits = React.useMemo(() => conversionCategories.flatMap(c => c.units), [conversionCategories]);


  const fromUnitInfo = React.useMemo(() => currentUnits.find(u => u.symbol === fromUnit), [currentUnits, fromUnit]);
  const toUnitInfo = React.useMemo(() => currentUnits.find(u => u.symbol === toUnit), [currentUnits, toUnit]);


  React.useEffect(() => {
    const storedProfileData = localStorage.getItem("userProfile");
    const userEmail = storedProfileData ? JSON.parse(storedProfileData).email : null;

    const storedHistory = localStorage.getItem("conversionHistory");
    const storedFavorites = localStorage.getItem("favoriteConversions");
    const savedAutoConvert = localStorage.getItem(getUserKey('autoConvert', userEmail));
    const savedCustomUnits = localStorage.getItem(getUserKey('customUnits', userEmail));
    const savedCustomCategories = localStorage.getItem(getUserKey('customCategories', userEmail));

    if (storedHistory) setHistory(JSON.parse(storedHistory));
    if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    if (storedProfileData) setProfile(JSON.parse(storedProfileData));
    if (savedAutoConvert !== null) setAutoConvert(JSON.parse(savedAutoConvert));
    if (savedCustomUnits) setCustomUnits(JSON.parse(savedCustomUnits));
    if (savedCustomCategories) setCustomCategories(JSON.parse(savedCustomCategories));
    
    const itemToRestore = localStorage.getItem("restoreConversion");
    if (itemToRestore) {
      handleRestoreHistory(itemToRestore);
      localStorage.removeItem("restoreConversion");
    }
    
    const handleStorageChange = (e: StorageEvent) => {
        const userEmail = profile?.email || null;
        if (e.key === getUserKey('customUnits', userEmail)) {
            setCustomUnits(JSON.parse(e.newValue || '[]'));
        }
        if (e.key === getUserKey('customCategories', userEmail)) {
            setCustomCategories(JSON.parse(e.newValue || '[]'));
        }
        if (e.key === getUserKey('autoConvert', userEmail)) {
            setAutoConvert(e.newValue === null ? true : JSON.parse(e.newValue));
        }
        if (e.key === 'conversionHistory') {
            setHistory(JSON.parse(e.newValue || '[]'));
        }
    };

    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    window.addEventListener('storage', handleStorageChange);


    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [profile?.email]);
  
  const getCurrentConversionString = (value: number, from: string, to: string, result: number) => {
    const formattedResult = result.toLocaleString(undefined, { maximumFractionDigits: 5, useGrouping: false });
    return `${value} ${from} → ${formattedResult} ${to}`;
  };
  
  const getFullHistoryString = (value: number, from: string, to: string, result: number, categoryName: string) => {
    const conversion = getCurrentConversionString(value, from, to, result);
    const timestamp = new Date().toISOString();
    return `${conversion}|${categoryName}|${timestamp}`;
  }
  
  const parseHistoryString = (item: string) => {
      const parts = item.split('|');
      const conversion = parts[0] || '';
      const categoryName = parts[1] || '';
      const timestamp = parts[2] ? new Date(parts[2]) : new Date();

      const convParts = conversion.split(' ');
      const value = convParts[0];
      const from = convParts[1];
      const result = convParts[3];
      const to = convParts[4];
      
      return { conversion, categoryName, timestamp, value, from, result, to };
  }


  React.useEffect(() => {
    // Reset inputs when category changes, only if there are units available.
    if (currentUnits.length > 0) {
      setFromUnit(currentUnits[0].symbol);
      setToUnit(currentUnits.length > 1 ? currentUnits[1].symbol : currentUnits[0].symbol);
      setInputValue("1");
      setIsGraphVisible(false); // Hide graph when category changes
    }
  }, [selectedCategory, region, currentUnits]);


 const performConversion = React.useCallback(async (value: string | number, from: string, to: string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    setIsGraphVisible(false);

    if (isNaN(numValue) || !from || !to) {
        setOutputValue("");
        setChartData([]);
        return;
    }

    const categoryToUse = conversionCategories.find(c => c.units.some(u => u.symbol === from) && c.units.some(u => u.symbol === to));

    if (!categoryToUse) {
        setOutputValue("");
        setChartData([]);
        return;
    }

    const result = await categoryToUse.convert(numValue, from, to, region);

    if (result === undefined || isNaN(result)) {
        setOutputValue("");
        setChartData([]);
        return;
    }

    const formattedResult = result.toLocaleString(undefined, { maximumFractionDigits: 5, useGrouping: false });
    setOutputValue(formattedResult);

    // Prepare data for multi-unit comparison chart
    if (categoryToUse.name !== 'Temperature') { // Charting temp isn't straightforward
        const allUnitsInCategory = categoryToUse.units.filter(u => !u.region || u.region === region);
        const chartDataPromises = allUnitsInCategory.map(async (unit) => {
            const convertedValue = await categoryToUse.convert(numValue, from, unit.symbol, region);
            return { 
                name: unit.symbol, 
                value: parseFloat(convertedValue.toFixed(5)) 
            };
        });
        const newChartData = await Promise.all(chartDataPromises);
        setChartData(newChartData);
    } else {
        setChartData([]);
    }

}, [region, conversionCategories]);

  
  const handleSaveToHistory = React.useCallback(() => {
    const saveConversionHistory = JSON.parse(localStorage.getItem(getUserKey('saveConversionHistory', profile?.email || null)) || 'true');
    if (!saveConversionHistory) return;

    const numValue = parseFloat(inputValue);
    const result = parseFloat(outputValue.replace(/,/g, ''));
    if (isNaN(numValue) || isNaN(result) || outputValue === '') return;

    const conversionString = getFullHistoryString(numValue, fromUnit, toUnit, result, selectedCategory.name);
    localStorage.setItem('lastConversion', conversionString);
    
    setHistory(prevHistory => {
        // Prevent duplicates by checking just the conversion part, not the timestamp
        const conversionPart = conversionString.split('|')[0];
        if (prevHistory.some(h => h.startsWith(conversionPart))) {
            return prevHistory;
        }
        incrementTodaysCalculations();
        const newHistory = [conversionString, ...prevHistory];
        localStorage.setItem("conversionHistory", JSON.stringify(newHistory));
        return newHistory;
    });
  }, [inputValue, fromUnit, toUnit, outputValue, selectedCategory.name, profile?.email]);


  // Effect to save history automatically when outputValue changes, as a result of a conversion
  React.useEffect(() => {
    if (outputValue) {
        handleSaveToHistory();
    }
  }, [outputValue, handleSaveToHistory]);
  
  // Perform conversion whenever inputs change if auto-convert is on
  useEffect(() => {
    if (autoConvert) {
      performConversion(inputValue, fromUnit, toUnit);
    }
  }, [inputValue, fromUnit, toUnit, autoConvert, performConversion]);

  // Update favorite status whenever output or favorites list change
  React.useEffect(() => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !outputValue) {
      setIsFavorite(false);
      return
    };

    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getFullHistoryString(numValue, fromUnit, toUnit, result, selectedCategory.name);
    setIsFavorite(favorites.some(fav => fav.startsWith(conversionString.split('|')[0])));
  }, [inputValue, fromUnit, toUnit, outputValue, favorites, selectedCategory.name]);


 const handleSearch = () => {
    if (searchQuery.trim() === "" || isSearching) {
        return;
    }

    startSearchTransition(() => {
        try {
            const parsed = offlineParseConversionQuery(searchQuery, allUnits);

            if (parsed) {
                const category = conversionCategories.find(c => c.name === parsed.category);
                if (category) {
                    const categoryUnits = category.units.filter(u => !u.region || u.region === region);
                    const fromUnitExists = categoryUnits.some(u => u.symbol === parsed.fromUnit);
                    const toUnitExists = categoryUnits.some(u => u.symbol === parsed.toUnit);

                    if (fromUnitExists && toUnitExists) {
                        setSelectedCategory(category);
                        setFromUnit(parsed.fromUnit);
                        setToUnit(parsed.toUnit);
                        setInputValue(String(parsed.value));
                        performConversion(parsed.value, parsed.fromUnit, parsed.toUnit);
                        setSearchQuery(""); // Clear search
                    } else {
                        toast({ title: t('converter.toast.cannotConvert'), description: t('converter.toast.regionError', { region }), variant: "destructive" });
                    }
                } else {
                    toast({ title: t('converter.toast.cannotConvert'), description: t('converter.toast.categoryError'), variant: "destructive" });
                }
            } else {
                toast({ title: t('converter.toast.invalidSearch'), description: t('converter.toast.queryError'), variant: "destructive" });
            }
        } catch (error) {
            console.error("Search conversion failed:", error);
            toast({ title: t('converter.toast.invalidSearch'), description: t('converter.toast.queryError'), variant: "destructive" });
        }
    });
};


  const handleCategoryChange = (categoryName: string) => {
    const category = conversionCategories.find(c => c.name === categoryName);
    if (category) {
      setSelectedCategory(category);
    }
  };

  const handleRegionChange = (value: string) => {
    setRegion(value as Region);
  }

  const handleSwapUnits = () => {
    const currentInput = inputValue;
    const currentOutput = outputValue;
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setInputValue(currentOutput.replace(/,/g, ''));
  };

  const handleConvertClick = () => {
    performConversion(inputValue, fromUnit, toUnit);
  };
  
  const handleToggleFavorite = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !outputValue) return;

    const conversionStringPart = getCurrentConversionString(numValue, fromUnit, toUnit, parseFloat(outputValue.replace(/,/g, '')));
    const fullHistoryString = getFullHistoryString(numValue, fromUnit, toUnit, parseFloat(outputValue.replace(/,/g, '')), selectedCategory.name);

    let newFavorites: string[];
    const isAlreadyFavorite = favorites.some(fav => fav.startsWith(conversionStringPart));

    if (isAlreadyFavorite) {
      newFavorites = favorites.filter(fav => !fav.startsWith(conversionStringPart));
      toast({ title: t('converter.toast.favRemoved') });
    } else {
      newFavorites = [fullHistoryString, ...favorites];
      toast({ title: t('converter.toast.favAdded') });
    }
    
    setFavorites(newFavorites);
    localStorage.setItem("favoriteConversions", JSON.stringify(newFavorites));
  };


  const handleRestoreHistory = (item: string) => {
    const { value, from, to, result, categoryName } = parseHistoryString(item);
  
    // Find category that has both units
    const category = conversionCategories.find(c => c.name === categoryName);
  
    if (category) {
      const categoryUnits = category.units.filter(u => !u.region || u.region === region);
      const fromUnitExists = categoryUnits.some(u => u.symbol === from);
      const toUnitExists = categoryUnits.some(u => u.symbol === to);

      if(fromUnitExists && toUnitExists) {
        setSelectedCategory(category);
        setFromUnit(from);
        setToUnit(to);
        setInputValue(value);
        setOutputValue(result);
      } else {
        toast({ title: t('converter.toast.cannotRestore'), description: t('converter.toast.regionError', { region }), variant: "destructive"});
      }
    } else {
        toast({ title: t('converter.toast.cannotRestore'), description: t('converter.toast.categoryError'), variant: "destructive"});
    }
  };

  const handleShare = async () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !outputValue) {
      toast({ title: t('converter.toast.nothingToShare'), description: t('converter.toast.performConversionFirst'), variant: "destructive" });
      return;
    }
    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getCurrentConversionString(numValue, fromUnit, toUnit, result);

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('converter.share.title'),
          text: conversionString,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({ title: t('converter.toast.shareFailed'), description: t('converter.toast.couldNotShare'), variant: "destructive" });
      }
    } else {
      toast({ title: t('converter.toast.notSupported'), description: t('converter.toast.webShareApi'), variant: "destructive" });
    }
  };

  const handleExportAsTxt = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !outputValue) {
      toast({ title: t('converter.toast.nothingToExport'), description: t('converter.toast.performConversionFirst'), variant: "destructive" });
      return;
    }
    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getCurrentConversionString(numValue, fromUnit, toUnit, result);
    
    const blob = new Blob([conversionString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversion-${numValue}${fromUnit}-to-${toUnit}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: t('converter.toast.exportedAsTxt') });
  };
  
  const handleExportAsImage = async () => {
    const numValue = parseFloat(inputValue);
     if (isNaN(numValue) || !outputValue || !imageExportRef.current) {
        toast({ title: t('converter.toast.nothingToExport'), description: t('converter.toast.performConversionFirst'), variant: "destructive" });
        return;
    }

    try {
        const canvas = await html2canvas(imageExportRef.current, { backgroundColor: null, scale: 3 });
        const image = canvas.toDataURL("image/png", 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `conversion-${numValue}${fromUnit}-to-${toUnit}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: t('converter.toast.exportedAsImage') });
    } catch (error) {
        console.error('Error exporting as image:', error);
        toast({ title: t('converter.toast.couldNotExportImage'), description: t('converter.toast.couldNotExportImage'), variant: "destructive" });
    }
  };
  
  const handleProfileClick = () => {
    if (profile) {
      router.push('/profile');
    } else {
      setShowLoginDialog(true);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  }

  const handleCopy = () => {
    if (outputValue) {
        navigator.clipboard.writeText(outputValue);
        toast({ title: "Result Copied!", description: `Copied "${outputValue}" to your clipboard.`});
    }
  };


  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
      <header className="flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-sm py-4">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                    <Home />
                </Link>
            </Button>
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Scale />
            </div>
            <h1 className="text-xl font-bold">Unit Converter</h1>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" className="gap-2" onClick={handleProfileClick}>
                Hi, {profile?.fullName.split(' ')[0] || 'Guest'}
                <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.profileImage} alt={profile?.fullName}/>
                    <AvatarFallback><User /></AvatarFallback>
                </Avatar>
            </Button>
        </div>
      </header>
      
      {/* Element to be captured for image export */}
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
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><Scale/> Quick Convert</CardTitle>
                    <Badge variant="outline" className="text-amber-600 border-amber-500">Fast & Accurate</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Label>{t('converter.category')}</Label>
                        <Select value={selectedCategory.name} onValueChange={handleCategoryChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {conversionCategories.map(cat => (
                                    <SelectItem key={cat.name} value={cat.name}>
                                        <span className="flex items-center gap-2">
                                            <cat.icon />
                                            {t(`categories.${cat.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: cat.name })}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1">
                        <Label>{t('converter.region')}</Label>
                        <Select value={region} onValueChange={handleRegionChange}>
                            <SelectTrigger>
                                <Globe size={16} className="mr-2"/>
                                <SelectValue placeholder="Select Region"/>
                            </SelectTrigger>
                            <SelectContent>
                                {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <div className="flex-1">
                        <Label>{t('converter.from')}</Label>
                        <Select value={fromUnit} onValueChange={setFromUnit}>
                            <SelectTrigger>
                                <SelectValue placeholder="From" />
                            </SelectTrigger>
                            <SelectContent>
                                {currentUnits.map(unit => <SelectItem key={unit.symbol} value={unit.symbol}>{unit.name} ({unit.symbol})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="outline" size="icon" className="self-end rounded-full" onClick={handleSwapUnits}>
                    <ArrowRightLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex-1">
                        <Label>To</Label>
                        <Select value={toUnit} onValueChange={setToUnit}>
                            <SelectTrigger>
                                <SelectValue placeholder="To" />
                            </SelectTrigger>
                            <SelectContent>
                                {currentUnits.map(unit => <SelectItem key={unit.symbol} value={unit.symbol}>{unit.name} ({unit.symbol})</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-secondary/50">
                        <CardHeader>
                            <Label htmlFor="value" className="text-muted-foreground">Value</Label>
                            <Input
                                id="value"
                                type="number"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="text-2xl font-bold p-0 h-auto bg-transparent border-none shadow-none focus-visible:ring-0"
                                placeholder="0"
                            />
                        </CardHeader>
                        <CardContent>
                             <p className="text-xs text-muted-foreground">Enter a number to convert</p>
                        </CardContent>
                    </Card>
                     <Card className="bg-secondary/50">
                        <CardHeader>
                            <Label className="text-muted-foreground">Converted</Label>
                            <p className="text-2xl font-bold text-primary truncate h-9">
                                {outputValue || '...'}
                            </p>
                        </CardHeader>
                         <CardContent>
                             <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!outputValue}><Copy size={16}/></Button>
                                <Button variant="ghost" size="icon" onClick={handleToggleFavorite} disabled={!outputValue}>
                                    <Star size={16} className={cn(isFavorite && "fill-yellow-400 text-yellow-400")}/>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setIsGraphVisible(v => !v)} disabled={!outputValue || selectedCategory.name === 'Temperature'}>
                                    <BarChart2 size={16} />
                                </Button>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={!outputValue}><Share2 size={16}/></Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Share or Export Conversion</DialogTitle>
                                        </DialogHeader>
                                         <div className="flex flex-col gap-4">
                                            <Button onClick={handleShare}><Share2 className="mr-2 h-4 w-4"/> Share via System Dialog</Button>
                                            <Button onClick={handleExportAsTxt} variant="secondary"><FileText className="mr-2 h-4 w-4"/> Export as .txt</Button>
                                            <Button onClick={handleExportAsImage} variant="secondary"><ImageIcon className="mr-2 h-4 w-4"/> Export as .png</Button>
                                         </div>
                                    </DialogContent>
                                </Dialog>
                             </div>
                        </CardContent>
                    </Card>
                </div>
                 {isGraphVisible && chartData.length > 0 && (
                     <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.toLocaleString()} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--foreground))',
                                        borderRadius: 'var(--radius)',
                                    }}
                                    cursor={{ fill: 'hsla(var(--muted), 0.5)' }}
                                />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
                
                <div className="flex flex-col md:flex-row justify-between items-center mt-2 gap-4">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info size={16}/>
                        <p>Tip: Use the swap button to reverse units</p>
                   </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                         {!autoConvert && (
                            <Button onClick={handleConvertClick} className="w-full">
                                <Zap className="mr-2 h-4 w-4"/>
                                {t('converter.convertButton')}
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => router.push('/history')} className="w-full">View History</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        {history.length > 0 && showRecentHistory && (
          <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><Clock size={20} /> Recent Conversions</CardTitle>
                    <Button variant="ghost" onClick={() => setShowRecentHistory(false)}><Trash2 className="mr-2 h-4 w-4"/> Clear</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                   {history.slice(0, 4).map((item) => {
                       const { conversion, categoryName, timestamp } = parseHistoryString(item);
                       const category = conversionCategories.find(c => c.name === categoryName);
                       const Icon = category?.icon || Power;
                       
                       return (
                         <div key={item} onClick={() => handleRestoreHistory(item)} className="bg-secondary p-3 rounded-lg cursor-pointer hover:bg-secondary/80">
                           <p className="font-semibold">{conversion}</p>
                           <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                               <Icon size={14}/> 
                               <span>{categoryName}</span>
                               <span>•</span>
                               <span>{formatTimestamp(timestamp)}</span>
                           </div>
                         </div>
                       );
                   })}
                </div>
            </CardContent>
          </Card>
      )}
      
       <AlertDialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <AlertDialogContent>
          <AlertDialogHeader className="items-center text-center">
            <div className="p-3 bg-primary/10 rounded-full mb-4 w-fit">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <AlertDialogTitle className="text-2xl">Unlock Your Profile</AlertDialogTitle>
            <AlertDialogDescription className="max-w-xs">
              Log in or create an account to personalize your experience, save preferences, and access your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-col-reverse gap-2">
            <AlertDialogCancel>Not Now</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/welcome')} className="bg-primary hover:bg-primary/90">
              <LogIn className="mr-2"/>
              Continue to Login
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

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
          <h2 className="text-2xl font-bold">{t(`categories.${category.name.toLowerCase()}`)} {t('converter.image.conversion')}</h2>
        </div>
        <div className="flex flex-col gap-2 text-center">
            <p className="text-xl text-muted-foreground">{fromUnitInfo ? t(`units.${fromUnitInfo.name.toLowerCase().replace(/[\s().-]/g, '')}`) : ''}</p>
            <p className="text-5xl font-bold">{inputValue}</p>
            <p className="text-lg text-muted-foreground">{fromUnitInfo?.symbol}</p>
        </div>
        <div className="flex justify-center">
            <ArrowRightLeft className="w-8 h-8 text-accent" />
        </div>
         <div className="flex flex-col gap-2 text-center">
            <p className="text-xl text-muted-foreground">{toUnitInfo ? t(`units.${toUnitInfo.name.toLowerCase().replace(/[\s().-]/g, '')}`) : ''}</p>
            <p className="text-5xl font-bold text-primary">{outputValue}</p>
            <p className="text-lg text-muted-foreground">{toUnitInfo?.symbol}</p>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
            {t('converter.image.generatedBy')} UniConvert
        </p>
      </div>
    );
  }
);
ConversionImage.displayName = 'ConversionImage';
