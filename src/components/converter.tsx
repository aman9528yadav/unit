
"use client";

import * as React from "react";
import { useState, useEffect, useMemo, useTransition, useRef } from "react";
import Link from 'next/link';
import html2canvas from 'html2canvas';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Info, Copy, Star, Share2, Globe, LayoutGrid, Clock, RefreshCw, Zap, Square, Beaker, Trash2, RotateCcw, Search, Loader2, Home, FileText, Image as ImageIcon, File as FileIcon, CalculatorIcon, StickyNote, Settings, Bell, User, Hourglass, BarChart2, ChevronDown } from "lucide-react";
import { conversionCategories as baseConversionCategories, ConversionCategory, Unit, Region } from "@/lib/conversions";
import { parseConversionQuery, ParseConversionQueryOutput } from "@/ai/flows/parse-conversion-flow";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calculator } from "./calculator";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { incrementTodaysCalculations } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
import { CustomUnit, CustomCategory } from "./custom-unit-manager";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cn } from "@/lib/utils";
import { Notifications } from "./notifications";
import { GlobalSearchDialog } from "./global-search-dialog";


const regions: Region[] = ['International', 'India'];

interface UserProfile {
    fullName: string;
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
  const [isOnline, setIsOnline] = useState(true);
  const [parsedQuery, setParsedQuery] = useState<ParseConversionQueryOutput | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [autoConvert, setAutoConvert] = useState(true);

  const imageExportRef = React.useRef<HTMLDivElement>(null);

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

