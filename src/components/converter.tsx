
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useTransition, useRef, useCallback } from "react";
import Link from 'next/link';
import html2canvas from 'html2canvas';
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Info, Copy, Share2, Globe, LayoutGrid, RotateCcw, Search, Loader2, Home, FileText, Image as ImageIcon, User, Lock, ChevronDown, Sparkles, LogIn, Scale, Power, History, Star, Trash2 } from "lucide-react";
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
} from "@/components/ui/dropdown-menu";
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
    const normalizedQuery = query.trim().toLowerCase();

    // Regex to capture value, from unit (can have spaces), and to unit (can have spaces)
    const regex = /^([0-9.,\s]+)\s*([^0-9\s].*?)\s+(?:to|in|as)\s+([^0-9\s].*?)$/i;
    const match = normalizedQuery.match(regex);
    
    if (!match) return null;
    
    const [, valueStr, fromUnitStr, toUnitStr] = match;
    const value = parseFloat(valueStr.replace(/,/g, ''));
    if (isNaN(value)) return null;

    // Sort units by length of name descending to match longer names first ("Square Meters" before "Meters")
    const sortedUnits = [...allUnits].sort((a, b) => b.name.length - a.name.length);

    const findUnit = (unitStr: string): Unit | undefined => {
        const lowerUnitStr = unitStr.trim().toLowerCase().replace(/\s/g, '');
        return sortedUnits.find(u => 
            u.name.toLowerCase().replace(/\s/g, '') === lowerUnitStr || 
            u.symbol.toLowerCase().replace(/\s/g, '') === lowerUnitStr
        );
    };

    const fromUnit = findUnit(fromUnitStr);
    const toUnit = findUnit(toUnitStr);

    if (!fromUnit || !toUnit) return null;

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
                icon: Power, // Default icon for custom categories
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
  const [region, setRegion] = React.useState<Region>('International');
  const { language, t } = useLanguage();
  const [showPremiumLockDialog, setShowPremiumLockDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);


  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, startSearchTransition] = React.useTransition();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('Member');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
  
  const loadRecentConversions = useCallback(() => {
    const storedHistory = localStorage.getItem('conversionHistory');
    const currentHistory = storedHistory ? JSON.parse(storedHistory) : [];
    setRecentConversions(currentHistory.slice(0, 4));
  }, []);
  
  const loadFavorites = useCallback(() => {
    const storedFavorites = localStorage.getItem("favoriteConversions");
    if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  React.useEffect(() => {
    const storedProfileData = localStorage.getItem("userProfile");
    const userEmail = storedProfileData ? JSON.parse(storedProfileData).email : null;
    
    if (storedProfileData) {
        setProfile(JSON.parse(storedProfileData));
    }
    
    // Load all settings in one go
    const loadSettings = () => {
        const savedCustomUnits = localStorage.getItem(getUserKey('customUnits', userEmail));
        const savedCustomCategories = localStorage.getItem(getUserKey('customCategories', userEmail));
        const savedDefaultRegion = localStorage.getItem(getUserKey('defaultRegion', userEmail));

        if (savedCustomUnits) setCustomUnits(JSON.parse(savedCustomUnits));
        if (savedCustomCategories) setCustomCategories(JSON.parse(savedCustomCategories));
        if (savedDefaultRegion && regions.includes(savedDefaultRegion as Region)) {
          setRegion(savedDefaultRegion as Region);
        }
    };
    
    loadSettings();
    loadFavorites();
    loadRecentConversions();

    const itemToRestore = localStorage.getItem("restoreConversion");
    if (itemToRestore) {
        const parsedQuery = offlineParseConversionQuery(itemToRestore, allUnits, conversionCategories);
        if (parsedQuery) {
            restoreFromParsedQuery(parsedQuery);
        }
        localStorage.removeItem("restoreConversion");
    }
    
    const handleStorageChange = (e: StorageEvent) => {
        const userEmail = profile?.email || null;
        if (e.key === getUserKey('customUnits', userEmail) || e.key === getUserKey('customCategories', userEmail) || e.key === getUserKey('defaultRegion', userEmail)) {
           loadSettings();
        }
         if (e.key === 'favoriteConversions') {
            loadFavorites();
        }
        if (e.key === 'conversionHistory') {
           loadRecentConversions();
        }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [profile?.email, allUnits, conversionCategories, loadFavorites, loadRecentConversions]);
  
  const getFullHistoryString = (input: string, from: string, to: string, result: string, category: string): string => {
    return `${input} ${from} → ${result} ${to}|${category}|${new Date().toISOString()}`;
  };

  const handleSaveToHistory = (input: string, from: string, to: string, result: string, category: string) => {
    const historyString = getFullHistoryString(input, from, to, result, category);

    const storedHistory = localStorage.getItem('conversionHistory');
    const currentHistory = storedHistory ? JSON.parse(storedHistory) : [];
    const newHistory = [historyString, ...currentHistory];

    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
    localStorage.setItem('lastConversion', historyString);
    
    window.dispatchEvent(new StorageEvent('storage', { key: 'conversionHistory', newValue: JSON.stringify(newHistory) }));
  };
  
 const performConversion = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !fromUnit || !toUnit) {
      setOutputValue("");
      return null;
    }

    const categoryToUse = conversionCategories.find(c => c.units.some(u => u.symbol === fromUnit) && c.units.some(u => u.symbol === toUnit));
    if (!categoryToUse) {
      setOutputValue("");
      return null;
    }

    const result = categoryToUse.convert(numValue, fromUnit, toUnit, region) as number;
    if (result === undefined || isNaN(result)) {
      setOutputValue("");
      return null;
    }
    
    const formattedResult = result.toLocaleString(undefined, {
      maximumFractionDigits: 5,
      useGrouping: false,
    });
    
    setOutputValue(formattedResult);
    return { formattedResult, categoryToUse };
  };

 const handleSearch = () => {
    if (isSearching) return;
    startSearchTransition(() => {
        const parsed = offlineParseConversionQuery(searchQuery, allUnits, conversionCategories);

        if (parsed) {
            restoreFromParsedQuery(parsed);
            setSearchQuery("");
            setSuggestions([]);
        } else {
             if (searchQuery.match(/^\d/) && searchQuery.match(/to|in|as/i)) {
                 toast({ title: t('converter.toast.invalidSearch'), description: t('converter.toast.queryError'), variant: "destructive" });
            }
        }
    });
};


  const handleCategoryChange = (categoryName: string) => {
    const category = conversionCategories.find(c => c.name === categoryName);
    if (category) {
      setSelectedCategory(category);
      // Reset units to default for the new category
      setFromUnit(category.units[0].symbol);
      setToUnit(category.units[1].symbol);
      setInputValue("1");
      setOutputValue("");
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
    const conversionResult = performConversion();
    if (conversionResult) {
      const { formattedResult, categoryToUse } = conversionResult;
      handleSaveToHistory(inputValue, fromUnit, toUnit, formattedResult, categoryToUse.name);
      loadRecentConversions(); // Refresh recent conversions list
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
            
            // Perform conversion after state update
            React.startTransition(() => {
                const numValue = parsedQuery.value;
                const result = category.convert(numValue, parsedQuery.fromUnit, parsedQuery.toUnit, region) as number;
                 if (result !== undefined && !isNaN(result)) {
                    const formattedResult = result.toLocaleString(undefined, {
                        maximumFractionDigits: 5,
                        useGrouping: false,
                    });
                    setOutputValue(formattedResult);
                 }
            });
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
    const storedHistory = localStorage.getItem('conversionHistory');
    const currentHistory = storedHistory ? JSON.parse(storedHistory) : [];
    const newHistory = currentHistory.filter((item: string) => item !== itemToDelete);
    localStorage.setItem('conversionHistory', JSON.stringify(newHistory));
    loadRecentConversions();
  }


  const handleShareAsText = async () => {
    if (!outputValue) {
      toast({ title: t('converter.toast.nothingToShare'), description: t('converter.toast.performConversionFirst'), variant: "destructive" });
      return;
    }
    
    const conversionString = `${inputValue} ${fromUnit} → ${outputValue} ${toUnit}`;

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
    if (!outputValue) {
      toast({ title: t('converter.toast.nothingToExport'), description: t('converter.toast.performConversionFirst'), variant: "destructive" });
      return;
    }
    const conversionString = `${inputValue} ${fromUnit} → ${outputValue} ${toUnit}`;
    
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

  const handleToggleFavorite = () => {
    if (!outputValue) return;

    const currentConversionString = getFullHistoryString(inputValue, fromUnit, toUnit, outputValue, selectedCategory.name);

    const newFavorites = favorites.includes(currentConversionString)
      ? favorites.filter(fav => fav !== currentConversionString)
      : [...favorites, currentConversionString];

    setFavorites(newFavorites);
    localStorage.setItem("favoriteConversions", JSON.stringify(newFavorites));
    
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

 const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
        setSuggestions([]);
        return;
    }

    const newSuggestions: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Regex to find a number and some text
    const valueUnitRegex = /^([0-9.,\s]+)?\s*(.*)/i;
    const match = query.match(valueUnitRegex);
    
    let numericPart: string | undefined = undefined;
    let textPart = '';

    if (match) {
        numericPart = (match[1] || '').trim();
        textPart = (match[2] || '').trim();
    } else {
        textPart = query.trim().toLowerCase();
    }
    
    const toSeparator = " to ";
    const toIndex = textPart.toLowerCase().lastIndexOf(toSeparator.trim());

    if (toIndex !== -1 && (textPart.toLowerCase().endsWith(toSeparator.trim()) || textPart.toLowerCase().endsWith(toSeparator.trim() + ' '))) {
       const fromPart = textPart.substring(0, toIndex).trim();
       
       const fromUnit = allUnits.find(u => u.name.toLowerCase().replace(/\s/g,'') === fromPart.replace(/\s/g,'') || u.symbol.toLowerCase().replace(/\s/g,'') === fromPart.replace(/\s/g,''));

       if (fromUnit) {
           const category = conversionCategories.find(c => c.units.some(u => u.symbol === fromUnit.symbol));
           if (category) {
               category.units.forEach(unit => {
                   if (unit.symbol !== fromUnit.symbol) {
                       newSuggestions.push(`${numericPart || '1'} ${fromUnit.name} to ${unit.name}`);
                   }
               });
           }
       }
    } else if (textPart) {
        const textPartLower = textPart.toLowerCase().replace(/\s/g, '');
        allUnits.forEach(unit => {
            const unitNameLower = unit.name.toLowerCase().replace(/\s/g, '');
            const unitSymbolLower = unit.symbol.toLowerCase().replace(/\s/g, '');
            if (unitNameLower.includes(textPartLower) || unitSymbolLower.includes(textPartLower)) {
                newSuggestions.push(`${numericPart || '1'} ${unit.name} (${unit.symbol})`);
            }
        });
    }

    setSuggestions([...new Set(newSuggestions)].slice(0, 5));
};

  
  const handleSuggestionClick = (suggestion: string) => {
    // Remove the symbol part for parsing, e.g. "10 Kilometers (km)" -> "10 Kilometers"
    const queryToParse = suggestion.replace(/\s\([^)]*\)$/, '');
    setSearchQuery(queryToParse);
    setSuggestions([]);
    
    // Use a slight delay to allow state to update before searching
    setTimeout(() => handleSearch(), 0);
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
                        <Button variant="ghost" size="icon" onClick={handleShareClick}>
                            <Share2 size={16} />
                        </Button>
                     </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-center mt-2 gap-4">
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
            {t('converter.image.generatedBy')} Sutradhaar
        </p>
      </div>
    );
  }
);
ConversionImage.displayName = 'ConversionImage';

    