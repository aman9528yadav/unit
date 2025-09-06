
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
import { ArrowRightLeft, Info, Copy, Star, Share2, Globe, LayoutGrid, Clock, RefreshCw, Zap, Square, Beaker, Trash2, RotateCcw, Search, Loader2, Home, FileText, Image as ImageIcon, File as FileIcon, CalculatorIcon, StickyNote, Settings, Bell, User, Hourglass, BarChart2, ChevronDown, Sparkles, LogIn, Scale, Power, Gauge, Flame, DollarSign, Fuel, Edit, Lock, Plus, Minus } from "lucide-react";
import { conversionCategories as baseConversionCategories, ConversionCategory, Unit, Region } from "@/lib/conversions";
import type { ParseConversionQueryOutput } from "@/ai/flows/parse-conversion-flow.ts";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useSearchParams, useRouter } from "next/navigation";
import { incrementTodaysCalculations, getAllTimeCalculations } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { CustomUnit, CustomCategory } from "./custom-unit-manager";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow, isToday, isYesterday, format, parseISO } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";


const DEVELOPER_EMAIL = "amanyadavyadav9458@gmail.com";
const PREMIUM_MEMBER_THRESHOLD = 8000;
type UserRole = 'Member' | 'Premium Member' | 'Owner';


const regions: Region[] = ['International', 'India', 'Japan', 'Korea', 'China', 'Middle East'];
const PREMIUM_REGIONS = ['Japan', 'Korea', 'China', 'Middle East'];


