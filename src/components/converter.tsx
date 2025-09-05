

"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useTransition, useRef } from "react";
import Link from 'next/link';
import html2canvas from 'html2canvas';
import {
  Card,
  CardContent,
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Info, Copy, Star, Share2, Globe, LayoutGrid, Clock, RefreshCw, Zap, Square, Beaker, Trash2, RotateCcw, Search, Loader2, Home, FileText, Image as ImageIcon, File as FileIcon, CalculatorIcon, StickyNote, Settings, Bell, User, Hourglass, BarChart2, ChevronDown, Sparkles, LogIn, Scale, Power } from "lucide-react";
import { conversionCategories as baseConversionCategories, ConversionCategory, Unit, Region } from "@/lib/conversions";
import type { ParseConversionQueryOutput } from "@/ai/flows/parse-conversion-flow.ts";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calculator } from "./calculator";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { incrementTodaysCalculations } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { CustomUnit, CustomCategory } from "./custom-unit-manager";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from "@/lib/utils";
import { Notifications } from "./notifications";
import { GlobalSearchDialog } from "./global-search-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";


const regions: Region[] = ['International', 'India', 'Japan', 'Korea', 'China', 'Middle East'];

interface UserProfile {
    fullName: string;
    email: string;
    [key:string]: any;
}

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
  const initialTab = searchParams.get("tab") || "Unit";
  const [activeTab, setActiveTab] = React.useState(initialTab);

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

                // Special case for Currency, assuming USD is base
                if (newCategory.name === 'Currency') {
                    if (!newCategory.factors['USD']) {
                        newCategory.factors['USD'] = 1; // Add USD if not present
                    }
                }
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


  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, startSearchTransition] = React.useTransition();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoConvert, setAutoConvert] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);


  const imageExportRef = React.useRef<HTMLDivElement>(null);
  const searchTriggeredRef = useRef(false);

  const currentUnits = React.useMemo(() => {
    return selectedCategory.units.filter(u => !u.region || u.region === region);
  }, [selectedCategory, region]);
  
  const allUnits = React.useMemo(() => conversionCategories.flatMap(c => c.units), [conversionCategories]);


  const fromUnitInfo = React.useMemo(() => currentUnits.find(u => u.symbol === fromUnit)?.info, [currentUnits, fromUnit]);
  const toUnitInfo = React.useMemo(() => currentUnits.find(u => u.symbol === toUnit)?.info, [currentUnits, toUnit]);


  React.useEffect(() => {
    const storedHistory = localStorage.getItem("conversionHistory");
    const storedFavorites = localStorage.getItem("favoriteConversions");
    const storedProfile = localStorage.getItem("userProfile");
    const savedAutoConvert = localStorage.getItem('autoConvert');
    const savedCustomUnits = localStorage.getItem('customUnits');
    const savedCustomCategories = localStorage.getItem('customCategories');

    if (storedHistory) setHistory(JSON.parse(storedHistory));
    if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    if (storedProfile) setProfile(JSON.parse(storedProfile));
    if (savedAutoConvert !== null) setAutoConvert(JSON.parse(savedAutoConvert));
    if (savedCustomUnits) setCustomUnits(JSON.parse(savedCustomUnits));
    if (savedCustomCategories) setCustomCategories(JSON.parse(savedCustomCategories));
    
    const itemToRestore = localStorage.getItem("restoreConversion");
    if (itemToRestore) {
      handleRestoreHistory(itemToRestore);
      localStorage.removeItem("restoreConversion");
    }
    
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'customUnits') {
            setCustomUnits(JSON.parse(e.newValue || '[]'));
        }
        if (e.key === 'customCategories') {
            setCustomCategories(JSON.parse(e.newValue || '[]'));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
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

  
  // Perform conversion whenever inputs change if auto-convert is on
  useEffect(() => {
    if (searchTriggeredRef.current) {
        searchTriggeredRef.current = false;
        return;
    }
    if (autoConvert) {
      performConversion(inputValue, fromUnit, toUnit);
    }
  }, [inputValue, fromUnit, toUnit, autoConvert, performConversion]);
  
  const handleSaveToHistory = React.useCallback(() => {
    const saveConversionHistory = JSON.parse(localStorage.getItem('saveConversionHistory') || 'true');
    if (!saveConversionHistory) return;

    const numValue = parseFloat(inputValue);
    const result = parseFloat(outputValue.replace(/,/g, ''));
    if (isNaN(numValue) || isNaN(result) || outputValue === '') return;

    const conversionString = getFullHistoryString(numValue, fromUnit, toUnit, result, selectedCategory.name);
    localStorage.setItem('lastConversion', conversionString);
    
    if (!history.includes(conversionString)) {
      incrementTodaysCalculations();
      const newHistory = [conversionString, ...history.filter(item => item !== conversionString)];
      setHistory(newHistory);
      localStorage.setItem("conversionHistory", JSON.stringify(newHistory));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, fromUnit, toUnit, outputValue, history, selectedCategory.name]);

  // Update favorite status & save history whenever output or favorites list change
  React.useEffect(() => {
    const numValue = parseFloat(inputValue);
     if (isNaN(numValue) || !outputValue) {
      setIsFavorite(false);
      return
    };

    handleSaveToHistory();

    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getFullHistoryString(numValue, fromUnit, toUnit, result, selectedCategory.name);
    setIsFavorite(favorites.includes(conversionString));
  }, [inputValue, fromUnit, toUnit, outputValue, favorites, handleSaveToHistory, selectedCategory.name]);

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
                        searchTriggeredRef.current = true;
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

    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getFullHistoryString(numValue, fromUnit, toUnit, result, selectedCategory.name);

    let newFavorites: string[];
    if (favorites.includes(conversionString)) {
      newFavorites = favorites.filter(fav => fav !== conversionString);
      toast({ title: t('converter.toast.favRemoved') });
    } else {
      newFavorites = [conversionString, ...favorites];
      toast({ title: t('converter.toast.favAdded') });
    }
    setFavorites(newFavorites);
    localStorage.setItem("favoriteConversions", JSON.stringify(newFavorites));
    setIsFavorite(newFavorites.includes(conversionString));
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

  const handleDeleteHistory = (index: number) => {
    const itemToDelete = history[index];
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    localStorage.setItem("conversionHistory", JSON.stringify(newHistory));
    
    // Also remove from favorites if it's there
    if (favorites.includes(itemToDelete)) {
      const newFavorites = favorites.filter(fav => fav !== itemToDelete);
      setFavorites(newFavorites);
      localStorage.setItem("favoriteConversions", JSON.stringify(newFavorites));
    }
  };
  
  const handleClearHistory = () => {
    setHistory([]);
    setFavorites([]);
    localStorage.removeItem("conversionHistory");
    localStorage.removeItem("favoriteConversions");
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



  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-4">
      <header className="flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-sm py-4">
        <div className="flex items-center gap-2">
            <Scale />
            <h1 className="text-xl font-bold">Unit Converter</h1>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" className="rounded-full" onClick={handleProfileClick}>
                <User />
            </Button>
            <Button variant="secondary" onClick={handleShare} className="hidden sm:flex">
                <Share2 className="mr-2" /> Share
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

        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><Scale /> Quick Convert</CardTitle>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">Fast & Accurate</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-end">
                        <div className="flex flex-col gap-1.5">
                            <Label>From unit</Label>
                             <UnitSelectionDialog 
                                categories={conversionCategories}
                                onUnitSelect={(category, unit) => {
                                  setSelectedCategory(category)
                                  setFromUnit(unit.symbol)
                                }}
                                selectedCategory={selectedCategory}
                                selectedUnitSymbol={fromUnit}
                                t={t}
                             />
                        </div>

                         <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-secondary" onClick={handleSwapUnits}>
                            <ArrowRightLeft className="w-5 h-5" />
                        </Button>
                        
                        <div className="flex flex-col gap-1.5">
                            <Label>To unit</Label>
                              <UnitSelectionDialog 
                                categories={conversionCategories}
                                onUnitSelect={(category, unit) => {
                                  setSelectedCategory(category)
                                  setToUnit(unit.symbol)
                                }}
                                selectedCategory={selectedCategory}
                                selectedUnitSymbol={toUnit}
                                t={t}
                             />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 bg-secondary/50">
                            <Label className="text-muted-foreground">Value</Label>
                            <Input
                                type="number"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="bg-transparent border-none text-3xl font-bold p-0 h-auto focus-visible:ring-0 mt-1"
                                placeholder="0"
                              />
                              <p className="text-xs text-muted-foreground mt-1">Enter a number to convert</p>
                        </Card>
                         <Card className="p-4 bg-secondary/50">
                            <Label className="text-muted-foreground">Converted</Label>
                            <p className="text-3xl font-bold h-auto mt-1">{outputValue || '0'}</p>
                            <p className="text-xs text-muted-foreground mt-1">Auto-calculated result</p>
                        </Card>
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Info size={16}/>
                            <p>Tip: Use the swap button to reverse units</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/history"><Clock className="mr-2"/> View History</Link>
                            </Button>
                             <Button onClick={handleConvertClick}><Zap className="mr-2"/> Convert</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {history.length > 0 && (
          <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><Clock size={20} /> Recent Conversions</CardTitle>
                    <Button variant="outline" onClick={handleClearHistory}><Trash2 className="mr-2"/> Clear</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                   {history.slice(0, 6).map((item) => {
                       const { conversion, categoryName, timestamp } = parseHistoryString(item);
                       const category = conversionCategories.find(c => c.name === categoryName);
                       const Icon = category?.icon || Power;
                       
                       return (
                         <div key={item} onClick={() => handleRestoreHistory(item)} className="bg-secondary p-3 rounded-lg cursor-pointer hover:bg-secondary/80">
                           <p className="font-semibold">{conversion}</p>
                           <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span className="flex items-center gap-1.5"><Icon size={14}/> {categoryName}</span>
                                <span>{formatDistanceToNow(new Date(timestamp), { addSuffix: true })}</span>
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

function UnitSelectionDialog({ categories, onUnitSelect, selectedCategory, selectedUnitSymbol, t }: { categories: ConversionCategory[], onUnitSelect: (category: ConversionCategory, unit: Unit) => void, selectedCategory: ConversionCategory, selectedUnitSymbol: string, t: (key: string, params?: any) => string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<ConversionCategory>(selectedCategory);
    
    useEffect(() => {
        if (selectedCategory.name !== activeCategory.name) {
            setActiveCategory(selectedCategory);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory]);
    
    const selectedUnitInfo = useMemo(() => activeCategory.units.find(u => u.symbol === selectedUnitSymbol), [activeCategory, selectedUnitSymbol]);
    
    const filteredUnits = useMemo(() => activeCategory.units.filter(unit => 
        unit.name.toLowerCase().includes(search.toLowerCase()) || 
        unit.symbol.toLowerCase().includes(search.toLowerCase())
    ), [activeCategory, search]);

    const handleSelectUnit = (unit: Unit) => {
        onUnitSelect(activeCategory, unit);
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button variant="outline" className="w-full justify-between h-12 text-base">
                    <div className="flex items-center gap-2">
                         <selectedCategory.icon className="w-5 h-5 text-accent" />
                         <span>{selectedUnitInfo?.name} ({selectedUnitSymbol})</span>
                    </div>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl p-0">
                 <DialogHeader className="p-4 border-b">
                    <DialogTitle>Select Unit</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-[1fr_2fr] gap-4 p-4">
                    <div className="flex flex-col gap-1 border-r pr-4">
                        {categories.map(cat => (
                            <Button
                                key={cat.name}
                                variant={activeCategory.name === cat.name ? "secondary" : "ghost"}
                                className="justify-start gap-2"
                                onClick={() => setActiveCategory(cat)}
                            >
                                <cat.icon className="w-5 h-5" />
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                            <Input 
                                placeholder="Search units..." 
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-72">
                            <div className="flex flex-col gap-1">
                                {filteredUnits.map(unit => (
                                    <div
                                      key={unit.symbol}
                                      className="flex justify-between items-center p-2 rounded-md hover:bg-secondary cursor-pointer"
                                      onClick={() => handleSelectUnit(unit)}
                                    >
                                        <span>{unit.name}</span>
                                        <span className="text-muted-foreground">{unit.symbol}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function UnitSelect({ units, value, onValueChange, t }: { units: Unit[], value: string, onValueChange: (value: string) => void, t: (key: string, params?: any) => string }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-background h-12 text-base">
        <SelectValue placeholder="Unit" />
      </SelectTrigger>
      <SelectContent>
        {units.map(unit => (
          <SelectItem key={unit.symbol} value={unit.symbol}>
            {t(`units.${unit.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: unit.name })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function InfoBox({ text }: { text: string }) {
    return (
        <div className="bg-background/50 rounded-lg p-2 flex items-center gap-2">
            <Info size={16} className="text-accent" />
            <span className="text-muted-foreground">{text}</span>
        </div>
    )
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
        className="w-[350px] bg-[#0A102A] border border-indigo-400/50 text-white font-sans p-6 flex flex-col gap-4 rounded-xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-full">
            <Icon className="w-6 h-6 text-indigo-400" />
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
            <p className="text-5xl font-bold">{outputValue}</p>
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
