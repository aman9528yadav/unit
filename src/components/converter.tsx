
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
import { ArrowRightLeft, Info, Copy, Star, Share2, Globe, LayoutGrid, Clock, RefreshCw, Zap, Square, Beaker, Trash2, RotateCcw, Search, Loader2, Home, FileText, Image as ImageIcon, File as FileIcon, CalculatorIcon, StickyNote, Settings, Bell, User } from "lucide-react";
import { conversionCategories, ConversionCategory, Unit, Region } from "@/lib/conversions";
import { parseConversionQuery, ParseConversionQueryOutput } from "@/ai/flows/parse-conversion-flow";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calculator } from "./calculator";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { incrementTodaysCalculations } from "@/lib/utils";


const regions: Region[] = ['International', 'India'];

// Offline parser to replace the AI flow
const offlineParseConversionQuery = (query: string, allUnits: Unit[]): ParseConversionQueryOutput | null => {
    // Regex to capture value and units, e.g., "10.5 km to m"
    const regex = /^\s*([0-9.,]+)\s*([a-zA-Z°/²³]+)\s*(?:to|in|as|)\s*([a-zA-Z°/²³]+)\s*$/i;
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
    const category = conversionCategories.find(c =>
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


export function Converter() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "Unit";
  const [activeTab, setActiveTab] = React.useState(initialTab);
  const [selectedCategory, setSelectedCategory] = React.useState<ConversionCategory>(conversionCategories[0]);
  const [fromUnit, setFromUnit] = React.useState<string>(conversionCategories[0].units[0].symbol);
  const [toUnit, setToUnit] = React.useState<string>(conversionCategories[0].units[1].symbol);
  const [inputValue, setInputValue] = React.useState<string>("1");
  const [outputValue, setOutputValue] = React.useState<string>("");
  const [history, setHistory] = React.useState<string[]>([]);
  const [favorites, setFavorites] = React.useState<string[]>([]);
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [region, setRegion] = React.useState<Region>('International');

  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, startSearchTransition] = React.useTransition();
  const [isOnline, setIsOnline] = useState(true);
  const [parsedQuery, setParsedQuery] = useState<ParseConversionQueryOutput | null>(null);

  const imageExportRef = React.useRef<HTMLDivElement>(null);

  const currentUnits = React.useMemo(() => {
    return selectedCategory.units.filter(u => !u.region || u.region === region);
  }, [selectedCategory, region]);
  
  const allUnits = React.useMemo(() => conversionCategories.flatMap(c => c.units), []);


  const fromUnitInfo = React.useMemo(() => currentUnits.find(u => u.symbol === fromUnit)?.info, [currentUnits, fromUnit]);
  const toUnitInfo = React.useMemo(() => currentUnits.find(u => u.symbol === toUnit)?.info, [currentUnits, toUnit]);


  React.useEffect(() => {
    const storedHistory = localStorage.getItem("conversionHistory");
    const storedFavorites = localStorage.getItem("favoriteConversions");
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
    
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

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const getCurrentConversionString = (value: number, from: string, to: string, result: number) => {
    const formattedResult = result.toLocaleString(undefined, { maximumFractionDigits: 5, useGrouping: false });
    return `${value} ${from} → ${formattedResult} ${to}`;
  };

  React.useEffect(() => {
    // Reset inputs when category changes
    setFromUnit(currentUnits[0].symbol);
    setToUnit(currentUnits.length > 1 ? currentUnits[1].symbol : currentUnits[0].symbol);
    setInputValue("1");
  }, [selectedCategory, region, currentUnits]);


  const performConversion = React.useCallback(() => {
      const numValue = parseFloat(inputValue);

      if (isNaN(numValue) || !fromUnit || !toUnit) {
        setOutputValue("");
        return;
      }
      
      const categoryToUse = conversionCategories.find(c => c.units.some(u => u.symbol === fromUnit) && c.units.some(u => u.symbol === toUnit)) || selectedCategory;
      const result = categoryToUse.convert(numValue, fromUnit, toUnit, region);

      if (isNaN(result)) {
        setOutputValue("");
        return;
      }
      
      const formattedResult = result.toLocaleString(undefined, { maximumFractionDigits: 5, useGrouping: false });
      setOutputValue(formattedResult);
      
  }, [inputValue, fromUnit, toUnit, selectedCategory, region]);
  
  // Perform conversion whenever inputs change
  useEffect(() => {
    performConversion();
  }, [performConversion]);
  
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
                  toast({ title: "Cannot perform conversion", description: `One of the units may belong to a different region. Current region: ${region}.`, variant: "destructive" });
              }
          } else {
              toast({ title: "Cannot perform conversion", description: "Could not determine the conversion category.", variant: "destructive" });
          }
          setParsedQuery(null); // Reset parsed query
      }
  }, [parsedQuery, region, toast]);

  // Update favorite status whenever output or favorites list change
  React.useEffect(() => {
    const numValue = parseFloat(inputValue);
     if (isNaN(numValue) || !outputValue) {
      setIsFavorite(false);
      return
    };

    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getCurrentConversionString(numValue, fromUnit, toUnit, result);
    setIsFavorite(favorites.includes(conversionString));
  }, [inputValue, fromUnit, toUnit, outputValue, favorites]);

  const handleSaveToHistory = () => {
    const numValue = parseFloat(inputValue);
    const result = parseFloat(outputValue.replace(/,/g, ''));
    if (isNaN(numValue) || isNaN(result)) return;

    const conversionString = getCurrentConversionString(numValue, fromUnit, toUnit, result);
    
    if (!history.includes(conversionString)) {
      incrementTodaysCalculations();
      const newHistory = [conversionString, ...history.filter(item => item !== conversionString)];
      setHistory(newHistory);
      localStorage.setItem("conversionHistory", JSON.stringify(newHistory));
    }
  };
  
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
                 toast({ title: "Invalid Search", description: "The search query could not be understood.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Search conversion failed:", error);
            toast({ title: "Invalid Search", description: "The search query could not be understood.", variant: "destructive" });
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
    // The conversion will be re-triggered by the useEffect hook
  };

  const handleConvertClick = () => {
    // Save to history on manual convert click
    handleSaveToHistory();
  };
  
  const handleToggleFavorite = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !outputValue) return;

    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getCurrentConversionString(numValue, fromUnit, toUnit, result);

    let newFavorites: string[];
    if (favorites.includes(conversionString)) {
      newFavorites = favorites.filter(fav => fav !== conversionString);
      toast({ title: "Removed from favorites." });
    } else {
      // Ensure it's in history before adding to favorites
      handleSaveToHistory(); 
      newFavorites = [conversionString, ...favorites];
      toast({ title: "Added to favorites!" });
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
        toast({ title: "Cannot restore", description: `One of the units may belong to a different region. Current region: ${region}.`, variant: "destructive"});
      }
    } else {
        toast({ title: "Cannot restore", description: "Could not determine the conversion category.", variant: "destructive"});
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
      toast({ title: "Nothing to share", description: "Please perform a conversion first.", variant: "destructive" });
      return;
    }
    const result = parseFloat(outputValue.replace(/,/g, ''));
    const conversionString = getCurrentConversionString(numValue, fromUnit, toUnit, result);

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Unit Conversion',
          text: conversionString,
        });
      } catch (error) {
        console.error('Error sharing:', error);
        toast({ title: "Share failed", description: "Could not share the conversion.", variant: "destructive" });
      }
    } else {
      toast({ title: "Not supported", description: "Web Share API is not supported in your browser.", variant: "destructive" });
    }
  };

  const handleExportAsTxt = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || !outputValue) {
      toast({ title: "Nothing to export", description: "Please perform a conversion first.", variant: "destructive" });
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
    toast({ title: "Exported as TXT!" });
  };
  
  const handleExportAsImage = async () => {
    const numValue = parseFloat(inputValue);
     if (isNaN(numValue) || !outputValue || !imageExportRef.current) {
        toast({ title: "Nothing to export", description: "Please perform a conversion first.", variant: "destructive" });
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
        toast({ title: "Exported as Image!" });
    } catch (error) {
        console.error('Error exporting as image:', error);
        toast({ title: "Export failed", description: "Could not export the conversion as an image.", variant: "destructive" });
    }
  };


  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4 text-white">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hi, Aman</h1>
          <p className="text-muted-foreground">Welcome to the Converter</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Search /></Button>
            <Button variant="ghost" size="icon"><Bell /></Button>
            <Button variant="ghost" size="icon" asChild>
              <Link href="/profile">
                <User />
              </Link>
            </Button>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-4 text-center">
        <Link href="/" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <Home />
            <span className="text-xs font-medium">Dashboard</span>
        </Link>
         <Link href="/notes" className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <StickyNote />
            <span className="text-xs font-medium">Notes</span>
        </Link>
        <Link href="/converter" className="flex flex-col items-center gap-2 p-2 rounded-lg bg-accent/20 border-accent border text-accent">
            <CalculatorIcon />
            <span className="text-xs font-medium">Converter</span>
        </Link>
         <div className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-card">
            <Settings />
            <span className="text-xs font-medium">Setting</span>
        </div>
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
            />
        )}
       </div>


      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Unit">Converter</TabsTrigger>
          <TabsTrigger value="Calculator">Calculator</TabsTrigger>
        </TabsList>
        <TabsContent value="Unit">
          <div className="relative mt-4">
            <Input
              type="text"
              placeholder="Search e.g., '10 km to m'"
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
              <h2 className="font-bold text-lg">Quick Convert</h2>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/history">
                  <Clock />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm text-muted-foreground flex items-center gap-1.5"><Globe size={16}/> Region</label>
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
                    <label className="text-sm text-muted-foreground flex items-center gap-1.5"><LayoutGrid size={16}/> Category</label>
                     <Select value={selectedCategory.name} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="bg-background mt-1">
                             <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {conversionCategories.map(cat => (
                                <SelectItem key={cat.name} value={cat.name}>
                                    <div className="flex items-center gap-2">
                                        <cat.icon className="w-4 h-4" />
                                        <span>{cat.name}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
    
            <div>
                <label className="text-sm text-muted-foreground">From</label>
                <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="bg-background mt-1 h-12 text-lg"
                    placeholder="Enter Value"
                  />
            </div>
            
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <UnitSelect units={currentUnits} value={fromUnit} onValueChange={setFromUnit} />
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 bg-accent text-accent-foreground hover:bg-accent/90" onClick={handleSwapUnits}>
                    <ArrowRightLeft className="w-5 h-5" />
                </Button>
                <UnitSelect units={currentUnits} value={toUnit} onValueChange={setToUnit} />
            </div>
    
            <div className="grid grid-cols-2 gap-2 text-xs">
                {fromUnitInfo && <InfoBox text={fromUnitInfo} />}
                {toUnitInfo && <InfoBox text={toUnitInfo} />}
            </div>
            
            <div className="bg-background rounded-lg p-4 flex justify-between items-center h-16">
                <span className={`text-lg ${!outputValue ? 'text-muted-foreground' : ''}`}>{outputValue || "Result will appear here !"}</span>
                {outputValue && (
                     <div className="flex items-center gap-3">
                        <Copy size={20} className="text-muted-foreground cursor-pointer hover:text-white" onClick={() => {
                            navigator.clipboard.writeText(outputValue)
                            toast({ title: "Copied to clipboard!"})
                            }} />
                        <Star 
                          size={20} 
                          className={`cursor-pointer transition-colors ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground hover:text-white'}`}
                          onClick={handleToggleFavorite}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Share2 size={20} className="text-muted-foreground cursor-pointer hover:text-white" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={handleExportAsImage}>
                                    <ImageIcon className="mr-2 h-4 w-4" />
                                    <span>Export as Image</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={() => toast({title: "Export not available yet"})}>
                                    <FileIcon className="mr-2 h-4 w-4" />
                                    <span>Export as PDF</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={handleExportAsTxt}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    <span>Export as TXT</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={handleShare}>
                                    <Share2 className="mr-2 h-4 w-4" />
                                    <span>Share it</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                     </div>
                )}
            </div>
            
            <Button onClick={handleConvertClick} className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12 text-base font-bold">convert</Button>
          </div>
    
          {history.length > 0 && (
              <div className="bg-card p-4 rounded-xl flex flex-col gap-3 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Clock size={20} /> Recent Conversions</h3>
                    <RefreshCw size={18} className="text-muted-foreground cursor-pointer hover:text-white" onClick={handleClearHistory}/>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      {history.slice(0, 3).map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 rounded hover:bg-background group">
                             <div className="flex items-center gap-2">
                               {favorites.includes(item) && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                               <span>{item}</span>
                             </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <RotateCcw size={16} className="cursor-pointer hover:text-white" onClick={() => handleRestoreHistory(item)} />
                                <Trash2 size={16} className="cursor-pointer hover:text-white" onClick={() => handleDeleteHistory(index)} />
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

function UnitSelect({ units, value, onValueChange }: { units: Unit[], value: string, onValueChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="bg-background h-12 text-base">
        <SelectValue placeholder="Unit" />
      </SelectTrigger>
      <SelectContent>
        {units.map(unit => (
          <SelectItem key={unit.symbol} value={unit.symbol}>
            {`${unit.name} (${unit.symbol})`}
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
}

const ConversionImage = React.forwardRef<HTMLDivElement, ConversionImageProps>(
  ({ category, fromUnit, toUnit, inputValue, outputValue }, ref) => {
    const fromUnitInfo = category.units.find(u => u.symbol === fromUnit);
    const toUnitInfo = category.units.find(u => u.symbol === toUnit);

    return (
      <div
        ref={ref}
        className="w-[350px] bg-[#0A102A] border border-indigo-400/50 text-white font-sans p-6 flex flex-col gap-4 rounded-xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-full">
            <category.icon className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold">{category.name} Conversion</h2>
        </div>
        <div className="flex flex-col gap-2 text-center">
            <p className="text-xl text-muted-foreground">{fromUnitInfo?.name}</p>
            <p className="text-5xl font-bold">{inputValue}</p>
            <p className="text-lg text-muted-foreground">{fromUnitInfo?.symbol}</p>
        </div>
        <div className="flex justify-center">
            <ArrowRightLeft className="w-8 h-8 text-accent" />
        </div>
         <div className="flex flex-col gap-2 text-center">
            <p className="text-xl text-muted-foreground">{toUnitInfo?.name}</p>
            <p className="text-5xl font-bold">{outputValue}</p>
            <p className="text-lg text-muted-foreground">{toUnitInfo?.symbol}</p>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
            Generated by UniConvert
        </p>
      </div>
    );
  }
);
ConversionImage.displayName = 'ConversionImage';