const PREMIUM_CATEGORIES = ['Pressure', 'Energy', 'Currency', 'Fuel Economy'];

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
export const offlineParseConversionQuery = (query: string, allUnits: Unit[], categories: ConversionCategory[]): ParseConversionQueryOutput | null => {
    // This regex tries to capture:
    // 1. A number (value)
    // 2. A unit string (fromUnitStr)
    // 3. An optional "to"
    // 4. Another unit string (toUnitStr)
    const regex = /^\s*([0-9.,]+)\s*([a-zA-Z°/²³\s-]+?)\s*(?:to|in|as)?\s+([a-zA-Z°/²³\s-]+)\s*$/i;
    const match = query.match(regex);

    if (!match) return null;

    const [, valueStr, fromUnitStr, toUnitStr] = match;

    const value = parseFloat(valueStr.replace(/,/g, ''));
    if (isNaN(value)) return null;
    
    const findUnit = (unitStr: string): Unit | undefined => {
        const lowerUnitStr = unitStr.trim().toLowerCase();
        return allUnits.find(u => u.symbol.toLowerCase() === lowerUnitStr || u.name.toLowerCase() === lowerUnitStr);
    }

    const fromUnit = findUnit(fromUnitStr);
    const toUnit = findUnit(toUnitStr);

    if (!fromUnit || !toUnit) return null;

    // Find the category that contains both units
    const category = categories.find(c =>
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
  const debouncedInputValue = useDebounce(inputValue, 300);
  const [outputValue, setOutputValue] = React.useState<string>("");
  const [history, setHistory] = React.useState<string[]>([]);
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [region, setRegion] = React.useState<Region>('International');
  const { language, t } = useLanguage();
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [isGraphVisible, setIsGraphVisible] = useState(false);
  const [showRecentHistory, setShowRecentHistory] = useState(true);
  const [showPremiumLockDialog, setShowPremiumLockDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);


  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, startSearchTransition] = React.useTransition();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoConvert, setAutoConvert] = useState(true);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [userRole, setUserRole] = useState<UserRole>('Member');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);


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
    const savedDefaultRegion = localStorage.getItem(getUserKey('defaultRegion', userEmail));

    if (storedHistory) setHistory(JSON.parse(storedHistory));
    if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    if (storedProfileData) {
        const parsedProfile = JSON.parse(storedProfileData);
        setProfile(parsedProfile);
        const calculations = getAllTimeCalculations(parsedProfile.email);
        if (parsedProfile.email === DEVELOPER_EMAIL) {
            setUserRole('Owner');
        } else if (calculations >= PREMIUM_MEMBER_THRESHOLD) {
            setUserRole('Premium Member');
        } else {
            setUserRole('Member');
        }
    } else {
        setUserRole('Member');
    }
    if (savedAutoConvert !== null) setAutoConvert(JSON.parse(savedAutoConvert));
    if (savedCustomUnits) setCustomUnits(JSON.parse(savedCustomUnits));
    if (savedCustomCategories) setCustomCategories(JSON.parse(savedCustomCategories));
    if (savedDefaultRegion && regions.includes(savedDefaultRegion as Region)) {
      setRegion(savedDefaultRegion as Region);
    }
    
    const itemToRestore = localStorage.getItem("restoreConversion");
    if (itemToRestore) {
        const parsedQuery = offlineParseConversionQuery(itemToRestore, allUnits, conversionCategories);
        if (parsedQuery) {
            restoreFromParsedQuery(parsedQuery);
        } else {
            handleRestoreHistory(itemToRestore);
        }
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
        if (e.key === getUserKey('defaultRegion', userEmail) && e.newValue && regions.includes(e.newValue as Region)) {
            setRegion(e.newValue as Region);
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
  }, [profile?.email, allUnits, conversionCategories]);
  
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
    const fromSymbol = convParts[1];
    const result = convParts[3];
    const toSymbol = convParts[4];
    
    const category = conversionCategories.find(c => c.name === categoryName);
    const fromUnit = category?.units.find(u => u.symbol === fromSymbol);
    const toUnit = category?.units.find(u => u.symbol === toSymbol);

    const fromName = fromUnit ? t(`units.${fromUnit.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: fromUnit.name }) : fromSymbol;
    const toName = toUnit ? t(`units.${toUnit.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: toUnit.name }) : toSymbol;
    
    const translatedConversion = `${value} ${fromName} → ${result} ${toName}`;

    return { conversion: translatedConversion, categoryName, timestamp, value, from: fromSymbol, result, to: toSymbol };
  };


  React.useEffect(() => {
    if (currentUnits.length > 0) {
      setFromUnit(currentUnits[0].symbol);
      setToUnit(currentUnits.length > 1 ? currentUnits[1].symbol : currentUnits[0].symbol);
      setInputValue("1");
      setIsGraphVisible(false);
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

    if (categoryToUse.name !== 'Temperature') {
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


  React.useEffect(() => {
    if (outputValue) {
        handleSaveToHistory();
    }
  }, [outputValue, handleSaveToHistory]);
  
  useEffect(() => {
    if (!autoConvert) return;
  
    const parsed = offlineParseConversionQuery(debouncedInputValue, allUnits, conversionCategories);
  
    if (parsed) {
      restoreFromParsedQuery(parsed);
    } else {
      performConversion(inputValue, fromUnit, toUnit);
    }
  }, [debouncedInputValue, fromUnit, toUnit, autoConvert, performConversion, inputValue, allUnits, conversionCategories]);

  React.useEffect(() => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !outputValue) {
      setIsFavorite(false);
      return
    };

    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getFullHistoryString(numValue, fromUnit, toUnit, result, selectedCategory.name);
    setIsFavorite(favorites.some(fav => fav.startsWith(conversionStringPart.split('|')[0])));
  }, [inputValue, fromUnit, toUnit, outputValue, favorites, selectedCategory.name]);


 const handleSearch = () => {
    if (searchQuery.trim() === "" || isSearching) {
        return;
    }

    startSearchTransition(() => {
        try {
            const parsed = offlineParseConversionQuery(searchQuery, allUnits, conversionCategories);

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
                        setSearchQuery("");
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

  const handleRegionChange = (newRegion: string) => {
    if (isPremiumFeatureLocked && PREMIUM_REGIONS.includes(newRegion)) {
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
    const parsed = offlineParseConversionQuery(inputValue, allUnits, conversionCategories);
    if (parsed) {
      restoreFromParsedQuery(parsed);
    } else {
      performConversion(inputValue, fromUnit, toUnit);
    }
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
            performConversion(parsedQuery.value, parsedQuery.fromUnit, parsedQuery.toUnit);
        } else {
            toast({ title: t('converter.toast.cannotRestore'), description: t('converter.toast.regionError', { region }), variant: "destructive" });
        }
    } else {
        toast({ title: t('converter.toast.cannotRestore'), description: t('converter.toast.categoryError'), variant: "destructive" });
    }
  };

  const handleRestoreHistory = (item: string) => {
    const { value, from, to, result, categoryName } = parseHistoryString(item);
  
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

  const handleShareAsText = async () => {
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
  
   const handleShareClick = () => {
    if (isPremiumFeatureLocked) {
      setShowPremiumLockDialog(true);
    } else {
      setShowShareDialog(true);
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

  const formatTimestamp = (timestamp: Date) => {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  }

  const handleCopy = () => {
    if (outputValue) {
        navigator.clipboard.writeText(outputValue);
        toast({ title: t('converter.toast.copied'), description: t('converter.toast.copiedDescription', {outputValue})});
    }
  };
  
  const isPremiumFeatureLocked = userRole === 'Member';

  const handleCategorySelect = (e: React.MouseEvent, categoryName: string) => {
    const isLocked = isPremiumFeatureLocked && PREMIUM_CATEGORIES.includes(categoryName);
    if (isLocked) {
      e.preventDefault();
      setShowPremiumLockDialog(true);
    } else {
      handleCategoryChange(categoryName);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const newSuggestions: string[] = [];
    const queryLower = query.toLowerCase();

    // Regex to extract number and the start of a unit
    const valueUnitRegex = /^([0-9.,]+)\s*(.*)/i;
    const valueUnitMatch = query.match(valueUnitRegex);

    if (queryLower.includes(" to ")) {
        // Suggest "to" units
        const parts = queryLower.split(" to ");
        const fromPart = parts[0].trim();
        const toPart = parts[1].trim();

        const fromValueUnitRegex = /^([0-9.,]+)\s*([a-zA-Z°/²³\s-]+)/i;
        const fromMatch = fromPart.match(fromValueUnitRegex);
        
        if (fromMatch) {
            const [, , fromUnitStr] = fromMatch;
            const fromUnit = allUnits.find(u => u.symbol.toLowerCase() === fromUnitStr.trim().toLowerCase() || u.name.toLowerCase() === fromUnitStr.trim().toLowerCase());
            if (fromUnit) {
                const category = conversionCategories.find(c => c.units.some(u => u.symbol === fromUnit.symbol));
                if (category) {
                    category.units.forEach(toUnit => {
                        if (toUnit.symbol !== fromUnit.symbol && toUnit.name.toLowerCase().startsWith(toPart)) {
                            newSuggestions.push(`${fromPart} to ${toUnit.name}`);
                        }
                    });
                }
            }
        }
    } else if (valueUnitMatch) {
        // Suggest "from" units
        const [, valueStr, unitPart] = valueUnitMatch;
        const unitPartLower = unitPart.toLowerCase();

        if (unitPartLower) {
            allUnits.forEach(unit => {
                if (unit.symbol.toLowerCase().startsWith(unitPartLower) || unit.name.toLowerCase().startsWith(unitPartLower)) {
                    newSuggestions.push(`${valueStr.trim()} ${unit.name}`);
                }
            });
        }
    }

    setSuggestions(newSuggestions.slice(0, 5));
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSuggestions([]);
    handleSearch();
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
            <h1 className="text-xl font-bold">{t('converter.welcome')}</h1>
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
        <Card className="border-2 border-transparent">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Search/>
                    <CardTitle className="flex items-center gap-2">{t('converter.quickConvert')}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="relative" ref={searchContainerRef}>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder={t('converter.searchPlaceholder')}
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Loader2 className="animate-spin"/> : <Search />}
                        </Button>
                    </div>
                     {suggestions.length > 0 && (
                        <div className="absolute top-full mt-2 w-full bg-card rounded-lg border shadow-lg z-50 max-h-[200px] overflow-y-auto">
                            <ul className="p-2">
                                {suggestions.map((s, i) => (
                                    <li 
                                        key={i} 
                                        className="p-2 rounded-md hover:bg-secondary cursor-pointer"
                                        onClick={() => handleSuggestionClick(s)}
                                    >
                                        {s}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
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
                                    const isLocked = isPremiumFeatureLocked && PREMIUM_REGIONS.includes(r);
                                    return (
                                        <SelectItem key={r} value={r} disabled={isLocked}>
                                            <div className="flex items-center gap-2">
                                                {isLocked && <Lock className="w-3 h-3" />}
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
                       <TooltipProvider>
                           <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                   <Button variant="outline" className="w-full justify-between">
                                      <div className="flex items-center gap-2">
                                        <selectedCategory.icon className="mr-2 h-4 w-4" />
                                        {t(`categories.${selectedCategory.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: selectedCategory.name })}
                                      </div>
                                      <ChevronDown className="h-4 w-4 opacity-50" />
                                   </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-2">
                                       {conversionCategories.map(cat => {
                                           const isLocked = isPremiumFeatureLocked && PREMIUM_CATEGORIES.includes(cat.name);
                                           const categoryItem = (
                                               <DropdownMenuItem
                                                   key={cat.name}
                                                   disabled={isLocked}
                                                   onSelect={(e) => handleCategorySelect(e as unknown as React.MouseEvent, cat.name)}
                                                   className="flex flex-col items-center justify-center h-20 gap-1"
                                               >
                                                   <cat.icon className="w-6 h-6" />
                                                   <span className="text-xs text-center">{t(`categories.${cat.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: cat.name })}</span>
                                                   {isLocked && <Lock className="absolute w-3 h-3 top-2 right-2 text-muted-foreground" />}
                                               </DropdownMenuItem>
                                           );

                                           if (isLocked) {
                                               return (
                                                    <div key={cat.name} onClick={(e) => handleCategorySelect(e, cat.name)}>
                                                        {categoryItem}
                                                    </div>
                                               );
                                           }
                                           return categoryItem;
                                       })}
                                   </div>
                               </DropdownMenuContent>
                           </DropdownMenu>
                       </TooltipProvider>
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
                        <Button variant="ghost" size="icon" onClick={handleCopy} disabled={!outputValue}><Copy size={16}/></Button>
                        <Button variant="ghost" size="icon" onClick={handleToggleFavorite} disabled={!outputValue}>
                            <Star size={16} className={cn(isFavorite && "fill-yellow-400 text-yellow-400")}/>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleShareClick}>
                            <Share2 size={16} />
                        </Button>
                     </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-center mt-2 gap-4">
                    {!autoConvert && (
                        <Button onClick={handleConvertClick} className="w-full">
                            <Zap className="mr-2 h-4 w-4"/>
                            {t('converter.convertButton')}
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setIsGraphVisible(v => !v)} className="w-full" disabled={!outputValue || selectedCategory.name === 'Temperature'}>
                        <BarChart2 size={16} className="mr-2" /> Compare All
                    </Button>
                </div>
                 {isGraphVisible && chartData.length > 0 && (
                     <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.toLocaleString()} />
                                <RechartsTooltip
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
            </CardContent>
        </Card>

        {history.length > 0 && showRecentHistory && (
          <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><Clock size={20} />{t('converter.recentConversions')}</CardTitle>
                    <Button variant="ghost" onClick={() => setShowRecentHistory(false)}><Trash2 className="mr-2 h-4 w-4"/>{t('converter.clear')}</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                   {history.slice(0, 4).map((item) => {
                       const { conversion, categoryName, timestamp } = parseHistoryString(item);
                       const category = conversionCategories.find(c => c.name === categoryName);
                       const Icon = category?.icon || Power;
                       
                       return (
                         <div key={item} className="bg-secondary p-3 rounded-lg group relative">
                            <div className="cursor-pointer" onClick={() => handleRestoreHistory(item)}>
                               <p className="font-semibold">{conversion}</p>
                               <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                   <Icon size={14}/> 
                                   <span>{t(`categories.${categoryName.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: categoryName })}</span>
                                   <span>•</span>
                                   <span>{formatTimestamp(new Date(timestamp))}</span>
                               </div>
                            </div>
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRestoreHistory(item)}><RotateCcw size={14} /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive" onClick={() => setHistory(h => h.filter(i => i !== item))}><Trash2 size={14} /></Button>
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
                        <Lock className="w-10 h-10 text-primary" />
                    </div>
                    <AlertDialogTitle className="text-2xl">Premium Feature Locked</AlertDialogTitle>
                    <AlertDialogDescription>
                        This feature is available to Premium Members. Complete 8,000 operations to unlock this feature and more!
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center flex-col-reverse sm:flex-row gap-2">
                     <AlertDialogCancel onClick={() => setShowPremiumLockDialog(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => router.push('/profile')}>
                        Check Your Progress
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('converter.export.title')}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Button onClick={handleShareAsText}>
                        <Share2 className="mr-2 h-4 w-4" /> {t('converter.export.shareSystem')}
                    </Button>
                    <Button onClick={handleExportAsTxt} variant="secondary">
                        <FileText className="mr-2 h-4 w-4" /> {t('converter.export.asTXT')}
                    </Button>
                    <Button onClick={handleExportAsImage} variant="secondary">
                        <ImageIcon className="mr-2 h-4 w-4" /> {t('converter.export.asImage')}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
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
          <h2 className="text-2xl font-bold">{t(`categories.${category.name.toLowerCase().replace(/[\s().-]/g, '')}`)} {t('converter.image.conversion')}</h2>
        </div>
        <div className="flex flex-col gap-2 text-center">
            <p className="text-xl text-muted-foreground">{fromUnitInfo ? t(`units.${fromUnitInfo.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: fromUnitInfo.name }) : ''}</p>
            <p className="text-5xl font-bold">{inputValue}</p>
            <p className="text-lg text-muted-foreground">{fromUnitInfo?.symbol}</p>
        </div>
        <div className="flex justify-center">
            <ArrowRightLeft className="w-8 h-8 text-accent" />
        </div>
         <div className="flex flex-col gap-2 text-center">
            <p className="text-xl text-muted-foreground">{toUnitInfo ? t(`units.${toUnitInfo.name.toLowerCase().replace(/[\s().-]/g, '')}`, { defaultValue: toUnitInfo.name }) : ''}</p>
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

    

    