    // Check online status
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'customUnits') {
            setCustomUnits(JSON.parse(e.newValue || '[]'));
        }
        if (e.key === 'customCategories') {
            setCustomCategories(JSON.parse(e.newValue || '[]'));
        }
    };
    window.addEventListener('storage', handleStorageChange);


    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const getCurrentConversionString = (value: number, from: string, to: string, result: number) => {
    const formattedResult = result.toLocaleString(undefined, { maximumFractionDigits: 5, useGrouping: false });
    return `${value} ${from} → ${formattedResult} ${to}`;
  };

  React.useEffect(() => {
    // Reset inputs when category changes, only if there are units available.
    if (currentUnits.length > 0) {
      setFromUnit(currentUnits[0].symbol);
      setToUnit(currentUnits.length > 1 ? currentUnits[1].symbol : currentUnits[0].symbol);
      setInputValue("1");
      setIsGraphVisible(false); // Hide graph when category changes
    }
  }, [selectedCategory, region, currentUnits]);


 const performConversion = React.useCallback(async () => {
    const numValue = parseFloat(inputValue);
    setIsGraphVisible(false);

    if (isNaN(numValue) || !fromUnit || !toUnit) {
        setOutputValue("");
        setChartData([]);
        return;
    }

    const categoryToUse = conversionCategories.find(c => c.units.some(u => u.symbol === fromUnit) && c.units.some(u => u.symbol === toUnit)) || selectedCategory;

    if (!categoryToUse) {
        setOutputValue("");
        setChartData([]);
        return;
    }

    const result = await categoryToUse.convert(numValue, fromUnit, toUnit, region);

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
            const convertedValue = await categoryToUse.convert(numValue, fromUnit, unit.symbol, region);
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

}, [inputValue, fromUnit, toUnit, selectedCategory, region, conversionCategories]);

  
  // Perform conversion whenever inputs change if auto-convert is on
  useEffect(() => {
    if (autoConvert) {
      performConversion();
    }
  }, [performConversion, autoConvert]);
  
  // This effect runs after a search query has been parsed and state has been set.
  useEffect(() => {
    if (parsedQuery) {
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
          setSearchQuery(""); // Clear search
        } else {
          toast({ title: t('converter.toast.cannotConvert'), description: t('converter.toast.regionError', { region }), variant: "destructive" });
        }
      } else {
        toast({ title: t('converter.toast.cannotConvert'), description: t('converter.toast.categoryError'), variant: "destructive" });
      }
      setParsedQuery(null); // Reset parsed query
    }
  }, [parsedQuery, region, toast, t, conversionCategories]);

  const handleSaveToHistory = React.useCallback(() => {
    const saveConversionHistory = JSON.parse(localStorage.getItem('saveConversionHistory') || 'true');
    if (!saveConversionHistory) return;

    const numValue = parseFloat(inputValue);
    const result = parseFloat(outputValue.replace(/,/g, ''));
    if (isNaN(numValue) || isNaN(result) || outputValue === '') return;

    const conversionString = getCurrentConversionString(numValue, fromUnit, toUnit, result);
    localStorage.setItem('lastConversion', conversionString);
    
    if (!history.includes(conversionString)) {
      incrementTodaysCalculations();
      const newHistory = [conversionString, ...history.filter(item => item !== conversionString)];
      setHistory(newHistory);
      localStorage.setItem("conversionHistory", JSON.stringify(newHistory));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, fromUnit, toUnit, outputValue, history]);

  // Update favorite status & save history whenever output or favorites list change
  React.useEffect(() => {
    const numValue = parseFloat(inputValue);
     if (isNaN(numValue) || !outputValue) {
      setIsFavorite(false);
      return
    };

    handleSaveToHistory();

    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getCurrentConversionString(numValue, fromUnit, toUnit, result);
    setIsFavorite(favorites.includes(conversionString));
  }, [inputValue, fromUnit, toUnit, outputValue, favorites, handleSaveToHistory]);

  const handleSearch = async () => {
    if (searchQuery.trim() === "" || isSearching) {
        return;
    }

    startSearchTransition(async () => {
        let parsed: ParseConversionQueryOutput | null = null;
        try {
            if (isOnline) {
                parsed = await parseConversionQuery({ query: searchQuery });
            } else {
                parsed = offlineParseConversionQuery(searchQuery, allUnits);
            }

            if (parsed) {
                setParsedQuery(parsed);
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
    performConversion();
  };
  
  const handleToggleFavorite = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !outputValue) return;

    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getCurrentConversionString(numValue, fromUnit, toUnit, result);

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
    const parts = item.split(' ');
    if (parts.length < 5) return; // Basic validation
  
    const value = parts[0];
    const from = parts[1];
    // parts[2] is '→'
    const result = parts[3];
    const to = parts[4];
  
    // Find category that has both units
    const category = conversionCategories.find(c => 
      c.units.some(u => u.symbol === from) && c.units.some(u => u.symbol === to)
    );
  
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
        toast({ title: t('converter.toast.exportFailed'), description: t('converter.toast.couldNotExportImage'), variant: "destructive" });
    }
  };


  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('dashboard.greeting', { name: profile?.fullName || "User" })}</h1>
          <p className="text-muted-foreground">{t('converter.welcome')}</p>
        </div>
        <div className="flex items-center gap-2">
            <GlobalSearchDialog />
            <Notifications />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <User />
              </Link>
            </Button>
        </div>
      </header>

      <div className="grid grid-cols-5 gap-2 text-center">
        <Link href="/" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <Home />
            <span className="text-xs font-medium">{t('nav.dashboard')}</span>
        </Link>
         <Link href="/notes" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <StickyNote />
            <span className="text-xs font-medium">{t('nav.notes')}</span>
        </Link>
        <Link href="/converter" className="flex flex-col items-center gap-2 p-2 rounded-lg bg-accent/20 border-accent border text-accent">
            <CalculatorIcon />
            <span className="text-xs font-medium">{t('nav.converter')}</span>
        </Link>
        <Link href="/history" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <Clock />
            <span className="text-xs font-medium">{t('nav.history')}</span>
        </Link>
         <Link href="/time" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <Hourglass />
            <span className="text-xs font-medium">Time</span>
        </Link>
      </div>
      
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


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Unit">{t('converter.tabs.converter')}</TabsTrigger>
          <TabsTrigger value="Calculator">{t('converter.tabs.calculator')}</TabsTrigger>
        </TabsList>
        <TabsContent value="Unit">
          <div className="relative mt-4">
            <Input
              type="text"
              placeholder={t('converter.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isSearching}
              className="bg-card h-12 text-base pl-4 pr-12"
            />
             <Button
                variant="ghost"
                size="icon"
                onClick={handleSearch}
                disabled={isSearching}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground hover:bg-accent/20"
              >
                {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </Button>
          </div>
          
    
          <div className="bg-card p-4 rounded-xl flex flex-col gap-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-lg">{t('converter.quickConvert')}</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-1.5"><Globe size={16}/> {t('converter.region')}</label>
                    <Select value={region} onValueChange={handleRegionChange}>
                        <SelectTrigger className="bg-background mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-1.5"><LayoutGrid size={16}/> {t('converter.category')}</label>
                     <CategorySelector 
                        categories={conversionCategories}
                        selectedCategory={selectedCategory}
                        onCategoryChange={handleCategoryChange}
                        t={t}
                     />
                </div>
            </div>
    
            <div>
                <label className="text-sm text-muted-foreground">{t('converter.from')}</label>
                <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="bg-background mt-1 h-12 text-lg"
                    placeholder={t('converter.enterValue')}
                  />
            </div>
            
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <UnitSelect units={currentUnits} value={fromUnit} onValueChange={setFromUnit} t={t} />
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSwapUnits}>
                    <ArrowRightLeft className="w-5 h-5" />
                </Button>
                <UnitSelect units={currentUnits} value={toUnit} onValueChange={setToUnit} t={t} />
            </div>
    
            <div className="grid grid-cols-2 gap-2 text-xs">
                {fromUnitInfo && <InfoBox text={fromUnitInfo} />}
                {toUnitInfo && <InfoBox text={toUnitInfo} />}
            </div>
            
            <div className="bg-background rounded-lg p-4 flex justify-between items-center h-16">
                <span className={`text-lg ${!outputValue ? 'text-muted-foreground' : ''}`}>{outputValue || t('converter.resultPlaceholder')}</span>
                {outputValue && (
                     <div className="flex items-center gap-3">
                        <Copy size={20} className="text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => {
                            navigator.clipboard.writeText(outputValue)
                            toast({ title: t('converter.toast.copied')})
                            }} />
                        <Star 
                          size={20} 
                          className={`cursor-pointer transition-colors ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-foreground'}`}
                          onClick={handleToggleFavorite}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Share2 size={20} className="text-muted-foreground cursor-pointer hover:text-foreground" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={handleExportAsImage}>
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    <span>{t('converter.export.asImage')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => toast({title: t('converter.export.notAvailable')})}>
                                    <FileIcon className="mr-2 h-4 w-4" />
                                    <span>{t('converter.export.asPDF')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={handleExportAsTxt}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>{t('converter.export.asTXT')}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={handleShare}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    <span>{t('converter.export.share')}</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                )}
            </div>
            
            <div className="flex gap-2">
                <Button onClick={handleConvertClick} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-bold flex-grow">{t('converter.convertButton')}</Button>
                {outputValue && chartData.length > 0 && (
                    <Button variant="outline" onClick={() => setIsGraphVisible(v => !v)} className="h-12">
                        <BarChart2 />
                        Compare All
                    </Button>
                )}
            </div>
          </div>
            
            {isGraphVisible && chartData.length > 0 && (
                <div className="bg-card p-4 rounded-xl mt-4">
                    <h3 className="font-bold text-lg mb-4 text-center">Comparison for {inputValue} {fromUnit}</h3>
                    <ScrollArea className="h-60 w-full">
                         <ResponsiveContainer width="100%" height={chartData.length * 40}>
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
                                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    width={60} 
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <Tooltip
                                    cursor={{fill: 'hsla(var(--muted), 0.5)'}}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)',
                                    }}
                                />
                                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                        <ScrollBar orientation="vertical" />
                    </ScrollArea>
                </div>
            )}
    
          {history.length > 0 && (
              <div className="bg-card p-4 rounded-xl flex flex-col gap-3 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Clock size={20} /> {t('converter.recentConversions')}</h3>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      {history.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 rounded hover:bg-background group">
                             <div className="flex items-center gap-2">
                               {favorites.includes(item) && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                               <span>{item}</span>
                             </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <RotateCcw size={16} className="cursor-pointer hover:text-foreground" onClick={() => handleRestoreHistory(item)} />
                                <Trash2 size={16} className="cursor-pointer hover:text-foreground" onClick={() => handleDeleteHistory(index)} />
                            </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </TabsContent>
        <TabsContent value="Calculator">
          <div className="mt-4">
            <Calculator />
          </div>
        </TabsContent>
      </Tabs>
      
    </div>
  );
}

function CategorySelector({ categories, selectedCategory, onCategoryChange, t }: { categories: ConversionCategory[], selectedCategory: ConversionCategory, onCategoryChange: (name: string) => void, t: (key: string, params?: any) => string }) {
    const [isOpen, setIsOpen] = useState(false);
    const SelectedIcon = selectedCategory.icon;

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-background mt-1 w-full justify-between">
                    <div className="flex items-center gap-2">
                        <SelectedIcon className="w-4 h-4 text-accent" />
                        <span>{t(`categories.${selectedCategory.name.toLowerCase()}`, { defaultValue: selectedCategory.name })}</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] p-2">
                <div className="grid grid-cols-3 gap-2">
                    {categories.map(cat => {
                        const Icon = cat.icon;
                        const isSelected = cat.name === selectedCategory.name;
                        return (
                            <button
                                key={cat.name}
                                onClick={() => {
                                    onCategoryChange(cat.name);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-2 p-2 rounded-lg aspect-square transition-colors",
                                    isSelected ? "bg-primary/20 text-primary" : "hover:bg-muted"
                                )}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-xs text-center">{t(`categories.${cat.name.toLowerCase()}`, { defaultValue: cat.name })}</span>
                            </button>
                        );
                    })}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
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
